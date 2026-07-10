---
name: delivery-operations
description: >
  Cross-cutting operational layer for all project types (mobile, web/WordPress,
  ML systems): CI/CD pipeline design, environment strategy, hosting/infra
  decisions, deployment strategies, monitoring & alerting, incident response,
  backup & disaster recovery, client maintenance contracts, and post-launch bug
  triage. Trigger this skill when: setting up or reviewing a CI/CD pipeline,
  choosing hosting or deployment strategy, configuring environments/secrets
  injection, defining monitoring/alerts/on-call, responding to a production
  incident, designing backup/DR, scoping a maintenance contract, or triaging a
  post-launch bug. Extends ../00-core/00-core-SKILL.md. This skill IMPLEMENTS the
  "Handoff contract for 04-delivery" block at the end of ../03-ai-ml/03-ai-ml-SKILL.md —
  ML decision logic (promotion gates, drift definitions, retrain triggers)
  stays in 03-ai-ml; this file provides the infrastructure those decisions run
  on. Domain deltas (store submission, WP update procedure) stay in their
  domain skills and are referenced, not repeated.
metadata:
  version: 1.0.0
  owner: sw-eng-company-skills
  extends: ../00-core/00-core-SKILL.md
  implements: ../03-ai-ml/03-ai-ml-SKILL.md handoff contract
  status: active
---

# Delivery & Operations (QA Infra, CI/CD, Hosting, Maintenance)

**Precedence:** `00-core` applies by default. Ownership rule used throughout:
**domain skills define WHAT to gate/watch/roll back; this skill provides the
HOW** (runners, environments, dashboards, routing, contracts). If you're about
to write a drift threshold or a store-submission step here — stop, it belongs
in `03-ai-ml` §7 or `01-mobile` §6.

---

## 1. CI/CD Reference Pipelines

Rules common to all four (non-negotiable):
- Pipeline lives as code in the repo; a project without CI on every PR
  violates core §4 and doesn't ship.
- **Build once, promote the same artifact** through environments — never
  rebuild per env (rebuilds are silent variance).
- Main is always deployable (core §6 trunk-based); prod deploys happen only
  through the pipeline — no SSH-and-pray, no wp-admin plugin uploads to prod.
- Every deploy is traceable: artifact → commit → ticket (and for ML: →
  registry version → data hash, via `03-ai-ml` §6 lineage).

### Mobile (per `../01-mobile/`)
```
PR:    lint + unit + widget tests (mobile §7)          [blocks merge]
main:  build signed artifact (Fastlane / EAS)
       → internal track (TestFlight / Play internal)   [every merge]
RC:    E2E suite (Maestro) on device-farm matrix       [per release candidate,
       + manual QA checklist (mobile §7)                not per commit]
release: staged store rollout (10% → 50% → 100%)
       gated by crash-free rate (§5)                   [halt on regression]
```
Signing keys/keystores: injected from secret manager (core §5), **backed up
per §7** — a lost Android keystore is an unrecoverable app identity.
Store review round-trips per mobile §6 budget.

### Web app (per `../02-web/` Track A)
```
PR:    lint + typecheck + unit + API contract tests (web §C)
       → ephemeral preview deploy (per-PR URL)         [blocks merge]
main:  build once → deploy staging → Playwright smoke  [every merge]
prod:  promote same artifact via §4 strategy
       → post-deploy smoke + error-rate watch (§5)     [auto or 1-click]
```
DB migrations decoupled from deploys — expand-contract (§4).

### WordPress (per `../02-web/` Track B)
```
repo:  theme + custom plugins in git (never core/uploads)
PR:    PHPCS + PHPUnit (wp-env, PHP matrix from web §C) [blocks merge]
merge: deploy code to staging
updates (monthly batch): web §B6 procedure ON staging
       → Playwright smoke + visual diffs (web §C)
prod:  deploy code / apply updates in low-traffic window
       → smoke re-run, 48 h rollback window (web §B6)
```
This pipeline *executes* web §B6; the procedure itself is defined there.

