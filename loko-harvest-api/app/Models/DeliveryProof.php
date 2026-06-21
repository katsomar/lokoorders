<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryProof extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];

    protected $appends = ['document_proof_url', 'signature_proof_url'];

    public function getDocumentProofUrlAttribute()
    {
        if ($this->photo_url && $this->photo_url !== 'N/A') {
            return filter_var($this->photo_url, FILTER_VALIDATE_URL) ? $this->photo_url : url('storage/' . $this->photo_url);
        }
        return null;
    }

    public function getSignatureProofUrlAttribute()
    {
        if ($this->signature_path) {
            return filter_var($this->signature_path, FILTER_VALIDATE_URL) ? $this->signature_path : url('storage/' . $this->signature_path);
        }
        return null;
    }

    public function delivery() { return $this->belongsTo(Delivery::class); }
}
