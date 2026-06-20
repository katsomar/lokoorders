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
            'consumption_per_km' => 0.15,
            'added_fuel_per_shift' => 20.0,
            'fuel_tank_capacity' => 80.0,
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

    public function test_can_manage_product_batches_across_stores_and_orders()
    {
        // 1. Setup production stores, sales store, products, and customer
        $prodStoreA = \App\Models\ProductionStore::create([
            'name' => 'Production Store A',
            'code' => 'PSA',
            'location' => 'Block A',
        ]);
        
        $prodStoreB = \App\Models\ProductionStore::create([
            'name' => 'Production Store B',
            'code' => 'PSB',
            'location' => 'Block B',
        ]);

        $salesStore = \App\Models\SalesStore::create([
            'name' => 'Sales Store A',
            'code' => 'SSA',
            'location' => 'Kampala Main',
        ]);

        // Batch-tracked product (eggs)
        $eggs = \App\Models\Product::create([
            'name' => 'Golden Eggs',
            'code' => 'EGG-GLD',
            'category' => 'eggs',
            'unit_of_measure' => 'trays',
            'default_unit_price' => 12000,
            'sales_unit_price' => 15000,
        ]);

        // Non-batch-tracked product (manure)
        $manure = \App\Models\Product::create([
            'name' => 'Organic Manure',
            'code' => 'BY-MNR',
            'category' => 'by_products',
            'unit_of_measure' => 'kg',
            'default_unit_price' => 5000,
            'sales_unit_price' => 7000,
        ]);

        // Seed initial stocks in Production Store A
        \App\Models\ProductionStoreStock::create([
            'production_store_id' => $prodStoreA->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A1',
            'current_quantity' => 100,
            'valuation_price' => 12000,
            'updated_by' => $this->user->id,
        ]);

        \App\Models\ProductionStoreStock::create([
            'production_store_id' => $prodStoreA->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A2',
            'current_quantity' => 50,
            'valuation_price' => 12000,
            'updated_by' => $this->user->id,
        ]);

        \App\Models\ProductionStoreStock::create([
            'production_store_id' => $prodStoreA->id,
            'product_id' => $manure->id,
            'batch_reference' => null,
            'current_quantity' => 10,
            'valuation_price' => 5000,
            'updated_by' => $this->user->id,
        ]);

        $zone = \App\Models\DeliveryZone::create([
            'name' => 'Kampala Central',
            'description' => 'City center',
        ]);

        $customer = \App\Models\Customer::create([
            'name' => 'Acme Corp',
            'contact_person' => 'Jane Doe',
            'phone_primary' => '0788111222',
            'email' => 'jane@acme.com',
            'address' => 'Kampala Rd',
            'delivery_zone_id' => $zone->id,
            'customer_type' => 'supermarket',
            'credit_terms' => 'cash',
            'credit_limit' => 0.00,
            'date_registered' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        // ---- PART 1: Inter-production store transfer with batch renaming ----
        // Move 40 trays of eggs from BATCH-A1 in Prod Store A to BATCH-A1-NEW in Prod Store B
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/production-store-transfers', [
                'from_production_store_id' => $prodStoreA->id,
                'to_production_store_id' => $prodStoreB->id,
                'product_id' => $eggs->id,
                'quantity' => 40,
                'from_batch_reference' => 'BATCH-A1',
                'to_batch_reference' => 'BATCH-A1-NEW',
                'transfer_date' => '2026-06-19',
                'notes' => 'Transfer with rename',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('production_store_stock', [
            'production_store_id' => $prodStoreA->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A1',
            'current_quantity' => 60,
        ]);
        $this->assertDatabaseHas('production_store_stock', [
            'production_store_id' => $prodStoreB->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A1-NEW',
            'current_quantity' => 40,
        ]);

        // ---- PART 2: Production to Sales Store Transfer (Specific Batch) ----
        // Move 30 trays of eggs from BATCH-A2 in Prod Store A to Sales Store
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/store-transfers', [
                'production_store_id' => $prodStoreA->id,
                'sales_store_id' => $salesStore->id,
                'product_id' => $eggs->id,
                'quantity' => 30,
                'batch_reference' => 'BATCH-A2',
                'transfer_date' => '2026-06-19',
                'notes' => 'Move specific batch to sales',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('production_store_stock', [
            'production_store_id' => $prodStoreA->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A2',
            'current_quantity' => 20,
        ]);
        $this->assertDatabaseHas('sales_store_stock', [
            'sales_store_id' => $salesStore->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A2',
            'current_quantity' => 30,
        ]);

        // ---- PART 3: Production to Sales Store Transfer (FIFO fallback) ----
        // Move 40 trays of eggs from Prod Store A to Sales Store without batch selection
        // Remaining in Prod Store A: BATCH-A1 (60), BATCH-A2 (20)
        // FIFO should grab 40 from BATCH-A1 (since it was created first/has oldest ID or created_at)
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/store-transfers', [
                'production_store_id' => $prodStoreA->id,
                'sales_store_id' => $salesStore->id,
                'product_id' => $eggs->id,
                'quantity' => 40,
                'transfer_date' => '2026-06-19',
                'notes' => 'FIFO transfer',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('production_store_stock', [
            'production_store_id' => $prodStoreA->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A1',
            'current_quantity' => 20,
        ]);
        $this->assertDatabaseHas('sales_store_stock', [
            'sales_store_id' => $salesStore->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A1',
            'current_quantity' => 40,
        ]);

        // ---- PART 4: Non-batch-tracked Product Transfer ----
        // Transfer 5 bags of manure from Prod Store A to Sales Store
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/store-transfers', [
                'production_store_id' => $prodStoreA->id,
                'sales_store_id' => $salesStore->id,
                'product_id' => $manure->id,
                'quantity' => 5,
                'transfer_date' => '2026-06-19',
                'notes' => 'Manure transfer',
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('production_store_stock', [
            'production_store_id' => $prodStoreA->id,
            'product_id' => $manure->id,
            'batch_reference' => null,
            'current_quantity' => 5,
        ]);
        $this->assertDatabaseHas('sales_store_stock', [
            'sales_store_id' => $salesStore->id,
            'product_id' => $manure->id,
            'batch_reference' => null,
            'current_quantity' => 5,
        ]);

        // ---- PART 5: Customer Order (Specific Batch) ----
        // Order 10 trays of eggs from BATCH-A2 in Sales Store
        // Available in Sales Store: BATCH-A2 (30), BATCH-A1 (40)
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/orders', [
                'customer_id' => $customer->id,
                'sales_store_id' => $salesStore->id,
                'order_date' => '2026-06-19',
                'required_delivery_date' => '2026-06-20',
                'urgency' => 'normal',
                'items' => [
                    [
                        'product_id' => $eggs->id,
                        'quantity' => 10,
                        'unit_price' => 15000,
                        'batch_reference' => 'BATCH-A2',
                    ]
                ],
            ]);

        $response->assertStatus(201);
        $orderId = $response->json('data.id');
        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/v1/orders/{$orderId}/status", [
                'status' => 'processing',
            ])->assertStatus(200);

        $this->assertDatabaseHas('sales_store_stock', [
            'sales_store_id' => $salesStore->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A2',
            'current_quantity' => 20,
        ]);
        $this->assertDatabaseHas('order_items', [
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A2',
            'quantity' => 10,
        ]);

        // ---- PART 6: Customer Order (FIFO fallback) ----
        // Order 50 trays of eggs from Sales Store without specifying batch_reference
        // Sales store stocks: BATCH-A1 (40), BATCH-A2 (20)
        // FIFO should grab 40 from BATCH-A1 (leaving 0) and 10 from BATCH-A2 (leaving 10)
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/orders', [
                'customer_id' => $customer->id,
                'sales_store_id' => $salesStore->id,
                'order_date' => '2026-06-19',
                'required_delivery_date' => '2026-06-20',
                'urgency' => 'normal',
                'items' => [
                    [
                        'product_id' => $eggs->id,
                        'quantity' => 50,
                        'unit_price' => 15000,
                    ]
                ],
            ]);

        $response->assertStatus(201);
        $orderId = $response->json('data.id');
        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/v1/orders/{$orderId}/status", [
                'status' => 'processing',
            ])->assertStatus(200);

        $this->assertDatabaseHas('sales_store_stock', [
            'sales_store_id' => $salesStore->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A1',
            'current_quantity' => 0,
        ]);
        $this->assertDatabaseHas('sales_store_stock', [
            'sales_store_id' => $salesStore->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A2',
            'current_quantity' => 10,
        ]);
        $this->assertDatabaseHas('order_items', [
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A1',
            'quantity' => 40,
        ]);
        $this->assertDatabaseHas('order_items', [
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-A2',
            'quantity' => 10,
        ]);
    }

    public function test_can_update_order()
    {
        $zone = \App\Models\DeliveryZone::create(['name' => 'Kampala Central']);
        $customer = \App\Models\Customer::create([
            'name' => 'Acme Corp',
            'contact_person' => 'Jane Doe',
            'phone_primary' => '0788111222',
            'email' => 'jane@acme.com',
            'address' => 'Kampala Rd',
            'delivery_zone_id' => $zone->id,
            'customer_type' => 'supermarket',
            'credit_terms' => 'cash',
            'credit_limit' => 0.00,
            'date_registered' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        $salesStore = \App\Models\SalesStore::create([
            'name' => 'Sales Store A',
            'code' => 'SSA',
            'location' => 'Kampala Main',
        ]);

        $eggs = \App\Models\Product::create([
            'name' => 'Golden Eggs',
            'code' => 'EGG-GLD',
            'category' => 'eggs',
            'unit_of_measure' => 'trays',
            'default_unit_price' => 12000,
            'sales_unit_price' => 15000,
        ]);

        // Seed stock
        \App\Models\SalesStoreStock::create([
            'sales_store_id' => $salesStore->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-X1',
            'current_quantity' => 100,
            'updated_by' => $this->user->id,
        ]);

        // Create order
        $order = \App\Models\Order::create([
            'order_number' => 'LHO-2026-8800',
            'customer_id' => $customer->id,
            'sales_store_id' => $salesStore->id,
            'order_date' => '2026-06-19',
            'required_delivery_date' => '2026-06-20',
            'urgency' => 'normal',
            'total_amount' => 150000, // 10 trays * 15000
            'status' => 'processing',
            'created_by' => $this->user->id,
        ]);

        \App\Models\OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-X1',
            'quantity' => 10,
            'unit_price' => 15000,
            'line_total' => 150000,
        ]);

        // Deduct stock manually
        \App\Models\SalesStoreStock::where('sales_store_id', $salesStore->id)
            ->where('product_id', $eggs->id)
            ->where('batch_reference', 'BATCH-X1')
            ->decrement('current_quantity', 10);

        // Update order via PUT
        $response = $this->actingAs($this->user, 'sanctum')
            ->putJson("/api/v1/orders/{$order->id}", [
                'customer_id' => $customer->id,
                'sales_store_id' => $salesStore->id,
                'order_date' => '2026-06-19',
                'required_delivery_date' => '2026-06-20',
                'urgency' => 'urgent',
                'items' => [
                    [
                        'product_id' => $eggs->id,
                        'quantity' => 15,
                        'unit_price' => 15000,
                        'batch_reference' => 'BATCH-X1',
                    ]
                ],
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Verify stock is refunded (100 - 15 = 85)
        $stock = \App\Models\SalesStoreStock::where('sales_store_id', $salesStore->id)
            ->where('product_id', $eggs->id)
            ->where('batch_reference', 'BATCH-X1')
            ->first();
        $this->assertEquals(85, (float)$stock->current_quantity);

        // Verify order items count
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'product_id' => $eggs->id,
            'quantity' => 15,
        ]);
    }

    public function test_can_delete_order()
    {
        $zone = \App\Models\DeliveryZone::create(['name' => 'Kampala Central']);
        $customer = \App\Models\Customer::create([
            'name' => 'Acme Corp',
            'contact_person' => 'Jane Doe',
            'phone_primary' => '0788111222',
            'email' => 'jane@acme.com',
            'address' => 'Kampala Rd',
            'delivery_zone_id' => $zone->id,
            'customer_type' => 'supermarket',
            'credit_terms' => 'cash',
            'credit_limit' => 0.00,
            'date_registered' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        $salesStore = \App\Models\SalesStore::create([
            'name' => 'Sales Store A',
            'code' => 'SSA',
            'location' => 'Kampala Main',
        ]);

        $eggs = \App\Models\Product::create([
            'name' => 'Golden Eggs',
            'code' => 'EGG-GLD',
            'category' => 'eggs',
            'unit_of_measure' => 'trays',
            'default_unit_price' => 12000,
            'sales_unit_price' => 15000,
        ]);

        // Seed stock
        \App\Models\SalesStoreStock::create([
            'sales_store_id' => $salesStore->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-Y1',
            'current_quantity' => 100,
            'updated_by' => $this->user->id,
        ]);

        // Create order
        $order = \App\Models\Order::create([
            'order_number' => 'LHO-2026-8801',
            'customer_id' => $customer->id,
            'sales_store_id' => $salesStore->id,
            'order_date' => '2026-06-19',
            'required_delivery_date' => '2026-06-20',
            'urgency' => 'normal',
            'total_amount' => 150000,
            'status' => 'processing',
            'created_by' => $this->user->id,
        ]);

        \App\Models\OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $eggs->id,
            'batch_reference' => 'BATCH-Y1',
            'quantity' => 10,
            'unit_price' => 15000,
            'line_total' => 150000,
        ]);

        // Deduct stock manually
        \App\Models\SalesStoreStock::where('sales_store_id', $salesStore->id)
            ->where('product_id', $eggs->id)
            ->where('batch_reference', 'BATCH-Y1')
            ->decrement('current_quantity', 10);

        // Delete order via DELETE
        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/v1/orders/{$order->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Verify stock is fully refunded (100)
        $stock = \App\Models\SalesStoreStock::where('sales_store_id', $salesStore->id)
            ->where('product_id', $eggs->id)
            ->where('batch_reference', 'BATCH-Y1')
            ->first();
        $this->assertEquals(100, (float)$stock->current_quantity);

        // Verify order is deleted
        $this->assertDatabaseMissing('orders', ['id' => $order->id]);
        $this->assertDatabaseMissing('order_items', ['order_id' => $order->id]);
    }

    public function test_can_fetch_driver_dashboard_stats()
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
            'latitude' => 0.3476,
            'longitude' => 32.5825,
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

        $product = \App\Models\Product::create([
            'name' => 'White Eggs',
            'code' => 'EGG-WHT',
            'category' => 'eggs',
            'unit_of_measure' => 'trays',
            'default_unit_price' => 10000,
        ]);

        \App\Models\OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 20,
            'unit_price' => 10000,
            'line_total' => 200000,
        ]);

        $delivery = \App\Models\Delivery::create([
            'order_id' => $order->id,
            'driver_id' => $driver->id,
            'assigned_by' => $this->user->id,
            'status' => 'assigned',
            'dispatched_at' => now(),
        ]);

        $response = $this->actingAs($driverUser, 'sanctum')
            ->getJson('/api/v1/driver/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.driver_name', 'Sarah Driver')
            ->assertJsonPath('data.pending_orders_count', 1)
            ->assertJsonPath('data.pending_crates_sum', 20)
            ->assertJsonPath('data.vehicle.plate', 'UBL 482Y')
            ->assertJsonPath('data.vehicle.fuel_tank_capacity', 80)
            ->assertJsonPath('data.vehicle.consumption_per_km', 0.15)
            ->assertJsonPath('data.vehicle.added_fuel_per_shift', 20)
            ->assertJsonPath('data.performance.fuel_economy', 0.15)
            ->assertJsonPath('data.performance.fuel_efficiency', 80)
            ->assertJsonStructure(['data' => [
                'avatar', 
                'assigned_route', 
                'performance' => [
                    'fulfillment_rate',
                    'fulfillment_trend',
                    'fuel_economy',
                    'fuel_efficiency',
                    'quality_rate',
                    'damaged_crates_count',
                    'photo_compliance_rate',
                    'composite_score',
                    'league_class'
                ]
            ]])
            ->assertJsonCount(1, 'data.assigned_route')
            ->assertJsonPath('data.assigned_route.0.order', 'LHO-2026-9999')
            ->assertJsonPath('data.assigned_route.0.customer', 'Acme Supermarket')
            ->assertJsonPath('data.assigned_route.0.crates', 20)
            ->assertJsonPath('data.assigned_route.0.latitude', 0.3476)
            ->assertJsonPath('data.assigned_route.0.longitude', 32.5825);
    }
}
