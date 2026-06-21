<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\DeliveryProof;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DeliveryController extends Controller
{
    use ApiResponses;

    public function index(Request $request)
    {
        // If driver, only show their deliveries
        $user = auth()->user();
        
        $deliveries = Delivery::with(['order.customer.zone', 'order.items.product', 'driver.user', 'driver.vehicle', 'proofs'])
            ->when($user->role === 'driver', function($q) use ($user) {
                $q->whereHas('driver', fn($d) => $d->where('user_id', $user->id));
            })
            ->latest()
            ->get();

        return $this->success($deliveries);
    }

    public function assign(Request $request)
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'driver_id' => 'required|exists:drivers,id',
            'vehicle_id' => 'nullable|string',
            'estimated_delivery_time' => 'nullable|date',
        ]);

        return DB::transaction(function () use ($validated) {
            $order = Order::findOrFail($validated['order_id']);
            
            $delivery = Delivery::create([
                'order_id' => $order->id,
                'driver_id' => $validated['driver_id'],
                'assigned_by' => auth()->id() ?? \App\Models\User::first()->id,
                'status' => 'assigned',
                'dispatched_at' => now(),
            ]);

            $order->update(['status' => 'dispatched']);

            return $this->success($delivery, 'Delivery assigned successfully');
        });
    }

    public function confirm(Request $request, $id)
    {
        $validated = $request->validate([
            'recipient_name' => 'required|string',
            'recipient_phone' => 'nullable|string',
            'delivered_at' => 'required|date',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'notes' => 'nullable|string',
            'proof_image' => 'nullable|string', // Base64 or path
            'signature' => 'nullable|string', // Base64
        ]);

        $delivery = Delivery::findOrFail($id);
        
        return DB::transaction(function () use ($delivery, $validated) {
            $delivery->update([
                'status' => 'delivered',
                'delivered_at' => $validated['delivered_at'],
                'delivery_notes' => json_encode([
                    'recipient_name' => $validated['recipient_name'],
                    'recipient_phone' => $validated['recipient_phone'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]),
            ]);

            $delivery->order->update(['status' => 'delivered']);

            // Save proof
            DeliveryProof::create([
                'delivery_id' => $delivery->id,
                'photo_url' => $validated['proof_image'] ?? $validated['signature'] ?? 'N/A',
                'gps_latitude' => $validated['latitude'] ?? null,
                'gps_longitude' => $validated['longitude'] ?? null,
                'confirmed_at' => $validated['delivered_at'],
                'confirmed_by' => auth()->id() ?? \App\Models\User::first()->id,
            ]);

            return $this->success($delivery, 'Delivery confirmed successfully');
        });
    }

    public function transit(Request $request, $id)
    {
        $delivery = Delivery::findOrFail($id);

        if ($delivery->status !== 'assigned') {
            return $this->error('Only assigned deliveries can be marked as in transit.', 422);
        }

        $delivery->update([
            'status' => 'in_transit'
        ]);

        return $this->success($delivery, 'Delivery is now in transit');
    }

    public function show($id)
    {
        $delivery = Delivery::with(['order.customer.zone', 'order.items.product', 'driver.user', 'driver.vehicle', 'proofs'])
            ->findOrFail($id);

        return $this->success($delivery);
    }

    public function cancel(Request $request, $id)
    {
        $delivery = Delivery::findOrFail($id);

        if ($delivery->status !== 'in_transit') {
            return $this->error('Only in transit deliveries can be cancelled.', 422);
        }

        $delivery->update([
            'status' => 'assigned'
        ]);

        return $this->success($delivery, 'Delivery status reverted to assigned');
    }
}
