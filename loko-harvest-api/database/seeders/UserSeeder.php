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
                'phone' => '0700 000 002',
                'driver_details' => [
                    'license_number' => 'UG-1048',
                    'vehicle_reg' => 'UBL 482Y',
                    'employment_status' => 'active',
                    'date_joined' => '2025-01-15',
                    'avatar_path' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
                    'license_path' => 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=500',
                ]
            ],
            [
                'name' => 'Sarah Namubiru',
                'email' => 'sarah@lokoharvest.com',
                'password' => Hash::make('password'),
                'role' => 'driver',
                'status' => 'active',
                'phone' => '0755 333 444',
                'driver_details' => [
                    'license_number' => 'UG-8821',
                    'vehicle_reg' => 'UBL 482Y',
                    'employment_status' => 'active',
                    'date_joined' => '2025-03-20',
                    'avatar_path' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300',
                    'license_path' => 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=500',
                ]
            ],
            [
                'name' => 'John Okello',
                'email' => 'john@lokoharvest.com',
                'password' => Hash::make('password'),
                'role' => 'driver',
                'status' => 'active',
                'phone' => '0772 111 222',
                'driver_details' => [
                    'license_number' => 'UG-5562',
                    'vehicle_reg' => 'UAB 123X',
                    'employment_status' => 'active',
                    'date_joined' => '2025-02-10',
                    'avatar_path' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300',
                    'license_path' => 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=500',
                ]
            ],
            [
                'name' => 'Peter Pan',
                'email' => 'peter@lokoharvest.com',
                'password' => Hash::make('password'),
                'role' => 'driver',
                'status' => 'active',
                'phone' => '0788 666 555',
                'driver_details' => [
                    'license_number' => 'UG-2231',
                    'vehicle_reg' => 'UBC 778A',
                    'employment_status' => 'inactive',
                    'date_joined' => '2025-05-01',
                    'avatar_path' => 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300',
                    'license_path' => 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=500',
                ]
            ],
        ];

        foreach ($users as $userData) {
            $driverDetails = isset($userData['driver_details']) ? $userData['driver_details'] : null;
            unset($userData['driver_details']);

            $user = User::create($userData);
            
            if ($user->role === 'driver' && $driverDetails) {
                $vehicle = \App\Models\Vehicle::where('registration_number', $driverDetails['vehicle_reg'])->first();
                \App\Models\Driver::create([
                    'user_id' => $user->id,
                    'full_name' => $user->name,
                    'phone' => $user->phone,
                    'vehicle_id' => $vehicle ? $vehicle->id : null,
                    'license_number' => $driverDetails['license_number'],
                    'employment_status' => $driverDetails['employment_status'],
                    'date_joined' => $driverDetails['date_joined'],
                    'avatar_path' => $driverDetails['avatar_path'],
                    'license_path' => $driverDetails['license_path'],
                ]);
            }
        }
    }
}
