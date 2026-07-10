# RailSmart — Final Presentation Flow & Review

**Prepared for:** Khaled Eissa and team (Elsayed Elgohary, Rana Yasser, Rahma Nasser, Ahmed Shaaban)
**Format:** 20 min presentation + 10–15 min discussion
**Scored against:** DEPI Data Analysis track rubric
**Date:** 9 July 2026

---

## Part 1 — Review of the proposed sequence

Your proposed order was:

> Introduction → Problem Statement → Solution → Implementation → Python → Tableau → Power BI → Website → Mobile App → AI Model → Future Work (Egypt) → Conclusion

### Rating: **6 / 10 as a structure — but the instinct behind it is a 9**

You have the right *arc*. Almost everyone gets the arc wrong; you didn't. Opening with the
problem before the solution, and closing with a forward-looking Egypt slide before the
conclusion, is exactly how a mature deck is built. The failure is in the middle third,
and it is a fixable failure.

| Element | Score | Why |
|---|---|---|
| Opening arc (Intro → Problem → Solution) | 8 / 10 | Correct, conventional, works. Needs quantified pain, not adjectives. |
| "Implementation" as its own section | 3 / 10 | Redundant — five sections that follow are all named "Implementation." |
| Five parallel tool sections | 4 / 10 | This is a tool tour, not an analysis narrative. See Problem 1. |
| Placement of the AI/ML section (position 10) | 3 / 10 | Your models are a *core rubric item*, not a finale. See Problem 2. |
| Data & methodology coverage | 2 / 10 | Absent. On a data-analysis rubric this is the largest single loss. |
| Insights & business recommendations | 2 / 10 | Absent as a named section. This is the "so what" you are graded on. |
| Future Work (Egypt) | 9 / 10 | Genuinely differentiating. Keep it. Expand it. |
| Conclusion | 7 / 10 | Fine. Needs an explicit ask and a landing line. |
| Limitations / honest evaluation | 0 / 10 | Absent. With 10–15 min of Q&A this will be found for you. |
| Q&A and backup slides | 0 / 10 | Absent. Free marks left on the table. |

### The four structural problems

**Problem 1 — The middle is a tool tour, not a story.**
Five consecutive sections named "X Implementation / Results" means the audience hears the
same handful of insights five times wearing different clothes: once in matplotlib, once in
Tableau, once in Power BI, once in React, once on a phone. Nobody learns anything new after
the first pass, and you burn roughly nine minutes of a twenty-minute slot on repetition.

Tableau, Power BI, the website and the mobile app are not five findings. They are **one
finding**: *the cleaned dataset is good enough to drive four independent surfaces without
being reshaped.* That is a single, strong, one-slide architectural claim. Make it once, show
a 2×2 grid of screenshots, and spend the reclaimed time on the analysis you're actually
being graded on.

**Problem 2 — The sequence inverts the rubric.**
Your own `TASKS.md` defines the eight scored phases: data understanding, cleaning, EDA,
analysis questions, feature engineering, forecasting, dashboard, presentation. Your proposed
deck gives one section to all of Python (phases 1–6 compressed into a single block) and five
sections to presentation surfaces. You have inverted the weighting. A grader with a rubric
sheet needs to tick eight boxes; make the boxes findable.

Also: "AI Model" at position 10 conflates two unrelated things. The three scikit-learn
models on tabular data are a **rubric deliverable** and belong in the analysis act. The
YOLOv8 platform crowd-counting is a **bonus wow-factor** and belongs near the demo. Splitting
them makes both stronger.

**Problem 3 — There is no data slide, and your data work is your best work.**
The deck jumps Problem → Solution → Implementation with no dataset provenance and no cleaning
story. Yet the cleaning is the single most professional thing in this repository. Four
defects, the last of which is the best story in the project:

