"""Reconcile every published artefact against cleaned_data/railway_cleaned.csv.

The project reports the same numbers in six places: the notebook, the three dashboard
JSONs, the Tableau extracts, and the mobile app's bundled copy of the JSON. They drift
whenever one is regenerated and another is not.

Run before presenting:
    python scripts/verify_consistency.py

Exits non-zero if anything disagrees, so it can gate a commit.
"""
import filecmp
import json
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
CLEANED = ROOT / "cleaned_data" / "railway_cleaned.csv"
WEB = ROOT / "dashboard-web" / "public" / "data"
MOBILE = ROOT / "mobile" / "src" / "data"
TABLEAU = ROOT / "cleaned_data" / "tableau"

MIN_JOURNEYS = 30  # must match export_manager_data.py and notebook section 10.2

failures: list[str] = []
checks = 0


def check(label: str, actual, expected, tol: float = 0.0) -> None:
    global checks
    checks += 1
    if isinstance(expected, (int, float)) and isinstance(actual, (int, float)):
        ok = abs(actual - expected) <= tol
    else:
        ok = actual == expected
    status = "ok  " if ok else "FAIL"
    print(f"  [{status}] {label:52s} {actual!r:>18} vs {expected!r}")
    if not ok:
        failures.append(f"{label}: got {actual!r}, expected {expected!r}")


