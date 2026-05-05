"""
Synthetic driver performance dataset generator.
Produces driver_profiles.csv in the same directory.

Design decisions baked into the data:
- 50 drivers (D001-D050), 90 days (2025-01-01 to 2025-03-31)
- Monday delay spike: mean delays ~40% higher on Mondays
- 5 "at-risk" drivers (D046-D050) with elevated violations/accidents and lower ratings
- Negative correlation between rating and accidents_count (target r ≈ -0.45)
- Seeded for full reproducibility: numpy seed 42
"""

import numpy as np
import pandas as pd
from pathlib import Path

rng = np.random.default_rng(42)

DRIVERS = [f"D{i:03d}" for i in range(1, 51)]
AT_RISK = {"D046", "D047", "D048", "D049", "D050"}

ROUTES = [f"R{i:02d}" for i in range(1, 11)]
VEHICLES = [f"V{i:02d}" for i in range(1, 21)]
SHIFTS = ["morning", "afternoon", "night"]

start = pd.Timestamp("2025-01-01")
end = pd.Timestamp("2025-03-31")
dates = pd.date_range(start, end, freq="D")

rows = []

for driver_id in DRIVERS:
    is_at_risk = driver_id in AT_RISK
    route_id = rng.choice(ROUTES)
    vehicle_id = rng.choice(VEHICLES)

    for date in dates:
        is_monday = date.dayofweek == 0

        # delays_minutes: Poisson base, Monday spike, at-risk spike
        base_delay_mean = 20 if not is_at_risk else 35
        if is_monday:
            base_delay_mean = int(base_delay_mean * 1.4)
        delays_minutes = int(rng.poisson(base_delay_mean))

        # violations_count: low for normal, higher for at-risk
        viol_lambda = 0.3 if not is_at_risk else 1.2
        violations_count = int(rng.poisson(viol_lambda))

        # accidents_count: rare, higher for at-risk
        acc_lambda = 0.05 if not is_at_risk else 0.25
        accidents_count = int(rng.poisson(acc_lambda))

        # behavioral_problems: correlated with violations
        beh_lambda = 0.2 + violations_count * 0.15
        behavioral_problems = int(rng.poisson(beh_lambda))

        # rating: 1–5, negatively correlated with accidents_count and delays
        raw_rating = (
            4.5
            - accidents_count * 0.6
            - violations_count * 0.1
            - delays_minutes * 0.004
            + rng.normal(0, 0.2)
        )
        if is_at_risk:
            raw_rating -= 0.4
        rating = round(float(np.clip(raw_rating, 1.0, 5.0)), 2)

        shift = rng.choice(SHIFTS)

        rows.append(
            {
                "driver_id": driver_id,
                "date": date.strftime("%Y-%m-%d"),
                "delays_minutes": delays_minutes,
                "behavioral_problems": behavioral_problems,
                "violations_count": violations_count,
                "accidents_count": accidents_count,
                "rating": rating,
                "route_id": route_id,
                "vehicle_id": vehicle_id,
                "shift": shift,
            }
        )

df = pd.DataFrame(rows)

output_path = Path(__file__).parent / "driver_profiles.csv"
df.to_csv(output_path, index=False)

print(f"Generated {len(df):,} rows → {output_path}")
print(f"\nShape: {df.shape}")
print(f"\nSample stats:")
print(df[["delays_minutes", "violations_count", "accidents_count", "rating"]].describe().round(2))
print(f"\nAt-risk drivers avg rating: {df[df['driver_id'].isin(AT_RISK)]['rating'].mean():.2f}")
print(f"Normal drivers avg rating:  {df[~df['driver_id'].isin(AT_RISK)]['rating'].mean():.2f}")
corr = df["accidents_count"].corr(df["rating"])
print(f"\nCorrelation (accidents vs rating): {corr:.3f}  (target ≈ -0.45)")
