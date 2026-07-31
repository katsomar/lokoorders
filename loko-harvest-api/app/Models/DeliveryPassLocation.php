<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryPassLocation extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'delivery_pass_id',
        'latitude',
        'longitude',
        'accuracy',
        'speed',
        'heading',
        'created_at',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'accuracy' => 'float',
        'speed' => 'float',
        'heading' => 'float',
        'created_at' => 'datetime',
    ];

    public function deliveryPass()
    {
        return $this->belongsTo(DeliveryPass::class, 'delivery_pass_id');
    }
}
