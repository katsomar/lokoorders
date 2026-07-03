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
        Schema::create('driver_vehicle', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('driver_id')->constrained('drivers')->cascadeOnDelete();
            $table->foreignUuid('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->timestamps();
        });

        // Migrate existing driver-vehicle assignments
        $drivers = DB::table('drivers')->whereNotNull('vehicle_id')->get();
        foreach ($drivers as $driver) {
            $vehicleExists = DB::table('vehicles')->where('id', $driver->vehicle_id)->exists();
            if ($vehicleExists) {
                DB::table('driver_vehicle')->insert([
                    'driver_id' => $driver->id,
                    'vehicle_id' => $driver->vehicle_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('driver_vehicle');
    }
};
