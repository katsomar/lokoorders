<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DriverVehicleTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Vehicle $vehicle;

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
            'fuel_level' => 85,
            'status' => 'active',
        ]);
    }

    public function test_can_fetch_drivers_list()
    {
        $driverUser = User::create([
            'name' => 'Musa Driver',
            'email' => 'driver@lokoharvest.com',
            'password' => bcrypt('password'),
            'role' => 'driver',
            'status' => 'active',
            'phone' => '0700 000 002',
        ]);

        $driver = Driver::create([
            'user_id' => $driverUser->id,
            'full_name' => $driverUser->name,
            'phone' => $driverUser->phone,
            'vehicle_id' => $this->vehicle->id,
            'license_number' => 'UG-1048',
            'employment_status' => 'active',
            'date_joined' => '2025-01-15',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/drivers');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonFragment([
                'id' => $driver->id,
                'name' => 'Musa Driver',
                'phone' => '0700 000 002',
                'license' => 'UG-1048',
                'vehicle_registration' => 'UBL 482Y',
                'vehicle_make' => 'Isuzu Cargo Crate Truck',
                'status' => 'available',
                'employment_status' => 'active',
            ]);
    }

    public function test_can_store_new_driver()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/drivers', [
                'full_name' => 'Sarah Namubiru',
                'email' => 'sarah@lokoharvest.com',
                'phone' => '0755 333 444',
                'vehicle_id' => $this->vehicle->id,
                'license_number' => 'UG-8821',
                'employment_status' => 'active',
                'date_joined' => '2025-03-20',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('users', [
            'name' => 'Sarah Namubiru',
            'email' => 'sarah@lokoharvest.com',
            'role' => 'driver',
        ]);

        $this->assertDatabaseHas('drivers', [
            'full_name' => 'Sarah Namubiru',
            'license_number' => 'UG-8821',
            'vehicle_id' => $this->vehicle->id,
        ]);
    }

    public function test_can_fetch_vehicles_list()
    {
        $driverUser = User::create([
            'name' => 'Musa Driver',
            'email' => 'driver@lokoharvest.com',
            'password' => bcrypt('password'),
            'role' => 'driver',
            'status' => 'active',
            'phone' => '0700 000 002',
        ]);

        Driver::create([
            'user_id' => $driverUser->id,
            'full_name' => $driverUser->name,
            'phone' => $driverUser->phone,
            'vehicle_id' => $this->vehicle->id,
            'license_number' => 'UG-1048',
            'employment_status' => 'active',
            'date_joined' => '2025-01-15',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/vehicles');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonFragment([
                'id' => $this->vehicle->id,
                'registration_number' => 'UBL 482Y',
                'make' => 'Isuzu',
                'model' => 'Cargo Crate Truck',
                'max_crates_capacity' => 500,
                'fuel_level' => 85,
                'status' => 'active',
                'assigned_drivers' => ['Musa Driver'],
            ]);
    }

    public function test_can_store_new_vehicle()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/vehicles', [
                'registration_number' => 'UAE 445Z',
                'make' => 'Mitsubishi',
                'model' => 'Fuso Transporter',
                'max_crates_capacity' => 800,
                'fuel_level' => 60,
                'status' => 'active',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('vehicles', [
            'registration_number' => 'UAE 445Z',
            'make' => 'Mitsubishi',
            'model' => 'Fuso Transporter',
            'max_crates_capacity' => 800,
        ]);
    }
}
