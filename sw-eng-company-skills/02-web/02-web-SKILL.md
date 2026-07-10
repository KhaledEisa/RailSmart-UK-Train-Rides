---
name: web-engineering
description: >
  Web development patterns in two distinct tracks: (A) custom web apps
  (SaaS products, client dashboards, marketing sites — Next.js/Remix/SPA/
  server-rendered) and (B) WordPress builds (themes, plugins, headless,
  maintenance contracts). Trigger this skill when: choosing a web framework or
  rendering strategy, designing an API (REST/GraphQL/tRPC), structuring
  frontend state or styling, setting web performance budgets, deciding
  WordPress vs custom, vetting or writing WP plugins/themes, planning WP
  caching or update/maintenance strategy, or planning web QA/E2E. Extends
  ../00-core/00-core-SKILL.md — core rules (SOLID, architecture defaults, testing
  pyramid, OWASP/auth/secrets, git workflow, ADRs) apply unchanged; this file
  only adds web deltas. Decide FIRST whether the project is Track A or Track B
  (§B1 decision guide) — the tracks have different rules; don't blend them.
metadata:
  version: 1.0.0
  owner: sw-eng-company-skills
  extends: ../00-core/00-core-SKILL.md
  status: active
---

# Web Engineering (Custom Web + WordPress)

**Precedence:** `00-core` applies by default. First decision on any web project:
**Track A (custom build) or Track B (WordPress)** — use §B1 to decide, record as
an ADR (core §6). Everything else in this file is track-scoped.

---

# Track A — Custom Web (SaaS / Client Apps)

## A1. Framework Decision Guide

First matching row wins; record as ADR.

| If the project is… | Pick | Why |
|---|---|---|
| SaaS product (app behind login + public marketing/SEO pages in one product) | **Next.js** *(company default)* | One framework covers both halves (SSR/SSG marketing + app routes); largest hiring/ecosystem pool; deploys anywhere. |
| SaaS product with an ML/inference backend (`../03-ai-ml/` work in the product) | **Python API (FastAPI or Django REST) + Next.js frontend, decoupled via REST — no shared runtime** | Next.js remains the frontend default; the ML layer lives where the ML tooling lives (Python). The versioned REST boundary (A3) is the contract/handoff point between the web layer and `../03-ai-ml/` — each side deploys, scales, and rolls back independently (a model rollback must never require a frontend deploy). |
| Client dashboard / internal tool (auth-gated, zero SEO) | **Plain SPA (React + Vite)** | SSR buys nothing behind a login; Vite SPA is simpler to build, host (static + API), and hand over. Don't pay the Next.js complexity tax without a public surface. |
| Form-heavy, mutation-heavy app where progressive enhancement / web fundamentals matter | **Remix (React Router v7)** | Loader/action model maps cleanly onto forms + mutations; less client-state ceremony. Pick over Next.js when the app is mostly forms, not mostly content. |
| Backend-heavy product where the web UI is one consumer among several (mobile app exists — see `../01-mobile/`), or team is strongest in Python/PHP/Ruby | **Server-rendered framework (Django / Laravel / Rails) + sprinkles (htmx/Hotwire/Livewire) or a separate SPA** | The framework's batteries (auth, ORM, admin) are the value — core §3 "framework-default MVC" row applies. Add a JS framework only where interactivity earns it. |
| Content-heavy site with an editorial team (blog/docs/marketing only, no app) | **SSG (Astro) — or Track B (WordPress)** if editors need a CMS UI | Astro when devs own content (MD/MDX, git-based CMS); WordPress when non-technical editors own it daily → jump to §B1. |
| Vue team (client's existing stack or inherited codebase) | **Nuxt / Vue + Vite** (same row logic as above) | Framework choice follows team skills (core §1 KISS) — the decision table transfers, swap the noun. |

**Rule:** the client's post-handover team constrains the pick (core §7, same
as mobile §1) — a Laravel shop gets Laravel, not your favorite stack.

## A2. Rendering Strategy — per route, not per app

