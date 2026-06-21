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
}
