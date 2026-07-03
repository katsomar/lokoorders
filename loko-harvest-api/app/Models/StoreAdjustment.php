<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreAdjustment extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    protected $casts = [
        'approved_at' => 'datetime',
        'adjustment_date' => 'date',
    ];

    protected $appends = ['image_url', 'signature_url'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function productionStore()
    {
        return $this->belongsTo(ProductionStore::class);
    }

    public function salesStore()
    {
        return $this->belongsTo(SalesStore::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function getImageUrlAttribute()
    {
        if ($this->image_path) {
            return filter_var($this->image_path, FILTER_VALIDATE_URL) ? $this->image_path : url('storage/' . $this->image_path);
        }
        return null;
    }

    public function getSignatureUrlAttribute()
    {
        if ($this->signature_path) {
            return filter_var($this->signature_path, FILTER_VALIDATE_URL) ? $this->signature_path : url('storage/' . $this->signature_path);
        }
        return null;
    }
}
