<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Checking all non-pending orders..." . PHP_EOL;

$orders = \App\Models\Order::whereIn('status', ['processing', 'ready_for_dispatch', 'dispatched', 'on_route', 'delivered'])->get();
echo "Found " . $orders->count() . " non-pending orders." . PHP_EOL;

foreach ($orders as $order) {
    if (!$order->invoice()->exists()) {
        echo "Committing order {$order->order_number} for customer {$order->customer?->name} (Amount: UGX " . number_format($order->total_amount) . ")..." . PHP_EOL;
        try {
            $order->commitOrder("Stock Out Fulfillment Override");
            echo "  -> Success! Invoice generated & balance updated." . PHP_EOL;
        } catch (\Throwable $e) {
            echo "  -> Error: " . $e->getMessage() . PHP_EOL;
        }
    } else {
        echo "Order {$order->order_number} already has invoice." . PHP_EOL;
    }
}

echo PHP_EOL . "Recalculating all customer account balances..." . PHP_EOL;
$customers = \App\Models\Customer::all();
foreach ($customers as $cust) {
    $account = \App\Models\CustomerAccount::firstOrCreate(
        ['customer_id' => $cust->id],
        ['current_balance' => 0, 'total_invoiced' => 0, 'total_paid' => 0]
    );

    // Total invoiced for this customer
    $totalInvoiced = (float) \App\Models\Invoice::where('customer_id', $cust->id)->sum('total_amount');

    // Total paid for this customer
    $totalPaid = (float) \App\Models\Payment::where('customer_id', $cust->id)->where('status', 'completed')->sum('amount');

    // Net balance = Invoiced - Paid
    $balance = $totalInvoiced - $totalPaid;

    $account->update([
        'total_invoiced' => $totalInvoiced,
        'total_paid' => $totalPaid,
        'current_balance' => $balance,
    ]);

    echo "Customer: {$cust->name} => Invoiced: UGX " . number_format($totalInvoiced) . " | Paid: UGX " . number_format($totalPaid) . " | Balance: UGX " . number_format($balance) . PHP_EOL;
}

echo PHP_EOL . "SYNC COMPLETE!" . PHP_EOL;
