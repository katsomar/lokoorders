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
                'image_path' => 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=500',
            ],
            [
                'registration_number' => 'UAB 123X',
                'make' => 'Toyota',
                'model' => 'Hiace Crate Van',
                'max_crates_capacity' => 200,
                'fuel_level' => 90,
                'status' => 'active',
                'image_path' => 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=500',
            ],
            [
                'registration_number' => 'UAE 445Z',
                'make' => 'Mitsubishi',
                'model' => 'Fuso Transporter',
                'max_crates_capacity' => 800,
                'fuel_level' => 60,
                'status' => 'active',
                'image_path' => 'https://images.unsplash.com/photo-1592838064821-7ec162894a90?auto=format&fit=crop&q=80&w=500',
            ],
            [
                'registration_number' => 'UBC 778A',
                'make' => 'Isuzu',
                'model' => 'Elf Crate Truck',
                'max_crates_capacity' => 400,
                'fuel_level' => 45,
                'status' => 'maintenance',
                'image_path' => 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=500',
            ],
        ];

        foreach ($vehicles as $vehicle) {
            Vehicle::create($vehicle);
        }
    }
}
