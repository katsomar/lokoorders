<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryPassEvent extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'delivery_pass_id',
        'event_type',
        'performed_by_type',
        'performed_by_id',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    public function deliveryPass()
    {
        return $this->belongsTo(DeliveryPass::class, 'delivery_pass_id');
    }
}
