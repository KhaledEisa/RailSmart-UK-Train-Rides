# -*- coding: utf-8 -*-
"""Export Station-Manager / operations data to manager_data.json.

Real where the data supports it (status mix, delay reasons, route reliability,
delay-by-time-of-day). The fleet roster is simulated but *grounded* in each route's
real on-time rate, so a route that genuinely runs late shows trains at risk.
"""
import pandas as pd, numpy as np, json, os, io

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = pd.read_csv(os.path.join(REPO, "cleaned_data", "railway_cleaned.csv"))
rng = np.random.default_rng(11)

# ---- Real status mix --------------------------------------------------------
sc = d["Journey Status"].value_counts()
status_summary = {
    "onTime": int(sc.get("On Time", 0)),
    "delayed": int(sc.get("Delayed", 0)),
    "cancelled": int(sc.get("Cancelled", 0)),
    "total": int(len(d)),
}

# ---- Real delay reasons (delayed/cancelled journeys) ------------------------
dr = (
    d[d["Journey Status"].isin(["Delayed", "Cancelled"])]["Reason for Delay"]
    .replace("No Delay", np.nan)
    .dropna()
    .value_counts()
)
delay_reasons = [{"reason": k, "count": int(v)} for k, v in dr.items()]

# ---- Delay rate by time-of-day band ----------------------------------------
band_order = ["Morning Peak", "Midday", "Evening Peak", "Evening", "Night"]
dbt = d.groupby("Time_Of_Day", observed=True)["Is_Delayed"].mean().mul(100).round(1)
delay_by_tod = [{"band": b, "rate": float(dbt.get(b, 0))} for b in band_order if b in dbt.index]

# ---- Route reliability ------------------------------------------------------
# MIN_JOURNEYS is the one place the minimum-volume rule is defined. The notebook
# (section 10.2) and the Tableau workbook use the same threshold, so the three
# artefacts report the same route list.
MIN_JOURNEYS = 30

g = d.groupby(["Departure Station", "Arrival Destination"])
rel = pd.DataFrame({
    "journeys": g.size(),
    "delayed": g["Journey Status"].apply(lambda s: int((s == "Delayed").sum())),
    "cancelled": g["Journey Status"].apply(lambda s: int((s == "Cancelled").sum())),
    "onTime": g["Journey Status"].apply(lambda s: (s == "On Time").mean() * 100),
    "avgDelay": g.apply(lambda x: x.loc[x["Journey Status"] == "Delayed", "Delay_Minutes"].mean(), include_groups=False),
}).reset_index()
rel = rel[rel["journeys"] >= MIN_JOURNEYS].copy()
rel["onTime"] = rel["onTime"].round(1)

# 29 routes never record a delay — every non-on-time journey there is a cancellation.
# Filling their average delay with 0 would read as "these trains are never late" when
# the truth is "these trains don't run late, they get cancelled". Emit null instead
# and let the UI say so.
rel["avgDelay"] = rel["avgDelay"].round(0)
rel = rel.sort_values("onTime")
route_reliability = [
    {"from": r["Departure Station"], "to": r["Arrival Destination"],
     "journeys": int(r["journeys"]), "onTime": float(r["onTime"]),
     "delayed": int(r["delayed"]), "cancelled": int(r["cancelled"]),
     "avgDelay": None if pd.isna(r["avgDelay"]) else int(r["avgDelay"])}
    for _, r in rel.iterrows()
]

# ---- Simulated fleet, grounded in real route reliability --------------------
MODELS = ["Class 800 Azuma", "Class 390 Pendolino", "Class 802 Paragon",
          "Class 222 Meridian", "Class 158 Express", "Class 80x Nova"]
busy_routes = (
    d.groupby(["Departure Station", "Arrival Destination"]).size()
    .sort_values(ascending=False).head(12).index.tolist()
)
rel_lookup = {(r["Departure Station"], r["Arrival Destination"]): r["onTime"]
              for _, r in rel.iterrows()}
ISSUES = ["Brake pad wear", "HVAC fault", "Door sensor", "Pantograph check",
          "Wheel reprofiling", "Software update"]

fleet, maintenance = [], []
for i in range(20):
    frm, to = busy_routes[i % len(busy_routes)]
    on_time = float(rel_lookup.get((frm, to), 86.0))
    unit = 400 + i
    model = MODELS[i % len(MODELS)]
    roll = rng.random()
    # lower on-time routes are likelier to throw a delayed/maintenance status
    risk = (100 - on_time) / 100
    if roll < 0.12 + risk * 0.5:
        status = "Maintenance"
    elif roll < 0.30 + risk * 0.6:
        status = "Delayed"
    else:
        status = "In Service"
    dep_h = int(rng.integers(6, 22))
    rec = {
        "id": f"{model.split()[1]}-{unit}",
        "model": model,
        "route": f"{frm} → {to}",
        "status": status,
        "onTime": round(on_time, 1),
        "capacity": int(rng.integers(40, 99)),  # % seats sold next service
        "nextDeparture": f"{dep_h:02d}:{rng.choice(['00','15','30','45'])}",
    }
    if status == "Maintenance":
        issue = ISSUES[i % len(ISSUES)]
        sev = "High" if risk > 0.18 else rng.choice(["Medium", "Low"])
        rec["issue"] = issue
        maintenance.append({"id": rec["id"], "model": model, "issue": issue,
                            "severity": str(sev), "route": rec["route"]})
    fleet.append(rec)

# ---- Delay watch (worst real routes flagged for the manager) ---------------
delay_watch = [
    {"route": f'{r["from"]} → {r["to"]}', "onTime": r["onTime"],
     "avgDelay": r["avgDelay"], "journeys": r["journeys"],
     "risk": "High" if r["onTime"] < 84 else ("Medium" if r["onTime"] < 88 else "Low")}
    for r in route_reliability[:6]
]

out = {
    "statusSummary": status_summary,
    "delayReasons": delay_reasons,
    "delayByTimeOfDay": delay_by_tod,
    "routeReliability": route_reliability,
    "fleet": fleet,
    "maintenance": maintenance,
    "delayWatch": delay_watch,
}

dest = os.path.join(REPO, "dashboard-web", "public", "data")
os.makedirs(dest, exist_ok=True)
with io.open(os.path.join(dest, "manager_data.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False)
print(f"Wrote manager_data.json  (fleet {len(fleet)}, maintenance {len(maintenance)}, "
      f"reasons {len(delay_reasons)})")
