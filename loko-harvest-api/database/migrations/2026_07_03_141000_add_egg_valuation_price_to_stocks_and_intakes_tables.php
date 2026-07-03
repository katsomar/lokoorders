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
        Schema::table('production_store_intakes', function (Blueprint $table) {
            $table->decimal('egg_valuation_price', 15, 2)->default(0.00)->after('valuation_price');
        });
 
        Schema::table('production_store_stock', function (Blueprint $table) {
            $table->decimal('egg_unit_price', 15, 2)->default(0.00)->after('unit_price');
        });
 
        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->decimal('egg_unit_price', 15, 2)->default(0.00)->after('unit_price');
        });
 
        // Set default values for existing records
        DB::table('production_store_intakes')->update([
            'egg_valuation_price' => DB::raw('valuation_price / 30'),
        ]);
        
        DB::table('production_store_stock')->update([
            'egg_unit_price' => DB::raw('unit_price / 30'),
        ]);
 
        DB::table('sales_store_stock')->update([
            'egg_unit_price' => DB::raw('unit_price / 30'),
        ]);
    }
 
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('production_store_intakes', function (Blueprint $table) {
            $table->dropColumn('egg_valuation_price');
        });
 
        Schema::table('production_store_stock', function (Blueprint $table) {
            $table->dropColumn('egg_unit_price');
        });
 
        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->dropColumn('egg_unit_price');
        });
    }
};
