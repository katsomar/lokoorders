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
        Schema::table('return_vouchers', function (Blueprint $table) {
            $table->foreignUuid('replacement_sales_store_id')->nullable()->after('return_type')->constrained('sales_stores')->nullOnDelete();
            $table->string('replacement_batch_reference')->nullable()->after('replacement_sales_store_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('return_vouchers', function (Blueprint $table) {
            $table->dropForeign(['replacement_sales_store_id']);
            $table->dropColumn(['replacement_sales_store_id', 'replacement_batch_reference']);
        });
    }
};
