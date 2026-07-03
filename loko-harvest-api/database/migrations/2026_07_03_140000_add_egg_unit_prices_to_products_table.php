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
            $table->decimal('production_egg_unit_price', 15, 2)->default(0.00)->after('production_unit_price');
            $table->decimal('sales_egg_unit_price', 15, 2)->default(0.00)->after('sales_unit_price');
        });
 
        // Set defaults for existing products where unit is trays
        DB::table('products')->where('unit_of_measure', 'trays')->update([
            'production_egg_unit_price' => DB::raw('production_unit_price / 30'),
            'sales_egg_unit_price' => DB::raw('sales_unit_price / 30'),
        ]);
    }
 
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['production_egg_unit_price', 'sales_egg_unit_price']);
        });
    }
};
