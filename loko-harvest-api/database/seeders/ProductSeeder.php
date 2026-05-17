<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            ['name' => 'White Eggs (Trays)', 'code' => 'EGG-WHT', 'category' => 'eggs', 'unit_of_measure' => 'trays', 'default_unit_price' => 12000],
            ['name' => 'Brown Eggs (Trays)', 'code' => 'EGG-BRN', 'category' => 'eggs', 'unit_of_measure' => 'trays', 'default_unit_price' => 13500],
            ['name' => 'Cream Eggs (Trays)', 'code' => 'EGG-CRM', 'category' => 'eggs', 'unit_of_measure' => 'trays', 'default_unit_price' => 13000],
            ['name' => 'Dressed Chicken (Unit)', 'code' => 'POU-DRS', 'category' => 'poultry', 'unit_of_measure' => 'units', 'default_unit_price' => 25000],
            ['name' => 'Live Chicken (Unit)', 'code' => 'POU-LVE', 'category' => 'poultry', 'unit_of_measure' => 'units', 'default_unit_price' => 22000],
            ['name' => 'Chicken Manure (Kg)', 'code' => 'BY-MNR', 'category' => 'by_products', 'unit_of_measure' => 'kg', 'default_unit_price' => 1500],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
}