### ML model promotion (implements `../03-ai-ml/` §6)
```
trigger: code/data/config change, or §7 retrain trigger (03-ai-ml)
run:   data validation (03-ai-ml §3) → train → eval
gates: 03-ai-ml §6 promotion gate (all five checks)     [defined THERE]
pass:  register version (MLflow) → deploy staging
       → shadow/canary vs prod model (§4)               [infra: this skill]
promote: pointer flip; previous version stays warm      [rollback: 03-ai-ml §6]
edge:  compile per target → sign artifact → staged fleet rollout (§4)
```
Orchestration: start with CI-native (GitHub Actions + DVC pipelines) — a
dedicated orchestrator (Prefect/Dagster) only when schedules/backfills/
multi-model DAGs demand it (core §1 KISS). GPU steps on ephemeral runners
(§3), never a pet GPU box.

---

## 2. Environment Strategy

Three environments, no more, no fewer, per project: **dev** (local, disposable),
**staging** (prod-shaped, client-viewable), **prod**. Web PRs add ephemeral
previews (§1). "Test in prod because staging drifted" is a §6 incident cause,
not a workflow.

Parity rules:
- [ ] Same artifact (§1), same container/runtime versions, same infra shape as prod — smaller is fine, *different* is not (a Vercel staging for a VPS prod tests nothing).
- [ ] Staging data: production-shaped but **anonymized/synthetic — never raw
  user PII or media in staging** (core §5 A02; `03-ai-ml` §8's privacy default
  applies to environments too). Seed scripts in the repo.
- [ ] Config divergence only via environment variables — never `if (env === "staging")` branches in code.
- [ ] Secrets per core §5: platform-injected, per-environment, per-service credentials; staging creds never open prod doors; `.env.example` committed, values never.
- [ ] Third-party services: sandbox/test-mode keys in dev+staging (Stripe test mode, ML vendor sandbox keys) — a staging bug that charges a real card is a P1 (§5).

---

## 3. Hosting & Infra Decision Guide

First match wins; record as ADR (core §6). **Ownership rule for ALL client
projects (canonical statement — WP applications cite it from web §B3/§B6):
every account (hosting, domain, cloud, store, vendor API) is created in the
client's name and billing, with you as invited admin.** Their renewal lapse must never be your
outage; your offboarding must never be their outage. Account inventory is a
handover deliverable (`../05-business/`).

| If the project is… | Host on | Why |
|---|---|---|
| Web app, standard shape (Next.js/SPA + API + Postgres), no ML serving | **Managed platform (Vercel / Railway / Render / Fly.io)** *(default)* | Ops surface ≈ zero; preview envs free; solo-maintainable. Revisit only when the bill or a constraint says so — not for résumé reasons (core §1 KISS). |
| WordPress | **Managed WP hosting** (Kinsta/WP Engine-class, or quality shared for small clients) | Host provides §7 backups, staging, PHP updates — you're buying web §B6's checklist as a service. Client-billed per ownership rule. |
| ML inference API (03-ai-ml §5) | **Serverless GPU (Modal / RunPod / Replicate-class)** for spiky loads; **cloud GPU instances behind autoscaling** for sustained traffic | Match the billing model to the traffic shape; idle GPU is the #1 ML cost leak (§5 cost alerts). CPU-servable models (classical/quantized) → same managed platform as the web app. |
| Needs queues/workers/VPC/compliance controls, or managed-platform bill crosses cloud-equivalent cost | **Cloud direct (AWS/GCP/Azure)** — managed services (RDS, Cloud Run, SQS-class), IaC (Terraform/OpenTofu) from day one | The complexity toll is real: only pay it for a reason you can name in the ADR. No IaC = no cloud-direct — click-ops infra is unrecoverable (§7). |
| Client mandates their infra/on-prem | **Client-owned** — you deploy via their pipeline | Scope boundary in the contract: you own the app, they own the platform; §5 monitoring access + a named ops contact are contract prerequisites, not favors. |
| Echosense-class device fleet | Devices are client/product-owned; **cloud side (broker, telemetry ingest, update server) follows the rows above** | Fleet update mechanics in §4; device telemetry per mobile §5. |

---

## 4. Deployment Strategies

