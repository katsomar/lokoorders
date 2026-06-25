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
            $table->index('order_date');
            $table->index('status');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->index('payment_date');
        });

        Schema::table('customer_accounts', function (Blueprint $table) {
            $table->index('current_balance');
        });

        Schema::table('return_vouchers', function (Blueprint $table) {
            $table->index('return_date');
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $table->index('status');
            $table->index('dispatched_at');
            $table->index('delivered_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['order_date']);
            $table->dropIndex(['status']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['payment_date']);
        });

        Schema::table('customer_accounts', function (Blueprint $table) {
            $table->dropIndex(['current_balance']);
        });

        Schema::table('return_vouchers', function (Blueprint $table) {
            $table->dropIndex(['return_date']);
        });

        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['dispatched_at']);
            $table->dropIndex(['delivered_at']);
        });
    }
};