- 20,918 blank `Railcard` values filled as `'No Railcard'` — and specifically *not* `'None'`,
  because pandas re-reads the string `None` as `NaN` and would silently corrupt the cleaned
  CSV on every reload. That is a subtle, real bug that most juniors ship.
- The `Reason for Delay` column logged the same cause under colliding labels
  (`Signal Failure` / `Signal failure`, `Weather` / `Weather Conditions`,
  `Staffing` / `Staff Shortage`), splitting cause counts across duplicate categories and
  quietly corrupting every root-cause chart built on top of it.
- 1,880 nulls correctly **left as null** — cancelled journeys never arrived, so a NaN arrival
  time is the truthful value, not a gap to be filled.
- **The fix for the first bug silently created a second one.** Section 11.6 computed
  `Has_Railcard = df['Railcard'].notna()`. Once the blanks held the *string* `'No Railcard'`,
  `notna()` returned `True` for all 31,653 rows. Every passenger was labelled a railcard
  holder, the no-railcard median came out as `NaN`, and the notebook printed
  `Revenue gap per journey: £nan` — directly above a confident business recommendation.
  Now fixed by comparing against the value rather than for nullness. Real adoption is 33.9%,
  and holders pay 42.9% less on average.

That last bullet is worth a full minute on its own. "We fixed a data bug, and the fix
introduced a second bug downstream, and here is how we caught it" is the most senior thing
anyone will say in the room all day. Most teams hide that. Lead with it.

That is a slide. It is the slide that tells the panel you are an analyst and not a person who
ran `df.fillna(0)`. Right now it isn't in your deck at all.

**Problem 4 — You are missing your own headline number.**

Your notebook's "Revenue Leakage" section reports **£38,702** — the value of journeys where a
refund *was requested*. That measures what the railway paid out. It is the wrong quantity for
a passenger-facing product.

The right quantity, computed from your cleaned data:

- 4,172 journeys were disrupted (2,292 delayed + 1,880 cancelled) — **13.2%** of all journeys
- Of those, only **1,118 passengers claimed** a refund — **26.8%**
- **3,054 entitled passengers never claimed — 73.2%**
- Value of that unclaimed compensation: **£133,568**

£133,568 is **3.45× larger** than the £38,702 currently on your slide, and it is **18% of your
total £741,921 revenue**. It is also, precisely, the business case for the Refund Assistant
feature you built. Right now you have built the feature and left its justification out of the
deck.

**Lead with £133,568.** It is the strongest sentence you own: *"Three out of four UK rail
passengers who are owed money never ask for it. That's £133,568 across four months in one
dataset — and it's the reason RailSmart exists."*

---

## Part 2 — The recommended flow

Four acts, twenty minutes, ~22 slides. Minute budgets are cumulative and assume you rehearse
to them. The three slides marked **[CUT FIRST]** are your overflow buffer.

### Act 0 — Frame · 2:30 · 3 slides

| # | Slide | Budget | Content |
|---|---|---|---|
| 1 | Title | 0:20 | RailSmart · one-line value prop · five names · DEPI |
| 2 | **The Problem** | 1:10 | The £133,568 slide. Three stacked facts: 13.2% of journeys disrupted → 73.2% of entitled passengers never claim → £133,568 unclaimed in 4 months. No adjectives, no stock photos of sad commuters. |
| 3 | **The Solution + Architecture** | 1:00 | One diagram: `railway.csv` → cleaning → `railway_cleaned.csv` → four surfaces (Tableau / Power BI / Web / Mobile) + three personas (Passenger / Station Manager / Data Engineer). This single slide replaces both "Solution" and "Implementation" from your draft. |

> **Change from your draft:** "Solution" and "Implementation" merge into slide 3. You do not
> need a standalone Implementation section when five sections downstream are implementations.

### Act I — The Data · 4:00 · 4 slides *(rubric: weeks 1–3, 8)*