| Strategy | Use when | Notes |
|---|---|---|
| **Rolling** *(default)* | Stateless web/API workloads on managed platforms | Platform default; zero extra infra. Requires N and N+1 to coexist briefly → migration rule below. |
| **Blue-green** | Instant-rollback requirement; WP prod (the web §B6 48 h window is blue-green with a long hold); risky framework/runtime upgrades | Two environments, traffic flip, old side warm. Cost: double capacity during the window. |
| **Canary** | High-traffic products; changes with blast radius (payments, auth, data writes) — and **ML models, always**: the canary/shadow procedure and its comparison metrics are `03-ai-ml` §6's; this skill supplies the traffic-splitting and side-by-side dashboards (§5) | Needs enough traffic to read a signal — on low-traffic client sites a canary is theater; use blue-green + smoke tests instead. |
| **Staged fleet rollout** (edge/mobile) | Store releases (mobile §1 pipeline: 10→50→100% gated on crash-free rate); Echosense device fleets | Fleet infra this skill owns per the `03-ai-ml` handoff: **signed artifacts (signing keys in the secret manager, §7 backup), device cohorts (internal → beta → 10% → all), version-pinned rollback channel, halt-on-telemetry-regression**. Artifact/rollback *requirements* are 03-ai-ml §5's; device-side previous-model retention is mobile §5's. |

**Migration rule (all strategies): expand-contract.** Deploy N+1 code that
works with the N schema → migrate additively (new columns/tables, dual-write
if needed) → contract (drop old) only after the rollback window closes. A
deploy you can't roll back because the schema moved is a self-inflicted §6
incident. Feature flags (core §6 trunk-based) decouple release from deploy —
prefer flag-off deploys for risky features on low-traffic projects.

---

## 5. Monitoring & Alerting

**Ownership boundary (so nothing is built twice):**

| Layer | Defined by | Built/routed by |
|---|---|---|
| Uptime, error rate, latency, saturation, cost | **this skill** | this skill |
| Model metrics: drift, confidence, slices, proxy labels, input quality | `03-ai-ml` §7 (the watch-list) | this skill (dashboards + alert routing only — thresholds and retrain-vs-noise logic stay THERE) |
| Crash-free rate, ANRs (mobile) | mobile §7/§1-pipeline | this skill (Sentry/Crashlytics wiring, release gates §1) |
| WP-specific checks (update status, licence expiry) | web §B6 | this skill (scheduled checks + routing) |

**Standard watch-list, every production project (the boring set that catches
90% of incidents):**
- [ ] Uptime check per public surface + per API `/health` (external prober, 1–5 min).
- [ ] Error tracking (Sentry-class) wired at project start, release-tagged so §1 deploys correlate with error spikes.
- [ ] p95 latency + error-rate per endpoint (managed platform metrics suffice — APM only when a measured problem demands it).
- [ ] **Cost:** budget alert per cloud/vendor account at 50/80/100% of expected spend — per-call LLM APIs and GPU time (03-ai-ml §1/§5 thresholds) are the two that run away overnight.
- [ ] Expiry sweep: TLS certs, domains, store memberships, plugin/vendor licences — 30-day-warning scheduled check; these cause the most embarrassing outages.
- [ ] Queue depth / job failures where workers exist; DB disk + connection saturation.
- [ ] Backup success (§7) — a failed backup job is an alert TODAY, not a discovery during restore.

