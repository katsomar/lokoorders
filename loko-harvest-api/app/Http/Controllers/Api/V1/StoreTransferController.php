<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\StoreTransfer;
use App\Models\ProductionStoreStock;
use App\Models\SalesStoreStock;
use App\Models\SalesStoreMovement;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StoreTransferController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $transfers = StoreTransfer::with(['product', 'user'])
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($transfers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'production_store_id' => 'required|exists:production_stores,id',
            'sales_store_id' => 'required|exists:sales_stores,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            // 1. Check production stock for this specific store
            $totalQuantity = ProductionStoreStock::where('production_store_id', $validated['production_store_id'])
                ->where('product_id', $validated['product_id'])
                ->sum('current_quantity');
            
            if ($totalQuantity < $validated['quantity']) {
                return $this->error('Insufficient production store stock at the specified store', 422, [
                    'available' => $totalQuantity
                ]);
            }

            // 2. Create transfer record
            $transfer = StoreTransfer::create([
                'transfer_date' => $validated['transfer_date'],
                'production_store_id' => $validated['production_store_id'],
                'sales_store_id' => $validated['sales_store_id'],
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'transferred_by' => auth()->id(),
                'notes' => $validated['notes'],
            ]);

            // 3. Debit production stock using FIFO (First In First Out) from specified store
            $remainingToDebit = $validated['quantity'];
            $stocks = ProductionStoreStock::where('production_store_id', $validated['production_store_id'])
                ->where('product_id', $validated['product_id'])
                ->where('current_quantity', '>', 0)
                ->orderBy('created_at', 'asc')
                ->get();

            foreach ($stocks as $stock) {
                if ($remainingToDebit <= 0) break;

                $debitAmount = min($stock->current_quantity, $remainingToDebit);
                $stock->decrement('current_quantity', $debitAmount);
                $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
                
                $remainingToDebit -= $debitAmount;
            }

            // 4. Credit sales stock of specified sales store
            $salesStock = SalesStoreStock::firstOrCreate(
                [
                    'sales_store_id' => $validated['sales_store_id'],
                    'product_id' => $validated['product_id']
                ],
                ['current_quantity' => 0, 'updated_by' => auth()->id()]
            );
            $salesStock->increment('current_quantity', $validated['quantity']);
            $salesStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

            // 5. Log movement in sales store
            SalesStoreMovement::create([
                'movement_date' => $validated['transfer_date'],
                'sales_store_id' => $validated['sales_store_id'],
                'product_id' => $validated['product_id'],
                'movement_type' => 'transfer_in',
                'quantity' => $validated['quantity'],
                'reference_id' => $transfer->id,
                'created_by' => auth()->id(),
            ]);

            return $this->success($transfer, 'Stock transferred successfully', 201);
        });
    }
}
