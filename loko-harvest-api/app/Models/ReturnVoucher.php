<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReturnVoucher extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function delivery()
    {
        return $this->belongsTo(Delivery::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function replacementSalesStore()
    {
        return $this->belongsTo(SalesStore::class, 'replacement_sales_store_id');
    }
}
