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
            $table->decimal('damages', 10, 2)->default(0)->after('replacements');
        });

        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->decimal('damages', 10, 2)->default(0)->after('replacements');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('production_store_stock', function (Blueprint $table) {
            $table->dropColumn('damages');
        });

        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->dropColumn('damages');
        });
    }
};
