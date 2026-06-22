<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\CustomerAccount;
use App\Models\Order;
use App\Models\Payment;
use App\Models\SalesStore;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Customer $customer;
    protected SalesStore $store;

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
            'current_balance' => 12500000,
            'total_invoiced' => 15000000,
            'total_paid' => 2500000,
        ]);

        $this->store = SalesStore::create([
            'name' => 'Main Sales Store',
            'code' => 'MSS',
            'location' => 'Kampala',
        ]);
    }

    public function test_can_fetch_admin_dashboard_stats()
    {
        // Place an order
        Order::create([
            'order_number' => 'LHO-2026-0001',
            'customer_id' => $this->customer->id,
            'sales_store_id' => $this->store->id,
            'order_date' => now()->toDateString(),
            'required_delivery_date' => now()->toDateString(),
            'urgency' => 'normal',
            'total_amount' => 5000000,
            'created_by' => $this->user->id,
            'status' => 'pending',
        ]);

        // Receive a payment
        Payment::create([
            'customer_id' => $this->customer->id,
            'amount' => 3000000,
            'payment_method' => 'cash',
            'payment_date' => now()->toDateString(),
            'received_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/dashboard/admin');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'fulfillment' => [
                        'active_orders',
                        'today_new_orders',
                        'active_drivers',
                        'completed_today',
                        'pending_dispatch',
                        'returned_vouchers',
                        'trend' => [
                            'value',
                            'isUp'
                        ]
                    ],
                    'financials' => [
                        'total_collections',
                        'pending_credits',
                        'top_claims',
                        'trend' => [
                            'value',
                            'isUp'
                        ]
                    ],
                    'status_distribution',
                    'revenue_trend',
                    'warehouse' => [
                        'total_value',
                        'production_value',
                        'sales_value',
                        'reserve_value',
                    ],
                    'top_customers',
                    'activity_feed'
                ]
            ]);

        // Assert values are mapped
        $this->assertEquals(3000000, $response->json('data.financials.total_collections'));
        $this->assertEquals(12500000, $response->json('data.financials.pending_credits'));
        $this->assertEquals(1, $response->json('data.fulfillment.active_orders'));
        $this->assertEquals(1, $response->json('data.fulfillment.today_new_orders'));
    }
}
