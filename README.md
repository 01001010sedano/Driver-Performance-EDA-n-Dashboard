# Week 3 — Driver Performance EDA & Dashboard

**Intern:** Jane Stephanie Sedano  
**Company:** Lamina Studios  
**Stack:** Python · Laravel 10 · PostgreSQL 16 · Redis 7 · Next.js 14 · Chart.js · Metabase

---

## Project overview

Perform Exploratory Data Analysis on synthetic driver performance data, expose aggregated metrics through a Laravel REST API with Redis caching, and visualise insights in an interactive Next.js dashboard and a Metabase business dashboard.

---

## Folder structure

```
week 3/
├── data/
│   ├── generate_dataset.py     # synthetic CSV generator (seeded, reproducible)
│   └── driver_profiles.csv     # generated dataset (50 drivers × 90 days)
├── eda-notebooks/
│   ├── requirements.txt
│   └── eda_day1.ipynb          # EDA notebook with plots and findings
├── backend-laravel/            # Laravel 10 API
├── frontend-next/              # Next.js 14 dashboard
├── db/
│   └── aggregations.sql        # reference aggregation queries (PostgreSQL)
├── docker-compose.yml          # Postgres + Redis + Backend + Frontend + Metabase
├── final/                      # submission handoff bundle
│   ├── README.md
│   ├── EDA_Summary.md
│   ├── Week3_Driver_Performance_TechDoc.md
│   ├── demo_script.md
│   └── postman_collection.json
├── archive/
│   └── Week3_Route_Optimization_TechDoc.docx  (archived — wrong topic)
└── README.md                   (this file)
```

---

## Quick start (full stack via Docker)

### Prerequisites
- Docker Desktop running
- Ports 5432, 6379, 8000, 3000, 3001 free

### 1. Generate the dataset

```bash
cd data
python3 generate_dataset.py
# creates driver_profiles.csv in this folder
```

### 2. Bring up all services

```bash
# from week 3/
docker compose up -d --build
```

Services started:
| Service | URL |
|---|---|
| Laravel API | http://localhost:8000 |
| Next.js dashboard | http://localhost:3001 |
| Metabase | http://localhost:3000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### 3. Run migrations and seed data

```bash
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan db:seed --class=DriverProfileSeeder
```

### 4. Verify API

```bash
curl http://localhost:8000/api/metrics/weekly
curl http://localhost:8000/api/drivers
```

### 5. Open Metabase

Navigate to http://localhost:3000, complete first-run setup, then connect to:
- Host: `postgres`
- Port: `5432`
- Database: `driver_performance`
- User: `laravel`
- Password: `secret`

---

## Running the EDA notebook

```bash
cd eda-notebooks
pip install -r requirements.txt
jupyter notebook eda_day1.ipynb
```

---

## Cache invalidation

```bash
# clear all Redis cache keys
docker compose exec backend php artisan cache:clear

# inspect cache keys
docker compose exec redis redis-cli KEYS '*'

# check a specific key
docker compose exec redis redis-cli GET "weekly_summary:2025-01-01:2025-03-31"
```

Cache TTL is 300 seconds (5 minutes) by default. See backend-laravel/README.md for per-endpoint cache key reference.

---

## API endpoints summary

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/metrics/weekly` | Weekly delay/accident/rating totals |
| GET | `/api/metrics/top-drivers` | Top N drivers by a metric |
| GET | `/api/metrics/interventions` | Drivers exceeding accident threshold |
| GET | `/api/metrics/driver/{id}` | Per-driver time series |
| GET | `/api/drivers` | Driver list for UI dropdowns |

Query params: `start`, `end` (YYYY-MM-DD), `metric`, `limit`, `threshold`, `driver_id`

Full examples in `final/postman_collection.json`.
