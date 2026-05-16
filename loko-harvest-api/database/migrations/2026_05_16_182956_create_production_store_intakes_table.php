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
        Schema::create('production_store_intakes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('intake_date');
            $table->foreignUuid('product_id')->constrained('products');
            $table->decimal('quantity', 10, 2);
            $table->string('unit_of_measure');
            $table->string('batch_reference')->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('received_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('production_store_intakes');
    }
};