| # | Slide | Budget | Content |
|---|---|---|---|
| 4 | Dataset & data model | 1:00 | Provenance, 31,653 rows, 19 raw columns, 1 Jan – 30 Apr 2024 (121 days), data dictionary excerpt. State the date range out loud — it bounds every claim you make. |
| 5 | **Data quality: what was actually broken** | 1:30 | The four defects from Problem 3 above. Show the `notna()` cascade as a two-line before/after snippet — the fix that broke the next chart. This is your credibility slide. |
| 6 | Feature engineering | 1:00 | 19 → 42 columns. Name the six that matter: `Delay_Minutes`, `Days_In_Advance`, `Time_Of_Day`, `Route`, `Is_Weekend`, `Price_Per_Minute`. Say *why* each was derived, not just that it was. |
| 7 | Cleaning pipeline in SQL | 0:30 | **[CUT FIRST]** — `sql/Cleaning & Analysis.sql`, 362 lines. Shows tool breadth. Drop it if you're over time. |

### Act II — The Analysis · 6:00 · 6 slides *(rubric: weeks 4–7 — this is where the marks are)*

| # | Slide | Budget | Content |
|---|---|---|---|
| 8 | Punctuality baseline | 0:45 | 86.8% on time · 7.2% delayed · 5.9% cancelled. Frame the 13.2% disruption rate as the number that matters. |
| 9 | **Where the money leaks** | 1:15 | The £133,568 unclaimed, broken out: cancelled journeys claim at 30.4%, delayed at 23.8%. Online buyers claim at 28.6%, station buyers at 25.8%. Nobody who arrived on time ever claimed — the entitlement is entirely inside that 13.2%. |
| 10 | Why trains are late | 1:00 | Weather 1,372 · Signal Failure 970 · Staffing 809 · Technical 707 · Traffic 314. **Note: weather is your #1 cause, not signal failure.** Your README says signal failures are 42% — that is wrong and must be fixed before anyone reads it. |
| 11 | Route reliability | 1:00 | Worst routes by mean delay. Edinburgh Waverley → London Kings Cross at 0% on-time. Show the minimum-journey-count threshold you applied — a grader will ask. |
| 12 | The Urgency Tax | 1:00 | 38.3% premium for booking within 2 days. **State the caveat before they find it:** median lead time in this dataset is 1 day, 75th percentile is 1 day, max 28. So the "urgent" bucket holds most of your data and the comparison group is small. Say this yourself. |
| 13 | **Business recommendations** | 1:00 | Three actions, each with a £ figure attached. This is the most important slide in the deck and it does not currently exist. Example: *(1) Auto-claim: recover £133,568 / 4 months. (2) Weather-linked staffing on the 5 worst routes. (3) Nudge station-channel buyers — they claim 3pp less often than online buyers.* |

### Act III — Prediction · 4:00 · 4 slides *(rubric: weeks 9–10)*

| # | Slide | Budget | Content |
|---|---|---|---|
| 14 | **Forecasting** | 1:15 | SARIMA vs two naive benchmarks on 121 days. **The honest result: SARIMA cannot beat a flat mean** (rides 18.2% vs 18.4% MAPE; revenue 21.6% vs **20.5%** — the baseline wins). Demand is stationary, weekday spread is only 11% of the mean. Present that as the finding. Then give the 30-day projection with its 95% interval: 7,927 rides, £183,407. |
| 15 | Predictive models | 1:00 | Fare: MAE £2.75 on a £23.44 mean fare, R² 0.963 — and 79% of the signal is route, only 5% is booking lead time. Delay risk: ROC AUC 0.979, recall 0.657. Claim propensity: ROC AUC 0.860, recall 0.737. |
| 16 | **Honest model evaluation** | 1:15 | Baseline vs model, precision/recall/F1, confusion matrices. Plus the delay-vs-cancellation result below. **This slide wins your Q&A.** |
| 17 | AI vision — YOLOv8 crowd counting | 0:30 | 15-second clip, live person count on the platform. Label it clearly as an extension beyond the tabular rubric, not as one of your models. |

