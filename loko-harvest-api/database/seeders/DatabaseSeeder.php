<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DeliveryZoneSeeder::class,
            ProductSeeder::class,
            VehicleSeeder::class,
            UserSeeder::class,
        ]);
    }
}
