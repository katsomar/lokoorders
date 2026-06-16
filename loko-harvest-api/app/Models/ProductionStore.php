<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionStore extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function stocks()
    {
        return $this->hasMany(ProductionStoreStock::class);
    }

    public function intakes()
    {
        return $this->hasMany(ProductionStoreIntake::class);
    }

    public function transfersOut()
    {
        return $this->hasMany(ProductionStoreTransfer::class, 'from_production_store_id');
    }

    public function transfersIn()
    {
        return $this->hasMany(ProductionStoreTransfer::class, 'to_production_store_id');
    }
}
