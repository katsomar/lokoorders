<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [App\Http\Controllers\Api\V1\AuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [App\Http\Controllers\Api\V1\AuthController::class, 'logout']);
        Route::get('/auth/me', [App\Http\Controllers\Api\V1\AuthController::class, 'me']);
        
        // Orders
        Route::get('/orders', [App\Http\Controllers\Api\V1\OrderController::class, 'index']);
        Route::post('/orders', [App\Http\Controllers\Api\V1\OrderController::class, 'store']);
        Route::get('/orders/{id}', [App\Http\Controllers\Api\V1\OrderController::class, 'show']);
        Route::put('/orders/{id}', [App\Http\Controllers\Api\V1\OrderController::class, 'update']);
        Route::delete('/orders/{id}', [App\Http\Controllers\Api\V1\OrderController::class, 'destroy']);
        Route::post('/orders/{id}/status', [App\Http\Controllers\Api\V1\OrderController::class, 'updateStatus']);

        
        // Products
        Route::get('/products', [App\Http\Controllers\Api\V1\ProductController::class, 'index']);
        Route::get('/products/{id}', [App\Http\Controllers\Api\V1\ProductController::class, 'show']);
        Route::put('/products/{id}', [App\Http\Controllers\Api\V1\ProductController::class, 'update']);
        
        // Customers
        Route::get('/customers', [App\Http\Controllers\Api\V1\CustomerController::class, 'index']);
        Route::post('/customers', [App\Http\Controllers\Api\V1\CustomerController::class, 'store']);
        Route::get('/customers/{id}', [App\Http\Controllers\Api\V1\CustomerController::class, 'show']);
        Route::put('/customers/{id}', [App\Http\Controllers\Api\V1\CustomerController::class, 'update']);
        Route::delete('/customers/{id}', [App\Http\Controllers\Api\V1\CustomerController::class, 'destroy']);
        Route::get('/customers/{id}/consumption-analysis', [App\Http\Controllers\Api\V1\CustomerController::class, 'consumptionAnalysis']);
        Route::get('/delivery-zones', [App\Http\Controllers\Api\V1\CustomerController::class, 'zones']);
        
        // Store Transfers
        Route::get('/store-transfers', [App\Http\Controllers\Api\V1\StoreTransferController::class, 'index']);
        Route::post('/store-transfers', [App\Http\Controllers\Api\V1\StoreTransferController::class, 'store']);
        
        // Deliveries
        Route::get('/deliveries', [App\Http\Controllers\Api\V1\DeliveryController::class, 'index']);
        Route::post('/deliveries/assign', [App\Http\Controllers\Api\V1\DeliveryController::class, 'assign']);
        Route::post('/deliveries/{id}/confirm', [App\Http\Controllers\Api\V1\DeliveryController::class, 'confirm']);
        Route::post('/deliveries/{id}/transit', [App\Http\Controllers\Api\V1\DeliveryController::class, 'transit']);
        
        // Payments
        Route::get('/payments', [App\Http\Controllers\Api\V1\PaymentController::class, 'index']);
        Route::post('/payments', [App\Http\Controllers\Api\V1\PaymentController::class, 'store']);

        // Invoices
        Route::get('/invoices', [App\Http\Controllers\Api\V1\InvoiceController::class, 'index']);
        Route::get('/invoices/{id}', [App\Http\Controllers\Api\V1\InvoiceController::class, 'show']);
        
        // Customer Accounts
        Route::get('/accounts/summary', [App\Http\Controllers\Api\V1\CustomerAccountController::class, 'summary']);
        Route::get('/accounts/{customerId}', [App\Http\Controllers\Api\V1\CustomerAccountController::class, 'show']);
        Route::get('/accounts/{customerId}/ledger', [App\Http\Controllers\Api\V1\CustomerAccountController::class, 'ledger']);
        
        // Production Store
        Route::apiResource('production-stores', App\Http\Controllers\Api\V1\ProductionStoreController::class);
        Route::get('/production-store-transfers', [App\Http\Controllers\Api\V1\ProductionStoreTransferController::class, 'index']);
        Route::post('/production-store-transfers', [App\Http\Controllers\Api\V1\ProductionStoreTransferController::class, 'store']);

        Route::get('/production-stock', [App\Http\Controllers\Api\V1\ProductionStoreStockController::class, 'index']);
        Route::get('/production-stock/snapshots', [App\Http\Controllers\Api\V1\ProductionStoreStockController::class, 'snapshots']);
        Route::post('/production-stock/snapshots', [App\Http\Controllers\Api\V1\ProductionStoreStockController::class, 'createSnapshot']);
        Route::put('/production-stock/{id}', [App\Http\Controllers\Api\V1\ProductionStoreStockController::class, 'update']);
        Route::delete('/production-stock/{id}', [App\Http\Controllers\Api\V1\ProductionStoreStockController::class, 'destroy']);
        Route::get('/production-intakes', [App\Http\Controllers\Api\V1\ProductionStoreIntakeController::class, 'index']);
        Route::post('/production-intakes', [App\Http\Controllers\Api\V1\ProductionStoreIntakeController::class, 'store']);
        
        // Sales Store
        Route::apiResource('sales-stores', App\Http\Controllers\Api\V1\SalesStoreController::class);
        Route::get('/sales-store-transfers', [App\Http\Controllers\Api\V1\SalesStoreTransferController::class, 'index']);
        Route::post('/sales-store-transfers', [App\Http\Controllers\Api\V1\SalesStoreTransferController::class, 'store']);
        Route::get('/sales-store-sales', [App\Http\Controllers\Api\V1\SalesStoreSalesController::class, 'index']);

        Route::get('/sales-stock', [App\Http\Controllers\Api\V1\SalesStoreStockController::class, 'index']);
        Route::get('/sales-movements', [App\Http\Controllers\Api\V1\SalesStoreStockController::class, 'movements']);
        Route::get('/sales-store-conversions', [App\Http\Controllers\Api\V1\SalesStoreConversionController::class, 'index']);
        Route::post('/sales-store-conversions', [App\Http\Controllers\Api\V1\SalesStoreConversionController::class, 'store']);
        
        // Notifications
        Route::get('/notifications', [App\Http\Controllers\Api\V1\NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [App\Http\Controllers\Api\V1\NotificationController::class, 'markAsRead']);
        Route::post('/notifications/read-all', [App\Http\Controllers\Api\V1\NotificationController::class, 'markAllAsRead']);
        
        // Reports
        Route::get('/reports/sales-summary', [App\Http\Controllers\Api\V1\ReportController::class, 'salesSummary']);
        Route::get('/reports/aging', [App\Http\Controllers\Api\V1\ReportController::class, 'agingReport']);
        Route::get('/reports/driver-performance', [App\Http\Controllers\Api\V1\ReportController::class, 'driverPerformance']);
        
        // Drivers & Vehicles
        Route::get('/drivers', [App\Http\Controllers\Api\V1\DriverController::class, 'index']);
        Route::post('/drivers', [App\Http\Controllers\Api\V1\DriverController::class, 'store']);
        Route::put('/drivers/{id}', [App\Http\Controllers\Api\V1\DriverController::class, 'update']);
        Route::delete('/drivers/{id}', [App\Http\Controllers\Api\V1\DriverController::class, 'destroy']);
        Route::get('/drivers/{id}/shifts', [App\Http\Controllers\Api\V1\DriverController::class, 'shifts']);
        Route::get('/vehicles', [App\Http\Controllers\Api\V1\VehicleController::class, 'index']);
        Route::post('/vehicles', [App\Http\Controllers\Api\V1\VehicleController::class, 'store']);
        Route::put('/vehicles/{id}/logistics', [App\Http\Controllers\Api\V1\VehicleController::class, 'updateLogistics']);
        Route::delete('/vehicles/{id}', [App\Http\Controllers\Api\V1\VehicleController::class, 'destroy']);

        // Other module routes will go here
    });
});
