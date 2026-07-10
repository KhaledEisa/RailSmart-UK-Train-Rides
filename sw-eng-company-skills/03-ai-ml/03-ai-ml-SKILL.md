---
name: ai-ml-engineering
description: >
  AI/ML/NLP model development and deployment — from problem framing through
  data pipelines, training, experiment tracking, serving (batch / real-time
  API / on-device edge inference incl. accelerators like Hailo on Raspberry
  Pi), MLOps, production monitoring, and responsible-AI baseline. Trigger this
  skill when: scoping any feature described as "AI", "ML", "smart", or
  "automatic"; choosing between classical ML / deep learning / LLM API /
  fine-tuning; building or reviewing data or training pipelines; deploying or
  quantizing a model (cloud or edge/Echosense-type devices); setting up
  experiment tracking or a model registry; investigating model performance
  drops or drift; or handling training data that contains user camera/audio/
  PII. Extends ../00-core/00-core-SKILL.md — core rules apply unchanged; cites
  ../01-mobile/ (on-device inference, peripheral capture) and ../02-web/
  (decoupled Python API row in §A1) at the seams. Monitoring/CI-CD
  *infrastructure* is deliberately deferred to ../04-delivery/ — this file
  defines WHAT to gate and watch, not the runners/dashboards.
metadata:
  version: 1.0.0
  owner: sw-eng-company-skills
  extends: ../00-core/00-core-SKILL.md
  status: active
---

# AI / ML / NLP Engineering

**Precedence:** `00-core` applies by default — ML code is still code (SOLID,
reviews, trunk-based git, ADRs). The extra discipline ML adds: **data and
models are versioned artifacts with lineage, and "works" is a measured
threshold, not a feeling.** Framing, model approach, and serving target are
ADR-worthy (core §6).

Handoff markers used below: **[→04-delivery]** = defined here, implemented/
extended in `../04-delivery/` — do not duplicate there, reference this section.

---

## 1. Problem Framing — before any model work

**Rule zero: build the no-ML baseline first** (heuristic, rules, SQL, regex).
It ships in days, becomes the benchmark any model must beat by a stated margin,
and surprisingly often *is* the deliverable (core §1 KISS). No baseline = no
model project.

Then walk this ladder top-down; stop at the first rung that meets the target
metric:

| Rung | Use when | Cost profile |
|---|---|---|
| **Heuristics/rules** | Logic is expressible by a domain expert; edge cases enumerable | Days. Zero serving cost. Always rung 1. |
| **Classical ML** (gradient boosting/linear/tree on engineered features) | Tabular/structured data; labeled rows ≤ ~1M; interpretability wanted; CPU serving | Days–weeks. Trivial serving. Beats deep nets on most tabular problems — don't skip this rung out of boredom. |
| **Off-the-shelf model or LLM API** | Language/vision task a foundation model already does (extraction, summarization, classification, OCR, transcription); volume where per-call pricing works | Days. Cost scales per call **[→04-delivery** cost monitoring**]**; adds a vendor dependency (wrap it — core §2 Adapter). |
| **Fine-tuning a pretrained model** | Off-the-shelf output is close but wrong in a *consistent* way (domain vocabulary, output format, custom classes); OR per-call economics/latency/privacy rule out the API at your volume; needs 100s–10k labeled examples | Weeks. You now own training + eval + serving. |
| **Deep learning, custom training** | Unstructured data (vision/audio/signals) with a task no pretrained head covers; 10k+ labeled examples or a labeling budget | Weeks–months. Full MLOps burden (§6–7). |
| **Novel architecture from scratch** | Research setting or genuinely novel modality/constraint. In a small studio: almost never — requires an ADR arguing why every rung above fails. | Months. Don't. |

**Client project vs SaaS product modifier:**
- **Client (budget-capped):** bias 2 rungs toward buy — LLM API / off-the-shelf
  with per-call costs passed through and named in the contract (`../05-business/`).
  Custom training only if the client funds data labeling *and* a maintenance
  contract — an unmaintained custom model is technical debt you hand them (§7).
