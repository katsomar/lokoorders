<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesStoreStock extends Model
{
    use \App\Traits\HasUuid;
    protected $table = 'sales_store_stock';
    protected $guarded = [];

    public function product() { return $this->belongsTo(Product::class); }
}
