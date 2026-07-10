---
name: core-engineering
description: >
  Cross-cutting engineering baseline for all company projects (SaaS + client work,
  across mobile, web/WordPress, and AI/ML). Trigger this skill whenever you are:
  starting or scoping a new project, designing or reviewing architecture, choosing
  a design pattern, writing or reviewing code, setting up tests, implementing
  auth/handling secrets, or establishing a git/branching workflow. Domain skills
  (01-mobile, 02-web, 03-ai-ml, 04-delivery) extend this file — when they conflict,
  the domain skill wins; otherwise this file is the default.
metadata:
  version: 1.0.0
  owner: sw-eng-company-skills
  status: active
---

# Core Engineering Baseline

**How to use this skill:** Don't read top-to-bottom. Jump to the section matching
the work at hand, apply the checklist/decision tree, and record any deviation as
an ADR (template at the bottom). Every rule here is a *default*, not a law —
deviating is fine, deviating silently is not.

---

## 1. Design Principles (SOLID / DRY / KISS / YAGNI)

Apply during code writing and code review. If a change violates one of these,
either fix it or write one sentence justifying why not.

### SOLID

- **S — Single Responsibility:** one reason to change per module.
  *Example:* `InvoiceService` that calculates totals AND sends emails AND writes
  PDFs → split into `InvoiceCalculator`, `InvoiceNotifier`, `InvoicePdfRenderer`.
  Smell: a class name containing "Manager"/"Handler" that touches 3+ subsystems.
- **O — Open/Closed:** extend behavior without editing existing code.
  *Example:* payment handling via `if (type == "stripe") ... else if (type == "paypal")`
  → a `PaymentProvider` interface with one implementation per provider; adding
  a provider adds a class, never edits the switch. Smell: the same `switch` on a
  type field appearing in multiple files.
- **L — Liskov Substitution:** subtypes must honor the base type's contract.
  *Example:* `Square extends Rectangle` where `setWidth` also changes height
  breaks callers that set width then height. Prefer composition, or a shared
  `Shape` interface with `area()` only. Smell: overrides that throw
  `NotImplementedException` or silently no-op.
- **I — Interface Segregation:** no client forced to depend on methods it doesn't use.
  *Example:* one fat `Repository` interface with 20 methods → `ReadableStore`
  and `WritableStore`; a read-only reporting service depends only on the former.
  Smell: mocks in tests stubbing 15 methods to test 1.
- **D — Dependency Inversion:** high-level policy depends on abstractions, not concretions.
  *Example:* `OrderService` constructing `new PostgresOrderRepo()` internally →
  accept an `OrderRepo` interface in the constructor; wiring happens at the
  composition root. This is what makes the testing pyramid (§4) achievable.

### DRY — Don't Repeat Yourself
Deduplicate *knowledge*, not *lines*. Two code blocks that look identical but
serve different business rules (e.g., "customer discount" vs "employee discount"
both currently 10%) should stay separate — they will diverge.
**Rule of three:** tolerate duplication twice; extract on the third occurrence.

### KISS — Keep It Simple
Prefer the boring solution that a mid-level dev can debug at 2 a.m.
*Example:* a background job that polls a DB table every 30s beats introducing
Kafka for a system with 200 events/day. Complexity must be bought by a
measured requirement, not an imagined one.

### YAGNI — You Aren't Gonna Need It
Don't build for hypothetical futures. *Example:* "multi-tenancy support" columns
and abstractions in a single-client custom build → skip; add when a second
tenant is actually contracted.
**Exception — YAGNI does NOT apply to:** security, data migrations/schema
versioning, API versioning surface (`/v1/` prefix), and audit logging. These are
prohibitively expensive to retrofit.

---

## 2. GoF Patterns — Default Toolbox

