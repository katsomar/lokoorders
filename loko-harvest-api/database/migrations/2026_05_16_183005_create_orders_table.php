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
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('order_number')->unique();
            $table->foreignUuid('customer_id')->constrained('customers');
            $table->date('order_date');
            $table->date('required_delivery_date');
            $table->enum('urgency', ['normal', 'urgent', 'critical']);
            $table->enum('status', ['pending', 'processing', 'ready_for_dispatch', 'dispatched', 'delivered'])->default('pending');
            $table->text('order_notes')->nullable();
            $table->decimal('total_amount', 15, 2);
            $table->text('admin_override_reason')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
