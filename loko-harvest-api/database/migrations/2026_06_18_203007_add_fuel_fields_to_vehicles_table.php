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
        Schema::table('vehicles', function (Blueprint $table) {
            $table->double('consumption_per_km', 8, 2)->nullable()->after('fuel_level');
            $table->double('added_fuel_per_shift', 8, 2)->default(0.00)->after('consumption_per_km');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn(['consumption_per_km', 'added_fuel_per_shift']);
        });
    }
};