**Severity tiers + alert-fatigue rules (solo/small-team on-call reality):**
- **P1 — page immediately, any hour:** prod down, data loss in progress, security breach, payments failing. *The only tier that interrupts sleep.*
- **P2 — same business day:** core flow degraded with workaround, error-rate spike, canary halted, cost alert ≥80%.
- **P3 — next maintenance window:** non-core degradation, drift warnings (03-ai-ml §7's "investigate, don't retrain" starts here), expiry warnings.
- Rules: every alert must be **actionable by the person receiving it** — an alert with no runbook line (§6) gets deleted or demoted; anything that fires twice without action gets demoted or fixed; P3s batch into a weekly digest, never real-time pings; one alert channel per severity, not per tool. Review the alert set at each §8 maintenance cycle — alert rot is real.
- Solo on-call truth: you cannot page yourself 24/7 sustainably — sell response windows accordingly (§8), and let P1 coverage outside business hours be an explicit contract tier, not an implied favor.

---

## 6. Incident Response

**Rollback-first discipline** — same rule as 03-ai-ml §6, generalized: if a
deploy (code, model, plugin update, infra change) preceded the incident, roll
it back BEFORE diagnosing. Diagnosis happens on staging with the incident
artifact, not on prod with users bleeding. The §4 strategies + §1 traceability
exist precisely so this is a pointer flip, not archaeology.

**Runbook template — one per project, `docs/runbook.md`, usable at 3 a.m. solo:**
```markdown
# Runbook — <project>
## Links (no hunting during incidents)
Dashboards: … | Logs: … | Status/uptime: … | Hosting console: …
Deploy/rollback: <exact command or console path>
Secrets/registry locations (not values): …

## Contacts
Client incident contact + hours | Hosting support | Escalation (subcontractor)

## Incident procedure
1. ASSESS  — severity per §5 tiers. P2/P3 → schedule, stop here.
2. STABILIZE — last change (deploy/model/update/config)? → ROLL BACK (§4/
   03-ai-ml §6/web §B6). No recent change → known failure modes below.
3. COMMUNICATE — P1: client contact + status note within 30 min ("aware,
   mitigating, next update at HH:MM"). Honest, no root-cause guessing.
4. VERIFY — smoke suite green, error rates back to baseline (§5).
5. FOLLOW UP — within 48 h: 5-line post-incident note (what/impact/cause/
   fix/prevention) → client file + this runbook's known-failures list;
   regression test per §9 / golden per 03-ai-ml §6.

## Known failure modes (grows per incident)
| Symptom | Likely cause | Fix |
```
Post-incident notes are blameless and cheap — five lines, honestly (core
"report outcomes faithfully"). An incident that doesn't update the runbook or
add a test will repeat.

---

## 7. Backup & Disaster Recovery

**Company standard (generalizes web §B6's WP rules — that section now defers
here for drill cadence):**
- Retention: daily × 30 days + monthly × 12; stored **off the primary hosting
  account** (provider snapshots alone die with the account — core §5 A08
  thinking).
- **Quarterly restore drill, every maintained project:** actually restore to
  staging, run the smoke suite, log time-to-restore. *An untested backup is a
  hope, not a backup* (web §B6's line, promoted to company law).
- RTO/RPO per maintenance tier (§8), stated in the contract — "daily backup"
  means "up to 24 h data loss"; the client agrees to that numerically, in
  writing, or funds point-in-time recovery.

**What to back up, per project type (the non-obvious column is why this table
exists):**

| Project | Obvious | Commonly forgotten |
|---|---|---|
| Web app | DB (PITR on managed Postgres where offered), user uploads/media | **IaC state files**, env-var/config export, third-party config that isn't in code (DNS zones, webhook registrations, OAuth app settings) |
| WordPress | DB + `wp-content` (web §B6) | Licence keys inventory, `.htaccess`/nginx snippets, cron definitions |
| Mobile | (app data lives on devices/backend) | **Signing identities: Android keystore + credentials, Apple certs/profiles** — keystore loss is permanent app-identity loss; store in secret manager + offline copy. Store listing assets/metadata (Fastlane `deliver` files in git). |
| ML system (per 03-ai-ml handoff) | **Model registry DB + artifact store; DVC remotes (datasets incl. frozen test sets + §5 calibration sets); experiment-tracking DB** | Labeling-tool exports, eval golden sets, edge-compiled artifacts per fleet version (must be able to re-flash any fielded device version) |
| Device fleet | Cloud side as above | Device provisioning keys/certs, fleet version manifest, last-known-good model per cohort (§4) |

DR question per project, answered in the runbook: "hosting account/region
gone tomorrow — what are the restore steps and how long?" If the answer
involves a person's memory, write it down or automate it.

---

## 8. Client Maintenance Contracts (structure only — pricing in `../05-business/`)

**Tiers:**

| | **T1 — Monitored** | **T2 — Maintained** *(default to sell)* | **T3 — Managed** |
|---|---|---|---|
| Monitoring | Uptime + error tracking + backup checks (§5) | T1 + full watch-list §5 | T2 + dashboards reviewed monthly with client |
| Updates | Security patches only (web §B6 48 h class) | Monthly batches, staging-first (§1 pipelines) | T2 + dependency/platform upgrades (framework majors, PHP, OS) |
| Backups/DR | Standard §7 + drills | Same | Same + client-specific RTO/RPO |
| Bug SLA (§9) | Best-effort | S1/S2 committed response times, business hours | T2 + priority queue + small monthly fix/improvement budget |
| ML add-on (products with 03-ai-ml scope) | — | Monitoring per 03-ai-ml §7 + **the monthly fresh-label eval and its labeling trickle, named as a line item** | T2-ML + scheduled retrain cycles (each a full 03-ai-ml §6 promotion) |
| On-call | None (business hours) | Business hours; P1 next-morning | Extended windows **only if §5's solo-on-call reality is solved** (see below) |

**Solo-deliverable vs requires-help — sell honestly:**
- ✅ Solo-sustainable: everything in T1/T2 for a portfolio of sites/apps —
  *because* §1–§7 automate it (pipelines, alert tiers, batched P3s, drills).
  This is the operating leverage of this whole skill.
- ⚠️ Requires subcontract/hire before selling: 24/7 or weekend P1 coverage
  (needs a second responder — never sell sleep you don't have), security
  incident response beyond §6 containment (rollback+isolate is yours;
  forensics is a retainer with a specialist), sustained T3 platform-upgrade
  work across many clients simultaneously.
- Contract must state: response windows per severity (§9), what's OUT of scope
  (new features are quoted work — web §B6's scope line, generalized), the §3
  account-ownership rule, and exit terms (handover pack: runbook §6, account
  inventory §3, backup access §7).

---

## 9. Post-Launch Bug Triage

**Severity classes (map 1:1 to §5 alert tiers when detected by monitoring):**
- **S1** — prod down / data loss / security / payments broken → §6 incident procedure, immediately.
- **S2** — core flow broken, no workaround (can't pair device, can't check out, model returning garbage at scale).
- **S3** — degraded with workaround; a slice/edge case (03-ai-ml §8 slice failures land here unless harm ↑).
- **S4** — cosmetic/polish. Batch into maintenance windows or feature work.

**Response expectation per tier (structure — put numbers in each contract):**

| | T1 | T2 | T3 |
|---|---|---|---|
| S1 | best effort | same-business-day response | fastest committed window |
| S2 | best effort | ≤2 business days | next business day |
| S3/S4 | backlog | next monthly window | prioritized in monthly budget |

"Response" = a human assessed it and scheduled a fix — commit to response
times, not resolution times (resolution promises on unknown bugs are lies with
a date on them).

**Triage flow:** reproduce (on staging, with the §5 error-tracker event — an
unreproducible bug gets instrumentation added, not a guess-fix) → classify →
check whether monitoring caught it (it didn't? → add the missing §5 signal —
every user-reported bug is also a monitoring gap) → fix on a branch per core
§6 → **regression test that fails before the fix, always** (core §4's
non-negotiable; ML-involved bugs additionally promote the case to a golden per
03-ai-ml §6) → ship through §1 pipeline → close the loop with the reporter.

---

## Handoff-contract satisfaction map (per `../03-ai-ml/03-ai-ml-SKILL.md`)
| 03-ai-ml asked for | Delivered in |
|---|---|
| CI runners + pipeline orchestration (§3 validation, §6 gates) | §1 ML pipeline |
| Deploy automation, canary/shadow infra, model-API hosting | §1, §3 (GPU rows), §4 canary |
| Dashboards + alert routing for the §7 watch-list | §5 ownership table |
| Fleet update delivery (signing, staged rollout) | §4 staged fleet rollout, §7 keys |
| Artifact-store backup/DR (registry, DVC remotes) | §7 ML row |
| Cost monitoring (GPU hours, per-call spend) | §5 cost alerts, §3 GPU hosting |

## Cross-references
- Principles, testing pyramid, security/secrets, git/trunk-based, ADRs: `../00-core/00-core-SKILL.md`
- Store pipelines' domain rules (submission, review budgets, device QA): `../01-mobile/01-mobile-SKILL.md` §6–7
- WP update procedure + maintenance specifics; web perf budgets enforced in CI: `../02-web/02-web-SKILL.md` §B6, §A6, §C
- ML gates, drift logic, retrain triggers, edge artifact requirements: `../03-ai-ml/03-ai-ml-SKILL.md` §5–7
- Contract pricing, SLA numbers, account-inventory handover, exit terms: `../05-business/05-business-SKILL.md` *(placeholder)*
