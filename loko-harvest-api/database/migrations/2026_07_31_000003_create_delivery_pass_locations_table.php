<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_pass_locations', function (Blueprint $table) {
            $table->id();
            $table->uuid('delivery_pass_id');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->float('accuracy')->nullable();
            $table->float('speed')->nullable();
            $table->float('heading')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('delivery_pass_id')->references('id')->on('delivery_passes')->onDelete('cascade');
            $table->index(['delivery_pass_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_pass_locations');
    }
};
