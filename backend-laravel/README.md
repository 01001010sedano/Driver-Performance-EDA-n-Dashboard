# Driver Performance API — Laravel Backend

Laravel 10 REST API serving aggregated driver performance metrics from PostgreSQL with Redis caching.

## Stack
- PHP 8.2, Laravel 10
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)
- league/csv (CSV import)
- predis/predis (Redis client)

## Running via Docker (recommended)

From the `week 3/` root:

```bash
# 1. Generate dataset
cd data && python3 generate_dataset.py && cd ..

# 2. Build and start all services
docker compose up -d --build

# 3. Seed the database
docker compose exec backend php artisan db:seed --class=DriverProfileSeeder
```

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/metrics/weekly` | Weekly delay/accident/rating totals |
| GET | `/api/metrics/top-drivers` | Top N drivers by a metric |
| GET | `/api/metrics/interventions` | Drivers exceeding accident threshold |
| GET | `/api/metrics/driver/{id}` | Per-driver daily time series |
| GET | `/api/drivers` | Driver list (for UI dropdown) |

### Query parameters

**`/api/metrics/weekly`**
- `start` (default: 2025-01-01)
- `end` (default: 2025-03-31)

**`/api/metrics/top-drivers`**
- `metric`: `violations` | `accidents` | `delays` (default: violations)
- `limit`: integer (default: 10)
- `start`, `end`

**`/api/metrics/interventions`**
- `threshold`: integer — total accidents above this value (default: 2)
- `start`, `end`

**`/api/metrics/driver/{driver_id}`**
- `start`, `end`

## Redis caching

All endpoints cache results for 300 seconds (5 minutes).

### Cache key reference

| Endpoint | Cache key pattern |
|---|---|
| `/api/metrics/weekly` | `weekly_summary:{start}:{end}` |
| `/api/metrics/top-drivers` | `top_drivers:{metric}:{limit}:{start}:{end}` |
| `/api/metrics/interventions` | `interventions:{threshold}:{start}:{end}` |
| `/api/metrics/driver/{id}` | `driver_detail:{id}:{start}:{end}` |
| `/api/drivers` | `drivers_list` |

### Cache invalidation

```bash
# Clear all cache
docker compose exec backend php artisan cache:clear

# Inspect all keys in Redis
docker compose exec redis redis-cli KEYS '*'

# Get a specific key value
docker compose exec redis redis-cli GET "weekly_summary:2025-01-01:2025-03-31"

# Delete a specific key
docker compose exec redis redis-cli DEL "drivers_list"
```

### When to invalidate

- After re-seeding the database: run `php artisan cache:clear`
- On a schedule: add a Laravel scheduled command (`Artisan::command`) to run `cache:clear` nightly
- On data update: implement a Model Observer on `DriverProfile` to clear affected keys on `saved`/`deleted`

## Performance notes

- **Composite index** `(driver_id, date)` handles all filtered queries efficiently.
- **Materialized view** `mv_weekly_summary` pre-aggregates weekly totals. Refresh it after seeding:
  ```bash
  docker compose exec backend php artisan tinker --execute="DB::statement('REFRESH MATERIALIZED VIEW mv_weekly_summary');"
  ```
- For production: set up a nightly `REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_summary` job.
- Increase Redis TTL to 600–3600 seconds for near-static historical data.
