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

    public function updateStock(string $type, float $qty, ?float $price = null)
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

        $this->opening_stock = $this->conversions_in;
        $exits = $this->conversions_out + $this->sold_quantity + $this->transferred_out + $this->damages;
        $this->closing_stock = $this->opening_stock + $this->transferred_in - ($exits + $this->replacements);
        $this->current_quantity = $this->closing_stock;
        $this->save();
    }
}
