# -*- coding: utf-8 -*-
"""Export real dashboard series from the cleaned dataset to dashboard_data.json."""
import pandas as pd, json, os, io

# Repo root = parent of this scripts/ folder, so the script is portable.
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
d = pd.read_csv(os.path.join(REPO, "cleaned_data", "railway_cleaned.csv"))
d["JD"] = pd.to_datetime(d["Date of Journey"])

# ---- City mapping (group London termini etc.) -------------------------------
def city(station):
    s = str(station)
    for c in ["London", "Manchester", "Birmingham", "Liverpool", "Reading",
              "Oxford", "York", "Edinburgh", "Glasgow", "Leeds", "Bristol"]:
        if s.startswith(c):
            return c
    return s
d["DepCity"] = d["Departure Station"].map(city)

# ---- KPIs -------------------------------------------------------------------
on_time = (d["Journey Status"] == "On Time").mean() * 100
kpis = {
    "passengers": int(len(d)),
    "onTimeRate": round(on_time, 1),
    "ticketValue": float(d["Price"].sum()),
}

# ---- Regional performance (revenue by city, top 7) --------------------------
reg = (d.groupby("DepCity")["Price"].sum().sort_values(ascending=False).head(7))
regional = [{"region": k, "revenue": round(float(v))} for k, v in reg.items()]
top_region = regional[0]["region"]

# ---- Seating / fare classes -------------------------------------------------
# Standard and First partition the dataset. "First Class - Anytime" does not: it is a
# subset of First Class, so its share is quoted against First Class rather than against
# all sales. Quoting all three against the total made the three cards sum to 101.5%.
def cls_stats(mask, label, denom=None, subset_of=None):
    sub = d[mask]
    base = len(d) if denom is None else denom
    return {
        "label": label,
        "tickets": int(len(sub)),
        "revenue": round(float(sub["Price"].sum())),
        "avgPrice": round(float(sub["Price"].mean()), 2),
        "share": round(len(sub) / base * 100, 1),
        "shareOf": subset_of or "all sales",
    }

first_class = d["Ticket Class"] == "First Class"
seating = [
    cls_stats(d["Ticket Class"] == "Standard", "Standard Class"),
    cls_stats(first_class, "First Class"),
    cls_stats(first_class & (d["Ticket Type"] == "Anytime"),
              "First Class — Anytime",
              denom=int(first_class.sum()), subset_of="First Class"),
]

# ---- Trends -----------------------------------------------------------------
mo = d.groupby(d["JD"].dt.to_period("M"))
monthly = [{"label": p.strftime("%b"),
            "revenue": round(float(g["Price"].sum())),
            "tickets": int(len(g))} for p, g in mo]

wk = d.groupby(d["JD"].dt.to_period("W"))
weekly = [{"label": p.start_time.strftime("%d %b"),
           "revenue": round(float(g["Price"].sum())),
           "tickets": int(len(g))} for p, g in wk]

# ---- Extra context for other panels / roles ---------------------------------
status = d["Journey Status"].value_counts().to_dict()
out = {
    "generatedFrom": "cleaned_data/railway_cleaned.csv",
    "rows": int(len(d)),
    "dateRange": [d["JD"].min().strftime("%Y-%m-%d"), d["JD"].max().strftime("%Y-%m-%d")],
    "kpis": kpis,
    "topRegion": top_region,
    "regional": regional,
    "seating": seating,
    "trend": {"monthly": monthly, "weekly": weekly},
    "status": {k: int(v) for k, v in status.items()},
    "routes": int(d.groupby(["Departure Station", "Arrival Destination"]).ngroups),
    "stations": int(pd.unique(d[["Departure Station", "Arrival Destination"]].values.ravel()).size),
}

dest = os.path.join(REPO, "dashboard-web", "public", "data")
os.makedirs(dest, exist_ok=True)
with io.open(os.path.join(dest, "dashboard_data.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print("Wrote dashboard_data.json")
print(json.dumps({k: out[k] for k in ["kpis", "topRegion", "regional", "seating"]},
                 indent=2, ensure_ascii=False))
