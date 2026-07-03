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
        Schema::table('store_adjustments', function (Blueprint $table) {
            $table->foreignUuid('production_store_id')->nullable()->after('store_type')->constrained('production_stores')->onDelete('cascade');
            $table->foreignUuid('sales_store_id')->nullable()->after('production_store_id')->constrained('sales_stores')->onDelete('cascade');
            $table->string('batch_reference')->after('product_id');
            $table->string('image_path')->nullable()->after('reason');
            $table->string('signature_path')->nullable()->after('image_path');
            $table->string('status')->default('pending')->after('signature_path');
            $table->foreignUuid('approved_by')->nullable()->after('status')->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('store_adjustments', function (Blueprint $table) {
            $table->dropForeign(['production_store_id']);
            $table->dropColumn('production_store_id');
            $table->dropForeign(['sales_store_id']);
            $table->dropColumn('sales_store_id');
            $table->dropColumn('batch_reference');
            $table->dropColumn('image_path');
            $table->dropColumn('signature_path');
            $table->dropColumn('status');
            $table->dropForeign(['approved_by']);
            $table->dropColumn('approved_by');
            $table->dropColumn('approved_at');
        });
    }
};
