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
        Schema::create('daily_store_snapshots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('snapshot_date');
            $table->enum('store_type', ['production', 'sales']);
            $table->foreignUuid('product_id')->constrained('products');
            $table->decimal('opening_quantity', 10, 2)->default(0);
            $table->decimal('received_quantity', 10, 2)->default(0);
            $table->decimal('transferred_out_quantity', 10, 2)->default(0);
            $table->decimal('transferred_in_quantity', 10, 2)->default(0);
            $table->decimal('dispatched_quantity', 10, 2)->default(0);
            $table->decimal('returns_in_quantity', 10, 2)->default(0);
            $table->decimal('wastage_quantity', 10, 2)->default(0);
            $table->decimal('closing_quantity', 10, 2)->default(0);
            $table->foreignUuid('generated_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_store_snapshots');
    }
};
