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
            if ($model->opening_stock === null || $model->opening_stock == 0) {
                if ($model->current_quantity != 0) {
                    $model->opening_stock = $model->current_quantity;
                    $model->closing_stock = $model->current_quantity;
                }
            }
        });

        static::saving(function ($model) {
            if ($model->opening_stock != 0 || $model->stock_taken != 0 || $model->replacements != 0) {
                $expectedClosing = $model->opening_stock - ($model->stock_taken + $model->replacements);
                if ($model->closing_stock != $expectedClosing) {
                    $model->closing_stock = $expectedClosing;
                }
                $model->current_quantity = $model->closing_stock;
            }
        });
    }

    public function product() { return $this->belongsTo(Product::class); }
    public function salesStore() { return $this->belongsTo(SalesStore::class); }

    public function updateStock(string $type, float $qty, ?float $price = null)
    {
        if ($type === 'add') {
            $this->opening_stock += $qty;
        } elseif ($type === 'take') {
            $this->stock_taken += $qty;
        } elseif ($type === 'replace') {
            $this->replacements += $qty;
        }

        if ($price !== null) {
            $this->unit_price = $price;
        }

        $this->closing_stock = $this->opening_stock - ($this->stock_taken + $this->replacements);
        $this->current_quantity = $this->closing_stock;
        $this->save();
    }
}
