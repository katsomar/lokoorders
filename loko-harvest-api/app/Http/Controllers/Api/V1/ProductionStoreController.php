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
            'name' => 'required|string|min:3|max:100',
            'code' => 'required|string|min:3|max:10|regex:/^[A-Za-z0-9\-]+$/|unique:production_stores,code',
            'location' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $store = ProductionStore::create([
            'name' => trim($validated['name']),
            'code' => strtoupper(trim($validated['code'])),
            'location' => isset($validated['location']) ? trim($validated['location']) : null,
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
            'name' => 'required|string|min:3|max:100',
            'code' => 'required|string|min:3|max:10|regex:/^[A-Za-z0-9\-]+$/|unique:production_stores,code,' . $store->id,
            'location' => 'nullable|string|max:255',
            'is_active' => 'required|boolean',
        ]);

        $store->update([
            'name' => trim($validated['name']),
            'code' => strtoupper(trim($validated['code'])),
            'location' => isset($validated['location']) ? trim($validated['location']) : null,
            'is_active' => $validated['is_active'],
        ]);

        return $this->success($store, 'Production store updated successfully');
    }

    public function destroy($id)
    {
        $store = ProductionStore::findOrFail($id);
        $store->delete();
        return $this->success(null, 'Production store deleted successfully');
    }
}
