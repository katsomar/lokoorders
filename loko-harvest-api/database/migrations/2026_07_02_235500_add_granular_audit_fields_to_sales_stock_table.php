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
        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->renameColumn('stock_taken', 'sold_quantity');
        });

        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->decimal('transferred_in', 15, 2)->default(0.00)->after('opening_stock');
            $table->decimal('conversions_in', 15, 2)->default(0.00)->after('transferred_in');
            $table->decimal('conversions_out', 15, 2)->default(0.00)->after('conversions_in');
            $table->decimal('transferred_out', 15, 2)->default(0.00)->after('conversions_out');
        });

        // Backfill historical values
        DB::table('sales_store_stock')->get()->each(function ($stock) {
            // 1. transferred_in
            // a) from production store transfers (store_transfers)
            $transfersProd = DB::table('store_transfers')
                ->where('sales_store_id', $stock->sales_store_id)
                ->where('product_id', $stock->product_id)
                ->where(function ($q) use ($stock) {
                    if ($stock->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $stock->batch_reference);
                    }
                })
                ->sum('quantity');

            // b) inter-store transfers (sales_store_transfers) in
            $transfersSalesIn = DB::table('sales_store_transfers')
                ->where('to_sales_store_id', $stock->sales_store_id)
                ->where('product_id', $stock->product_id)
                ->where(function ($q) use ($stock) {
                    if ($stock->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $stock->batch_reference);
                    }
                })
                ->sum('quantity');

            $transferredIn = (float) $transfersProd + (float) $transfersSalesIn;

            // 2. conversions_in
            $conversionsIn = DB::table('sales_store_conversions')
                ->where('sales_store_id', $stock->sales_store_id)
                ->where('to_product_id', $stock->product_id)
                ->where(function ($q) use ($stock) {
                    if ($stock->batch_reference === null) {
                        $q->whereNull('batch_reference');
                    } else {
                        $q->where('batch_reference', $stock->batch_reference);
                    }
                })
                ->sum('to_quantity');

            // 3. conversions_out
            $conversionsOut = DB::table('sales_store_conversions')
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

            // 4. transferred_out
            $transfersSalesOut = DB::table('sales_store_transfers')
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

            // 5. sold_quantity
            $soldQuantity = DB::table('order_items')
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

            // 6. replacements
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

            // Compute Opening & Closing
            $openingStock = $transferredIn + (float) $conversionsIn;
            $closingStock = (float) $stock->current_quantity;

            DB::table('sales_store_stock')
                ->where('id', $stock->id)
                ->update([
                    'transferred_in' => $transferredIn,
                    'conversions_in' => (float) $conversionsIn,
                    'conversions_out' => (float) $conversionsOut,
                    'transferred_out' => (float) $transfersSalesOut,
                    'sold_quantity' => (float) $soldQuantity,
                    'replacements' => (float) $replacements,
                    'opening_stock' => $openingStock,
                    'closing_stock' => $closingStock
                ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_store_stock', function (Blueprint $table) {
            $table->dropColumn(['transferred_in', 'conversions_in', 'conversions_out', 'transferred_out']);
            $table->renameColumn('sold_quantity', 'stock_taken');
        });
    }
};
