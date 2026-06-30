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
        Schema::create('order_replacement_allocations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignUuid('sales_store_id')->constrained('sales_stores')->cascadeOnDelete();
            $table->string('batch_reference')->nullable();
            $table->decimal('allocated_quantity', 10, 2);
            $table->decimal('delivered_quantity', 10, 2)->default(0.00);
            $table->decimal('returned_quantity', 10, 2)->default(0.00);
            $table->enum('status', ['allocated', 'delivered', 'returned', 'partially_returned'])->default('allocated');
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_replacement_allocations');
    }
};
