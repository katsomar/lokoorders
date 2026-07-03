<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            ProductSeeder::class,
            VehicleSeeder::class,
            CustomerSeeder::class,
            DeliveryZoneSeeder::class,
        ]);
 
        // Clean up default stores inserted by migrations to leave the database completely clean
        DB::table('production_stores')->delete();
        DB::table('sales_stores')->delete();
    }
}
