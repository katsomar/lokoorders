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
            $table->string('batch_reference')->nullable()->after('product_id');
            $table->decimal('replacement_quantity', 10, 2)->default(0.00)->after('quantity');
            $table->date('date_replaced')->nullable()->after('return_date');
            $table->string('acknowledged_by')->nullable()->after('notes');
            $table->string('signature_path')->nullable()->after('acknowledged_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('return_vouchers', function (Blueprint $table) {
            $table->dropColumn(['batch_reference', 'replacement_quantity', 'date_replaced', 'acknowledged_by', 'signature_path']);
        });
    }
};
