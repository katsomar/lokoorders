<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreTransfer extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    protected $casts = [
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'transfer_date' => 'date',
    ];

    public function product() { return $this->belongsTo(Product::class); }
    public function user() { return $this->belongsTo(User::class, "transferred_by"); }
    public function productionStore() { return $this->belongsTo(ProductionStore::class); }
    public function salesStore() { return $this->belongsTo(SalesStore::class); }
    public function approver() { return $this->belongsTo(User::class, "approved_by"); }
    public function rejecter() { return $this->belongsTo(User::class, "rejected_by"); }
}
