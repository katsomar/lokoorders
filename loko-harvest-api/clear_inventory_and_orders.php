<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "Clearing Production Store, Sales Store, Orders, Deliveries, Invoices, Payments, and Ledger Data..." . PHP_EOL;

Schema::disableForeignKeyConstraints();

$tables = [
    'payment_invoice_allocations',
    'account_transactions',
    'payments',
    'delivery_proofs',
    'deliveries',
    'invoices',
    'order_status_histories',
    'order_status_history',
    'order_items',
    'orders',
    'sales_store_movements',
    'sales_store_stocks',
    'packaging_conversions',
    'store_transfers',
    'store_adjustments',
    'production_store_movements',
    'production_store_stocks',
    'farm_intakes',
];

foreach ($tables as $t) {
    if (Schema::hasTable($t)) {
        DB::table($t)->truncate();
    }
}

if (Schema::hasTable('customer_accounts')) {
    DB::table('customer_accounts')->update([
        'current_balance' => 0.00,
        'total_invoiced' => 0.00,
        'total_paid' => 0.00,
        'updated_at' => now(),
    ]);
}

Schema::enableForeignKeyConstraints();

echo "SUCCESS! Production Store, Sales Store, Orders, and Accounting ledgers have been completely cleared and reset to fresh state!" . PHP_EOL;
