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
        Route::post('/orders/{id}/status', [App\Http\Controllers\Api\V1\OrderController::class, 'updateStatus']);
        
        // Products
        Route::get('/products', [App\Http\Controllers\Api\V1\ProductController::class, 'index']);
        Route::get('/products/{id}', [App\Http\Controllers\Api\V1\ProductController::class, 'show']);
        
        // Customers
        Route::get('/customers', [App\Http\Controllers\Api\V1\CustomerController::class, 'index']);
        Route::get('/customers/{id}', [App\Http\Controllers\Api\V1\CustomerController::class, 'show']);
        
        // Store Transfers
        Route::get('/store-transfers', [App\Http\Controllers\Api\V1\StoreTransferController::class, 'index']);
        Route::post('/store-transfers', [App\Http\Controllers\Api\V1\StoreTransferController::class, 'store']);
        
        // Deliveries
        Route::get('/deliveries', [App\Http\Controllers\Api\V1\DeliveryController::class, 'index']);
        Route::post('/deliveries/assign', [App\Http\Controllers\Api\V1\DeliveryController::class, 'assign']);
        Route::post('/deliveries/{id}/confirm', [App\Http\Controllers\Api\V1\DeliveryController::class, 'confirm']);
        
        // Payments
        Route::get('/payments', [App\Http\Controllers\Api\V1\PaymentController::class, 'index']);
        Route::post('/payments', [App\Http\Controllers\Api\V1\PaymentController::class, 'store']);
        
        // Customer Accounts
        Route::get('/accounts/summary', [App\Http\Controllers\Api\V1\CustomerAccountController::class, 'summary']);
        Route::get('/accounts/{customerId}', [App\Http\Controllers\Api\V1\CustomerAccountController::class, 'show']);
        Route::get('/accounts/{customerId}/ledger', [App\Http\Controllers\Api\V1\CustomerAccountController::class, 'ledger']);
        
        // Production Store
        Route::get('/production-stock', [App\Http\Controllers\Api\V1\ProductionStoreStockController::class, 'index']);
        Route::get('/production-stock/snapshots', [App\Http\Controllers\Api\V1\ProductionStoreStockController::class, 'snapshots']);
        Route::post('/production-stock/snapshots', [App\Http\Controllers\Api\V1\ProductionStoreStockController::class, 'createSnapshot']);
        Route::put('/production-stock/{id}', [App\Http\Controllers\Api\V1\ProductionStoreStockController::class, 'update']);
        Route::delete('/production-stock/{id}', [App\Http\Controllers\Api\V1\ProductionStoreStockController::class, 'destroy']);
        Route::get('/production-intakes', [App\Http\Controllers\Api\V1\ProductionStoreIntakeController::class, 'index']);
        Route::post('/production-intakes', [App\Http\Controllers\Api\V1\ProductionStoreIntakeController::class, 'store']);
        
        // Notifications
        Route::get('/notifications', [App\Http\Controllers\Api\V1\NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [App\Http\Controllers\Api\V1\NotificationController::class, 'markAsRead']);
        Route::post('/notifications/read-all', [App\Http\Controllers\Api\V1\NotificationController::class, 'markAllAsRead']);
        
        // Reports
        Route::get('/reports/sales-summary', [App\Http\Controllers\Api\V1\ReportController::class, 'salesSummary']);
        Route::get('/reports/aging', [App\Http\Controllers\Api\V1\ReportController::class, 'agingReport']);
        Route::get('/reports/driver-performance', [App\Http\Controllers\Api\V1\ReportController::class, 'driverPerformance']);
        
        // Other module routes will go here
    });
});
