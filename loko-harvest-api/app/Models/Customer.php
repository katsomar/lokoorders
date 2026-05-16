<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function orders() { return $this->hasMany(Order::class); }
    public function account() { return $this->hasOne(CustomerAccount::class); }
    public function zone() { return $this->belongsTo(DeliveryZone::class, "delivery_zone_id"); }
}
