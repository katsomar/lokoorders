<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DriverPerformanceLog extends Model
{
    use \App\Traits\HasUuid;
    protected $table = 'driver_performance_log';
    protected $guarded = [];
}
