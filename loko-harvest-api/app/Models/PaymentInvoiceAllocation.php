<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentInvoiceAllocation extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    public function payment() { return $this->belongsTo(Payment::class); }
    public function invoice() { return $this->belongsTo(Invoice::class); }
}
