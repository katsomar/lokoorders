<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "Rejecting all pending requests across Transfers, Adjustments, and Conversions..." . PHP_EOL;

$rejectedTransfers = 0;
if (Schema::hasTable('store_transfers')) {
    $rejectedTransfers = DB::table('store_transfers')
        ->where('status', 'pending')
        ->update([
            'status' => 'rejected',
            'updated_at' => now(),
        ]);
}

$rejectedAdjustments = 0;
if (Schema::hasTable('store_adjustments')) {
    $rejectedAdjustments = DB::table('store_adjustments')
        ->where('status', 'pending')
        ->update([
            'status' => 'rejected',
            'updated_at' => now(),
        ]);
}

$rejectedConversions = 0;
if (Schema::hasTable('sales_store_conversions')) {
    $rejectedConversions = DB::table('sales_store_conversions')
        ->where('status', 'pending')
        ->update([
            'status' => 'rejected',
            'updated_at' => now(),
        ]);
}

echo "SUCCESS! Rejected all pending requests:" . PHP_EOL;
echo "  - Transfers Rejected: {$rejectedTransfers}" . PHP_EOL;
echo "  - Adjustments Rejected: {$rejectedAdjustments}" . PHP_EOL;
echo "  - Conversions Rejected: {$rejectedConversions}" . PHP_EOL;
