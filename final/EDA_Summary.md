# EDA Summary — Driver Performance Data
## Week 3 · Lamina Studios · Jane Stephanie Sedano

---

## Dataset
- **50 drivers**, 90 days (Jan–Mar 2025), **4,500 rows**, no missing values
- Columns: `driver_id`, `date`, `delays_minutes`, `behavioral_problems`, `violations_count`, `accidents_count`, `rating`

---

## Key Findings

### 1. Delays are right-skewed
- Mean: **22.7 min**, Median: **21 min**
- Most days have moderate delays; occasional spikes reach 45–68 minutes
- These outliers are real operational events, not data errors

### 2. Ratings negatively correlate with accidents (r = -0.587)
- Strongest correlation in the dataset
- Drivers with even 1 accident per month see average rating drop by ~0.6 points
- Violations also correlate negatively with rating (r ≈ -0.30)

### 3. Delays spike on Mondays (~40% above weekday average)
- Average Monday delay: ~30+ min vs ~22 min on other days
- Consistent pattern across all 50 drivers
- Recommendation: lighter route loads or buffer time on Mondays

### 4. At-risk driver cluster (D046–D050)
| | At-Risk (5 drivers) | Normal Fleet (45 drivers) |
|---|---|---|
| Avg Rating | **3.70** | **4.36** |
| Violations (90d) | High | Low–moderate |
| Accidents (90d) | Elevated | Rare |
- These 5 drivers (10% of fleet) generate a disproportionate share of incidents
- **Immediate action recommended**: coaching, route reassignment, monitoring

### 5. Outlier drivers by violations (top 3)
1. D047, D048, D049 — highest total violations over 90 days
2. All three are in the at-risk cluster
3. Any driver with >1 accident in 30 days should trigger an automated intervention alert

---

## Recommendations

| Priority | Action |
|---|---|
| High | Schedule coaching sessions for D046–D050 immediately |
| High | Set up automated alert for accidents_count > 1 in rolling 30 days |
| Medium | Add Monday buffer scheduling (lighter routes, earlier start times) |
| Medium | Track delays per route — `R07` and `R09` show elevated average delays |
| Low | Build driver risk score ML model (see TechDoc Section 10) |

---

## Next Steps
- Expand dataset: add GPS coordinates, weather data, time-of-day granularity
- Build `driver_risk_scores` table updated nightly via ML pipeline
- Integrate risk scores into Metabase dashboard for manager alerts
