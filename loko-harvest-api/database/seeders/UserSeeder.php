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
                ]);
            }
        }
    }
}
