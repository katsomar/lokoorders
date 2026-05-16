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
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            // 1. Check production stock
            $prodStock = ProductionStoreStock::where('product_id', $validated['product_id'])->first();
            
            if (!$prodStock || $prodStock->current_quantity < $validated['quantity']) {
                return $this->error('Insufficient production store stock', 422, [
                    'available' => $prodStock->current_quantity ?? 0
                ]);
            }

            // 2. Create transfer record
            $transfer = StoreTransfer::create([
                'transfer_date' => $validated['transfer_date'],
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'transferred_by' => auth()->id(),
                'notes' => $validated['notes'],
            ]);

            // 3. Debit production stock
            $prodStock->decrement('current_quantity', $validated['quantity']);
            $prodStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

            // 4. Credit sales stock
            $salesStock = SalesStoreStock::firstOrCreate(
                ['product_id' => $validated['product_id']],
                ['current_quantity' => 0, 'updated_by' => auth()->id()]
            );
            $salesStock->increment('current_quantity', $validated['quantity']);
            $salesStock->update(['updated_by' => auth()->id(), 'last_updated' => now()]);

            // 5. Log movement in sales store
            SalesStoreMovement::create([
                'movement_date' => $validated['transfer_date'],
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
