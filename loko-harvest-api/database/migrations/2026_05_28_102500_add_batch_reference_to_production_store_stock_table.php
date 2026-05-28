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
        Schema::table('production_store_stock', function (Blueprint $table) {
            // Drop foreign key
            $table->dropForeign(['product_id']);
            
            // Drop unique index
            $table->dropUnique(['product_id']);
            
            // Re-add foreign key constraint without unique
            $table->foreign('product_id')->references('id')->on('products');
            
            // Add batch_reference column
            $table->string('batch_reference')->nullable()->after('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('production_store_stock', function (Blueprint $table) {
            $table->dropColumn('batch_reference');
            $table->dropForeign(['product_id']);
            $table->unique('product_id');
            $table->foreign('product_id')->references('id')->on('products');
        });
    }
};
