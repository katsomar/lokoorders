<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\DriverShift;
use App\Models\Driver;
use App\Models\Payment;
use App\Models\CustomerAccount;
use App\Models\ReturnVoucher;
use App\Models\ProductionStoreStock;
use App\Models\SalesStoreStock;
use App\Models\StoreTransfer;
use App\Models\Delivery;
use App\Models\Product;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    use ApiResponses;

    public function adminDashboard(Request $request)
    {
        // 1. Fulfillment Operations KPI
        $activeOrdersStatuses = ['pending', 'processing', 'ready_for_dispatch', 'dispatched'];
        $activeOrdersCount = Order::whereIn('status', $activeOrdersStatuses)->count();
        
        $todayNewOrdersCount = Order::whereDate('order_date', Carbon::today())->count();
        $activeDriversCount = DriverShift::whereNull('end_time')
            ->whereDate('shift_date', Carbon::today())
            ->count();
        
        // If 0 active shifts logged today, fallback to count of active drivers in driver portal
        if ($activeDriversCount === 0) {
            $activeDriversCount = Driver::where('employment_status', 'active')->count();
        }

        // Deliveries completed in the last 24 hours
        $completedTodayCount = Order::where('status', 'delivered')
            ->where('updated_at', '>=', now()->subHours(24))
            ->count();
        
        $pendingDispatchCount = Order::whereIn('status', ['pending', 'processing', 'ready_for_dispatch'])->count();
        $returnedVouchersCount = ReturnVoucher::whereDate('return_date', Carbon::today())->count();

        // If returned vouchers today is 0, let's show total count of return vouchers this month to make the chart populated
        if ($returnedVouchersCount === 0) {
            $returnedVouchersCount = ReturnVoucher::whereMonth('return_date', Carbon::today()->month)
                ->whereYear('return_date', Carbon::today()->year)
                ->count();
        }

        // Fulfillment Operations trend (Order volume today vs yesterday)
        $yesterdayNewOrdersCount = Order::whereDate('order_date', Carbon::yesterday())->count();
        $fulfillmentTrendValue = 0;
        if ($yesterdayNewOrdersCount > 0) {
            $fulfillmentTrendValue = round((($todayNewOrdersCount - $yesterdayNewOrdersCount) / $yesterdayNewOrdersCount) * 100);
        } else if ($todayNewOrdersCount > 0) {
            $fulfillmentTrendValue = 100; // 100% up if yesterday had 0 orders
        }

        // 2. Revenue & Collections KPI MTD
        $startOfMonth = Carbon::today()->startOfMonth()->toDateString();
        $endOfMonth = Carbon::today()->endOfMonth()->toDateString();

        $mtdCollections = (float)Payment::whereBetween('payment_date', [$startOfMonth, $endOfMonth])->sum('amount');
        
        // Last month collections for trend calculation
        $startOfLastMonth = Carbon::today()->subMonth()->startOfMonth()->toDateString();
        $endOfLastMonth = Carbon::today()->subMonth()->endOfMonth()->toDateString();
        $lastMonthCollections = (float)Payment::whereBetween('payment_date', [$startOfLastMonth, $endOfLastMonth])->sum('amount');
        
        $collectionsTrendValue = 0;
        if ($lastMonthCollections > 0) {
            $collectionsTrendValue = round((($mtdCollections - $lastMonthCollections) / $lastMonthCollections) * 100);
        } else if ($mtdCollections > 0) {
            $collectionsTrendValue = 100;
        }

        // Outstanding Customer Receivables
        $pendingAccountCredits = (float)CustomerAccount::sum('current_balance');

        // Top outstanding ledgers for sub-breakdown
        $topOutstandingLedgers = CustomerAccount::with('customer')
            ->where('current_balance', '>', 0)
            ->orderByDesc('current_balance')
            ->take(3)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->customer->name ?? 'Unknown Customer',
                    'value' => 'UGX ' . number_format($item->current_balance),
                ];
            });

        // 3. Order Status Distribution (Percentage distribution for current month)
        $monthOrdersCount = Order::whereMonth('order_date', Carbon::today()->month)
            ->whereYear('order_date', Carbon::today()->year)
            ->count();

        if ($monthOrdersCount === 0) {
            $dbStatusCounts = Order::select('status', DB::raw('count(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status');
        } else {
            $dbStatusCounts = Order::whereMonth('order_date', Carbon::today()->month)
                ->whereYear('order_date', Carbon::today()->year)
                ->select('status', DB::raw('count(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status');
        }

        $statusCounts = [
            'Delivered' => (int)($dbStatusCounts['delivered'] ?? 0),
            'Pending' => (int)($dbStatusCounts['pending'] ?? 0),
            'Dispatched' => (int)($dbStatusCounts['dispatched'] ?? 0),
            'Processing' => (int)($dbStatusCounts['processing'] ?? 0) + (int)($dbStatusCounts['ready_for_dispatch'] ?? 0),
            'Returned' => 0
        ];

        // Returned is based on returned vouchers count
        $statusCounts['Returned'] = ReturnVoucher::whereMonth('return_date', Carbon::today()->month)
            ->whereYear('return_date', Carbon::today()->year)
            ->count();
        
        // If total is 0, give a default split so charts don't look empty, otherwise calculate percentage
        $totalDistribution = array_sum($statusCounts);
        $statusData = [];
        $colors = [
            'Delivered' => '#16A34A',
            'Pending' => '#F5A800',
            'Dispatched' => '#2563EB',
            'Processing' => '#8B5CF6',
            'Returned' => '#E11D48'
        ];

        foreach ($statusCounts as $statusName => $count) {
            $percentage = $totalDistribution > 0 ? round(($count / $totalDistribution) * 100) : 0;
            $statusData[] = [
                'name' => $statusName,
                'value' => $percentage,
                'color' => $colors[$statusName]
            ];
        }

        // 4. Revenue Trends (Last 30 Days) - Optimized to run only 2 grouped queries instead of 60 separate queries
        $thirtyDaysAgo = Carbon::today()->subDays(29)->startOfDay()->toDateString();

        $ordersSumByDate = Order::where('order_date', '>=', $thirtyDaysAgo)
            ->select('order_date', DB::raw('SUM(total_amount) as total'))
            ->groupBy('order_date')
            ->pluck('total', 'order_date');

        $paymentsSumByDate = Payment::where('payment_date', '>=', $thirtyDaysAgo)
            ->select('payment_date', DB::raw('SUM(amount) as total'))
            ->groupBy('payment_date')
            ->pluck('total', 'payment_date');

        $revenueTrend = [];
        for ($i = 29; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dateStr = $date->toDateString();
            $label = $date->format('d M');

            $invoiced = (float)($ordersSumByDate[$dateStr] ?? 0);
            $collected = (float)($paymentsSumByDate[$dateStr] ?? 0);

            $revenueTrend[] = [
                'name' => $label,
                'collected' => $collected,
                'invoiced' => $invoiced
            ];
        }

        // 5. Warehouse Inventory Valuation
        // Bulk Trays: Production stock
        $productionValuation = (float)ProductionStoreStock::join('products', 'production_store_stock.product_id', '=', 'products.id')
            ->sum(DB::raw('production_store_stock.current_quantity * COALESCE(production_store_stock.valuation_price, products.default_unit_price)'));

        // Packaged Eggs: Sales stock where category is 'eggs'
        $salesEggsValuation = (float)SalesStoreStock::join('products', 'sales_store_stock.product_id', '=', 'products.id')
            ->where('products.category', 'eggs')
            ->sum(DB::raw('sales_store_stock.current_quantity * products.default_unit_price'));

        // Poultry & Feed Value: sales stock + production stock where category is 'poultry' or 'by_products'
        $poultryAndByProductsValuation = (float)SalesStoreStock::join('products', 'sales_store_stock.product_id', '=', 'products.id')
            ->whereIn('products.category', ['poultry', 'by_products'])
            ->sum(DB::raw('sales_store_stock.current_quantity * products.default_unit_price'))
            + (float)ProductionStoreStock::join('products', 'production_store_stock.product_id', '=', 'products.id')
            ->whereIn('products.category', ['poultry', 'by_products'])
            ->sum(DB::raw('production_store_stock.current_quantity * COALESCE(production_store_stock.valuation_price, products.default_unit_price)'));

        $totalWarehouseValuation = $productionValuation + $salesEggsValuation + $poultryAndByProductsValuation;

        // 6. Top Customers by Outstanding Balance
        $topCustomers = CustomerAccount::join('customers', 'customer_accounts.customer_id', '=', 'customers.id')
            ->where('customer_accounts.current_balance', '>', 0)
            ->orderByDesc('customer_accounts.current_balance')
            ->take(5)
            ->select('customers.name', 'customer_accounts.current_balance as balance')
            ->get()
            ->map(function ($item) {
                $item->balance = (float)$item->balance;
                return $item;
            });

        // 7. Live System Feed
        $feed = collect();

        // Recent orders
        $recentOrders = Order::with('customer')
            ->latest()
            ->take(5)
            ->get();
        foreach ($recentOrders as $order) {
            $feed->push([
                'id' => 'order_' . $order->id,
                'type' => 'order',
                'text' => "New order {$order->order_number} placed by " . ($order->customer->name ?? 'Unknown Customer'),
                'created_at' => $order->created_at->toIso8601String(),
            ]);
        }

        // Recent deliveries
        $recentDeliveries = Delivery::with(['order.customer', 'driver.user'])
            ->where('status', 'delivered')
            ->latest()
            ->take(5)
            ->get();
        foreach ($recentDeliveries as $delivery) {
            $driverName = $delivery->driver->user->name ?? 'Fleet Driver';
            $orderNo = $delivery->order->order_number ?? 'LHO-Order';
            $feed->push([
                'id' => 'delivery_' . $delivery->id,
                'type' => 'delivery',
                'text' => "Driver {$driverName} confirmed delivery for {$orderNo}",
                'created_at' => $delivery->updated_at ? $delivery->updated_at->toIso8601String() : $delivery->created_at->toIso8601String(),
            ]);
        }

        // Recent payments
        $recentPayments = Payment::with('customer')
            ->latest()
            ->take(5)
            ->get();
        foreach ($recentPayments as $payment) {
            $amtFormatted = number_format($payment->amount);
            $feed->push([
                'id' => 'payment_' . $payment->id,
                'type' => 'payment',
                'text' => "Payment of UGX {$amtFormatted} received from " . ($payment->customer->name ?? 'Customer'),
                'created_at' => $payment->created_at->toIso8601String(),
            ]);
        }

        // Recent stock transfers
        $recentTransfers = StoreTransfer::with(['product'])
            ->latest()
            ->take(5)
            ->get();
        foreach ($recentTransfers as $transfer) {
            $qty = (int)$transfer->quantity;
            $unit = $transfer->product->unit_of_measure ?? 'trays';
            $prodName = $transfer->product->name ?? 'Products';
            $feed->push([
                'id' => 'transfer_' . $transfer->id,
                'type' => 'stock',
                'text' => "Transfer of {$qty} {$unit} ({$prodName}) to Sales Store",
                'created_at' => $transfer->created_at->toIso8601String(),
            ]);
        }

        // Recent return vouchers
        $recentReturns = ReturnVoucher::with('customer')
            ->latest()
            ->take(5)
            ->get();
        foreach ($recentReturns as $ret) {
            $feed->push([
                'id' => 'return_' . $ret->id,
                'type' => 'return',
                'text' => "Return voucher {$ret->voucher_number} raised for " . ($ret->customer->name ?? 'Customer'),
                'created_at' => $ret->created_at->toIso8601String(),
            ]);
        }

        // Sort compiled feed descending by timestamp and take top 5
        $activityFeed = $feed->sortByDesc('created_at')->values()->take(5)->map(function ($item) {
            // Include formatted dynamic relative time if possible, or pass ISO format to let UI calculate
            return $item;
        });

        // Assemble Dashboard payload
        $dashboardData = [
            'fulfillment' => [
                'active_orders' => $activeOrdersCount,
                'today_new_orders' => $todayNewOrdersCount,
                'active_drivers' => $activeDriversCount,
                'completed_today' => $completedTodayCount,
                'pending_dispatch' => $pendingDispatchCount,
                'returned_vouchers' => $returnedVouchersCount,
                'trend' => [
                    'value' => abs($fulfillmentTrendValue),
                    'isUp' => $fulfillmentTrendValue >= 0
                ]
            ],
            'financials' => [
                'total_collections' => $mtdCollections,
                'pending_credits' => $pendingAccountCredits,
                'top_claims' => $topOutstandingLedgers,
                'trend' => [
                    'value' => abs($collectionsTrendValue),
                    'isUp' => $collectionsTrendValue >= 0
                ]
            ],
            'status_distribution' => $statusData,
            'revenue_trend' => $revenueTrend,
            'warehouse' => [
                'total_value' => $totalWarehouseValuation,
                'production_value' => $productionValuation,
                'sales_value' => $salesEggsValuation,
                'reserve_value' => $poultryAndByProductsValuation,
            ],
            'top_customers' => $topCustomers,
            'activity_feed' => $activityFeed
        ];

        return $this->success($dashboardData);
    }
}
