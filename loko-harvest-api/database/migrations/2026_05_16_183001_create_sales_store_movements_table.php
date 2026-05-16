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
        Schema::create('sales_store_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('movement_date');
            $table->foreignUuid('product_id')->constrained('products');
            $table->enum('movement_type', ['transfer_in', 'dispatch_out', 'return_in', 'adjustment', 'wastage']);
            $table->decimal('quantity', 10, 2);
            $table->uuid('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_store_movements');
    }
};
