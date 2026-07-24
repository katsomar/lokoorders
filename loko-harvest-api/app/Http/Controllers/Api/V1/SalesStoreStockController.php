<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SalesStoreStock;
use App\Models\SalesStoreMovement;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class SalesStoreStockController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $date = $request->date ?? date('Y-m-d');
        $stockQuery = SalesStoreStock::with(['product', 'salesStore'])
            ->when($request->sales_store_id, function ($q) use ($request) {
                return $q->where('sales_store_id', $request->sales_store_id);
            });
        $stockQuery->where('created_at', '<=', $date . ' 23:59:59');
        $stock = $stockQuery->get();

        if ($stock->isEmpty()) {
            return $this->success([]);
        }

        $storeId = $request->sales_store_id;
        $storeIds = $storeId ? [$storeId] : $stock->pluck('sales_store_id')->unique()->toArray();

        // 1. Transfers In (production -> sales: store_transfers)
        $transfersProd = \Illuminate\Support\Facades\DB::table('store_transfers')
            ->whereIn('sales_store_id', $storeIds)
            ->where('status', 'approved')
            ->where('transfer_date', '<=', $date)
            ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when transfer_date = ? then quantity else 0 end) as total_on', [$date])
            ->groupBy('product_id', 'batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // Transfers In (sales -> sales: sales_store_transfers)
        $transfersSalesIn = \Illuminate\Support\Facades\DB::table('sales_store_transfers')
            ->whereIn('to_sales_store_id', $storeIds)
            ->where('transfer_date', '<=', $date)
            ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when transfer_date = ? then quantity else 0 end) as total_on', [$date])
            ->groupBy('product_id', 'batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // 2. Conversions In
        $conversionsIn = \Illuminate\Support\Facades\DB::table('sales_store_conversions')
            ->whereIn('sales_store_id', $storeIds)
            ->where('created_at', '<=', $date . ' 23:59:59')
            ->selectRaw('to_product_id as product_id, batch_reference, sum(to_quantity) as total, sum(case when date(created_at) = ? then to_quantity else 0 end) as total_on', [$date])
            ->groupBy('to_product_id', 'batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // 3. Conversions Out
        $conversionsOut = \Illuminate\Support\Facades\DB::table('sales_store_conversions')
            ->whereIn('sales_store_id', $storeIds)
            ->where('created_at', '<=', $date . ' 23:59:59')
            ->selectRaw('from_product_id as product_id, batch_reference, sum(from_quantity) as total, sum(case when date(created_at) = ? then from_quantity else 0 end) as total_on', [$date])
            ->groupBy('from_product_id', 'batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // 4. Transfers Out (sales -> sales: sales_store_transfers)
        $transfersSalesOut = \Illuminate\Support\Facades\DB::table('sales_store_transfers')
            ->whereIn('from_sales_store_id', $storeIds)
            ->where('transfer_date', '<=', $date)
            ->selectRaw('product_id, batch_reference, sum(quantity) as total, sum(case when transfer_date = ? then quantity else 0 end) as total_on', [$date])
            ->groupBy('product_id', 'batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // 5. Sold Quantity
        $sold = \Illuminate\Support\Facades\DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereIn('orders.sales_store_id', $storeIds)
            ->whereIn('orders.status', ['dispatched', 'on_route', 'delivered'])
            ->where('orders.order_date', '<=', $date)
            ->selectRaw('order_items.product_id, order_items.batch_reference, sum(order_items.quantity) as total, sum(case when orders.order_date = ? then order_items.quantity else 0 end) as total_on', [$date])
            ->groupBy('order_items.product_id', 'order_items.batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // 6. Replacements
        $replacements = \Illuminate\Support\Facades\DB::table('order_replacement_allocations')
            ->whereIn('sales_store_id', $storeIds)
            ->where('created_at', '<=', $date . ' 23:59:59')
            ->selectRaw('product_id, batch_reference, sum(allocated_quantity) as total, sum(case when date(created_at) = ? then allocated_quantity else 0 end) as total_on', [$date])
            ->groupBy('product_id', 'batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // 7. Returns
        $returns = \Illuminate\Support\Facades\DB::table('return_vouchers')
            ->join('orders', 'return_vouchers.order_id', '=', 'orders.id')
            ->whereIn('orders.sales_store_id', $storeIds)
            ->where('return_vouchers.return_date', '<=', $date)
            ->selectRaw('return_vouchers.product_id, return_vouchers.batch_reference, sum(return_vouchers.quantity) as total, sum(case when return_vouchers.return_date = ? then return_vouchers.quantity else 0 end) as total_on', [$date])
            ->groupBy('return_vouchers.product_id', 'return_vouchers.batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // 8. Damages / Adjustments (approved only)
        $damages = \Illuminate\Support\Facades\DB::table('store_adjustments')
            ->where('store_type', 'sales')
            ->whereIn('sales_store_id', $storeIds)
            ->where('status', 'approved')
            ->where('created_at', '<=', $date . ' 23:59:59')
            ->selectRaw('product_id, batch_reference, sum(quantity_change) as total, sum(case when date(created_at) = ? then quantity_change else 0 end) as total_on', [$date])
            ->groupBy('product_id', 'batch_reference')
            ->get()
            ->groupBy(fn($i) => $i->product_id . '_' . ($i->batch_reference ?? ''));

        // Map over stocks matching in memory
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
            $conversionsInUpToD = (float) ($getConvIn?->total ?? 0);
            $conversionsInOn = (float) ($getConvIn?->total_on ?? 0);

            $getConvOut = $conversionsOut->get($key)?->first();
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

            // Calculate closing stock using transaction ledger cumulative sum up to D
            $closingStockOnD = ($transfersInUpToD + $conversionsInUpToD + $returnsUpToD) - ($conversionsOutUpToD + $transfersSalesOutUpToD + $soldUpToD + $replacementsUpToD + $damagesUpToD);

            // Override properties for response
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

        return $this->success($stock);
    }

    public function movements(Request $request)
    {
        $movements = SalesStoreMovement::with(['product', 'user', 'salesStore'])
            ->when($request->sales_store_id, function ($q) use ($request) {
                return $q->where('sales_store_id', $request->sales_store_id);
            })
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($movements);
    }
}
