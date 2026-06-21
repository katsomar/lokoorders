<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleLog;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class VehicleLogController extends Controller
{
    use ApiResponses;

    public function index()
    {
        $logs = VehicleLog::with(['vehicle', 'driver'])
            ->latest('logged_at')
            ->latest('created_at')
            ->get();

        $data = $logs->map(function ($log) {
            return [
                'id' => $log->id,
                'vehicle_id' => $log->vehicle_id,
                'vehicle_registration' => $log->vehicle ? $log->vehicle->registration_number : 'N/A',
                'driver_id' => $log->driver_id,
                'driver_name' => $log->driver ? $log->driver->full_name : 'N/A',
                'log_type' => $log->log_type,
                'destination' => $log->destination,
                'duration_minutes' => $log->duration_minutes,
                'initial_fuel' => (float)$log->initial_fuel,
                'added_fuel' => (float)$log->added_fuel,
                'fuel_price_per_liter' => (float)$log->fuel_price_per_liter,
                'total_spent' => (float)$log->total_spent,
                'evidence_url' => $log->evidence_path ? (filter_var($log->evidence_path, FILTER_VALIDATE_URL) ? $log->evidence_path : url('storage/' . $log->evidence_path)) : null,
                'notes' => $log->notes,
                'logged_at' => $log->logged_at,
            ];
        });

        return $this->success($data);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'driver_id' => 'nullable|exists:drivers,id',
            'log_type' => 'required|in:movement,refuel',
            'destination' => 'nullable|string',
            'duration_minutes' => 'nullable|integer|min:0',
            'initial_fuel' => 'nullable|numeric|between:0,100',
            'added_fuel' => 'nullable|numeric|min:0',
            'fuel_price_per_liter' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'logged_at' => 'nullable|date',
            'evidence_file' => 'required_if:log_type,refuel|file|mimes:jpeg,png,jpg,pdf|max:2048',
        ]);

        $vehicle = Vehicle::findOrFail($validated['vehicle_id']);
        
        $initialFuel = $validated['initial_fuel'] ?? $vehicle->fuel_level;
        $addedFuel = $validated['added_fuel'] ?? 0.0;
        $price = $validated['fuel_price_per_liter'] ?? 0.0;
        $totalSpent = $addedFuel * $price;

        $evidencePath = null;
        if ($request->hasFile('evidence_file')) {
            $evidencePath = $request->file('evidence_file')->store('vehicle_logs/evidence', 'public');
        }

        $log = VehicleLog::create([
            'vehicle_id' => $validated['vehicle_id'],
            'driver_id' => $validated['driver_id'] ?? null,
            'log_type' => $validated['log_type'],
            'destination' => $validated['destination'] ?? null,
            'duration_minutes' => $validated['duration_minutes'] ?? null,
            'initial_fuel' => $initialFuel,
            'added_fuel' => $addedFuel,
            'fuel_price_per_liter' => $price,
            'total_spent' => $totalSpent,
            'evidence_path' => $evidencePath,
            'notes' => $validated['notes'] ?? null,
            'logged_at' => $validated['logged_at'] ?? now(),
        ]);

        // If it is a refuel log, update the vehicle's fuel level and refuel record
        if ($validated['log_type'] === 'refuel' && $addedFuel > 0) {
            $tankCapacity = (float)($vehicle->fuel_tank_capacity ?: 80.0);
            $currentLiters = ($vehicle->fuel_level / 100.5) * $tankCapacity; // safe percentage mapping
            $currentLiters = ($vehicle->fuel_level / 100.0) * $tankCapacity;
            $newLiters = min($tankCapacity, $currentLiters + $addedFuel);
            $newFuelLevelPercent = min(100, (int)round(($newLiters / $tankCapacity) * 100));

            $vehicle->update([
                'fuel_level' => $newFuelLevelPercent,
                'added_fuel_per_shift' => $addedFuel,
            ]);
        }

        return $this->success($log, 'Vehicle log saved successfully', 201);
    }
}
