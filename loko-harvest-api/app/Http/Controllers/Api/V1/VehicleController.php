<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Traits\ApiResponses;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    use ApiResponses;

    public function index()
    {
        $vehicles = Vehicle::with(['drivers'])->get();

        $data = $vehicles->map(function ($vehicle) {
            return [
                'id' => $vehicle->id,
                'registration_number' => $vehicle->registration_number,
                'make' => $vehicle->make,
                'model' => $vehicle->model,
                'max_crates_capacity' => $vehicle->max_crates_capacity,
                'fuel_level' => $vehicle->fuel_level,
                'status' => $vehicle->status,
                'assigned_drivers' => $vehicle->drivers->pluck('full_name')->toArray(),
            ];
        });

        return $this->success($data);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'registration_number' => 'required|string|unique:vehicles,registration_number',
            'make' => 'required|string',
            'model' => 'required|string',
            'max_crates_capacity' => 'required|integer|min:1',
            'fuel_level' => 'nullable|integer|between:0,100',
            'status' => 'nullable|in:active,maintenance,inactive',
        ]);

        $vehicle = Vehicle::create([
            'registration_number' => $validated['registration_number'],
            'make' => $validated['make'],
            'model' => $validated['model'],
            'max_crates_capacity' => $validated['max_crates_capacity'],
            'fuel_level' => $validated['fuel_level'] ?? 100,
            'status' => $validated['status'] ?? 'active',
        ]);

        return $this->success($vehicle, 'Vehicle registered successfully', 201);
    }

    public function updateLogistics(Request $request, $id)
    {
        $vehicle = Vehicle::findOrFail($id);

        $validated = $request->validate([
            'status' => 'required|in:active,maintenance,inactive',
            'fuel_level' => 'required|integer|between:0,100',
            'driver_ids' => 'present|array',
            'driver_ids.*' => 'exists:drivers,id',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($vehicle, $validated) {
            $vehicle->update([
                'status' => $validated['status'],
                'fuel_level' => $validated['fuel_level'],
            ]);

            // Disassociate drivers who were previously assigned to this vehicle but not in new list
            \App\Models\Driver::where('vehicle_id', $vehicle->id)
                ->whereNotIn('id', $validated['driver_ids'])
                ->update(['vehicle_id' => null]);

            // Associate the selected drivers
            if (!empty($validated['driver_ids'])) {
                \App\Models\Driver::whereIn('id', $validated['driver_ids'])
                    ->update(['vehicle_id' => $vehicle->id]);
            }

            return $this->success($vehicle, 'Vehicle logistics updated successfully');
        });
    }
}
