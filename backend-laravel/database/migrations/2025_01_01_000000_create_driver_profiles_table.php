<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('driver_id', 10)->index();
            $table->date('date')->index();
            $table->integer('delays_minutes')->default(0);
            $table->integer('behavioral_problems')->default(0);
            $table->integer('violations_count')->default(0);
            $table->integer('accidents_count')->default(0);
            $table->decimal('rating', 3, 2);
            $table->string('route_id', 10)->nullable();
            $table->string('vehicle_id', 10)->nullable();
            $table->string('shift', 20)->nullable();
            $table->timestamps();
        });

        // Composite index for common query patterns
        DB::statement('CREATE INDEX idx_driver_date ON driver_profiles (driver_id, date)');

        // Materialized view for fast weekly aggregations
        DB::statement("
            CREATE MATERIALIZED VIEW mv_weekly_summary AS
            SELECT
                date_trunc('week', date)::date         AS week_start,
                SUM(delays_minutes)                     AS total_delays,
                SUM(accidents_count)                    AS total_accidents,
                SUM(violations_count)                   AS total_violations,
                ROUND(AVG(rating)::numeric, 2)          AS avg_rating,
                COUNT(DISTINCT driver_id)               AS active_drivers
            FROM driver_profiles
            GROUP BY date_trunc('week', date)
            ORDER BY week_start
        ");

        DB::statement('CREATE UNIQUE INDEX ON mv_weekly_summary (week_start)');
    }

    public function down(): void
    {
        DB::statement('DROP MATERIALIZED VIEW IF EXISTS mv_weekly_summary');
        Schema::dropIfExists('driver_profiles');
    }
};
