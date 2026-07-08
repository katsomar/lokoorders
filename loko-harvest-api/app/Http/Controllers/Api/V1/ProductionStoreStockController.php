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
        $date = $request->date ?? date('Y-m-d');
        $stockQuery = ProductionStoreStock::with(['product', 'productionStore'])
            ->when($request->production_store_id, function ($q) use ($request) {
                return $q->where('production_store_id', $request->production_store_id);
            });
        $stockQuery->where('created_at', '<=', $date . ' 23:59:59');
        $stock = $stockQuery->get();

        if ($stock->isEmpty()) {
            return $this->success([]);
        }

        $storeId = $request->production_store_id;
        $storeIds = $storeId ? [$storeId] : $stock->pluck('production_store_id')->unique()->toArray();

        // Bulk load all Intakes for this store up to date D
        $intakes = \App\Models\ProductionStoreIntake::whereIn('production_store_id', $storeIds)
            ->where('intake_date', '<=', $date)
            ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when intake_date = ? then quantity else 0 end) as total_on', [$date])
            ->groupBy('product_id', 'batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // Bulk load all Transfers Out (to other prod stores)
        $transfersProdOut = \Illuminate\Support\Facades\DB::table('production_store_transfers')
            ->whereIn('from_production_store_id', $storeIds)
            ->where('transfer_date', '<=', $date)
            ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when transfer_date = ? then quantity else 0 end) as total_on', [$date])
            ->groupBy('product_id', 'batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // Bulk load all Transfers In (from other prod stores)
        $transfersProdIn = \Illuminate\Support\Facades\DB::table('production_store_transfers')
            ->whereIn('to_production_store_id', $storeIds)
            ->where('transfer_date', '<=', $date)
            ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when transfer_date = ? then quantity else 0 end) as total_on', [$date])
            ->groupBy('product_id', 'batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // Bulk load all Transfers to Sales Stores (approved only)
        $transfersSales = \Illuminate\Support\Facades\DB::table('store_transfers')
            ->whereIn('production_store_id', $storeIds)
            ->where('status', 'approved')
            ->where('transfer_date', '<=', $date)
            ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when transfer_date = ? then quantity else 0 end) as total_on', [$date])
            ->groupBy('product_id', 'batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // Bulk load all Adjustments (approved only)
        $adjustments = \Illuminate\Support\Facades\DB::table('store_adjustments')
            ->where('store_type', 'production')
            ->whereIn('production_store_id', $storeIds)
            ->where('status', 'approved')
            ->where('created_at', '<=', $date . ' 23:59:59')
            ->selectRaw('product_id, batch_reference, sum(quantity_change) as total, sum(case when date(created_at) = ? then quantity_change else 0 end) as total_on', [$date])
            ->groupBy('product_id', 'batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // Map over stocks matching in memory
        $stock = $stock->map(function ($item) use ($date, $intakes, $transfersProdOut, $transfersProdIn, $transfersSales, $adjustments) {
            $key = $item->product_id . '_' . ($item->batch_reference ?? '');

            $getIntakes = $intakes->get($key)?->first();
            $intakesUpToD = (float) ($getIntakes?->total ?? 0);
            $intakesOn = (float) ($getIntakes?->total_on ?? 0);

            $getProdOut = $transfersProdOut->get($key)?->first();
            $transfersProdUpToD = (float) ($getProdOut?->total ?? 0);
            $transfersProdOn = (float) ($getProdOut?->total_on ?? 0);

            $getProdIn = $transfersProdIn->get($key)?->first();
            $transfersInUpToD = (float) ($getProdIn?->total ?? 0);
            $transfersInOn = (float) ($getProdIn?->total_on ?? 0);

            $getSales = $transfersSales->get($key)?->first();
            $transfersSalesUpToD = (float) ($getSales?->total ?? 0);
            $transfersSalesOn = (float) ($getSales?->total_on ?? 0);

            $getAdj = $adjustments->get($key)?->first();
            $adjustmentsUpToD = - (float) ($getAdj?->total ?? 0);
            $adjustmentsOn = - (float) ($getAdj?->total_on ?? 0);

            // Calculate closing stock using transaction ledger cumulative sum up to D
            $closingStockOnD = ($intakesUpToD + $transfersInUpToD) - ($transfersProdUpToD + $transfersSalesUpToD + $adjustmentsUpToD);

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

        return $this->success($stock);
    }

    public function snapshots(Request $request)
    {
        $snapshots = DailyStoreSnapshot::with('product')
            ->when($request->date, function ($q) use ($request) {
                return $q->where('snapshot_date', $request->date);
            })
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
