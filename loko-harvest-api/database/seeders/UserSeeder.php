<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Loko Admin',
                'email' => 'admin@lokoharvest.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'active',
                'phone' => '0700000000',
            ],
            [
                'name' => 'Sarah Sales',
                'email' => 'sales@lokoharvest.com',
                'password' => Hash::make('password'),
                'role' => 'sales_accounts',
                'status' => 'active',
                'phone' => '0700000001',
            ],
            [
                'name' => 'Musa Driver',
                'email' => 'driver@lokoharvest.com',
                'password' => Hash::make('password'),
                'role' => 'driver',
                'status' => 'active',
                'phone' => '0700000002',
            ],
        ];

        foreach ($users as $userData) {
            $user = User::create($userData);
            
            if ($user->role === 'driver') {
                $vehicle = \App\Models\Vehicle::first();
                \App\Models\Driver::create([
                    'user_id' => $user->id,
                    'full_name' => $user->name,
                    'phone' => $user->phone,
                    'vehicle_id' => $vehicle ? $vehicle->id : null,
                    'license_number' => 'UG-' . rand(1000, 9999),
                    'employment_status' => 'active',
                    'date_joined' => now()->toDateString(),
                ]);
            }
        }
    }
}
