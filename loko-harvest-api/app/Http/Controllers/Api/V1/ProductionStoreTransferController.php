<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ProductionStoreTransfer;
use App\Models\ProductionStoreStock;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductionStoreTransferController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $transfers = ProductionStoreTransfer::with(['product', 'fromStore', 'toStore', 'user'])
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($transfers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'from_production_store_id' => 'required|exists:production_stores,id',
            'to_production_store_id' => 'required|exists:production_stores,id|different:from_production_store_id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'batch_reference' => 'nullable|string',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $fromStoreId = $validated['from_production_store_id'];
            $toStoreId = $validated['to_production_store_id'];
            $productId = $validated['product_id'];
            $qty = $validated['quantity'];
            $batch = $validated['batch_reference'] ?? null;

            // 1. Verify and debit stock
            if ($batch) {
                // Transfer specific batch
                $stock = ProductionStoreStock::where('production_store_id', $fromStoreId)
                    ->where('product_id', $productId)
                    ->where('batch_reference', $batch)
                    ->first();

                if (!$stock || $stock->current_quantity < $qty) {
                    return $this->error('Insufficient stock in the specified batch at the source store.', 422, [
                        'available' => $stock ? $stock->current_quantity : 0
                    ]);
                }

                // Debit source
                $stock->decrement('current_quantity', $qty);
                $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

                // Credit destination
                $destStock = ProductionStoreStock::firstOrCreate(
                    [
                        'production_store_id' => $toStoreId,
                        'product_id' => $productId,
                        'batch_reference' => $batch,
                    ],
                    [
                        'current_quantity' => 0,
                        'valuation_price' => $stock->valuation_price,
                        'updated_by' => auth()->id(),
                    ]
                );
                $destStock->increment('current_quantity', $qty);
                $destStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

                // Record log
                $transfer = ProductionStoreTransfer::create([
                    'transfer_date' => $validated['transfer_date'],
                    'product_id' => $productId,
                    'from_production_store_id' => $fromStoreId,
                    'to_production_store_id' => $toStoreId,
                    'quantity' => $qty,
                    'batch_reference' => $batch,
                    'transferred_by' => auth()->id(),
                    'notes' => $validated['notes'] ?? null,
                ]);

                return $this->success($transfer, 'Stock transferred successfully', 201);
            } else {
                // FIFO Transfer across batches in fromStore
                $totalAvailable = ProductionStoreStock::where('production_store_id', $fromStoreId)
                    ->where('product_id', $productId)
                    ->sum('current_quantity');

                if ($totalAvailable < $qty) {
                    return $this->error('Insufficient overall stock at the source store.', 422, [
                        'available' => $totalAvailable
                    ]);
                }

                $stocks = ProductionStoreStock::where('production_store_id', $fromStoreId)
                    ->where('product_id', $productId)
                    ->where('current_quantity', '>', 0)
                    ->orderBy('created_at', 'asc')
                    ->get();

                $remainingToDebit = $qty;
                $transfers = [];

                foreach ($stocks as $stock) {
                    if ($remainingToDebit <= 0) break;

                    $debitAmount = min($stock->current_quantity, $remainingToDebit);
                    $stock->decrement('current_quantity', $debitAmount);
                    $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

                    // Credit destination
                    $destStock = ProductionStoreStock::firstOrCreate(
                        [
                            'production_store_id' => $toStoreId,
                            'product_id' => $productId,
                            'batch_reference' => $stock->batch_reference,
                        ],
                        [
                            'current_quantity' => 0,
                            'valuation_price' => $stock->valuation_price,
                            'updated_by' => auth()->id(),
                        ]
                    );
                    $destStock->increment('current_quantity', $debitAmount);
                    $destStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

                    // Record log for this batch segment
                    $transfer = ProductionStoreTransfer::create([
                        'transfer_date' => $validated['transfer_date'],
                        'product_id' => $productId,
                        'from_production_store_id' => $fromStoreId,
                        'to_production_store_id' => $toStoreId,
                        'quantity' => $debitAmount,
                        'batch_reference' => $stock->batch_reference,
                        'transferred_by' => auth()->id(),
                        'notes' => ($validated['notes'] ?? '') . " (FIFO Split from batch: " . ($stock->batch_reference ?? 'N/A') . ")",
                    ]);

                    $transfers[] = $transfer;
                    $remainingToDebit -= $debitAmount;
                }

                return $this->success($transfers, 'FIFO Stock transferred successfully across ' . count($transfers) . ' batches', 201);
            }
        });
    }
}
