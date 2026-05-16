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
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users');
            $table->enum('type', ['new_order', 'ready_for_dispatch', 'driver_assigned', 'delivery_confirmed', 'payment_received', 'return_raised', 'low_stock', 'invoice_overdue']);
            $table->string('title');
            $table->text('body');
            $table->boolean('is_read')->default(false);
            $table->string('reference_type')->nullable();
            $table->uuid('reference_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
