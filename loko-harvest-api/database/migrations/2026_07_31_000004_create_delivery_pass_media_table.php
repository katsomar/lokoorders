<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_pass_media', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('delivery_pass_id');
            $table->uuid('order_id')->nullable();
            $table->enum('media_type', [
                'recipient_signature',
                'signed_document_photo',
                'delivery_photo',
                'return_photo'
            ]);
            $table->string('file_path');
            $table->string('mime_type', 50)->default('image/png');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('recipient_name')->nullable();
            $table->string('recipient_phone', 30)->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->timestamps();

            $table->foreign('delivery_pass_id')->references('id')->on('delivery_passes')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_pass_media');
    }
};
