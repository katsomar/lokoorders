<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionStoreStock extends Model
{
    use \App\Traits\HasUuid;
    protected $table = 'production_store_stock';
    protected $guarded = [];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if ($model->opening_stock === null || $model->opening_stock == 0) {
                if ($model->current_quantity != 0) {
                    $model->opening_stock = $model->current_quantity;
                    $model->closing_stock = $model->current_quantity;
                }
            }
        });

        static::saving(function ($model) {
            $model->stock_taken = $model->stock_taken ?? 0;
            $model->replacements = $model->replacements ?? 0;
            $model->damages = $model->damages ?? 0;

            if ($model->opening_stock != 0 || $model->stock_taken != 0 || $model->replacements != 0 || $model->damages != 0) {
                $expectedClosing = $model->opening_stock - ($model->stock_taken + $model->replacements + $model->damages);
                if ($model->closing_stock != $expectedClosing) {
                    $model->closing_stock = $expectedClosing;
                }
                $model->current_quantity = $model->closing_stock;
            }
        });
    }

    public function product() { return $this->belongsTo(Product::class); }
    public function productionStore() { return $this->belongsTo(ProductionStore::class); }

    public function updateStock(string $type, float $qty, ?float $price = null, ?float $eggPrice = null)
    {
        $this->opening_stock = $this->opening_stock ?? 0;
        $this->stock_taken = $this->stock_taken ?? 0;
        $this->replacements = $this->replacements ?? 0;
        $this->damages = $this->damages ?? 0;

        if ($type === 'add') {
            $this->opening_stock += $qty;
        } elseif ($type === 'take') {
            $this->stock_taken += $qty;
        } elseif ($type === 'replace') {
            $this->replacements += $qty;
        } elseif ($type === 'damage' || $type === 'wastage') {
            $this->damages += $qty;
        }

        if ($price !== null) {
            $this->unit_price = $price;
            $this->valuation_price = $price;
        }

        if ($eggPrice !== null) {
            $this->egg_unit_price = $eggPrice;
        }

        $this->closing_stock = $this->opening_stock - ($this->stock_taken + $this->replacements + $this->damages);
        $this->current_quantity = $this->closing_stock;
        $this->save();
    }
}
