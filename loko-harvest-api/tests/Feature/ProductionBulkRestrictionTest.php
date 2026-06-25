<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductionStore;
use App\Models\SalesStore;
use App\Models\ProductionStoreStock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductionBulkRestrictionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected ProductionStore $prodStore;
    protected SalesStore $salesStore;
    protected Product $allowedProduct;
    protected Product $restrictedProduct;

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

        $this->prodStore = ProductionStore::create([
            'name' => 'Prod Store',
            'code' => 'PROD-STORE',
        ]);

        $this->salesStore = SalesStore::create([
            'name' => 'Sales Store',
            'code' => 'SALES-STORE',
        ]);

        $this->allowedProduct = Product::firstOrCreate(
            ['code' => 'EGG-CRM'],
            [
                'name' => 'Cream Eggs (Trays)',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 13000,
            ]
        );

        $this->restrictedProduct = Product::firstOrCreate(
            ['code' => 'EGG-CRM-15P'],
            [
                'name' => 'Cream Eggs - 15-Pack',
                'category' => 'eggs',
                'unit_of_measure' => 'units',
                'default_unit_price' => 8500,
            ]
        );
    }

    public function test_can_intake_allowed_bulk_product()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/production-intakes', [
                'production_store_id' => $this->prodStore->id,
                'product_id' => $this->allowedProduct->id,
                'quantity' => 10,
                'intake_date' => '2026-06-26',
                'valuation_price' => 13000,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('production_store_stock', [
            'production_store_id' => $this->prodStore->id,
            'product_id' => $this->allowedProduct->id,
            'current_quantity' => 10,
        ]);
    }

    public function test_cannot_intake_restricted_packaged_product()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/production-intakes', [
                'production_store_id' => $this->prodStore->id,
                'product_id' => $this->restrictedProduct->id,
                'quantity' => 10,
                'intake_date' => '2026-06-26',
                'valuation_price' => 8500,
            ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'success' => false,
            'message' => 'Only white plain trays, brown plain trays, cream plain trays, live chicken, dressed chicken, and manure can be recorded as production store intakes.',
        ]);
    }

    public function test_can_transfer_allowed_bulk_product_to_sales()
    {
        // Seed stock first
        ProductionStoreStock::create([
            'production_store_id' => $this->prodStore->id,
            'product_id' => $this->allowedProduct->id,
            'current_quantity' => 20,
            'valuation_price' => 13000,
            'updated_by' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/store-transfers', [
                'production_store_id' => $this->prodStore->id,
                'sales_store_id' => $this->salesStore->id,
                'product_id' => $this->allowedProduct->id,
                'quantity' => 10,
                'transfer_date' => '2026-06-26',
            ]);

        $response->assertStatus(201);
    }

    public function test_cannot_transfer_restricted_product_to_sales()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/store-transfers', [
                'production_store_id' => $this->prodStore->id,
                'sales_store_id' => $this->salesStore->id,
                'product_id' => $this->restrictedProduct->id,
                'quantity' => 10,
                'transfer_date' => '2026-06-26',
            ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'success' => false,
            'message' => 'Only white plain trays, brown plain trays, cream plain trays, live chicken, dressed chicken, and manure can be transferred from production to sales stores.',
        ]);
    }
}
