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
        Schema::table('orders', function (Blueprint $table) {
            $table->string('status', 50)->default('pending')->change();
        });

        Schema::table('order_status_history', function (Blueprint $table) {
            $table->string('status', 50)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_status_history', function (Blueprint $table) {
            $table->enum('status', ['pending', 'processing', 'ready_for_dispatch', 'dispatched', 'delivered', 'undone'])->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'processing', 'ready_for_dispatch', 'dispatched', 'delivered', 'undone'])->default('pending')->change();
        });
    }
};
