<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderStatusHistory extends Model
{
    use \App\Traits\HasUuid;
    protected $table = 'order_status_history';
    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
