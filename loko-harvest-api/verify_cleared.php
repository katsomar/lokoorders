<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$checkTables = [
    'daily_store_snapshots',
    'production_store_stocks',
    'production_store_stock',
    'production_store_movements',
    'farm_intakes',
    'sales_store_stocks',
    'sales_store_stock',
    'sales_store_movements',
    'packaging_conversions',
    'store_transfers',
    'store_adjustments',
    'orders',
    'invoices',
    'payments',
    'account_transactions',
];

echo "VERIFYING CLEARED STATE:" . PHP_EOL;
foreach ($checkTables as $t) {
    if (\Illuminate\Support\Facades\Schema::hasTable($t)) {
        $count = DB::table($t)->count();
        echo "  - Table '{$t}': {$count} rows." . PHP_EOL;
    }
}
