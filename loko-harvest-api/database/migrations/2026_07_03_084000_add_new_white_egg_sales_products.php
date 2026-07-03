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
            [
                'id' => (string) Str::uuid(),
                'name' => 'White Eggs - Plain Trays',
                'code' => 'EGG-WHT-TRYS',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 12000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'White Eggs - Family Pack',
                'code' => 'EGG-WHT-FAM',
                'category' => 'eggs',
                'unit_of_measure' => 'units',
                'default_unit_price' => 60000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'White Eggs - Double Pack',
                'code' => 'EGG-WHT-DBL',
                'category' => 'eggs',
                'unit_of_measure' => 'units',
                'default_unit_price' => 24000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'White Eggs - Triple Pack',
                'code' => 'EGG-WHT-TPL',
                'category' => 'eggs',
                'unit_of_measure' => 'units',
                'default_unit_price' => 36000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
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
            'EGG-WHT-TRYS', 'EGG-WHT-FAM', 'EGG-WHT-DBL', 'EGG-WHT-TPL'
        ])->delete();
    }
};
