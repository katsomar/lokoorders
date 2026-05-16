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
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'intake_date' => 'required|date',
            'batch_number' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $intake = ProductionStoreIntake::create([
                'intake_date' => $validated['intake_date'],
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'batch_number' => $validated['batch_number'],
                'notes' => $validated['notes'],
                'recorded_by' => auth()->id(),
            ]);

            // Update Production Store Stock
            $stock = ProductionStoreStock::firstOrCreate(
                ['product_id' => $validated['product_id']],
                ['current_quantity' => 0, 'updated_by' => auth()->id()]
            );

            $stock->increment('current_quantity', $validated['quantity']);
            $stock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

            return $this->success($intake->load('product'), 'Intake recorded successfully', 201);
        });
    }
}
