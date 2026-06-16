<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ProductionStore;
use App\Models\ProductionStoreStock;
use App\Models\ProductionStoreIntake;
use App\Models\ProductionStoreTransfer;
use App\Models\StoreTransfer;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class ProductionStoreController extends Controller
{
    use ApiResponses;

    public function index()
    {
        $stores = ProductionStore::latest()->get();
        return $this->success($stores);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:production_stores,code|max:50',
            'location' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $store = ProductionStore::create([
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'location' => $validated['location'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return $this->success($store, 'Production store created successfully', 201);
    }

    public function show($id)
    {
        $store = ProductionStore::findOrFail($id);
        return $this->success($store);
    }

    public function update(Request $request, $id)
    {
        $store = ProductionStore::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:production_stores,code,' . $store->id,
            'location' => 'nullable|string|max:255',
            'is_active' => 'required|boolean',
        ]);

        $store->update([
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'location' => $validated['location'] ?? null,
            'is_active' => $validated['is_active'],
        ]);

        return $this->success($store, 'Production store updated successfully');
    }

    public function destroy($id)
    {
        $store = ProductionStore::findOrFail($id);

        // Check if there is non-zero stock in the store
        $hasStock = ProductionStoreStock::where('production_store_id', $store->id)
            ->where('current_quantity', '>', 0)
            ->exists();

        if ($hasStock) {
            return $this->error('Cannot delete store because it currently contains active stock.', 422);
        }

        // Check if there is any historical intake, inter-store transfer, or sales transfer associated with this store
        $hasIntakes = ProductionStoreIntake::where('production_store_id', $store->id)->exists();
        $hasSalesTransfers = StoreTransfer::where('production_store_id', $store->id)->exists();
        $hasInterTransfers = ProductionStoreTransfer::where('from_production_store_id', $store->id)
            ->orWhere('to_production_store_id', $store->id)
            ->exists();

        if ($hasIntakes || $hasSalesTransfers || $hasInterTransfers) {
            return $this->error('Cannot delete store because it has historical transactions associated with it.', 422);
        }

        // Cascade delete any zero-stock records just in case
        ProductionStoreStock::where('production_store_id', $store->id)->delete();

        $store->delete();

        return $this->success(null, 'Production store deleted successfully');
    }
}