- **SaaS (long-term owned):** owning a fine-tuned/custom model can be the moat;
  amortize training over the product's life. Still start on the API rung to
  validate demand, and design the adapter seam so swapping API → own model later
  is a config change, not a rewrite.

**Kill criteria, agreed before starting:** target metric + evaluation set +
deadline. If the model can't beat the baseline by the stated margin by the
deadline, ship the baseline and stop. Write this in the project plan.

---

## 2. Model Selection

**Default: reuse a pretrained model.** Custom architectures need an ADR.

| If… | Use |
|---|---|
| Vision — detection/segmentation on common object classes | **YOLO family** (e.g. YOLOv8) fine-tuned on your classes — proven, and edge-compiler support is broad (see edge rule below). |
| Vision — classification/embedding | timm/torchvision backbone, fine-tune the head first, unfreeze deeper only if the gap demands it. |
| Audio — speech | Whisper-class model (API or self-hosted by §1 economics); keyword spotting on-device → small conv/CRNN models designed for MCU/NPU targets. |
| Embeddings/similarity/search | sentence-transformers or hosted embedding API — never train embeddings from scratch for search. |
| Tabular | Gradient boosting (XGBoost/LightGBM) before any neural approach. |

**Edge-target rule (Echosense-class projects): check compiler/op support BEFORE
committing to an architecture.** The Hailo Dataflow Compiler (and TFLite/Core ML
delegates on mobile) support a finite op set — an exotic head or activation
that won't compile discovers itself *after* training if you skip this. Pick
architectures with known-good ports for the target (YOLOv8 on Hailo is a
supported, documented path); prototype the **export → compile → run-on-device**
pipeline with the *untrained* model in week 1, not after training.

### NLP specifically — prompting vs RAG vs fine-tuning
Walk in order; combine rungs when indicated (RAG + fine-tune is legitimate;
each addition needs its own eval evidence):

```
1. PROMPTING an LLM (+ few-shot examples, structured output)
   → Always the first attempt. If prompt eng. hits the metric: done.
2. + RAG (retrieval over your corpus)
   → When failures are KNOWLEDGE failures: private/domain corpus, freshness,
     "cite the source" requirements, hallucinated facts.
     RAG is a search problem first — eval retrieval (recall@k) separately
     from generation; bad retrieval poisons everything downstream.
3. + FINE-TUNING (LoRA/QLoRA on an open-weight model, or provider fine-tune)
   → When failures are BEHAVIOR failures despite good context: output
     format/style/schema compliance, domain jargon, a classification/
     extraction task where you have 500+ labeled examples — or when
     latency/per-call cost/on-prem privacy forces owning the model (§1).
   ✗ NOT for adding knowledge — facts belong in RAG; fine-tuning bakes
     stale knowledge in and drifts (§7).
4. Classical NLP baseline (TF-IDF + linear / spaCy pipelines)
   → Run it anyway for classification tasks: minutes to train, and it
     regularly embarrasses LLM pipelines on narrow high-volume tasks at
     1/1000th the serving cost.
```
LLM API integrations: wrap the provider behind your own interface (core §2
Adapter — providers/models WILL be swapped), pin model versions explicitly
(never "latest" in prod), and build the eval set (§9) before the prompt — 20
graded examples beat 200 prompt tweaks.

---

## 3. Data Pipeline Standards

Data is a versioned dependency (core §5 A06 thinking applied to datasets).

- **Versioning: DVC** *(default — data + model artifacts tracked alongside git,
  remotes on object storage)*. Every training run references an exact data
  version hash (§4). lakeFS/Delta only when a client's platform already has it.
- **Validation at ingestion, in CI:** schema + distribution checks (pandera or
  Great Expectations) — types, ranges, null rates, class balance, image
  dimensions/corruption, sample-rate for audio. A pipeline that accepts
  garbage silently is how models rot **[→04-delivery** runs these in the
  pipeline; checks are defined here**]**.
