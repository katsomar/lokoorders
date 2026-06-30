<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\SalesStore;
use App\Models\SalesStoreStock;
use App\Models\User;
use App\Models\ReturnVoucher;
use App\Models\Delivery;
use App\Models\OrderReplacementAllocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReplacementAllocationTest extends TestCase
{
    use RefreshDatabase;

    private $user;
    private $store;
    private $product;
    private $order;
    private $driver;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => 'admin']);
        $this->actingAs($this->user);

        $this->store = SalesStore::create([
            'name' => 'Main Sales Store',
            'code' => 'MSS',
            'location' => 'Main Depot'
        ]);

        $this->product = Product::create([
            'name' => 'Loko Eggs',
            'code' => 'LKE-01',
            'category' => 'eggs',
            'unit_of_measure' => 'trays',
            'default_unit_price' => 13000,
            'sales_unit_price' => 15000
        ]);

        // Add store stock
        SalesStoreStock::create([
            'sales_store_id' => $this->store->id,
            'product_id' => $this->product->id,
            'batch_reference' => 'Batch-A',
            'current_quantity' => 10.00,
            'updated_by' => $this->user->id
        ]);

        // Create order
        $customer = \App\Models\Customer::create([
            'name' => 'Shoprite HQ',
            'contact_person' => 'Sarah',
            'phone_primary' => '0770000000',
            'address' => 'Kampala',
            'delivery_zone_id' => \App\Models\DeliveryZone::create(['name' => 'Zone A'])->id,
            'customer_type' => 'supermarket',
            'credit_terms' => 'cash',
            'credit_limit' => 1000000.00,
            'account_status' => 'active',
            'date_registered' => now()->toDateString(),
            'created_by' => $this->user->id
        ]);

        $this->order = Order::create([
            'order_number' => 'LHO-2026-9999',
            'customer_id' => $customer->id,
            'sales_store_id' => $this->store->id,
            'order_date' => now()->toDateString(),
            'required_delivery_date' => now()->addDays(2)->toDateString(),
            'urgency' => 'normal',
            'total_amount' => 150000.00,
            'status' => 'pending',
            'created_by' => $this->user->id
        ]);

        OrderItem::create([
            'order_id' => $this->order->id,
            'product_id' => $this->product->id,
            'quantity' => 10.00,
            'unit_price' => 15000.00,
            'line_total' => 150000.00
        ]);

        // Create mock vehicle and driver
        $vehicle = \App\Models\Vehicle::create([
            'registration_number' => 'UBL 482Y',
            'make' => 'Isuzu',
            'model' => 'Crate Truck',
            'max_crates_capacity' => 500,
            'fuel_level' => 50,
            'status' => 'active',
        ]);

        $driverUser = User::factory()->create(['role' => 'driver']);
        $this->driver = \App\Models\Driver::create([
            'user_id' => $driverUser->id,
            'full_name' => $driverUser->name,
            'phone' => '0771234567',
            'vehicle_id' => $vehicle->id,
            'license_number' => 'UG-7777',
            'employment_status' => 'active',
            'date_joined' => '2025-01-15',
        ]);
    }

    public function test_can_create_replacement_allocation_and_decrements_stock()
    {
        $response = $this->postJson('/api/v1/replacement-allocations', [
            'order_id' => $this->order->id,
            'product_id' => $this->product->id,
            'sales_store_id' => $this->store->id,
            'batch_reference' => 'Batch-A',
            'allocated_quantity' => 5.00,
            'driver_id' => $this->driver->id
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        // Verify stock is decremented
        $this->assertDatabaseHas('sales_store_stock', [
            'sales_store_id' => $this->store->id,
            'product_id' => $this->product->id,
            'batch_reference' => 'Batch-A',
            'current_quantity' => 5.00 // 10 - 5 = 5
        ]);

        // Verify movement log
        $this->assertDatabaseHas('sales_store_movements', [
            'sales_store_id' => $this->store->id,
            'product_id' => $this->product->id,
            'batch_reference' => 'Batch-A',
            'movement_type' => 'dispatch_out',
            'quantity' => 5.00
        ]);
    }

    public function test_cannot_create_allocation_with_insufficient_stock()
    {
        $response = $this->postJson('/api/v1/replacement-allocations', [
            'order_id' => $this->order->id,
            'product_id' => $this->product->id,
            'sales_store_id' => $this->store->id,
            'batch_reference' => 'Batch-A',
            'allocated_quantity' => 15.00, // Exceeds 10 available
            'driver_id' => $this->driver->id
        ]);

        $response->assertStatus(422);
    }

    public function test_driver_cannot_replace_more_than_allocated_quantity()
    {
        // 1. Create Allocation of 3 trays
        $allocation = OrderReplacementAllocation::create([
            'order_id' => $this->order->id,
            'driver_id' => $this->driver->id,
            'product_id' => $this->product->id,
            'sales_store_id' => $this->store->id,
            'batch_reference' => 'Batch-A',
            'allocated_quantity' => 3.00,
            'delivered_quantity' => 0.00,
            'returned_quantity' => 0.00,
            'status' => 'allocated',
            'created_by' => $this->user->id
        ]);

        // Create return voucher
        $delivery = Delivery::create([
            'order_id' => $this->order->id,
            'driver_id' => $this->driver->id,
            'assigned_by' => $this->user->id,
            'status' => 'delivered',
            'dispatched_at' => now()
        ]);

        $voucher = ReturnVoucher::create([
            'voucher_number' => 'LHRV-2026-9999',
            'delivery_id' => $delivery->id,
            'order_id' => $this->order->id,
            'customer_id' => $this->order->customer_id,
            'return_date' => now()->toDateString(),
            'reason_code' => 'rotten_spoiled',
            'product_id' => $this->product->id,
            'quantity' => 5.00,
            'unit_price' => 15000.00,
            'monetary_value' => 75000.00,
            'return_type' => 'physical_replacement',
            'created_by' => $this->user->id
        ]);

        // 2. Try to replace 4 trays (exceeds allocation of 3)
        $response = $this->postJson('/api/v1/returns/replacements', [
            'acknowledged_by' => 'John Rep',
            'signature_data' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'replacements' => [
                [
                    'return_voucher_id' => $voucher->id,
                    'replacement_quantity' => 4.00
                ]
            ]
        ]);

        $response->assertStatus(500); // Throws exception matching constraints
    }

    public function test_can_return_leftover_replacements_to_store()
    {
        // Create allocation of 5 trays
        $allocation = OrderReplacementAllocation::create([
            'order_id' => $this->order->id,
            'driver_id' => $this->driver->id,
            'product_id' => $this->product->id,
            'sales_store_id' => $this->store->id,
            'batch_reference' => 'Batch-A',
            'allocated_quantity' => 5.00,
            'delivered_quantity' => 2.00, // 2 were replaced on road
            'returned_quantity' => 0.00,
            'status' => 'allocated',
            'created_by' => $this->user->id
        ]);

        // Return leftover (3 trays) to depot store
        $response = $this->postJson("/api/v1/replacement-allocations/{$allocation->id}/return", [
            'sales_store_id' => $this->store->id,
            'batch_reference' => 'Batch-A',
            'quantity' => 3.00
        ]);

        $response->assertStatus(200);

        // Verify stock is restored
        $this->assertDatabaseHas('sales_store_stock', [
            'sales_store_id' => $this->store->id,
            'product_id' => $this->product->id,
            'batch_reference' => 'Batch-A',
            'current_quantity' => 13.00
        ]);

        // Verify allocation record status
        $this->assertDatabaseHas('order_replacement_allocations', [
            'id' => $allocation->id,
            'returned_quantity' => 3.00,
            'status' => 'returned'
        ]);
    }
}
