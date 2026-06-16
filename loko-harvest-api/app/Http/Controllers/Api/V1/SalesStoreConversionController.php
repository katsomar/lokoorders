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
            $ratio = 1; // Default ratio (e.g. EGG-CRM-SGL, EGG-WHT-SGL, EGG-BRN-SGL, EGG-BRN-TRYS)
            if (str_ends_with($toProduct->code, '-15P')) {
                $ratio = 2; // 1 tray of 30 eggs yields 2 packs of 15 eggs
            } elseif (str_ends_with($toProduct->code, '-06P')) {
                $ratio = 5; // 1 tray of 30 eggs yields 5 packs of 6 eggs
            }

            $toQty = $fromQty * $ratio;

            // 3. Verify source stock is available
            $sourceStock = SalesStoreStock::where('sales_store_id', $storeId)
                ->where('product_id', $fromId)
                ->first();

            if (!$sourceStock || $sourceStock->current_quantity < $fromQty) {
                return $this->error('Insufficient bulk trays in the selected sales store.', 422, [
                    'available' => $sourceStock ? $sourceStock->current_quantity : 0
                ]);
            }

            // 4. Debit source stock
            $sourceStock->decrement('current_quantity', $fromQty);
            $sourceStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

            // 5. Credit destination stock
            $destStock = SalesStoreStock::firstOrCreate(
                [
                    'sales_store_id' => $storeId,
                    'product_id' => $toId,
                ],
                [
                    'current_quantity' => 0,
                    'updated_by' => auth()->id(),
                ]
            );
            $destStock->increment('current_quantity', $toQty);
            $destStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

            // 6. Record conversion log
            $conversion = SalesStoreConversion::create([
                'conversion_date' => now()->toDateString(),
                'sales_store_id' => $storeId,
                'from_product_id' => $fromId,
                'to_product_id' => $toId,
                'from_quantity' => $fromQty,
                'to_quantity' => $toQty,
                'converted_by' => auth()->id(),
                'notes' => $validated['notes'] ?? null,
            ]);

            // 7. Log movements
            // Debit movement (source bulk product)
            SalesStoreMovement::create([
                'movement_date' => now()->toDateString(),
                'sales_store_id' => $storeId,
                'product_id' => $fromId,
                'movement_type' => 'dispatch_out',
                'quantity' => $fromQty,
                'reference_id' => $conversion->id,
                'created_by' => auth()->id(),
                'notes' => "Converted " . $fromQty . " bulk trays into packaged units",
            ]);

            // Credit movement (destination packaged product)
            SalesStoreMovement::create([
                'movement_date' => now()->toDateString(),
                'sales_store_id' => $storeId,
                'product_id' => $toId,
                'movement_type' => 'transfer_in',
                'quantity' => $toQty,
                'reference_id' => $conversion->id,
                'created_by' => auth()->id(),
                'notes' => "Obtained from bulk conversion",
            ]);

            return $this->success($conversion->load(['fromProduct', 'toProduct']), 'Conversion completed successfully', 201);
        });
    }
}
