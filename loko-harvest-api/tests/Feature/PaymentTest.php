<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\CustomerAccount;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
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
            'created_by' => $this->user->id,
        ]);

        CustomerAccount::create([
            'customer_id' => $this->customer->id,
            'current_balance' => 500000,
            'total_invoiced' => 500000,
            'total_paid' => 0,
        ]);
    }

    public function test_can_record_payment_and_auto_allocate()
    {
        $store = \App\Models\SalesStore::create([
            'name' => 'Main Sales Store',
            'code' => 'MSS',
            'location' => 'Kampala',
        ]);

        $order = \App\Models\Order::create([
            'order_number' => 'LHO-2026-0001',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $store->id,
            'order_date' => now()->toDateString(),
            'required_delivery_date' => now()->toDateString(),
            'urgency' => 'normal',
            'total_amount' => 500000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        $invoice = Invoice::create([
            'invoice_number' => 'LHI-2026-0001',
            'order_id' => $order->id,
            'customer_id' => $this->customer->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'subtotal' => 500000,
            'tax_amount' => 0,
            'total_amount' => 500000,
            'payment_method' => 'cash',
            'status' => 'unpaid',
            'created_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/payments', [
                'customer_id' => $this->customer->id,
                'payment_date' => now()->toDateString(),
                'amount' => 300000,
                'payment_method' => 'bank_transfer',
                'reference_number' => 'REF123',
                'notes' => 'Test payment notes',
                'auto_allocate' => true,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'payment_number',
                    'customer_id',
                    'payment_date',
                    'amount',
                    'payment_method',
                    'reference_number',
                    'status',
                    'created_by',
                    'received_by',
                ],
            ]);

        // Assert payment recorded in DB
        $this->assertDatabaseHas('payments', [
            'customer_id' => $this->customer->id,
            'amount' => 300000,
            'payment_method' => 'bank_transfer',
            'reference_number' => 'REF123',
            'status' => 'completed',
            'created_by' => $this->user->id,
            'received_by' => $this->user->id,
        ]);

        // Assert customer account balance updated (500000 - 300000 = 200000)
        $account = CustomerAccount::where('customer_id', $this->customer->id)->first();
        $this->assertEquals(200000, $account->current_balance);
        $this->assertEquals(300000, $account->total_paid);

        // Assert account transaction logged
        $this->assertDatabaseHas('account_transactions', [
            'customer_id' => $this->customer->id,
            'type' => 'payment_received',
            'credit_amount' => 300000,
            'running_balance' => 200000,
            'created_by' => $this->user->id,
        ]);

        // Assert allocation to invoice happened
        $this->assertDatabaseHas('payment_invoice_allocations', [
            'invoice_id' => $invoice->id,
            'amount_allocated' => 300000,
        ]);

        // Assert invoice is partially paid
        $invoice->refresh();
        $this->assertEquals('partially_paid', $invoice->status);
    }

    public function test_can_fetch_payments_list()
    {
        Payment::create([
            'payment_number' => 'LHP-20260626-0001',
            'customer_id' => $this->customer->id,
            'payment_date' => now()->toDateString(),
            'amount' => 100000,
            'payment_method' => 'cash',
            'status' => 'completed',
            'created_by' => $this->user->id,
            'received_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/payments');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => [
                            'id',
                            'payment_number',
                            'amount',
                            'payment_method',
                            'customer',
                        ]
                    ]
                ]
            ]);
    }

    public function test_can_fetch_payment_metrics()
    {
        Payment::create([
            'payment_number' => 'LHP-20260626-0001',
            'customer_id' => $this->customer->id,
            'payment_date' => now()->toDateString(),
            'amount' => 100000,
            'payment_method' => 'cash',
            'status' => 'completed',
            'created_by' => $this->user->id,
            'received_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/payments/metrics');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'total_mtd_collections' => 100000.00,
                    'top_method' => 'cash',
                    'top_method_share' => 100,
                    'total_outstanding' => 500000.00,
                ]
            ]);
    }
}
