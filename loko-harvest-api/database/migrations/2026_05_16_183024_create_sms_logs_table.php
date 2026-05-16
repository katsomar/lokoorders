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
        Schema::create('sms_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('recipient_phone');
            $table->string('recipient_name');
            $table->string('event_type');
            $table->text('message_body');
            $table->text('gateway_response')->nullable();
            $table->enum('status', ['sent', 'failed', 'pending'])->default('pending');
            $table->foreignUuid('order_id')->nullable()->constrained('orders');
            $table->foreignUuid('customer_id')->nullable()->constrained('customers');
            $table->foreignUuid('driver_id')->nullable()->constrained('drivers');
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
    }
};
