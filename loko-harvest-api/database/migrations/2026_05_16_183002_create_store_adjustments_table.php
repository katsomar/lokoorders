<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('store_adjustments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->enum('store_type', ['production', 'sales']);
            $table->foreignUuid('product_id')->constrained('products');
            $table->date('adjustment_date');
            $table->decimal('quantity_change', 10, 2);
            $table->text('reason');
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_adjustments');
    }
};
