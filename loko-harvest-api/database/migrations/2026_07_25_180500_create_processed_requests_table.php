<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('processed_requests', function (Blueprint $table) {
            $table->uuid('id')->primary(); // request_id UUID
            $table->string('user_id')->nullable();
            $table->string('action_type');
            $table->json('response_payload')->nullable();
            $table->integer('status_code')->default(200);
            $table->timestamps();

            $table->index(['user_id', 'action_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('processed_requests');
    }
};
