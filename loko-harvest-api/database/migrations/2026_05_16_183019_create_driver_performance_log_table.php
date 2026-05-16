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
        Schema::create('driver_performance_log', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('driver_id')->constrained('drivers');
            $table->foreignUuid('delivery_id')->constrained('deliveries');
            $table->foreignUuid('order_id')->constrained('orders');
            $table->timestamp('delivered_at');
            $table->date('required_delivery_date');
            $table->boolean('is_on_time');
            $table->boolean('has_photo_proof');
            $table->integer('base_points');
            $table->integer('bonus_points');
            $table->integer('total_points');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('driver_performance_log');
    }
};
