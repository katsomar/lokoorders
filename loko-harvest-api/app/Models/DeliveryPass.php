<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DeliveryPass extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'pass_number',
        'secure_token',
        'status',
        'driver_name',
        'driver_phone',
        'vehicle_info',
        'claimed_at',
        'started_at',
        'completed_at',
        'expires_at',
        'revoked_at',
        'revoked_by',
        'revocation_reason',
        'created_by',
    ];

    protected $casts = [
        'claimed_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
            if (empty($model->secure_token)) {
                $model->secure_token = Str::random(64);
            }
            if (empty($model->expires_at)) {
                $model->expires_at = now()->addHours(12);
            }
        });
    }

    public function passOrders()
    {
        return $this->hasMany(DeliveryPassOrder::class, 'delivery_pass_id');
    }

    public function orders()
    {
        return $this->belongsToMany(Order::class, 'delivery_pass_orders', 'delivery_pass_id', 'order_id')
                    ->withPivot('sequence', 'status', 'delivered_at')
                    ->withTimestamps();
    }

    public function locations()
    {
        return $this->hasMany(DeliveryPassLocation::class, 'delivery_pass_id');
    }

    public function latestLocation()
    {
        return $this->hasOne(DeliveryPassLocation::class, 'delivery_pass_id')->latestOfMany('created_at');
    }

    public function media()
    {
        return $this->hasMany(DeliveryPassMedia::class, 'delivery_pass_id');
    }

    public function events()
    {
        return $this->hasMany(DeliveryPassEvent::class, 'delivery_pass_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function revoker()
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }

    public function isExpired()
    {
        if (in_array($this->status, ['completed', 'revoked'])) {
            return false;
        }
        if (!$this->expires_at) {
            return false;
        }
        // Protect fresh passes created within the last 30 minutes from timezone/clock-skew misalignments
        if ($this->created_at && now()->diffInMinutes($this->created_at) < 30) {
            return false;
        }
        return now()->greaterThan($this->expires_at);
    }

    public function isClaimable()
    {
        return in_array($this->status, ['generated', 'shared']) && !$this->isExpired() && is_null($this->claimed_at);
    }
}
