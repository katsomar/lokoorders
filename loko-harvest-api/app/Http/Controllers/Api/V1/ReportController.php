<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\CustomerAccount;
use App\Models\Delivery;
use App\Models\SalesStoreStock;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    use ApiResponses;

    public function salesSummary(Request $request)
    {
        $startDate = $request->start_date ?? now()->startOfMonth();
        $endDate = $request->end_date ?? now()->endOfMonth();

        $summary = [
            'total_sales' => Order::whereBetween('order_date', [$startDate, $endDate])->sum('total_amount'),
            'total_collections' => Payment::whereBetween('payment_date', [$startDate, $endDate])->sum('amount'),
            'order_count' => Order::whereBetween('order_date', [$startDate, $endDate])->count(),
            'sales_by_category' => DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->whereBetween('orders.order_date', [$startDate, $endDate])
                ->select('products.category', DB::raw('SUM(order_items.line_total) as total'))
                ->groupBy('products.category')
                ->get(),
        ];

        return $this->success($summary);
    }

    public function agingReport()
    {
        $aging = CustomerAccount::join('customers', 'customer_accounts.customer_id', '=', 'customers.id')
            ->where('current_balance', '>', 0)
            ->select('customers.name', 'customer_accounts.current_balance', 'customers.credit_terms')
            ->get();

        return $this->success($aging);
    }

    public function driverPerformance()
    {
        $performance = DB::table('deliveries')
            ->join('drivers', 'deliveries.driver_id', '=', 'drivers.id')
            ->join('users', 'drivers.user_id', '=', 'users.id')
            ->select(
                'users.name',
                DB::raw('COUNT(deliveries.id) as total_deliveries'),
                DB::raw('SUM(CASE WHEN deliveries.status = "delivered" THEN 1 ELSE 0 END) as successful'),
                DB::raw('AVG(TIMESTAMPDIFF(MINUTE, deliveries.dispatched_at, deliveries.delivered_at)) as avg_time_minutes')
            )
            ->groupBy('users.name')
            ->get();

        return $this->success($performance);
    }
}
