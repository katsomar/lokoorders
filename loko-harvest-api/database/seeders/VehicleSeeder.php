<?php

namespace Database\Seeders;

use App\Models\Vehicle;
use Illuminate\Database\Seeder;

class VehicleSeeder extends Seeder
{
    public function run(): void
    {
        $vehicles = [
            [
                'registration_number' => 'UBL 482Y',
                'make' => 'Isuzu',
                'model' => 'Cargo Crate Truck',
                'max_crates_capacity' => 500,
                'fuel_level' => 85,
                'status' => 'active',
            ],
            [
                'registration_number' => 'UAB 123X',
                'make' => 'Toyota',
                'model' => 'Hiace Crate Van',
                'max_crates_capacity' => 200,
                'fuel_level' => 90,
                'status' => 'active',
            ],
            [
                'registration_number' => 'UAE 445Z',
                'make' => 'Mitsubishi',
                'model' => 'Fuso Transporter',
                'max_crates_capacity' => 800,
                'fuel_level' => 60,
                'status' => 'active',
            ],
            [
                'registration_number' => 'UBC 778A',
                'make' => 'Isuzu',
                'model' => 'Elf Crate Truck',
                'max_crates_capacity' => 400,
                'fuel_level' => 45,
                'status' => 'maintenance',
            ],
        ];

        foreach ($vehicles as $vehicle) {
            Vehicle::create($vehicle);
        }
    }
}
