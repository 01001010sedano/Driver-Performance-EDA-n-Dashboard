# Demo Script — Week 3 Driver Performance Dashboard
## 5–8 minute walkthrough

---

## Setup before demo (run beforehand)

```bash
cd "week 3"
cd data && python3 generate_dataset.py && cd ..
docker compose up -d --build
docker compose exec backend php artisan db:seed --class=DriverProfileSeeder
```

Wait for all containers to be healthy, then open:
- Dashboard: http://localhost:3001
- Metabase:  http://localhost:3000
- API:       http://localhost:8000

---

## Walkthrough script

### [0:00 – 0:45] Introduction
> "This week I built a driver performance analytics stack — from raw data all the way to an interactive dashboard and a business-facing Metabase report. Let me walk you through each layer."

---

### [0:45 – 2:00] EDA Insights (Jupyter notebook)
Open `eda-notebooks/eda_day1.ipynb`

> "I started with exploratory data analysis on 4,500 rows of driver performance data — 50 drivers over 90 days."

Key things to show:
1. `df.describe()` output — show the shape of delay and rating distributions
2. Correlation heatmap — point out the **-0.587** correlation between accidents and rating
3. Day-of-week bar chart — highlight the **Monday spike** (~40% higher delays)
4. Top violators chart — point out the **D046–D050 at-risk cluster**

> "The data tells a clear story: drivers D046 through D050 are outliers — lower ratings, more accidents, more violations. These are the five drivers I'd recommend for immediate safety coaching."

---

### [2:00 – 3:30] Laravel API + Redis (Postman or curl)
Open Postman and import `final/postman_collection.json`

**Hit 1:** Weekly summary
```
GET /api/metrics/weekly?start=2025-01-01&end=2025-03-31
```
> "The API aggregates weekly totals directly from PostgreSQL. Each response includes a `cache_key` field."

**Hit 2:** Same request again
> "Watch the response time — the second call is served from Redis cache. Much faster."

Show in terminal:
```bash
docker compose exec redis redis-cli KEYS '*'
```
> "You can see the exact cache key that was stored."

**Hit 3:** Intervention candidates
```
GET /api/metrics/interventions?threshold=2
```
> "This endpoint flags any driver whose total accidents exceed the threshold — ready to power an automated alert system."

---

### [3:30 – 5:30] Next.js Dashboard
Open http://localhost:3001

Walk through:
1. **KPI cards** — total delays, accidents, violations, avg rating for the full quarter
2. **Weekly trends chart** — dual axis: delays on left, avg rating on right. Inverse relationship visible
3. **Top drivers bar** — switch between violations / accidents / delays using the dropdown
4. **Driver table** — click on **D047** to open the drilldown modal

In the modal:
> "The detail view shows D047's rating trend over 90 days — consistently below 4.0 — plus a stacked bar of daily violations and accidents."

Change the date range to January only:
> "All charts and KPIs update automatically. Different date ranges get separate Redis cache keys, so the filters are fully cached too."

---

### [5:30 – 7:00] Metabase Dashboard
Open http://localhost:3000

> "For non-technical stakeholders — managers, operations leads — I built a Metabase dashboard that connects directly to the same PostgreSQL database."

Show:
1. **Weekly Delays & Avg Rating** line chart — same trend, no code needed
2. **KPI numbers** — Total Accidents, Fleet Avg Rating at a glance
3. **Top 10 by violations** bar chart
4. **Intervention table** — at-risk drivers listed clearly

> "I can share this via a public link — no login required. Managers can bookmark it and refresh on demand."

---

### [7:00 – 8:00] Wrap-up & next steps

> "To summarise what was built this week:
> - EDA notebook with 6 plots and written findings
> - PostgreSQL schema with optimised indexes and a materialized view
> - 5 REST endpoints in Laravel, all Redis-cached with parameterized keys
> - An interactive Next.js dashboard with date filters, driver drilldown, and stacked charts
> - A Metabase dashboard for business stakeholders
> - Full technical documentation

> The most important finding: drivers D046–D050 need immediate attention. The data shows a strong negative correlation between accidents and ratings — and these five drivers are at the extreme end of both metrics.

> As a natural next step, I'd build a **driver risk score ML model** — a LightGBM classifier trained on rolling 30-day features — to automatically flag at-risk drivers before incidents happen. That would feed directly into this dashboard as a new 'Risk Score' column."

---

## Backup curl commands (if Postman unavailable)

```bash
# Weekly summary
curl "http://localhost:8000/api/metrics/weekly?start=2025-01-01&end=2025-03-31"

# Top drivers by violations
curl "http://localhost:8000/api/metrics/top-drivers?metric=violations&limit=10"

# Intervention candidates
curl "http://localhost:8000/api/metrics/interventions?threshold=2"

# Driver D046 detail
curl "http://localhost:8000/api/metrics/driver/D046?start=2025-01-01&end=2025-03-31"

# Driver list
curl "http://localhost:8000/api/drivers"
```
