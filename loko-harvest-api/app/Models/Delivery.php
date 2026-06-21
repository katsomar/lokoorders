<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Delivery extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    protected $casts = [
        'location_history' => 'array',
    ];

    public function order() { return $this->belongsTo(Order::class); }
    public function driver() { return $this->belongsTo(Driver::class); }
    public function proofs() { return $this->hasMany(DeliveryProof::class); }
    public function assignedBy() { return $this->belongsTo(User::class, 'assigned_by'); }
}
