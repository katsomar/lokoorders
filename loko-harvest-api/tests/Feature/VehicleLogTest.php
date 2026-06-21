<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\User;
use App\Models\VehicleLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VehicleLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Vehicle $vehicle;
    protected Driver $driver;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Loko Admin',
            'email' => 'admin@lokoharvest.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'status' => 'active',
            'phone' => '0700000000',
        ]);

        $this->vehicle = Vehicle::create([
            'registration_number' => 'UBL 482Y',
            'make' => 'Isuzu',
            'model' => 'Cargo Crate Truck',
            'max_crates_capacity' => 500,
            'fuel_level' => 50,
            'fuel_tank_capacity' => 80.0,
            'status' => 'active',
        ]);

        $driverUser = User::create([
            'name' => 'Sarah Driver',
            'email' => 'sarahdriver@example.com',
            'password' => bcrypt('password'),
            'role' => 'driver',
            'status' => 'active',
            'phone' => '0700111222',
        ]);

        $this->driver = Driver::create([
            'user_id' => $driverUser->id,
            'full_name' => $driverUser->name,
            'phone' => $driverUser->phone,
            'vehicle_id' => $this->vehicle->id,
            'license_number' => 'UG-7777',
            'employment_status' => 'active',
            'date_joined' => '2025-01-15',
        ]);
    }

    public function test_can_fetch_vehicle_logs_list()
    {
        VehicleLog::create([
            'vehicle_id' => $this->vehicle->id,
            'driver_id' => $this->driver->id,
            'log_type' => 'refuel',
            'destination' => 'Acacia Mall',
            'duration_minutes' => null,
            'initial_fuel' => 50,
            'added_fuel' => 20,
            'fuel_price_per_liter' => 5500,
            'total_spent' => 110000,
            'notes' => 'Test refuel log',
            'logged_at' => now(),
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/vehicle-logs');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.vehicle_registration', 'UBL 482Y')
            ->assertJsonPath('data.0.driver_name', 'Sarah Driver')
            ->assertJsonPath('data.0.log_type', 'refuel')
            ->assertJsonPath('data.0.destination', 'Acacia Mall')
            ->assertJsonPath('data.0.added_fuel', 20)
            ->assertJsonPath('data.0.total_spent', 110000);
    }

    public function test_storing_refuel_log_updates_vehicle_fuel_level()
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        $file = \Illuminate\Http\UploadedFile::fake()->create('receipt.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/vehicle-logs', [
                'vehicle_id' => $this->vehicle->id,
                'driver_id' => $this->driver->id,
                'log_type' => 'refuel',
                'destination' => 'Acacia Mall, KFC Bukoto',
                'added_fuel' => 20, // 20 Liters added to 50% of 80L (40L). New total = 60L = 75% of tank capacity.
                'fuel_price_per_liter' => 5500,
                'notes' => 'Refueling test',
                'evidence_file' => $file,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->vehicle->refresh();
        // 50% starting + 20L refueled (on 80L capacity) = 75% new level
        $this->assertEquals(75, $this->vehicle->fuel_level);
        $this->assertEquals(20.0, $this->vehicle->added_fuel_per_shift);

        $this->assertDatabaseHas('vehicle_logs', [
            'vehicle_id' => $this->vehicle->id,
            'log_type' => 'refuel',
            'added_fuel' => 20.00,
            'fuel_price_per_liter' => 5500.00,
            'total_spent' => 110000.00,
        ]);
    }
}