- **Labels are data too:** versioned with the dataset; labeling guideline doc
  in the repo; spot-check inter-annotator agreement on a sample before
  trusting a labeled set (including your own labels).

### Split discipline
- Split **before** any fitting/preprocessing; persist split membership as data
  (an ID list under DVC), never re-derive with a seed at runtime.
- **Group-aware splits:** all samples from one user/device/session/recording
  stay in ONE split. Echosense: frames from the same capture session are
  near-duplicates — random frame-level splits inflate metrics 10+ points and
  the lie surfaces in production.
- **Temporal data:** train on past, validate on future (rolling windows). A
  random split on time series is leakage by construction.
- **Test set is sacred:** frozen, versioned, touched only for final evaluation
  and §6 gates. Tuning against it converts it into a validation set — grow a
  fresh test set from new data if that happens.

### Leakage prevention checklist — review before trusting any metric
- [ ] Transforms (scalers, encoders, vocab, augmentation stats) fitted on train only, inside the pipeline (sklearn `Pipeline`/equivalent), never on the full dataset.
- [ ] No feature derived from the target or from post-outcome information ("time-travel" features).
- [ ] Near-duplicate detection across splits (hash + perceptual/embedding similarity for images and text).
- [ ] Group/session leakage ruled out (above).
- [ ] Metric "too good"? Assume leakage until disproven — sudden +10 pt jumps are bugs, not breakthroughs.

---

## 4. Experiment Tracking & Reproducibility

**Tool: MLflow** *(default — self-hostable, includes the §6 registry)*; W&B
when collaboration UX matters more than self-hosting. One project = one
tracking store.

