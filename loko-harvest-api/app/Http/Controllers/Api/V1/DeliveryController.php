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
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'notes' => 'nullable|string',
            'proof_image_file' => 'required|file|image|max:4096',
            'signature_data' => 'required|string',
        ]);

        $delivery = Delivery::findOrFail($id);
        
        // Geofence check: verify if the driver is within 15 meters of customer site (if customer coordinates are set)
        $customer = $delivery->order?->customer;
        if ($customer && $customer->latitude !== null && $customer->longitude !== null) {
            $distance = $this->calculateDistanceMeters(
                (float)$validated['latitude'],
                (float)$validated['longitude'],
                (float)$customer->latitude,
                (float)$customer->longitude
            );
            
            if ($distance > 15.0) {
                return $this->error("Out of bounds: Delivery confirmation must be completed within 15 meters of the customer's coordinates. (You are currently " . round($distance) . " meters away)", 422);
            }
        }
        
        return DB::transaction(function () use ($delivery, $validated, $request) {
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

            // Save document photo file to storage
            $documentPath = null;
            if ($request->hasFile('proof_image_file')) {
                $documentPath = $request->file('proof_image_file')->store('delivery_proofs/documents', 'public');
            }

            // Decode base64 signature and save to storage
            $signaturePath = null;
            if ($request->filled('signature_data')) {
                $base64Image = $request->input('signature_data');
                if (str_contains($base64Image, ';base64,')) {
                    $imageParts = explode(";base64,", $base64Image);
                    $imageTypeAux = explode("image/", $imageParts[0]);
                    $imageType = $imageTypeAux[1] ?? 'png';
                    $imageBase64 = base64_decode($imageParts[1]);
                } else {
                    $imageType = 'png';
                    $imageBase64 = base64_decode($base64Image);
                }
                $fileName = uniqid() . '.' . $imageType;
                $signaturePath = 'delivery_proofs/signatures/' . $fileName;
                \Illuminate\Support\Facades\Storage::disk('public')->put($signaturePath, $imageBase64);
            }

            // Save proof
            DeliveryProof::create([
                'delivery_id' => $delivery->id,
                'photo_url' => $documentPath ?? 'N/A',
                'signature_path' => $signaturePath,
                'gps_latitude' => $validated['latitude'],
                'gps_longitude' => $validated['longitude'],
                'confirmed_at' => $validated['delivered_at'],
                'confirmed_by' => auth()->id() ?? \App\Models\User::first()->id,
            ]);

            return $this->success($delivery, 'Delivery confirmed successfully');
        });
    }

    private function calculateDistanceMeters($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // in meters
        
        $lat1 = deg2rad($lat1);
        $lon1 = deg2rad($lon1);
        $lat2 = deg2rad($lat2);
        $lon2 = deg2rad($lon2);
        
        $latDelta = $lat2 - $lat1;
        $lonDelta = $lon2 - $lon1;
        
        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos($lat1) * cos($lat2) *
             sin($lonDelta / 2) * sin($lonDelta / 2);
             
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        return $earthRadius * $c;
    }

    public function transit(Request $request, $id)
    {
        $delivery = Delivery::findOrFail($id);

        if ($delivery->status !== 'assigned') {
            return $this->error('Only assigned deliveries can be marked as in transit.', 422);
        }

        $validated = $request->validate([
            'delay_reason' => 'nullable|string',
            'custom_delay_reason' => 'nullable|string',
        ]);

        $isPenalized = false;
        $approvedReasons = ['traffic', 'no_vehicle', 'missing_docs', 'sickness', 'weather', 'loading_delay'];

        if (!empty($validated['delay_reason'])) {
            $reason = $validated['delay_reason'];
            if ($reason === 'other' || !in_array($reason, $approvedReasons)) {
                $isPenalized = true;
            }
        }

        $delivery->update([
            'status' => 'in_transit',
            'delay_reason' => $validated['delay_reason'] ?? null,
            'custom_delay_reason' => $validated['custom_delay_reason'] ?? null,
            'is_penalized' => $isPenalized,
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
