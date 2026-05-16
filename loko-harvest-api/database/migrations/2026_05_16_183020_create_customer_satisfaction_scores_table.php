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
        Schema::create('customer_satisfaction_scores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('customer_id')->constrained('customers');
            $table->date('score_date');
            $table->decimal('on_time_delivery_rate', 5, 2);
            $table->decimal('return_rate', 5, 2);
            $table->decimal('order_completion_rate', 5, 2);
            $table->decimal('payment_reliability_score', 5, 2);
            $table->enum('order_frequency_trend', ['increasing', 'stable', 'declining']);
            $table->decimal('overall_score', 5, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_satisfaction_scores');
    }
};
