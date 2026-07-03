<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Reconcile the tray product under batch B-001-A
        // Expected closing was 29, actual is 25. True initial transferred_in was 46.00.
        DB::table('sales_store_stock')
            ->where('batch_reference', 'B-001-A')
            ->where('closing_stock', 25.00)
            ->update([
                'transferred_in' => 46.00,
                'opening_stock' => 46.00
            ]);

        // Reconcile the packaged units under batch B-001-A
        // Expected closing was 7, actual is 0. True conversions_in was 9.00.
        DB::table('sales_store_stock')
            ->where('batch_reference', 'B-001-A')
            ->where('closing_stock', 0.00)
            ->update([
                'conversions_in' => 9.00,
                'opening_stock' => 9.00
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original un-reconciled values
        DB::table('sales_store_stock')
            ->where('batch_reference', 'B-001-A')
            ->where('closing_stock', 25.00)
            ->update([
                'transferred_in' => 50.00,
                'opening_stock' => 50.00
            ]);

        DB::table('sales_store_stock')
            ->where('batch_reference', 'B-001-A')
            ->where('closing_stock', 0.00)
            ->update([
                'conversions_in' => 16.00,
                'opening_stock' => 16.00
            ]);
    }
};
