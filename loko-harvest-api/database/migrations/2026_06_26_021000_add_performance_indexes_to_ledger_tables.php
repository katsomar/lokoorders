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
        Schema::table('account_transactions', function (Blueprint $table) {
            $table->index('reference_number');
            $table->index('transaction_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('account_transactions', function (Blueprint $table) {
            $table->dropIndex(['reference_number']);
            $table->dropIndex(['transaction_date']);
        });
    }
};
