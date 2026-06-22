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
        $startDate = $request->start_date ?? now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?? now()->endOfMonth()->toDateString();

        // 5-month category trend
        $salesTrend = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select(
                DB::raw("DATE_FORMAT(orders.order_date, '%b') as month"),
                DB::raw("SUM(CASE WHEN products.category = 'eggs' THEN order_items.line_total ELSE 0 END) as eggs"),
                DB::raw("SUM(CASE WHEN products.category = 'poultry' THEN order_items.line_total ELSE 0 END) as poultry"),
                DB::raw("SUM(CASE WHEN products.category = 'manure' THEN order_items.line_total ELSE 0 END) as manure"),
                DB::raw("SUM(CASE WHEN products.category NOT IN ('eggs', 'poultry', 'manure') THEN order_items.line_total ELSE 0 END) as other")
            )
            ->where('orders.order_date', '>=', now()->subMonths(4)->startOfMonth()->toDateString())
            ->groupBy(DB::raw("DATE_FORMAT(orders.order_date, '%b'), MONTH(orders.order_date)"))
            ->orderBy(DB::raw("MONTH(orders.order_date)"))
            ->get();

        $summary = [
            'total_sales' => (float)Order::whereBetween('order_date', [$startDate, $endDate])->sum('total_amount'),
            'total_collections' => (float)Payment::whereBetween('payment_date', [$startDate, $endDate])->sum('amount'),
            'order_count' => Order::whereBetween('order_date', [$startDate, $endDate])->count(),
            'sales_by_category' => DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->whereBetween('orders.order_date', [$startDate, $endDate])
                ->select('products.category', DB::raw('SUM(order_items.line_total) as total'))
                ->groupBy('products.category')
                ->get()
                ->map(function($item) {
                    $item->total = (float)$item->total;
                    return $item;
                }),
            'sales_trend' => $salesTrend->map(function($trend) {
                $trend->eggs = (float)$trend->eggs;
                $trend->poultry = (float)$trend->poultry;
                $trend->manure = (float)$trend->manure;
                $trend->other = (float)$trend->other;
                return $trend;
            }),
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
