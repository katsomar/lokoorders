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

class SalesStoreSalesTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Customer $customer1;
    protected Customer $customer2;
    protected Product $product1;
    protected Product $product2;
    protected SalesStore $storeA;
    protected SalesStore $storeB;

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

        $this->customer1 = Customer::create([
            'name' => 'Customer A',
            'contact_person' => 'Contact A',
            'phone_primary' => '+256772000000',
            'email' => 'customerA@example.com',
            'address' => 'Kampala',
            'delivery_zone_id' => $zone->id,
            'customer_type' => 'supermarket',
            'credit_terms' => 'cash',
            'credit_limit' => 1000000.00,
            'account_status' => 'active',
            'date_registered' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        $this->customer2 = Customer::create([
            'name' => 'Customer B',
            'contact_person' => 'Contact B',
            'phone_primary' => '+256772111111',
            'email' => 'customerB@example.com',
            'address' => 'Entebbe',
            'delivery_zone_id' => $zone->id,
            'customer_type' => 'supermarket',
            'credit_terms' => 'cash',
            'credit_limit' => 1000000.00,
            'account_status' => 'active',
            'date_registered' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        $this->product1 = Product::create([
            'name' => 'Cream Eggs (Trays)',
            'code' => 'EGG-CRM',
            'category' => 'eggs',
            'unit_of_measure' => 'trays',
            'default_unit_price' => 13000,
            'sales_unit_price' => 15000,
        ]);

        $this->product2 = Product::create([
            'name' => 'White Eggs (Trays)',
            'code' => 'EGG-WHT',
            'category' => 'eggs',
            'unit_of_measure' => 'trays',
            'default_unit_price' => 12000,
            'sales_unit_price' => 14000,
        ]);

        $this->storeA = SalesStore::create([
            'name' => 'Sales Store A',
            'code' => 'SSA',
            'location' => 'Kampala',
        ]);

        $this->storeB = SalesStore::create([
            'name' => 'Sales Store B',
            'code' => 'SSB',
            'location' => 'Entebbe',
        ]);
    }

    public function test_can_fetch_sales_with_no_filters()
    {
        $order1 = Order::create([
            'order_number' => 'LHO-2026-0001',
            'customer_id' => $this->customer1->id,
            'sales_store_id' => $this->storeA->id,
            'order_date' => '2026-06-01',
            'required_delivery_date' => '2026-06-02',
            'urgency' => 'normal',
            'total_amount' => 150000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $this->product1->id,
            'quantity' => 10,
            'unit_price' => 15000,
            'line_total' => 150000,
        ]);

        $order2 = Order::create([
            'order_number' => 'LHO-2026-0002',
            'customer_id' => $this->customer2->id,
            'sales_store_id' => $this->storeB->id,
            'order_date' => '2026-06-02',
            'required_delivery_date' => '2026-06-03',
            'urgency' => 'urgent',
            'total_amount' => 280000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => $this->product2->id,
            'quantity' => 20,
            'unit_price' => 14000,
            'line_total' => 280000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/sales-store-sales');

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 2);
    }

    public function test_can_filter_sales_by_sales_store()
    {
        $order1 = Order::create([
            'order_number' => 'LHO-2026-0001',
            'customer_id' => $this->customer1->id,
            'sales_store_id' => $this->storeA->id,
            'order_date' => '2026-06-01',
            'required_delivery_date' => '2026-06-02',
            'urgency' => 'normal',
            'total_amount' => 150000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $this->product1->id,
            'quantity' => 10,
            'unit_price' => 15000,
            'line_total' => 150000,
        ]);

        $order2 = Order::create([
            'order_number' => 'LHO-2026-0002',
            'customer_id' => $this->customer2->id,
            'sales_store_id' => $this->storeB->id,
            'order_date' => '2026-06-02',
            'required_delivery_date' => '2026-06-03',
            'urgency' => 'urgent',
            'total_amount' => 280000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => $this->product2->id,
            'quantity' => 20,
            'unit_price' => 14000,
            'line_total' => 280000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/sales-store-sales?sales_store_id=' . $this->storeA->id);

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.quantity', 10);
    }

    public function test_can_filter_sales_by_product()
    {
        $order1 = Order::create([
            'order_number' => 'LHO-2026-0001',
            'customer_id' => $this->customer1->id,
            'sales_store_id' => $this->storeA->id,
            'order_date' => '2026-06-01',
            'required_delivery_date' => '2026-06-02',
            'urgency' => 'normal',
            'total_amount' => 150000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $this->product1->id,
            'quantity' => 10,
            'unit_price' => 15000,
            'line_total' => 150000,
        ]);

        $order2 = Order::create([
            'order_number' => 'LHO-2026-0002',
            'customer_id' => $this->customer2->id,
            'sales_store_id' => $this->storeB->id,
            'order_date' => '2026-06-02',
            'required_delivery_date' => '2026-06-03',
            'urgency' => 'urgent',
            'total_amount' => 280000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => $this->product2->id,
            'quantity' => 20,
            'unit_price' => 14000,
            'line_total' => 280000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/sales-store-sales?product_id=' . $this->product2->id);

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.quantity', 20);
    }

    public function test_can_filter_sales_by_date_range()
    {
        $order1 = Order::create([
            'order_number' => 'LHO-2026-0001',
            'customer_id' => $this->customer1->id,
            'sales_store_id' => $this->storeA->id,
            'order_date' => '2026-06-01',
            'required_delivery_date' => '2026-06-02',
            'urgency' => 'normal',
            'total_amount' => 150000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $this->product1->id,
            'quantity' => 10,
            'unit_price' => 15000,
            'line_total' => 150000,
        ]);

        $order2 = Order::create([
            'order_number' => 'LHO-2026-0002',
            'customer_id' => $this->customer2->id,
            'sales_store_id' => $this->storeB->id,
            'order_date' => '2026-06-05',
            'required_delivery_date' => '2026-06-06',
            'urgency' => 'urgent',
            'total_amount' => 280000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => $this->product2->id,
            'quantity' => 20,
            'unit_price' => 14000,
            'line_total' => 280000,
        ]);

        $order3 = Order::create([
            'order_number' => 'LHO-2026-0003',
            'customer_id' => $this->customer1->id,
            'sales_store_id' => $this->storeA->id,
            'order_date' => '2026-06-10',
            'required_delivery_date' => '2026-06-11',
            'urgency' => 'normal',
            'total_amount' => 300000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order3->id,
            'product_id' => $this->product1->id,
            'quantity' => 20,
            'unit_price' => 15000,
            'line_total' => 300000,
        ]);

        // Filter from 2026-06-03 to 2026-06-08 (should only match order2)
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/sales-store-sales?start_date=2026-06-03&end_date=2026-06-08');

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.quantity', 20);
    }
}
