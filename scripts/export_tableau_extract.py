"""Build the CSV extracts that the Tableau workbook connects to.

Tableau can read cleaned_data/railway_cleaned.csv directly, but a few things make it
awkward as a live connection: the column names carry spaces, several columns are
intermediate artefacts of the notebook, and three of the dashboard's sheets need
aggregates that are slow to compute live over 31k rows on every filter change.

So this writes one tidy fact table plus three small pre-aggregated tables.

Run after any change to the cleaned dataset:
    python scripts/export_tableau_extract.py
"""
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "cleaned_data" / "railway_cleaned.csv"
OUT = ROOT / "cleaned_data" / "tableau"

# Columns Tableau actually needs, mapped to names that survive a CSV connection
# without Tableau inventing its own.
FACT_COLUMNS = {
    "Transaction ID": "transaction_id",
    "Date of Purchase": "purchase_date",
    "Date of Journey": "journey_date",
    "Purchase Type": "purchase_channel",
    "Payment Method": "payment_method",
    "Railcard": "railcard",
    "Has_Railcard": "railcard_flag",
    "Ticket Class": "ticket_class",
    "Ticket Type": "ticket_type",
    "Price": "price",
    "Departure Station": "origin",
    "Arrival Destination": "destination",
    "Route": "route",
    "Departure_Hour": "departure_hour",
    "Time_Of_Day": "time_of_day",
    "Journey_DayName": "day_name",
    "Journey_Month_Name": "month_name",
    "Is_Weekend": "is_weekend",
    "Days_In_Advance": "days_in_advance",
    "Booking_Style": "booking_style",
    "Journey Status": "journey_status",
    "Reason for Delay": "delay_reason",
    "Delay_Minutes": "delay_minutes",
    "Scheduled_Duration_Minutes": "scheduled_minutes",
    "Refund_Requested": "refund_requested",
}


def main() -> None:
    df = pd.read_csv(SRC)
    OUT.mkdir(parents=True, exist_ok=True)

    missing = set(FACT_COLUMNS) - set(df.columns)
    if missing:
        raise SystemExit(f"cleaned CSV is missing expected columns: {sorted(missing)}")

    fact = df[list(FACT_COLUMNS)].rename(columns=FACT_COLUMNS)

    # Booleans read as strings in Tableau unless they are genuinely 0/1.
    fact["refund_requested"] = fact["refund_requested"].astype(int)
    fact["is_weekend"] = fact["is_weekend"].astype(int)

    # Derived flags the workbook filters on constantly. Cheaper here than as
    # calculated fields recomputed on every interaction.
    fact["is_disrupted"] = (fact["journey_status"] != "On Time").astype(int)
    fact["is_delayed"] = (fact["journey_status"] == "Delayed").astype(int)
    fact["is_cancelled"] = (fact["journey_status"] == "Cancelled").astype(int)

    # A passenger can only claim if the journey was disrupted. Carrying the
    # entitlement explicitly keeps the "unclaimed" sheet a simple SUM.
    fact["entitled_to_refund"] = fact["is_disrupted"]
    fact["unclaimed_value"] = (
        fact["price"] * fact["entitled_to_refund"] * (1 - fact["refund_requested"])
    )

    fact.to_csv(OUT / "railway_fact.csv", index=False)

    # ── route reliability ────────────────────────────────────────────────
    # Minimum journey count so a route with three trips cannot top the table.
    route = (
        fact.groupby("route", observed=True)
        .agg(
            journeys=("price", "size"),
            revenue=("price", "sum"),
            on_time_pct=("journey_status", lambda s: (s == "On Time").mean() * 100),
            delayed_pct=("is_delayed", lambda s: s.mean() * 100),
            cancelled_pct=("is_cancelled", lambda s: s.mean() * 100),
            avg_delay_minutes=("delay_minutes", "mean"),
        )
        .round(2)
        .reset_index()
    )
    route["meets_min_volume"] = (route["journeys"] >= 30).astype(int)
    route.sort_values("revenue", ascending=False).to_csv(
        OUT / "route_reliability.csv", index=False
    )

    # ── daily series (feeds the trend + forecast sheets) ──────────────────
    daily = (
        fact.assign(journey_date=pd.to_datetime(fact["journey_date"]))
        .groupby("journey_date")
        .agg(
            rides=("price", "size"),
            revenue=("price", "sum"),
            disrupted=("is_disrupted", "sum"),
            refunds=("refund_requested", "sum"),
        )
        .reset_index()
    )
    daily["disruption_rate_pct"] = (daily["disrupted"] / daily["rides"] * 100).round(2)
    daily.to_csv(OUT / "daily_series.csv", index=False)

    # ── compensation gap (the headline sheet) ────────────────────────────
    disrupted = fact[fact["is_disrupted"] == 1]
    gap = (
        disrupted.groupby(["journey_status", "purchase_channel"], observed=True)
        .agg(
            entitled=("price", "size"),
            claimed=("refund_requested", "sum"),
            claimed_value=("price", lambda s: s[disrupted.loc[s.index, "refund_requested"] == 1].sum()),
            unclaimed_value=("unclaimed_value", "sum"),
        )
        .reset_index()
    )
    gap["never_claimed"] = gap["entitled"] - gap["claimed"]
    gap["claim_rate_pct"] = (gap["claimed"] / gap["entitled"] * 100).round(2)
    gap.to_csv(OUT / "compensation_gap.csv", index=False)

    print(f"Wrote Tableau extracts to {OUT.relative_to(ROOT)}/")
    print(f"  railway_fact.csv       {len(fact):>6,} rows x {fact.shape[1]} cols")
    print(f"  route_reliability.csv  {len(route):>6,} routes")
    print(f"  daily_series.csv       {len(daily):>6,} days")
    print(f"  compensation_gap.csv   {len(gap):>6,} rows")
    print()
    print(f"  entitled passengers    {len(disrupted):>6,}")
    print(f"  claim rate             {disrupted['refund_requested'].mean()*100:>6.1f}%")
    print(f"  unclaimed value        £{fact['unclaimed_value'].sum():>,.0f}")


if __name__ == "__main__":
    main()
