<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryProof extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function delivery() { return $this->belongsTo(Delivery::class); }
}
