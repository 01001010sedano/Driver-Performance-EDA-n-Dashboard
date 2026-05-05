<?php

use App\Http\Controllers\Api\DriverMetricsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Driver Performance API Routes
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api automatically by Laravel.
|
| Cache keys per endpoint:
|   weekly_summary:{start}:{end}
|   top_drivers:{metric}:{limit}:{start}:{end}
|   interventions:{threshold}:{start}:{end}
|   driver_detail:{driver_id}:{start}:{end}
|   drivers_list
|
| To invalidate all cache: php artisan cache:clear
| To inspect keys: redis-cli KEYS '*'
*/

Route::prefix('metrics')->group(function () {

    // Weekly aggregated totals
    // GET /api/metrics/weekly?start=2025-01-01&end=2025-03-31
    Route::get('/weekly', [DriverMetricsController::class, 'weeklySummary']);

    // Top N drivers by a chosen metric
    // GET /api/metrics/top-drivers?metric=violations&limit=10&start=...&end=...
    Route::get('/top-drivers', [DriverMetricsController::class, 'topDrivers']);

    // Drivers flagged for intervention (accidents above threshold)
    // GET /api/metrics/interventions?threshold=2&start=...&end=...
    Route::get('/interventions', [DriverMetricsController::class, 'interventions']);

    // Per-driver daily time series
    // GET /api/metrics/driver/D046?start=2025-01-01&end=2025-03-31
    Route::get('/driver/{driver_id}', [DriverMetricsController::class, 'driverDetail']);
});

// Driver list for UI dropdowns
// GET /api/drivers
Route::get('/drivers', [DriverMetricsController::class, 'listDrivers']);