### Act IV — Delivery · 4:30 · 3 slides + demo

| # | Slide | Budget | Content |
|---|---|---|---|
| 18 | **Four surfaces, one dataset** | 1:00 | 2×2 screenshot grid: Tableau · Power BI · Web · Mobile. One arrow from `railway_cleaned.csv` to all four. Make the architectural claim once: *the same cleaned table drives every surface with no reshaping.* This replaces four of your proposed sections. |
| 19 | **LIVE DEMO** | 2:30 | Web app, three role views. QR code visible on screen the whole time. Rehearse this to the second — a demo that overruns eats your conclusion. |
| 20 | Mobile | 1:00 | Recorded clip. Explicitly say *"no QR for mobile — Expo Go needs the dev server on the same network"* before anyone asks. Owning a constraint reads as competence; being caught by it reads as an oversight. |

### Close · 3:00 · 3 slides

| # | Slide | Budget | Content |
|---|---|---|---|
| 21 | **Limitations & next steps** | 1:00 | 121 days of data, single synthetic-provenance dataset, no live API feed, models are baselines not production. Honesty is scored. It also pre-empts half the panel's questions. |
| 22 | **Future Work — Egypt** | 1:15 | See Part 5 below. |
| 23 | Conclusion + Q&A holding slide | 0:45 | Landing line, the ask, repo QR, team names. Leave this slide up for the entire discussion. |

**Then: 6–10 backup slides.** Not optional. See Part 4.

**Cumulative: 20:00.** Buffer comes from slides 7, 17, and 20 in that order.

---

## Part 3 — Fixes

**Status: P0-1, P0-3, P0-4, P1-6 and all of P2 are now done and verified.** The notebook
re-executes end to end (`nbconvert --execute`, exit 0). What follows records what was wrong,
what changed, and what is left.

### P0-1 · `README.md` contradicted the notebook — **fixed**

Anyone who opened your GitHub during Q&A would have found numbers disagreeing with your
slides. Every figure below has been corrected in place.

| README claimed | Cleaned data says |
|---|---|
| ~35% of journeys delayed | 7.2% delayed, 5.9% cancelled |
| 65% on-time rate | 86.8% |
| Average ticket price £38.50 | £23.44 (median £11.00) |
| Total revenue £1.2M+ | £741,921 |
| Dec 2023 – Jan 2024 | Journeys 1 Jan – 30 Apr 2024; purchases from 8 Dec 2023 |
| 100+ routes, 19 columns | 65 routes; 19 raw → 42 after feature engineering |
| Top delay cause: signal failures (42%) | Weather (1,372 of 4,172 = 32.9%) |
| Optimal booking window: 14–21 days | Median lead time **1 day**; 89% within 2 days; max 28 |
| Highest revenue route: London–Edinburgh (£85k) | London Kings Cross → York (£183,193) |
| Online booking 65% / contactless 48% / railcard 35% | 58.5% / 34.2% / 33.9% |
| Prophet, ARIMA, XGBoost, Flutter, FastAPI backend | statsmodels SARIMA, scikit-learn; React+Vite; no backend |

The booking-window claim was the dangerous one: the dataset contains **no journey booked more
than 28 days ahead**, so "book 14–21 days early" was unsupportable. It is gone. The
fabricated install instructions (`backend/`, `mobile-app/`, `psql railsmart_db`, demo
credentials) have been replaced with commands that actually run.

### P0-2 · Build the Tableau dashboard — **still outstanding, groundwork done**

`TASKS.md` Week 11 names it explicitly. It remains the one hard rubric item not delivered.
Since you're still installing Tableau, the data layer is now ready and waiting:

- `scripts/export_tableau_extract.py` writes four clean, reconciled CSVs to
  `cleaned_data/tableau/` — a tidy fact table plus route, daily and compensation aggregates.
