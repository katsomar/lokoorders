<?php

namespace Database\Seeders;

use App\Models\Driver;
use App\Models\DriverShift;
use App\Models\Vehicle;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DriverShiftSeeder extends Seeder
{
    public function run(): void
    {
        $musa = Driver::where('full_name', 'Musa Driver')->first();
        $sarah = Driver::where('full_name', 'Sarah Namubiru')->first();
        $john = Driver::where('full_name', 'John Okello')->first();
        $peter = Driver::where('full_name', 'Peter Pan')->first();

        $v1 = Vehicle::where('registration_number', 'UBL 482Y')->first();
        $v2 = Vehicle::where('registration_number', 'UAB 123X')->first();
        $v4 = Vehicle::where('registration_number', 'UBC 778A')->first();

        // Musa Driver (Active Morning/Afternoon Shift, and Completed history)
        if ($musa && $v1) {
            DriverShift::create([
                'driver_id' => $musa->id,
                'vehicle_id' => $v1->id,
                'shift_date' => Carbon::today()->toDateString(),
                'start_time' => Carbon::today()->setHour(8)->setMinute(0),
                'status' => 'active',
                'deliveries_count' => 8,
                'crates_delivered' => 220,
                'notes' => 'Morning route ongoing. All drop points active.',
            ]);

            DriverShift::create([
                'driver_id' => $musa->id,
                'vehicle_id' => $v1->id,
                'shift_date' => Carbon::yesterday()->toDateString(),
                'start_time' => Carbon::yesterday()->setHour(8)->setMinute(0),
                'end_time' => Carbon::yesterday()->setHour(17)->setMinute(0),
                'status' => 'completed',
                'deliveries_count' => 12,
                'crates_delivered' => 310,
                'notes' => 'Completed deliveries in Central Division. Vehicles ran clean.',
            ]);

            DriverShift::create([
                'driver_id' => $musa->id,
                'vehicle_id' => $v1->id,
                'shift_date' => Carbon::today()->subDays(2)->toDateString(),
                'start_time' => Carbon::today()->subDays(2)->setHour(8)->setMinute(0),
                'end_time' => Carbon::today()->subDays(2)->setHour(17)->setMinute(0),
                'status' => 'completed',
                'deliveries_count' => 15,
                'crates_delivered' => 420,
                'notes' => 'Heavy morning congestion near Wandegeya round-about. All orders completed.',
            ]);
        }

        // Sarah Namubiru (Active Evening Shift, and Completed history - Same Vehicle UBL 482Y!)
        if ($sarah && $v1) {
            DriverShift::create([
                'driver_id' => $sarah->id,
                'vehicle_id' => $v1->id,
                'shift_date' => Carbon::today()->toDateString(),
                'start_time' => Carbon::today()->setHour(17)->setMinute(30),
                'status' => 'active',
                'deliveries_count' => 4,
                'crates_delivered' => 90,
                'notes' => 'Evening shift rotation active. Doing Acacia and Kololo runs.',
            ]);

            DriverShift::create([
                'driver_id' => $sarah->id,
                'vehicle_id' => $v1->id,
                'shift_date' => Carbon::yesterday()->toDateString(),
                'start_time' => Carbon::yesterday()->setHour(17)->setMinute(30),
                'end_time' => Carbon::yesterday()->setHour(23)->setMinute(30),
                'status' => 'completed',
                'deliveries_count' => 8,
                'crates_delivered' => 180,
                'notes' => 'Night drop-offs at supermarkets completed successfully.',
            ]);

            DriverShift::create([
                'driver_id' => $sarah->id,
                'vehicle_id' => $v1->id,
                'shift_date' => Carbon::today()->subDays(2)->toDateString(),
                'start_time' => Carbon::today()->subDays(2)->setHour(17)->setMinute(30),
                'end_time' => Carbon::today()->subDays(2)->setHour(23)->setMinute(30),
                'status' => 'completed',
                'deliveries_count' => 9,
                'crates_delivered' => 210,
                'notes' => 'Completed route safely. Mild rain slowdown.',
            ]);
        }

        // John Okello (Active Morning Shift, Completed history)
        if ($john && $v2) {
            DriverShift::create([
                'driver_id' => $john->id,
                'vehicle_id' => $v2->id,
                'shift_date' => Carbon::today()->toDateString(),
                'start_time' => Carbon::today()->setHour(8)->setMinute(0),
                'status' => 'active',
                'deliveries_count' => 9,
                'crates_delivered' => 180,
                'notes' => 'Hiace Crate Van route. 5 supermarkets left.',
            ]);

            DriverShift::create([
                'driver_id' => $john->id,
                'vehicle_id' => $v2->id,
                'shift_date' => Carbon::yesterday()->toDateString(),
                'start_time' => Carbon::yesterday()->setHour(8)->setMinute(0),
                'end_time' => Carbon::yesterday()->setHour(17)->setMinute(0),
                'status' => 'completed',
                'deliveries_count' => 11,
                'crates_delivered' => 220,
                'notes' => 'Successfully delivered orders to KFC and Javas Bukoto branches.',
            ]);
        }

        // Peter Pan (Completed history - Vehicle in maintenance now!)
        if ($peter && $v4) {
            DriverShift::create([
                'driver_id' => $peter->id,
                'vehicle_id' => $v4->id,
                'shift_date' => Carbon::today()->subDays(3)->toDateString(),
                'start_time' => Carbon::today()->subDays(3)->setHour(8)->setMinute(0),
                'end_time' => Carbon::today()->subDays(3)->setHour(12)->setMinute(30),
                'status' => 'completed',
                'deliveries_count' => 5,
                'crates_delivered' => 110,
                'notes' => 'Shift ended early. Vehicle Elf Crate Truck was checked in for maintenance (clutch repair).',
            ]);
        }
    }
}
