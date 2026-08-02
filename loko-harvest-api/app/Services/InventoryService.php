<?php

namespace App\Services;

use App\Models\ProductionStore;
use App\Models\SalesStore;
use App\Models\Product;
use App\Models\ProductionStoreIntake;
use App\Models\ProductionStoreStock;
use App\Models\SalesStoreStock;
use App\Models\SalesStoreMovement;
use App\Models\SalesStoreTransfer;
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

                $item->current_quantity = $currentStockOnD;
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

    public function getSalesStoreDashboardData($date, $salesStoreId = null)
    {
        $excludeLookups = request()->query('exclude_lookups') == 1;
        $lookups = null;

        if (!$excludeLookups) {
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

        // 1. Sales Movements (limit to 50 logs)
        $movements = SalesStoreMovement::with(['product:id,name,code,unit_of_measure', 'user:id,name', 'salesStore:id,name,code'])
            ->when($salesStoreId, function ($q) use ($salesStoreId) {
                return $q->where('sales_store_id', $salesStoreId);
            })
            ->latest()
            ->take(50)
            ->get();

        // 2. Sales Stock Ledger Computation
        $stockQuery = SalesStoreStock::with([
                'product' => fn($q) => $q->select('id', 'name', 'code', 'category', 'unit_of_measure', 'sales_unit_price', 'default_unit_price', 'sales_egg_unit_price'),
                'salesStore' => fn($q) => $q->select('id', 'name', 'code')
            ])
            ->when($salesStoreId, function ($q) use ($salesStoreId) {
                return $q->where('sales_store_id', $salesStoreId);
            });
        $stockQuery->where('created_at', '<=', $date . ' 23:59:59');
        $stock = $stockQuery->get();

        if (!$stock->isEmpty()) {
            $storeIds = $salesStoreId ? [$salesStoreId] : $stock->pluck('sales_store_id')->unique()->toArray();

            $transfersProd = DB::table('store_transfers')
                ->whereIn('sales_store_id', $storeIds)
                ->where('status', 'approved')
                ->where('transfer_date', '<=', $date)
                ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when transfer_date = ? then quantity else 0 end) as total_on', [$date])
                ->groupBy('product_id', 'batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            $transfersSalesIn = DB::table('sales_store_transfers')
                ->whereIn('to_sales_store_id', $storeIds)
                ->where('transfer_date', '<=', $date)
                ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when transfer_date = ? then quantity else 0 end) as total_on', [$date])
                ->groupBy('product_id', 'batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            $conversionsIn = DB::table('sales_store_conversions')
                ->whereIn('sales_store_id', $storeIds)
                ->where('status', '!=', 'rejected')
                ->where(function($q) use ($date) {
                    $q->whereDate('conversion_date', '<=', $date)
                      ->orWhere('created_at', '<=', $date . ' 23:59:59');
                })
                ->selectRaw('to_product_id as product_id, batch_reference, sum(to_quantity) as total, sum(case when conversion_date = ? or date(created_at) = ? then to_quantity else 0 end) as total_on', [$date, $date])
                ->groupBy('to_product_id', 'batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            $conversionsOut = DB::table('sales_store_conversions')
                ->whereIn('sales_store_id', $storeIds)
                ->where('status', '!=', 'rejected')
                ->where(function($q) use ($date) {
                    $q->whereDate('conversion_date', '<=', $date)
                      ->orWhere('created_at', '<=', $date . ' 23:59:59');
                })
                ->selectRaw('from_product_id as product_id, batch_reference, sum(from_quantity) as total, sum(case when conversion_date = ? or date(created_at) = ? then from_quantity else 0 end) as total_on', [$date, $date])
                ->groupBy('from_product_id', 'batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            $transfersSalesOut = DB::table('sales_store_transfers')
                ->whereIn('from_sales_store_id', $storeIds)
                ->where('transfer_date', '<=', $date)
                ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when transfer_date = ? then quantity else 0 end) as total_on', [$date])
                ->groupBy('product_id', 'batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            $sold = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->whereIn('orders.sales_store_id', $storeIds)
                ->whereIn('orders.status', ['dispatched', 'on_route', 'delivered'])
                ->where('orders.order_date', '<=', $date)
                ->selectRaw('order_items.product_id, order_items.batch_reference, sum(order_items.quantity) as total, sum(case when orders.order_date = ? then order_items.quantity else 0 end) as total_on', [$date])
                ->groupBy('order_items.product_id', 'order_items.batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            $replacements = DB::table('order_replacement_allocations')
                ->whereIn('sales_store_id', $storeIds)
                ->where('created_at', '<=', $date . ' 23:59:59')
                ->selectRaw('product_id, batch_reference, sum(allocated_quantity) as total, sum(case when date(created_at) = ? then allocated_quantity else 0 end) as total_on', [$date])
                ->groupBy('product_id', 'batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            $returns = DB::table('return_vouchers')
                ->join('orders', 'return_vouchers.order_id', '=', 'orders.id')
                ->whereIn('orders.sales_store_id', $storeIds)
                ->where('return_vouchers.return_date', '<=', $date)
                ->selectRaw('return_vouchers.product_id, return_vouchers.batch_reference, sum(return_vouchers.quantity) as total, sum(case when return_vouchers.return_date = ? then return_vouchers.quantity else 0 end) as total_on', [$date])
                ->groupBy('return_vouchers.product_id', 'return_vouchers.batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            $damages = DB::table('store_adjustments')
                ->where('store_type', 'sales')
                ->whereIn('sales_store_id', $storeIds)
                ->where('status', 'approved')
                ->where('created_at', '<=', $date . ' 23:59:59')
                ->selectRaw('product_id, batch_reference, sum(quantity_change) as total, sum(case when date(created_at) = ? then quantity_change else 0 end) as total_on', [$date])
                ->groupBy('product_id', 'batch_reference')
                ->get()
                ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

            $stock = $stock->map(function ($item) use ($date, $transfersProd, $transfersSalesIn, $conversionsIn, $conversionsOut, $transfersSalesOut, $sold, $replacements, $returns, $damages) {
                $key = $item->product_id . '_' . ($item->batch_reference ?? '');

                $getTransfersProd = $transfersProd->get($key)?->first();
                $transfersProdUpToD = (float) ($getTransfersProd?->total ?? 0);
                $transfersProdOn = (float) ($getTransfersProd?->total_on ?? 0);

                $getTransfersSalesIn = $transfersSalesIn->get($key)?->first();
                $transfersSalesInUpToD = (float) ($getTransfersSalesIn?->total ?? 0);
                $transfersSalesInOn = (float) ($getTransfersSalesIn?->total_on ?? 0);

                $transfersInUpToD = $transfersProdUpToD + $transfersSalesInUpToD;
                $transfersInOn = $transfersProdOn + $transfersSalesInOn;

                $getConvIn = $conversionsIn->get($key)?->first();
                if (!$getConvIn && !empty($item->batch_reference)) {
                    $getConvIn = $conversionsIn->get($item->product_id . '_')?->first();
                }
                $conversionsInUpToD = (float) ($getConvIn?->total ?? 0);
                $conversionsInOn = (float) ($getConvIn?->total_on ?? 0);

                $getConvOut = $conversionsOut->get($key)?->first();
                if (!$getConvOut && !empty($item->batch_reference)) {
                    $getConvOut = $conversionsOut->get($item->product_id . '_')?->first();
                }
                $conversionsOutUpToD = (float) ($getConvOut?->total ?? 0);
                $conversionsOutOn = (float) ($getConvOut?->total_on ?? 0);

                $getTransfersSalesOut = $transfersSalesOut->get($key)?->first();
                $transfersSalesOutUpToD = (float) ($getTransfersSalesOut?->total ?? 0);
                $transfersSalesOutOn = (float) ($getTransfersSalesOut?->total_on ?? 0);

                $getSold = $sold->get($key)?->first();
                $soldUpToD = (float) ($getSold?->total ?? 0);
                $soldOn = (float) ($getSold?->total_on ?? 0);

                $getRepl = $replacements->get($key)?->first();
                $replacementsUpToD = (float) ($getRepl?->total ?? 0);
                $replacementsOn = (float) ($getRepl?->total_on ?? 0);

                $getRet = $returns->get($key)?->first();
                $returnsUpToD = (float) ($getRet?->total ?? 0);
                $returnsOn = (float) ($getRet?->total_on ?? 0);

                $getDam = $damages->get($key)?->first();
                $damagesUpToD = - (float) ($getDam?->total ?? 0);
                $damagesOn = - (float) ($getDam?->total_on ?? 0);

                $closingStockOnD = ($transfersInUpToD + $conversionsInUpToD + $returnsUpToD) - ($conversionsOutUpToD + $transfersSalesOutUpToD + $soldUpToD + $replacementsUpToD + $damagesUpToD);

                $inflowOnD = $transfersInOn + $conversionsInOn + $returnsOn;
                $outflowOnD = $conversionsOutOn + $transfersSalesOutOn + $soldOn + $replacementsOn + $damagesOn;
                $openingStockOnD = $closingStockOnD - $inflowOnD + $outflowOnD;

                $item->current_quantity = $closingStockOnD;
                $item->opening_stock = $openingStockOnD;
                $item->transferred_in = $transfersInOn;
                $item->conversions_in = $conversionsInOn;
                $item->conversions_out = $conversionsOutOn;
                $item->transferred_out = $transfersSalesOutOn;
                $item->sold_quantity = $soldOn;
                $item->returns = $returnsOn;
                $item->replacements = $replacementsOn;
                $item->damages = $damagesOn;
                $item->closing_stock = $closingStockOnD;

                return $item;
            });
        }

        return [
            'lookups' => $lookups,
            'inventory' => [
                'stock' => $stock,
                'movements' => $movements,
            ],
        ];
    }
}
