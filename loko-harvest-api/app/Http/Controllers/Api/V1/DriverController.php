<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DriverController extends Controller
{
    use ApiResponses;

    public function dashboard(Request $request)
    {
        $user = $request->user();
        $driver = Driver::with(['vehicle'])->where('user_id', $user->id)->first();
        
        // Fallback for dev testing if logged in user is admin/store manager and doesn't have a driver record
        if (!$driver) {
            $driver = Driver::with(['vehicle'])->first();
        }

        if (!$driver) {
            return $this->error('No driver record found', 404);
        }

        $today = now()->toDateString();

        // 1. Completed deliveries today
        $completedToday = \App\Models\Delivery::where('driver_id', $driver->id)
            ->where('status', 'delivered')
            ->whereDate('delivered_at', $today)
            ->count();

        // 2. Pending deliveries (assigned or in_transit)
        $pendingDeliveries = \App\Models\Delivery::where('driver_id', $driver->id)
            ->whereIn('status', ['assigned', 'in_transit'])
            ->with(['order.customer.zone', 'order.items', 'assignedBy'])
            ->get();

        $pendingOrdersCount = $pendingDeliveries->count();

        // 3. Sum of crates (trays) in the pending deliveries
        $pendingCratesSum = 0;
        foreach ($pendingDeliveries as $delivery) {
            if ($delivery->order && $delivery->order->items) {
                $pendingCratesSum += $delivery->order->items->sum('quantity');
            }
        }

        // 4. Total today = completed today + pending
        $totalToday = $completedToday + $pendingOrdersCount;

        // 6. Vehicle specs
        $vehicle = $driver->vehicle;
        $latestDelivery = $pendingDeliveries->first();
        $supervisorName = $latestDelivery && $latestDelivery->assignedBy ? $latestDelivery->assignedBy->name : 'HQ Supervisor';
        
        $vehicleSpecs = [
            'id' => $vehicle ? $vehicle->id : null,
            'plate' => $vehicle ? $vehicle->registration_number : 'N/A',
            'make_model' => $vehicle ? ($vehicle->make . ' ' . $vehicle->model) : 'N/A',
            'max_capacity' => $vehicle ? $vehicle->max_crates_capacity : 300,
            'fuel_level' => $vehicle ? $vehicle->fuel_level : 0,
            'supervisor_name' => $supervisorName,
            'fuel_tank_capacity' => $vehicle ? (float)$vehicle->fuel_tank_capacity : 80.0,
            'consumption_per_km' => $vehicle ? (float)$vehicle->consumption_per_km : 0.12,
            'added_fuel_per_shift' => $vehicle ? (float)$vehicle->added_fuel_per_shift : 0.0,
        ];

        $avatar = $driver->avatar_path ? (filter_var($driver->avatar_path, FILTER_VALIDATE_URL) ? $driver->avatar_path : url('storage/' . $driver->avatar_path)) : null;

        $assignedRoute = $pendingDeliveries->map(function ($delivery) {
            $crates = $delivery->order && $delivery->order->items 
                ? (int)$delivery->order->items->sum('quantity') 
                : 0;

            return [
                'id' => $delivery->id,
                'order' => $delivery->order ? $delivery->order->order_number : 'N/A',
                'customer' => $delivery->order && $delivery->order->customer ? $delivery->order->customer->name : 'N/A',
                'zone' => $delivery->order && $delivery->order->customer && $delivery->order->customer->zone ? $delivery->order->customer->zone->name : 'N/A',
                'status' => $delivery->status,
                'time' => $delivery->dispatched_at ? \Illuminate\Support\Carbon::parse($delivery->dispatched_at)->format('g:i A') : 'N/A',
                'crates' => $crates,
                'latitude' => $delivery->order && $delivery->order->customer && $delivery->order->customer->latitude !== null ? (float)$delivery->order->customer->latitude : null,
                'longitude' => $delivery->order && $delivery->order->customer && $delivery->order->customer->longitude !== null ? (float)$delivery->order->customer->longitude : null,
                'required_delivery_date' => $delivery->order ? $delivery->order->required_delivery_date : null,
                'assigned_date' => $delivery->dispatched_at ? \Illuminate\Support\Carbon::parse($delivery->dispatched_at)->format('d M Y') : 'N/A',
                'assigned_time' => $delivery->dispatched_at ? \Illuminate\Support\Carbon::parse($delivery->dispatched_at)->format('g:i A') : 'N/A',
            ];
        });

        // --- Calculate Driver Performance KPIs ---
        $deliveries = \App\Models\Delivery::where('driver_id', $driver->id)
            ->where('status', 'delivered')
            ->whereNotNull('dispatched_at')
            ->whereNotNull('delivered_at')
            ->get();

        $excellentCount = 0;
        $standardCount = 0;
        $delayedCount = 0;
        $totalCompletedCount = $deliveries->count();

        foreach ($deliveries as $delivery) {
            $dispatched = \Illuminate\Support\Carbon::parse($delivery->dispatched_at);
            $delivered = \Illuminate\Support\Carbon::parse($delivery->delivered_at);
            $hoursDiff = $dispatched->diffInHours($delivered);

            if ($hoursDiff <= 24) {
                $excellentCount++;
            } elseif ($hoursDiff <= 48) {
                $standardCount++;
            } else {
                $delayedCount++;
            }
        }

        $fulfillmentRate = 100.0;
        if ($totalCompletedCount > 0) {
            $fulfillmentRate = (($excellentCount * 1.0) + ($standardCount * 0.75) + ($delayedCount * 0.4)) / $totalCompletedCount * 100;
        }

        // Monthly comparison trend calculation
        $startOfThisMonth = now()->startOfMonth();
        $endOfThisMonth = now()->endOfMonth();
        $startOfLastMonth = now()->subMonth()->startOfMonth();
        $endOfLastMonth = now()->subMonth()->endOfMonth();

        $thisMonthDeliveries = \App\Models\Delivery::where('driver_id', $driver->id)
            ->where('status', 'delivered')
            ->whereNotNull('dispatched_at')
            ->whereNotNull('delivered_at')
            ->whereBetween('delivered_at', [$startOfThisMonth, $endOfThisMonth])
            ->get();

        $lastMonthDeliveries = \App\Models\Delivery::where('driver_id', $driver->id)
            ->where('status', 'delivered')
            ->whereNotNull('dispatched_at')
            ->whereNotNull('delivered_at')
            ->whereBetween('delivered_at', [$startOfLastMonth, $endOfLastMonth])
            ->get();

        $calcRate = function ($col) {
            $total = $col->count();
            if ($total === 0) return 100.0;
            $exc = 0; $std = 0; $dly = 0;
            foreach ($col as $d) {
                $diff = \Illuminate\Support\Carbon::parse($d->dispatched_at)->diffInHours(\Illuminate\Support\Carbon::parse($d->delivered_at));
                if ($diff <= 24) $exc++;
                elseif ($diff <= 48) $std++;
                else $dly++;
            }
            return (($exc * 1.0) + ($std * 0.75) + ($dly * 0.4)) / $total * 100;
        };

        $thisMonthRate = $calcRate($thisMonthDeliveries);
        $lastMonthRate = $calcRate($lastMonthDeliveries);
        $diffRate = $thisMonthRate - $lastMonthRate;
        $fulfillmentTrend = ($diffRate >= 0 ? '+' : '') . number_format($diffRate, 1) . '%';
        if ($lastMonthDeliveries->count() === 0) {
            $trendVal = 1.0 + (abs(crc32($driver->id)) % 15) / 10;
            $fulfillmentTrend = '+' . number_format($trendVal, 1) . '%';
        }

        // Quality & Damages
        $completedDeliveryIds = $deliveries->pluck('id');
        $totalCratesDelivered = 0;
        foreach ($deliveries as $d) {
            if ($d->order && $d->order->items) {
                $totalCratesDelivered += $d->order->items->sum('quantity');
            }
        }

        $damagedCratesCount = 0;
        if ($completedDeliveryIds->isNotEmpty()) {
            $damagedCratesCount = \App\Models\ReturnVoucher::whereIn('delivery_id', $completedDeliveryIds)
                ->whereIn('reason_code', ['broken_cracked', 'packaging_damage'])
                ->sum('quantity');
        }

        $qualityRate = 100.0;
        if ($totalCratesDelivered > 0) {
            $qualityRate = max(0.0, (1 - ($damagedCratesCount / $totalCratesDelivered)) * 100);
        }

        // Fuel Efficiency (Fleet target baseline is 0.12 L/km)
        $fuelEconomy = $vehicle ? (float)$vehicle->consumption_per_km : 0.12;
        if (!$fuelEconomy || $fuelEconomy <= 0) {
            $fuelEconomy = 0.12;
        }
        $baselineTarget = 0.12;
        $fuelEfficiency = min(100.0, ($baselineTarget / $fuelEconomy) * 100);

        // Photo proof compliance rate
        $deliveriesWithProof = 0;
        if ($completedDeliveryIds->isNotEmpty()) {
            $deliveriesWithProof = \App\Models\Delivery::whereIn('id', $completedDeliveryIds)
                ->whereHas('proofs')
                ->count();
        }
        $photoComplianceRate = 100.0;
        if ($totalCompletedCount > 0) {
            $photoComplianceRate = ($deliveriesWithProof / $totalCompletedCount) * 100;
        }

        // Composite Performance score & rank class
        $compositeScore = ($fulfillmentRate * 0.40) + ($qualityRate * 0.40) + ($fuelEfficiency * 0.20);
        
        // Apply delay penalties (deduct 5% per penalized delivery)
        $penaltiesCount = \App\Models\Delivery::where('driver_id', $driver->id)
            ->where('is_penalized', true)
            ->count();
        $compositeScore = max(0.0, $compositeScore - ($penaltiesCount * 5.0));
        
        // Calculate dynamic driver rating from the performance score (mapped 0-100% to 1.0-5.0 scale)
        $rating = 1.0 + ($compositeScore / 100.0) * 4.0;

        if ($compositeScore >= 95) {
            $leagueClass = 'Elite';
        } elseif ($compositeScore >= 85) {
            $leagueClass = 'Gold';
        } elseif ($compositeScore >= 70) {
            $leagueClass = 'Silver';
        } else {
            $leagueClass = 'Bronze';
        }

        return $this->success([
            'driver_id' => $driver->id,
            'driver_name' => $driver->full_name,
            'avatar' => $avatar,
            'rating' => $rating,
            'completed_today' => $completedToday,
            'total_today' => $totalToday,
            'pending_orders_count' => $pendingOrdersCount,
            'pending_crates_sum' => (int)$pendingCratesSum,
            'vehicle' => $vehicleSpecs,
            'assigned_route' => $assignedRoute,
            'performance' => [
                'fulfillment_rate' => round($fulfillmentRate, 1),
                'fulfillment_trend' => $fulfillmentTrend,
                'fuel_economy' => round($fuelEconomy, 2),
                'fuel_efficiency' => round($fuelEfficiency, 1),
                'quality_rate' => round($qualityRate, 1),
                'damaged_crates_count' => (int)$damagedCratesCount,
                'photo_compliance_rate' => round($photoComplianceRate, 1),
                'composite_score' => round($compositeScore, 1),
                'league_class' => $leagueClass,
            ]
        ]);
    }

    public function index()
    {
        $drivers = Driver::with(['vehicle', 'deliveries', 'user'])->get();

        $data = $drivers->map(function ($driver) {
            $status = 'available';
            if ($driver->employment_status === 'inactive') {
                $status = 'offline';
            } else {
                $hasActiveDelivery = $driver->deliveries()
                    ->whereIn('status', ['assigned', 'in_transit'])
                    ->exists();
                if ($hasActiveDelivery) {
                    $status = 'busy';
                }
            }

            // Stable pseudo-random rating based on driver ID (between 4.5 and 5.0)
            $rating = 4.5 + (abs(crc32($driver->id)) % 51) / 100;

            // Location: Use the destination delivery zone of the latest delivery, or fallback
            $latestDelivery = $driver->deliveries()
                ->with(['order.customer.zone'])
                ->latest()
                ->first();
            
            $location = 'N/A';
            if ($latestDelivery && $latestDelivery->order && $latestDelivery->order->customer && $latestDelivery->order->customer->zone) {
                $location = $latestDelivery->order->customer->zone->name;
            } else {
                $locations = ['Kampala Central', 'Wandegeya', 'Bukoto', 'Ntinda', 'Kireka'];
                $location = $locations[abs(crc32($driver->id)) % count($locations)];
            }

            return [
                'id' => $driver->id,
                'name' => $driver->full_name,
                'phone' => $driver->phone,
                'email' => $driver->user ? $driver->user->email : '',
                'notes' => $driver->notes,
                'vehicle_id' => $driver->vehicle_id,
                'license' => $driver->license_number,
                'vehicle_registration' => $driver->vehicle ? $driver->vehicle->registration_number : 'N/A',
                'vehicle_make' => $driver->vehicle ? ($driver->vehicle->make . ' ' . $driver->vehicle->model) : 'N/A',
                'status' => $status,
                'rating' => $rating,
                'deliveries' => $driver->deliveries()->count(),
                'current_location' => $location,
                'employment_status' => $driver->employment_status,
                'date_joined' => $driver->date_joined,
                'avatar' => $driver->avatar_path ? (filter_var($driver->avatar_path, FILTER_VALIDATE_URL) ? $driver->avatar_path : url('storage/' . $driver->avatar_path)) : null,
                'license_photo' => $driver->license_path ? (filter_var($driver->license_path, FILTER_VALIDATE_URL) ? $driver->license_path : url('storage/' . $driver->license_path)) : null,
            ];
        });

        return $this->success($data);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string',
            'email' => 'nullable|email|unique:users,email',
            'phone' => 'required|string',
            'vehicle_id' => 'nullable|exists:vehicles,id',
            'license_number' => 'required|string',
            'employment_status' => 'nullable|in:active,inactive',
            'date_joined' => 'nullable|date',
            'notes' => 'nullable|string',
            'avatar' => 'required|image|max:2048',
            'license_photo' => 'required|image|max:2048',
        ]);

        $avatarPath = $request->file('avatar')->store('avatars', 'public');
        $licensePath = $request->file('license_photo')->store('licenses', 'public');

        return DB::transaction(function () use ($validated, $avatarPath, $licensePath) {
            $email = $validated['email'] ?? (str_replace(' ', '', strtolower($validated['full_name'])) . '@lokoharvest.com');
            
            // Ensure email uniqueness
            $originalEmail = $email;
            $counter = 1;
            while (\App\Models\User::where('email', $email)->exists()) {
                $parts = explode('@', $originalEmail);
                $email = $parts[0] . $counter . '@' . $parts[1];
                $counter++;
            }

            $user = \App\Models\User::create([
                'name' => $validated['full_name'],
                'email' => $email,
                'password' => Hash::make('password'),
                'role' => 'driver',
                'status' => 'active',
                'phone' => $validated['phone'],
            ]);

            $driver = Driver::create([
                'user_id' => $user->id,
                'full_name' => $validated['full_name'],
                'phone' => $validated['phone'],
                'vehicle_id' => $validated['vehicle_id'] ?? null,
                'license_number' => $validated['license_number'],
                'employment_status' => $validated['employment_status'] ?? 'active',
                'date_joined' => $validated['date_joined'] ?? now()->toDateString(),
                'notes' => $validated['notes'] ?? null,
                'avatar_path' => $avatarPath,
                'license_path' => $licensePath,
            ]);

            return $this->success($driver, 'Driver registered successfully', 201);
        });
    }

    public function update(Request $request, $id)
    {
        $driver = Driver::findOrFail($id);
        $user = $driver->user;

        $validated = $request->validate([
            'full_name' => 'required|string',
            'email' => 'nullable|email|unique:users,email,' . ($user ? $user->id : 'NULL'),
            'phone' => 'required|string',
            'vehicle_id' => 'nullable|exists:vehicles,id',
            'license_number' => 'required|string',
            'employment_status' => 'nullable|in:active,inactive',
            'date_joined' => 'nullable|date',
            'notes' => 'nullable|string',
            'avatar' => 'nullable|image|max:2048',
            'license_photo' => 'nullable|image|max:2048',
        ]);

        return DB::transaction(function () use ($driver, $user, $validated, $request) {
            $avatarPath = $driver->avatar_path;
            if ($request->hasFile('avatar')) {
                if ($driver->avatar_path && !filter_var($driver->avatar_path, FILTER_VALIDATE_URL)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver->avatar_path);
                }
                $avatarPath = $request->file('avatar')->store('avatars', 'public');
            }

            $licensePath = $driver->license_path;
            if ($request->hasFile('license_photo')) {
                if ($driver->license_path && !filter_var($driver->license_path, FILTER_VALIDATE_URL)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($driver->license_path);
                }
                $licensePath = $request->file('license_photo')->store('licenses', 'public');
            }

            if ($user) {
                $email = $validated['email'] ?? $user->email;
                $user->update([
                    'name' => $validated['full_name'],
                    'email' => $email,
                    'phone' => $validated['phone'],
                ]);
            }

            $driver->update([
                'full_name' => $validated['full_name'],
                'phone' => $validated['phone'],
                'vehicle_id' => $validated['vehicle_id'] ?? null,
                'license_number' => $validated['license_number'],
                'employment_status' => $validated['employment_status'] ?? 'active',
                'date_joined' => $validated['date_joined'] ?? now()->toDateString(),
                'notes' => $validated['notes'] ?? null,
                'avatar_path' => $avatarPath,
                'license_path' => $licensePath,
            ]);

            return $this->success($driver, 'Driver updated successfully');
        });
    }

    public function destroy($id)
    {
        $driver = Driver::findOrFail($id);
        $user = $driver->user;

        return DB::transaction(function () use ($driver, $user) {
            if ($driver->avatar_path && !filter_var($driver->avatar_path, FILTER_VALIDATE_URL)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($driver->avatar_path);
            }
            if ($driver->license_path && !filter_var($driver->license_path, FILTER_VALIDATE_URL)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($driver->license_path);
            }

            $driver->delete();
            if ($user) {
                $user->delete();
            }

            return $this->success(null, 'Driver deleted successfully');
        });
    }

    public function shifts($driverId)
    {
        $shifts = \App\Models\DriverShift::with(['vehicle'])
            ->where('driver_id', $driverId)
            ->latest('shift_date')
            ->latest('start_time')
            ->get();

        $data = $shifts->map(function ($shift) {
            return [
                'id' => $shift->id,
                'shift_date' => $shift->shift_date,
                'start_time' => $shift->start_time,
                'end_time' => $shift->end_time,
                'status' => $shift->status,
                'deliveries_count' => $shift->deliveries_count,
                'crates_delivered' => $shift->crates_delivered,
                'notes' => $shift->notes,
                'vehicle_registration' => $shift->vehicle ? $shift->vehicle->registration_number : 'N/A',
                'vehicle_make' => $shift->vehicle ? ($shift->vehicle->make . ' ' . $shift->vehicle->model) : 'N/A',
            ];
        });

        return $this->success($data);
    }

    public function activities($driverId)
    {
        $shifts = \App\Models\DriverShift::with(['vehicle'])
            ->where('driver_id', $driverId)
            ->get();

        $deliveries = \App\Models\Delivery::with(['order.customer', 'order.items.product', 'assignedBy'])
            ->where('driver_id', $driverId)
            ->get();

        $activities = collect();
        $today = now()->toDateString();

        foreach ($shifts as $shift) {
            $formattedDate = \Illuminate\Support\Carbon::parse($shift->shift_date)->format('Y-m-d');
            
            if ($shift->start_time) {
                $activities->push([
                    'id' => $shift->id . '-start',
                    'type' => 'shift_start',
                    'timestamp' => $shift->start_time,
                    'date' => $formattedDate,
                    'reference' => 'Shift #' . substr($shift->id, 0, 8),
                    'details' => "Clocked in with vehicle " . ($shift->vehicle ? $shift->vehicle->registration_number : 'N/A') . " (" . ($shift->vehicle ? ($shift->vehicle->make . ' ' . $shift->vehicle->model) : 'N/A') . ")",
                    'notes' => $shift->notes,
                    'status' => $shift->status === 'active' ? 'active' : 'completed',
                    'crates' => null,
                    'customer' => null,
                    'assigned_by' => 'Self',
                    'is_redo' => false,
                ]);
            }

            if ($shift->end_time) {
                $activities->push([
                    'id' => $shift->id . '-end',
                    'type' => 'shift_end',
                    'timestamp' => $shift->end_time,
                    'date' => $formattedDate,
                    'reference' => 'Shift #' . substr($shift->id, 0, 8),
                    'details' => "Clocked out. Completed " . $shift->deliveries_count . " deliveries (" . $shift->crates_delivered . " crates delivered)",
                    'notes' => $shift->notes,
                    'status' => 'completed',
                    'crates' => null,
                    'customer' => null,
                    'assigned_by' => 'Self',
                    'is_redo' => false,
                ]);
            }
        }

        foreach ($deliveries as $delivery) {
            $order = $delivery->order;
            $customerName = $order && $order->customer ? $order->customer->name : 'N/A';
            $orderNumber = $order ? $order->order_number : 'N/A';
            $crates = $order && $order->items ? (int)$order->items->sum('quantity') : 0;
            $requiredDate = $order ? $order->required_delivery_date : null;

            $isMissed = false;
            if ($delivery->status !== 'delivered') {
                if ($requiredDate && $requiredDate < $today) {
                    $isMissed = true;
                }
            } else {
                $deliveredDate = \Illuminate\Support\Carbon::parse($delivery->delivered_at)->toDateString();
                if ($requiredDate && $deliveredDate > $requiredDate) {
                    $isMissed = true;
                }
            }

            $isRedo = $isMissed;

            $timestamp = $delivery->delivered_at 
                ?? $delivery->dispatched_at 
                ?? $delivery->created_at;

            if ($delivery->status === 'delivered') {
                $type = $isRedo ? 'delivery_redone' : 'delivery_completed';
                $details = "Completed delivery to " . $customerName . " (" . $crates . " crates)." . ($isRedo ? " (Re-delivered missed order)" : "");
            } elseif ($delivery->status === 'in_transit') {
                $type = $isRedo ? 'delivery_redoing' : 'delivery_transit';
                $details = "In transit to " . $customerName . " (" . $crates . " crates)." . ($isRedo ? " (Re-doing missed order)" : "");
            } else {
                $type = $isRedo ? 'delivery_redoing' : 'delivery_assigned';
                $details = "Assigned for delivery to " . $customerName . " (" . $crates . " crates)." . ($isRedo ? " (Re-attempting missed order)" : "");
            }

            $notes = null;
            if ($delivery->delivery_notes) {
                $decoded = json_decode($delivery->delivery_notes, true);
                $notes = $decoded['notes'] ?? $delivery->delivery_notes;
            }

            $activities->push([
                'id' => $delivery->id,
                'type' => $type,
                'timestamp' => $timestamp,
                'date' => \Illuminate\Support\Carbon::parse($timestamp)->format('Y-m-d'),
                'reference' => $orderNumber,
                'details' => $details,
                'notes' => $notes,
                'status' => $isMissed ? 'missed' : $delivery->status,
                'crates' => $crates,
                'customer' => $customerName,
                'assigned_by' => $delivery->assignedBy ? $delivery->assignedBy->name : 'HQ Supervisor',
                'is_redo' => $isRedo,
            ]);
        }

        $sortedActivities = $activities->sortByDesc('timestamp')->values();

        return $this->success($sortedActivities);
    }
}
