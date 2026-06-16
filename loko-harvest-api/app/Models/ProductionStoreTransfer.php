<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionStoreTransfer extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function fromStore()
    {
        return $this->belongsTo(ProductionStore::class, 'from_production_store_id');
    }

    public function toStore()
    {
        return $this->belongsTo(ProductionStore::class, 'to_production_store_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'transferred_by');
    }
}
