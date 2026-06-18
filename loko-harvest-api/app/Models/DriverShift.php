<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DriverShift extends Model
{
    use \App\Traits\HasUuid;

    protected $guarded = [];

    public function driver()
    {
        return $this->belongsTo(Driver::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
