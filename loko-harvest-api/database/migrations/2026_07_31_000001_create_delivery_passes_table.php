<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_passes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('pass_number', 50)->unique();
            $table->string('secure_token', 64)->unique();
            $table->enum('status', [
                'generated',
                'shared',
                'claimed',
                'in_transit',
                'arrived',
                'delivered',
                'completed',
                'revoked',
                'expired'
            ])->default('generated');
            $table->string('driver_name')->nullable();
            $table->string('driver_phone', 30)->nullable();
            $table->string('vehicle_info', 100)->nullable();
            $table->timestamp('claimed_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->uuid('revoked_by')->nullable();
            $table->string('revocation_reason')->nullable();
            $table->uuid('created_by');
            $table->timestamps();

            $table->index('pass_number');
            $table->index('secure_token');
            $table->index('status');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_passes');
    }
};
