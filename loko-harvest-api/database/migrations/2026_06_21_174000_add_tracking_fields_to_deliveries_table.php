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
        Schema::table('deliveries', function (Blueprint $table) {
            if (!Schema::hasColumn('deliveries', 'current_latitude')) {
                $table->decimal('current_latitude', 10, 8)->nullable();
            }
            if (!Schema::hasColumn('deliveries', 'current_longitude')) {
                $table->decimal('current_longitude', 11, 8)->nullable();
            }
            if (!Schema::hasColumn('deliveries', 'location_history')) {
                $table->json('location_history')->nullable();
            }
            if (!Schema::hasColumn('deliveries', 'distance_traveled')) {
                $table->decimal('distance_traveled', 8, 2)->default(0.00);
            }
            if (!Schema::hasColumn('deliveries', 'fuel_consumed')) {
                $table->decimal('fuel_consumed', 8, 2)->default(0.00);
            }
            if (!Schema::hasColumn('deliveries', 'duration_seconds')) {
                $table->integer('duration_seconds')->default(0);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropColumn([
                'current_latitude',
                'current_longitude',
                'location_history',
                'distance_traveled',
                'fuel_consumed',
                'duration_seconds'
            ]);
        });
    }
};
