<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreTransfer extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function product() { return $this->belongsTo(Product::class); }
    public function user() { return $this->belongsTo(User::class, "transferred_by"); }
    public function productionStore() { return $this->belongsTo(ProductionStore::class); }
    public function salesStore() { return $this->belongsTo(SalesStore::class); }
}
