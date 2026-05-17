<?php

namespace Database\Seeders;

use App\Models\DeliveryZone;
use Illuminate\Database\Seeder;

class DeliveryZoneSeeder extends Seeder
{
    public function run(): void
    {
        $zones = [
            ['name' => 'Kampala Central', 'description' => 'City center and surrounding areas'],
            ['name' => 'Bukoto', 'description' => 'Bukoto, Kamwokya, and Naguru'],
            ['name' => 'Entebbe Road', 'description' => 'Areas along Entebbe highway'],
            ['name' => 'Kira / Namugongo', 'description' => 'Outer city residential areas'],
        ];

        foreach ($zones as $zone) {
            DeliveryZone::create($zone);
        }
    }
}
