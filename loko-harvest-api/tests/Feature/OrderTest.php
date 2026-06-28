<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\SalesStore;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Customer $customer;
    protected SalesStore $store;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Test Operator',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'status' => 'active',
            'phone' => '0700000000',
        ]);

        $zone = \App\Models\DeliveryZone::create([
            'name' => 'Kampala Central',
            'description' => 'City center and surrounding areas',
        ]);

        $this->customer = Customer::create([
            'name' => 'Test Customer',
            'contact_person' => 'Contact Person',
            'phone_primary' => '+256772000000',
            'email' => 'testcustomer@example.com',
            'address' => 'Kampala',
            'delivery_zone_id' => $zone->id,
            'customer_type' => 'supermarket',
            'credit_terms' => 'cash',
            'credit_limit' => 1000000.00,
            'account_status' => 'active',
            'date_registered' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        $this->store = SalesStore::create([
            'name' => 'Main Sales Store',
            'code' => 'MSS',
            'location' => 'Kampala',
        ]);
    }

    public function test_can_filter_orders_by_missed_status()
    {
        // 1. Pending order due in past -> MISSED
        $missedOrder = Order::create([
            'order_number' => 'LHO-2026-0001',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $this->store->id,
            'order_date' => now()->subDays(5)->toDateString(),
            'required_delivery_date' => now()->subDays(3)->toDateString(),
            'urgency' => 'normal',
            'total_amount' => 10000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        // 2. Delivered order due in past -> NOT MISSED (already delivered)
        $deliveredOrder = Order::create([
            'order_number' => 'LHO-2026-0002',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $this->store->id,
            'order_date' => now()->subDays(5)->toDateString(),
            'required_delivery_date' => now()->subDays(3)->toDateString(),
            'urgency' => 'normal',
            'total_amount' => 20000,
            'created_by' => $this->user->id,
            'status' => 'delivered',
        ]);

        // 3. Pending order due in future -> NOT MISSED (due later)
        $futureOrder = Order::create([
            'order_number' => 'LHO-2026-0003',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $this->store->id,
            'order_date' => now()->toDateString(),
            'required_delivery_date' => now()->addDays(3)->toDateString(),
            'urgency' => 'normal',
            'total_amount' => 30000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        // Query status=missed
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/orders?status=missed');

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.id', $missedOrder->id);
    }

    public function test_order_is_not_billed_until_processing()
    {
        // 1. Create a new pending order via API
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/orders', [
                'customer_id' => $this->customer->id,
                'sales_store_id' => $this->store->id,
                'order_date' => now()->toDateString(),
                'required_delivery_date' => now()->addDays(2)->toDateString(),
                'urgency' => 'normal',
                'items' => [
                    [
                        'product_id' => \App\Models\Product::create([
                            'name' => 'Grade A Eggs (Large)',
                            'code' => 'EGG-GRA-L',
                            'category' => 'eggs',
                            'unit_of_measure' => 'trays',
                            'default_unit_price' => 13000,
                            'sales_unit_price' => 15000,
                        ])->id,
                        'quantity' => 10,
                        'unit_price' => 15000,
                    ]
                ]
            ]);

        $response->assertStatus(201);
        $orderId = $response->json('data.id');

        // Verify no invoice is generated
        $this->assertDatabaseMissing('invoices', [
            'order_id' => $orderId,
        ]);

        // Verify customer account is not billed
        $account = \App\Models\CustomerAccount::where('customer_id', $this->customer->id)->first();
        $this->assertTrue($account === null || (float)$account->current_balance === 0.0);

        // 2. Transition status to processing
        $responseTransition = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/v1/orders/{$orderId}/status", [
                'status' => 'processing',
                'notes' => 'Starting prep',
                'admin_override_reason' => 'Test override',
            ]);

        $responseTransition->assertStatus(200);

        // Verify invoice is generated
        $this->assertDatabaseHas('invoices', [
            'order_id' => $orderId,
        ]);

        // Verify customer account is now billed
        $account = \App\Models\CustomerAccount::where('customer_id', $this->customer->id)->first();
        $this->assertEquals(150000.0, (float)$account->current_balance);
    }

    public function test_driver_assignment_does_not_skip_stages_on_pending_order()
    {
        // 1. Create a driver and vehicle
        $vehicle = \App\Models\Vehicle::create([
            'registration_number' => 'UBL 482Y',
            'make' => 'Isuzu',
            'model' => 'Crate Truck',
            'max_crates_capacity' => 500,
            'fuel_level' => 50,
            'status' => 'active',
        ]);

        $driverUser = User::create([
            'name' => 'Sarah Driver',
            'email' => 'driver@example.com',
            'password' => bcrypt('password'),
            'role' => 'driver',
            'status' => 'active',
            'phone' => '0700111222',
        ]);

        $driver = \App\Models\Driver::create([
            'user_id' => $driverUser->id,
            'full_name' => $driverUser->name,
            'phone' => $driverUser->phone,
            'vehicle_id' => $vehicle->id,
            'license_number' => 'UG-7777',
            'employment_status' => 'active',
            'date_joined' => '2025-01-15',
        ]);

        // 2. Create pending order
        $order = Order::create([
            'order_number' => 'LHO-2026-0004',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $this->store->id,
            'order_date' => now()->toDateString(),
            'required_delivery_date' => now()->addDays(2)->toDateString(),
            'urgency' => 'normal',
            'total_amount' => 10000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        // 3. Assign driver
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/deliveries/assign', [
                'order_id' => $order->id,
                'driver_id' => $driver->id,
            ]);

        $response->assertStatus(200);

        // Verify delivery record exists
        $this->assertDatabaseHas('deliveries', [
            'order_id' => $order->id,
            'driver_id' => $driver->id,
            'status' => 'assigned',
        ]);

        // Verify order status remains pending
        $order->refresh();
        $this->assertEquals('pending', $order->status);

        // Verify no invoice is generated
        $this->assertDatabaseMissing('invoices', [
            'order_id' => $order->id,
        ]);
    }

    public function test_undone_delivery_and_redispatch_stock_handling()
    {
        // 1. Setup products and sales stores
        $storeB = SalesStore::create([
            'name' => 'Store B Near Town',
            'code' => 'SBN',
            'location' => 'Town Bypass',
        ]);

        $product = \App\Models\Product::create([
            'name' => 'Grade A Eggs (Large)',
            'code' => 'EGG-GRA-L',
            'category' => 'eggs',
            'unit_of_measure' => 'trays',
            'default_unit_price' => 13000,
            'sales_unit_price' => 15000,
        ]);

        // Seed stock for Store A (this->store)
        \App\Models\SalesStoreStock::create([
            'sales_store_id' => $this->store->id,
            'product_id' => $product->id,
            'batch_reference' => 'BATCH-001',
            'current_quantity' => 100.0,
            'updated_by' => $this->user->id,
        ]);

        // 2. Create order for 10 units
        $order = Order::create([
            'order_number' => 'LHO-2026-0005',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $this->store->id,
            'order_date' => now()->toDateString(),
            'required_delivery_date' => now()->addDays(2)->toDateString(),
            'urgency' => 'normal',
            'total_amount' => 150000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        \App\Models\OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'batch_reference' => 'BATCH-001',
            'quantity' => 10,
            'unit_price' => 15000,
            'line_total' => 150000,
        ]);

        // Process order to commit stock
        $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/status", [
                'status' => 'processing',
                'notes' => 'Confirmed stock reservation',
            ])
            ->assertStatus(200);

        // Verify Store A stock was decremented to 90
        $this->assertEquals(90.0, (float)\App\Models\SalesStoreStock::where('sales_store_id', $this->store->id)
            ->where('product_id', $product->id)
            ->where('batch_reference', 'BATCH-001')
            ->first()->current_quantity);

        // 3. Setup driver and assign
        $vehicle = \App\Models\Vehicle::create([
            'registration_number' => 'UBL 482Y',
            'make' => 'Isuzu',
            'model' => 'Crate Truck',
            'max_crates_capacity' => 500,
            'fuel_level' => 50,
            'status' => 'active',
        ]);

        $driverUser = User::create([
            'name' => 'Sarah Driver',
            'email' => 'driver@example.com',
            'password' => bcrypt('password'),
            'role' => 'driver',
            'status' => 'active',
            'phone' => '0700111222',
        ]);

        $driver = \App\Models\Driver::create([
            'user_id' => $driverUser->id,
            'full_name' => $driverUser->name,
            'phone' => $driverUser->phone,
            'vehicle_id' => $vehicle->id,
            'license_number' => 'UG-7777',
            'employment_status' => 'active',
            'date_joined' => '2025-01-15',
        ]);

        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/deliveries/assign', [
                'order_id' => $order->id,
                'driver_id' => $driver->id,
            ])
            ->assertStatus(200);

        $delivery = \App\Models\Delivery::where('order_id', $order->id)->first();

        // 4. Start transit
        $this->actingAs($driverUser, 'sanctum')
            ->postJson("/api/v1/deliveries/{$delivery->id}/transit", [
                'delay_reason' => 'traffic',
            ])
            ->assertStatus(200);

        // 5. Declare undone returning to Store B (reason traffic -> exempted)
        $this->actingAs($driverUser, 'sanctum')
            ->postJson("/api/v1/deliveries/{$delivery->id}/undone", [
                'undone_reason' => 'traffic',
                'return_sales_store_id' => $storeB->id,
            ])
            ->assertStatus(200);

        // Verify status changes
        $delivery->refresh();
        $order->refresh();
        $this->assertEquals('undone', $delivery->status);
        $this->assertEquals('undone', $order->status);
        $this->assertFalse((bool)$delivery->is_penalized);

        // Verify Store B stock gained the 10 units (with batch preservation)
        $this->assertEquals(10.0, (float)\App\Models\SalesStoreStock::where('sales_store_id', $storeB->id)
            ->where('product_id', $product->id)
            ->where('batch_reference', 'BATCH-001')
            ->first()->current_quantity);

        // Verify Store A stock remains 90
        $this->assertEquals(90.0, (float)\App\Models\SalesStoreStock::where('sales_store_id', $this->store->id)
            ->where('product_id', $product->id)
            ->where('batch_reference', 'BATCH-001')
            ->first()->current_quantity);

        // 6. Re-dispatch the order to the same driver
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/deliveries/assign', [
                'order_id' => $order->id,
                'driver_id' => $driver->id,
            ])
            ->assertStatus(200);

        $order->refresh();
        $this->assertEquals('dispatched', $order->status);

        // Verify a new delivery record was created for the order (total 2 deliveries now)
        $this->assertEquals(2, $order->deliveries()->count());

        // Verify Store A stock was decremented again by 10 (down to 80)
        $this->assertEquals(80.0, (float)\App\Models\SalesStoreStock::where('sales_store_id', $this->store->id)
            ->where('product_id', $product->id)
            ->where('batch_reference', 'BATCH-001')
            ->first()->current_quantity);

        // Verify Store B stock remains 10
        $this->assertEquals(10.0, (float)\App\Models\SalesStoreStock::where('sales_store_id', $storeB->id)
            ->where('product_id', $product->id)
            ->where('batch_reference', 'BATCH-001')
            ->first()->current_quantity);
    }
}
