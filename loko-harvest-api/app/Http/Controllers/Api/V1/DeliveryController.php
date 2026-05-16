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
        
        $deliveries = Delivery::with(['order.customer', 'driver.user'])
            ->when($user->role === 'driver', function($q) use ($user) {
                $q->whereHas('driver', fn($d) => $d->where('user_id', $user->id));
            })
            ->latest()
            ->paginate($request->per_page ?? 15);

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
                'delivery_status' => 'pending',
                'assigned_at' => now(),
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
                'delivery_status' => 'delivered',
                'actual_delivery_time' => $validated['delivered_at'],
            ]);

            $delivery->order->update(['status' => 'delivered']);

            // Save proof
            DeliveryProof::create([
                'delivery_id' => $delivery->id,
                'proof_type' => $validated['proof_image'] ? 'photo' : 'signature',
                'file_path' => $validated['proof_image'] ?? $validated['signature'],
                'captured_at' => $validated['delivered_at'],
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
            ]);

            return $this->success($delivery, 'Delivery confirmed successfully');
        });
    }
}
