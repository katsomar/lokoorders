<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesStoreSalesController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $query = OrderItem::with(['order.customer', 'order.salesStore', 'product', 'order.user'])
            ->whereHas('order', function ($query) use ($request) {
                $query->when($request->sales_store_id, fn($q) => $q->where('sales_store_id', $request->sales_store_id))
                    ->when($request->start_date, fn($q) => $q->whereDate('order_date', '>=', $request->start_date))
                    ->when($request->end_date, fn($q) => $q->whereDate('order_date', '<=', $request->end_date));
            })
            ->when($request->product_id, fn($q) => $q->where('product_id', $request->product_id));

        // Calculate aggregates on the database level
        $totalQty = (float)$query->sum('quantity');
        $totalVal = (float)$query->sum(DB::raw('quantity * unit_price'));

        $productValues = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select('products.name', DB::raw('SUM(order_items.quantity * order_items.unit_price) as value'))
            ->when($request->sales_store_id, fn($q) => $q->where('orders.sales_store_id', $request->sales_store_id))
            ->when($request->start_date, fn($q) => $q->whereDate('orders.order_date', '>=', $request->start_date))
            ->when($request->end_date, fn($q) => $q->whereDate('orders.order_date', '<=', $request->end_date))
            ->when($request->product_id, fn($q) => $q->where('order_items.product_id', $request->product_id))
            ->groupBy('products.name')
            ->pluck('value', 'products.name')
            ->toArray();

        foreach ($productValues as $k => $v) {
            $productValues[$k] = (float)$v;
        }

        $sales = $query->latest()->paginate($request->per_page ?? 15);

        $response = $sales->toArray();
        $response['aggregates'] = [
            'total_quantity' => $totalQty,
            'total_valuation' => $totalVal,
            'count' => $sales->total(),
            'product_values' => $productValues
        ];

        return $this->success($response);
    }
}
