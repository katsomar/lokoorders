<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesStoreConversion extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function salesStore()
    {
        return $this->belongsTo(SalesStore::class);
    }

    public function fromProduct()
    {
        return $this->belongsTo(Product::class, 'from_product_id');
    }

    public function toProduct()
    {
        return $this->belongsTo(Product::class, 'to_product_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'converted_by');
    }
}
