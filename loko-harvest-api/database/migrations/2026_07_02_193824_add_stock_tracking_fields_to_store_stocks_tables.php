<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('production_store_stock', function (Blueprint $table) {
            $table->decimal('opening_stock', 15, 2)->default(0.00)->after('batch_reference');
            $table->decimal('stock_taken', 15, 2)->default(0.00)->after('opening_stock');
            $table->decimal('replacements', 15, 2)->default(0.00)->after('stock_taken');
            $table->decimal('closing_stock', 15, 2)->default(0.00)->after('replacements');
            $table->decimal('unit_price', 15, 2)->default(0.00)->after('closing_stock');
        });

        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->decimal('opening_stock', 15, 2)->default(0.00)->after('batch_reference');
            $table->decimal('stock_taken', 15, 2)->default(0.00)->after('opening_stock');
            $table->decimal('replacements', 15, 2)->default(0.00)->after('stock_taken');
            $table->decimal('closing_stock', 15, 2)->default(0.00)->after('replacements');
            $table->decimal('unit_price', 15, 2)->default(0.00)->after('closing_stock');
        });

        // Migrate existing production store stock data
        DB::table('production_store_stock')->get()->each(function ($item) {
            $valPrice = $item->valuation_price ?? 0;
            if (!$valPrice) {
                $product = DB::table('products')->where('id', $item->product_id)->first();
                $valPrice = $product->production_unit_price ?? $product->default_unit_price ?? 0;
            }
            DB::table('production_store_stock')->where('id', $item->id)->update([
                'opening_stock' => $item->current_quantity,
                'closing_stock' => $item->current_quantity,
                'unit_price' => $valPrice,
            ]);
        });

        // Migrate existing sales store stock data
        DB::table('sales_store_stock')->get()->each(function ($item) {
            $product = DB::table('products')->where('id', $item->product_id)->first();
            $salesPrice = $product->sales_unit_price ?? $product->default_unit_price ?? 0;
            DB::table('sales_store_stock')->where('id', $item->id)->update([
                'opening_stock' => $item->current_quantity,
                'closing_stock' => $item->current_quantity,
                'unit_price' => $salesPrice,
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('production_store_stock', function (Blueprint $table) {
            $table->dropColumn(['opening_stock', 'stock_taken', 'replacements', 'closing_stock', 'unit_price']);
        });

        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->dropColumn(['opening_stock', 'stock_taken', 'replacements', 'closing_stock', 'unit_price']);
        });
    }
};
