<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use League\Csv\Reader;

class DriverProfileSeeder extends Seeder
{
    /**
     * The CSV lives at /var/www/data/driver_profiles.csv inside the container
     * (mounted from week 3/data/ via docker-compose).
     */
    public function run(): void
    {
        $csvPath = '/var/www/data/driver_profiles.csv';

        if (!file_exists($csvPath)) {
            $this->command->error("CSV not found at {$csvPath}. Run generate_dataset.py first.");
            return;
        }

        $this->command->info('Truncating driver_profiles table...');
        DB::table('driver_profiles')->truncate();

        $csv = Reader::createFromPath($csvPath, 'r');
        $csv->setHeaderOffset(0);

        $records = $csv->getRecords();
        $chunk   = [];
        $count   = 0;
        $now     = now()->toDateTimeString();

        $this->command->info('Importing CSV...');

        foreach ($records as $record) {
            $chunk[] = [
                'driver_id'           => $record['driver_id'],
                'date'                => $record['date'],
                'delays_minutes'      => (int) $record['delays_minutes'],
                'behavioral_problems' => (int) $record['behavioral_problems'],
                'violations_count'    => (int) $record['violations_count'],
                'accidents_count'     => (int) $record['accidents_count'],
                'rating'              => (float) $record['rating'],
                'route_id'            => $record['route_id']   ?? null,
                'vehicle_id'          => $record['vehicle_id'] ?? null,
                'shift'               => $record['shift']      ?? null,
                'created_at'          => $now,
                'updated_at'          => $now,
            ];

            $count++;

            if (count($chunk) >= 500) {
                DB::table('driver_profiles')->insert($chunk);
                $chunk = [];
            }
        }

        if (!empty($chunk)) {
            DB::table('driver_profiles')->insert($chunk);
        }

        // Refresh materialized view after seeding
        DB::statement('REFRESH MATERIALIZED VIEW mv_weekly_summary');

        $this->command->info("Imported {$count} rows successfully.");
    }
}