Mixed strategies in one app are normal (Next.js/Astro support it natively).
Decide per page class:

| Use | When | Watch |
|---|---|---|
| **SSG** (build-time static) | Content changes on deploy: marketing pages, docs, blog, pricing | Cheapest to host + fastest + safest. Default for anything public that *can* be static. Rebuild time grows with page count. |
| **ISR / stale-while-revalidate** | Public + SEO + data changes hourly/daily (product listings, job boards, CMS-fed pages) | SSG economics with fresh-enough data. Needs a host that supports it (or a CDN with SWR headers). |
| **SSR** (per-request) | Public + SEO + per-request data (search results, personalized landing, geo/AB content) | Most expensive: every view is compute. Don't SSR what ISR can serve; watch p95 TTFB. |
| **CSR** (client-only) | Behind auth: dashboards, editors, settings — anything crawlers never see | SEO-irrelevant, so ship the simplest thing. Pair with server-state caching (A4). |

**Decision shortcut:** `crawlers need it? → no: CSR. yes: can it be stale minutes+?
→ yes: SSG/ISR. no: SSR.` Hosting cost ranks SSG < ISR < CSR-with-API < SSR at scale.

## A3. API Design

| If… | Use | Why |
|---|---|---|
| Default — public API, mobile app consumer (`../01-mobile/`), third-party integrations, client handover | **REST (JSON), OpenAPI spec committed to the repo** | Universal, cacheable, every client team can consume it; the spec doubles as docs + contract tests. |
| Many client types with divergent data-shape needs hitting the same rich graph (dashboard + mobile + partners), and a team that will own graph governance | **GraphQL** | Solves over/under-fetching across heterogeneous consumers. ⚠️ Don't pick for one first-party frontend — you inherit N+1 resolvers, query-cost limiting, and cache complexity for no payoff (core §1 KISS/YAGNI). |
| TypeScript monorepo, first-party web frontend(s) only, no external consumers | **tRPC** | End-to-end types with zero schema ceremony. Hard boundary: the moment an external/non-TS consumer appears, expose REST alongside — never hand tRPC to a client's non-TS team. |

**Versioning:** URL-prefix `/v1/` from day one (core §1 YAGNI-exception list).
Additive changes (new optional fields/endpoints) don't bump; breaking changes
(remove/rename/retype, semantics) → `/v2/` + deprecation window on `/v1/`
(client contract states how long — feeds `../05-business/`). Never break
silently; log + alert on deprecated-route usage before removal.

**Auth:** core §5 applies verbatim — Authorization Code + PKCE, short-lived
JWTs or `HttpOnly` cookie sessions. Web-specific additions:
- [ ] Same-origin app → cookie sessions (`HttpOnly; Secure; SameSite=Lax`) over JWT-in-JS; simpler and XSS-resistant (nothing to steal from `localStorage`).
- [ ] CSRF protection on any cookie-authenticated mutation (framework default or double-submit token); `SameSite` alone is not the whole answer for cross-site POST surfaces.
- [ ] CORS allowlist explicit origins — never `*` with credentials.
- [ ] Rate limits per token/IP on auth + expensive endpoints (core §5 A04), enforced at the edge/gateway not in-app where possible.

## A4. Frontend State & Data

Mobile §2's split transfers verbatim: **server state and client state are
different problems — one solution per layer, never blended.**

| Layer | Default | Use instead when |
|---|---|---|
| **Server state** (anything fetched) | **TanStack Query** (SWR acceptable in Next.js-lite cases) | Remix/RSC loaders already own fetching → use the framework's primitive, don't double-cache. |
| **Client state** (UI-only: modals, filters, wizard steps) | **Zustand** | Truly trivial → component state/`useState`. Redux Toolkit only per mobile §2's trigger (big team, middleware, ~15+ screens of shared state). |
| **Form state** | **React Hook Form + zod** (schema shared with API validation) | Server-driven forms in Remix/Laravel/Django → the framework's form layer. |
| **URL state** (filters, pagination, tabs — anything shareable/bookmarkable) | **The URL itself** (search params) | Most "global state" in dashboards is actually URL state; putting it in a store breaks back-button + deep links. |

