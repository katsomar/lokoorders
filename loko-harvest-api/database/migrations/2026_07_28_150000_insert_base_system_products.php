<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (app()->environment('testing')) {
            return;
        }

        $baseProducts = [
            [
                'id' => (string) Str::uuid(),
                'name' => 'White Eggs (Trays)',
                'code' => 'EGG-WHT',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 12000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Brown Eggs (Trays)',
                'code' => 'EGG-BRN',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 13500.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Cream Eggs (Trays)',
                'code' => 'EGG-CRM',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 13000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Dressed Chicken (Unit)',
                'code' => 'POU-DRS',
                'category' => 'poultry',
                'unit_of_measure' => 'units',
                'default_unit_price' => 25000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Live Chicken (Unit)',
                'code' => 'POU-LVE',
                'category' => 'poultry',
                'unit_of_measure' => 'units',
                'default_unit_price' => 22000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Chicken Manure (Kg)',
                'code' => 'BY-MNR',
                'category' => 'by_products',
                'unit_of_measure' => 'kg',
                'default_unit_price' => 1500.00,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($baseProducts as $product) {
            if (!DB::table('products')->where('code', $product['code'])->exists()) {
                DB::table('products')->insert($product);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('products')->whereIn('code', [
            'EGG-WHT', 'EGG-BRN', 'EGG-CRM', 'POU-DRS', 'POU-LVE', 'BY-MNR'
        ])->delete();
    }
};
