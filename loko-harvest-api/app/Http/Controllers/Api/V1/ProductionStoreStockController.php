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
        $date = $request->date;
        $stockQuery = ProductionStoreStock::with(['product', 'productionStore'])
            ->when($request->production_store_id, fn($q) => $q->where('production_store_id', $request->production_store_id));

        if ($date && $date !== now()->toDateString()) {
            $stockQuery->where('created_at', '<=', $date . ' 23:59:59');
            $stock = $stockQuery->get()->map(function ($item) use ($date) {
                // 1. Intakes
                $intakesQuery = \App\Models\ProductionStoreIntake::where('production_store_id', $item->production_store_id)
                    ->where('product_id', $item->product_id)
                    ->where(function ($q) use ($item) {
                        if ($item->batch_reference === null) {
                            $q->whereNull('batch_reference');
                        } else {
                            $q->where('batch_reference', $item->batch_reference);
                        }
                    });
                $intakesAfter = (float) (clone $intakesQuery)->where('intake_date', '>', $date)->sum('quantity');
                $intakesOn = (float) (clone $intakesQuery)->where('intake_date', '=', $date)->sum('quantity');

                // 2. Transfers Out (to other prod stores)
                $transfersProdQuery = \Illuminate\Support\Facades\DB::table('production_store_transfers')
                    ->where('from_production_store_id', $item->production_store_id)
                    ->where('product_id', $item->product_id)
                    ->where(function ($q) use ($item) {
                        if ($item->batch_reference === null) {
                            $q->whereNull('batch_reference');
                        } else {
                            $q->where('batch_reference', $item->batch_reference);
                        }
                    });
                $transfersProdAfter = (float) (clone $transfersProdQuery)->where('transfer_date', '>', $date)->sum('quantity');
                $transfersProdOn = (float) (clone $transfersProdQuery)->where('transfer_date', '=', $date)->sum('quantity');

                // 3. Transfers In (from other prod stores)
                $transfersInQuery = \Illuminate\Support\Facades\DB::table('production_store_transfers')
                    ->where('to_production_store_id', $item->production_store_id)
                    ->where('product_id', $item->product_id)
                    ->where(function ($q) use ($item) {
                        if ($item->batch_reference === null) {
                            $q->whereNull('batch_reference');
                        } else {
                            $q->where('batch_reference', $item->batch_reference);
                        }
                    });
                $transfersInAfter = (float) (clone $transfersInQuery)->where('transfer_date', '>', $date)->sum('quantity');
                $transfersInOn = (float) (clone $transfersInQuery)->where('transfer_date', '=', $date)->sum('quantity');

                // 4. Transfers to Sales Stores
                $transfersSalesQuery = \Illuminate\Support\Facades\DB::table('store_transfers')
                    ->where('production_store_id', $item->production_store_id)
                    ->where('product_id', $item->product_id)
                    ->where(function ($q) use ($item) {
                        if ($item->batch_reference === null) {
                            $q->whereNull('batch_reference');
                        } else {
                            $q->where('batch_reference', $item->batch_reference);
                        }
                    });
                $transfersSalesAfter = (float) (clone $transfersSalesQuery)->where('transfer_date', '>', $date)->sum('quantity');
                $transfersSalesOn = (float) (clone $transfersSalesQuery)->where('transfer_date', '=', $date)->sum('quantity');

                // 5. Adjustments
                $adjustmentsQuery = \Illuminate\Support\Facades\DB::table('store_adjustments')
                    ->where('store_type', 'production')
                    ->where('production_store_id', $item->production_store_id)
                    ->where('product_id', $item->product_id)
                    ->where('status', 'approved')
                    ->where(function ($q) use ($item) {
                        if ($item->batch_reference === null) {
                            $q->whereNull('batch_reference');
                        } else {
                            $q->where('batch_reference', $item->batch_reference);
                        }
                    });
                $adjustmentsAfter = - (float) (clone $adjustmentsQuery)->where('created_at', '>', $date . ' 23:59:59')->sum('quantity_change');
                $adjustmentsOn = - (float) (clone $adjustmentsQuery)->whereDate('created_at', '=', $date)->sum('quantity_change');

                // Rollback closing stock
                $liveClosing = (float) $item->closing_stock;
                $closingStockOnD = $liveClosing - ($intakesAfter + $transfersInAfter) + ($transfersProdAfter + $transfersSalesAfter + $adjustmentsAfter);

                // Daily metrics
                $incomingOnD = $intakesOn + $transfersInOn;
                $takenOnD = $transfersProdOn + $transfersSalesOn;
                $damagesOnD = $adjustmentsOn;
                $replacementsOnD = 0.00;

                // Current stock before exits on date D
                $currentStockOnD = $closingStockOnD + $takenOnD + $replacementsOnD + $damagesOnD;
                $openingStockOnD = $currentStockOnD - $incomingOnD;

                // Override properties for response
                $item->current_quantity = $closingStockOnD;
                $item->opening_stock = $openingStockOnD;
                $item->incoming = $incomingOnD;
                $item->stock_taken = $takenOnD;
                $item->damages = $damagesOnD;
                $item->replacements = $replacementsOnD;
                $item->closing_stock = $closingStockOnD;

                return $item;
            });
        } else {
            $stock = $stockQuery->get();
        }

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
            'opening_stock' => $validated['current_quantity'],
            'stock_taken' => 0,
            'replacements' => 0,
            'closing_stock' => $validated['current_quantity'],
            'current_quantity' => $validated['current_quantity'],
            'unit_price' => $validated['valuation_price'],
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
