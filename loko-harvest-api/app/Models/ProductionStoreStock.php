<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionStoreStock extends Model
{
    use \App\Traits\HasUuid;
    protected $table = 'production_store_stock';
    protected $guarded = [];

    public function product() { return $this->belongsTo(Product::class); }
}
