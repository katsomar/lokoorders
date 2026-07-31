<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\DeliveryPass;
use App\Models\DeliveryPassOrder;
use App\Models\DeliveryPassLocation;
use App\Models\DeliveryPassMedia;
use App\Models\DeliveryPassEvent;
use App\Models\Order;
use App\Models\Delivery;
use App\Models\DeliveryProof;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EmergencyDeliveryController extends Controller
{
    use ApiResponses;

    /**
     * Manager Endpoint: Generate an Emergency QR Delivery Pass for 1 or multiple orders.
     */
    public function generatePass(Request $request)
    {
        $validated = $request->validate([
            'order_ids' => 'required|array|min:1',
            'order_ids.*' => 'string|exists:orders,id',
            'expires_in_hours' => 'nullable|integer|min:1|max:48',
        ]);

        $orderIds = $validated['order_ids'];
        $expiresInHours = isset($validated['expires_in_hours']) ? (int)$validated['expires_in_hours'] : 12;

        try {
            return DB::transaction(function () use ($orderIds, $expiresInHours, $request) {
                // Generate clean human pass number e.g. PASS-1045
                $countToday = DeliveryPass::whereDate('created_at', now()->toDateString())->count() + 1;
                $passNumber = 'PASS-' . now()->format('Ymd') . '-' . str_pad($countToday, 4, '0', STR_PAD_LEFT);

                $secureToken = Str::random(64);
                $userId = auth()->id() ?? (\App\Models\User::where('role', 'admin')->first()?->id ?? (string)Str::uuid());

                $pass = DeliveryPass::create([
                    'pass_number' => $passNumber,
                    'secure_token' => $secureToken,
                    'status' => 'generated',
                    'expires_at' => now()->addHours($expiresInHours),
                    'created_by' => $userId,
                ]);

                // Attach orders to pass without altering existing order status
                foreach ($orderIds as $idx => $orderId) {
                    DeliveryPassOrder::create([
                        'delivery_pass_id' => $pass->id,
                        'order_id' => $orderId,
                        'sequence' => $idx + 1,
                        'status' => 'assigned',
                    ]);
                }

                // Log audit event
                DeliveryPassEvent::create([
                    'delivery_pass_id' => $pass->id,
                    'event_type' => 'created',
                    'performed_by_type' => 'user',
                    'performed_by_id' => (string)$userId,
                    'metadata' => [
                        'order_count' => count($orderIds),
                        'order_ids' => $orderIds,
                        'ip' => $request->ip(),
                    ],
                ]);

                try {
                    \App\Services\RealtimePublisher::publish('delivery.updated');
                } catch (\Throwable $th) {
                    \Illuminate\Support\Facades\Log::warning('RealtimePublisher publish skipped: ' . $th->getMessage());
                }

                $pass->load(['orders.customer', 'orders.items.product']);

                return $this->success([
                    'pass' => $pass,
                    'qr_link' => config('app.url', 'http://localhost:3000') . '/driver/qr/' . $secureToken,
                ], 'Emergency Delivery Pass generated successfully');
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('generatePass error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return $this->error('Failed to generate pass: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Public Endpoint: Show Delivery Pass Details (Privacy Masked for Guest Riders).
     */
    public function showPass($token)
    {
        try {
            $token = trim($token);
            $pass = DeliveryPass::where('secure_token', $token)
                ->with(['orders.customer.zone', 'orders.items.product'])
                ->first();

            if (!$pass) {
                return $this->error('Invalid or non-existent Emergency Delivery Pass URL.', 404);
            }

            if ($pass->status === 'revoked') {
                return $this->error('This Delivery Pass was revoked by the Dispatch Manager.', 410);
            }

            if ($pass->isExpired() && $pass->status !== 'completed') {
                $pass->update(['status' => 'expired']);
                return $this->error('This Emergency Delivery Pass has expired.', 410);
            }

            // Privacy Shield: Return operational rider info (Hide internal pricing margins, cost specs)
            $sanitizedOrders = $pass->orders->map(function ($order) {
                return [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $order->customer?->name ?? 'Customer Outlet',
                    'customer_phone' => $order->customer?->phone ?? $order->customer?->contact_person ?? 'N/A',
                    'delivery_address' => $order->customer?->address ?? $order->customer?->zone?->name ?? 'Kampala',
                    'latitude' => $order->customer?->latitude ? (float)$order->customer->latitude : null,
                    'longitude' => $order->customer?->longitude ? (float)$order->customer->longitude : null,
                    'total_amount' => (float)$order->total_amount,
                    'items' => $order->items->map(function ($item) {
                        return [
                            'product_name' => $item->product?->name ?? 'Egg Product',
                            'quantity' => (float)$item->quantity,
                            'unit' => $item->product?->unit_of_measure ?? 'trays',
                            'unit_price' => (float)$item->unit_price,
                            'subtotal' => (float)($item->quantity * $item->unit_price),
                        ];
                    }),
                ];
            });

            return $this->success([
                'pass_number' => $pass->pass_number,
                'status' => $pass->status,
                'driver_name' => $pass->driver_name,
                'driver_phone' => $pass->driver_phone,
                'vehicle_info' => $pass->vehicle_info,
                'claimed_at' => $pass->claimed_at,
                'started_at' => $pass->started_at,
                'completed_at' => $pass->completed_at,
                'expires_at' => $pass->expires_at,
                'is_claimed' => !is_null($pass->claimed_at),
                'latest_location' => $pass->locations()->latest()->first(),
                'orders' => $sanitizedOrders,
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('showPass error: ' . $e->getMessage());
            return $this->error('Could not load delivery pass: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Public Endpoint: Atomic Claiming of Emergency Pass by External Rider.
     */
    public function claimPass(Request $request, $token)
    {
        $validated = $request->validate([
            'driver_name' => 'required|string|min:2|max:100',
            'driver_phone' => 'required|string|regex:/^[0-9+\-\s()]{9,20}$/',
            'vehicle_info' => 'nullable|string|max:100',
        ]);

        $token = trim($token);
        $pass = DeliveryPass::where('secure_token', $token)->first();

        if (!$pass) {
            return $this->error('Invalid delivery pass token.', 404);
        }

        if ($pass->status === 'revoked') {
            return $this->error('This Delivery Pass has been revoked.', 410);
        }

        if ($pass->isExpired()) {
            return $this->error('This Delivery Pass has expired.', 410);
        }

        if (!is_null($pass->claimed_at) && $pass->driver_phone !== $validated['driver_phone']) {
            return $this->error('This Delivery Pass has already been claimed by rider: ' . $pass->driver_name . ' (' . $pass->driver_phone . ').', 409);
        }

        // Atomic Transaction with Concurrency Lock
        return DB::transaction(function () use ($pass, $validated, $request) {
            $pass->update([
                'driver_name' => $validated['driver_name'],
                'driver_phone' => $validated['driver_phone'],
                'vehicle_info' => $validated['vehicle_info'] ?? 'Boda Boda',
                'claimed_at' => now(),
                'status' => 'claimed',
            ]);

            $pass->refresh();

            // Log event
            DeliveryPassEvent::create([
                'delivery_pass_id' => $pass->id,
                'event_type' => 'claimed',
                'performed_by_type' => 'guest_driver',
                'performed_by_id' => $validated['driver_phone'],
                'metadata' => [
                    'driver_name' => $validated['driver_name'],
                    'driver_phone' => $validated['driver_phone'],
                    'vehicle_info' => $validated['vehicle_info'] ?? null,
                    'ip' => $request->ip(),
                ],
            ]);

            try {
                \App\Services\RealtimePublisher::publish('delivery.updated');
            } catch (\Throwable $th) {}

            return $this->success($pass, 'Delivery Pass claimed successfully');
        });
    }

    /**
     * Public Endpoint: Start Delivery Route (Sets status to in_transit / on_route).
     */
    public function startRoute(Request $request, $token)
    {
        $pass = DeliveryPass::where('secure_token', $token)->first();

        if (!$pass) {
            return $this->error('Invalid delivery pass token.', 404);
        }

        if (!in_array($pass->status, ['claimed', 'shared', 'generated'])) {
            return $this->error('Pass cannot start route from status: ' . $pass->status, 422);
        }

        return DB::transaction(function () use ($pass, $request) {
            $adminUser = \App\Models\User::where('role', 'admin')->first();
            $userId = auth()->id() ?? ($adminUser?->id ?? (string)Str::uuid());

            $pass->update([
                'status' => 'in_transit',
                'started_at' => now(),
            ]);

            // Update associated orders to on_route
            foreach ($pass->passOrders as $pOrder) {
                $pOrder->update(['status' => 'in_transit']);
                $order = Order::find($pOrder->order_id);
                if ($order) {
                    $order->update(['status' => 'on_route']);
                    $order->statusHistory()->create([
                        'status' => 'on_route',
                        'changed_by' => $userId,
                        'notes' => 'Guest Emergency Rider (' . ($pass->driver_name ?? 'Emergency Rider') . ') started delivery route.',
                    ]);
                }
            }

            DeliveryPassEvent::create([
                'delivery_pass_id' => $pass->id,
                'event_type' => 'transit_started',
                'performed_by_type' => 'guest_driver',
                'performed_by_id' => $pass->driver_phone ?? '0000000000',
                'metadata' => ['ip' => $request->ip()],
            ]);

            try {
                \App\Services\RealtimePublisher::publish('delivery.updated');
            } catch (\Throwable $th) {}

            return $this->success($pass, 'Delivery route started successfully');
        });
    }

    /**
     * Public Endpoint: Stream Guest Rider GPS Location Breadcrumb.
     */
    public function trackLocation(Request $request, $token)
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'accuracy' => 'nullable|numeric',
            'speed' => 'nullable|numeric',
            'heading' => 'nullable|numeric',
        ]);

        $pass = DeliveryPass::where('secure_token', $token)->first();

        if (!$pass || !in_array($pass->status, ['claimed', 'in_transit', 'arrived'])) {
            return $this->error('Pass is not in an active tracking state.', 422);
        }

        $location = DeliveryPassLocation::create([
            'delivery_pass_id' => $pass->id,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'accuracy' => $validated['accuracy'] ?? null,
            'speed' => $validated['speed'] ?? null,
            'heading' => $validated['heading'] ?? null,
        ]);

        // Publish WebSocket broadcast for Order Manager Admin Map
        try {
            \App\Services\RealtimePublisher::publish('delivery.updated', [
                'delivery_pass_id' => $pass->id,
                'pass_number' => $pass->pass_number,
                'driver_name' => $pass->driver_name,
                'latitude' => (float)$validated['latitude'],
                'longitude' => (float)$validated['longitude'],
                'timestamp' => now()->toIso8601String(),
            ]);
        } catch (\Throwable $th) {}

        return $this->success($location, 'Location logged');
    }

    /**
     * Public Endpoint: Complete Delivery & Save Signature + Photo Proofs.
     */
    public function completeDelivery(Request $request, $token)
    {
        $validated = $request->validate([
            'recipient_name' => 'required|string|min:2|max:100',
            'recipient_phone' => 'nullable|string|regex:/^[0-9+\-\s()]{9,20}$/',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'notes' => 'nullable|string|max:500',
            'proof_image_file' => 'required|file|image|max:6144',
            'signature_data' => 'required|string',
            'order_id' => 'nullable|string|exists:orders,id',
        ]);

        $token = trim($token);
        $pass = DeliveryPass::where('secure_token', $token)->first();

        if (!$pass) {
            return $this->error('Invalid delivery pass token.', 404);
        }

        if ($pass->status === 'completed') {
            return $this->error('This Delivery Pass has already been completed and deactivated.', 410);
        }

        try {
            return DB::transaction(function () use ($pass, $validated, $request) {
                $adminUser = \App\Models\User::where('role', 'admin')->first();
                $userId = auth()->id() ?? ($adminUser?->id ?? (string)Str::uuid());

                // Save Document Photo to public disk
                $documentPath = null;
                if ($request->hasFile('proof_image_file')) {
                    $documentPath = $request->file('proof_image_file')->store('delivery_proofs/documents', 'public');
                }

                // Decode base64 Signature to public disk
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
                    Storage::disk('public')->put($signaturePath, $imageBase64);
                }

                // Record media proof entry
                if ($documentPath) {
                    DeliveryPassMedia::create([
                        'delivery_pass_id' => $pass->id,
                        'order_id' => $validated['order_id'] ?? null,
                        'media_type' => 'signed_document_photo',
                        'file_path' => $documentPath,
                        'mime_type' => $request->file('proof_image_file')->getClientMimeType(),
                        'file_size' => $request->file('proof_image_file')->getSize(),
                        'recipient_name' => $validated['recipient_name'],
                        'recipient_phone' => $validated['recipient_phone'] ?? null,
                        'latitude' => $validated['latitude'],
                        'longitude' => $validated['longitude'],
                    ]);
                }

                if ($signaturePath) {
                    DeliveryPassMedia::create([
                        'delivery_pass_id' => $pass->id,
                        'order_id' => $validated['order_id'] ?? null,
                        'media_type' => 'recipient_signature',
                        'file_path' => $signaturePath,
                        'mime_type' => 'image/png',
                        'file_size' => strlen($base64Image ?? ''),
                        'recipient_name' => $validated['recipient_name'],
                        'recipient_phone' => $validated['recipient_phone'] ?? null,
                        'latitude' => $validated['latitude'],
                        'longitude' => $validated['longitude'],
                    ]);
                }

                // Update attached orders to delivered
                foreach ($pass->passOrders as $pOrder) {
                    $pOrder->update([
                        'status' => 'delivered',
                        'delivered_at' => now(),
                    ]);

                    $order = Order::find($pOrder->order_id);
                    if ($order) {
                        $order->update(['status' => 'delivered']);
                        $order->statusHistory()->create([
                            'status' => 'delivered',
                            'changed_by' => $userId,
                            'notes' => 'Emergency QR Delivery completed by ' . ($pass->driver_name ?? 'Emergency Rider') . '. Recipient: ' . $validated['recipient_name'],
                        ]);

                        // Also save entry into system deliveries & delivery_proofs for system backward compatibility
                        $driver = \App\Models\Driver::first();
                        $driverId = $driver?->id ?? (string)Str::uuid();

                        $delivery = Delivery::create([
                            'order_id' => $order->id,
                            'driver_id' => $driverId,
                            'assigned_by' => $userId,
                            'status' => 'delivered',
                            'dispatched_at' => $pass->started_at ?? $pass->claimed_at ?? now(),
                            'delivered_at' => now(),
                            'delivery_notes' => json_encode([
                                'recipient_name' => $validated['recipient_name'],
                                'recipient_phone' => $validated['recipient_phone'] ?? null,
                                'emergency_driver' => $pass->driver_name,
                                'emergency_phone' => $pass->driver_phone,
                                'pass_number' => $pass->pass_number,
                                'notes' => $validated['notes'] ?? null,
                            ]),
                        ]);

                        DeliveryProof::create([
                            'delivery_id' => $delivery->id,
                            'photo_url' => $documentPath ?? 'N/A',
                            'signature_path' => $signaturePath,
                            'gps_latitude' => $validated['latitude'],
                            'gps_longitude' => $validated['longitude'],
                            'confirmed_at' => now(),
                            'confirmed_by' => $userId,
                        ]);
                    }
                }

                // Deactivate Pass
                $pass->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);

                DeliveryPassEvent::create([
                    'delivery_pass_id' => $pass->id,
                    'event_type' => 'completed',
                    'performed_by_type' => 'guest_driver',
                    'performed_by_id' => $pass->driver_phone ?? '0000000000',
                    'metadata' => [
                        'recipient_name' => $validated['recipient_name'],
                        'ip' => $request->ip(),
                    ],
                ]);

                try {
                    \App\Services\RealtimePublisher::publish('delivery.updated');
                } catch (\Throwable $th) {}

                return $this->success($pass, 'Delivery successfully completed and QR pass deactivated');
            });
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('completeDelivery error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            return $this->error('Failed to complete delivery: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Manager Endpoint: Revoke Emergency Delivery Pass.
     */
    public function revokePass(Request $request, $passId)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string|max:255',
        ]);

        $pass = DeliveryPass::findOrFail($passId);

        if ($pass->status === 'completed') {
            return $this->error('Completed delivery passes cannot be revoked.', 422);
        }

        $userId = auth()->id() ?? (\App\Models\User::where('role', 'admin')->first()?->id ?? (string)Str::uuid());

        $pass->update([
            'status' => 'revoked',
            'revoked_at' => now(),
            'revoked_by' => $userId,
            'revocation_reason' => $validated['reason'] ?? 'Revoked by Manager',
        ]);

        // Revert associated orders back to ready_for_dispatch
        foreach ($pass->passOrders as $pOrder) {
            $order = Order::find($pOrder->order_id);
            if ($order && $order->status !== 'delivered') {
                $order->update(['status' => 'ready_for_dispatch']);
                $order->statusHistory()->create([
                    'status' => 'ready_for_dispatch',
                    'changed_by' => $userId,
                    'notes' => 'Emergency QR Pass (' . $pass->pass_number . ') was revoked. Reverted order status.',
                ]);
            }
        }

        DeliveryPassEvent::create([
            'delivery_pass_id' => $pass->id,
            'event_type' => 'revoked',
            'performed_by_type' => 'user',
            'performed_by_id' => (string)$userId,
            'metadata' => [
                'reason' => $validated['reason'] ?? null,
                'ip' => $request->ip(),
            ],
        ]);

        \App\Services\RealtimePublisher::publish('delivery.updated');

        return $this->success($pass, 'Delivery Pass revoked successfully');
    }
}