- `docs/TABLEAU_BUILD.md` is a sheet-by-sheet build order with the expected number on every
  sheet, so you can verify as you go.

Budget one day. Nine sheets, two dashboards.

### P0-3 · Time-series forecasting was missing entirely — **built**

Notebook **section 14** now covers all three questions the plan asks, benchmarked properly.
The result is more interesting than a clean win:

| Series | Flat mean | Seasonal naive | SARIMA |
|---|---|---|---|
| Daily rides | 18.42% MAPE | 22.24% | **18.21%** |
| Daily revenue | **20.45%** | 23.21% | 21.65% |

**SARIMA barely edges the flat mean on rides and loses to it on revenue.** Over Jan–Apr 2024
demand is stationary: no trend, and a weekday cycle spanning only 11% of the mean. The
honest forecast of next month is the historical mean with a prediction interval — 7,927 rides
(95% CI 5,846–10,007) and £183,407 (95% CI £106k–£261k).

Ticket-class demand needs no separate model: First Class holds a 9.4–9.9% share every single
month. Class demand is the headline forecast times a fixed share.

Say all of this out loud. "We built the model, benchmarked it against a naive baseline, and
the baseline won — here is what that tells us about the data" is a stronger answer than any
accuracy figure you could have claimed.

### P0-4 · Bare accuracy on imbalanced targets — **fixed**

Every classifier now reports precision, recall, F1, ROC AUC and a confusion matrix beside the
majority-class baseline, via a shared `evaluate_classifier()` helper.

| Model | Old headline | Baseline | Now reported |
|---|---|---|---|
| Delay risk | 95.99% accuracy | 92.77% | AUC **0.979**, recall **0.657**, precision 0.794 |
| Refund (all journeys) | 97.54% accuracy | 96.46% | AUC 0.744, recall **0.304** — kept only as a counter-example |
| Claim propensity (new) | — | 73.17% | AUC **0.860**, recall **0.737**, precision 0.536 |

The delay model is genuinely good once you look past accuracy — AUC 0.979. It was being sold
short by the wrong metric.

### P1-5 · "Merge delayed and cancelled into one disruption target" — **I was wrong, and the real answer is better**

My first-pass advice was to retrain on `disrupted = delayed OR cancelled`, since
`Is_Delayed` is 0 for all 1,880 cancellations and a passenger-facing model shouldn't call a
cancelled train "fine". I tested it. **Merging makes the model measurably worse**, and the
reason is the most interesting modelling result in your project:

| Target | Base rate | ROC AUC | Recall |
|---|---|---|---|
| Delayed only | 7.7% | **0.98** | 0.68 |
| Cancelled vs rest | 5.9% | **0.73** | **0.00** |
| Disrupted (pooled) | 13.2% | 0.84 | 0.37 |

**Delays are structural** — specific routes at specific hours run late, repeatedly, and a
tree model learns that easily. **Cancellations are close to random** with respect to route and
time; the classifier never once predicts the positive class. Pooling them drags AUC from 0.98
down to 0.84 and halves recall, because you are asking one model to learn a strong pattern
and a nonexistent one simultaneously.

So RailSmart now ships **two signals, not one**: a delay-risk model accurate enough to warn
on, and a cancellation rate presented as a historical route statistic rather than a
prediction. Notebook section 13.3 shows the comparison.

This is a far better slide than the one I originally proposed. When a judge asks "why didn't
you just combine them?", you have the table.

### P1-6 · The refund model was near-circular — **fixed**

It predicted refunds from `Is_Delayed` + `Price` + `Ticket Class`. But **zero on-time
journeys ever produced a refund**, so the label was almost definitionally determined by
journey status. 97% accuracy against a 96.5% baseline, recall 0.304.

