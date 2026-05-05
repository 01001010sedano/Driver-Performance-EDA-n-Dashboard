# Week 3 — Final Handoff Bundle

**Intern:** Jane Stephanie Sedano · **Company:** Lamina Studios · **Week:** 3

---

## What's in this folder

| File | Description |
|---|---|
| `README.md` | This file — end-to-end setup instructions |
| `Week3_Driver_Performance_TechDoc.md` | Full technical documentation |
| `EDA_Summary.md` | 1-page bullet summary of EDA insights |
| `postman_collection.json` | Import into Postman to test all 5 API endpoints |
| `demo_script.md` | 5–8 min walkthrough script for the demo |
| `metabase_setup.md` | Step-by-step Metabase dashboard setup guide |

---

## Prerequisites

- Docker Desktop running
- Python 3.10+ (for data generation)
- Ports free: 5432, 6379, 8000, 3000, 3001

---

## End-to-end setup

### Step 1 — Generate the dataset
```bash
cd "week 3/data"
python3 generate_dataset.py
# Output: driver_profiles.csv (4,500 rows)
```

### Step 2 — Start all services
```bash
cd "week 3"
docker compose up -d --build
# Services: postgres, redis, backend (Laravel), frontend (Next.js), metabase
```

Wait ~60 seconds for the build to complete. Check status:
```bash
docker compose ps
```

### Step 3 — Run database migrations and seed data
```bash
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan db:seed --class=DriverProfileSeeder
```

### Step 4 — Open the applications

| App | URL |
|---|---|
| Next.js Dashboard | http://localhost:3001 |
| Laravel API | http://localhost:8000 |
| Metabase | http://localhost:3000 |

### Step 5 — Set up Metabase
Follow `final/metabase_setup.md` to connect to PostgreSQL and create the dashboard.

### Step 6 — Run the EDA notebook (optional)
```bash
cd "week 3/eda-notebooks"
pip install -r requirements.txt
jupyter notebook eda_day1.ipynb
```

---

## Testing the API

Import `postman_collection.json` into Postman, or use curl:

```bash
# Weekly summary
curl "http://localhost:8000/api/metrics/weekly?start=2025-01-01&end=2025-03-31"

# Top 10 drivers by violations
curl "http://localhost:8000/api/metrics/top-drivers?metric=violations&limit=10"

# Intervention candidates (accidents > 2)
curl "http://localhost:8000/api/metrics/interventions?threshold=2"

# Driver D046 detail
curl "http://localhost:8000/api/metrics/driver/D046"

# Driver list
curl "http://localhost:8000/api/drivers"
```

---

## Stopping all services

```bash
docker compose down          # stop containers, keep volumes
docker compose down -v       # stop containers and delete all data
```

---

## Project structure

```
week 3/
├── data/
│   ├── generate_dataset.py
│   └── driver_profiles.csv
├── eda-notebooks/
│   ├── requirements.txt
│   └── eda_day1.ipynb
├── backend-laravel/
│   ├── Dockerfile
│   ├── app/Http/Controllers/Api/DriverMetricsController.php
│   ├── app/Models/DriverProfile.php
│   ├── database/migrations/
│   ├── database/seeders/
│   └── routes/api.php
├── frontend-next/
│   ├── app/dashboard/page.tsx
│   ├── components/
│   └── lib/
├── db/
│   └── aggregations.sql
├── docker-compose.yml
├── README.md
├── final/           ← you are here
└── archive/
    └── Week3_Route_Optimization_TechDoc.docx
```
