<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\OrderItem;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class SalesStoreSalesController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        $sales = OrderItem::with(['order.customer', 'order.salesStore', 'product', 'order.user'])
            ->whereHas('order', function ($query) use ($request) {
                $query->when($request->sales_store_id, fn($q) => $q->where('sales_store_id', $request->sales_store_id))
                    ->when($request->start_date, fn($q) => $q->whereDate('order_date', '>=', $request->start_date))
                    ->when($request->end_date, fn($q) => $q->whereDate('order_date', '<=', $request->end_date));
            })
            ->when($request->product_id, fn($q) => $q->where('product_id', $request->product_id))
            ->latest()
            ->paginate($request->per_page ?? 15);

        return $this->success($sales);
    }
}
