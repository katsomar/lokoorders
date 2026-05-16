<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesStoreStock extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function product() { return $this->belongsTo(Product::class); }
}
