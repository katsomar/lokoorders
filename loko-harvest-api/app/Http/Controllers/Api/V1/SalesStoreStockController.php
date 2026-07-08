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
        $stock = $stockQuery->get()->map(function ($item) use ($date) {
            // 1. Transfers In (production -> sales and sales -> sales in)
            $transfersProdQuery = \Illuminate\Support\Facades\DB::table('store_transfers')
                ->where('sales_store_id', $item->sales_store_id)
                ->where('product_id', $item->product_id)
                ->where(function ($q) use ($item) {
                    if ($item->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $item->batch_reference);
                    }
                });
            $transfersProdUpToD = (float) (clone $transfersProdQuery)->where('transfer_date', '<=', $date)->sum('quantity');
            $transfersProdOn = (float) (clone $transfersProdQuery)->where('transfer_date', '=', $date)->sum('quantity');

            $transfersSalesInQuery = \Illuminate\Support\Facades\DB::table('sales_store_transfers')
                ->where('to_sales_store_id', $item->sales_store_id)
                ->where('product_id', $item->product_id)
                ->where(function ($q) use ($item) {
                    if ($item->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $item->batch_reference);
                    }
                });
            $transfersSalesInUpToD = (float) (clone $transfersSalesInQuery)->where('transfer_date', '<=', $date)->sum('quantity');
            $transfersSalesInOn = (float) (clone $transfersSalesInQuery)->where('transfer_date', '=', $date)->sum('quantity');

            $transfersInUpToD = $transfersProdUpToD + $transfersSalesInUpToD;
            $transfersInOn = $transfersProdOn + $transfersSalesInOn;

            // 2. Conversions In
            $conversionsInQuery = \Illuminate\Support\Facades\DB::table('sales_store_conversions')
                ->where('sales_store_id', $item->sales_store_id)
                ->where('to_product_id', $item->product_id)
                ->where(function ($q) use ($item) {
                    if ($item->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $item->batch_reference);
                    }
                });
            $conversionsInUpToD = (float) (clone $conversionsInQuery)->where('created_at', '<=', $date . ' 23:59:59')->sum('to_quantity');
            $conversionsInOn = (float) (clone $conversionsInQuery)->whereDate('created_at', '=', $date)->sum('to_quantity');

            // 3. Conversions Out
            $conversionsOutQuery = \Illuminate\Support\Facades\DB::table('sales_store_conversions')
                ->where('sales_store_id', $item->sales_store_id)
                ->where('from_product_id', $item->product_id)
                ->where(function ($q) use ($item) {
                    if ($item->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $item->batch_reference);
                    }
                });
            $conversionsOutUpToD = (float) (clone $conversionsOutQuery)->where('created_at', '<=', $date . ' 23:59:59')->sum('from_quantity');
            $conversionsOutOn = (float) (clone $conversionsOutQuery)->whereDate('created_at', '=', $date)->sum('from_quantity');

            // 4. Transfers Out
            $transfersSalesOutQuery = \Illuminate\Support\Facades\DB::table('sales_store_transfers')
                ->where('from_sales_store_id', $item->sales_store_id)
                ->where('product_id', $item->product_id)
                ->where(function ($q) use ($item) {
                    if ($item->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $item->batch_reference);
                    }
                });
            $transfersSalesOutUpToD = (float) (clone $transfersSalesOutQuery)->where('transfer_date', '<=', $date)->sum('quantity');
            $transfersSalesOutOn = (float) (clone $transfersSalesOutQuery)->where('transfer_date', '=', $date)->sum('quantity');

            // 5. Sold Quantity
            $soldQuery = \Illuminate\Support\Facades\DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('orders.sales_store_id', $item->sales_store_id)
                ->where('order_items.product_id', $item->product_id)
                ->where(function ($q) use ($item) {
                    if ($item->batch_reference === null) {
                        $q->whereNull('order_items.batch_reference');
                    } else {
                        $q->where('order_items.batch_reference', $item->batch_reference);
                    }
                })
                ->whereIn('orders.status', ['dispatched', 'delivered']);
            $soldUpToD = (float) (clone $soldQuery)->where('orders.order_date', '<=', $date)->sum('order_items.quantity');
            $soldOn = (float) (clone $soldQuery)->where('orders.order_date', '=', $date)->sum('order_items.quantity');

            // 6. Replacements (removed from store for physical replacements)
            $replacementsQuery = \Illuminate\Support\Facades\DB::table('order_replacement_allocations')
                ->where('sales_store_id', $item->sales_store_id)
                ->where('product_id', $item->product_id)
                ->where(function ($q) use ($item) {
                    if ($item->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $item->batch_reference);
                    }
                });
            $replacementsUpToD = (float) (clone $replacementsQuery)->where('created_at', '<=', $date . ' 23:59:59')->sum('allocated_quantity');
            $replacementsOn = (float) (clone $replacementsQuery)->whereDate('created_at', '=', $date)->sum('allocated_quantity');

            // 7. Returns (physical returns brought back to store)
            $returnsQuery = \Illuminate\Support\Facades\DB::table('return_vouchers')
                ->join('orders', 'return_vouchers.order_id', '=', 'orders.id')
                ->where('orders.sales_store_id', $item->sales_store_id)
                ->where('return_vouchers.product_id', $item->product_id)
                ->where(function ($q) use ($item) {
                    if ($item->batch_reference === null) {
                        $q->whereNull('return_vouchers.batch_reference');
                    } else {
                        $q->where('return_vouchers.batch_reference', $item->batch_reference);
                    }
                });
            $returnsUpToD = (float) (clone $returnsQuery)->where('return_vouchers.return_date', '<=', $date)->sum('return_vouchers.quantity');
            $returnsOn = (float) (clone $returnsQuery)->where('return_vouchers.return_date', '=', $date)->sum('return_vouchers.quantity');

            // 8. Damages / Adjustments
            $damagesQuery = \Illuminate\Support\Facades\DB::table('store_adjustments')
                ->where('store_type', 'sales')
                ->where('sales_store_id', $item->sales_store_id)
                ->where('product_id', $item->product_id)
                ->where('status', 'approved')
                ->where(function ($q) use ($item) {
                    if ($item->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $item->batch_reference);
                    }
                });
            $damagesUpToD = - (float) (clone $damagesQuery)->where('created_at', '<=', $date . ' 23:59:59')->sum('quantity_change');
            $damagesOn = - (float) (clone $damagesQuery)->whereDate('created_at', '=', $date)->sum('quantity_change');

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
