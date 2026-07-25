<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

DB::listen(function($query) {
    echo "SQL: {$query->sql} | Bindings: " . json_encode($query->bindings) . " | Time: {$query->time}ms\n";
});

$request = request();
$request->merge(['status' => 'pending', 'per_page' => 100]);

echo "--- Profiling Pending Store Transfers ---\n";
$start = microtime(true);
$response = app(App\Http\Controllers\Api\V1\StoreTransferController::class)->index($request);
if (method_exists($response, 'getContent')) {
    $response->getContent();
}
echo "Total Controller Time: " . ((microtime(true) - $start) * 1000) . "ms\n\n";

echo "--- Profiling Pending Store Adjustments ---\n";
$start = microtime(true);
$response = app(App\Http\Controllers\Api\V1\StoreAdjustmentController::class)->index($request);
if (method_exists($response, 'getContent')) {
    $response->getContent();
}
echo "Total Controller Time: " . ((microtime(true) - $start) * 1000) . "ms\n\n";

echo "--- Profiling Pending Sales Store Conversions ---\n";
$start = microtime(true);
$response = app(App\Http\Controllers\Api\V1\SalesStoreConversionController::class)->index($request);
if (method_exists($response, 'getContent')) {
    $response->getContent();
}
echo "Total Controller Time: " . ((microtime(true) - $start) * 1000) . "ms\n\n";

echo "--- Profiling Admin Dashboard ---\n";
$start = microtime(true);
$response = app(App\Http\Controllers\Api\V1\DashboardController::class)->adminDashboard($request);
if (method_exists($response, 'getContent')) {
    $response->getContent();
}
echo "Total Controller Time: " . ((microtime(true) - $start) * 1000) . "ms\n\n";
