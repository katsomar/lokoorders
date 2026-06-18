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
        Schema::table('drivers', function (Blueprint $table) {
            $table->string('avatar_path')->nullable()->after('notes');
            $table->string('license_path')->nullable()->after('avatar_path');
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn(['avatar_path', 'license_path']);
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn(['image_path']);
        });
    }
};
