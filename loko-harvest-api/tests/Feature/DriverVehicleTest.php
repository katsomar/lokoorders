<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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
        Storage::fake('public');

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/drivers', [
                'full_name' => 'Sarah Namubiru',
                'email' => 'sarah@lokoharvest.com',
                'phone' => '0755 333 444',
                'vehicle_id' => $this->vehicle->id,
                'license_number' => 'UG-8821',
                'employment_status' => 'active',
                'date_joined' => '2025-03-20',
                'avatar' => UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg'),
                'license_photo' => UploadedFile::fake()->create('license.jpg', 100, 'image/jpeg'),
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

        $driver = Driver::where('license_number', 'UG-8821')->first();
        Storage::disk('public')->assertExists($driver->avatar_path);
        Storage::disk('public')->assertExists($driver->license_path);
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
        Storage::fake('public');

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/vehicles', [
                'registration_number' => 'UAE 445Z',
                'make' => 'Mitsubishi',
                'model' => 'Fuso Transporter',
                'max_crates_capacity' => 800,
                'fuel_level' => 60,
                'status' => 'active',
                'vehicle_photo' => UploadedFile::fake()->create('truck.jpg', 100, 'image/jpeg'),
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('vehicles', [
            'registration_number' => 'UAE 445Z',
            'make' => 'Mitsubishi',
            'model' => 'Fuso Transporter',
            'max_crates_capacity' => 800,
        ]);

        $vehicle = Vehicle::where('registration_number', 'UAE 445Z')->first();
        Storage::disk('public')->assertExists($vehicle->image_path);
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

    public function test_can_update_driver()
    {
        Storage::fake('public');

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
            'avatar_path' => 'avatars/old.jpg',
            'license_path' => 'licenses/old.jpg',
        ]);

        Storage::disk('public')->put('avatars/old.jpg', 'fake content');
        Storage::disk('public')->put('licenses/old.jpg', 'fake content');

        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/v1/drivers/{$driver->id}", [
                'full_name' => 'Musa Driver Updated',
                'email' => 'driver_new@lokoharvest.com',
                'phone' => '0700 000 999',
                'vehicle_id' => $this->vehicle->id,
                'license_number' => 'UG-9999',
                'employment_status' => 'inactive',
                'date_joined' => '2025-01-15',
                'avatar' => UploadedFile::fake()->create('avatar_new.jpg', 100, 'image/jpeg'),
                'license_photo' => UploadedFile::fake()->create('license_new.jpg', 100, 'image/jpeg'),
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('users', [
            'id' => $driverUser->id,
            'name' => 'Musa Driver Updated',
            'email' => 'driver_new@lokoharvest.com',
            'phone' => '0700 000 999',
        ]);

        $this->assertDatabaseHas('drivers', [
            'id' => $driver->id,
            'full_name' => 'Musa Driver Updated',
            'license_number' => 'UG-9999',
            'employment_status' => 'inactive',
        ]);

        $driver->refresh();
        Storage::disk('public')->assertMissing('avatars/old.jpg');
        Storage::disk('public')->assertMissing('licenses/old.jpg');
        Storage::disk('public')->assertExists($driver->avatar_path);
        Storage::disk('public')->assertExists($driver->license_path);
    }

    public function test_can_delete_driver()
    {
        Storage::fake('public');

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
            'avatar_path' => 'avatars/old.jpg',
            'license_path' => 'licenses/old.jpg',
        ]);

        Storage::disk('public')->put('avatars/old.jpg', 'fake content');
        Storage::disk('public')->put('licenses/old.jpg', 'fake content');

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/v1/drivers/{$driver->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('drivers', ['id' => $driver->id]);
        $this->assertDatabaseMissing('users', ['id' => $driverUser->id]);

        Storage::disk('public')->assertMissing('avatars/old.jpg');
        Storage::disk('public')->assertMissing('licenses/old.jpg');
    }

    public function test_can_delete_vehicle()
    {
        Storage::fake('public');

        $vehicle = Vehicle::create([
            'registration_number' => 'UBL 999X',
            'make' => 'Toyota',
            'model' => 'Hilux',
            'max_crates_capacity' => 150,
            'fuel_level' => 100,
            'status' => 'active',
            'image_path' => 'vehicles/old.jpg',
        ]);

        $driverUser = User::create([
            'name' => 'John Driver',
            'email' => 'john@lokoharvest.com',
            'password' => bcrypt('password'),
            'role' => 'driver',
            'status' => 'active',
            'phone' => '0700000003',
        ]);

        $driver = Driver::create([
            'user_id' => $driverUser->id,
            'full_name' => $driverUser->name,
            'phone' => $driverUser->phone,
            'vehicle_id' => $vehicle->id,
            'license_number' => 'UG-9999',
            'employment_status' => 'active',
            'date_joined' => '2025-01-15',
        ]);

        Storage::disk('public')->put('vehicles/old.jpg', 'fake content');

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/v1/vehicles/{$vehicle->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('vehicles', ['id' => $vehicle->id]);
        
        // Driver should remain in DB but vehicle_id should be null
        $this->assertDatabaseHas('drivers', [
            'id' => $driver->id,
            'vehicle_id' => null,
        ]);

        Storage::disk('public')->assertMissing('vehicles/old.jpg');
    }

    public function test_can_manage_delivery_transitions()
    {
        $driverUser = User::create([
            'name' => 'Sarah Driver',
            'email' => 'sarahdriver@example.com',
            'password' => bcrypt('password'),
            'role' => 'driver',
            'status' => 'active',
            'phone' => '0700111222',
        ]);

        $driver = Driver::create([
            'user_id' => $driverUser->id,
            'full_name' => $driverUser->name,
            'phone' => $driverUser->phone,
            'vehicle_id' => $this->vehicle->id,
            'license_number' => 'UG-7777',
            'employment_status' => 'active',
            'date_joined' => '2025-01-15',
        ]);

        $zone = \App\Models\DeliveryZone::create([
            'name' => 'Central Kampala',
            'description' => 'Kampala Central Region',
            'is_active' => true,
        ]);

        $customer = \App\Models\Customer::create([
            'name' => 'Acme Supermarket',
            'email' => 'acme@example.com',
            'contact_person' => 'John Doe',
            'phone_primary' => '0788111222',
            'delivery_zone_id' => $zone->id,
            'address' => 'Plot 12 Kampala Rd',
            'customer_type' => 'supermarket',
            'credit_terms' => 'cash',
            'credit_limit' => 0.00,
            'date_registered' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        $salesStore = \App\Models\SalesStore::create([
            'name' => 'Kampala Main Store',
            'code' => 'KLA-MNS',
            'location' => 'HQ',
        ]);

        $order = \App\Models\Order::create([
            'order_number' => 'LHO-2026-9999',
            'customer_id' => $customer->id,
            'sales_store_id' => $salesStore->id,
            'order_date' => '2026-06-18',
            'required_delivery_date' => '2026-06-19',
            'urgency' => 'normal',
            'total_amount' => 50000,
            'status' => 'pending',
            'created_by' => $this->user->id,
        ]);

        // 1. Test Assign Delivery
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/deliveries/assign', [
                'order_id' => $order->id,
                'driver_id' => $driver->id,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $deliveryId = $response->json('data.id');
        $this->assertDatabaseHas('deliveries', [
            'id' => $deliveryId,
            'status' => 'assigned',
            'order_id' => $order->id,
            'driver_id' => $driver->id,
        ]);
        
        $order->refresh();
        $this->assertEquals('dispatched', $order->status);

        // 2. Test Transit transition
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/v1/deliveries/{$deliveryId}/transit");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('deliveries', [
            'id' => $deliveryId,
            'status' => 'in_transit',
        ]);

        // 3. Test Confirm Delivery
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/v1/deliveries/{$deliveryId}/confirm", [
                'recipient_name' => 'John Doe Recipient',
                'recipient_phone' => '0777123456',
                'delivered_at' => now()->toDateTimeString(),
                'notes' => 'Delivered to back dock',
                'signature' => 'data:image/png;base64,fake-signature-data',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('deliveries', [
            'id' => $deliveryId,
            'status' => 'delivered',
            'delivery_notes' => json_encode([
                'recipient_name' => 'John Doe Recipient',
                'recipient_phone' => '0777123456',
                'notes' => 'Delivered to back dock',
            ]),
        ]);

        $order->refresh();
        $this->assertEquals('delivered', $order->status);
    }
}
