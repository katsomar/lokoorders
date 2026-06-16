<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ProductionStoreStock;
use App\Models\DailyStoreSnapshot;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class ProductionStoreStockController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $stock = ProductionStoreStock::with(['product', 'productionStore'])
            ->when($request->production_store_id, fn($q) => $q->where('production_store_id', $request->production_store_id))
            ->get();
        return $this->success($stock);
    }

    public function snapshots(Request $request)
    {
        $snapshots = DailyStoreSnapshot::with('product')
            ->when($request->date, fn($q) => $q->where('snapshot_date', $request->date))
            ->orderBy('snapshot_date', 'desc')
            ->paginate($request->per_page ?? 30);

        return $this->success($snapshots);
    }

    public function createSnapshot()
    {
        // This should normally be a scheduled command, but we provide a manual trigger
        $stocks = ProductionStoreStock::all();
        $date = now()->toDateString();

        foreach ($stocks as $stock) {
            DailyStoreSnapshot::updateOrCreate(
                [
                    'snapshot_date' => $date, 
                    'product_id' => $stock->product_id, 
                    'store_type' => 'production',
                    'production_store_id' => $stock->production_store_id
                ],
                [
                    'opening_quantity' => $stock->current_quantity,
                    'received_quantity' => 0,
                    'transferred_out_quantity' => 0,
                    'transferred_in_quantity' => 0,
                    'dispatched_quantity' => 0,
                    'returns_in_quantity' => 0,
                    'wastage_quantity' => 0,
                    'closing_quantity' => $stock->current_quantity,
                    'generated_by' => auth()->id() ?? \App\Models\User::first()?->id,
                ]
            );
        }

        return $this->success(null, 'Daily snapshots generated for ' . $date);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'current_quantity' => 'required|numeric|min:0',
            'valuation_price' => 'required|numeric|min:0',
        ]);

        $stock = ProductionStoreStock::findOrFail($id);
        $stock->update([
            'current_quantity' => $validated['current_quantity'],
            'valuation_price' => $validated['valuation_price'],
            'updated_by' => auth()->id(),
            'last_updated' => now(),
        ]);

        return $this->success($stock->load('product'), 'Stock updated successfully');
    }

    public function destroy($id)
    {
        $stock = ProductionStoreStock::findOrFail($id);
        $stock->delete();

        return $this->success(null, 'Stock record removed successfully');
    }
}
