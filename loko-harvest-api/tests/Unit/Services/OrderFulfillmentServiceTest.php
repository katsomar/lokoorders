<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\OrderFulfillmentService;
use App\Models\User;
use App\Models\Customer;
use App\Models\SalesStore;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;

class OrderFulfillmentServiceTest extends TestCase
{
    use RefreshDatabase;

    protected OrderFulfillmentService $service;
    protected User $user;
    protected Customer $customer;
    protected SalesStore $salesStore;
    protected Product $productEggs;
    protected Product $productFeed;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new OrderFulfillmentService();

        $this->user = User::factory()->create([
            'role' => 'admin',
        ]);

        $zone = \App\Models\DeliveryZone::create([
            'name' => 'Kampala Central',
        ]);


        $this->customer = Customer::create([
            'name' => 'Test Outlet Store',
            'contact_person' => 'Jane Doe',
            'phone_primary' => '+256700000000',
            'address' => 'Kampala Central',
            'delivery_zone_id' => $zone->id,
            'customer_type' => 'supermarket',
            'credit_terms' => '7_days',
            'credit_limit' => 5000000,
            'date_registered' => now()->toDateString(),
            'classification' => 'independent',
            'created_by' => $this->user->id,
        ]);






        $this->salesStore = SalesStore::create([
            'name' => 'Main Sales Depot',
            'code' => 'SLS-01',
            'location' => 'Kampala',
        ]);

        $this->productEggs = Product::create([
            'name' => '15-Pack Large Eggs',
            'code' => 'EGG-15P',
            'category' => 'eggs',
            'unit_of_measure' => 'trays',
            'default_unit_price' => 12000,
            'sales_unit_price' => 12000,
            'is_active' => true,
        ]);

        $this->productFeed = Product::create([
            'name' => 'Poultry Feed Supplement',
            'code' => 'FED-SUPP',
            'category' => 'by_products',
            'unit_of_measure' => 'kg',
            'default_unit_price' => 4500,
            'sales_unit_price' => 4500,
            'is_active' => true,
        ]);

    }

    public function test_creates_pending_order_with_sequential_order_number()
    {
        $year = date('Y');
        $payload = [
            'fiscal_document_number' => 'FDN-998822',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $this->salesStore->id,
            'order_date' => now()->toDateString(),
            'required_delivery_date' => now()->addDays(2)->toDateString(),
            'urgency' => 'urgent',
            'order_notes' => 'Priority morning delivery requested',
            'items' => [
                [
                    'product_id' => $this->productEggs->id,
                    'batch_reference' => 'BATCH-2026-07',
                    'quantity' => 10,
                    'unit_price' => 12000,
                ],
                [
                    'product_id' => $this->productFeed->id,
                    'batch_reference' => null,
                    'quantity' => 5,
                    'unit_price' => 4500,
                ],
            ]
        ];

        $order = $this->service->createOrder($payload, $this->user->id);

        $this->assertInstanceOf(Order::class, $order);
        $this->assertStringStartsWith("LHO-{$year}-", $order->order_number);
        $this->assertEquals('pending', $order->status);
        $this->assertEquals(142500, $order->total_amount); // (10 * 12000) + (5 * 4500)
        $this->assertCount(2, $order->items);
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => 'pending',
            'total_amount' => 142500,
        ]);
    }

    public function test_product_supports_batch_logic()
    {
        $this->assertTrue($this->service->productSupportsBatch($this->productEggs));
        $this->assertFalse($this->service->productSupportsBatch($this->productFeed));
    }

    public function test_updates_order_status_and_records_status_history()
    {
        $order = Order::create([
            'order_number' => 'LHO-2026-0001',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $this->salesStore->id,
            'order_date' => now()->toDateString(),
            'required_delivery_date' => now()->addDay()->toDateString(),
            'urgency' => 'normal',
            'total_amount' => 50000,
            'status' => 'processing',
            'created_by' => $this->user->id,
        ]);

        $updatedOrder = $this->service->updateOrderStatus(
            $order,
            'ready_for_dispatch',
            'Packed and staged at loading bay 2',
            null,
            $this->user->id
        );

        $this->assertEquals('ready_for_dispatch', $updatedOrder->status);
        $this->assertDatabaseHas('order_status_history', [
            'order_id' => $order->id,
            'status' => 'ready_for_dispatch',
            'notes' => 'Packed and staged at loading bay 2',
            'changed_by' => $this->user->id,
        ]);

    }

    public function test_prevents_updating_or_deleting_dispatched_orders()
    {
        $order = Order::create([
            'order_number' => 'LHO-2026-0002',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $this->salesStore->id,
            'order_date' => now()->toDateString(),
            'required_delivery_date' => now()->addDay()->toDateString(),
            'urgency' => 'normal',
            'total_amount' => 50000,
            'status' => 'dispatched',
            'created_by' => $this->user->id,
        ]);

        $this->expectException(InvalidArgumentException::class);
        $this->service->deleteOrder($order, $this->user->id);
    }
}

