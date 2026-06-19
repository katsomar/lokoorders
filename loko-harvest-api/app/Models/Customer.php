<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use \App\Traits\HasUuid;
    protected $guarded = [];
    protected $appends = ['logo_url'];

    public function getLogoUrlAttribute()
    {
        if ($this->logo_path) {
            return filter_var($this->logo_path, FILTER_VALIDATE_URL) ? $this->logo_path : url('storage/' . $this->logo_path);
        }

        if ($this->parent_id) {
            $parent = $this->relationLoaded('parent') ? $this->parent : $this->parent;
            if ($parent && $parent->logo_path) {
                return filter_var($parent->logo_path, FILTER_VALIDATE_URL) ? $parent->logo_path : url('storage/' . $parent->logo_path);
            }
        }

        return null;
    }

    public function orders() { return $this->hasMany(Order::class); }
    public function account() { return $this->hasOne(CustomerAccount::class); }
    public function zone() { return $this->belongsTo(DeliveryZone::class, "delivery_zone_id"); }
    public function parent() { return $this->belongsTo(Customer::class, "parent_id"); }
    public function branches() { return $this->hasMany(Customer::class, "parent_id"); }
}
