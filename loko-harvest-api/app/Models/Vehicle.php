<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function drivers()
    {
        return $this->belongsToMany(Driver::class, 'driver_vehicle');
    }
}
