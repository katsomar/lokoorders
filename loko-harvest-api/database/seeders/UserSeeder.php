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
                'name' => 'HQ Admin User',
                'email' => 'admin@loko.com',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'status' => 'active',
                'phone' => '+256700000001',
            ],
            [
                'name' => 'Order Manager User',
                'email' => 'ordermanager@loko.com',
                'password' => Hash::make('password123'),
                'role' => 'order_manager',
                'status' => 'active',
                'phone' => '+256700000002',
            ],
            [
                'name' => 'Driver User',
                'email' => 'driver@loko.com',
                'password' => Hash::make('password123'),
                'role' => 'driver',
                'status' => 'active',
                'phone' => '+256700000003',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }
}
