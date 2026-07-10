# RailSmart — Web App

Single React + Vite + Tailwind app with three role-based views:

| Role | View | Status |
|------|------|--------|
| **Data Engineer** | Analytics dashboard with an interactive 3D train (drag/rotate/zoom), KPIs, regional revenue, seating classes, sales trend | ✅ Built |
| **Passenger** | Next train, prices, "when to leave", station crowdedness, YOLO AI person counting | ✅ Built |
| **Station Manager** | Fleet status, maintenance flags, delay watch | ✅ Built |

Switch roles from the top-right nav.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
```

## Data

Every **analytical** figure — KPIs, revenue, punctuality, route reliability, delay causes,
fares and offers — is computed from the cleaned dataset and exported to `public/data/*.json`.

Two things are **simulated**, and the app says so in its footer:

- the **fleet roster** (unit IDs, models, next departure, seats sold, maintenance issues) —
  invented, but each train's on-time rate is the real rate of the route it runs;
- the **live states** (In Service / Delayed / Maintenance), drawn with a probability that
  rises as a route's real on-time rate falls.

Regenerate after a data change:

```bash
python ../scripts/export_dashboard_data.py    # Data Engineer dashboard
python ../scripts/export_passenger_data.py    # Passenger site
python ../scripts/export_manager_data.py      # Station Manager
python ../scripts/sync_mobile_data.py         # copy the JSON into the Expo app
python ../scripts/make_person_count_demo.py   # YOLO person-counting demo clip
```

Two conventions the JSON encodes, which the UI relies on:

- `routeReliability[].avgDelay` is `null` for the 33 routes that record cancellations but
  never a delay. It is **not** `0` — those trains are not "never late", they are cancelled.
- `seating[].share` is a share of `seating[].shareOf`. *First Class — Anytime* is a subset
  of *First Class*, so its share is quoted against First Class, not against all sales.

## Structure

```
src/
  App.jsx                      role switcher + shell
  lib/data.js                  data hooks + GBP/number formatters
  components/TrainScene.jsx    interactive 3D train (three / r3f / drei)
  roles/
    DataEngineerDashboard.jsx  analytics dashboard + 3D train (real data)
    UserSite.jsx               passenger view
    StationManager.jsx         operations view
public/data/*.json             dashboard / passenger / manager figures
public/demo/station_count.mp4  YOLO person-counting demo clip
```
