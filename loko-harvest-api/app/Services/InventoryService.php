<?php

namespace App\Services;

use App\Models\ProductionStore;
use App\Models\SalesStore;
use App\Models\Product;
use App\Models\ProductionStoreIntake;
use App\Models\ProductionStoreStock;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function getProductionStoreDashboardData($date, $productionStoreId = null)
    {
        $excludeLookups = request()->query('exclude_lookups') == 1;
        $lookups = null;

        if (!$excludeLookups) {
            // 1. Fetch Lookups (only active products, stores) selecting only necessary columns
            $products = Product::where('is_active', true)
                ->select('id', 'name', 'code', 'category', 'unit_of_measure', 'default_unit_price', 'production_unit_price', 'sales_unit_price', 'production_egg_unit_price', 'sales_egg_unit_price')
                ->get();

            $productionStores = ProductionStore::select('id', 'name', 'code', 'location')->get();
            $salesStores = SalesStore::select('id', 'name', 'code', 'location')->get();

            $lookups = [
                'products' => $products,
                'production_stores' => $productionStores,
                'sales_stores' => $salesStores,
            ];
        }

        // 2. Fetch Intake Logs (limited to 50 logs for UI layout to control JSON size)
        $intakes = ProductionStoreIntake::with([
                'product' => fn($q) => $q->select('id', 'name', 'code', 'unit_of_measure', 'category'),
                'productionStore' => fn($q) => $q->select('id', 'name', 'code'),
                'user' => fn($q) => $q->select('id', 'name')
            ])
            ->latest()
            ->take(50)
            ->get();

        // 3. Stock calculation logic (optimized via PHP HashMap aggregations)
        $stockQuery = ProductionStoreStock::with([
                'product' => fn($q) => $q->select('id', 'name', 'code', 'category', 'unit_of_measure', 'production_unit_price', 'default_unit_price', 'production_egg_unit_price'),
                'productionStore' => fn($q) => $q->select('id', 'name', 'code')
            ])
            ->when($productionStoreId, function ($q) use ($productionStoreId) {
                return $q->where('production_store_id', $productionStoreId);
            });
        $stockQuery->where('created_at', '<=', $date . ' 23:59:59');
        $stock = $stockQuery->get();

        if (!$stock->isEmpty()) {
            $storeIds = $productionStoreId ? [$productionStoreId] : $stock->pluck('production_store_id')->unique()->toArray();

            // Bulk aggregates
            $intakeSums = DB::table('production_store_intakes')
                ->whereIn('production_store_id', $storeIds)
                ->where('intake_date', '<=', $date)
                ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when intake_date = ? then quantity else 0 end) as total_on', [$date])
                ->groupBy('product_id', 'batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            $transfersProdOut = DB::table('production_store_transfers')
                ->whereIn('from_production_store_id', $storeIds)
                ->where('transfer_date', '<=', $date)
                ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when transfer_date = ? then quantity else 0 end) as total_on', [$date])
                ->groupBy('product_id', 'batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            $transfersProdIn = DB::table('production_store_transfers')
                ->whereIn('to_production_store_id', $storeIds)
                ->where('transfer_date', '<=', $date)
                ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when transfer_date = ? then quantity else 0 end) as total_on', [$date])
                ->groupBy('product_id', 'batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            $transfersSales = DB::table('store_transfers')
                ->whereIn('production_store_id', $storeIds)
                ->where('status', 'approved')
                ->where('transfer_date', '<=', $date)
                ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when transfer_date = ? then quantity else 0 end) as total_on', [$date])
                ->groupBy('product_id', 'batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            $adjustments = DB::table('store_adjustments')
                ->where('store_type', 'production')
                ->whereIn('production_store_id', $storeIds)
                ->where('status', 'approved')
                ->where('created_at', '<=', $date . ' 23:59:59')
                ->selectRaw('product_id, batch_reference, sum(quantity_change) as total, sum(case when date(created_at) = ? then quantity_change else 0 end) as total_on', [$date])
                ->groupBy('product_id', 'batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            // Map and calculate stock variables in memory
            $stock = $stock->map(function ($item) use ($date, $intakeSums, $transfersProdOut, $transfersProdIn, $transfersSales, $adjustments) {
                $key = $item->product_id . '_' . ($item->batch_reference ?? '');

                $getIntakes = $intakeSums->get($key)?->first();
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

                $closingStockOnD = ($intakesUpToD + $transfersInUpToD) - ($transfersProdUpToD + $transfersSalesUpToD + $adjustmentsUpToD);

                $incomingOnD = $intakesOn + $transfersInOn;
                $takenOnD = $transfersProdOn + $transfersSalesOn;
                $damagesOnD = $adjustmentsOn;
                $replacementsOnD = 0.00;

                $currentStockOnD = $closingStockOnD + $takenOnD + $replacementsOnD + $damagesOnD;
                $openingStockOnD = $currentStockOnD - $incomingOnD;

                $item->current_quantity = $closingStockOnD;
                $item->opening_stock = $openingStockOnD;
                $item->incoming = $incomingOnD;
                $item->stock_taken = $takenOnD;
                $item->damages = $damagesOnD;
                $item->replacements = $replacementsOnD;
                $item->closing_stock = $closingStockOnD;

                return $item;
            });
        }

        return [
            'lookups' => $lookups,
            'inventory' => [
                'stock' => $stock,
                'intakes' => $intakes,
            ],
        ];
    }
}
