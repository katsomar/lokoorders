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
                'initial_fuel' => $vehicle->initial_fuel,
                'consumption_per_km' => $vehicle->consumption_per_km,
                'added_fuel_per_shift' => $vehicle->added_fuel_per_shift,
                'fuel_tank_capacity' => $vehicle->fuel_tank_capacity,
                'status' => $vehicle->status,
                'assigned_drivers' => $vehicle->drivers->pluck('full_name')->toArray(),
                'image' => $vehicle->image_path ? (filter_var($vehicle->image_path, FILTER_VALIDATE_URL) ? $vehicle->image_path : url('storage/' . $vehicle->image_path)) : null,
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
            'initial_fuel' => 'nullable|integer|between:0,100',
            'status' => 'nullable|in:active,maintenance,inactive',
            'vehicle_photo' => 'required|image|max:2048',
        ]);

        $vehiclePhotoPath = $request->file('vehicle_photo')->store('vehicles', 'public');

        $vehicle = Vehicle::create([
            'registration_number' => $validated['registration_number'],
            'make' => $validated['make'],
            'model' => $validated['model'],
            'max_crates_capacity' => $validated['max_crates_capacity'],
            'fuel_level' => $validated['fuel_level'] ?? 100,
            'initial_fuel' => $validated['initial_fuel'] ?? $validated['fuel_level'] ?? 100,
            'status' => $validated['status'] ?? 'active',
            'image_path' => $vehiclePhotoPath,
        ]);

        return $this->success($vehicle, 'Vehicle registered successfully', 201);
    }

    public function updateLogistics(Request $request, $id)
    {
        $vehicle = Vehicle::findOrFail($id);

        $validated = $request->validate([
            'registration_number' => 'nullable|string|unique:vehicles,registration_number,' . $vehicle->id,
            'make' => 'nullable|string',
            'model' => 'nullable|string',
            'max_crates_capacity' => 'nullable|integer|min:1',
            'status' => 'nullable|in:active,maintenance,inactive',
            'fuel_level' => 'nullable|integer|between:0,100',
            'initial_fuel' => 'nullable|integer|between:0,100',
            'consumption_per_km' => 'nullable|numeric|min:0',
            'added_fuel_per_shift' => 'nullable|numeric|min:0',
            'fuel_tank_capacity' => 'nullable|numeric|min:0',
            'vehicle_photo' => 'nullable|image|max:2048',
            'driver_ids' => 'nullable|array',
            'driver_ids.*' => 'exists:drivers,id',
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($vehicle, $validated, $request) {
            $imagePath = $vehicle->image_path;
            if ($request->hasFile('vehicle_photo')) {
                if ($vehicle->image_path && !filter_var($vehicle->image_path, FILTER_VALIDATE_URL)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($vehicle->image_path);
                }
                $imagePath = $request->file('vehicle_photo')->store('vehicles', 'public');
            }

            $vehicle->update([
                'registration_number' => $validated['registration_number'] ?? $vehicle->registration_number,
                'make' => $validated['make'] ?? $vehicle->make,
                'model' => $validated['model'] ?? $vehicle->model,
                'max_crates_capacity' => $validated['max_crates_capacity'] ?? $vehicle->max_crates_capacity,
                'status' => $validated['status'] ?? $vehicle->status,
                'fuel_level' => $validated['fuel_level'] ?? $vehicle->fuel_level,
                'initial_fuel' => $validated['initial_fuel'] ?? $vehicle->initial_fuel,
                'consumption_per_km' => array_key_exists('consumption_per_km', $validated) ? $validated['consumption_per_km'] : $vehicle->consumption_per_km,
                'added_fuel_per_shift' => array_key_exists('added_fuel_per_shift', $validated) ? $validated['added_fuel_per_shift'] : $vehicle->added_fuel_per_shift,
                'fuel_tank_capacity' => array_key_exists('fuel_tank_capacity', $validated) ? $validated['fuel_tank_capacity'] : $vehicle->fuel_tank_capacity,
                'image_path' => $imagePath,
            ]);

            $driverIds = $validated['driver_ids'] ?? null;

            if ($driverIds !== null) {
                // Disassociate drivers who were previously assigned to this vehicle but not in new list
                \App\Models\Driver::where('vehicle_id', $vehicle->id)
                    ->whereNotIn('id', $driverIds)
                    ->update(['vehicle_id' => null]);

                // Associate the selected drivers
                if (!empty($driverIds)) {
                    \App\Models\Driver::whereIn('id', $driverIds)
                        ->update(['vehicle_id' => $vehicle->id]);
                }
            }

            return $this->success($vehicle, 'Vehicle logistics updated successfully');
        });
    }

    public function destroy($id)
    {
        $vehicle = Vehicle::findOrFail($id);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($vehicle) {
            if ($vehicle->image_path && !filter_var($vehicle->image_path, FILTER_VALIDATE_URL)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($vehicle->image_path);
            }

            // Disassociate drivers
            \App\Models\Driver::where('vehicle_id', $vehicle->id)->update(['vehicle_id' => null]);

            $vehicle->delete();

            return $this->success(null, 'Vehicle deleted successfully');
        });
    }
}
