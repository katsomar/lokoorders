<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    /**
     * Transform customer model into a lean JSON representation.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'contact_person' => $this->contact_person,
            'phone_primary' => $this->phone_primary,
            'address' => $this->address,
            'customer_type' => $this->customer_type,
            'classification' => $this->classification,
            'credit_terms' => $this->credit_terms,
            'credit_limit' => (float)($this->credit_limit ?? 0),
            'current_balance' => (float)($this->account?->current_balance ?? 0),
            'delivery_zone' => $this->whenLoaded('zone', fn() => [
                'id' => $this->zone?->id,
                'name' => $this->zone?->name,
            ]),
            'parent' => $this->whenLoaded('parent', fn() => [
                'id' => $this->parent?->id,
                'name' => $this->parent?->name,
            ]),
        ];
    }
}
