# -*- coding: utf-8 -*-
"""Export passenger-facing data (routes, fares, timetable, station busyness)
from the cleaned dataset to dashboard-web/public/data/passenger_data.json."""
import pandas as pd, json, os, io

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = pd.read_csv(os.path.join(REPO, "cleaned_data", "railway_cleaned.csv"))
d["DepHour"] = pd.to_datetime(d["Departure Time"], format="%H:%M:%S").dt.hour

# ---- Stations (busiest first) ----------------------------------------------
vol = (
    pd.concat([d["Departure Station"], d["Arrival Destination"]])
    .value_counts()
)
stations = vol.index.tolist()

# ---- Per-station typical busyness by hour (Google-Maps "popular times") -----
station_hourly = {}
for st in stations:
    by_hour = (
        d[d["Departure Station"] == st]
        .groupby("DepHour")
        .size()
        .reindex(range(24), fill_value=0)
    )
    peak = by_hour.max() or 1
    station_hourly[st] = [round(v / peak * 100) for v in by_hour.tolist()]

# ---- Routes: fares, duration, real departure times -------------------------
routes = {}
for (frm, to), g in d.groupby(["Departure Station", "Arrival Destination"]):
    fares, fare_counts = {}, {}
    for tt, gg in g.groupby("Ticket Type"):
        fares[str(tt)] = round(float(gg["Price"].mean()), 2)
        fare_counts[str(tt)] = int(len(gg))
    times = sorted(g["Departure Time"].dropna().str.slice(0, 5).unique().tolist())
    on_time = round(float((g["Journey Status"] == "On Time").mean() * 100), 1)
    routes[f"{frm}->{to}"] = {
        "from": frm,
        "to": to,
        "journeys": int(len(g)),
        "avgPrice": round(float(g["Price"].mean()), 2),
        "fares": fares,
        "fareCounts": fare_counts,
        "avgDurationMin": int(round(float(g["Scheduled_Duration_Minutes"].mean()))),
        "departures": times,
        "onTimeRate": on_time,
    }

# ---- Offers: routes with the biggest Advance saving vs Anytime --------------
# Both fares are group means, so a route with four Anytime tickets can post a bigger
# "saving" than a route with hundreds. Requiring MIN_FARE_SAMPLE tickets on each side
# keeps the headline offer defensible: without it the top offer rested on 6 Anytime
# tickets across 27 journeys.
MIN_FARE_SAMPLE = 30

offers = []
for key, r in routes.items():
    f, n = r["fares"], r["fareCounts"]
    if "Advance" not in f or "Anytime" not in f:
        continue
    if n["Advance"] < MIN_FARE_SAMPLE or n["Anytime"] < MIN_FARE_SAMPLE:
        continue
    if f["Anytime"] <= f["Advance"]:
        continue
    saving = round(f["Anytime"] - f["Advance"], 2)
    offers.append({"from": r["from"], "to": r["to"],
                   "advance": f["Advance"], "anytime": f["Anytime"],
                   "saving": saving, "pct": round(saving / f["Anytime"] * 100),
                   "advanceTickets": n["Advance"], "anytimeTickets": n["Anytime"]})
offers = sorted(offers, key=lambda x: -x["saving"])[:6]

out = {
    "stations": stations,
    "stationHourly": station_hourly,
    "routes": routes,
    "offers": offers,
    "railcardDiscount": 0.3333,  # 1/3 off for Adult/Senior/Disabled railcards
}

dest = os.path.join(REPO, "dashboard-web", "public", "data")
os.makedirs(dest, exist_ok=True)
with io.open(os.path.join(dest, "passenger_data.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False)
print(f"Wrote passenger_data.json  ({len(stations)} stations, {len(routes)} routes, {len(offers)} offers)")
