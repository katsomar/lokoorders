<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DeliveryPassMedia extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'delivery_pass_id',
        'order_id',
        'media_type',
        'file_path',
        'mime_type',
        'file_size',
        'recipient_name',
        'recipient_phone',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function deliveryPass()
    {
        return $this->belongsTo(DeliveryPass::class, 'delivery_pass_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id');
    }
}
