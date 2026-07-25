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
        
        $deliveries = Delivery::with(['order.customer.zone', 'order.items.product', 'driver.user', 'driver.vehicle', 'proofs', 'assignedBy'])
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
            'order_id' => 'required_without:order_ids|nullable|string|exists:orders,id',
            'order_ids' => 'required_without:order_id|nullable|array',
            'order_ids.*' => 'string|exists:orders,id',
            'driver_id' => 'required|exists:drivers,id',
            'vehicle_id' => 'nullable|string',
            'estimated_delivery_time' => 'nullable|date',
            'prevent_status_update' => 'nullable|boolean',
        ]);

        $driverId = $validated['driver_id'];

        // Enforce constraint: If driver is enroute (has any active 'in_transit' deliveries), reject assignment.
        $hasInTransit = Delivery::where('driver_id', $driverId)
            ->where('status', 'in_transit')
            ->exists();

        if ($hasInTransit) {
            return $this->error('This driver is currently enroute with another delivery trip and cannot be assigned new orders until they complete their current deliveries.', 422);
        }

        $orderIds = isset($validated['order_ids']) ? $validated['order_ids'] : [$validated['order_id']];
        $preventStatusUpdate = $request->input('prevent_status_update', false);
        $vehicleId = $validated['vehicle_id'] ?? null;

        try {
            return DB::transaction(function () use ($orderIds, $driverId, $vehicleId, $preventStatusUpdate) {
                if ($vehicleId) {
                    \App\Models\Driver::where('id', $driverId)->update(['vehicle_id' => $vehicleId]);
                }
                $deliveries = [];
                foreach ($orderIds as $orderId) {
                    // Prevent duplicate assignment if active delivery already exists for this order
                    $exists = Delivery::where('order_id', $orderId)
                        ->whereIn('status', ['assigned', 'in_transit'])
                        ->exists();
                    if ($exists) {
                        continue;
                    }

                    $order = Order::findOrFail($orderId);
                    $wasUndone = ($order->status === 'undone');
                    
                    $delivery = Delivery::create([
                        'order_id' => $order->id,
                        'driver_id' => $driverId,
                        'assigned_by' => auth()->id() ?? \App\Models\User::first()->id,
                        'status' => 'assigned',
                        'dispatched_at' => now(),
                    ]);

                    if ($wasUndone) {
                        $order->deductStockForRedispatch();
                    }

                    if ((!$preventStatusUpdate || $wasUndone) && $order->status !== 'pending') {
                        $order->update(['status' => 'dispatched']);
                        $order->statusHistory()->create([
                            'status' => 'dispatched',
                            'changed_by' => auth()->id() ?? (\App\Models\User::where('role', 'admin')->first()?->id ?? 1),
                            'notes' => $wasUndone ? 'Driver assigned and re-dispatched after undone delivery' : 'Driver assigned and dispatched',
                        ]);
                    }
                    
                    $deliveries[] = $delivery;
                }

                return $this->success(
                    count($deliveries) === 1 ? $deliveries[0] : $deliveries,
                    'Deliveries assigned successfully'
                );
            });
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function confirm(Request $request, $id)
    {
        $validated = $request->validate([
            'recipient_name' => 'required|string|min:2|max:100',
            'recipient_phone' => 'nullable|string|regex:/^[0-9+\-\s()]{9,20}$/',
            'delivered_at' => 'required|date|before_or_equal:now',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'notes' => 'nullable|string|max:500',
            'proof_image_file' => 'required|file|image|max:4096',
            'signature_data' => 'required|string',
        ]);

        $delivery = Delivery::findOrFail($id);
        
        // Geofence check: verify if the driver is within 15 meters of customer site (if customer coordinates are set)
        // TEMPORARILY DISABLED FOR TESTING
        /*
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
        */
        
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

        if ($delivery->order) {
            $delivery->order->update(['status' => 'on_route']);
            $delivery->order->statusHistory()->create([
                'status' => 'on_route',
                'changed_by' => auth()->id() ?? \App\Models\User::first()->id,
                'notes' => 'Driver started delivery route.',
            ]);
        }

        return $this->success($delivery, 'Delivery is now in transit');
    }

    public function show($id)
    {
        $delivery = Delivery::with(['order.customer.zone', 'order.items.product', 'driver.user', 'driver.vehicle', 'proofs', 'assignedBy'])
            ->findOrFail($id);

        return $this->success($delivery);
    }

    public function cancel(Request $request, $id)
    {
        $delivery = Delivery::findOrFail($id);

        if ($delivery->status !== 'in_transit') {
            return $this->error('Only in transit deliveries can be cancelled.', 422);
        }

        return DB::transaction(function () use ($delivery) {
            $delivery->update([
                'status' => 'assigned'
            ]);

            if ($delivery->order) {
                $delivery->order->update(['status' => 'dispatched']);
                $delivery->order->statusHistory()->create([
                    'status' => 'dispatched',
                    'changed_by' => auth()->id() ?? \App\Models\User::first()->id,
                    'notes' => 'Driver cancelled transit. Reverted status to dispatched.',
                ]);
            }

            return $this->success($delivery, 'Delivery status reverted to assigned');
        });
    }

    public function track(Request $request, $id)
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'distance_traveled' => 'nullable|numeric',
            'duration_seconds' => 'nullable|integer',
            'fuel_consumed' => 'nullable|numeric',
        ]);

        $delivery = Delivery::findOrFail($id);

        if ($delivery->status === 'in_transit') {
            $lat = (float)$validated['latitude'];
            $lng = (float)$validated['longitude'];

            $delivery->current_latitude = $lat;
            $delivery->current_longitude = $lng;

            // Load and append to location history
            $history = $delivery->location_history ?? [];
            
            $shouldAppend = true;
            if (!empty($history)) {
                $lastPoint = end($history);
                // Check if we already have this coordinate (or a very close one) to avoid duplicates
                if (abs($lastPoint[0] - $lat) < 0.0001 && abs($lastPoint[1] - $lng) < 0.0001) {
                    $shouldAppend = false;
                }
            }

            if ($shouldAppend) {
                $history[] = [$lat, $lng];
                $delivery->location_history = $history;
            }

            if (isset($validated['distance_traveled'])) {
                $delivery->distance_traveled = (float)$validated['distance_traveled'];
            }
            if (isset($validated['duration_seconds'])) {
                $delivery->duration_seconds = (int)$validated['duration_seconds'];
            }
            if (isset($validated['fuel_consumed'])) {
                $delivery->fuel_consumed = (float)$validated['fuel_consumed'];
            }

            $delivery->save();
        }

        return $this->success($delivery, 'Tracking location updated successfully');
    }

    public function undone(Request $request, $id)
    {
        $validated = $request->validate([
            'undone_reason' => 'required|string',
            'return_sales_store_id' => 'required|string|exists:sales_stores,id',
        ]);

        $delivery = Delivery::findOrFail($id);

        if ($delivery->status !== 'in_transit') {
            return $this->error('Only in transit deliveries can be marked as undone.', 422);
        }

        return DB::transaction(function () use ($delivery, $validated) {
            $reason = $validated['undone_reason'];
            $returnSalesStoreId = $validated['return_sales_store_id'];

            // Traffic and late dispatch are exempted from penalties
            $isPenalized = !in_array($reason, ['traffic', 'late_dispatch']);

            $delivery->update([
                'status' => 'undone',
                'undone_reason' => $reason,
                'undone_at' => now(),
                'undone_by' => auth()->id() ?? \App\Models\User::first()->id,
                'return_sales_store_id' => $returnSalesStoreId,
                'is_penalized' => $isPenalized,
            ]);

            $order = $delivery->order;
            $order->update(['status' => 'undone']);
            
            $order->statusHistory()->create([
                'status' => 'undone',
                'changed_by' => auth()->id() ?? \App\Models\User::first()->id,
                'notes' => 'Delivery marked as undone. Reason: ' . str_replace('_', ' ', $reason),
            ]);

            // Return stock to the selected sales store
            $userId = auth()->id() ?? 1;
            foreach ($order->items as $item) {
                $stock = \App\Models\SalesStoreStock::firstOrCreate(
                    [
                        'sales_store_id' => $returnSalesStoreId,
                        'product_id' => $item->product_id,
                        'batch_reference' => $item->batch_reference,
                    ],
                    ['current_quantity' => 0, 'updated_by' => $userId]
                );

                if ($returnSalesStoreId === $order->sales_store_id) {
                    $stock->updateStock('sold', -$item->quantity, $item->unit_price);
                } else {
                    $stock->updateStock('transfer_in', $item->quantity, $item->unit_price);
                }

                \App\Models\SalesStoreMovement::create([
                    'movement_date' => now()->toDateString(),
                    'sales_store_id' => $returnSalesStoreId,
                    'product_id' => $item->product_id,
                    'batch_reference' => $item->batch_reference,
                    'movement_type' => 'return_in',
                    'quantity' => $item->quantity,
                    'reference_id' => $delivery->id,
                    'created_by' => $userId,
                    'notes' => "Returned from Undone Order: " . $order->order_number . " (Originally from " . ($order->salesStore?->code ?? 'MAIN') . ")",
                ]);
            }

            return $this->success($delivery, 'Delivery successfully marked as undone and stock returned.');
        });
    }
}
