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
        $transfers = SalesStoreTransfer::with(['product', 'fromStore', 'toStore', 'user'])
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($transfers);
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
