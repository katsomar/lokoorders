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

    public function test_can_fetch_driver_shifts()
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

        $shift = \App\Models\DriverShift::create([
            'driver_id' => $driver->id,
            'vehicle_id' => $this->vehicle->id,
            'shift_date' => '2026-06-18',
            'start_time' => '2026-06-18 08:00:00',
            'status' => 'active',
            'deliveries_count' => 5,
            'crates_delivered' => 120,
            'notes' => 'Test shift',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/drivers/{$driver->id}/shifts");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonFragment([
                'id' => $shift->id,
                'shift_date' => '2026-06-18',
                'status' => 'active',
                'deliveries_count' => 5,
                'crates_delivered' => 120,
                'notes' => 'Test shift',
                'vehicle_registration' => 'UBL 482Y',
            ]);
    }

    public function test_can_update_vehicle_logistics()
    {
        $driverUser1 = User::create([
            'name' => 'Driver One',
            'email' => 'driver1@example.com',
            'password' => bcrypt('password'),
            'role' => 'driver',
            'status' => 'active',
            'phone' => '0700000001',
        ]);

        $driver1 = Driver::create([
            'user_id' => $driverUser1->id,
            'full_name' => $driverUser1->name,
            'phone' => $driverUser1->phone,
            'vehicle_id' => $this->vehicle->id,
            'license_number' => 'UG-1111',
            'employment_status' => 'active',
            'date_joined' => '2025-01-15',
        ]);

        $driverUser2 = User::create([
            'name' => 'Driver Two',
            'email' => 'driver2@example.com',
            'password' => bcrypt('password'),
            'role' => 'driver',
            'status' => 'active',
            'phone' => '0700000002',
        ]);

        $driver2 = Driver::create([
            'user_id' => $driverUser2->id,
            'full_name' => $driverUser2->name,
            'phone' => $driverUser2->phone,
            'vehicle_id' => null,
            'license_number' => 'UG-2222',
            'employment_status' => 'active',
            'date_joined' => '2025-01-15',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/v1/vehicles/{$this->vehicle->id}/logistics", [
                'status' => 'maintenance',
                'fuel_level' => 42,
                'driver_ids' => [$driver2->id],
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->vehicle->refresh();
        $this->assertEquals('maintenance', $this->vehicle->status);
        $this->assertEquals(42, $this->vehicle->fuel_level);

        $driver1->refresh();
        $driver2->refresh();

        $this->assertNull($driver1->vehicle_id);
        $this->assertEquals($this->vehicle->id, $driver2->vehicle_id);
    }
}
