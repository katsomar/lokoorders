<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function customer() { return $this->belongsTo(Customer::class); }
    public function allocations() { return $this->hasMany(PaymentInvoiceAllocation::class); }
}
