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

        // 5. Rating
        $rating = 4.5 + (abs(crc32($driver->id)) % 51) / 100;

        // 6. Vehicle specs
        $vehicle = $driver->vehicle;
        $latestDelivery = $pendingDeliveries->first();
        $supervisorName = $latestDelivery && $latestDelivery->assignedBy ? $latestDelivery->assignedBy->name : 'HQ Supervisor';
        
        $vehicleSpecs = [
            'plate' => $vehicle ? $vehicle->registration_number : 'N/A',
            'make_model' => $vehicle ? ($vehicle->make . ' ' . $vehicle->model) : 'N/A',
            'max_capacity' => $vehicle ? $vehicle->max_crates_capacity : 300,
            'fuel_level' => $vehicle ? $vehicle->fuel_level : 0,
            'supervisor_name' => $supervisorName,
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
            ];
        });

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
}