Reach for a pattern when the problem matches; never introduce one speculatively
(that's a YAGNI violation). One-line triggers:

### Creational
| Pattern | Use this when |
|---|---|
| **Factory Method** | Callers need objects but the concrete class depends on config/runtime input (e.g., `NotificationFactory` → push vs SMS vs email). |
| **Builder** | Constructing an object takes 4+ parameters, several optional (e.g., HTTP request builders, report configs). |
| **Singleton** | ⚠️ See overuse list. Legit only for truly process-global, stateless-ish resources (logger, config reader) — and prefer DI-container-managed single instances over the classic static pattern. |

### Structural
| Pattern | Use this when |
|---|---|
| **Adapter** | Wrapping a third-party SDK/API so your domain code depends on *your* interface (essential in client work — vendors change). |
| **Facade** | A subsystem (payment, ML inference, WP plugin cluster) needs one simple entry point hiding 5+ internal calls. |
| **Decorator** | Adding cross-cutting behavior (caching, retry, logging) around an interface without touching implementations. |
| **Composite** | Tree structures where leaves and containers are treated uniformly (UI component trees, org charts, nested categories). |
| **Proxy** | Lazy loading, access control, or remote-call stand-ins (e.g., lazy image loading, API rate-limit guard). |

### Behavioral
| Pattern | Use this when |
|---|---|
| **Strategy** | Swappable algorithms behind one interface (pricing rules, ranking algorithms, export formats). First thing to reach for when you see a growing `switch`. |
| **Observer / Pub-Sub** | ⚠️ See overuse list. One event, multiple independent reactions (order placed → email + analytics + inventory). |
| **Command** | Actions need queuing, undo, retry, or audit (task queues, editor undo stacks). |
| **Template Method** | A fixed algorithm skeleton with 1–2 varying steps (ETL pipelines, report generation). Prefer Strategy if more than 2 steps vary. |
| **State** | An entity's valid behavior depends on a lifecycle stage (order: draft → paid → shipped) and `if`-chains on status are multiplying. |
| **Chain of Responsibility** | Request passes ordered handlers that may each act or pass on (middleware, validation pipelines, support-ticket routing). |

### ⚠️ Commonly Overused — flag in review
1. **Singleton** — becomes hidden global state; kills testability and breaks in
   concurrent/serverless contexts. **Avoid when:** the object holds mutable
   state, or you're in anything multi-threaded/multi-instance. Use DI scoping instead.
2. **Abstract Factory / factory layers** — teams wrap a factory in a factory "for
   flexibility." **Avoid when:** there is exactly one concrete implementation and
   no concrete second one on a signed roadmap. `new` is fine.
3. **Observer / global event bus** — becomes "action at a distance"; nobody can
   trace what happens after an event fires. **Avoid when:** there's one producer
   and one consumer (call it directly), or when handlers must run in a specific
   order (make the orchestration explicit).

---

## 3. Architecture Decision Guide

Pick per project at kickoff; record the choice as an ADR. Format: *if your
project looks like X → use Y*.

### System shape

| If the project looks like… | Use | Why |
|---|---|---|
| Team of 1–8, one deployable product, unclear/evolving domain | **Modular monolith** (enforced module boundaries, one deploy) | Microservice tax (network, observability, versioning) needs a platform team you don't have. |
| Clear, independently-scaling domains AND multiple teams AND ops maturity (CI/CD, tracing, on-call) | **Microservices** | Only split along proven module seams — extract from a modular monolith, don't start greenfield micro. |
| Workflow is "when X happens, several things must react", spiky load, or audit-trail requirements | **Event-driven** (queue/stream between modules or services) | Decouples producers from consumers; pairs with either shape above. Start with a managed queue, not Kafka. |
| CRUD app, small scope, short client engagement, WP or admin panel | **Framework-default layered MVC** | Fighting the framework costs more than architectural purity is worth. |

**Default for company SaaS products: modular monolith + Clean-ish core, extract
services only when a module demonstrably needs independent scaling or ownership.**

### Internal structure

| If… | Use |
|---|---|
| Domain logic is nontrivial and must outlive frameworks/vendors (SaaS core, anything with complex business rules) | **Clean/Hexagonal**: domain center, ports (interfaces) out, adapters (DB, HTTP, vendor SDK) at the edge. Dependency rule: source arrows point inward only. |
| Server-rendered web / classic REST API with modest logic | **MVC** — the framework's default (Laravel/Rails/Django/WP). Don't hexagonalize a brochure site. |
| Mobile or SPA frontend with reactive data-binding (SwiftUI, Jetpack Compose, Flutter, Vue/React + stores) | **MVVM** — ViewModel exposes observable state; View stays dumb. |
| Complex UI state with many concurrent inputs where state bugs hurt (chat, editors, real-time dashboards) | **MVI / unidirectional data flow** — single immutable state, actions in, new state out (Redux/Elm style). Overkill for form-and-list apps. |

**Rule of thumb:** the more expensive the logic is to rewrite, the closer to
Clean/Hexagonal; the more the app is a thin skin over a framework, the more you
accept the framework's own pattern.

---

## 4. Testing Philosophy

### Pyramid (default ratios by count)
- **~70% unit** — pure logic, no I/O, milliseconds each. Domain layer should be near-100% testable this way (this is why §1-D matters).
- **~20% integration** — real DB/queue/HTTP boundaries, one seam per test (repo ↔ real Postgres via testcontainer; API route ↔ handler).
- **~10% E2E** — happy paths of the 3–5 money flows only (signup, checkout, core job). E2E suites beyond ~20 scenarios rot; resist growth.

Invert toward more integration tests when the project is mostly glue
(WordPress builds, thin CRUD, ML pipelines orchestrating vendor APIs) — unit
tests of glue code test nothing.

### Non-negotiables regardless of ratio
- [ ] Every bug fix ships with a regression test that fails before the fix.
- [ ] Tests run in CI on every PR; a red main is the top priority to fix.
- [ ] No test depends on execution order or shared mutable fixtures.
- [ ] Coverage is a smoke alarm, not a target — chasing % breeds assert-free tests. Investigate <60%; never mandate >90%.

### TDD — worth it vs overkill
**Worth it:** algorithmic/business-rule code (pricing, scheduling, parsing, validation), bug fixes (write the failing test first — always), public library/API surfaces.
**Overkill:** UI layout, exploratory spikes/prototypes (spike freely, then delete or test-cover before merge), config/glue code, early-stage ML model experiments.

### BDD (Given/When/Then, Cucumber-style)
**Worth it:** only when a non-developer stakeholder actually reads/writes the scenarios (regulated domains, formal client acceptance criteria).
**Overkill:** everywhere else — if only devs read them, the Gherkin layer is pure overhead; write plain integration tests with descriptive names instead.

---

## 5. Security Baseline

Run this checklist at design time and again pre-launch. Applies to every
deliverable including "small" client sites — those are the ones that get pwned.

### OWASP Top 10 checklist (2021 edition)
- [ ] **A01 Broken Access Control** — every endpoint checks authZ server-side; deny by default; no IDs in URLs trusted without ownership check (IDOR); test by swapping user IDs.
- [ ] **A02 Cryptographic Failures** — TLS everywhere incl. internal; passwords via bcrypt/argon2 (never MD5/SHA-x); no sensitive data in logs/URLs; encrypt PII at rest.
- [ ] **A03 Injection** — parameterized queries only (no string-built SQL); ORM raw-query escape hatches reviewed; sanitize anything reaching `eval`/shell/template engines; on WP: `$wpdb->prepare()` always.
- [ ] **A04 Insecure Design** — threat-model the money/data flows at kickoff (who can touch what?); rate-limit auth and expensive endpoints; business-logic abuse cases (negative quantities, replayed coupons) listed and tested.
- [ ] **A05 Security Misconfiguration** — no default creds; debug/stack traces off in prod; security headers set (CSP, HSTS, X-Content-Type-Options, frame-ancestors); cloud buckets private by default; WP: delete unused plugins/themes.
- [ ] **A06 Vulnerable Components** — lockfiles committed; automated dep scanning in CI (Dependabot/`npm audit`/`pip-audit`/`composer audit`); patch cadence agreed in maintenance contract.
- [ ] **A07 Auth Failures** — rate-limit + lockout on login; MFA available for admin roles; session invalidation on logout/password change; no user enumeration via error messages or timing.
- [ ] **A08 Software & Data Integrity** — CI pipeline is the only path to prod; verify webhook signatures (Stripe, GitHub…); pin third-party scripts (SRI) or self-host; signed updates for anything auto-updating.
- [ ] **A09 Logging & Monitoring Failures** — auth events, access-control denials, and input-validation failures logged with actor+timestamp; logs centralized and alertable; NO secrets/PII/tokens in logs.
- [ ] **A10 SSRF** — any user-supplied URL fetched server-side goes through an allowlist; block internal IP ranges/metadata endpoints (169.254.169.254).

### Auth patterns
**Default: don't build auth.** Use the platform/framework's (Django auth,
Laravel Fortify, WP core auth) or a managed IdP (Auth0/Cognito/Firebase/Clerk).
Hand-rolled auth requires an ADR justifying it.

- **OAuth2/OIDC:** use **Authorization Code + PKCE** for every user-facing app —
  web, SPA, and mobile alike. Implicit flow is dead; don't use it.
  **Client Credentials** for pure machine-to-machine.
- **JWT rules:** access tokens short-lived (≤15 min) + refresh-token rotation;
  validate `alg` (reject `none`), `iss`, `aud`, `exp` on every request; JWTs are
  **signed, not encrypted** — no PII in claims; you can't revoke a stateless JWT,
  so anything needing instant revocation (admin sessions) uses server-side
  sessions or a denylist check.
- **Web sessions:** cookies `HttpOnly; Secure; SameSite=Lax` (or `Strict`);
  never access/refresh tokens in `localStorage`.

### Secrets management rules
1. Never in git — not in code, config, or history. Pre-commit secret scanning (gitleaks/trufflehog) on every repo, from commit one.
2. Runtime: env vars injected by the platform, or a secret manager (AWS Secrets Manager / Vault / Doppler). `.env` files stay local + gitignored; ship a `.env.example` with keys but no values.
3. Per-environment, per-service credentials — dev secrets never equal prod secrets; least privilege per key.
4. Rotation story exists before launch (know *how* to rotate every credential in <1 hour, even if scheduled rotation isn't automated).
5. If a secret leaks: rotate immediately, then purge history (`git filter-repo`) — rotation first, history-cleaning second.
6. Client handover includes a secrets inventory: what exists, where it lives, who can rotate it.

### Privacy waiver rule
Privacy and data-handling defaults across this skills base are deliberately
conservative (GDPR-grade posture assumed regardless of client market). They may
be loosened **only per-client, via an explicit signed contract clause**
(`../05-business/`) — never silently, never by default, never for convenience.
Domain specifics build on this rule (e.g. camera/audio training data:
`../03-ai-ml/` §8).

---

## 6. Git & Collaboration Workflow

### Branching — decision rule
```
Solo or team ≤ ~8, CI on every PR, deploy continuously (SaaS default)?
  → TRUNK-BASED: short-lived branches (< 2 days) off main → PR → squash-merge.
    Incomplete features hide behind feature flags. Releases = tags on main.

Client requires staged releases / formal UAT sign-off per version,
multiple versions supported in parallel, or infrequent big-bang releases
(mobile app-store cadence sometimes lands here)?
  → GIT FLOW (lightweight): main = released, develop = integration,
    release/x.y branches for hardening, hotfix/* from main.
    Skip Git Flow's ceremony you don't need — most projects need only
    main + develop + release branches.

Default: trunk-based. Git Flow only when an external constraint forces it.
Never mix models in one repo; record the choice in the project README.
```

### Commit messages — Conventional Commits
```
<type>(<optional scope>): <imperative summary, ≤72 chars>

<optional body: what & why, not how>

<optional footer: BREAKING CHANGE: ..., Closes #123>
```
Types: `feat` `fix` `refactor` `perf` `test` `docs` `build` `ci` `chore` `revert`.
- `feat` and `fix` drive changelogs and semver (`feat` → minor, `fix` → patch, `BREAKING CHANGE` → major) — use them honestly.
- Enforce with commitlint + husky (or CI check) rather than trusting discipline.

### PR hygiene (applies in both models)
- [ ] PRs < ~400 changed lines where possible; split otherwise.
- [ ] One approving review minimum; author never merges own PR unreviewed (solo projects: self-review the diff line-by-line before merge, honestly).
- [ ] CI green is a hard gate — no "merge now, fix later."
- [ ] PR description says *why*; links issue/ticket.

### ADR — Architecture Decision Record
One file per significant decision: `docs/adr/NNNN-short-title.md`. "Significant" =
expensive to reverse, or someone will ask "why is it like this?" in a year.
Write it when choosing: system shape (§3), datastore, auth provider, hosting,
branching model, any deviation from this skill.

```markdown
# NNNN — <Decision title>

- **Status:** proposed | accepted | superseded by NNNN
- **Date:** YYYY-MM-DD
- **Deciders:** <names>

## Context
What forces are at play? (requirements, constraints, team, budget — 2–5 sentences)

## Decision
We will <decision>, because <primary reason>.

## Alternatives considered
- <Option B> — rejected because <one line>
- <Option C> — rejected because <one line>

## Consequences
- Positive: <what gets easier>
- Negative / accepted trade-offs: <what gets harder, what we'll revisit and when>
```

---

## 7. Greenfield vs. Takeover Projects

Every default in this skills base — frameworks, state management, styling,
testing/E2E stack, hosting — applies to **greenfield projects only**.

On **takeover/handoff projects** (inheriting a client's existing codebase or
infrastructure): **inherit the incumbent tooling.** Migrating to a company
default requires a costed, documented reason recorded as an ADR (what the
migration costs, what it buys, who pays) — "it's our default" is not a reason.

Corollary for greenfield client work: the client's post-handover team
constrains the pick — choose what they can actually maintain, not your
favorite stack. Domain applications: stack choice (`../01-mobile/` §1,
`../02-web/` §A1), E2E tooling (`../01-mobile/` §7, `../02-web/` §C).

---

## Cross-references
- Mobile-specific patterns (offline-first, store release flows): `../01-mobile/01-mobile-SKILL.md`
- Web & WordPress specifics (hardening, plugin policy): `../02-web/02-web-SKILL.md`
- AI/ML lifecycle, MLOps, eval discipline: `../03-ai-ml/03-ai-ml-SKILL.md`
- CI/CD, hosting, monitoring, maintenance SLAs: `../04-delivery/04-delivery-SKILL.md`
- Contracts, IP, scoping, pricing: `../05-business/05-business-SKILL.md` *(placeholder)*
