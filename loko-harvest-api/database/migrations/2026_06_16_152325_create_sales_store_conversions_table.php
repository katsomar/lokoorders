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
        // 1. Seed packaged products in units/trays to comply with existing enum constraints
        $packagedProducts = [
            // Cream Packaged
            [
                'id' => (string) Str::uuid(),
                'name' => 'Cream Eggs - Single Pack',
                'code' => 'EGG-CRM-SGL',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 15000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Cream Eggs - 15-Pack',
                'code' => 'EGG-CRM-15P',
                'category' => 'eggs',
                'unit_of_measure' => 'units',
                'default_unit_price' => 8500.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Cream Eggs - 6-Pack',
                'code' => 'EGG-CRM-06P',
                'category' => 'eggs',
                'unit_of_measure' => 'units',
                'default_unit_price' => 3800.00,
                'created_at' => now(),
                'updated_at' => now()
            ],

            // White Packaged
            [
                'id' => (string) Str::uuid(),
                'name' => 'White Eggs - Single Pack',
                'code' => 'EGG-WHT-SGL',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 15000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'White Eggs - 15-Pack',
                'code' => 'EGG-WHT-15P',
                'category' => 'eggs',
                'unit_of_measure' => 'units',
                'default_unit_price' => 8500.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'White Eggs - 6-Pack',
                'code' => 'EGG-WHT-06P',
                'category' => 'eggs',
                'unit_of_measure' => 'units',
                'default_unit_price' => 3800.00,
                'created_at' => now(),
                'updated_at' => now()
            ],

            // Brown Packaged
            [
                'id' => (string) Str::uuid(),
                'name' => 'Brown Eggs - Single Pack',
                'code' => 'EGG-BRN-SGL',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 15000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Brown Eggs - 15-Pack',
                'code' => 'EGG-BRN-15P',
                'category' => 'eggs',
                'unit_of_measure' => 'units',
                'default_unit_price' => 8500.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Brown Eggs - 6-Pack',
                'code' => 'EGG-BRN-06P',
                'category' => 'eggs',
                'unit_of_measure' => 'units',
                'default_unit_price' => 3800.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Brown Eggs - Plain Trays',
                'code' => 'EGG-BRN-TRYS',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 14000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],

            // Damaged Packaged
            [
                'id' => (string) Str::uuid(),
                'name' => 'Loose Damaged Eggs',
                'code' => 'EGG-DMG-LOOSE',
                'category' => 'eggs',
                'unit_of_measure' => 'units',
                'default_unit_price' => 300.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Damaged Egg Trays',
                'code' => 'EGG-DMG-TRYS',
                'category' => 'eggs',
                'unit_of_measure' => 'trays',
                'default_unit_price' => 7000.00,
                'created_at' => now(),
                'updated_at' => now()
            ],
        ];

        foreach ($packagedProducts as $pp) {
            if (!DB::table('products')->where('code', $pp['code'])->exists()) {
                DB::table('products')->insert($pp);
            }
        }

        // 2. Create sales_store_conversions table
        Schema::create('sales_store_conversions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('conversion_date');
            $table->foreignUuid('sales_store_id')->constrained('sales_stores')->onDelete('cascade');
            $table->foreignUuid('from_product_id')->constrained('products');
            $table->foreignUuid('to_product_id')->constrained('products');
            $table->decimal('from_quantity', 10, 2);
            $table->decimal('to_quantity', 10, 2);
            $table->foreignUuid('converted_by')->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_store_conversions');

        DB::table('products')->whereIn('code', [
            'EGG-CRM-SGL', 'EGG-CRM-15P', 'EGG-CRM-06P',
            'EGG-WHT-SGL', 'EGG-WHT-15P', 'EGG-WHT-06P',
            'EGG-BRN-SGL', 'EGG-BRN-15P', 'EGG-BRN-06P', 'EGG-BRN-TRYS',
            'EGG-DMG-LOOSE', 'EGG-DMG-TRYS'
        ])->delete();
    }
};