**Smell to review for:** fetched data copied into a Zustand/Redux store — that's
server state mismanaged as client state (the top pattern-violation in web code
reviews, same as mobile §2).

## A5. Styling

- **Default: Tailwind CSS.** Utility classes co-located with markup, no naming
  bikeshed, dead-style elimination for free.
- **+ shadcn/ui** *(default component layer)* when the app needs standard
  components (dialogs, dropdowns, tables) and design is "clean, ours-ish":
  copied-in source you own — no library lock-in, restyleable. Radix primitives
  under it handle a11y.
- **MUI / Ant / Mantine** only when: internal tool/dashboard where "looks like
  Material" is acceptable and speed beats brand — or client's existing codebase
  uses it. Don't fight a component library's theme to match a brand; that costs
  more than building on shadcn.
- **Custom design system** (tokens + component library + docs) only when: the
  client has a design team maintaining Figma sources, multiple products/frontends
  consume it, and there's a maintenance budget line. Otherwise it's a YAGNI
  violation (core §1) — a `tailwind.config` theme + shadcn IS the small-client
  design system.
- Hard rules: design tokens (colors/spacing/type) live in one file (`tailwind
  .config`/CSS vars) — no hex literals in components; dark mode from day one or
  explicitly never (same rule as mobile §3); one styling approach per app —
  Tailwind + styled-components + CSS modules in one codebase is review-blocking.

## A6. Performance Baseline

Budgets are CI-enforced (Lighthouse CI / `size-limit`), not aspirational.
Measure at **p75 on mid-tier mobile over 4G** (field data > lab data).

| Metric | Target (public pages) | Auth-gated apps |
|---|---|---|
| LCP | ≤ 2.5 s | ≤ 3 s |
| INP | ≤ 200 ms | ≤ 200 ms |
| CLS | ≤ 0.1 | ≤ 0.1 |
| Initial JS (gzipped) | ≤ 100 KB marketing / ≤ 200 KB app shell | ≤ 300 KB |

