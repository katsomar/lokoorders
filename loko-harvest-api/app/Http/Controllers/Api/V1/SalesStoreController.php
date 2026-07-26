<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SalesStore;
use App\Models\SalesStoreStock;
use App\Models\SalesStoreMovement;
use App\Models\SalesStoreTransfer;
use App\Models\StoreTransfer;
use App\Models\Order;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesStoreController extends Controller
{
    use ApiResponses;

    public function index()
    {
        $stores = SalesStore::latest()->get();
        return $this->success($stores);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:3|max:100',
            'code' => 'required|string|min:3|max:10|regex:/^[A-Za-z0-9\-]+$/|unique:sales_stores,code',
            'location' => 'nullable|string|max:255',
            'is_active' => 'nullable|boolean',
        ]);

        $store = SalesStore::create([
            'name' => trim($validated['name']),
            'code' => strtoupper(trim($validated['code'])),
            'location' => isset($validated['location']) ? trim($validated['location']) : null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return $this->success($store, 'Sales store created successfully', 201);
    }

    public function show($id)
    {
        $store = SalesStore::find($id);
        if (!$store) {
            return $this->error('Sales store not found', 404);
        }
        return $this->success($store);
    }

    public function update(Request $request, $id)
    {
        $store = SalesStore::find($id);
        if (!$store) {
            return $this->error('Sales store not found', 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|min:3|max:100',
            'code' => 'required|string|min:3|max:10|regex:/^[A-Za-z0-9\-]+$/|unique:sales_stores,code,' . $store->id,
            'location' => 'nullable|string|max:255',
            'is_active' => 'required|boolean',
        ]);

        $store->update([
            'name' => trim($validated['name']),
            'code' => strtoupper(trim($validated['code'])),
            'location' => isset($validated['location']) ? trim($validated['location']) : null,
            'is_active' => $validated['is_active'],
        ]);

        return $this->success($store, 'Sales store updated successfully');
    }

    public function destroy($id)
    {
        $store = SalesStore::find($id);
        if (!$store) {
            return $this->error('Sales store not found or already deleted.', 404);
        }

        // Check if store has active orders attached to it
        $activeOrders = Order::where('sales_store_id', $store->id)
            ->whereIn('status', ['pending', 'processing', 'ready_for_dispatch', 'dispatched'])
            ->exists();

        if ($activeOrders) {
            return $this->error('Cannot delete store with active pending or dispatched orders.', 422);
        }

        return DB::transaction(function () use ($store) {
            SalesStoreStock::where('sales_store_id', $store->id)->delete();
            SalesStoreMovement::where('sales_store_id', $store->id)->delete();
            SalesStoreTransfer::where('from_sales_store_id', $store->id)
                ->orWhere('to_sales_store_id', $store->id)
                ->delete();
            StoreTransfer::where('sales_store_id', $store->id)->delete();

            $store->delete();

            return $this->success(null, 'Sales store deleted successfully');
        });
    }
}
