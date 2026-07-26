<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the order resource into a lean API JSON array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'fiscal_document_number' => $this->fiscal_document_number,
            'customer_id' => $this->customer_id,
            'customer_name' => $this->customer?->name,
            'customer_parent' => $this->whenLoaded('customer', fn() => $this->customer?->parent?->name),
            'sales_store_id' => $this->sales_store_id,
            'sales_store_name' => $this->whenLoaded('salesStore', fn() => $this->salesStore?->name),
            'order_date' => $this->order_date,
            'required_delivery_date' => $this->required_delivery_date,
            'urgency' => $this->urgency,
            'status' => $this->status,
            'total_amount' => (float)$this->total_amount,
            'admin_override_reason' => $this->admin_override_reason,
            'order_notes' => $this->order_notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'items' => $this->whenLoaded('items', function() {
                return $this->items->map(fn($item) => [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product?->name,
                    'product_code' => $item->product?->code,
                    'batch_reference' => $item->batch_reference,
                    'quantity' => (float)$item->quantity,
                    'unit_price' => (float)$item->unit_price,
                    'line_total' => (float)$item->line_total,
                ]);
            }),
            'deliveries' => $this->whenLoaded('deliveries', function() {
                return $this->deliveries->map(fn($delivery) => [
                    'id' => $delivery->id,
                    'driver_name' => $delivery->driver?->user?->name ?? $delivery->driver?->name,
                    'status' => $delivery->status,
                    'dispatched_at' => $delivery->dispatched_at,
                    'delivered_at' => $delivery->delivered_at,
                ]);
            }),
        ];
    }
}
