<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\ProductionStore;
use App\Models\SalesStore;
use App\Models\StoreAdjustment;
use App\Models\ProductionStoreStock;
use App\Models\SalesStoreStock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StoreAdjustmentTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $operator;
    protected Product $product;
    protected ProductionStore $productionStore;
    protected SalesStore $salesStore;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::firstOrCreate(
            ['email' => 'admin@lokoharvest.com'],
            [
                'name' => 'Loko Admin',
                'password' => bcrypt('password'),
                'role' => 'admin',
                'status' => 'active',
                'phone' => '0700000000',
            ]
        );

        $this->operator = User::firstOrCreate(
            ['email' => 'operator@lokoharvest.com'],
            [
                'name' => 'Loko Operator',
                'password' => bcrypt('password'),
                'role' => 'operator',
                'status' => 'active',
                'phone' => '0700000001',
            ]
        );

        $this->product = Product::firstOrCreate(
            ['code' => 'EGG-CRM-SGL'],
            [
                'name' => 'Cream Eggs - Single Pack',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 15000,
                'is_active' => true,
            ]
        );

        $this->productionStore = ProductionStore::firstOrCreate(
            ['code' => 'PDN-MAIN'],
            [
                'name' => 'Main Production House',
                'location' => 'Block A',
                'is_active' => true,
            ]
        );

        $this->salesStore = SalesStore::firstOrCreate(
            ['code' => 'SLS-AKR'],
            [
                'name' => 'Akright Sales Outlet',
                'location' => 'Akright Gate',
                'is_active' => true,
            ]
        );
    }

    public function test_can_submit_store_adjustment_request()
    {
        Storage::fake('public');
        $image = UploadedFile::fake()->create('breakage.jpg', 100, 'image/jpeg');
        $signature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $response = $this->actingAs($this->operator, 'sanctum')
            ->postJson('/api/v1/store-adjustments', [
                'store_type' => 'sales',
                'sales_store_id' => $this->salesStore->id,
                'product_id' => $this->product->id,
                'batch_reference' => 'B-001-A',
                'quantity' => 5,
                'reason' => '5 trays damaged during offloading',
                'image_file' => $image,
                'signature_data' => $signature,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('store_adjustments', [
            'store_type' => 'sales',
            'sales_store_id' => $this->salesStore->id,
            'product_id' => $this->product->id,
            'batch_reference' => 'B-001-A',
            'quantity_change' => -5,
            'status' => 'pending',
        ]);
    }

    public function test_adjustment_does_not_update_stock_when_pending()
    {
        Storage::fake('public');
        $signature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        // Set up initial stock of 10 trays
        $stock = SalesStoreStock::create([
            'sales_store_id' => $this->salesStore->id,
            'product_id' => $this->product->id,
            'batch_reference' => 'B-001-A',
            'opening_stock' => 0,
            'transferred_in' => 10,
            'closing_stock' => 10,
            'current_quantity' => 10,
            'updated_by' => $this->admin->id,
        ]);

        $this->actingAs($this->operator, 'sanctum')
            ->postJson('/api/v1/store-adjustments', [
                'store_type' => 'sales',
                'sales_store_id' => $this->salesStore->id,
                'product_id' => $this->product->id,
                'batch_reference' => 'B-001-A',
                'quantity' => 3,
                'reason' => '3 trays cracked',
                'signature_data' => $signature,
            ]);

        $stock->refresh();
        $this->assertEquals(10.00, $stock->current_quantity);
    }

    public function test_adjustment_updates_stock_when_approved()
    {
        Storage::fake('public');
        $signature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $stock = SalesStoreStock::create([
            'sales_store_id' => $this->salesStore->id,
            'product_id' => $this->product->id,
            'batch_reference' => 'B-001-A',
            'opening_stock' => 0,
            'transferred_in' => 10,
            'closing_stock' => 10,
            'current_quantity' => 10,
            'updated_by' => $this->admin->id,
        ]);

        $adjustment = StoreAdjustment::create([
            'store_type' => 'sales',
            'sales_store_id' => $this->salesStore->id,
            'product_id' => $this->product->id,
            'batch_reference' => 'B-001-A',
            'quantity_change' => -3,
            'reason' => '3 trays cracked',
            'signature_path' => 'signatures/sig.png',
            'status' => 'pending',
            'created_by' => $this->admin->id,
            'adjustment_date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/store-adjustments/{$adjustment->id}/approve");

        $response->assertStatus(200);

        $stock->refresh();
        // 10 initial - 3 damages = 7 closing stock
        $this->assertEquals(7.00, $stock->current_quantity);
        $this->assertEquals(3.00, $stock->damages);

        $this->assertDatabaseHas('sales_store_movements', [
            'sales_store_id' => $this->salesStore->id,
            'product_id' => $this->product->id,
            'movement_type' => 'wastage',
            'quantity' => 3.00,
        ]);
    }

    public function test_admin_adjustment_bypasses_approval_and_deducts_stock_instantly()
    {
        Storage::fake('public');
        $signature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        $stock = SalesStoreStock::create([
            'sales_store_id' => $this->salesStore->id,
            'product_id' => $this->product->id,
            'batch_reference' => 'B-001-A',
            'opening_stock' => 0,
            'transferred_in' => 10,
            'closing_stock' => 10,
            'current_quantity' => 10,
            'updated_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/v1/store-adjustments', [
                'store_type' => 'sales',
                'sales_store_id' => $this->salesStore->id,
                'product_id' => $this->product->id,
                'batch_reference' => 'B-001-A',
                'quantity' => 4,
                'reason' => '4 trays cracked during offloading',
                'signature_data' => $signature,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $stock->refresh();
        // 10 initial - 4 damages = 6 closing stock
        $this->assertEquals(6.00, $stock->current_quantity);
        $this->assertEquals(4.00, $stock->damages);

        $this->assertDatabaseHas('store_adjustments', [
            'store_type' => 'sales',
            'sales_store_id' => $this->salesStore->id,
            'product_id' => $this->product->id,
            'batch_reference' => 'B-001-A',
            'quantity_change' => -4,
            'status' => 'approved',
        ]);

        $this->assertDatabaseHas('sales_store_movements', [
            'sales_store_id' => $this->salesStore->id,
            'product_id' => $this->product->id,
            'movement_type' => 'wastage',
            'quantity' => 4.00,
        ]);
    }
}