Notebook section 13.4 now trains **claim propensity on the 4,172 entitled passengers only**:
*among those owed money, who actually claimed?* AUC 0.860, recall 0.737 on a 26.8% positive
class. Delay minutes is the strongest driver. The naive model is retained beside it, labelled
as a counter-example, so the comparison is on the record.

Your weakest model is now your best slide, and it directly motivates the Refund Assistant.

### P2 · Polish — **all done**

- Fare-model feature importances now plotted: destination 0.57 + origin 0.22 = 79% of the
  signal; `Days_In_Advance` contributes 0.05. The fare is set by the route, not by when you
  book. Adding `Ticket Type` as a feature improved the model to MAE £2.75 / R² 0.963.
- `le = LabelEncoder()` was instantiated once and re-fit in a loop across five columns, so
  the encoder retained only the last column's mapping and `inverse_transform` was silently
  broken. Now one encoder per column, kept in an `encoders` dict.
- Splits are now stratified — with a 7% positive rate an unstratified split can skew the test
  set badly.
- Station names remain label-encoded to ordinal integers. Defensible for tree models: say
  "trees split on thresholds, so ordinal encoding of nominal categories is acceptable here"
  and you close the question before it opens.
- `data_summary.txt` was written with the platform default encoding, so every `£` came out
  mojibake. Now explicitly UTF-8.
- Added `requirements.txt` — the notebook now needs `statsmodels`.

---

## Part 4 — Q&A preparation

You have 10–15 minutes of discussion. That is longer than most acts of your presentation.
Build **6–10 backup slides**, kept after slide 23, and jump to them by number.

### Backup slides to build

1. Confusion matrices, all three models
2. Baseline-vs-model comparison table
3. Feature importances (price model)
4. Correlation heatmap
5. Full data dictionary (42 columns)
6. Complete cleaning log
7. Journey-count-per-route distribution (defends the reliability threshold)
8. The SQL cleaning queries

### The nine questions you will actually be asked

Rehearse a 20-second answer to each. Assign an owner per question. Every number below is now
in the notebook, so you can jump to it.

1. **"Your delay model is 96% accurate. What happens if it just predicts 'on time' every single time?"**
   → *"92.8%. So accuracy is the wrong metric and we don't quote it. On ROC AUC we're at
   0.979 with 0.657 recall — backup slide 2."* Answer this before they ask it, on slide 16.

2. **"What is the recall on delayed journeys?"** → **0.657**, at 0.794 precision. We catch
   about two thirds of real delays.

3. **"Is a cancelled train counted as delayed in your model?"**
   → *"No, deliberately. We tested pooling them and it made the model worse: AUC falls from
   0.98 to 0.84 and recall halves. Cancellations aren't predictable from route and time —
   AUC 0.73, and the classifier never predicts the positive class. So we ship delay as a
   prediction and cancellation as a historical route statistic."* This is your strongest
   possible answer to a hostile question. Have section 13.3 ready.

4. **"You predict refunds using delay status. Isn't that circular?"**
   → *"It was. No on-time journey in 31,653 rows ever generated a refund, so that model
   scored 97% against a 96.5% baseline by rediscovering a definition. We retrained on the
   4,172 entitled passengers only — claim propensity, AUC 0.860, recall 0.737. The naive
   version is still in the notebook, labelled as the counter-example."*

5. **"Median booking lead time is one day. How do you recommend booking 14–21 days ahead?"**
   → *"We don't. That claim was in an early README and it isn't supported — no journey in this
   dataset is booked more than 28 days out. It's been removed."*

6. **"121 days of history. How can you forecast a month?"**
   → *"Carefully, and we report that the naive baseline wins. SARIMA gets 18.2% MAPE on daily
   rides against 18.4% for a flat mean, and actually loses on revenue. The series is
   stationary. We forecast the mean with a 95% interval and say so."*

7. **"Your README says signal failures are the top delay cause. Your slide says weather."**
   → Fixed. Weather is 32.9% of disruptions, signal failure 23.3%.

