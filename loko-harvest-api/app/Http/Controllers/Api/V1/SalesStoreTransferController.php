<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SalesStoreTransfer;
use App\Models\SalesStoreStock;
use App\Models\SalesStoreMovement;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesStoreTransferController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $query = SalesStoreTransfer::with(['product', 'fromStore', 'toStore', 'user'])
            ->when($request->from_sales_store_id, fn($q) => $q->where('from_sales_store_id', $request->from_sales_store_id))
            ->when($request->to_sales_store_id, fn($q) => $q->where('to_sales_store_id', $request->to_sales_store_id))
            ->when($request->product_id, fn($q) => $q->where('product_id', $request->product_id))
            ->when($request->start_date, fn($q) => $q->whereDate('transfer_date', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('transfer_date', '<=', $request->end_date));

        // Calculate aggregates on the database level
        $totalQty = (float)$query->sum('quantity');
        $totalVal = (float)DB::table('sales_store_transfers')
            ->join('products', 'sales_store_transfers.product_id', '=', 'products.id')
            ->when($request->from_sales_store_id, fn($q) => $q->where('from_sales_store_id', $request->from_sales_store_id))
            ->when($request->to_sales_store_id, fn($q) => $q->where('to_sales_store_id', $request->to_sales_store_id))
            ->when($request->product_id, fn($q) => $q->where('product_id', $request->product_id))
            ->when($request->start_date, fn($q) => $q->whereDate('transfer_date', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('transfer_date', '<=', $request->end_date))
            ->sum(DB::raw('sales_store_transfers.quantity * COALESCE(products.sales_unit_price, products.default_unit_price)'));

        $productValues = DB::table('sales_store_transfers')
            ->join('products', 'sales_store_transfers.product_id', '=', 'products.id')
            ->select('products.name', DB::raw('SUM(sales_store_transfers.quantity * COALESCE(products.sales_unit_price, products.default_unit_price)) as value'))
            ->when($request->from_sales_store_id, fn($q) => $q->where('from_sales_store_id', $request->from_sales_store_id))
            ->when($request->to_sales_store_id, fn($q) => $q->where('to_sales_store_id', $request->to_sales_store_id))
            ->when($request->product_id, fn($q) => $q->where('product_id', $request->product_id))
            ->when($request->start_date, fn($q) => $q->whereDate('transfer_date', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('transfer_date', '<=', $request->end_date))
            ->groupBy('products.name')
            ->pluck('value', 'products.name')
            ->toArray();

        foreach ($productValues as $k => $v) {
            $productValues[$k] = (float)$v;
        }

        $transfers = $query->latest()->paginate($request->per_page ?? 15);

        $response = $transfers->toArray();
        $response['aggregates'] = [
            'total_quantity' => $totalQty,
            'total_valuation' => $totalVal,
            'count' => $transfers->total(),
            'product_values' => $productValues
        ];

        return $this->success($response);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'from_sales_store_id' => 'required|exists:sales_stores,id',
            'to_sales_store_id' => 'required|exists:sales_stores,id|different:from_sales_store_id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $fromStoreId = $validated['from_sales_store_id'];
            $toStoreId = $validated['to_sales_store_id'];
            $productId = $validated['product_id'];
            $qty = $validated['quantity'];

            // 1. Check and debit source stock
            $sourceStock = SalesStoreStock::where('sales_store_id', $fromStoreId)
                ->where('product_id', $productId)
                ->first();

            if (!$sourceStock || $sourceStock->current_quantity < $qty) {
                return $this->error('Insufficient stock at the source sales store.', 422, [
                    'available' => $sourceStock ? $sourceStock->current_quantity : 0
                ]);
            }

            $sourceStock->decrement('current_quantity', $qty);
            $sourceStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

            // 2. Credit destination stock
            $destStock = SalesStoreStock::firstOrCreate(
                [
                    'sales_store_id' => $toStoreId,
                    'product_id' => $productId,
                ],
                [
                    'current_quantity' => 0,
                    'updated_by' => auth()->id(),
                ]
            );
            $destStock->increment('current_quantity', $qty);
            $destStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

            // 3. Record transfer log
            $transfer = SalesStoreTransfer::create([
                'transfer_date' => $validated['transfer_date'],
                'product_id' => $productId,
                'from_sales_store_id' => $fromStoreId,
                'to_sales_store_id' => $toStoreId,
                'quantity' => $qty,
                'transferred_by' => auth()->id(),
                'notes' => $validated['notes'] ?? null,
            ]);

            // 4. Log movements in movements table
            // Debit movement
            SalesStoreMovement::create([
                'movement_date' => $validated['transfer_date'],
                'sales_store_id' => $fromStoreId,
                'product_id' => $productId,
                'movement_type' => 'dispatch_out',
                'quantity' => $qty,
                'reference_id' => $transfer->id,
                'created_by' => auth()->id(),
                'notes' => "Transfer out to sales store " . $toStoreId,
            ]);

            // Credit movement
            SalesStoreMovement::create([
                'movement_date' => $validated['transfer_date'],
                'sales_store_id' => $toStoreId,
                'product_id' => $productId,
                'movement_type' => 'transfer_in',
                'quantity' => $qty,
                'reference_id' => $transfer->id,
                'created_by' => auth()->id(),
                'notes' => "Transfer in from sales store " . $fromStoreId,
            ]);

            return $this->success($transfer, 'Sales stock transferred successfully', 201);
        });
    }
}
