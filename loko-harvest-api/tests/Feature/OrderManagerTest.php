<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\SalesStore;
use App\Models\SalesStoreStock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OrderManagerTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $orderManager;
    protected Customer $customer;
    protected SalesStore $store;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Admin
        $this->admin = User::create([
            'name' => 'HQ Admin',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'active',
            'phone' => '0700000000',
        ]);

        // Create active Order Manager
        $this->orderManager = User::create([
            'name' => 'Order Manager Bob',
            'email' => 'manager@test.com',
            'password' => Hash::make('password'),
            'role' => 'order_manager',
            'status' => 'active',
            'phone' => '0700000001',
        ]);

        $zone = \App\Models\DeliveryZone::create([
            'name' => 'Kampala Central',
            'description' => 'City center',
        ]);

        $this->customer = Customer::create([
            'name' => 'Shoprite Lugogo',
            'contact_person' => 'Manager',
            'phone_primary' => '+256772000000',
            'email' => 'shoprite@example.com',
            'address' => 'Lugogo Mall',
            'delivery_zone_id' => $zone->id,
            'customer_type' => 'supermarket',
            'credit_terms' => 'cash',
            'credit_limit' => 1000000.00,
            'account_status' => 'active',
            'date_registered' => now()->toDateString(),
            'created_by' => $this->admin->id,
        ]);

        $this->store = SalesStore::create([
            'name' => 'Main Sales Store',
            'code' => 'MSS',
            'location' => 'Kampala',
        ]);
    }

    public function test_order_manager_can_self_register_and_require_approval()
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Alice Manager',
            'email' => 'alice@test.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '0700000002',
            'role' => 'order_manager',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('users', [
            'email' => 'alice@test.com',
            'role' => 'order_manager',
            'status' => 'pending',
        ]);
    }

    public function test_order_manager_can_view_orders_and_stock()
    {
        $response = $this->actingAs($this->orderManager, 'sanctum')
            ->getJson('/api/v1/orders');

        $response->assertStatus(200);

        $responseStock = $this->actingAs($this->orderManager, 'sanctum')
            ->getJson('/api/v1/sales-stock');

        $responseStock->assertStatus(200);
    }

    public function test_order_manager_can_adjust_pending_order_and_transition_status()
    {
        $product = \App\Models\Product::create([
            'name' => 'White Eggs (Trays)',
            'code' => 'EGG-WHT',
            'category' => 'eggs',
            'unit_of_measure' => 'trays',
            'default_unit_price' => 12000,
            'production_unit_price' => 10000,
            'sales_unit_price' => 14000,
        ]);

        // Add enough stock to sales store
        SalesStoreStock::create([
            'sales_store_id' => $this->store->id,
            'product_id' => $product->id,
            'batch_reference' => 'BATCH-001',
            'current_quantity' => 100,
            'updated_by' => $this->admin->id,
        ]);

        // Place a pending order
        $order = Order::create([
            'order_number' => 'LHO-2026-9999',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $this->store->id,
            'order_date' => now()->toDateString(),
            'required_delivery_date' => now()->toDateString(),
            'urgency' => 'normal',
            'total_amount' => 140000, // 10 trays * 14000
            'created_by' => $this->admin->id,
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'batch_reference' => 'BATCH-001',
            'quantity' => 10,
            'unit_price' => 14000,
            'line_total' => 140000,
        ]);

        // Order Manager adjusts quantities (e.g. changes quantity from 10 to 5)
        $responseEdit = $this->actingAs($this->orderManager, 'sanctum')
            ->putJson("/api/v1/orders/{$order->id}", [
                'customer_id' => $this->customer->id,
                'sales_store_id' => $this->store->id,
                'order_date' => now()->toDateString(),
                'required_delivery_date' => now()->toDateString(),
                'urgency' => 'normal',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'batch_reference' => 'BATCH-001',
                        'quantity' => 5,
                        'unit_price' => 14000,
                    ]
                ]
            ]);

        $responseEdit->assertStatus(200);

        // Verify order items count and details
        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'quantity' => 5,
        ]);

        // Transition status: pending -> processing
        $responseStatus = $this->actingAs($this->orderManager, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/status", [
                'status' => 'processing',
                'notes' => 'Starting prep',
            ]);

        $responseStatus->assertStatus(200);

        // Verify order status updated
        $order->refresh();
        $this->assertEquals('processing', $order->status);

        // Transition status: processing -> ready_for_dispatch
        $responseStatus2 = $this->actingAs($this->orderManager, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/status", [
                'status' => 'ready_for_dispatch',
                'notes' => 'Packed and ready',
            ]);

        $responseStatus2->assertStatus(200);
        $order->refresh();
        $this->assertEquals('ready_for_dispatch', $order->status);

        // Transition status: ready_for_dispatch -> dispatched
        $responseStatus3 = $this->actingAs($this->orderManager, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/status", [
                'status' => 'dispatched',
                'notes' => 'Left warehouse',
            ]);

        $responseStatus3->assertStatus(200);
        $order->refresh();
        $this->assertEquals('dispatched', $order->status);
    }
}
