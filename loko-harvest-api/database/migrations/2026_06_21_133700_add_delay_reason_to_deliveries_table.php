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
            $table->string('delay_reason')->nullable()->after('status');
            $table->text('custom_delay_reason')->nullable()->after('delay_reason');
            $table->boolean('is_penalized')->default(false)->after('custom_delay_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliveries', function (Blueprint $table) {
            $table->dropColumn(['delay_reason', 'custom_delay_reason', 'is_penalized']);
        });
    }
};
