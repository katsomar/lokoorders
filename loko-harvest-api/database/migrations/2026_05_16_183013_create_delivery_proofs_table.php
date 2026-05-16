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
        Schema::create('delivery_proofs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('delivery_id')->unique()->constrained('deliveries');
            $table->string('photo_url');
            $table->decimal('gps_latitude', 10, 6)->nullable();
            $table->decimal('gps_longitude', 10, 6)->nullable();
            $table->timestamp('confirmed_at')->useCurrent();
            $table->foreignUuid('confirmed_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_proofs');
    }
};
