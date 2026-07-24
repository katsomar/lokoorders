<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. production_store_stock
        Schema::table('production_store_stock', function (Blueprint $table) {
            $table->index(['production_store_id', 'product_id', 'batch_reference'], 'prod_stock_lookup');
        });

        // 2. sales_store_stock
        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->index(['sales_store_id', 'product_id', 'batch_reference'], 'sales_stock_lookup');
        });

        // 3. production_store_intakes
        Schema::table('production_store_intakes', function (Blueprint $table) {
            $table->index(['production_store_id', 'product_id', 'intake_date'], 'prod_intake_lookup');
            $table->index('batch_reference', 'prod_intake_batch');
        });

        // 4. production_store_transfers
        Schema::table('production_store_transfers', function (Blueprint $table) {
            $table->index(['from_production_store_id', 'to_production_store_id', 'transfer_date'], 'prod_transfer_lookup');
            $table->index('batch_reference', 'prod_transfer_batch');
        });

        // 5. sales_store_movements
        Schema::table('sales_store_movements', function (Blueprint $table) {
            $table->index(['sales_store_id', 'movement_date'], 'sales_movement_lookup');
            $table->index('batch_reference', 'sales_movement_batch');
        });

        // 6. sales_store_transfers
        Schema::table('sales_store_transfers', function (Blueprint $table) {
            $table->index(['from_sales_store_id', 'to_sales_store_id', 'transfer_date'], 'sales_transfer_lookup');
            $table->index('batch_reference', 'sales_transfer_batch');
        });

        // 7. sales_store_conversions
        Schema::table('sales_store_conversions', function (Blueprint $table) {
            $table->index(['sales_store_id', 'status', 'created_at'], 'sales_conversion_lookup');
            $table->index('batch_reference', 'sales_conversion_batch');
        });

        // 8. store_transfers
        Schema::table('store_transfers', function (Blueprint $table) {
            $table->index(['production_store_id', 'sales_store_id', 'status', 'transfer_date'], 'store_transfer_lookup');
            $table->index('batch_reference', 'store_transfer_batch');
        });

        // 9. store_adjustments
        Schema::table('store_adjustments', function (Blueprint $table) {
            $table->index(['store_type', 'status', 'created_at'], 'store_adj_lookup');
            $table->index('batch_reference', 'store_adj_batch');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('production_store_stock', function (Blueprint $table) {
            $table->dropIndex('prod_stock_lookup');
        });

        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->dropIndex('sales_stock_lookup');
        });

        Schema::table('production_store_intakes', function (Blueprint $table) {
            $table->dropIndex('prod_intake_lookup');
            $table->dropIndex('prod_intake_batch');
        });

        Schema::table('production_store_transfers', function (Blueprint $table) {
            $table->dropIndex('prod_transfer_lookup');
            $table->dropIndex('prod_transfer_batch');
        });

        Schema::table('sales_store_movements', function (Blueprint $table) {
            $table->dropIndex('sales_movement_lookup');
            $table->dropIndex('sales_movement_batch');
        });

        Schema::table('sales_store_transfers', function (Blueprint $table) {
            $table->dropIndex('sales_transfer_lookup');
            $table->dropIndex('sales_transfer_batch');
        });

        Schema::table('sales_store_conversions', function (Blueprint $table) {
            $table->dropIndex('sales_conversion_lookup');
            $table->dropIndex('sales_conversion_batch');
        });

        Schema::table('store_transfers', function (Blueprint $table) {
            $table->dropIndex('store_transfer_lookup');
            $table->dropIndex('store_transfer_batch');
        });

        Schema::table('store_adjustments', function (Blueprint $table) {
            $table->dropIndex('store_adj_lookup');
            $table->dropIndex('store_adj_batch');
        });
    }
};
