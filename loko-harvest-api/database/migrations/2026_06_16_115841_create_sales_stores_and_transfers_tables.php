<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create sales_stores table
        Schema::create('sales_stores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('location')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert the default Main Sales Store
        $defaultStoreId = (string) Str::uuid();
        DB::table('sales_stores')->insert([
            'id' => $defaultStoreId,
            'name' => 'Main Sales Store',
            'code' => 'MAIN-SALES',
            'location' => 'Main Facility',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Modify sales_store_stock table
        Schema::table('sales_store_stock', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['product_id']);
            
            // Drop unique constraint on product_id
            $table->dropUnique(['product_id']);
            
            // Re-add foreign key constraint without unique
            $table->foreign('product_id')->references('id')->on('products');
            
            // Add sales_store_id column (nullable initially)
            $table->uuid('sales_store_id')->nullable()->after('id');
        });

        // Populate existing stock with default store ID
        DB::table('sales_store_stock')->update(['sales_store_id' => $defaultStoreId]);

        Schema::table('sales_store_stock', function (Blueprint $table) {
            // Make sales_store_id NOT NULL and add foreign key
            $table->uuid('sales_store_id')->nullable(false)->change();
            $table->foreign('sales_store_id')->references('id')->on('sales_stores')->onDelete('cascade');
            
            // Add unique index on [sales_store_id, product_id]
            $table->unique(['sales_store_id', 'product_id']);
        });

        // 3. Modify sales_store_movements table
        Schema::table('sales_store_movements', function (Blueprint $table) {
            $table->uuid('sales_store_id')->nullable()->after('id');
        });

        DB::table('sales_store_movements')->update(['sales_store_id' => $defaultStoreId]);

        Schema::table('sales_store_movements', function (Blueprint $table) {
            $table->uuid('sales_store_id')->nullable(false)->change();
            $table->foreign('sales_store_id')->references('id')->on('sales_stores')->onDelete('cascade');
        });

        // 4. Modify store_transfers table
        Schema::table('store_transfers', function (Blueprint $table) {
            $table->uuid('sales_store_id')->nullable()->after('production_store_id');
        });

        DB::table('store_transfers')->update(['sales_store_id' => $defaultStoreId]);

        Schema::table('store_transfers', function (Blueprint $table) {
            $table->uuid('sales_store_id')->nullable(false)->change();
            $table->foreign('sales_store_id')->references('id')->on('sales_stores')->onDelete('cascade');
        });

        // 5. Modify daily_store_snapshots table
        Schema::table('daily_store_snapshots', function (Blueprint $table) {
            $table->uuid('sales_store_id')->nullable()->after('production_store_id');
            $table->foreign('sales_store_id')->references('id')->on('sales_stores')->onDelete('cascade');
        });

        DB::table('daily_store_snapshots')
            ->where('store_type', 'sales')
            ->update(['sales_store_id' => $defaultStoreId]);

        // 6. Create sales_store_transfers table (transfers between sales stores)
        Schema::create('sales_store_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('transfer_date');
            $table->foreignUuid('product_id')->constrained('products');
            $table->foreignUuid('from_sales_store_id')->constrained('sales_stores')->onDelete('cascade');
            $table->foreignUuid('to_sales_store_id')->constrained('sales_stores')->onDelete('cascade');
            $table->decimal('quantity', 10, 2);
            $table->foreignUuid('transferred_by')->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_store_transfers');

        Schema::table('daily_store_snapshots', function (Blueprint $table) {
            $table->dropForeign(['sales_store_id']);
            $table->dropColumn('sales_store_id');
        });

        Schema::table('store_transfers', function (Blueprint $table) {
            $table->dropForeign(['sales_store_id']);
            $table->dropColumn('sales_store_id');
        });

        Schema::table('sales_store_movements', function (Blueprint $table) {
            $table->dropForeign(['sales_store_id']);
            $table->dropColumn('sales_store_id');
        });

        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->dropUnique(['sales_store_id', 'product_id']);
            $table->dropForeign(['sales_store_id']);
            $table->dropColumn('sales_store_id');
            
            // Drop non-unique foreign key
            $table->dropForeign(['product_id']);
            
            // Re-add unique key and foreign key
            $table->unique('product_id');
            $table->foreign('product_id')->references('id')->on('products');
        });

        Schema::dropIfExists('sales_stores');
    }
};
