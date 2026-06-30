<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderReplacementAllocation extends Model
{
    use \App\Traits\HasUuid;

    protected $guarded = [];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function salesStore()
    {
        return $this->belongsTo(SalesStore::class, 'sales_store_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }
}
