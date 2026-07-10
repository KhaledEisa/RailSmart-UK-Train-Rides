# Tableau Dashboard — Build Sheet

Week 11 of the project plan names one deliverable: *"Tableau dashboard visualizing all
analysis and forecasting results."* This is the build order for it.

---

## Status of `Analysis UK.twb`

A workbook now exists in the repo root with nine KPI sheets (Total Revenue, Total Journeys,
Avg Ticket Price, On-Time Rate, Delay Rate, Cancellation Rate, Avg Delay When Delayed,
Network Avg Delay, Total Refund Requests) and one dashboard, *KPI Overview*.

Its calculations were checked and they are correct. In particular
`IIF([Is_Delayed] = 1, [Delay_Minutes], NULL)` properly excludes on-time journeys from the
average-delay measure — this is the right way round, and it is stricter than the Python
export was before it was fixed.

Two things to settle before you present:

1. **The connection uses an absolute path**
   (`D:/Downloads/YAT/project final/RailSmart-UK-Train-Rides/cleaned_data`). It will break
   on any other machine. Either re-point it at a relative path, or use
   **Server → Publish to Tableau Public**, or save as a packaged workbook (`.twbx`, via
   *File → Export Packaged Workbook*) which embeds the data.

2. **It connects directly to `railway_cleaned.csv`.** That works. The extracts below are
   optional — use them for the route, daily and compensation sheets, where they save you
   from rebuilding aggregates as calculated fields.

Still to build: the compensation-gap sheet (the headline), route reliability, delay causes,
delay-by-hour, demand trend, forecast, and booking behaviour. Sheets 2–9 below.

---

## Extracts

Everything the remaining sheets need already exists. Run once, then connect:

```bash
python scripts/export_tableau_extract.py
```

That writes four CSVs into `cleaned_data/tableau/`. Connect to them as **text file** data
sources. Do not connect to `railway_cleaned.csv` directly — its column names contain spaces
and it carries notebook intermediates that will clutter the field list.

---

## Data sources

| File | Grain | Use it for |
|---|---|---|
| `railway_fact.csv` | one row per journey (31,653) | KPIs, mix, slicing, anything filtered |
| `route_reliability.csv` | one row per route (65) | reliability table, worst-routes bar |
| `daily_series.csv` | one row per day (121) | trend line, forecast sheet |
| `compensation_gap.csv` | status × channel (4) | the unclaimed-compensation sheet |

`railway_fact.csv` already carries the flags that would otherwise be calculated fields:
`is_disrupted`, `is_delayed`, `is_cancelled`, `entitled_to_refund`, `unclaimed_value`.
Summing `unclaimed_value` over any filter gives the money left on the table for that slice —
this is the field the headline sheet is built on.

---

## Sheets to build, in order

### 1. KPI header — `railway_fact.csv`
Four big-number tiles across the top. Use a blank sheet each, or one sheet with four
measures on Text.

| Tile | Calculation |
|---|---|
| Journeys | `COUNT([Transaction Id])` → 31,653 |
| Revenue | `SUM([Price])` → £741,921 |
| On-time rate | `1 - AVG([Is Disrupted])` → 86.8% |
| Unclaimed | `SUM([Unclaimed Value])` → £133,568 |

Format the last tile in a warning colour. It is the number the whole deck hangs on.

### 2. The compensation gap — `compensation_gap.csv`
Two side-by-side bars: `SUM([Claimed])` vs `SUM([Never Claimed])`, and
`SUM([Claimed Value])` vs `SUM([Unclaimed Value])`. Colour by `journey_status`.

Title it with the finding, not the field names: **"73% of entitled passengers never claim."**

### 3. Revenue by route — `route_reliability.csv`
Horizontal bar, `route` on Rows sorted by `SUM([Revenue])` descending, top 15.
Expect London Kings Cross → York at £183,193.

### 4. Route reliability — `route_reliability.csv`
Same shape, measure `AVG([On Time Pct])` ascending, **filtered to
`meets_min_volume = 1`** (≥30 journeys). Without that filter, routes carrying 14–17 trips
outrank routes carrying thousands and the sheet measures sample noise. The same threshold
is used by notebook section 10.2 and the Station Manager dashboard, so all three agree.

Put the filter on the sheet as a visible caption: *"routes with ≥30 journeys."* A grader
will look for it.

**Do not plot `avg_delay_minutes` as zero where it is blank.** 33 of the 48 qualifying
routes never record a delay — every disrupted journey on them is a *cancellation*. London
St Pancras → Birmingham New Street, for instance, runs 3,471 journeys at 92.1% on time with
zero delays. Rendering that as "0 minutes average delay" reads as "never late", which is
the opposite of the truth. Filter nulls out of the bar, or label them explicitly.

### 5. Delay causes — `railway_fact.csv`
Bar of `COUNT()` by `delay_reason`, filtered to `is_disrupted = 1`.
Weather 1,372 · Signal Failure 970 · Staffing 809 · Technical Issue 707 · Traffic 314.

### 6. Delay rate by hour — `railway_fact.csv`
Bar of `AVG([Is Delayed])` by `departure_hour`. The 08:00 departure spikes to 33.4%.

### 7. Demand trend — `daily_series.csv`
Line of `SUM([Rides])` by `journey_date`, continuous. Add a constant reference line at the
mean (261.6). The point of this sheet is that the series is flat — no trend, and the
weekday cycle spans only ~11% of the mean.

### 8. Forecast — `daily_series.csv`
Right-click the date axis → **Forecast → Show Forecast**. Set forecast length to 30 days.

Tableau's exponential-smoothing forecast will land close to the mean, which agrees with the
SARIMA backtest in notebook section 14: on 121 days of stationary data no model beats a flat
line. Show the prediction interval, not just the point estimate.

Do not claim this forecast is accurate to a few percent. It is not, and section 14 says why.

### 9. Booking behaviour — `railway_fact.csv`
Histogram of `days_in_advance`. It collapses onto 0 and 1 — median lead time is one day,
89% of tickets are bought within two days, nothing is booked beyond 28 days.

This sheet exists to kill a question before it is asked: *no*, this dataset cannot support
"book 2–3 weeks ahead" advice.

---

## Assembling the dashboard

Two dashboards, not one. A single sheet stuffed with nine views reads as a screenshot dump.

**Dashboard 1 — "Network Performance"**
KPI header across the top, then delay causes and delay-by-hour side by side, route
reliability below. Filters: `month_name`, `ticket_class`, `origin`.

**Dashboard 2 — "Revenue & the Compensation Gap"**
KPI header, the compensation gap sheet as the hero, revenue by route beneath it, demand
trend and forecast at the bottom.

Wire `origin` and `month_name` as dashboard-level filters applied to **all sheets using this
data source**. Add one `journey_status` highlight action.

---

## Before you present

- Turn on tooltips that state the number in words. A judge hovering over the unclaimed bar
  should read "3,054 passengers never claimed — £133,568".
- Check every sheet has a title that states a finding, not a field name.
- Export each dashboard to PNG at 2× into `docs/` for the slides, in case the live
  connection misbehaves on the day.
- Publish to Tableau Public and put the link on the final slide with a QR code.

---

## Reconciliation

The extracts are checked against the notebook. If any of these drift, the export script and
the notebook have diverged and one of them is wrong:

| Figure | Value |
|---|---|
| Journeys | 31,653 |
| Revenue | £741,921 |
| Entitled to compensation | 4,172 |
| Claimed | 1,118 (26.8%) |
| Claimed value | £38,702 |
| Unclaimed value | £133,568 |
| Routes with ≥30 journeys | 48 |
