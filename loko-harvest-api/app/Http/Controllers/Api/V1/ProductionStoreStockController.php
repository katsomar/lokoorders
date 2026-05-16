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

    public function index()
    {
        $stock = ProductionStoreStock::with('product')->get();
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
                ['snapshot_date' => $date, 'product_id' => $stock->product_id, 'store_type' => 'production'],
                [
                    'opening_quantity' => $stock->current_quantity, // Simplified for now
                    'closing_quantity' => $stock->current_quantity,
                    'intake_quantity' => 0,
                    'transfer_out_quantity' => 0,
                    'adjustment_quantity' => 0,
                    'created_by' => auth()->id() ?? null,
                ]
            );
        }

        return $this->success(null, 'Daily snapshots generated for ' . $date);
    }
}
