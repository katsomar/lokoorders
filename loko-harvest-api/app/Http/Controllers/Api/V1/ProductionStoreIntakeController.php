<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ProductionStoreIntake;
use App\Models\ProductionStoreStock;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductionStoreIntakeController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $intakes = ProductionStoreIntake::with(['product', 'user'])
            ->when($request->product_id, fn($q) => $q->where('product_id', $request->product_id))
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($intakes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'production_store_id' => 'required|exists:production_stores,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'intake_date' => 'required|date',
            'valuation_price' => 'required|numeric|min:0',
            'batch_number' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $product = \App\Models\Product::findOrFail($validated['product_id']);

            $intake = ProductionStoreIntake::create([
                'intake_date' => $validated['intake_date'],
                'production_store_id' => $validated['production_store_id'],
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'valuation_price' => $validated['valuation_price'],
                'unit_of_measure' => $product->unit_of_measure,
                'batch_reference' => $validated['batch_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'received_by' => auth()->id(),
            ]);

            // Update Production Store Stock
            $stock = ProductionStoreStock::firstOrCreate(
                [
                    'production_store_id' => $validated['production_store_id'],
                    'product_id' => $validated['product_id'],
                    'batch_reference' => $validated['batch_number'] ?? null
                ],
                ['current_quantity' => 0, 'updated_by' => auth()->id(), 'valuation_price' => $validated['valuation_price']]
            );

            $stock->increment('current_quantity', $validated['quantity']);
            $stock->update([
                'valuation_price' => $validated['valuation_price'],
                'updated_by' => auth()->id(),
                'last_updated' => now()
            ]);

            return $this->success($intake->load('product'), 'Intake recorded successfully', 201);
        });
    }
}
