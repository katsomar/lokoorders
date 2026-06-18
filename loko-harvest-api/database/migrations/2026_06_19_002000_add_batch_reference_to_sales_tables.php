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
        // 1. Update sales_store_stock
        Schema::table('sales_store_stock', function (Blueprint $table) {
            // Drop foreign key and unique constraint first to prevent MySQL foreign key index check fail
            $table->dropForeign(['sales_store_id']);
            $table->dropUnique(['sales_store_id', 'product_id']);
            
            // Add batch_reference column
            $table->string('batch_reference')->nullable()->after('product_id');
            
            // Add unique index on [sales_store_id, product_id, batch_reference]
            $table->unique(['sales_store_id', 'product_id', 'batch_reference'], 'sales_stock_unique_store_product_batch');
            
            // Re-add foreign key
            $table->foreign('sales_store_id')->references('id')->on('sales_stores')->onDelete('cascade');
        });

        // 2. Update store_transfers
        Schema::table('store_transfers', function (Blueprint $table) {
            $table->string('batch_reference')->nullable()->after('product_id');
        });

        // 3. Update sales_store_movements
        Schema::table('sales_store_movements', function (Blueprint $table) {
            $table->string('batch_reference')->nullable()->after('product_id');
        });

        // 4. Update order_items
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('batch_reference')->nullable()->after('product_id');
        });

        // 5. Update sales_store_transfers
        Schema::table('sales_store_transfers', function (Blueprint $table) {
            $table->string('batch_reference')->nullable()->after('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_store_transfers', function (Blueprint $table) {
            $table->dropColumn('batch_reference');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn('batch_reference');
        });

        Schema::table('sales_store_movements', function (Blueprint $table) {
            $table->dropColumn('batch_reference');
        });

        Schema::table('store_transfers', function (Blueprint $table) {
            $table->dropColumn('batch_reference');
        });

        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->dropForeign(['sales_store_id']);
            $table->dropUnique('sales_stock_unique_store_product_batch');
            $table->dropColumn('batch_reference');
            
            $table->unique(['sales_store_id', 'product_id']);
            $table->foreign('sales_store_id')->references('id')->on('sales_stores')->onDelete('cascade');
        });
    }
};