8. **"Your railcard chart shows a £nan revenue gap."**
   → *"It did. `Has_Railcard` used `.notna()`, but we'd already filled the blanks with the
   string 'No Railcard', so every passenger was flagged a holder. Our own fix to one bug
   created another. We caught it, and real adoption is 33.9% — holders pay 42.9% less."*
   If you volunteer this one before they find it, you own the room.

9. **"Where is the Tableau dashboard your project plan promised?"**
   → Build it (P0-2). `docs/TABLEAU_BUILD.md` has the build order and the extracts are
   already generated.

---

## Part 5 — The Egypt slide

Keep it. It is the best idea in your outline and it is what the panel will remember. But it
currently has no content, and a vague Egypt slide in front of an Egyptian panel is worse than
no Egypt slide.

**Structure it as three honest columns, not a promise:**

**What transfers directly.** The cleaning pipeline, the feature engineering, the disruption
model, the claim-propensity model, the three role-based dashboards. None of it is
UK-specific. The schema is: ticket, route, scheduled vs actual, status, price.

**What does not transfer.** The refund mechanism. UK Delay Repay is a statutory scheme with
defined compensation thresholds; that legal scaffolding is what makes £133,568 of unclaimed
money a recoverable number. Egypt has no equivalent, so the Refund Assistant becomes a
*policy proposal* rather than a shipped feature. Say this. It shows you understand that a
data product lives inside a legal system, and that is a genuinely senior observation.

**What you would need.** Be concrete about the data you don't have: ticketing records with
scheduled *and* actual arrival times, at journey granularity, over at least twelve months.
Name the realistic starting point — a single high-density corridor rather than the whole
network — and name who would have to provide the data. The honest version of this slide is:
*"the analysis is portable; the data access is the hard part, and here is who we'd have to
talk to."*

**Do not quote Egyptian ridership or revenue statistics you cannot source.** You are
presenting to an Egyptian panel. They will know, and one unsourced number costs you more than
the slide gains. If you want a figure on that slide, cite it, with the source visible.

---

## Part 6 — Summary of changes to your original sequence

| Your draft | Recommendation |
|---|---|
| Introduction | Keep. Tighten to 20 seconds. |
| Problem Statement | Keep — **rebuild around £133,568 unclaimed.** |
| Solution | **Merge** with Implementation into one architecture slide. |
| Implementation | **Cut as a standalone section.** |
| Python Implementation / Results | **Expand into three acts:** Data (4 min) → Analysis (6 min) → Prediction (4 min). This is the rubric. |
| Tableau / Results | **Merge** into one "four surfaces" slide. |
| Power BI / Results | **Merge** into the same slide. |
| Website / Results | **Merge** into the same slide + live demo. |
| Mobile App / Results | **Merge** into the same slide + recorded clip. |
| AI Model / Results | **Split:** the 3 tabular models move to Act III (rubric). YOLOv8 stays near the demo (bonus). |
| — | **Add: Data Quality slide.** Your strongest technical evidence. |
| — | **Add: Business Recommendations slide.** The "so what." |
| — | **Add: Forecasting slide.** Missing rubric deliverable. |
| — | **Add: Honest Model Evaluation slide.** Wins the Q&A. |
| — | **Add: Limitations slide.** Honesty scores. |
| — | **Add: 6–10 backup slides.** You have 10–15 minutes of discussion. |
| Future Work (Egypt) | Keep. **Give it real content** — three columns, no unsourced figures. |
| Conclusion | Keep. Add an explicit ask. |

**Net effect:** the five tool sections collapse from roughly nine minutes to four, and the
reclaimed five minutes go into the analysis, forecasting and evaluation content that the DEPI
Data Analysis rubric actually scores.

---

## Immediate next actions

Done and verified — the notebook re-executes end to end, exit 0:

