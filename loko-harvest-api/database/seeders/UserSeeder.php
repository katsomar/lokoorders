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
                'name' => 'Loko Manager',
                'email' => 'manager@lokoharvest.com',
                'password' => Hash::make('password'),
                'role' => 'order_manager',
                'status' => 'active',
                'phone' => '0700000001',
            ],
        ];

        foreach ($users as $userData) {
            User::create($userData);
        }
    }
}
