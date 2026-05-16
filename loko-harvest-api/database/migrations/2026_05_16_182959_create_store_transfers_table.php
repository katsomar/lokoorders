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
        Schema::create('store_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('transfer_date');
            $table->foreignUuid('product_id')->constrained('products');
            $table->decimal('quantity', 10, 2);
            $table->foreignUuid('transferred_by')->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_transfers');
    }
};
