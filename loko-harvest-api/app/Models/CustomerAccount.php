<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerAccount extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
