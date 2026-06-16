<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesStore extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function stocks()
    {
        return $this->hasMany(SalesStoreStock::class);
    }

    public function movements()
    {
        return $this->hasMany(SalesStoreMovement::class);
    }

    public function transfersOut()
    {
        return $this->hasMany(SalesStoreTransfer::class, 'from_sales_store_id');
    }

    public function transfersIn()
    {
        return $this->hasMany(SalesStoreTransfer::class, 'to_sales_store_id');
    }
}
