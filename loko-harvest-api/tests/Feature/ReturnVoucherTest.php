<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\CustomerAccount;
use App\Models\Delivery;
use App\Models\Driver;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ReturnVoucher;
use App\Models\SalesStore;
use App\Models\User;
use App\Models\Vehicle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReturnVoucherTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Customer $customer;
    protected Product $product;
    protected Order $order;
    protected Delivery $delivery;

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

        $zone = \App\Models\DeliveryZone::create([
            'name' => 'Kampala Central',
            'description' => 'City center',
        ]);

        $this->customer = Customer::create([
            'name' => 'Carrefour oasis',
            'contact_person' => 'Sarah Namubiru',
            'phone_primary' => '+256772000000',
            'email' => 'carrefour@example.com',
            'address' => 'Kampala',
            'delivery_zone_id' => $zone->id,
            'customer_type' => 'supermarket',
            'credit_terms' => 'cash',
            'credit_limit' => 1000000.00,
            'account_status' => 'active',
            'date_registered' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        CustomerAccount::create([
            'customer_id' => $this->customer->id,
            'current_balance' => 500000.00,
            'total_invoiced' => 500000.00,
            'total_paid' => 0.00,
        ]);

        $this->product = Product::create([
            'name' => 'Grade A Eggs (Large)',
            'code' => 'EGG-GRA-L',
            'category' => 'eggs',
            'unit_of_measure' => 'trays',
            'default_unit_price' => 13000,
            'sales_unit_price' => 15000,
        ]);

        $store = SalesStore::create([
            'name' => 'Sales Store A',
            'code' => 'SSA',
            'location' => 'Kampala',
        ]);

        $this->order = Order::create([
            'order_number' => 'LHO-2026-0001',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $store->id,
            'order_date' => '2026-06-25',
            'required_delivery_date' => '2026-06-26',
            'urgency' => 'normal',
            'total_amount' => 150000,
            'created_by' => $this->user->id,
            'status' => 'delivered',
        ]);

        OrderItem::create([
            'order_id' => $this->order->id,
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_price' => 15000,
            'line_total' => 150000,
        ]);

        $vehicle = Vehicle::create([
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

        $driver = Driver::create([
            'user_id' => $driverUser->id,
            'full_name' => $driverUser->name,
            'phone' => $driverUser->phone,
            'vehicle_id' => $vehicle->id,
            'license_number' => 'UG-7777',
            'employment_status' => 'active',
            'date_joined' => '2025-01-15',
        ]);

        $this->delivery = Delivery::create([
            'order_id' => $this->order->id,
            'driver_id' => $driver->id,
            'assigned_by' => $this->user->id,
            'dispatched_at' => now(),
            'delivered_at' => now(),
            'status' => 'delivered',
        ]);
    }

    public function test_can_fetch_returns_list()
    {
        ReturnVoucher::create([
            'voucher_number' => 'LHRV-2026-0001',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'order_id' => $this->order->id,
            'delivery_id' => $this->delivery->id,
            'quantity' => 2,
            'unit_price' => 15000,
            'monetary_value' => 30000,
            'return_type' => 'credit',
            'reason_code' => 'broken_cracked',
            'notes' => 'Some eggs cracked',
            'account_credit_posted' => false,
            'return_date' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/returns');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.voucher_number', 'LHRV-2026-0001');
    }

    public function test_can_filter_returns_by_search_reason_and_type()
    {
        ReturnVoucher::create([
            'voucher_number' => 'LHRV-2026-0001',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'order_id' => $this->order->id,
            'delivery_id' => $this->delivery->id,
            'quantity' => 2,
            'unit_price' => 15000,
            'monetary_value' => 30000,
            'return_type' => 'credit',
            'reason_code' => 'broken_cracked',
            'notes' => 'Cracked eggs',
            'account_credit_posted' => false,
            'return_date' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        ReturnVoucher::create([
            'voucher_number' => 'LHRV-2026-0002',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'order_id' => $this->order->id,
            'delivery_id' => $this->delivery->id,
            'quantity' => 3,
            'unit_price' => 15000,
            'monetary_value' => 45000,
            'return_type' => 'physical_replacement',
            'reason_code' => 'rotten_spoiled',
            'notes' => 'Spoiled eggs',
            'account_credit_posted' => false,
            'return_date' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        // Filter by return_type
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/returns?return_type=physical_replacement');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.voucher_number', 'LHRV-2026-0002');

        // Filter by reason_code
        $response2 = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/returns?reason_code=broken_cracked');

        $response2->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.voucher_number', 'LHRV-2026-0001');
    }

    public function test_can_store_return_voucher()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/returns', [
                'customer_id' => $this->customer->id,
                'product_id' => $this->product->id,
                'order_id' => $this->order->id,
                'delivery_id' => $this->delivery->id,
                'quantity' => 2,
                'unit_price' => 15000,
                'return_type' => 'credit',
                'reason_code' => 'broken_cracked',
                'notes' => 'Cracked eggs at Oasis',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.voucher_number', 'LHRV-' . date('Y') . '-0001')
            ->assertJsonPath('data.monetary_value', 30000);

        $this->assertDatabaseHas('return_vouchers', [
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
            'unit_price' => 15000,
            'monetary_value' => 30000.00,
        ]);
    }

    public function test_can_post_return_credit_to_customer_ledger()
    {
        $voucher = ReturnVoucher::create([
            'voucher_number' => 'LHRV-2026-0001',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'order_id' => $this->order->id,
            'delivery_id' => $this->delivery->id,
            'quantity' => 2,
            'unit_price' => 15000,
            'monetary_value' => 30000,
            'return_type' => 'credit',
            'reason_code' => 'broken_cracked',
            'notes' => 'Some eggs cracked',
            'account_credit_posted' => false,
            'return_date' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/v1/returns/{$voucher->id}/post-credit");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Verify account balance decremented from 500,000 to 470,000
        $account = CustomerAccount::where('customer_id', $this->customer->id)->first();
        $this->assertEquals(470000.00, $account->current_balance);

        // Verify transaction logged
        $this->assertDatabaseHas('account_transactions', [
            'customer_id' => $this->customer->id,
            'type' => 'return_credit',
            'reference_number' => 'LHRV-2026-0001',
            'credit_amount' => 30000.00,
            'debit_amount' => 0.00,
            'running_balance' => 470000.00,
        ]);

        // Verify double posting prevention
        $responseDuplicate = $this->actingAs($this->user, 'sanctum')
            ->postJson("/api/v1/returns/{$voucher->id}/post-credit");
        
        $responseDuplicate->assertStatus(422);
    }

    public function test_can_filter_returns_by_customer_id_and_pending_replacements()
    {
        ReturnVoucher::create([
            'voucher_number' => 'LHRV-2026-0001',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'order_id' => $this->order->id,
            'delivery_id' => $this->delivery->id,
            'quantity' => 5,
            'replacement_quantity' => 2,
            'unit_price' => 15000,
            'monetary_value' => 75000,
            'return_type' => 'physical_replacement',
            'reason_code' => 'broken_cracked',
            'return_date' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        ReturnVoucher::create([
            'voucher_number' => 'LHRV-2026-0002',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'order_id' => $this->order->id,
            'delivery_id' => $this->delivery->id,
            'quantity' => 3,
            'replacement_quantity' => 3, // fully replaced
            'unit_price' => 15000,
            'monetary_value' => 45000,
            'return_type' => 'physical_replacement',
            'reason_code' => 'rotten_spoiled',
            'return_date' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        // Filter by customer and pending_replacements
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/returns?customer_id={$this->customer->id}&pending_replacements=true");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.voucher_number', 'LHRV-2026-0001');
    }

    public function test_can_store_bulk_return_vouchers()
    {
        $signatureData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/returns/bulk', [
                'delivery_id' => $this->delivery->id,
                'order_id' => $this->order->id,
                'customer_id' => $this->customer->id,
                'reason_code' => 'rotten_spoiled',
                'notes' => 'Bulk returns note',
                'acknowledged_by' => 'Store Rep Sarah',
                'signature_data' => $signatureData,
                'items' => [
                    [
                        'product_id' => $this->product->id,
                        'batch_reference' => 'B-EG-25',
                        'quantity' => 4,
                        'unit_price' => 15000,
                        'replacement_quantity' => 1,
                    ]
                ]
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');

        $this->assertDatabaseHas('return_vouchers', [
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'batch_reference' => 'B-EG-25',
            'quantity' => 4,
            'replacement_quantity' => 1,
            'acknowledged_by' => 'Store Rep Sarah',
        ]);
    }

    public function test_can_deliver_replacements_for_pending_vouchers()
    {
        $voucher = ReturnVoucher::create([
            'voucher_number' => 'LHRV-2026-0001',
            'customer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'order_id' => $this->order->id,
            'delivery_id' => $this->delivery->id,
            'quantity' => 5,
            'replacement_quantity' => 2,
            'unit_price' => 15000,
            'monetary_value' => 75000,
            'return_type' => 'physical_replacement',
            'reason_code' => 'broken_cracked',
            'return_date' => now()->toDateString(),
            'created_by' => $this->user->id,
        ]);

        $signatureData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/returns/replacements', [
                'acknowledged_by' => 'Sarah Acknowledged',
                'signature_data' => $signatureData,
                'replacements' => [
                    [
                        'return_voucher_id' => $voucher->id,
                        'replacement_quantity' => 2,
                    ]
                ]
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals(4, $voucher->fresh()->replacement_quantity);
        $this->assertEquals('Sarah Acknowledged', $voucher->fresh()->acknowledged_by);
        $this->assertNotNull($voucher->fresh()->signature_path);
    }
}
