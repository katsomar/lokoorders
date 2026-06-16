<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesStoreTransfer extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function fromStore()
    {
        return $this->belongsTo(SalesStore::class, 'from_sales_store_id');
    }

    public function toStore()
    {
        return $this->belongsTo(SalesStore::class, 'to_sales_store_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'transferred_by');
    }
}
