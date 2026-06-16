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
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('production_unit_price', 15, 2)->default(0.00)->after('default_unit_price');
            $table->decimal('sales_unit_price', 15, 2)->default(0.00)->after('production_unit_price');
        });

        Schema::table('store_transfers', function (Blueprint $table) {
            $table->decimal('unit_price', 15, 2)->nullable()->after('quantity');
        });

        // Copy default_unit_price values into production_unit_price and sales_unit_price
        DB::table('products')->update([
            'production_unit_price' => DB::raw('default_unit_price'),
            'sales_unit_price' => DB::raw('default_unit_price'),
        ]);

        // Copy matching product's default_unit_price to existing transfers
        $transfers = DB::table('store_transfers')->get();
        foreach ($transfers as $transfer) {
            $product = DB::table('products')->where('id', $transfer->product_id)->first();
            if ($product) {
                DB::table('store_transfers')
                    ->where('id', $transfer->id)
                    ->update(['unit_price' => $product->default_unit_price]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_transfers', function (Blueprint $table) {
            $table->dropColumn('unit_price');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['production_unit_price', 'sales_unit_price']);
        });
    }
};
