<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DriverMetricsController extends Controller
{
    /** Cache TTL in seconds (5 minutes). */
    private const TTL = 300;

    // ----------------------------------------------------------------
    // GET /api/metrics/weekly
    // Query params: start (YYYY-MM-DD), end (YYYY-MM-DD)
    // Cache key: weekly_summary:{start}:{end}
    // ----------------------------------------------------------------
    public function weeklySummary(Request $request): JsonResponse
    {
        $start = $request->query('start', '2025-01-01');
        $end   = $request->query('end',   '2025-03-31');

        $cacheKey = "weekly_summary:{$start}:{$end}";

        $data = Cache::remember($cacheKey, self::TTL, function () use ($start, $end) {
            return DB::table('driver_profiles')
                ->selectRaw("
                    date_trunc('week', date)::date           AS week_start,
                    SUM(delays_minutes)                      AS total_delays,
                    SUM(accidents_count)                     AS total_accidents,
                    SUM(violations_count)                    AS total_violations,
                    ROUND(AVG(rating)::numeric, 2)           AS avg_rating,
                    COUNT(DISTINCT driver_id)                AS active_drivers
                ")
                ->whereBetween('date', [$start, $end])
                ->groupByRaw("date_trunc('week', date)")
                ->orderByRaw("date_trunc('week', date)")
                ->get();
        });

        return response()->json([
            'data'       => $data,
            'start'      => $start,
            'end'        => $end,
            'cache_key'  => $cacheKey,
        ]);
    }

    // ----------------------------------------------------------------
    // GET /api/metrics/top-drivers
    // Query params: metric (violations|accidents|delays), limit (int)
    //               start, end
    // Cache key: top_drivers:{metric}:{limit}:{start}:{end}
    // ----------------------------------------------------------------
    public function topDrivers(Request $request): JsonResponse
    {
        $metric = $request->query('metric', 'violations');
        $limit  = (int) $request->query('limit', 10);
        $start  = $request->query('start', '2025-01-01');
        $end    = $request->query('end',   '2025-03-31');

        $allowed = ['violations', 'accidents', 'delays'];
        if (!in_array($metric, $allowed)) {
            return response()->json(['error' => 'metric must be one of: ' . implode(', ', $allowed)], 422);
        }

        $orderColumn = match ($metric) {
            'accidents' => 'total_accidents',
            'delays'    => 'avg_delay',
            default     => 'total_violations',
        };

        $cacheKey = "top_drivers:{$metric}:{$limit}:{$start}:{$end}";

        $data = Cache::remember($cacheKey, self::TTL, function () use ($start, $end, $limit, $orderColumn) {
            return DB::table('driver_profiles')
                ->selectRaw("
                    driver_id,
                    SUM(violations_count)                    AS total_violations,
                    SUM(accidents_count)                     AS total_accidents,
                    ROUND(AVG(delays_minutes)::numeric, 1)   AS avg_delay,
                    ROUND(AVG(rating)::numeric, 2)           AS avg_rating
                ")
                ->whereBetween('date', [$start, $end])
                ->groupBy('driver_id')
                ->orderByRaw("{$orderColumn} DESC")
                ->limit($limit)
                ->get();
        });

        return response()->json([
            'data'      => $data,
            'metric'    => $metric,
            'limit'     => $limit,
            'cache_key' => $cacheKey,
        ]);
    }

    // ----------------------------------------------------------------
    // GET /api/metrics/interventions
    // Query params: threshold (int, default 2), start, end
    // Returns drivers whose total accidents exceed the threshold.
    // Cache key: interventions:{threshold}:{start}:{end}
    // ----------------------------------------------------------------
    public function interventions(Request $request): JsonResponse
    {
        $threshold = (int) $request->query('threshold', 2);
        $start     = $request->query('start', '2025-01-01');
        $end       = $request->query('end',   '2025-03-31');

        $cacheKey = "interventions:{$threshold}:{$start}:{$end}";

        $data = Cache::remember($cacheKey, self::TTL, function () use ($start, $end, $threshold) {
            return DB::table('driver_profiles')
                ->selectRaw("
                    driver_id,
                    SUM(accidents_count)                     AS total_accidents,
                    SUM(violations_count)                    AS total_violations,
                    SUM(behavioral_problems)                 AS total_behavioral,
                    ROUND(AVG(rating)::numeric, 2)           AS avg_rating
                ")
                ->whereBetween('date', [$start, $end])
                ->groupBy('driver_id')
                ->havingRaw('SUM(accidents_count) > ?', [$threshold])
                ->orderByRaw('SUM(accidents_count) DESC')
                ->get();
        });

        return response()->json([
            'data'       => $data,
            'threshold'  => $threshold,
            'cache_key'  => $cacheKey,
        ]);
    }

    // ----------------------------------------------------------------
    // GET /api/metrics/driver/{driver_id}
    // Query params: start, end
    // Returns daily time series for one driver.
    // Cache key: driver_detail:{id}:{start}:{end}
    // ----------------------------------------------------------------
    public function driverDetail(Request $request, string $driverId): JsonResponse
    {
        $start = $request->query('start', '2025-01-01');
        $end   = $request->query('end',   '2025-03-31');

        $cacheKey = "driver_detail:{$driverId}:{$start}:{$end}";

        $data = Cache::remember($cacheKey, self::TTL, function () use ($driverId, $start, $end) {
            return DB::table('driver_profiles')
                ->select([
                    'date',
                    'delays_minutes',
                    'violations_count',
                    'accidents_count',
                    'behavioral_problems',
                    'rating',
                    'shift',
                ])
                ->where('driver_id', $driverId)
                ->whereBetween('date', [$start, $end])
                ->orderBy('date')
                ->get();
        });

        if ($data->isEmpty()) {
            return response()->json(['error' => "Driver {$driverId} not found or no data in range."], 404);
        }

        // Summary stats alongside the time series
        $summary = [
            'avg_delay'         => round($data->avg('delays_minutes'), 1),
            'total_violations'  => $data->sum('violations_count'),
            'total_accidents'   => $data->sum('accidents_count'),
            'avg_rating'        => round($data->avg('rating'), 2),
        ];

        return response()->json([
            'driver_id'  => $driverId,
            'start'      => $start,
            'end'        => $end,
            'summary'    => $summary,
            'data'       => $data,
            'cache_key'  => $cacheKey,
        ]);
    }

    // ----------------------------------------------------------------
    // GET /api/drivers
    // Returns list of all driver IDs with aggregate stats.
    // Used for the frontend dropdown.
    // Cache key: drivers_list
    // ----------------------------------------------------------------
    public function listDrivers(Request $request): JsonResponse
    {
        $cacheKey = 'drivers_list';

        $data = Cache::remember($cacheKey, self::TTL, function () {
            return DB::table('driver_profiles')
                ->selectRaw("
                    driver_id,
                    ROUND(AVG(rating)::numeric, 2)         AS avg_rating,
                    SUM(accidents_count)                   AS total_accidents,
                    SUM(violations_count)                  AS total_violations
                ")
                ->groupBy('driver_id')
                ->orderBy('driver_id')
                ->get();
        });

        return response()->json(['data' => $data]);
    }
}
