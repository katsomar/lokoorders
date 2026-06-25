<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->enum('classification', ['independent', 'file_opener', 'branch'])
                  ->default('independent')
                  ->after('customer_type');
        });

        // Set 'branch' for those with parent_id set
        DB::table('customers')
          ->whereNotNull('parent_id')
          ->update(['classification' => 'branch']);

        // Set 'file_opener' for those that are parents of other customers
        $parentIds = DB::table('customers')
          ->whereNotNull('parent_id')
          ->pluck('parent_id')
          ->unique()
          ->toArray();

        if (!empty($parentIds)) {
            DB::table('customers')
              ->whereIn('id', $parentIds)
              ->update(['classification' => 'file_opener']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('classification');
        });
    }
};
