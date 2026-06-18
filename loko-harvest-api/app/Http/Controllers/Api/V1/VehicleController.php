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
}
