<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_pass_events', function (Blueprint $table) {
            $table->id();
            $table->uuid('delivery_pass_id');
            $table->enum('event_type', [
                'created',
                'shared',
                'claimed',
                'transit_started',
                'location_updated',
                'arrived',
                'delivered',
                'completed',
                'revoked',
                'expired'
            ]);
            $table->enum('performed_by_type', ['user', 'guest_driver', 'system'])->default('system');
            $table->string('performed_by_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('delivery_pass_id')->references('id')->on('delivery_passes')->onDelete('cascade');
            $table->index(['delivery_pass_id', 'event_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_pass_events');
    }
};
