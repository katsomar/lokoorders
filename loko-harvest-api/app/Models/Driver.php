<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Driver extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function user() { return $this->belongsTo(User::class); }
    public function vehicle() { return $this->belongsTo(Vehicle::class); }
    public function vehicles() { return $this->belongsToMany(Vehicle::class, 'driver_vehicle'); }
    public function deliveries() { return $this->hasMany(Delivery::class); }
}
