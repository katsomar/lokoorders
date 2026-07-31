<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeliveryPassOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_pass_id',
        'order_id',
        'sequence',
        'status',
        'delivered_at',
    ];

    protected $casts = [
        'delivered_at' => 'datetime',
    ];

    public function deliveryPass()
    {
        return $this->belongsTo(DeliveryPass::class, 'delivery_pass_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
