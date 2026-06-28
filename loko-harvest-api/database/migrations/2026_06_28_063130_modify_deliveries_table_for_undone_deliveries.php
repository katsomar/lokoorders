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
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropForeign(['order_id']);
            $table->dropUnique('deliveries_order_id_unique');
            $table->foreign('order_id')->references('id')->on('orders');
            
            $table->enum('status', ['assigned', 'in_transit', 'delivered', 'undone'])->default('assigned')->change();
            
            $table->string('undone_reason')->nullable();
            $table->timestamp('undone_at')->nullable();
            $table->foreignUuid('undone_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('return_sales_store_id')->nullable()->constrained('sales_stores')->nullOnDelete();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'processing', 'ready_for_dispatch', 'dispatched', 'delivered', 'undone'])->default('pending')->change();
        });

        Schema::table('order_status_history', function (Blueprint $table) {
            $table->enum('status', ['pending', 'processing', 'ready_for_dispatch', 'dispatched', 'delivered', 'undone'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_status_history', function (Blueprint $table) {
            $table->enum('status', ['pending', 'processing', 'ready_for_dispatch', 'dispatched', 'delivered'])->change();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['pending', 'processing', 'ready_for_dispatch', 'dispatched', 'delivered'])->default('pending')->change();
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropForeign(['undone_by']);
            $table->dropForeign(['return_sales_store_id']);
            $table->dropForeign(['order_id']);
            
            $table->dropColumn(['undone_reason', 'undone_at', 'undone_by', 'return_sales_store_id']);
            
            $table->enum('status', ['assigned', 'in_transit', 'delivered'])->default('assigned')->change();
            
            $table->unique('order_id');
            $table->foreign('order_id')->references('id')->on('orders');
        });
    }
};
