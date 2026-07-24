<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesStoreStock extends Model
{
    use \App\Traits\HasUuid;
    protected $table = 'sales_store_stock';
    protected $guarded = [];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            $model->transferred_in = $model->transferred_in ?? 0;
            $model->conversions_in = $model->conversions_in ?? 0;
            $model->conversions_out = $model->conversions_out ?? 0;
            $model->sold_quantity = $model->sold_quantity ?? 0;
            $model->transferred_out = $model->transferred_out ?? 0;
            $model->replacements = $model->replacements ?? 0;
            $model->damages = $model->damages ?? 0;

            if ($model->opening_stock === null || $model->opening_stock == 0) {
                if ($model->transferred_in == 0 && $model->conversions_in == 0 && $model->current_quantity != 0) {
                    $model->transferred_in = $model->current_quantity;
                }
                $model->opening_stock = $model->conversions_in;
                $model->closing_stock = $model->opening_stock + $model->transferred_in;
                $model->current_quantity = $model->closing_stock;
            }
        });

        static::saving(function ($model) {
            if ($model->exists) {
                $model->transferred_in = $model->transferred_in ?? 0;
                $model->conversions_in = $model->conversions_in ?? 0;
                $model->conversions_out = $model->conversions_out ?? 0;
                $model->sold_quantity = $model->sold_quantity ?? 0;
                $model->transferred_out = $model->transferred_out ?? 0;
                $model->replacements = $model->replacements ?? 0;
                $model->damages = $model->damages ?? 0;

                $model->opening_stock = $model->conversions_in;
                $exits = $model->conversions_out + $model->sold_quantity + $model->transferred_out + $model->damages;
                $model->closing_stock = $model->opening_stock + $model->transferred_in - ($exits + $model->replacements);
                $model->current_quantity = $model->closing_stock;
            }
        });
    }

    public function product() { return $this->belongsTo(Product::class); }
    public function salesStore() { return $this->belongsTo(SalesStore::class); }

    public function updateStock(string $type, float $qty, ?float $price = null, ?float $eggPrice = null)
    {
        $this->transferred_in = $this->transferred_in ?? 0;
        $this->conversions_in = $this->conversions_in ?? 0;
        $this->conversions_out = $this->conversions_out ?? 0;
        $this->sold_quantity = $this->sold_quantity ?? 0;
        $this->transferred_out = $this->transferred_out ?? 0;
        $this->replacements = $this->replacements ?? 0;
        $this->damages = $this->damages ?? 0;

        if ($type === 'transfer_in' || $type === 'add') {
            $this->transferred_in += $qty;
        } elseif ($type === 'conversion_in') {
            $this->conversions_in += $qty;
        } elseif ($type === 'conversion_out') {
            $this->conversions_out += $qty;
        } elseif ($type === 'sold' || $type === 'take') {
            $this->sold_quantity += $qty;
        } elseif ($type === 'transfer_out') {
            $this->transferred_out += $qty;
        } elseif ($type === 'replace') {
            $this->replacements += $qty;
        } elseif ($type === 'damage' || $type === 'wastage') {
            $this->damages += $qty;
        }

        if ($price !== null) {
            $this->unit_price = $price;
        }

        if ($eggPrice !== null) {
            $this->egg_unit_price = $eggPrice;
        }

        $this->opening_stock = $this->conversions_in;
        $exits = $this->conversions_out + $this->sold_quantity + $this->transferred_out + $this->damages;
        $this->closing_stock = $this->opening_stock + $this->transferred_in - ($exits + $this->replacements);
        $this->current_quantity = $this->closing_stock;
        $this->save();
    }

    public static function getLedgerStock($salesStoreId, $productId, $batchReference = null, $date = null)
    {
        $date = $date ?? date('Y-m-d');

        // 1. Transfers In (production -> sales: store_transfers)
        $transfersProd = \Illuminate\Support\Facades\DB::table('store_transfers')
            ->where('sales_store_id', $salesStoreId)
            ->where('product_id', $productId)
            ->where('batch_reference', $batchReference)
            ->where('status', 'approved')
            ->where('transfer_date', '<=', $date)
            ->sum('quantity');

        // Transfers In (sales -> sales: sales_store_transfers)
        $transfersSalesIn = \Illuminate\Support\Facades\DB::table('sales_store_transfers')
            ->where('to_sales_store_id', $salesStoreId)
            ->where('product_id', $productId)
            ->where('batch_reference', $batchReference)
            ->where('transfer_date', '<=', $date)
            ->sum('quantity');

        $transfersIn = $transfersProd + $transfersSalesIn;

        // 2. Conversions In
        $conversionsIn = \Illuminate\Support\Facades\DB::table('sales_store_conversions')
            ->where('sales_store_id', $salesStoreId)
            ->where('to_product_id', $productId)
            ->where('batch_reference', $batchReference)
            ->where('created_at', '<=', $date . ' 23:59:59')
            ->sum('to_quantity');

        // 3. Conversions Out
        $conversionsOut = \Illuminate\Support\Facades\DB::table('sales_store_conversions')
            ->where('sales_store_id', $salesStoreId)
            ->where('from_product_id', $productId)
            ->where('batch_reference', $batchReference)
            ->where('created_at', '<=', $date . ' 23:59:59')
            ->sum('from_quantity');

        // 4. Transfers Out (sales -> sales: sales_store_transfers)
        $transfersSalesOut = \Illuminate\Support\Facades\DB::table('sales_store_transfers')
            ->where('from_sales_store_id', $salesStoreId)
            ->where('product_id', $productId)
            ->where('batch_reference', $batchReference)
            ->where('transfer_date', '<=', $date)
            ->sum('quantity');

        // 5. Sold Quantity
        $sold = \Illuminate\Support\Facades\DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.sales_store_id', $salesStoreId)
            ->where('order_items.product_id', $productId)
            ->where('order_items.batch_reference', $batchReference)
            ->whereIn('orders.status', ['dispatched', 'on_route', 'delivered'])
            ->where('orders.order_date', '<=', $date)
            ->sum('order_items.quantity');

        // 6. Replacements
        $replacements = \Illuminate\Support\Facades\DB::table('order_replacement_allocations')
            ->where('sales_store_id', $salesStoreId)
            ->where('product_id', $productId)
            ->where('batch_reference', $batchReference)
            ->where('created_at', '<=', $date . ' 23:59:59')
            ->sum('allocated_quantity');

        // 7. Returns
        $returns = \Illuminate\Support\Facades\DB::table('return_vouchers')
            ->join('orders', 'return_vouchers.order_id', '=', 'orders.id')
            ->where('orders.sales_store_id', $salesStoreId)
            ->where('return_vouchers.product_id', $productId)
            ->where('return_vouchers.batch_reference', $batchReference)
            ->where('return_vouchers.return_date', '<=', $date)
            ->sum('return_vouchers.quantity');

        // 8. Damages / Adjustments (approved only)
        $damages = \Illuminate\Support\Facades\DB::table('store_adjustments')
            ->where('store_type', 'sales')
            ->where('sales_store_id', $salesStoreId)
            ->where('product_id', $productId)
            ->where('batch_reference', $batchReference)
            ->where('status', 'approved')
            ->where('created_at', '<=', $date . ' 23:59:59')
            ->sum('quantity_change');

        $closingStock = ($transfersIn + $conversionsIn + $returns) - ($conversionsOut + $transfersSalesOut + $sold + $replacements + $damages);
        return (float) $closingStock;
    }
}
