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
        Schema::create('return_vouchers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('voucher_number')->unique();
            $table->foreignUuid('delivery_id')->constrained('deliveries');
            $table->foreignUuid('order_id')->constrained('orders');
            $table->foreignUuid('customer_id')->constrained('customers');
            $table->date('return_date');
            $table->enum('reason_code', ['broken_cracked', 'rotten_spoiled', 'wrong_product', 'near_expiry', 'packaging_damage', 'other']);
            $table->foreignUuid('product_id')->constrained('products');
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('monetary_value', 15, 2);
            $table->enum('return_type', ['credit', 'physical_replacement']);
            $table->text('notes')->nullable();
            $table->boolean('account_credit_posted')->default(false);
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('return_vouchers');
    }
};