Checklist:
- [ ] Images: modern formats (AVIF/WebP) + responsive `srcset` + lazy-load below fold + explicit dimensions (CLS). Use the framework's image component; hand-rolled `<img>` pipelines are a bug farm.
- [ ] Fonts: self-hosted, `woff2`, ≤2 families, `font-display: swap`, preload the primary face. No render-blocking third-party font CSS.
- [ ] Code-split per route (framework default — don't defeat it with a barrel-file that imports everything); dynamic-import heavy widgets (charts, editors, maps).
- [ ] Third-party scripts are the #1 silent budget killer: each one needs an owner + justification; load via async/worker (Partytown) or tag-manager rules; audit quarterly.
- [ ] Static assets behind a CDN with immutable cache headers (hashed filenames); HTML per A2 strategy.
- [ ] DB: every list endpoint paginated from v1; queries behind an ORM reviewed for N+1 (the web twin of WP's §B5 killer).

---

# Track B — WordPress

## B1. WordPress vs Custom — the fork decision

**WordPress is the right call when (all/most true):**
- [ ] The deliverable is a content site: marketing, blog, brochure, small-org site, editorial publication.
- [ ] Non-technical editors update content weekly+ and need a mature CMS UI *today* (WP admin is the benchmark client editors already know).
- [ ] Budget/timeline is small; the plugin ecosystem covers the feature list (forms, SEO, basic e-commerce via WooCommerce, events, memberships) with *vetted* plugins (§B3).
- [ ] Client expects to own/administer it after handover with generic WP skills (any local agency can maintain it — that's a client benefit, sell it as one).

**WordPress is a trap when — any ONE of these forces Track A:**
- Complex custom domain logic (workflows, calculations, multi-role processes) that would live in a thicket of plugin hooks — WP's model is "content + presentation," not application domain (violates core §3's Clean-core rule for nontrivial domains).
- The real product is an API/app and WP would just be the login + billing shell.
- Performance/scale requirements beyond cached content pages (real-time features, heavy write traffic).
- Compliance/security posture incompatible with a large plugin attack surface.

**Gray zone — "mostly content + one custom feature":** WP + one custom plugin
(§B4) is fine up to roughly *one* well-bounded feature. Two or more app-like
features → headless WP (§B2) or Track A with a CMS. Re-evaluate honestly; "just
one more plugin" is how trap projects happen. Record the fork decision as an ADR
with the trap-list explicitly checked.

## B2. Theme Approach

| If… | Use | Why |
|---|---|---|
| Standard client site, editors manage *content* not *layout*, you maintain it | **Custom block theme** (theme.json + custom Gutenberg blocks/patterns) *(default)* | Modern WP-native path: editors get visual editing inside guardrails you define; no builder lock-in or licence; best performance of the three. |
| Client insists on rearranging layouts themselves post-handover, small budget, site is short-lived/simple | **Page builder (Elementor)** — reluctantly, with the trade-off documented in writing | Builders add weight (§B5), licence renewals, update-conflict surface (§B6), and lock-in. If forced: one builder, no addon-pack sprawl, budget the perf tax. Never mix builder + custom blocks. |
| Content lives in WP, frontend needs Track-A capabilities (app-grade UI, multiple consumers, brand-critical performance) | **Headless WP** (WP admin + REST/WPGraphQL → Next.js/Astro frontend per A1/A2) | Editors keep the familiar admin; frontend follows all Track A rules. ⚠️ Costs double: two deploys, preview plumbing, you now own everything themes/plugins gave free (SEO meta, forms, redirects). Only when the frontend requirements genuinely justify it — not as a default modernization. |

**Ownership rule:** whoever maintains it long-term picks the lane — your
maintenance contract → custom block theme; client's generic-WP admin → the
simplest thing they can actually operate.

## B3. Plugin Vetting Checklist

Run per plugin BEFORE install; failing ≥2 items = find an alternative or build
it (§B4). Post-launch bugs on WP sites trace to unvetted plugins more than any
other cause.

- [ ] **Maintenance pulse:** updated within 6 months AND "tested up to" within one major WP version. Abandoned = future security hole (core §5 A06 applies — plugins ARE your dependency tree).
- [ ] **Security history:** search WPScan/Patchstack for CVEs. Past CVEs are fine *if patched fast*; a pattern of slow/no fixes is disqualifying.
- [ ] **Install base + support signal:** ≥10k active installs (exceptions need a code read); support threads actually answered in the last month.
- [ ] **Performance cost measured, not assumed:** install on staging → Query Monitor → check added queries per page, autoloaded options size, frontend JS/CSS injected on pages that don't use the feature.
- [ ] **Scope discipline:** does ONE thing you need. Reject Swiss-army plugins for a single feature (you inherit the whole attack/update surface).
- [ ] **Exit cost:** where does its data live? Custom tables with export = fine; shortcode-spaghetti in post content = lock-in, plan accordingly.
- [ ] **Licensing:** `../04-delivery/` §3's account-ownership rule applies to plugin licences (client's name and billing from day one, you as invited admin). WP-specific: renewals are a §B6 maintenance-contract line item.
- [ ] **Count rule:** >20 active plugins on a standard site is a design smell — audit before adding, not after.

## B4. Custom Plugin / Theme Development Standards

- **Never modify core, plugin, or parent-theme files. No exceptions.** Updates
  erase it. Extend via **hooks (actions/filters)**; site customizations of a
  third-party theme go in a **child theme**; standalone functionality goes in a
  **custom plugin** (survives theme swaps) — feature code in a theme is a smell.
- Structure custom plugins like real software (core §1/§3 apply): a main file
  that only wires hooks, classes under `src/` with single responsibilities,
  Composer autoloading, everything namespaced/prefixed (WP is one global
  namespace — collisions are real).
- **Security — core §5 A03's `$wpdb->prepare()` rule, plus the WP-specific trio
  on EVERY custom endpoint/form handler:**
  - [ ] **Escape output, late:** `esc_html()` / `esc_attr()` / `esc_url()` / `wp_kses_post()` at the point of echo — pick by context, never echo raw meta/user data.
  - [ ] **Sanitize input, early:** `sanitize_text_field()`, `sanitize_email()`, `absint()` on everything from `$_POST/$_GET/REST` params.
  - [ ] **Nonce + capability, together:** `wp_verify_nonce()` proves intent (CSRF), `current_user_can()` proves permission (core §5 A01) — a nonce alone is NOT an auth check; every admin-ajax/REST mutation needs both (`permission_callback` is mandatory on REST routes — never `__return_true` on mutations).
- Custom queries: `WP_Query`/`$wpdb->prepare()` only; index custom tables you
  create; no unbounded `posts_per_page => -1` on frontend requests.
- Settings/data: custom tables for relational/high-volume data; `autoload=false`
  on options not needed every page load (see §B5).
- Ship with: readme covering hooks provided, uninstall routine (`uninstall.php`
  cleans options/tables), and version-gated DB migrations (mobile §4's
  migrations-from-v1 rule applies to WP plugins too).

## B5. Performance & Caching Stack

Layered, in this order — each layer only sees traffic the previous missed:

```
CDN/edge (full-page cache for anonymous traffic, static assets)
  → Page cache (host-level or WP Rocket/Cache Enabled — pick ONE)
    → Object cache (Redis via a drop-in — mandatory for WooCommerce/
      membership/anything logged-in-heavy, since page cache misses those)
      → PHP: current supported version + OPcache (host requirement, §B6)
        → MySQL: slow-query log reviewed at launch + quarterly
```

**Common WP performance killers — audit checklist (Query Monitor is the tool):**
- [ ] Unbounded/unindexed queries: `posts_per_page => -1`, meta_query on unindexed keys, `SELECT *` from options.
- [ ] **Autoloaded options bloat** (>1 MB autoloaded = every request pays it): `SELECT SUM(LENGTH(option_value)) FROM wp_options WHERE autoload='yes'` — audit at launch and each maintenance cycle.
- [ ] Plugin assets loaded site-wide for one page's feature → dequeue conditionally.
- [ ] Render-blocking: builder CSS/JS payloads, unminified assets, missing font rules (A6 font checklist applies to WP too).
- [ ] Admin-ajax/heartbeat abuse by plugins polling every few seconds.
- [ ] External HTTP calls in the request path (licence pings, API calls without caching/timeouts) — wrap in transients with a timeout.
- [ ] Images: A6 image rules apply; on WP add an offload/optimize step (native WebP support + regenerate on upload).
- [ ] Cron: `wp-cron.php` on high-traffic sites → disable and run via real system cron.

Targets: same Core Web Vitals table as A6 (public pages column). A WP site has
no exemption from the LCP ≤ 2.5 s bar — builders that can't hit it were the
wrong §B2 choice.

## B6. Update & Maintenance Strategy

This is a sellable contract (`../05-business/`), not a favor. Unmaintained WP
sites WILL be compromised (core §5 A06) — a client declining maintenance signs
that risk in writing.

**Cadence:**
- Security releases (core + plugins with disclosed CVEs): **within 48 h**, expedited path below.
- Routine plugin/theme updates: **monthly batch**, staging-first.
- WP major versions: within **1 month** of `.1` release (never day-one on client production).
- PHP version: track host's supported window; test on staging one version ahead so host upgrades never surprise you.

**Update procedure — staging is non-negotiable:**
1. Verify last-night backup restorable (a backup you haven't restored is a hope, not a backup).
2. Snapshot staging from production (DB + files); apply updates there.
3. Smoke-test: the site's 3–5 money paths (§C checklist), visual-diff key templates, Query Monitor for new PHP notices/query regressions.
4. Apply to production in a low-traffic window; re-run smoke tests; keep one-click rollback (previous plugin ZIPs + DB snapshot) for 48 h.
5. Log what changed (versions before/after) in the maintenance log — this is your evidence trail when "the site broke" arrives two weeks later.

**Backups:** company standard in `../04-delivery/` §7 applies (retention,
off-host storage, quarterly restore drill); WP specifics: DB + `wp-content`
are the payload, plus the "commonly forgotten" WP row there. **Auto-updates:** minor core security = on; plugins/major core
= off on maintained sites (unattended plugin auto-updates break sites silently);
on *unmaintained* sites flip plugin auto-updates on — silent breakage beats
silent compromise.

**Contract checklist:** hosting/domain/licence accounts per `../04-delivery/`
§3's ownership rule; uptime monitor + alert recipient defined; response-time
SLA for security vs cosmetic issues; scope line between "maintenance" and
"new feature work."

---

# C. Web Testing (both tracks)

Core §4 pyramid holds; for glue-heavy WP work the integration-heavy inversion
in core §4 applies (unit tests of hook-wiring test nothing).

- **E2E: Playwright** *(confirmed default — both tracks)*: cross-browser
  (Chromium/Firefox/WebKit — WebKit coverage matters, Safari is the new IE),
  trace viewer for CI flake diagnosis, one tool for app E2E + WP smoke suites.
  Takeover projects: **inherit a client's existing Cypress/Selenium suite —
  don't migrate** (core §7).
- **What gets E2E** (same discipline as mobile §7 — money flows only, ~10–20
  scenarios cap): signup/login, checkout/payment, the core value loop, contact/
  lead forms (Track B's money path), CMS publish-to-frontend round-trip.
- **API/integration layer** (Track A): contract tests against the OpenAPI spec
  (A3) + one integration test per repo/DB seam (core §4) — cheaper and less
  flaky than E2E for logic coverage; E2E only proves the wiring.
- **Visual regression** (Playwright screenshots or Percy/Chromatic): worth it
  for component libraries/design systems (A5) and **WP update cycles** (§B6
  step 3 — diff key templates pre/post update; catches the CSS breakage class
  of plugin-update bugs that functional tests miss). Not worth it on rapidly-
  changing early-stage UIs — you'll just bulk-approve diffs.
- **Manual QA per release** (don't automate): real Safari/iOS device pass
  (WebKit-in-CI ≠ real iOS), keyboard-only navigation + screen-reader spot
  check on key flows, cross-browser check of the 2–3 most complex pages,
  content-editor walkthrough on WP (can the client actually publish?).

**WordPress-specific constraints:**
- [ ] **Plugin-conflict bisection** is the debugging primitive: reproduce → disable half the plugins → binary-search to the pair. Health Check plugin's troubleshooting mode does this without touching production visitors.
- [ ] **Compatibility matrix per maintained site:** PHP version × WP core version × critical-plugin versions, recorded in the repo. Test the *next* PHP version on staging before the host forces it (§B6); PHP deprecation notices in Query Monitor are your early-warning signal.
- [ ] Custom plugin code (§B4): PHPUnit + `wp-env`/wp-phpunit against the matrix's PHP versions in CI; smoke E2E of the plugin's user-facing flow via Playwright.
- [ ] After every §B6 update batch: run the Playwright smoke suite + visual diffs on staging — this is the automation that pays for itself fastest in WP maintenance contracts.

---

## Cross-references
- Principles, architecture, testing pyramid, OWASP/auth/secrets, git/ADR: `../00-core/00-core-SKILL.md`
- Mobile apps consuming these APIs (A3 versioning affects app-store release lag): `../01-mobile/01-mobile-SKILL.md`
- ML features behind web APIs, inference endpoints: `../03-ai-ml/03-ai-ml-SKILL.md`
- Hosting choices, CI/CD, uptime monitoring, backup infrastructure: `../04-delivery/04-delivery-SKILL.md`
- Maintenance contracts, licence/renewal ownership, scope lines: `../05-business/05-business-SKILL.md` *(placeholder)*
