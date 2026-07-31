<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_pass_orders', function (Blueprint $table) {
            $table->id();
            $table->uuid('delivery_pass_id');
            $table->uuid('order_id');
            $table->unsignedInteger('sequence')->default(1);
            $table->enum('status', ['assigned', 'in_transit', 'delivered', 'failed'])->default('assigned');
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->foreign('delivery_pass_id')->references('id')->on('delivery_passes')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->unique(['delivery_pass_id', 'order_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_pass_orders');
    }
};
