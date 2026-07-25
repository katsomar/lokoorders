<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProcessedRequest extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'user_id',
        'action_type',
        'response_payload',
        'status_code',
    ];

    protected $casts = [
        'response_payload' => 'array',
    ];
}
