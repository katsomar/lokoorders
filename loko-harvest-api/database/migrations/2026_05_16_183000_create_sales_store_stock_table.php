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
        Schema::create('sales_store_stock', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('product_id')->unique()->constrained('products');
            $table->decimal('current_quantity', 10, 2)->default(0);
            $table->timestamp('last_updated')->useCurrent();
            $table->foreignUuid('updated_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_store_stock');
    }
};
