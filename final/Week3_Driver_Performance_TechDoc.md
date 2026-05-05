# Week 3 Technical Documentation
# Driver Performance EDA & Dashboard

| | |
|---|---|
| **Intern** | Jane Stephanie Sedano |
| **Company** | Lamina Studios |
| **Week** | Week 3 — 7-Day Sprint |
| **Date** | May 5, 2026 |
| **Supervisor** | April Gianan, Founder & CEO |

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Dataset](#3-dataset)
4. [Day 1 — Exploratory Data Analysis](#4-day-1--exploratory-data-analysis)
5. [Day 2 — Database Schema & Aggregations](#5-day-2--database-schema--aggregations)
6. [Day 3 — Laravel REST API & Redis Caching](#6-day-3--laravel-rest-api--redis-caching)
7. [Day 4 & 5 — Next.js Dashboard](#7-day-4--5--nextjs-dashboard)
8. [Day 6 — Metabase Dashboard](#8-day-6--metabase-dashboard)
9. [Performance Recommendations](#9-performance-recommendations)
10. [Next Steps — Driver Risk Score ML Model](#10-next-steps--driver-risk-score-ml-model)
11. [How to Run the Full Stack](#11-how-to-run-the-full-stack)
12. [Learning Outcomes](#12-learning-outcomes)

---

## 1. Project Overview

### Goal
Perform Exploratory Data Analysis (EDA) on driver performance data, build REST API endpoints in Laravel that serve aggregated metrics with Redis caching, create an interactive Next.js + Chart.js dashboard, and deploy a Metabase dashboard for non-technical business stakeholders.

### Confirmed Deliverables
As confirmed by CEO April Gianan (email, May 4 2026):

- Perform EDA and extract actionable insights from driver performance data
- Build backend aggregations in Laravel with Redis caching
- Deploy a Metabase dashboard for business stakeholders
- Create interactive charts in Next.js using Chart.js
- Document findings and propose next steps (driver risk score ML model)

### Connection to Week 2
Week 2 built a real-time driver monitoring system using a dashcam, YOLOv8 object detection, and IMU sensors. That system produces events such as `NEAR_COLLISION`, harsh braking, and rapid acceleration. In a production pipeline, those events would be aggregated daily per driver to build the `driver_profiles` table that Week 3 analyzes. This creates a direct end-to-end story: **Week 2 detects incidents → Week 3 analyzes patterns and visualizes them for decision-makers.**

---

## 2. System Architecture

### Data Flow

```
data/generate_dataset.py
        │  (50 drivers × 90 days = 4,500 rows)
        ▼
driver_profiles.csv
        │
        ▼
Laravel Seeder (league/csv)
        │
        ▼
PostgreSQL 16 ──── Materialized View (mv_weekly_summary)
        │                      │
        ▼                      ▼
Laravel 10 REST API       Metabase Dashboard
(port 8000)               (port 3000)
        │
        ▼
Redis 7 Cache
(TTL 300s, parameterized keys)
        │
        ▼
Next.js 14 Dashboard
Chart.js visuals (port 3001)
```

### Docker Services

All services run via a single `docker compose up` command.

| Service | Docker Image | Port | Purpose |
|---|---|---|---|
| PostgreSQL | `postgres:16` | 5432 | Primary database |
| Redis | `redis:7-alpine` | 6379 | API response cache |
| Laravel API | `php:8.2-cli-alpine` | 8000 | REST endpoints |
| Next.js Dashboard | `node:20-alpine` | 3001 | Frontend |
| Metabase | `metabase/metabase:latest` | 3000 | Business dashboard |

### Technology Stack Summary

| Layer | Technology |
|---|---|
| Data Generation | Python 3, NumPy, pandas |
| EDA | Jupyter Notebook, Matplotlib, Seaborn, SciPy |
| Database | PostgreSQL 16 |
| Backend Framework | Laravel 10 (PHP 8.2) |
| Cache | Redis 7 (predis/predis client) |
| CSV Import | league/csv |
| Frontend Framework | Next.js 14 (TypeScript, App Router) |
| UI Styling | Tailwind CSS |
| Charts | Chart.js + react-chartjs-2 |
| Data Fetching | SWR + Axios |
| Business Dashboard | Metabase |
| Containerization | Docker + Docker Compose |

---

## 3. Dataset

### Source
A synthetic dataset was generated using `data/generate_dataset.py` with a fixed random seed (42) for full reproducibility. No real personal data was used.

### Schema

| Column | Type | Description |
|---|---|---|
| `driver_id` | VARCHAR | Driver identifier (D001–D050) |
| `date` | DATE | Record date (YYYY-MM-DD) |
| `delays_minutes` | INT | Total delay in minutes for that day |
| `behavioral_problems` | INT | Count of reported behavioral incidents |
| `violations_count` | INT | Traffic violations recorded |
| `accidents_count` | INT | Accident count |
| `rating` | NUMERIC(3,2) | Daily driver rating (1.0–5.0) |
| `route_id` | VARCHAR (opt.) | Assigned route (R01–R10) |
| `vehicle_id` | VARCHAR (opt.) | Assigned vehicle (V01–V20) |
| `shift` | VARCHAR (opt.) | morning / afternoon / night |

### Dataset Characteristics

| Property | Value |
|---|---|
| Drivers | 50 (D001–D050) |
| Date range | 2025-01-01 to 2025-03-31 (90 days) |
| Total rows | 4,500 |
| Missing values | None |
| At-risk drivers | D046–D050 (elevated violations, accidents, lower ratings) |
| Monday delay uplift | ~40% higher than other weekdays |
| Correlation target | rating vs. accidents_count: r ≈ –0.59 |

---

## 4. Day 1 — Exploratory Data Analysis

### Notebook
`eda-notebooks/eda_day1.ipynb`

The notebook walks through 8 sections: data loading, quality checks, descriptive statistics, distribution plots, correlation matrix, weekly time series, day-of-week analysis, top violators, outlier detection, and written findings.

### 4.1 Data Quality

```python
df = pd.read_csv('../data/driver_profiles.csv', parse_dates=['date'])
df.info()        # all dtypes correct
df.isnull().sum()  # zero missing values in all columns
```

**Finding:** The dataset is complete. No imputation or cleaning is required.

### 4.2 Descriptive Statistics

| Metric | Value |
|---|---|
| Mean delays_minutes | 22.7 min |
| Median delays_minutes | 21 min (right-skewed) |
| Max delays_minutes | 68 min (outlier) |
| Fleet average rating | **4.29 / 5.0** |
| Total accidents (90 days) | **298** |
| Total violations (90 days) | ~1,800 |

![Distributions of delays and ratings](screenshots/eda_01_distributions.png)

### 4.3 Correlation Matrix

| Variable pair | Pearson r | Significance |
|---|---|---|
| accidents_count vs rating | **–0.587** | p < 0.001 *** |
| violations_count vs rating | **–0.302** | p < 0.001 *** |
| delays_minutes vs rating | –0.18 | p < 0.001 *** |
| behavioral_problems vs rating | –0.14 | p < 0.001 *** |

**Key finding:** Accidents have the strongest negative impact on driver ratings. A driver with even one accident per month sees their average rating drop by roughly 0.6 points.

![Correlation heatmap](screenshots/eda_02_correlation.png)

![Weekly delays and ratings trend](screenshots/eda_03_weekly_trends.png)

### 4.4 Monday Delay Spike

| Day | Avg Delay (min) |
|---|---|
| **Monday** | **~30+ min** |
| Tuesday | ~22 min |
| Wednesday | ~22 min |
| Thursday | ~22 min |
| Friday | ~21 min |

Monday delays are ~40% higher than the weekly average. Likely causes: start-of-week congestion, driver fatigue after weekends.

**Recommendation:** Schedule lighter routes and earlier start times on Mondays.

![Day-of-week delay pattern](screenshots/eda_04_dow_delays.png)

### 4.5 At-Risk Driver Cluster

Drivers D046–D050 (10% of the fleet) show consistently worse performance across all metrics:

| Group | Avg Rating | Total Accidents | Total Violations |
|---|---|---|---|
| At-risk (D046–D050) | **3.70** | High | High |
| Normal fleet (D001–D045) | **4.36** | Low–moderate | Low–moderate |

**Recommendation:** Immediate safety coaching, route reassignment, and 30-day probationary monitoring for these five drivers.

![Top 10 drivers by violations](screenshots/eda_05_top_violators.png)

### 4.6 Outlier Detection (IQR Method)

- `delays_minutes` > 45 min: present but represent real high-delay events, not errors. Track per driver.
- `accidents_count` = 2 in a single day: extremely rare but serious. Any driver exceeding 1 accident in a rolling 30-day window should trigger an automated intervention alert.

---

## 5. Day 2 — Database Schema & Aggregations

### Laravel Migration

```php
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
// Composite index for filtered queries
DB::statement('CREATE INDEX idx_driver_date ON driver_profiles (driver_id, date)');
```

### Materialized View for Fast Weekly Aggregations

```sql
CREATE MATERIALIZED VIEW mv_weekly_summary AS
SELECT
    date_trunc('week', date)::date         AS week_start,
    SUM(delays_minutes)                    AS total_delays,
    SUM(accidents_count)                   AS total_accidents,
    SUM(violations_count)                  AS total_violations,
    ROUND(AVG(rating)::numeric, 2)         AS avg_rating,
    COUNT(DISTINCT driver_id)              AS active_drivers
FROM driver_profiles
GROUP BY date_trunc('week', date)
ORDER BY week_start;
```

The materialized view is refreshed after seeding and on a nightly schedule in production.

### CSV Seeder

Uses `league/csv` to read `driver_profiles.csv` and insert rows in chunks of 500 for efficiency:

```php
// database/seeders/DriverProfileSeeder.php
$csv = Reader::createFromPath('/var/www/data/driver_profiles.csv', 'r');
$csv->setHeaderOffset(0);
foreach ($records as $record) {
    $chunk[] = [ /* mapped columns */ ];
    if (count($chunk) >= 500) {
        DB::table('driver_profiles')->insert($chunk);
        $chunk = [];
    }
}
DB::statement('REFRESH MATERIALIZED VIEW mv_weekly_summary');
```

### Key Aggregation Queries (db/aggregations.sql)

```sql
-- Weekly totals (used by /api/metrics/weekly)
SELECT
    date_trunc('week', date)::date  AS week_start,
    SUM(delays_minutes)             AS total_delays,
    SUM(accidents_count)            AS total_accidents,
    ROUND(AVG(rating)::numeric, 2)  AS avg_rating
FROM driver_profiles
WHERE date BETWEEN '2025-01-01' AND '2025-03-31'
GROUP BY date_trunc('week', date)
ORDER BY week_start;

-- Intervention candidates
SELECT driver_id, SUM(accidents_count) AS total_accidents
FROM driver_profiles
GROUP BY driver_id
HAVING SUM(accidents_count) > 2
ORDER BY total_accidents DESC;
```

---

## 6. Day 3 — Laravel REST API & Redis Caching

### Endpoints

| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| GET | `/api/metrics/weekly` | `start`, `end` | Weekly aggregated totals |
| GET | `/api/metrics/top-drivers` | `metric`, `limit`, `start`, `end` | Top N drivers by a metric |
| GET | `/api/metrics/interventions` | `threshold`, `start`, `end` | Drivers exceeding accident threshold |
| GET | `/api/metrics/driver/{id}` | `start`, `end` | Per-driver daily time series |
| GET | `/api/drivers` | — | Driver list for UI dropdown |

### Redis Caching Strategy

All endpoints use `Cache::remember()` with a **TTL of 300 seconds (5 minutes)**. Cache keys are parameterized so different query inputs produce different cache entries:

| Endpoint | Cache Key Pattern |
|---|---|
| `/api/metrics/weekly` | `weekly_summary:{start}:{end}` |
| `/api/metrics/top-drivers` | `top_drivers:{metric}:{limit}:{start}:{end}` |
| `/api/metrics/interventions` | `interventions:{threshold}:{start}:{end}` |
| `/api/metrics/driver/{id}` | `driver_detail:{id}:{start}:{end}` |
| `/api/drivers` | `drivers_list` |

### Controller Example

```php
// app/Http/Controllers/Api/DriverMetricsController.php
public function weeklySummary(Request $request): JsonResponse
{
    $start    = $request->query('start', '2025-01-01');
    $end      = $request->query('end',   '2025-03-31');
    $cacheKey = "weekly_summary:{$start}:{$end}";

    $data = Cache::remember($cacheKey, 300, function () use ($start, $end) {
        return DB::table('driver_profiles')
            ->selectRaw("
                date_trunc('week', date)::date AS week_start,
                SUM(delays_minutes)            AS total_delays,
                SUM(accidents_count)           AS total_accidents,
                ROUND(AVG(rating)::numeric, 2) AS avg_rating
            ")
            ->whereBetween('date', [$start, $end])
            ->groupByRaw("date_trunc('week', date)")
            ->orderByRaw("date_trunc('week', date)")
            ->get();
    });

    return response()->json(['data' => $data, 'cache_key' => $cacheKey]);
}
```

### Cache Invalidation

```bash
# Clear all cache
docker compose exec backend php artisan cache:clear

# Inspect keys in Redis
docker compose exec redis redis-cli KEYS '*'

# View a specific cached value
docker compose exec redis redis-cli GET "weekly_summary:2025-01-01:2025-03-31"
```

### Sample API Response

```bash
curl "http://localhost:8000/api/metrics/weekly?start=2025-01-01&end=2025-03-31"
```

```json
{
  "data": [
    {
      "week_start": "2024-12-30",
      "total_delays": 5789,
      "total_accidents": 24,
      "avg_rating": "4.30"
    },
    ...
  ],
  "start": "2025-01-01",
  "end": "2025-03-31",
  "cache_key": "weekly_summary:2025-01-01:2025-03-31"
}
```

---

## 7. Day 4 & 5 — Next.js Dashboard

### Overview
An interactive single-page dashboard built with Next.js 14 (App Router, TypeScript) and Tailwind CSS, fetching data from the Laravel API through server-side rewrites.

**URL:** http://localhost:3001/dashboard

![Next.js dashboard — top section with KPIs and charts](screenshots/nextjs_dashboard_top.png)

**Driver drilldown modal — clicking driver D047 (at-risk):**

![Driver detail modal showing rating trend and incident bars](screenshots/nextjs_driver_modal.png)

### Component Structure

| File | Purpose |
|---|---|
| `app/dashboard/page.tsx` | Main page — manages all state (dates, selected driver, metric) |
| `components/KPICards.tsx` | 4 summary cards: Total Delays, Accidents, Violations, Avg Rating |
| `components/WeeklyChart.tsx` | Dual-axis line chart — delays on Y1, avg rating on Y2 |
| `components/TopDriversChart.tsx` | Horizontal bar chart — switchable by violations / accidents / delays |
| `components/FilterBar.tsx` | Date range pickers, driver dropdown, metric selector |
| `components/DriverDetailModal.tsx` | Drilldown modal — rating trend line + stacked bar for violations/accidents |
| `lib/api.ts` | Axios wrappers for all 5 API endpoints |
| `lib/types.ts` | TypeScript interfaces for all API response shapes |

### API Proxying

`next.config.ts` rewrites all `/api/proxy/*` requests to the Laravel backend, avoiding CORS issues:

```typescript
async rewrites() {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  return [
    {
      source: "/api/proxy/:path*",
      destination: `${backendUrl}/api/:path*`,
    },
  ];
}
```

In Docker, `BACKEND_URL=http://w3_backend:8000` is passed as a build argument so the Next.js server can reach the Laravel container by its internal Docker network name.

### Features

- **Date range filter** — changing start/end updates all charts and KPI cards simultaneously via SWR cache key invalidation
- **Driver dropdown** — selecting a driver opens the detail modal automatically
- **Driver table** — clickable rows open the drilldown modal for any of the 50 drivers
- **Detail modal** — shows per-driver summary stats, rating trend line, and stacked bar of daily violations + accidents
- **Responsive layout** — grid adapts to screen width (Tailwind CSS)

### Chart.js Configuration Highlights

- Weekly chart uses `dual Y-axis` (delays on left, rating on right with `min: 1, max: 5`)
- Top drivers chart uses `indexAxis: 'y'` for horizontal bars with color coded by metric
- Detail modal stacked bar uses `stack: 's'` to overlay violations and accidents

---

## 8. Day 6 — Metabase Dashboard

### Overview
Metabase provides a no-code business dashboard that connects directly to the PostgreSQL database. It is intended for operations managers and non-technical stakeholders who need to monitor fleet performance without using the developer-facing dashboard.

**URL:** http://localhost:3000/dashboard/2

![Metabase dashboard — Driver Performance Overview](screenshots/metabase_dashboard.png)

### Connection Details

| Setting | Value |
|---|---|
| Database type | PostgreSQL |
| Host | 172.19.0.2 (Docker internal IP) |
| Port | 5432 |
| Database | driver_performance |
| Username | laravel |

### Dashboard: "Driver Performance Overview"

The dashboard contains 5 cards arranged in a grid layout:

| Card Name | Visualization | Data |
|---|---|---|
| Weekly Delays & Avg Rating | Line chart (dual series) | `date_trunc('week')`, `SUM(delays_minutes)`, `AVG(rating)` |
| Total Accidents (Fleet) | Scalar KPI | `SUM(accidents_count)` = **298** |
| Fleet Average Rating | Scalar KPI | `AVG(rating)` = **4.29** |
| Top 10 Drivers by Violations | Bar chart | `GROUP BY driver_id ORDER BY violations DESC LIMIT 10` |
| Drivers Needing Intervention | Table | `HAVING SUM(accidents_count) > 2` |

### SQL for Key Questions

```sql
-- Weekly Delays & Avg Rating
SELECT
    date_trunc('week', date)::date  AS week_start,
    SUM(delays_minutes)             AS total_delays,
    ROUND(AVG(rating)::numeric, 2)  AS avg_rating
FROM driver_profiles
GROUP BY date_trunc('week', date)
ORDER BY week_start;

-- Drivers Needing Intervention
SELECT driver_id,
       SUM(accidents_count)  AS total_accidents,
       SUM(violations_count) AS total_violations,
       ROUND(AVG(rating)::numeric, 2) AS avg_rating
FROM driver_profiles
GROUP BY driver_id
HAVING SUM(accidents_count) > 2
ORDER BY total_accidents DESC;
```

### Sharing the Dashboard

1. Open the dashboard
2. Click the share icon (top-right toolbar)
3. Toggle **Public link** on
4. Copy the URL — stakeholders can view it without a Metabase login

---

## 9. Performance Recommendations

### Database Indexing

| Index | Column(s) | Benefit |
|---|---|---|
| `idx_driver_date` | `(driver_id, date)` | Covers all filtered queries (created by migration) |
| `idx_date` | `(date)` | Pure date-range scans on large tables |

### Materialized View

The `mv_weekly_summary` view pre-aggregates the most common dashboard query. Queries against it complete in < 5ms vs 50–200ms for the raw `GROUP BY` on a large table.

Refresh after data ingestion:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_summary;
```

### Redis Cache TTL Guidelines

| Data type | Recommended TTL |
|---|---|
| Historical reports (read-only) | 3600s (1 hour) |
| Near-real-time dashboards | 300s (5 minutes) — current setting |
| Live operational data | 60s |

### Production Scheduled Jobs

```bash
# Nightly materialized view refresh (02:00)
0 2 * * * docker compose exec backend php artisan tinker \
  --execute="DB::statement('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_summary');"

# Weekly cache flush (Sunday 03:00)
0 3 * * 0 docker compose exec backend php artisan cache:clear
```

---

## 10. Next Steps — Driver Risk Score ML Model

The EDA findings provide a strong foundation for a predictive driver risk model.

### Problem Definition

**Target:** `high_risk` (binary label)
**Definition:** A driver is high-risk if, in any rolling 30-day window, they have:
- Total accidents > 2, OR
- Average rating < 3.5

### Feature Engineering (per driver, rolling 30-day window)

| Feature | Description |
|---|---|
| `avg_delays_30d` | Average daily delay in minutes |
| `sum_violations_30d` | Total violations |
| `sum_accidents_30d` | Total accidents |
| `avg_behavioral_problems_30d` | Avg behavioral incidents |
| `avg_rating_30d` | Rolling average rating |
| `dow_monday_pct` | % of shifts on Monday (high-risk day) |
| `shift_night_pct` | % of night shifts |
| `route_risk_score` | Per-route historical accident rate |

### Recommended Model

**Algorithm:** LightGBM (Gradient Boosted Trees)
- Fast training on small-to-medium datasets
- Handles class imbalance with `scale_pos_weight`
- Interpretable with SHAP values — can explain to management *why* a driver is flagged

### Integration Plan

1. Nightly batch job computes rolling features and model predictions
2. Scores written to a new `driver_risk_scores` table
3. New API endpoint: `GET /api/metrics/risk-scores`
4. New Metabase card: "Current Risk Scores" — color-coded red/yellow/green per driver

---

## 11. How to Run the Full Stack

### Prerequisites

- Docker Desktop running
- Python 3.10+ (for data generation)
- Ports 5432, 6379, 8000, 3000, 3001 free

### Step-by-Step

```bash
# 1. Navigate to project folder
cd "week 3"

# 2. Generate synthetic dataset
cd data && python3 generate_dataset.py
# Output: driver_profiles.csv (4,500 rows, ~200KB)
cd ..

# 3. Build and start all services
docker compose up -d --build
# First build: ~5–10 minutes (downloads images)
# Subsequent builds: ~30 seconds

# 4. Run migrations and seed data
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan db:seed --class=DriverProfileSeeder
# Output: "Imported 4500 rows successfully."

# 5. Open applications
# Next.js Dashboard → http://localhost:3001
# Laravel API       → http://localhost:8000/api/drivers
# Metabase          → http://localhost:3000/dashboard/2
```

### Quick API Tests

```bash
# Weekly summary
curl "http://localhost:8000/api/metrics/weekly?start=2025-01-01&end=2025-03-31"

# Top 10 drivers by violations
curl "http://localhost:8000/api/metrics/top-drivers?metric=violations&limit=10"

# Intervention candidates (accidents > 2)
curl "http://localhost:8000/api/metrics/interventions?threshold=2"

# Per-driver detail — at-risk driver D047
curl "http://localhost:8000/api/metrics/driver/D047?start=2025-01-01&end=2025-03-31"

# Full driver list
curl "http://localhost:8000/api/drivers"
```

### Stopping the Stack

```bash
docker compose down       # stop containers, keep data
docker compose down -v    # stop and delete all volumes
```

---

## 12. Learning Outcomes

By completing this week's exercise, the following skills were demonstrated:

| Skill | Implementation |
|---|---|
| Exploratory Data Analysis | 8-section Jupyter notebook with distributions, correlations, time series, and outlier detection |
| SQL aggregations | PostgreSQL `date_trunc`, `HAVING`, composite indexes, materialized views |
| Laravel development | Model, migration, seeder, controller, API routes with validation |
| Redis caching | `Cache::remember()` with parameterized keys and TTL strategy |
| Next.js development | App Router, TypeScript, SWR data fetching, API proxying |
| Chart.js visuals | Dual-axis line, horizontal bar, stacked bar, modal drilldown |
| Metabase | Database connection, native SQL questions, dashboard layout, public sharing |
| Docker | Multi-service Compose with health checks, build args, volume mounts |
| Documentation | Technical documentation, EDA summary, demo script, Postman collection |

---

*End of Technical Documentation — Week 3*

*Submitted by: Jane Stephanie Sedano | Lamina Studios Internship | May 2026*
