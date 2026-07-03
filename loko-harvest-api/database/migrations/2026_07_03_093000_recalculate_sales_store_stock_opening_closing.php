<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\SalesStoreStock;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $stocks = SalesStoreStock::all();
        foreach ($stocks as $stock) {
            $stock->opening_stock = $stock->conversions_in;
            $exits = $stock->conversions_out + $stock->sold_quantity + $stock->transferred_out;
            $stock->closing_stock = $stock->opening_stock + $stock->transferred_in - ($exits + $stock->replacements);
            $stock->current_quantity = $stock->closing_stock;
            $stock->save();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $stocks = SalesStoreStock::all();
        foreach ($stocks as $stock) {
            $stock->opening_stock = $stock->transferred_in + $stock->conversions_in;
            $exits = $stock->conversions_out + $stock->sold_quantity + $stock->transferred_out;
            $stock->closing_stock = $stock->opening_stock - ($exits + $stock->replacements);
            $stock->current_quantity = $stock->closing_stock;
            $stock->save();
        }
    }
};