def main() -> None:
    d = pd.read_csv(CLEANED)
    disrupted = d[d["Journey Status"] != "On Time"]
    unclaimed = disrupted[disrupted["Refund_Requested"] == 0]

    print("\n=== Ground truth: cleaned_data/railway_cleaned.csv ===")
    truth = {
        "rows": len(d),
        "revenue": round(float(d["Price"].sum())),
        "on_time": int((d["Journey Status"] == "On Time").sum()),
        "delayed": int((d["Journey Status"] == "Delayed").sum()),
        "cancelled": int((d["Journey Status"] == "Cancelled").sum()),
        "entitled": len(disrupted),
        "claimed": int(disrupted["Refund_Requested"].sum()),
        "unclaimed_value": round(float(unclaimed["Price"].sum())),
    }
    for k, v in truth.items():
        print(f"  {k:20s} {v:,}")

    # ── dashboard_data.json ──────────────────────────────────────────
    print("\n=== dashboard_data.json ===")
    dd = json.loads((WEB / "dashboard_data.json").read_text(encoding="utf-8"))
    check("rows", dd["rows"], truth["rows"])
    check("kpis.passengers", dd["kpis"]["passengers"], truth["rows"])
    check("kpis.ticketValue", round(dd["kpis"]["ticketValue"]), truth["revenue"])
    check("kpis.onTimeRate", dd["kpis"]["onTimeRate"],
          round(truth["on_time"] / truth["rows"] * 100, 1), tol=0.05)
    check("status.On Time", dd["status"]["On Time"], truth["on_time"])
    check("status.Delayed", dd["status"]["Delayed"], truth["delayed"])
    check("status.Cancelled", dd["status"]["Cancelled"], truth["cancelled"])
    check("monthly revenue sums to total", sum(m["revenue"] for m in dd["trend"]["monthly"]),
          truth["revenue"], tol=2)

    # Standard + First must partition the dataset; the third card is a subset.
    partition = [s for s in dd["seating"] if s["shareOf"] == "all sales"]
    check("seating partition tickets", sum(s["tickets"] for s in partition), truth["rows"])
    check("seating partition shares ~100%", round(sum(s["share"] for s in partition), 1), 100.0, tol=0.15)
    subset = [s for s in dd["seating"] if s["shareOf"] != "all sales"]
    check("seating subset declared", len(subset), 1)

    # ── manager_data.json ────────────────────────────────────────────
    print("\n=== manager_data.json ===")
    m = json.loads((WEB / "manager_data.json").read_text(encoding="utf-8"))
    ss = m["statusSummary"]
    check("statusSummary.total", ss["total"], truth["rows"])
    check("statusSummary.onTime", ss["onTime"], truth["on_time"])
    check("statusSummary.delayed", ss["delayed"], truth["delayed"])
    check("statusSummary.cancelled", ss["cancelled"], truth["cancelled"])
    check("delayReasons sum", sum(r["count"] for r in m["delayReasons"]), truth["entitled"])
    check("top delay reason", m["delayReasons"][0]["reason"], "Weather")

    g = d.groupby(["Departure Station", "Arrival Destination"]).size()
    check("routeReliability count", len(m["routeReliability"]), int((g >= MIN_JOURNEYS).sum()))
    check("all listed routes meet threshold",
          min(r["journeys"] for r in m["routeReliability"]) >= MIN_JOURNEYS, True)

    # avgDelay must be null (never 0) where a route records no delayed journey.
    bad = [r for r in m["routeReliability"] if r["delayed"] == 0 and r["avgDelay"] is not None]
    check("avgDelay null when no delays", len(bad), 0)
    bad2 = [r for r in m["routeReliability"] if r["delayed"] > 0 and r["avgDelay"] is None]
    check("avgDelay present when delays exist", len(bad2), 0)

    # ── passenger_data.json ──────────────────────────────────────────
    print("\n=== passenger_data.json ===")
    p = json.loads((WEB / "passenger_data.json").read_text(encoding="utf-8"))
    check("routes", len(p["routes"]), int(g.size))
    thin = [o for o in p["offers"]
            if o["advanceTickets"] < 30 or o["anytimeTickets"] < 30]
    check("offers all meet 30-ticket floor", len(thin), 0)
    check("offer saving = anytime - advance",
          all(abs(o["anytime"] - o["advance"] - o["saving"]) < 0.01 for o in p["offers"]), True)

    # ── Tableau extracts ─────────────────────────────────────────────
    print("\n=== cleaned_data/tableau/ ===")
    if not TABLEAU.exists():
        failures.append("tableau extracts missing — run scripts/export_tableau_extract.py")
        print("  [FAIL] extracts missing")
    else:
        fact = pd.read_csv(TABLEAU / "railway_fact.csv")
        gap = pd.read_csv(TABLEAU / "compensation_gap.csv")
        daily = pd.read_csv(TABLEAU / "daily_series.csv")
        route = pd.read_csv(TABLEAU / "route_reliability.csv")
        check("fact rows", len(fact), truth["rows"])
        check("fact revenue", round(float(fact["price"].sum())), truth["revenue"])
        check("fact unclaimed_value", round(float(fact["unclaimed_value"].sum())), truth["unclaimed_value"])
        check("gap entitled", int(gap["entitled"].sum()), truth["entitled"])
        check("gap claimed", int(gap["claimed"].sum()), truth["claimed"])
        check("gap unclaimed_value", round(float(gap["unclaimed_value"].sum())), truth["unclaimed_value"])
        check("daily rides sum", int(daily["rides"].sum()), truth["rows"])
        check("daily days", len(daily), 121)
        check("routes >= threshold matches manager",
              int(route["meets_min_volume"].sum()), len(m["routeReliability"]))

    # ── mobile copies ────────────────────────────────────────────────
    print("\n=== mobile/src/data (must byte-match the web exports) ===")
    for web_name, mob_name in [("dashboard_data.json", "dashboard.json"),
                               ("passenger_data.json", "passenger.json"),
                               ("manager_data.json", "manager.json")]:
        src, dst = WEB / web_name, MOBILE / mob_name
        same = dst.exists() and filecmp.cmp(src, dst, shallow=False)
        check(f"{mob_name} in sync", same, True)

    # ── verdict ──────────────────────────────────────────────────────
    print(f"\n{'-'*76}")
    if failures:
        print(f"{len(failures)} of {checks} checks FAILED:\n")
        for f in failures:
            print(f"  - {f}")
        print("\nIf a data file changed, re-run the export scripts then sync_mobile_data.py.")
        sys.exit(1)
    print(f"All {checks} checks passed. Every artefact agrees with the cleaned dataset.")


if __name__ == "__main__":
    main()
