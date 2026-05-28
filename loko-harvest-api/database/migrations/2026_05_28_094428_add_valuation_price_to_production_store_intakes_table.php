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
        Schema::table('production_store_intakes', function (Blueprint $table) {
            $table->decimal('valuation_price', 15, 2)->after('quantity')->nullable();
        });

        Schema::table('production_store_stock', function (Blueprint $table) {
            $table->decimal('valuation_price', 15, 2)->after('current_quantity')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('production_store_intakes', function (Blueprint $table) {
            $table->dropColumn('valuation_price');
        });

        Schema::table('production_store_stock', function (Blueprint $table) {
            $table->dropColumn('valuation_price');
        });
    }
};

