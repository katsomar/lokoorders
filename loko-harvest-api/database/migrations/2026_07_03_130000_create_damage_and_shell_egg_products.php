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
        $newProducts = [
            // White Egg products
            [
                'id' => (string) Str::uuid(),
                'name' => 'White Eggs - Damage 1st Class',
                'code' => 'EGG-WHT-D1',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 5000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'White Eggs - Damage 2nd Class',
                'code' => 'EGG-WHT-D2',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 3000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'White Eggs - Damage 3rd Class',
                'code' => 'EGG-WHT-D3',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 0.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'White Eggs - Shell Eggs',
                'code' => 'EGG-WHT-SHL',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 2000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],

            // Cream Egg products
            [
                'id' => (string) Str::uuid(),
                'name' => 'Cream Eggs - Damage 1st Class',
                'code' => 'EGG-CRM-D1',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 5000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Cream Eggs - Damage 2nd Class',
                'code' => 'EGG-CRM-D2',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 3000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Cream Eggs - Damage 3rd Class',
                'code' => 'EGG-CRM-D3',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 0.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Cream Eggs - Shell Eggs',
                'code' => 'EGG-CRM-SHL',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 2000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],

            // Brown Egg products
            [
                'id' => (string) Str::uuid(),
                'name' => 'Brown Eggs - Damage 1st Class',
                'code' => 'EGG-BRN-D1',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 5000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Brown Eggs - Damage 2nd Class',
                'code' => 'EGG-BRN-D2',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 3000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Brown Eggs - Damage 3rd Class',
                'code' => 'EGG-BRN-D3',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 0.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Brown Eggs - Shell Eggs',
                'code' => 'EGG-BRN-SHL',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 2000.00,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($newProducts as $product) {
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
            'EGG-WHT-D1', 'EGG-WHT-D2', 'EGG-WHT-D3', 'EGG-WHT-SHL',
            'EGG-CRM-D1', 'EGG-CRM-D2', 'EGG-CRM-D3', 'EGG-CRM-SHL',
            'EGG-BRN-D1', 'EGG-BRN-D2', 'EGG-BRN-D3', 'EGG-BRN-SHL'
        ])->delete();
    }
};
