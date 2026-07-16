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

    public function customerAnalytics(Request $request)
    {
        $startDate = $request->start_date ?? now()->startOfMonth()->toDateString();
        $endDate = $request->end_date ?? now()->endOfMonth()->toDateString();
        $customerId = $request->customer_id;
        if ($customerId === 'all') {
            $customerId = null;
        }

        // 1. Best Performing Spenders
        $bestPerformers = DB::table('orders')
            ->join('customers', 'orders.customer_id', '=', 'customers.id')
            ->select(
                'customers.id',
                'customers.name',
                'customers.customer_type',
                DB::raw('SUM(orders.total_amount) as total_spent'),
                DB::raw('COUNT(orders.id) as order_count'),
                DB::raw('AVG(orders.total_amount) as avg_order_value')
            )
            ->whereBetween('orders.order_date', [$startDate, $endDate])
            ->where('orders.status', '!=', 'cancelled')
            ->when($customerId, fn($q) => $q->where('orders.customer_id', $customerId))
            ->groupBy('customers.id', 'customers.name', 'customers.customer_type')
            ->orderBy('total_spent', 'desc')
            ->get()
            ->map(function($c) {
                $c->total_spent = (float)$c->total_spent;
                $c->order_count = (int)$c->order_count;
                $c->avg_order_value = (float)$c->avg_order_value;
                return $c;
            });

        // 2. Returns analysis
        $mostReturns = DB::table('return_vouchers')
            ->join('customers', 'return_vouchers.customer_id', '=', 'customers.id')
            ->select(
                'customers.id',
                'customers.name',
                DB::raw('SUM(return_vouchers.monetary_value) as total_returned_value'),
                DB::raw('SUM(return_vouchers.quantity) as total_returned_qty'),
                DB::raw('COUNT(return_vouchers.id) as return_count')
            )
            ->whereBetween('return_vouchers.return_date', [$startDate, $endDate])
            ->when($customerId, fn($q) => $q->where('return_vouchers.customer_id', $customerId))
            ->groupBy('customers.id', 'customers.name')
            ->orderBy('total_returned_value', 'desc')
            ->get()
            ->map(function($c) {
                $c->total_returned_value = (float)$c->total_returned_value;
                $c->total_returned_qty = (float)$c->total_returned_qty;
                $c->return_count = (int)$c->return_count;
                return $c;
            });

        // 3. Product mix & what products were taken out most by which customer
        $productMix = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select(
                'products.id as product_id',
                'products.name as product_name',
                'products.code as product_code',
                'products.category as product_category',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.line_total) as total_revenue')
            )
            ->whereBetween('orders.order_date', [$startDate, $endDate])
            ->where('orders.status', '!=', 'cancelled')
            ->when($customerId, fn($q) => $q->where('orders.customer_id', $customerId))
            ->groupBy('products.id', 'products.name', 'products.code', 'products.category')
            ->orderBy('total_quantity', 'desc')
            ->get()
            ->map(function($p) use ($startDate, $endDate, $customerId) {
                $p->total_quantity = (float)$p->total_quantity;
                $p->total_revenue = (float)$p->total_revenue;

                // Identify the top consuming customer for this product
                if (!$customerId) {
                    $topCustomer = DB::table('order_items')
                        ->join('orders', 'order_items.order_id', '=', 'orders.id')
                        ->join('customers', 'orders.customer_id', '=', 'customers.id')
                        ->select('customers.name', DB::raw('SUM(order_items.quantity) as qty'))
                        ->where('order_items.product_id', $p->product_id)
                        ->whereBetween('orders.order_date', [$startDate, $endDate])
                        ->where('orders.status', '!=', 'cancelled')
                        ->groupBy('customers.name')
                        ->orderBy('qty', 'desc')
                        ->first();
                    $p->top_customer_name = $topCustomer ? $topCustomer->name : 'N/A';
                    $p->top_customer_qty = $topCustomer ? (float)$topCustomer->qty : 0.0;
                } else {
                    $p->top_customer_name = 'Selected Customer';
                    $p->top_customer_qty = $p->total_quantity;
                }

                return $p;
            });

        // 4. Ordering Patterns & Predictions
        // To compute this, we need all customers (or selected customer) that have ordered
        $targetCustomers = \App\Models\Customer::when($customerId, fn($q) => $q->where('id', $customerId))
            ->get();

        $predictions = [];
        foreach ($targetCustomers as $customer) {
            $orders = Order::where('customer_id', $customer->id)
                ->where('status', '!=', 'cancelled')
                ->orderBy('order_date', 'asc')
                ->get();

            if ($orders->count() < 1) {
                continue;
            }

            // Calculate intervals between orders
            $intervals = [];
            $prevDate = null;
            foreach ($orders as $order) {
                $currDate = \Carbon\Carbon::parse($order->order_date);
                if ($prevDate) {
                    $diff = $currDate->diffInDays($prevDate);
                    // Filter out duplicate order dates or same-day orders to get a clean interval
                    if ($diff > 0) {
                        $intervals[] = $diff;
                    }
                }
                $prevDate = $currDate;
            }

            $avgInterval = count($intervals) > 0 ? (array_sum($intervals) / count($intervals)) : 14.0; // Default to 2 weeks if not enough history
            $avgOrderValue = (float)$orders->avg('total_amount');
            $lastOrder = $orders->last();
            $lastOrderDate = \Carbon\Carbon::parse($lastOrder->order_date);

            // Prediction: Next Order Date
            $predictedNextDate = $lastOrderDate->copy()->addDays(round($avgInterval));
            
            // Demand Trend (Compare average of last 3 orders vs previous orders)
            $orderValues = $orders->pluck('total_amount')->toArray();
            $orderCount = count($orderValues);
            $demandStatus = 'Stable Demand';
            if ($orderCount >= 4) {
                $recentAvg = array_sum(array_slice($orderValues, -2)) / 2;
                $olderAvg = array_sum(array_slice($orderValues, 0, -2)) / ($orderCount - 2);
                if ($recentAvg > $olderAvg * 1.08) {
                    $demandStatus = 'Increasing Demand';
                } elseif ($recentAvg < $olderAvg * 0.92) {
                    $demandStatus = 'Decreasing Demand';
                }
            }

            // Churn Risk
            $daysSincePredicted = now()->diffInDays($predictedNextDate, false);
            // If negative, it means we are past the predicted next order date
            $churnRisk = 'Active';
            if ($daysSincePredicted < -15) {
                $churnRisk = 'High Risk';
            } elseif ($daysSincePredicted < -5) {
                $churnRisk = 'Medium Risk';
            }

            // Calculate predicted next order volume (simple average of items quantity)
            $avgItemsQty = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('orders.customer_id', $customer->id)
                ->where('orders.status', '!=', 'cancelled')
                ->avg('order_items.quantity') ?? 0.0;

            $predictions[] = [
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'avg_interval_days' => round($avgInterval, 1),
                'last_order_date' => $lastOrder->order_date,
                'predicted_next_order_date' => $predictedNextDate->toDateString(),
                'predicted_order_value' => $avgOrderValue,
                'predicted_order_qty' => round((float)$avgItemsQty, 1),
                'demand_status' => $demandStatus,
                'churn_risk' => $churnRisk,
                'days_past_due' => $daysSincePredicted < 0 ? abs($daysSincePredicted) : 0
            ];
        }

        // Sort predictions: put high risk / most imminent first
        usort($predictions, function($a, $b) {
            return $b['days_past_due'] <=> $a['days_past_due'];
        });

        // 5. Outstanding aging balances for these customers
        $outstandingAging = CustomerAccount::join('customers', 'customer_accounts.customer_id', '=', 'customers.id')
            ->select(
                'customers.id',
                'customers.name',
                'customers.credit_terms',
                'customers.credit_limit',
                'customer_accounts.current_balance'
            )
            ->when($customerId, fn($q) => $q->where('customer_accounts.customer_id', $customerId))
            ->get()
            ->map(function($c) {
                $c->credit_limit = (float)$c->credit_limit;
                $c->current_balance = (float)$c->current_balance;
                $c->headroom = max(0.0, $c->credit_limit - $c->current_balance);
                return $c;
            });

        return $this->success([
            'best_performers' => $bestPerformers,
            'most_returns' => $mostReturns,
            'product_mix' => $productMix,
            'predictions' => array_slice($predictions, 0, 10), // Return top 10 for overview
            'outstanding_aging' => $outstandingAging
        ]);
    }
}
