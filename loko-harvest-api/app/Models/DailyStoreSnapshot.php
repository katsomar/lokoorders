<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyStoreSnapshot extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];
}
