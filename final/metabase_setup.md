# Day 6 — Metabase Dashboard Setup

Metabase runs on http://localhost:3000 via Docker Compose.  
It uses the **same PostgreSQL instance** as the Laravel API.

---

## First-run setup (one time)

1. Open http://localhost:3000
2. Choose language → **English**
3. Create your admin account (any email/password)
4. **Add your data** → choose **PostgreSQL**:

| Field | Value |
|---|---|
| Display name | Driver Performance DB |
| Host | `postgres` |
| Port | `5432` |
| Database | `driver_performance` |
| Username | `laravel` |
| Password | `secret` |

5. Click **Save** → **Finish**

---

## Questions to create

### Question 1 — Weekly delays & rating (Line chart)

1. New Question → **Native Query**
2. Paste:

```sql
SELECT
    date_trunc('week', date)::date  AS week_start,
    SUM(delays_minutes)             AS total_delays,
    ROUND(AVG(rating)::numeric, 2)  AS avg_rating
FROM driver_profiles
GROUP BY date_trunc('week', date)
ORDER BY week_start;
```

3. Visualize → **Line** chart
4. X axis: `week_start`, Y axis: `total_delays` + `avg_rating`
5. Save as **"Weekly Delays & Avg Rating"**

---

### Question 2 — Top 10 drivers by violations (Bar chart)

```sql
SELECT
    driver_id,
    SUM(violations_count) AS total_violations,
    SUM(accidents_count)  AS total_accidents,
    ROUND(AVG(rating)::numeric, 2) AS avg_rating
FROM driver_profiles
GROUP BY driver_id
ORDER BY total_violations DESC
LIMIT 10;
```

Visualize → **Bar** chart (driver_id on X, total_violations on Y)  
Save as **"Top 10 Drivers by Violations"**

---

### Question 3 — KPI: Total accidents (Number card)

```sql
SELECT SUM(accidents_count) AS total_accidents FROM driver_profiles;
```

Visualize → **Number**  
Save as **"Total Accidents (All Time)"**

---

### Question 4 — KPI: Fleet average rating (Number card)

```sql
SELECT ROUND(AVG(rating)::numeric, 2) AS fleet_avg_rating FROM driver_profiles;
```

Visualize → **Number**  
Save as **"Fleet Average Rating"**

---

### Question 5 — At-risk drivers (Table)

```sql
SELECT
    driver_id,
    SUM(accidents_count)  AS total_accidents,
    SUM(violations_count) AS total_violations,
    ROUND(AVG(rating)::numeric, 2) AS avg_rating
FROM driver_profiles
GROUP BY driver_id
HAVING SUM(accidents_count) > 2
ORDER BY total_accidents DESC;
```

Visualize → **Table**  
Save as **"Drivers Needing Intervention"**

---

## Build the dashboard

1. Dashboards → **New Dashboard** → name it **"Driver Performance Overview"**
2. Add cards:
   - Weekly Delays & Avg Rating (full width)
   - Total Accidents KPI + Fleet Avg Rating KPI (side by side)
   - Top 10 Drivers by Violations
   - Drivers Needing Intervention
3. Arrange and resize cards as needed
4. Click **Save**

---

## Share the dashboard

1. Open the dashboard → **Sharing** (paper-plane icon)
2. Toggle **Public link** on
3. Copy the URL — share with stakeholders (no login required)

---

## Refreshing data

Metabase caches question results for 24h by default.

To refresh immediately:
- Open a question → click the clock icon → **Refresh now**

To set auto-refresh on a dashboard:
- Dashboard → clock icon → choose interval (e.g., every 10 minutes)

For the materialized view in PostgreSQL, refresh it after re-seeding:

```bash
docker compose exec backend php artisan tinker \
  --execute="DB::statement('REFRESH MATERIALIZED VIEW mv_weekly_summary');"
```
