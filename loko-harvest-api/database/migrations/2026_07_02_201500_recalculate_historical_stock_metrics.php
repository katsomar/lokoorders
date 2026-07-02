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
        // 1. Recalculate Production Store Stocks
        DB::table('production_store_stock')->get()->each(function ($stock) {
            // Transfers out to other production stores
            $transfersProd = DB::table('production_store_transfers')
                ->where('from_production_store_id', $stock->production_store_id)
                ->where('product_id', $stock->product_id)
                ->where(function ($q) use ($stock) {
                    if ($stock->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $stock->batch_reference);
                    }
                })
                ->sum('quantity');

            // Transfers out to sales stores
            $transfersSales = DB::table('store_transfers')
                ->where('production_store_id', $stock->production_store_id)
                ->where('product_id', $stock->product_id)
                ->where(function ($q) use ($stock) {
                    if ($stock->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $stock->batch_reference);
                    }
                })
                ->sum('quantity');

            $stockTaken = (float) $transfersProd + (float) $transfersSales;
            $replacements = 0.00;
            $openingStock = (float) $stock->current_quantity + $stockTaken;

            DB::table('production_store_stock')
                ->where('id', $stock->id)
                ->update([
                    'opening_stock' => $openingStock,
                    'stock_taken' => $stockTaken,
                    'replacements' => $replacements,
                    'closing_stock' => $stock->current_quantity
                ]);
        });

        // 2. Recalculate Sales Store Stocks
        DB::table('sales_store_stock')->get()->each(function ($stock) {
            // Transfers out between sales stores
            $transfersSales = DB::table('sales_store_transfers')
                ->where('from_sales_store_id', $stock->sales_store_id)
                ->where('product_id', $stock->product_id)
                ->where(function ($q) use ($stock) {
                    if ($stock->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $stock->batch_reference);
                    }
                })
                ->sum('quantity');

            // Pack conversions where this product was converted FROM
            $conversions = DB::table('sales_store_conversions')
                ->where('sales_store_id', $stock->sales_store_id)
                ->where('from_product_id', $stock->product_id)
                ->where(function ($q) use ($stock) {
                    if ($stock->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $stock->batch_reference);
                    }
                })
                ->sum('from_quantity');

            // Order items dispatched (orders status dispatched/delivered)
            $dispatches = DB::table('order_items')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->where('orders.sales_store_id', $stock->sales_store_id)
                ->where('order_items.product_id', $stock->product_id)
                ->where(function ($q) use ($stock) {
                    if ($stock->batch_reference === null) {
                        $q->whereNull('order_items.batch_reference');
                    } else {
                        $q->where('order_items.batch_reference', $stock->batch_reference);
                    }
                })
                ->whereIn('orders.status', ['dispatched', 'delivered'])
                ->sum('order_items.quantity');

            // Replacements allocated (deducted from sales store stock)
            $replacements = DB::table('order_replacement_allocations')
                ->where('sales_store_id', $stock->sales_store_id)
                ->where('product_id', $stock->product_id)
                ->where(function ($q) use ($stock) {
                    if ($stock->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $stock->batch_reference);
                    }
                })
                ->selectRaw('SUM(allocated_quantity - returned_quantity) as total')
                ->value('total') ?? 0;

            $stockTaken = (float) $transfersSales + (float) $conversions + (float) $dispatches;
            $openingStock = (float) $stock->current_quantity + $stockTaken + (float) $replacements;

            DB::table('sales_store_stock')
                ->where('id', $stock->id)
                ->update([
                    'opening_stock' => $openingStock,
                    'stock_taken' => $stockTaken,
                    'replacements' => (float) $replacements,
                    'closing_stock' => $stock->current_quantity
                ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to current_quantity
        DB::table('production_store_stock')->update([
            'opening_stock' => DB::raw('current_quantity'),
            'stock_taken' => 0.00,
            'replacements' => 0.00,
            'closing_stock' => DB::raw('current_quantity')
        ]);

        DB::table('sales_store_stock')->update([
            'opening_stock' => DB::raw('current_quantity'),
            'stock_taken' => 0.00,
            'replacements' => 0.00,
            'closing_stock' => DB::raw('current_quantity')
        ]);
    }
};