1. ~~Fix `README.md`~~ — every figure corrected; fabricated install steps replaced.
2. ~~Precision / recall / F1 / confusion matrices~~ — shared `evaluate_classifier()`, all models.
3. ~~Build the forecasting model~~ — section 14: SARIMA vs two baselines, 30-day projection
   with intervals, class-mix stability.
4. ~~Retrain refund → claim propensity~~ — section 13.4, on the 4,172 entitled passengers.
5. ~~Add the £133,568 analysis to the notebook~~ — section 10.4, reproducible from source.
6. ~~Fix `Has_Railcard`~~ — the `notna()` cascade; real adoption is 33.9%.
7. ~~Fix the `LabelEncoder` loop, add feature importances, stratify splits, UTF-8 the summary.~~
8. ~~Add `requirements.txt`~~ — the notebook now needs `statsmodels`.
9. ~~Regenerate the three dashboard JSONs~~ from the corrected CSV.

Still yours to do:

10. **Build the Tableau dashboard.** The one hard rubric item outstanding. Extracts are
    generated and `docs/TABLEAU_BUILD.md` has the sheet-by-sheet order. *(~1 day)*
11. **Finish the Power BI report** — same extracts work. *(teammates)*
12. **Deploy the website to Vercel** and generate the QR code for slide 19.
13. **Write the three business recommendations** for slide 13, each with a £ figure. Nobody
    can do this for you — it is the judgement the rubric is actually testing.
14. **Build the 6–10 backup slides.** Confusion matrices and the delay-vs-cancellation table
    are already rendered in the notebook; screenshot them straight out.
15. **Rehearse the demo to the second**, with the recorded video cued as a fallback.

---

## Appendix — verified figures

Every number the deck should quote, reconciled against `cleaned_data/railway_cleaned.csv`
and regenerated by the notebook.

| Figure | Value |
|---|---|
| Journeys | 31,653 |
| Columns | 19 raw → 42 engineered |
| Journey date range | 1 Jan – 30 Apr 2024 (121 days) |
| Routes | 65 (12 origins, 32 destinations) |
| Total revenue | £741,921 |
| Mean / median fare | £23.44 / £11.00 |
| On time / delayed / cancelled | 86.8% / 7.2% / 5.9% |
| Disrupted | 4,172 (13.2%) |
| Claimed a refund | 1,118 (26.8%) |
| **Never claimed** | **3,054 (73.2%)** |
| Refunds paid | £38,702 |
| **Unclaimed compensation** | **£133,568** (18.0% of revenue, 3.45× refunds paid) |
| Delay causes | Weather 1,372 · Signal 970 · Staffing 809 · Technical 707 · Traffic 314 |
| Worst hour | 08:00 departure, 33.4% delay rate |
| Worst route | Edinburgh Waverley → London Kings Cross, 0% on time (51 journeys) |
| Top revenue route | London Kings Cross → York, £183,193 |
| Busiest route | Manchester Piccadilly → Liverpool Lime Street, 4,628 journeys |
| Routes <50% on time (≥30 journeys) | 4 of 48 |
| Railcard adoption | 33.9%; holders pay 42.9% less |
| Booking lead time | median 1 day; 89% within 2 days; max 28 |
| Urgency tax | 38.3% (28,203 urgent vs 3,450 planned) |
| Advance vs Anytime | £17.61 vs £39.20 — saves £21.59 (55%) |
| Fare model | MAE £2.75, R² 0.963; route = 79% of signal |
| Delay model | AUC 0.979, recall 0.657, precision 0.794 (baseline 92.77%) |
| Cancellation model | AUC 0.726, recall 0.000 — not predictable |
| Claim propensity | AUC 0.860, recall 0.737, precision 0.536 (baseline 73.17%) |
| Forecast, next 30 days | 7,927 rides (CI 5,846–10,007); £183,407 (CI £106k–£261k) |
| Forecast honesty | SARIMA 18.21% MAPE vs flat mean 18.42% (rides); **loses** on revenue |
