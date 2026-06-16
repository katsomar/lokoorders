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
        // 1. Create production_stores table
        Schema::create('production_stores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('location')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insert the default Main Production Store
        $defaultStoreId = (string) Str::uuid();
        DB::table('production_stores')->insert([
            'id' => $defaultStoreId,
            'name' => 'Main Production Store',
            'code' => 'MAIN-PROD',
            'location' => 'Main Facility',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 2. Add production_store_id to production_store_stock
        Schema::table('production_store_stock', function (Blueprint $table) {
            $table->uuid('production_store_id')->nullable()->after('id');
        });
        
        DB::table('production_store_stock')->update(['production_store_id' => $defaultStoreId]);

        Schema::table('production_store_stock', function (Blueprint $table) {
            $table->uuid('production_store_id')->nullable(false)->change();
            $table->foreign('production_store_id')->references('id')->on('production_stores')->onDelete('cascade');
        });

        // 3. Add production_store_id to production_store_intakes
        Schema::table('production_store_intakes', function (Blueprint $table) {
            $table->uuid('production_store_id')->nullable()->after('id');
        });
        
        DB::table('production_store_intakes')->update(['production_store_id' => $defaultStoreId]);

        Schema::table('production_store_intakes', function (Blueprint $table) {
            $table->uuid('production_store_id')->nullable(false)->change();
            $table->foreign('production_store_id')->references('id')->on('production_stores')->onDelete('cascade');
        });

        // 4. Add production_store_id to store_transfers
        Schema::table('store_transfers', function (Blueprint $table) {
            $table->uuid('production_store_id')->nullable()->after('id');
        });
        
        DB::table('store_transfers')->update(['production_store_id' => $defaultStoreId]);

        Schema::table('store_transfers', function (Blueprint $table) {
            $table->uuid('production_store_id')->nullable(false)->change();
            $table->foreign('production_store_id')->references('id')->on('production_stores')->onDelete('cascade');
        });

        // 5. Add production_store_id to daily_store_snapshots
        Schema::table('daily_store_snapshots', function (Blueprint $table) {
            $table->uuid('production_store_id')->nullable()->after('product_id');
            $table->foreign('production_store_id')->references('id')->on('production_stores')->onDelete('cascade');
        });
        
        DB::table('daily_store_snapshots')
            ->where('store_type', 'production')
            ->update(['production_store_id' => $defaultStoreId]);

        // 6. Create production_store_transfers table (transfers between production stores)
        Schema::create('production_store_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('transfer_date');
            $table->foreignUuid('product_id')->constrained('products');
            $table->foreignUuid('from_production_store_id')->constrained('production_stores')->onDelete('cascade');
            $table->foreignUuid('to_production_store_id')->constrained('production_stores')->onDelete('cascade');
            $table->decimal('quantity', 10, 2);
            $table->string('batch_reference')->nullable();
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
        Schema::dropIfExists('production_store_transfers');

        Schema::table('daily_store_snapshots', function (Blueprint $table) {
            $table->dropForeign(['production_store_id']);
            $table->dropColumn('production_store_id');
        });

        Schema::table('store_transfers', function (Blueprint $table) {
            $table->dropForeign(['production_store_id']);
            $table->dropColumn('production_store_id');
        });

        Schema::table('production_store_intakes', function (Blueprint $table) {
            $table->dropForeign(['production_store_id']);
            $table->dropColumn('production_store_id');
        });

        Schema::table('production_store_stock', function (Blueprint $table) {
            $table->dropForeign(['production_store_id']);
            $table->dropColumn('production_store_id');
        });

        Schema::dropIfExists('production_stores');
    }
};
