<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\SalesStore;
use App\Models\SalesStoreTransfer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesStoreTransferTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Product $product1;
    protected Product $product2;
    protected SalesStore $storeA;
    protected SalesStore $storeB;
    protected SalesStore $storeC;

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

        $this->storeC = SalesStore::create([
            'name' => 'Sales Store C',
            'code' => 'SSC',
            'location' => 'Jinja',
        ]);
    }

    public function test_can_fetch_transfers_with_no_filters()
    {
        SalesStoreTransfer::create([
            'transfer_date' => '2026-06-01',
            'product_id' => $this->product1->id,
            'from_sales_store_id' => $this->storeA->id,
            'to_sales_store_id' => $this->storeB->id,
            'quantity' => 10,
            'transferred_by' => $this->user->id,
            'notes' => 'Transfer 1',
        ]);

        SalesStoreTransfer::create([
            'transfer_date' => '2026-06-02',
            'product_id' => $this->product2->id,
            'from_sales_store_id' => $this->storeB->id,
            'to_sales_store_id' => $this->storeC->id,
            'quantity' => 20,
            'transferred_by' => $this->user->id,
            'notes' => 'Transfer 2',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/sales-store-transfers');

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 2);
    }

    public function test_can_filter_transfers_by_from_store()
    {
        SalesStoreTransfer::create([
            'transfer_date' => '2026-06-01',
            'product_id' => $this->product1->id,
            'from_sales_store_id' => $this->storeA->id,
            'to_sales_store_id' => $this->storeB->id,
            'quantity' => 10,
            'transferred_by' => $this->user->id,
            'notes' => 'Transfer 1',
        ]);

        SalesStoreTransfer::create([
            'transfer_date' => '2026-06-02',
            'product_id' => $this->product2->id,
            'from_sales_store_id' => $this->storeB->id,
            'to_sales_store_id' => $this->storeC->id,
            'quantity' => 20,
            'transferred_by' => $this->user->id,
            'notes' => 'Transfer 2',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/sales-store-transfers?from_sales_store_id=' . $this->storeA->id);

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.notes', 'Transfer 1');
    }

    public function test_can_filter_transfers_by_to_store()
    {
        SalesStoreTransfer::create([
            'transfer_date' => '2026-06-01',
            'product_id' => $this->product1->id,
            'from_sales_store_id' => $this->storeA->id,
            'to_sales_store_id' => $this->storeB->id,
            'quantity' => 10,
            'transferred_by' => $this->user->id,
            'notes' => 'Transfer 1',
        ]);

        SalesStoreTransfer::create([
            'transfer_date' => '2026-06-02',
            'product_id' => $this->product2->id,
            'from_sales_store_id' => $this->storeB->id,
            'to_sales_store_id' => $this->storeC->id,
            'quantity' => 20,
            'transferred_by' => $this->user->id,
            'notes' => 'Transfer 2',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/sales-store-transfers?to_sales_store_id=' . $this->storeC->id);

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.notes', 'Transfer 2');
    }

    public function test_can_filter_transfers_by_product()
    {
        SalesStoreTransfer::create([
            'transfer_date' => '2026-06-01',
            'product_id' => $this->product1->id,
            'from_sales_store_id' => $this->storeA->id,
            'to_sales_store_id' => $this->storeB->id,
            'quantity' => 10,
            'transferred_by' => $this->user->id,
            'notes' => 'Transfer 1',
        ]);

        SalesStoreTransfer::create([
            'transfer_date' => '2026-06-02',
            'product_id' => $this->product2->id,
            'from_sales_store_id' => $this->storeB->id,
            'to_sales_store_id' => $this->storeC->id,
            'quantity' => 20,
            'transferred_by' => $this->user->id,
            'notes' => 'Transfer 2',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/sales-store-transfers?product_id=' . $this->product1->id);

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.notes', 'Transfer 1');
    }

    public function test_can_filter_transfers_by_date_range()
    {
        SalesStoreTransfer::create([
            'transfer_date' => '2026-06-01',
            'product_id' => $this->product1->id,
            'from_sales_store_id' => $this->storeA->id,
            'to_sales_store_id' => $this->storeB->id,
            'quantity' => 10,
            'transferred_by' => $this->user->id,
            'notes' => 'Transfer 1',
        ]);

        SalesStoreTransfer::create([
            'transfer_date' => '2026-06-05',
            'product_id' => $this->product2->id,
            'from_sales_store_id' => $this->storeB->id,
            'to_sales_store_id' => $this->storeC->id,
            'quantity' => 20,
            'transferred_by' => $this->user->id,
            'notes' => 'Transfer 2',
        ]);

        SalesStoreTransfer::create([
            'transfer_date' => '2026-06-10',
            'product_id' => $this->product1->id,
            'from_sales_store_id' => $this->storeA->id,
            'to_sales_store_id' => $this->storeB->id,
            'quantity' => 30,
            'transferred_by' => $this->user->id,
            'notes' => 'Transfer 3',
        ]);

        // Filter from 2026-06-03 to 2026-06-08 (should only match Transfer 2)
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/sales-store-transfers?start_date=2026-06-03&end_date=2026-06-08');

        $response->assertStatus(200)
            ->assertJsonPath('data.total', 1)
            ->assertJsonPath('data.data.0.notes', 'Transfer 2');
    }
}
