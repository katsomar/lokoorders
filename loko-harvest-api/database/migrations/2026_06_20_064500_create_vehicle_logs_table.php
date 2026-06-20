<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vehicle_id')->constrained('vehicles')->onDelete('cascade');
            $table->foreignUuid('driver_id')->nullable()->constrained('drivers')->nullOnDelete();
            $table->string('log_type'); // 'movement', 'refuel'
            $table->string('destination')->nullable();
            $table->integer('duration_minutes')->nullable();
            $table->double('initial_fuel', 8, 2)->default(0.00);
            $table->double('added_fuel', 8, 2)->default(0.00);
            $table->double('fuel_price_per_liter', 12, 2)->default(0.00);
            $table->double('total_spent', 12, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->timestamp('logged_at')->useCurrent();
            $table->timestamps();
        });

        // Seed sample rows if tables exist and are populated
        try {
            $vehicle = \App\Models\Vehicle::first();
            $driver = \App\Models\Driver::first();

            if ($vehicle) {
                \App\Models\VehicleLog::create([
                    'vehicle_id' => $vehicle->id,
                    'driver_id' => $driver ? $driver->id : null,
                    'log_type' => 'refuel',
                    'destination' => null,
                    'duration_minutes' => null,
                    'initial_fuel' => 50.00,
                    'added_fuel' => 30.00,
                    'fuel_price_per_liter' => 5500.00,
                    'total_spent' => 165000.00,
                    'notes' => 'Replenished fuel before morning dispatch',
                    'logged_at' => now()->subHours(6),
                ]);

                \App\Models\VehicleLog::create([
                    'vehicle_id' => $vehicle->id,
                    'driver_id' => $driver ? $driver->id : null,
                    'log_type' => 'movement',
                    'destination' => 'Acacia Mall, Shoprite Lugogo',
                    'duration_minutes' => 140,
                    'initial_fuel' => 85.00,
                    'added_fuel' => 0.00,
                    'fuel_price_per_liter' => 0.00,
                    'total_spent' => 0.00,
                    'notes' => 'Morning route deliveries fulfilled successfully',
                    'logged_at' => now()->subHours(4),
                ]);

                \App\Models\VehicleLog::create([
                    'vehicle_id' => $vehicle->id,
                    'driver_id' => $driver ? $driver->id : null,
                    'log_type' => 'refuel',
                    'destination' => null,
                    'duration_minutes' => null,
                    'initial_fuel' => 60.00,
                    'added_fuel' => 20.00,
                    'fuel_price_per_liter' => 5500.00,
                    'total_spent' => 110000.00,
                    'notes' => 'Shift end refueling',
                    'logged_at' => now()->subHours(2),
                ]);
            }
        } catch (\Exception $e) {
            // Silently skip if model files aren't loaded or db is clean
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_logs');
    }
};
