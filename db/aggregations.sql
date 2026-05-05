-- =============================================================
-- Week 3: Driver Performance — Reference Aggregation Queries
-- Database: PostgreSQL 16
-- Table: driver_profiles
-- =============================================================

-- -------------------------------------------------------
-- 1. Weekly totals (used by GET /api/metrics/weekly)
-- -------------------------------------------------------
SELECT
    date_trunc('week', date)::date  AS week_start,
    SUM(delays_minutes)             AS total_delays,
    SUM(accidents_count)            AS total_accidents,
    SUM(violations_count)           AS total_violations,
    ROUND(AVG(rating)::numeric, 2)  AS avg_rating,
    COUNT(DISTINCT driver_id)       AS active_drivers
FROM driver_profiles
WHERE date BETWEEN '2025-01-01' AND '2025-03-31'  -- swap dates dynamically
GROUP BY date_trunc('week', date)
ORDER BY week_start;


-- -------------------------------------------------------
-- 2. Average delay per driver (overall)
-- -------------------------------------------------------
SELECT
    driver_id,
    ROUND(AVG(delays_minutes)::numeric, 1)  AS avg_delay,
    SUM(violations_count)                   AS total_violations,
    SUM(accidents_count)                    AS total_accidents,
    ROUND(AVG(rating)::numeric, 2)          AS avg_rating
FROM driver_profiles
GROUP BY driver_id
ORDER BY avg_delay DESC;


-- -------------------------------------------------------
-- 3. Top drivers by violations (used by GET /api/metrics/top-drivers)
-- -------------------------------------------------------
SELECT
    driver_id,
    SUM(violations_count)  AS total_violations,
    SUM(accidents_count)   AS total_accidents,
    ROUND(AVG(rating)::numeric, 2) AS avg_rating
FROM driver_profiles
GROUP BY driver_id
ORDER BY total_violations DESC
LIMIT 10;


-- -------------------------------------------------------
-- 4. Drivers needing intervention (accidents above threshold)
-- -------------------------------------------------------
SELECT
    driver_id,
    SUM(accidents_count)   AS total_accidents,
    SUM(violations_count)  AS total_violations,
    ROUND(AVG(rating)::numeric, 2) AS avg_rating
FROM driver_profiles
GROUP BY driver_id
HAVING SUM(accidents_count) > 2   -- threshold, swap dynamically
ORDER BY total_accidents DESC;


-- -------------------------------------------------------
-- 5. Per-driver daily time series (used by GET /api/metrics/driver/{id})
-- -------------------------------------------------------
SELECT
    date,
    delays_minutes,
    violations_count,
    accidents_count,
    behavioral_problems,
    rating
FROM driver_profiles
WHERE driver_id = 'D046'  -- swap dynamically
  AND date BETWEEN '2025-01-01' AND '2025-03-31'
ORDER BY date;


-- -------------------------------------------------------
-- 6. Monday delay spike analysis
-- -------------------------------------------------------
SELECT
    TO_CHAR(date, 'Day')            AS day_of_week,
    EXTRACT(DOW FROM date)          AS dow_num,
    ROUND(AVG(delays_minutes)::numeric, 1) AS avg_delay,
    COUNT(*)                        AS sample_size
FROM driver_profiles
GROUP BY day_of_week, dow_num
ORDER BY dow_num;


-- -------------------------------------------------------
-- 7. Correlation proxy: accident rate vs avg rating by driver
-- -------------------------------------------------------
SELECT
    driver_id,
    ROUND((SUM(accidents_count)::float / COUNT(*))::numeric, 3) AS accident_rate_per_day,
    ROUND(AVG(rating)::numeric, 2)                              AS avg_rating
FROM driver_profiles
GROUP BY driver_id
ORDER BY accident_rate_per_day DESC;


-- -------------------------------------------------------
-- 8. Refresh materialized view (run after seeding or on schedule)
-- -------------------------------------------------------
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_summary;


-- -------------------------------------------------------
-- 9. Query materialized view directly (fast dashboard queries)
-- -------------------------------------------------------
SELECT * FROM mv_weekly_summary ORDER BY week_start;


-- -------------------------------------------------------
-- 10. Recommended indexes (already created by migration)
-- -------------------------------------------------------
-- CREATE INDEX idx_driver_date ON driver_profiles (driver_id, date);
-- Index on date alone for date-range filters:
-- CREATE INDEX idx_date ON driver_profiles (date);
