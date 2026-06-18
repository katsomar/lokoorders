<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::transaction(function () {
            $firstZone = DB::table('delivery_zones')->first()?->id;
            
            $user = DB::table('users')->first();
            if ($user) {
                $userId = $user->id;
            } else {
                $userId = (string) Str::uuid();
                DB::table('users')->insert([
                    'id' => $userId,
                    'name' => 'System Agent',
                    'email' => 'system@loko-harvest.com',
                    'password' => bcrypt('system-secured-pass-key'),
                    'role' => 'admin',
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            if (!$firstZone) {
                $firstZone = (string) Str::uuid();
                DB::table('delivery_zones')->insert([
                    'id' => $firstZone,
                    'name' => 'Kampala Central',
                    'description' => 'Central Business District',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 1. Create Shoprite Parent
            $shopriteParentId = (string) Str::uuid();
            DB::table('customers')->insert([
                'id' => $shopriteParentId,
                'name' => 'Shoprite Supermarkets (HQ)',
                'contact_person' => 'John Okello (HQ Sales Manager)',
                'phone_primary' => '0772 123 456',
                'address' => 'HQ Office, Kampala Mall, Kampala',
                'delivery_zone_id' => $firstZone,
                'customer_type' => 'supermarket',
                'credit_terms' => '30_days',
                'credit_limit' => 80000000.00,
                'account_status' => 'active',
                'date_registered' => now()->toDateString(),
                'created_by' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('customer_accounts')->insert([
                'id' => (string) Str::uuid(),
                'customer_id' => $shopriteParentId,
                'current_balance' => 0.00,
                'total_invoiced' => 0.00,
                'total_paid' => 0.00,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Update existing Shoprite branches
            DB::table('customers')
                ->where('name', 'like', '%Shoprite%')
                ->where('id', '!=', $shopriteParentId)
                ->update(['parent_id' => $shopriteParentId]);

            // 2. Create Mega Parent
            $megaParentId = (string) Str::uuid();
            DB::table('customers')->insert([
                'id' => $megaParentId,
                'name' => 'Mega Standard Supermarkets (HQ)',
                'contact_person' => 'Moses Mukasa (HQ Finance Director)',
                'phone_primary' => '0702 444 555',
                'address' => 'HQ Office, Chase Complex, Kampala Rd, Kampala',
                'delivery_zone_id' => $firstZone,
                'customer_type' => 'supermarket',
                'credit_terms' => '14_days',
                'credit_limit' => 50000000.00,
                'account_status' => 'active',
                'date_registered' => now()->toDateString(),
                'created_by' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('customer_accounts')->insert([
                'id' => (string) Str::uuid(),
                'customer_id' => $megaParentId,
                'current_balance' => 0.00,
                'total_invoiced' => 0.00,
                'total_paid' => 0.00,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Update existing Mega branches
            DB::table('customers')
                ->where('name', 'like', '%Mega Standard%')
                ->where('id', '!=', $megaParentId)
                ->update(['parent_id' => $megaParentId]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::transaction(function () {
            $shoprite = DB::table('customers')->where('name', 'Shoprite Supermarkets (HQ)')->first();
            if ($shoprite) {
                DB::table('customers')->where('parent_id', $shoprite->id)->update(['parent_id' => null]);
                DB::table('customer_accounts')->where('customer_id', $shoprite->id)->delete();
                DB::table('customers')->where('id', $shoprite->id)->delete();
            }

            $mega = DB::table('customers')->where('name', 'Mega Standard Supermarkets (HQ)')->first();
            if ($mega) {
                DB::table('customers')->where('parent_id', $mega->id)->update(['parent_id' => null]);
                DB::table('customer_accounts')->where('customer_id', $mega->id)->delete();
                DB::table('customers')->where('id', $mega->id)->delete();
            }
        });
    }
};
