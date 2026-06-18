<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\SalesStore;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerConsumptionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Customer $customer;
    protected Product $product;
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
            'name' => 'Mega Supermarket',
            'contact_person' => 'Contact Mega',
            'phone_primary' => '+256772000000',
            'email' => 'mega@example.com',
            'address' => 'Kampala',
            'delivery_zone_id' => $zone->id,
            'customer_type' => 'supermarket',
            'credit_terms' => '14_days',
            'credit_limit' => 50000000.00,
            'account_status' => 'active',
            'date_registered' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        $this->product = Product::create([
            'name' => 'Cream Eggs (Trays)',
            'code' => 'EGG-CRM',
            'category' => 'eggs',
            'unit_of_measure' => 'trays',
            'default_unit_price' => 13000,
            'sales_unit_price' => 15000,
        ]);

        $this->store = SalesStore::create([
            'name' => 'Sales Store A',
            'code' => 'SSA',
            'location' => 'Kampala',
        ]);
    }

    public function test_can_fetch_customer_consumption_analysis()
    {
        // Place two orders to calculate intervals
        $order1 = Order::create([
            'order_number' => 'LHO-2026-0001',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $this->store->id,
            'order_date' => '2026-06-01',
            'required_delivery_date' => '2026-06-02',
            'urgency' => 'normal',
            'total_amount' => 150000,
            'created_by' => $this->user->id,
            'status' => 'delivered',
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_price' => 15000,
            'line_total' => 150000,
        ]);

        $order2 = Order::create([
            'order_number' => 'LHO-2026-0002',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $this->store->id,
            'order_date' => '2026-06-05',
            'required_delivery_date' => '2026-06-06',
            'urgency' => 'normal',
            'total_amount' => 300000,
            'created_by' => $this->user->id,
            'status' => 'delivered',
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => $this->product->id,
            'quantity' => 20,
            'unit_price' => 15000,
            'line_total' => 300000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/customers/{$this->customer->id}/consumption-analysis");

        $response->assertStatus(200)
            ->assertJsonPath('data.customer_name', 'Mega Supermarket')
            ->assertJsonPath('data.metrics.order_count', 2)
            ->assertJsonPath('data.metrics.avg_frequency_days', 4)
            ->assertJsonPath('data.metrics.total_qty_ordered', 30)
            ->assertJsonPath('data.metrics.total_value_ordered', 450000)
            ->assertJsonPath('data.product_breakdown.0.product_name', 'Cream Eggs (Trays)')
            ->assertJsonPath('data.product_breakdown.0.total_qty', 30);
    }
}
