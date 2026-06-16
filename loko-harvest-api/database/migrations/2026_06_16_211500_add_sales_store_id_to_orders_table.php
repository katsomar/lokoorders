<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->uuid('sales_store_id')->nullable()->after('customer_id');
        });

        // Set existing orders to default MAIN-SALES store
        $defaultStore = DB::table('sales_stores')->where('code', 'MAIN-SALES')->first();
        if ($defaultStore) {
            DB::table('orders')->update(['sales_store_id' => $defaultStore->id]);
        }

        Schema::table('orders', function (Blueprint $table) {
            $table->uuid('sales_store_id')->nullable(false)->change();
            $table->foreign('sales_store_id')->references('id')->on('sales_stores')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['sales_store_id']);
            $table->dropColumn('sales_store_id');
        });
    }
};
