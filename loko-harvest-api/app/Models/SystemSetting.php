<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];
}
