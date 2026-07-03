<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SalesStoreConversion;
use App\Models\SalesStoreStock;
use App\Models\SalesStoreMovement;
use App\Models\Product;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesStoreConversionController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $conversions = SalesStoreConversion::with(['salesStore', 'fromProduct', 'toProduct', 'user'])
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($conversions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sales_store_id' => 'required|exists:sales_stores,id',
            'from_product_id' => 'required|exists:products,id',
            'to_product_id' => 'required|exists:products,id|different:from_product_id',
            'from_quantity' => 'required|numeric|min:0.01',
            'batch_reference' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $storeId = $validated['sales_store_id'];
            $fromId = $validated['from_product_id'];
            $toId = $validated['to_product_id'];
            $fromQty = $validated['from_quantity'];

            $fromProduct = Product::findOrFail($fromId);
            $toProduct = Product::findOrFail($toId);

            // 1. Validate matching egg category (Cream with Cream, White with White, etc.)
            $fromPrefix = substr($fromProduct->code, 0, 7); // e.g. EGG-CRM, EGG-WHT, EGG-BRN
            $toPrefix = substr($toProduct->code, 0, 7);

            if ($fromPrefix !== $toPrefix) {
                return $this->error('Cannot convert between different egg categories. Source and destination must belong to the same category (Cream, White, or Brown).', 422);
            }

            // 2. Validate conversion ratio
            $ratio = 1.0; // Default ratio (e.g. Single Pack / Plain Trays)
            if (str_ends_with($toProduct->code, '-15P')) {
                $ratio = 2.0; // 1 tray of 30 eggs yields 2 packs of 15 eggs
            } elseif (str_ends_with($toProduct->code, '-06P')) {
                $ratio = 5.0; // 1 tray of 30 eggs yields 5 packs of 6 eggs
            } elseif (str_ends_with($toProduct->code, '-FAM')) {
                $ratio = 0.2; // 5 trays yield 1 family pack
            } elseif (str_ends_with($toProduct->code, '-DBL')) {
                $ratio = 0.5; // 2 trays yield 1 double pack
            } elseif (str_ends_with($toProduct->code, '-TPL')) {
                $ratio = 1.0 / 3.0; // 3 trays yield 1 triple pack
            } elseif ($toProduct->code === 'EGG-CRM-SGL') {
                $ratio = 0.5; // 2 trays yield 1 single pack
            }

            $toQty = $fromQty * $ratio;

            $supportsBatch = $this->productSupportsBatch($fromProduct);
            $batchRef = $supportsBatch ? ($validated['batch_reference'] ?? null) : null;

            if ($supportsBatch && $batchRef) {
                // 3. Verify source stock is available for specific batch
                $sourceStock = SalesStoreStock::where('sales_store_id', $storeId)
                    ->where('product_id', $fromId)
                    ->where('batch_reference', $batchRef)
                    ->first();

                if (!$sourceStock || $sourceStock->current_quantity < $fromQty) {
                    return $this->error('Insufficient bulk trays for the selected batch in the sales store.', 422, [
                        'available' => $sourceStock ? $sourceStock->current_quantity : 0
                    ]);
                }

                // 4. Debit source stock
                $sourceStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
                $sourceStock->updateStock('conversion_out', $fromQty, $fromProduct->sales_unit_price ?? $fromProduct->default_unit_price);

                // 5. Credit destination stock
                $destStock = SalesStoreStock::firstOrCreate(
                    [
                        'sales_store_id' => $storeId,
                        'product_id' => $toId,
                        'batch_reference' => $batchRef,
                    ],
                    [
                        'current_quantity' => 0,
                        'updated_by' => auth()->id(),
                    ]
                );
                $destStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
                $destStock->updateStock('conversion_in', $toQty, $toProduct->sales_unit_price ?? $toProduct->default_unit_price);

                // 6. Record conversion log
                $conversion = SalesStoreConversion::create([
                    'conversion_date' => now()->toDateString(),
                    'sales_store_id' => $storeId,
                    'from_product_id' => $fromId,
                    'to_product_id' => $toId,
                    'from_quantity' => $fromQty,
                    'to_quantity' => $toQty,
                    'batch_reference' => $batchRef,
                    'converted_by' => auth()->id(),
                    'notes' => $validated['notes'] ?? null,
                ]);

                // 7. Log movements
                // Debit movement (source bulk product)
                SalesStoreMovement::create([
                    'movement_date' => now()->toDateString(),
                    'sales_store_id' => $storeId,
                    'product_id' => $fromId,
                    'batch_reference' => $batchRef,
                    'movement_type' => 'dispatch_out',
                    'quantity' => $fromQty,
                    'reference_id' => $conversion->id,
                    'created_by' => auth()->id(),
                    'notes' => "Converted " . $fromQty . " bulk trays into packaged units (Batch: {$batchRef})",
                ]);

                // Credit movement (destination packaged product)
                SalesStoreMovement::create([
                    'movement_date' => now()->toDateString(),
                    'sales_store_id' => $storeId,
                    'product_id' => $toId,
                    'batch_reference' => $batchRef,
                    'movement_type' => 'transfer_in',
                    'quantity' => $toQty,
                    'reference_id' => $conversion->id,
                    'created_by' => auth()->id(),
                    'notes' => "Obtained from bulk conversion (Batch: {$batchRef})",
                ]);

                return $this->success($conversion->load(['fromProduct', 'toProduct']), 'Conversion completed successfully', 201);
            } else {
                // FIFO Debit across sales stock batches for conversion
                $remainingToDebit = $fromQty;
                
                // Retrieve all non-empty stocks of the source product
                $stocks = SalesStoreStock::where('sales_store_id', $storeId)
                    ->where('product_id', $fromId)
                    ->when($supportsBatch === false, fn($q) => $q->whereNull('batch_reference'))
                    ->where('current_quantity', '>', 0)
                    ->orderBy('created_at', 'asc')
                    ->get();

                // Check total available stock across all batches
                $totalAvailable = $stocks->sum('current_quantity');
                if ($totalAvailable < $fromQty) {
                    return $this->error('Insufficient bulk trays in the selected sales store.', 422, [
                        'available' => $totalAvailable
                    ]);
                }

                // Record main conversion log
                $conversion = SalesStoreConversion::create([
                    'conversion_date' => now()->toDateString(),
                    'sales_store_id' => $storeId,
                    'from_product_id' => $fromId,
                    'to_product_id' => $toId,
                    'from_quantity' => $fromQty,
                    'to_quantity' => $toQty,
                    'batch_reference' => null, // Multi-batch FIFO conversion
                    'converted_by' => auth()->id(),
                    'notes' => $validated['notes'] ?? null,
                ]);

                foreach ($stocks as $stock) {
                    if ($remainingToDebit <= 0) break;

                    $debitAmount = min($stock->current_quantity, $remainingToDebit);
                    $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
                    $stock->updateStock('conversion_out', $debitAmount, $fromProduct->sales_unit_price ?? $fromProduct->default_unit_price);

                    $currentBatch = $stock->batch_reference;
                    $destSegmentQty = $debitAmount * $ratio;

                    // Credit destination stock for this batch segment
                    $destStock = SalesStoreStock::firstOrCreate(
                        [
                            'sales_store_id' => $storeId,
                            'product_id' => $toId,
                            'batch_reference' => $currentBatch,
                        ],
                        [
                            'current_quantity' => 0,
                            'updated_by' => auth()->id(),
                        ]
                    );
                    $destStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);
                    $destStock->updateStock('conversion_in', $destSegmentQty, $toProduct->sales_unit_price ?? $toProduct->default_unit_price);

                    // Log movements for this batch segment
                    SalesStoreMovement::create([
                        'movement_date' => now()->toDateString(),
                        'sales_store_id' => $storeId,
                        'product_id' => $fromId,
                        'batch_reference' => $currentBatch,
                        'movement_type' => 'dispatch_out',
                        'quantity' => $debitAmount,
                        'reference_id' => $conversion->id,
                        'created_by' => auth()->id(),
                        'notes' => "Converted " . $debitAmount . " bulk trays into packaged units" . ($currentBatch ? " (FIFO Batch: {$currentBatch})" : ""),
                    ]);

                    SalesStoreMovement::create([
                        'movement_date' => now()->toDateString(),
                        'sales_store_id' => $storeId,
                        'product_id' => $toId,
                        'batch_reference' => $currentBatch,
                        'movement_type' => 'transfer_in',
                        'quantity' => $destSegmentQty,
                        'reference_id' => $conversion->id,
                        'created_by' => auth()->id(),
                        'notes' => "Obtained from bulk conversion" . ($currentBatch ? " (FIFO Batch: {$currentBatch})" : ""),
                    ]);

                    $remainingToDebit -= $debitAmount;
                }

                return $this->success($conversion->load(['fromProduct', 'toProduct']), 'Conversion completed successfully via FIFO', 201);
            }
        });
    }

    private function productSupportsBatch($product)
    {
        if ($product->category === 'eggs') {
            return true;
        }
        if ($product->category === 'poultry' && $product->code !== 'POU-LVE') {
            return true;
        }
        return false;
    }
}
