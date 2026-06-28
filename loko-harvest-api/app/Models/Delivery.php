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
    public function undoneBy() { return $this->belongsTo(User::class, 'undone_by'); }
    public function returnSalesStore() { return $this->belongsTo(SalesStore::class, 'return_sales_store_id'); }
}