**Every tracked run logs:** git commit (clean tree — uncommitted-changes runs
don't count), DVC data version hash, full hyperparameters/config file, pinned
environment (lockfile or container digest), hardware, metrics per epoch +
final eval incl. §8 slices, and artifacts (model + eval plots + confusion
matrices/error samples).

**Reproducibility bar:** anyone on the team re-runs any tracked experiment
with one command (`dvc repro` / `make train CONFIG=...`) and lands within
run-to-run noise. Set all seeds (python/numpy/framework); accept that GPU
nondeterminism means "within noise," not bit-identical — record variance across
3 seeds for headline results rather than chasing determinism.

**Notebook rule — when exploration must graduate:** ad-hoc notebooks are fine
for EDA, error analysis, and prototyping. A result must graduate to a tracked,
committed script/pipeline the moment it **influences a decision** — the model
might ship, the number goes in a client report, or another experiment will be
compared against it. *If it's worth reporting, it's worth tracking.* Notebooks
never ship to production paths, and a notebook metric is a rumor, not a result.

---

## 5. Serving & Deployment Patterns

| Pattern | Use when | Notes |
|---|---|---|
| **Batch/offline scoring** | Predictions tolerate staleness (nightly recommendations, precomputed embeddings, report enrichment) | Cheapest, simplest, most underused. A cron + script beats an always-on GPU API nobody queries at 3 a.m. (core §1 KISS). |
| **Real-time API** | Interactive product features; caller is the web/backend layer | **Python service (FastAPI) behind the versioned REST boundary from `../02-web/` §A1's ML-backend row — no shared runtime with the web app.** Model loaded from the §6 registry by version, `/health` + model-version header on responses, request/latency budget stated in the API contract. GPU only if measured latency demands it. |
| **Streaming/near-real-time** | Continuous signal scoring (sensor/event streams) server-side | Queue-consumer (core §3 event-driven row) with the same registry/version rules as the API. |
| **On-device / edge inference** | Privacy (footage never leaves device), offline operation, latency, or bandwidth economics — Echosense-class: **camera/audio inference belongs on the device**; mobile on-device per `../01-mobile/` §5 camera pipeline | Device runs a *compiled artifact* of the model (below). Aligns with mobile §5's rule: the peripheral owns capture AND inference; it ships events/detections upstream, never raw streams. |

### Edge deployment (Pi + accelerator, mobile NPU) — the Echosense path
Pipeline: **train (PyTorch) → export ONNX → compile per target → validate on
device**. Targets: Hailo DFC → `.hef` (Pi + Hailo-8/8L); TFLite / Core ML for
phones (`../01-mobile/`). The compiled artifact is a build output: versioned
in the registry (§6) alongside its source checkpoint, with lineage.

**Quantization (INT8 is the norm on edge accelerators — Hailo requires it):**
- Calibration set: a few hundred samples drawn from the **real deployment
  distribution** (actual device camera, actual mounting angle/lighting — not
  clean training images). A bad calibration set silently costs more accuracy
  than the quantization itself. Version it under DVC like any dataset.
- **Accuracy budget declared before quantizing** (e.g. "≤1.5 pt mAP drop vs
  FP32 on the frozen test set"); measure FP32 vs INT8 on the same test set —
  exceeding budget → quantization-aware training or per-layer mixed precision,
  not a shrug.
- Measure latency/throughput/power **on the physical target device** at
  realistic input rates — dev-machine numbers are fiction; thermal throttling
  on a Pi in an enclosure is part of the benchmark (§9).
- Precision ladder: FP32 (server default) → FP16 (GPU, usually free) → INT8
  (edge norm, needs calibration + eval) → INT4/binary (only under extreme
  power/memory pressure, expect visible accuracy cost).

**Fielded-device model updates:** signed + versioned model artifacts, delivered
via the device's update channel, staged rollout, device keeps previous model
for instant local rollback; device reports model version in telemetry
(mobile §5's append-only telemetry rule) **[→04-delivery** owns the fleet
update/delivery mechanism; artifact + rollback requirements are defined here**]**.

---

## 6. MLOps — Registry, CI/CD Gates, Rollback

**Registry (MLflow Model Registry, default):** every production-bound model is
a registered version carrying lineage — training-run ID → code commit + data
version + config — plus stage (`staging`/`production`/`archived`) and, for
edge, the compiled artifacts per target. **No lineage, no deploy** — an
unreproducible model in production is an unpayable debt.

**"Tests" for a model change — the promotion gate (all must pass to reach
staging; run in CI on the training pipeline output):**
- [ ] **Data validation** (§3 checks) passed on the training snapshot.
- [ ] **Offline eval ≥ current production model** on the frozen test set — headline metric within/above threshold AND no §8 slice regresses beyond its stated tolerance (aggregate wins hiding slice losses is the classic silent failure).
- [ ] **Behavioral/golden tests:** curated must-pass cases with expected outputs (canonical detections, known-hard negatives, past production failures promoted to goldens — the ML twin of core §4's regression-test rule).
- [ ] **Latency/resource benchmark on target hardware** within the §5 budget (API: p95 under load; edge: on-device fps/power).
- [ ] **Serving contract test:** model loads in the serving image/device runtime, I/O schema matches the API contract (`../02-web/` A3), health check passes.

Staging → production: **shadow or canary** (shadow-score live traffic or route
a small slice), compare against production model on §7 metrics before full
promotion **[→04-delivery** owns pipeline runners, canary infra, deploy
automation**]**.

**Rollback:** previous registered version stays warm-deployable; rollback is a
pointer flip (API: re-deploy prior version in minutes; edge: device-local
previous artifact, §5). Rollback triggers — sustained §7 metric breach, slice
failure reported from the field, latency/stability regression. **Roll back
first, diagnose second** (a bad model in production is an incident, not a
debugging session). Post-rollback: the failure case becomes a golden test
before the next promotion attempt.

---

## 7. Monitoring & Retraining Triggers

This section defines **what to watch and when to act**. Dashboards, alert
routing, and uptime/infra monitoring are `../04-delivery/`'s to implement —
it should extend this list, not invent a parallel one. **[→04-delivery]**

**Two drifts, different detection:**
- **Data drift** — input distribution shifts (new device placement, seasonal
  lighting, new user demographics, upstream schema change). Detectable
  **without labels**: PSI/KS tests on features, embedding-distribution
  distance for images/text, prediction-confidence histogram shift, class-
  distribution shift in outputs.
- **Concept drift** — the input→output relationship changed (user behavior,
  the thing being detected evolved). Needs **labels or proxies**: delayed
  ground truth, user corrections/overrides, downstream acceptance rates.

**Watch in production (per deployed model):**
- [ ] Prediction distribution + confidence histograms vs a training-time reference window.
- [ ] Input-quality signals — Echosense-type: camera brightness/blur/occlusion score, audio SNR, sensor dropout rate (cheap to compute on-device, shipped in telemetry per mobile §5).
- [ ] Proxy label streams: user corrections, override/ignore rate, complaint tickets tagged to model outputs.
- [ ] Slice metrics (§8) wherever proxies allow — aggregate health hides segment failure.
- [ ] System metrics (p95 latency, error rate, GPU/NPU utilization, per-call vendor cost for API rungs) — infra-owned **[→04-delivery]**, but thresholds set here.

**Offline (scheduled, e.g. monthly):** re-evaluate the production model on
freshly labeled recent data — the only true concept-drift measurement; budget
a small continuous labeling trickle for it (client contracts: this is a
maintenance line item, `../05-business/`).

**Retrain vs noise decision:**
```
Signal on ONE window / one day?        → Investigate, don't retrain.
                                          Upstream data bug or broken sensor
                                          is likelier than drift (check §3
                                          validation + input-quality signals
                                          first).
Sustained ≥3 windows AND localized     → Targeted fix: collect/label that
to a slice/segment?                       segment, augment, fine-tune.
Sustained AND broad AND fresh-data     → Retrain on refreshed window.
eval confirms degradation?
Metric moved but product/proxy         → Recalibrate thresholds; retraining
outcomes fine?                            chases noise.
```
**A retrain is a full §6 deploy** — same gates, same canary, same rollback
readiness. Never hot-patch a model. If drift recurs on a rhythm (seasonal),
schedule retraining proactively instead of firefighting it.

---

## 8. Responsible AI — Small-Studio Baseline

Right-sized: not enterprise governance boards — a checklist that fits in a
sprint and is actually run.

- **Slice evaluation (mandatory, every model):** headline metrics broken out by
  the segments where failure is plausible or harmful — Echosense-type vision:
  lighting conditions, distance/angle, skin tones if people are detected,
  device placements; NLP: language/dialect/register; tabular: any protected or
  proxy attribute present. Slices go in the §6 gate with per-slice tolerances.
- **Model card (one page, in the repo, per shipped model):** intended use +
  explicit non-uses, training-data summary, eval results incl. slices, known
  limitations/failure modes, version + owner. Doubles as client deliverable
  and your liability record.
- **Explainability, keyed to stakes:** model output affects a person's money,
  access, or standing (pricing, eligibility, moderation, hiring-adjacent) →
  prefer the interpretable rung (§1 classical) or attach feature attributions
  (SHAP-class), AND a human-review/override path — "the model said so" is
  never a client-facing answer. Low-stakes perception tasks (is a bird at the
  feeder) → confidence + easy user correction suffices.
- **Human-in-the-loop rule:** any irreversible or high-cost action triggered by
  a model prediction gets a confidence threshold below which it degrades to
  human review, from v1.

### Training-data privacy (camera/audio from real users — Echosense-relevant)
**Core §5's privacy waiver rule applies: this GDPR-grade default holds
regardless of client market and can only be waived per-client via an explicit
signed contract clause — never loosened silently for convenience.**
- [ ] **Legal basis + consent before collection**, stated in plain language: what's captured, what it trains, retention, opt-out. Consent UX is a product feature, not fine print (GDPR-grade rules assumed by default; camera/audio of people is personal data, period).
- [ ] **Minimize at the edge:** prefer on-device inference shipping *events*, not media (§5). When raw media must be collected for training: explicit separate opt-in, sampled not continuous, retention limit enforced by deletion jobs — not policy documents.
- [ ] De-identify where compatible with the task (face blur, voice anonymization for non-speech tasks); strip EXIF/GPS/device IDs at ingestion.
- [ ] Training datasets live in access-controlled storage (core §5 secrets/least-privilege rules apply to data stores); no user media in experiment-tracking artifacts or git.
- [ ] **Cross-client wall:** never train on client A's data for client B — or for your own SaaS — without an explicit contract clause (data ownership + model-IP terms live in `../05-business/`).
- [ ] Deletion requests propagate: user data removal → flagged for exclusion from future training sets (versioned datasets make the audit possible — §3).

---

## 9. Testing — Pre-Deploy vs Monitor-Only

Core §4's pyramid applies to the *code*; the *model* adds a layer with a hard
epistemic boundary — know which side of it a given quality question sits on:

**Testable pre-deployment (CI-gateable, deterministic):**
- Data validation suite (§3) — schema, distributions, leakage checks.
- **Pipeline unit tests:** feature transforms, pre/post-processing, NMS/decode
  logic, tokenization — pure functions, test exhaustively incl. malformed
  input (the exact analogue of mobile §7's BLE-codec rule; most "model bugs"
  in production are preprocessing-mismatch bugs between training and serving).
- Training smoke test: 1-epoch run on a tiny fixture dataset completes, loss
  decreases, artifacts land (catches broken pipelines cheaply, in CI).
- Golden/behavioral set + threshold eval vs frozen test set (§6 gates).
- Latency/memory/power benchmarks on target hardware (§5), as a pass/fail
  budget, not a graph someone might look at.
- Serving contract + integration test (§6): load model, call API/device
  runtime end-to-end with a real payload.

**Only monitorable post-deployment (no test can promise these):**
- True performance on the live distribution — the test set is yesterday's
  world by definition.
- Data/concept drift (§7), rare-segment behavior the test set undersamples,
  emergent misuse patterns.
- Feedback loops (model outputs shaping future inputs).
- Real fleet conditions: thermal throttling in enclosures, degraded sensors,
  OEM battery-killer interactions (mobile §5).

**The discipline:** pre-deploy tests gate *known* failure modes; monitoring
catches *unknown* ones. A team that only tests ships blind; a team that only
monitors ships broken. Every §7 incident ends by promoting the failure into a
§6 golden test — that's how the known set grows.

---

## Handoff contract for 04-delivery (build there, not here)
- CI runners + pipeline orchestration executing §3 validation and §6 gates.
- Deploy automation, canary/shadow infrastructure, model-API hosting.
- Dashboards + alert routing for §7's watch-list; uptime/incident/on-call.
- Fleet update delivery mechanism for §5's edge artifacts (signing infra, staged rollout tooling).
- Artifact-store backup/DR (registry, DVC remotes).
- Cost monitoring (GPU hours, per-call vendor spend — thresholds from §1/§5).

## Cross-references
- Principles, architecture, testing pyramid, security/secrets, ADRs: `../00-core/00-core-SKILL.md`
- On-device capture/inference, peripheral-owns-buffering, telemetry rules: `../01-mobile/01-mobile-SKILL.md` §5
- Decoupled Python-API ↔ Next.js boundary, REST versioning: `../02-web/02-web-SKILL.md` §A1/§A3
- Everything in the handoff contract above: `../04-delivery/04-delivery-SKILL.md`
- Data ownership, model IP, per-call cost pass-through, labeling/maintenance line items: `../05-business/05-business-SKILL.md` *(placeholder)*
