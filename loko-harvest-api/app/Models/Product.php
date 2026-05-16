<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function orderItems() { return $this->hasMany(OrderItem::class); }
}
