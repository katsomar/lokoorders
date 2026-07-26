<?php

namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Services\BillingService;
use App\Models\User;
use App\Models\Customer;
use App\Models\CustomerAccount;
use App\Models\DeliveryZone;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\SalesStore;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BillingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected BillingService $service;
    protected User $user;
    protected Customer $customer;
    protected SalesStore $salesStore;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new BillingService();

        $this->user = User::factory()->create(['role' => 'admin']);

        $zone = DeliveryZone::create(['name' => 'Kampala Central']);

        $this->customer = Customer::create([
            'name' => 'KFC Central Depot',
            'contact_person' => 'John Manager',
            'phone_primary' => '+256770000000',
            'address' => 'Kampala Central',
            'delivery_zone_id' => $zone->id,
            'customer_type' => 'supermarket',
            'credit_terms' => '7_days',
            'credit_limit' => 10000000,
            'date_registered' => now()->toDateString(),
            'classification' => 'independent',

            'created_by' => $this->user->id,
        ]);

        $this->salesStore = SalesStore::create([
            'name' => 'Main Sales Depot',
            'code' => 'SLS-01',
            'location' => 'Kampala',
        ]);
    }

    public function test_records_payment_and_updates_customer_balance_ledger()
    {
        $payload = [
            'customer_id' => $this->customer->id,
            'payment_date' => now()->toDateString(),
            'amount' => 500000,
            'payment_method' => 'bank_transfer',
            'reference_number' => 'REF-BANK-9911',
            'notes' => 'Monthly settlement payment',
        ];

        $payment = $this->service->recordPayment($payload, false, null, $this->user->id);

        $this->assertEquals('completed', $payment->status);
        $this->assertEquals(500000, $payment->amount);
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'payment_number' => $payment->payment_number,
            'amount' => 500000,
        ]);

        $account = CustomerAccount::where('customer_id', $this->customer->id)->first();
        $this->assertEquals(-500000, $account->current_balance);
        $this->assertEquals(500000, $account->total_paid);

        $this->assertDatabaseHas('account_transactions', [
            'customer_id' => $this->customer->id,
            'type' => 'payment_received',
            'credit_amount' => 500000,
            'running_balance' => -500000,
        ]);
    }

    public function test_auto_allocates_payment_to_unpaid_invoices()
    {
        $order = Order::create([
            'order_number' => 'LHO-2026-0099',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $this->salesStore->id,
            'order_date' => now()->toDateString(),
            'required_delivery_date' => now()->addDay()->toDateString(),
            'urgency' => 'normal',
            'total_amount' => 300000,
            'status' => 'processing',
            'created_by' => $this->user->id,
        ]);

        $invoice = Invoice::create([
            'invoice_number' => 'LHI-2026-0099',
            'order_id' => $order->id,
            'customer_id' => $this->customer->id,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'subtotal' => 300000,
            'tax_amount' => 0,
            'total_amount' => 300000,
            'payment_method' => 'cash',
            'status' => 'unpaid',
            'created_by' => $this->user->id,
        ]);

        $payload = [
            'customer_id' => $this->customer->id,
            'payment_date' => now()->toDateString(),
            'amount' => 300000,
            'payment_method' => 'cash',
            'reference_number' => 'CASH-001',
        ];

        $payment = $this->service->recordPayment($payload, true, null, $this->user->id);

        $this->assertDatabaseHas('payment_invoice_allocations', [
            'payment_id' => $payment->id,
            'invoice_id' => $invoice->id,
            'amount_allocated' => 300000,
        ]);

        $invoice->refresh();
        $this->assertEquals('paid', $invoice->status);
    }
}
