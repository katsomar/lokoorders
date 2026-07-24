<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$tables = [
    'products',
    'production_stores',
    'production_store_stock',
    'production_store_intakes',
    'production_store_transfers',
    'sales_stores',
    'sales_store_stock',
    'sales_store_movements',
    'sales_store_transfers',
    'sales_store_conversions',
    'store_transfers',
    'store_adjustments',
    'orders',
    'order_items'
];

echo "--- Table Row Counts ---\n";
foreach ($tables as $table) {
    try {
        $count = DB::table($table)->count();
        echo str_pad($table, 30) . ": $count rows\n";
    } catch (\Exception $e) {
        echo str_pad($table, 30) . ": Error counting (" . $e->getMessage() . ")\n";
    }
}
