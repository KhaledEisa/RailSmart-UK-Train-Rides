# RailSmart — Build Phases

Development is split into clear phases. Each phase is self-contained and verified
before the next begins.

---

## Phase 1 — Cleanup & Notebook  ✅ COMPLETE

**Goal:** one clean repo, one correct notebook, results verified, comments that read
like a working analyst wrote them.

- [x] Deleted superseded / duplicate files (old April + May notebooks, duplicate
      timeline PDF). Backups kept in scratchpad.
- [x] Promoted the updated notebook to the canonical name
      `data_analysis_and_cleaning.ipynb` (now the only notebook).
- [x] Fixed data path (`railway.csv` → `data/railway.csv`).
- [x] Removed unused `catboost` import.
- [x] **Fixed real cleaning defect:** 20,918 blank Railcard values now filled as
      `'No Railcard'` (chosen over `'None'`, which pandas re-reads as NaN and would
      silently break the cleaned CSV on reload).
- [x] Documented the only legitimate remaining nulls (1,880 cancelled journeys never
      arrived → NaN arrival/duration/delay is correct).
- [x] Rewrote all 37 markdown cells to clean, plain-English analyst notes.
- [x] Stripped decorative emoji from code; comments now explain *why*, not *what*.
- [x] Notebook runs end-to-end (`nbconvert --execute`, exit 0); cleaned CSV verified.

**Verified dataset:** 31,653 rows · 42 columns · £741,921 revenue · 86.8% on time ·
7.2% delayed · 5.9% cancelled · 3.5% refunds.

---

## Phase 2 — Data Engineer Dashboard  ✅ COMPLETE

Recreated the luxury 3D-room dashboard from the reference image, on the real photo
background, driven entirely by **real UK data**.

- [x] Single React app restructured into role-based views (Data Engineer / Passenger /
      Station Manager) behind a top role switcher.
- [x] Glass KPI cards — 31,653 passengers · 86.8% on-time · £741.9K ticket value.
- [x] Regional performance bar — revenue by city (London £458.5K … Oxford £2.9K).
- [x] Seating-class panel — real Standard / First / First-Anytime split.
- [x] Ticket-sales trend with a **Monthly ↔ Weekly toggle** (real revenue).
- [x] All charts read `public/data/dashboard_data.json`, exported from the cleaned CSV.
- [x] Tuned the background overlay so the original baked-in numbers don't show through.
- [x] Builds clean (`npm run build`) and verified by screenshot.

**Run it:** `cd dashboard-web && npm install && npm run dev`

**Regenerate the figures** after any data change:
`python scripts/export_dashboard_data.py`

## Phase 3 — Passenger Site  ✅ COMPLETE

Built on the same cleaned dataset (`scripts/export_passenger_data.py` →
`public/data/passenger_data.json`).

- [x] Journey planner — pick origin/destination (only valid routes offered), real
      next departures, durations and on-time rates.
- [x] Prices & offers — real fares by ticket type, railcard 1/3-off toggle, plus the
      top advance-booking savings (e.g. Manchester Piccadilly→London Euston save £82 / 52%,
      from 201 Advance and 37 Anytime tickets). Offers now require at least 30 tickets on
      each side of the comparison: the previous headline (Liverpool→London Paddington,
      £113 / 62%) rested on just 6 Anytime fares across 27 journeys.
- [x] "When to leave home" — slider for door-to-station minutes → exact leave-by time.
- [x] Station crowdedness — per-station busyness-by-hour (Google-Maps "popular times"
      style) with a live Quiet/Moderate/Busy badge.
- [x] **AI person counting** — a synthetic platform clip with real person cut-outs,
      processed by a pretrained **YOLOv8** model (ultralytics); boxes + live count are
      drawn on the frames. Generator: `scripts/make_person_count_demo.py`
      (`run_person_count()` in the same file works on real CCTV footage).
- [x] Verified by screenshot (`docs/passenger_preview.png`,
      `docs/person_count_frame.png`).

## Phase 4 — Station Manager Site  ✅ COMPLETE

Operations console (`scripts/export_manager_data.py` → `public/data/manager_data.json`).

- [x] Fleet status table — 20 train sets with model, route, real on-time %, next
      departure and In Service / Delayed / Maintenance badges.
- [x] Maintenance queue with severity (Low / Medium / High).
- [x] Delay watch — the genuinely worst routes (e.g. Edinburgh Waverley → London Kings
      Cross at 0% on time), with risk badges.
- [x] Delay analytics — top causes and delay-rate by time-of-day (real).
- [x] Verified by screenshot (`docs/manager_preview.png`).

## Extras delivered

- [x] **Interactive 3D train** replaces the reference screenshot on the dashboard — a
      Three.js train on a turntable: drag to rotate, scroll to zoom, auto-rotate toggle,
      and four colour options (`src/components/TrainScene.jsx`). The room photo is gone.
- [x] **Data-quality fix (back into Phase 1):** the `Reason for Delay` column logged the
      same cause under different spellings (Signal Failure/Signal failure, Weather/Weather
      Conditions, Staffing/Staff Shortage). Now consolidated in the notebook, so cause
      counts aren't split across duplicate labels.

> All three role views live in one React + Vite + Tailwind app (`dashboard-web/`) behind
> a role selector. 3D via three / @react-three/fiber / drei.
