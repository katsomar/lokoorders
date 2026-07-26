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
        Schema::table('notifications', function (Blueprint $table) {
            if (!Schema::hasColumn('notifications', 'priority')) {
                $table->string('priority')->default('medium')->after('body');
            }
            if (!Schema::hasColumn('notifications', 'group_key')) {
                $table->string('group_key')->nullable()->after('priority');
            }
            if (!Schema::hasColumn('notifications', 'route_data')) {
                $table->json('route_data')->nullable()->after('group_key');
            }
            if (!Schema::hasColumn('notifications', 'schema_version')) {
                $table->integer('schema_version')->default(1)->after('route_data');
            }
            if (!Schema::hasColumn('notifications', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('schema_version');
            }
            if (!Schema::hasColumn('notifications', 'read_at')) {
                $table->timestamp('read_at')->nullable()->after('is_read');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['priority', 'group_key', 'route_data', 'schema_version', 'expires_at', 'read_at']);
        });
    }
};
