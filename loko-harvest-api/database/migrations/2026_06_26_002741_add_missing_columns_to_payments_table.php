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
        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_number')->nullable()->unique()->after('id');
            $table->string('reference_number')->nullable()->after('payment_method');
            $table->string('status')->default('completed')->after('notes');
            $table->foreignUuid('created_by')->nullable()->after('status')->constrained('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropColumn(['payment_number', 'reference_number', 'status', 'created_by']);
        });
    }
};
