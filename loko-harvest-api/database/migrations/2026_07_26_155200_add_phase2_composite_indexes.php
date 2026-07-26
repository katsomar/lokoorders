<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for Phase 2 Database Performance Indexes.
     */
    public function up(): void
    {
        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->index(['sales_store_id', 'product_id', 'batch_reference'], 'idx_sales_stock_lookup');
        });


        Schema::table('orders', function (Blueprint $table) {
            $table->index(['status', 'order_date'], 'idx_orders_status_date');
            $table->index(['sales_store_id', 'status'], 'idx_orders_store_status');
        });

        Schema::table('sales_store_movements', function (Blueprint $table) {
            $table->index(['sales_store_id', 'movement_date'], 'idx_sales_movement_store_date');
        });

        Schema::table('account_transactions', function (Blueprint $table) {
            $table->index(['customer_id', 'transaction_date'], 'idx_account_trans_cust_date');
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $table->index(['driver_id', 'status'], 'idx_deliveries_driver_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->dropIndex('idx_sales_stock_lookup');
        });


        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_status_date');
            $table->dropIndex('idx_orders_store_status');
        });

        Schema::table('sales_store_movements', function (Blueprint $table) {
            $table->dropIndex('idx_sales_movement_store_date');
        });

        Schema::table('account_transactions', function (Blueprint $table) {
            $table->dropIndex('idx_account_trans_cust_date');
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropIndex('idx_deliveries_driver_status');
        });
    }
};
