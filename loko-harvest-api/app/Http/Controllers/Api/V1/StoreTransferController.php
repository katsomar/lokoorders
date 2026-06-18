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
        $transfers = StoreTransfer::with(['product', 'user', 'productionStore', 'salesStore'])
            ->when($request->production_store_id, fn($q) => $q->where('production_store_id', $request->production_store_id))
            ->when($request->product_id, fn($q) => $q->where('product_id', $request->product_id))
            ->when($request->start_date, fn($q) => $q->whereDate('transfer_date', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('transfer_date', '<=', $request->end_date))
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
            'batch_reference' => 'nullable|string',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $product = \App\Models\Product::findOrFail($validated['product_id']);
        $supportsBatch = $this->productSupportsBatch($product);
        $batchRef = $supportsBatch ? ($validated['batch_reference'] ?? null) : null;

        return DB::transaction(function () use ($validated, $product, $supportsBatch, $batchRef) {
            $fromStoreId = $validated['production_store_id'];
            $toStoreId = $validated['sales_store_id'];
            $productId = $validated['product_id'];
            $qty = $validated['quantity'];

            // 1. Check production stock for this specific store
            if ($supportsBatch && $batchRef) {
                // Check specific batch stock
                $productionStock = ProductionStoreStock::where('production_store_id', $fromStoreId)
                    ->where('product_id', $productId)
                    ->where('batch_reference', $batchRef)
                    ->first();

                $availableQty = $productionStock ? (float) $productionStock->current_quantity : 0.0;
                if ($availableQty < $qty) {
                    return $this->error('Insufficient stock in the specified batch at the production store', 422, [
                        'available' => $availableQty
                    ]);
                }
            } else {
                // Check total stock (if FIFO or unbatched)
                $totalQuantity = ProductionStoreStock::where('production_store_id', $fromStoreId)
                    ->where('product_id', $productId)
                    ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                    ->sum('current_quantity');
                
                if ($totalQuantity < $qty) {
                    return $this->error('Insufficient production store stock at the specified store', 422, [
                        'available' => $totalQuantity
                    ]);
                }
            }

            // 2. Resolve transfer unit price (production valuation rate)
            $firstStock = ProductionStoreStock::where('production_store_id', $fromStoreId)
                ->where('product_id', $productId)
                ->when($supportsBatch && $batchRef, fn($q) => $q->where('batch_reference', $batchRef))
                ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                ->where('current_quantity', '>', 0)
                ->orderBy('created_at', 'asc')
                ->first();

            $transferPrice = $firstStock && $firstStock->valuation_price ? $firstStock->valuation_price : ($product->production_unit_price ?? $product->default_unit_price);

            // 3. Debit production stock and credit sales stock
            if ($supportsBatch && $batchRef) {
                // Move specific batch
                $productionStock->decrement('current_quantity', $qty);
                $productionStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

                // Create transfer record
                $transfer = StoreTransfer::create([
                    'transfer_date' => $validated['transfer_date'],
                    'production_store_id' => $fromStoreId,
                    'sales_store_id' => $toStoreId,
                    'product_id' => $productId,
                    'quantity' => $qty,
                    'unit_price' => $transferPrice,
                    'batch_reference' => $batchRef,
                    'transferred_by' => auth()->id(),
                    'notes' => $validated['notes'],
                ]);

                // Credit sales stock
                $salesStock = SalesStoreStock::firstOrCreate(
                    [
                        'sales_store_id' => $toStoreId,
                        'product_id' => $productId,
                        'batch_reference' => $batchRef
                    ],
                    ['current_quantity' => 0, 'updated_by' => auth()->id()]
                );
                $salesStock->increment('current_quantity', $qty);
                $salesStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

                // Log movement in sales store
                SalesStoreMovement::create([
                    'movement_date' => $validated['transfer_date'],
                    'sales_store_id' => $toStoreId,
                    'product_id' => $productId,
                    'batch_reference' => $batchRef,
                    'movement_type' => 'transfer_in',
                    'quantity' => $qty,
                    'reference_id' => $transfer->id,
                    'created_by' => auth()->id(),
                ]);

                return $this->success($transfer, 'Stock transferred successfully', 201);
            } else {
                // FIFO Debit across batches (or unbatched transfer)
                $remainingToDebit = $qty;
                $stocks = ProductionStoreStock::where('production_store_id', $fromStoreId)
                    ->where('product_id', $productId)
                    ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                    ->where('current_quantity', '>', 0)
                    ->orderBy('created_at', 'asc')
                    ->get();

                $transfers = [];

                foreach ($stocks as $stock) {
                    if ($remainingToDebit <= 0) break;

                    $debitAmount = min($stock->current_quantity, $remainingToDebit);
                    $stock->decrement('current_quantity', $debitAmount);
                    $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
                    
                    $currentBatch = $stock->batch_reference; // null for unbatched

                    // Create transfer record segment
                    $transfer = StoreTransfer::create([
                        'transfer_date' => $validated['transfer_date'],
                        'production_store_id' => $fromStoreId,
                        'sales_store_id' => $toStoreId,
                        'product_id' => $productId,
                        'quantity' => $debitAmount,
                        'unit_price' => $stock->valuation_price ?: $transferPrice,
                        'batch_reference' => $currentBatch,
                        'transferred_by' => auth()->id(),
                        'notes' => ($validated['notes'] ?? '') . ($currentBatch ? " (FIFO Split from batch: {$currentBatch})" : ""),
                    ]);

                    // Credit sales stock
                    $salesStock = SalesStoreStock::firstOrCreate(
                        [
                            'sales_store_id' => $toStoreId,
                            'product_id' => $productId,
                            'batch_reference' => $currentBatch
                        ],
                        ['current_quantity' => 0, 'updated_by' => auth()->id()]
                    );
                    $salesStock->increment('current_quantity', $debitAmount);
                    $salesStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

                    // Log movement in sales store
                    SalesStoreMovement::create([
                        'movement_date' => $validated['transfer_date'],
                        'sales_store_id' => $toStoreId,
                        'product_id' => $productId,
                        'batch_reference' => $currentBatch,
                        'movement_type' => 'transfer_in',
                        'quantity' => $debitAmount,
                        'reference_id' => $transfer->id,
                        'created_by' => auth()->id(),
                    ]);

                    $transfers[] = $transfer;
                    $remainingToDebit -= $debitAmount;
                }

                return $this->success($transfers, 'Stock transferred successfully via FIFO', 201);
            }
        });
    }

    private function productSupportsBatch($product)
    {
        // Eggs: category = 'eggs'
        // Poultry: category = 'poultry' (except POU-LVE)
        if ($product->category === 'eggs') {
            return true;
        }
        if ($product->category === 'poultry' && $product->code !== 'POU-LVE') {
            return true;
        }
        return false;
    }
}
