<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductionStoreIntake extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function product() { return $this->belongsTo(Product::class); }
    public function user() { return $this->belongsTo(User::class, "recorded_by"); }
}
