<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $zoneCentral = DB::table('delivery_zones')->where('name', 'Kampala Central')->first()?->id;
        $zoneBukoto = DB::table('delivery_zones')->where('name', 'Bukoto')->first()?->id;
        $zoneEntebbe = DB::table('delivery_zones')->where('name', 'Entebbe Road')->first()?->id;

        // Fallbacks
        $firstZone = DB::table('delivery_zones')->first()?->id;
        $zoneCentral = $zoneCentral ?? $firstZone;
        $zoneBukoto = $zoneBukoto ?? $firstZone;
        $zoneEntebbe = $zoneEntebbe ?? $firstZone;

        $user = DB::table('users')->first();
        $userId = $user ? $user->id : Str::uuid();

        $customers = [
            // Shoprite HQ branches
            [
                'id' => (string) Str::uuid(),
                'name' => 'Shoprite Lugogo Branch',
                'contact_person' => 'John Mugisha',
                'phone_primary' => '+256772000111',
                'phone_secondary' => null,
                'email' => 'lugogo@shoprite.co.ug',
                'address' => 'Lugogo Mall, Kampala',
                'delivery_zone_id' => $zoneCentral,
                'customer_type' => 'supermarket',
                'credit_terms' => '30_days',
                'credit_limit' => 50000000.00,
                'account_status' => 'active',
                'notes' => 'Corporate account - Shoprite HQ branch',
                'date_registered' => now()->toDateString(),
                'created_by' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Shoprite Acacia Branch',
                'contact_person' => 'Sarah Namubiru',
                'phone_primary' => '+256772000112',
                'phone_secondary' => null,
                'email' => 'acacia@shoprite.co.ug',
                'address' => 'Acacia Mall, Kololo',
                'delivery_zone_id' => $zoneCentral,
                'customer_type' => 'supermarket',
                'credit_terms' => '30_days',
                'credit_limit' => 30000000.00,
                'account_status' => 'active',
                'notes' => 'Corporate account - Shoprite HQ branch',
                'date_registered' => now()->toDateString(),
                'created_by' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Mega HQ branches
            [
                'id' => (string) Str::uuid(),
                'name' => 'Mega Standard Downtown',
                'contact_person' => 'Peter Ochieng',
                'phone_primary' => '+256772000221',
                'phone_secondary' => null,
                'email' => 'downtown@megastandard.com',
                'address' => 'Downtown Building, Kampala Road',
                'delivery_zone_id' => $zoneCentral,
                'customer_type' => 'supermarket',
                'credit_terms' => '14_days',
                'credit_limit' => 20000000.00,
                'account_status' => 'active',
                'notes' => 'Corporate account - Mega HQ branch',
                'date_registered' => now()->toDateString(),
                'created_by' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Mega Standard Nakasero',
                'contact_person' => 'Jane Alupo',
                'phone_primary' => '+256772000222',
                'phone_secondary' => null,
                'email' => 'nakasero@megastandard.com',
                'address' => 'Nakasero, Kampala',
                'delivery_zone_id' => $zoneCentral,
                'customer_type' => 'supermarket',
                'credit_terms' => '14_days',
                'credit_limit' => 15000000.00,
                'account_status' => 'active',
                'notes' => 'Corporate account - Mega HQ branch',
                'date_registered' => now()->toDateString(),
                'created_by' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Mega Standard Entebbe',
                'contact_person' => 'David Musoke',
                'phone_primary' => '+256772000223',
                'phone_secondary' => null,
                'email' => 'entebbe@megastandard.com',
                'address' => 'Entebbe Town, Victoria Mall',
                'delivery_zone_id' => $zoneEntebbe,
                'customer_type' => 'supermarket',
                'credit_terms' => '14_days',
                'credit_limit' => 15000000.00,
                'account_status' => 'active',
                'notes' => 'Corporate account - Mega HQ branch',
                'date_registered' => now()->toDateString(),
                'created_by' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            // Standalones
            [
                'id' => (string) Str::uuid(),
                'name' => 'KFC Bukoto',
                'contact_person' => 'Alice Kemigisha',
                'phone_primary' => '+256772000331',
                'phone_secondary' => null,
                'email' => 'bukoto@kfc.co.ug',
                'address' => 'Bukoto, Kampala',
                'delivery_zone_id' => $zoneBukoto,
                'customer_type' => 'restaurant',
                'credit_terms' => '7_days',
                'credit_limit' => 10000000.00,
                'account_status' => 'active',
                'notes' => 'Standalone restaurant account',
                'date_registered' => now()->toDateString(),
                'created_by' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Café Javas Oasis Mall',
                'contact_person' => 'Michael Bbosa',
                'phone_primary' => '+256772000441',
                'phone_secondary' => null,
                'email' => 'oasis@cafejavas.co.ug',
                'address' => 'Oasis Mall, Kampala',
                'delivery_zone_id' => $zoneCentral,
                'customer_type' => 'restaurant',
                'credit_terms' => 'cash',
                'credit_limit' => 0.00,
                'account_status' => 'active',
                'notes' => 'Standalone restaurant account - COD only',
                'date_registered' => now()->toDateString(),
                'created_by' => $userId,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($customers as $c) {
            if (!DB::table('customers')->where('name', $c['name'])->exists()) {
                DB::table('customers')->insert($c);
                
                // Initialize customer account
                DB::table('customer_accounts')->insert([
                    'id' => (string) Str::uuid(),
                    'customer_id' => $c['id'],
                    'current_balance' => 0.00,
                    'total_invoiced' => 0.00,
                    'total_paid' => 0.00,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
