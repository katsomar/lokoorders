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
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('contact_person');
            $table->string('phone_primary');
            $table->string('phone_secondary')->nullable();
            $table->string('email')->nullable();
            $table->text('address');
            $table->foreignUuid('delivery_zone_id')->constrained('delivery_zones');
            $table->enum('customer_type', ['supermarket', 'restaurant', 'individual', 'institution', 'wholesaler']);
            $table->enum('credit_terms', ['cash', '7_days', '14_days', '30_days']);
            $table->decimal('credit_limit', 15, 2);
            $table->enum('account_status', ['active', 'suspended', 'closed'])->default('active');
            $table->text('notes')->nullable();
            $table->date('date_registered');
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
