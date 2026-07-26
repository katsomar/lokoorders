<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserNotificationPreference extends Model
{
    use \App\Traits\HasUuid;

    protected $guarded = [];

    protected $casts = [
        'channel_transfers' => 'boolean',
        'channel_damages' => 'boolean',
        'channel_stock_alerts' => 'boolean',
        'channel_deliveries' => 'boolean',
        'channel_payments' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
