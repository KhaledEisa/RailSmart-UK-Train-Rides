---
name: mobile-engineering
description: >
  Mobile-specific patterns for native (Swift/Kotlin) and cross-platform
  (Flutter/React Native) app development, including hardware-integrated
  companion apps (BLE peripherals, Raspberry Pi devices, sensors — e.g.
  Echosense-style projects). Trigger this skill when: choosing a mobile stack,
  designing app architecture or state management, implementing offline
  storage/sync, integrating BLE/camera/GPS/background sensor reads, preparing
  an App Store or Play Store submission, or planning mobile QA. Extends
  ../00-core/00-core-SKILL.md — core rules (SOLID, architecture defaults, testing
  pyramid, security baseline, git workflow, ADRs) apply unchanged and are not
  repeated here; this file only adds mobile deltas.
metadata:
  version: 1.0.0
  owner: sw-eng-company-skills
  extends: ../00-core/00-core-SKILL.md
  status: active
---

# Mobile Engineering (Native + Cross-Platform)

**Precedence:** `00-core` rules apply by default. This file adds mobile-specific
decisions. Stack and sync choices below are ADR-worthy (core §6 template).

---

## 1. Cross-Platform vs Native — Decision Guide

Work top-down; first matching row wins. Record the choice + losing options as an ADR.

| If the project needs… | Pick | Why |
|---|---|---|
| Heavy custom BLE (custom GATT, long-lived connections, background reads), real-time audio/DSP, ARKit/ARCore depth, or platform-bleeding-edge APIs | **Native (Swift + Kotlin)** | Cross-platform BLE/background plugins lag OS releases and leak platform differences; you end up writing native modules anyway — skip the bridge tax. |
| One platform only (client's fleet is all-iPad, Android-only kiosk) | **Native for that platform** | Cross-platform buys nothing with no second platform. |
| Standard app UI + moderate hardware (BLE provisioning, foreground camera/GPS), both platforms, one team, client budget/timeline | **Flutter** *(company default for cross-platform)* | One codebase, consistent rendering, strong plugin ecosystem; `flutter_blue_plus`/`camera` cover the common 80%. Escape hatch: platform channels for the native 20%. |
| Existing React/TS team or heavy shared logic with a React web product; UI-heavy, hardware-light | **React Native (+ Expo)** | Skill reuse beats framework preference; Expo EAS removes most build pain. Drop to bare workflow the moment you need custom native modules. |
| MVP to validate demand, ≤3 core screens, no hardware | **Flutter or RN — whichever the team ships fastest** | Speed is the requirement; don't over-deliberate. |

**Hardware-integrated (Echosense-type) rule of thumb:** Flutter UI + a thin
**native module per platform for the BLE/sensor layer** is usually the sweet
spot — cross-platform where it's cheap (UI, state, sync), native where it's
load-bearing (radio, background execution). Budget the native layer explicitly;
it's 30–50% of the effort on these projects, not a plugin install.

**Client conversation checklist before committing a stack:**
- [ ] Both platforms actually required at launch? (Ask — clients often assume yes, need no.)
- [ ] Any single feature on the native-only list above? One is enough to change the answer.
- [ ] Who maintains it after handover — their team's skills constrain the stack (core §7 greenfield-vs-takeover rule; secrets inventory per core §5).
- [ ] Target devices: min OS versions + low-end Android RAM class (drives perf budget).

---

## 2. State Management — Per Framework

Core §3 applies: MVVM/unidirectional by default; MVI-style only where state
complexity earns it. Below is the concrete mapping. **Pick ONE per app** — mixed
state solutions are a top source of mobile spaghetti.

### Flutter
| Pattern | Use this when |
|---|---|
| **Riverpod** *(default)* | Any nontrivial app. Compile-safe DI + reactive state in one; testable without widget tree; async/stream providers map cleanly onto BLE/sensor streams. |
| **BLoC** | Larger team wanting enforced event-in/state-out discipline (MVI-style), or complex flows needing an auditable event log (pairing wizards, checkout). More ceremony — don't pick for small apps. |
| **Provider** | Maintaining an app that already uses it, or trivial apps. Don't start new nontrivial projects on it — Riverpod is its successor. |
| **setState** | State local to one widget (toggle, animation, form field). Never for anything two widgets share. |

### React Native
| Pattern | Use this when |
|---|---|
| **Zustand** *(default client state)* | Most apps. Minimal boilerplate, testable stores, no provider pyramid. |
| **TanStack Query** *(default server state)* | Any API-backed data. Caching/retry/refetch is its job — don't hand-roll that in Redux/Zustand. Most "state management pain" is server state mismanaged as client state. |
| **Redux Toolkit** | Big team + big app needing strict conventions, middleware (offline queues, analytics on every action), or time-travel debugging. Overkill below ~15 screens. |
| **Context** | Dependency injection of rarely-changing values only (theme, auth session, locale). Never high-frequency state — every consumer re-renders. |

### Native
| Pattern | Use this when |
|---|---|
| **iOS: SwiftUI + MVVM, `@Observable` + Swift Concurrency (async/await, AsyncSequence)** | Default for all new iOS work. Combine only for legacy code or complex stream composition (debounced sensor fusion). |
| **Android: Jetpack Compose + ViewModel + Kotlin `StateFlow`/coroutines** | Default for all new Android work. Expose one `StateFlow<UiState>` per screen; UI collects, never mutates. |
| **MVI (single sealed UiState + intents)** | Same trigger as core §3: many concurrent inputs where state bugs hurt — live sensor dashboards, chat, multi-step pairing. Natural fit when a BLE device is streaming into the UI. |

**Cross-cutting rule:** domain + sync + device-communication logic lives below
the state layer (core §3 Clean-ish: UI → state holder → use cases → repos →
platform adapters). If swapping Riverpod for BLoC would touch business logic,
the layering is wrong.

---

## 3. Platform Convention Compliance (HIG + Material)

Baseline is non-negotiable: **iOS follows Human Interface Guidelines, Android
follows Material 3.** "One design on both platforms" is a decision the *client*
must sign off on (brand-heavy apps do it deliberately — fine), never a default
that happens by omission.

### The 4 violations that make cross-platform apps feel fake — check every review
1. **Broken navigation gestures.** iOS edge-swipe-back must work on every
   screen (custom transitions/gesture handlers silently kill it). Android
   system back — including **predictive back** on 14+ — must pop the same stack
   the on-screen UI implies. Test: navigate 3 levels deep, back out entirely
   using only gestures/system back, on both platforms.
2. **Wrong-platform system components.** Share sheets, date/time pickers,
   alerts/action sheets, and permission dialogs must be the platform's own.
   A Material date picker inside an iOS app (or Cupertino alerts on Android)
   is the single fastest "not native" tell.
3. **Ignoring system text scaling & safe areas.** App must survive OS font
   scaling at max accessibility size (no clipped/overlapping text) and respect
   notch/home-indicator/status-bar insets. Fixed-height text containers are the
   usual culprit. Test once per release at max font scale.
4. **Wrong navigation structure idiom.** iOS: bottom tab bar, titles via nav
   bar, no hamburger-as-primary-nav. Android: Material top app bar + tabs or
   navigation bar; back arrow behavior consistent with system back. Mirroring
   one platform's structure onto the other reads as a port, not an app.

**Also mandatory (not just polish):** touch targets ≥ 44pt (iOS) / 48dp
(Android); haptics via platform APIs on key confirmations; dark mode honored if
the OS requests it (or explicitly disabled everywhere — never half-supported).

---

## 4. Offline-First & Data Sync

Mobile default: **the local DB is the source of truth for the UI; the network
is a background concern.** UI reads local, writes local; a sync layer reconciles.
Never block a screen on a network call that has a cached answer.

### Local DB choice
| If… | Use |
|---|---|
| Flutter, relational data / queries / migrations (default) | **Drift** (SQLite, typed, reactive queries) |
| Flutter, simple object cache / settings / small collections | **Hive or Isar** — but don't outgrow it; migrating a mis-chosen KV store to SQL mid-project is a classic time sink |
| React Native, offline-first with sync ambitions | **WatermelonDB** (built for sync) or **expo-sqlite/OP-SQLite + Drizzle** |
| Native iOS | **GRDB** (default) or SwiftData (simple, Apple-ecosystem-only apps) |
| Native Android | **Room** (default) |
| Tempted by **Realm** | ⚠️ Don't for new projects — MongoDB deprecated Atlas Device Sync (2024) and Realm's future is maintenance-mode; local-only legacy apps may stay. |

Rule regardless of choice: schema **migrations are versioned and tested from v1**
(core §1 YAGNI exception applies to mobile DBs with force — you can't fix a
botched migration on 10k devices).

### Conflict resolution — decide BEFORE building sync, record as ADR
```
Is the data per-user, single-device-at-a-time in practice?
  → Last-Write-Wins on updatedAt (server clock, not device clock). Done.
Multiple writers on the same records (shared lists, team features)?
  → Field-level merge with version/revision counters; LWW per field;
    surface true conflicts to the user only when both sides edited
    the SAME field (rare — don't design UI for conflicts first).
Concurrent collaborative editing (text, canvases)?
  → CRDTs (Yjs/Automerge) — and question whether mobile really needs it.
Sensor/telemetry data (Echosense-type)?
  → No conflicts by design: append-only event log, device is the only
    writer, server deduplicates on (deviceId, sequenceNo). Never sync
    telemetry as mutable rows.
```
Non-negotiables: idempotent writes (client-generated UUIDs), a persisted outbox
queue for pending writes with retry + exponential backoff, and tombstones for
deletes (soft-delete + sync, then purge).

### Build vs buy the sync engine
- **Buy/adopt (default):** Firestore offline persistence, **PowerSync** or
  ElectricSQL over your existing Postgres, Supabase + client cache. If the
  need is "CRUD data that survives airplane mode," a hand-rolled engine is a
  KISS violation (core §1).
- **Build** only when: custom conflict semantics the engines can't express,
  data-residency/on-prem constraints, or sync target is a *device* (Pi over
  BLE/local network — see §5), not a cloud DB. Building = outbox + pull-with-
  cursor + merge rules; budget it as a real feature (weeks, not days).

---

## 5. Hardware & Sensor Integration (Echosense-type projects)

Architecture rule: wrap every radio/sensor behind a **`DeviceTransport`
interface** (core §2 Adapter) — `connect / disconnect / send / stream / state`.
UI and domain code never import a BLE library. This is what lets you swap
BLE ↔ Wi-Fi/LAN transport later — a real occurrence on Pi projects.

### BLE checklist
- [ ] **GATT design (you control the Pi side too — design both ends):** one service per capability; notify characteristics for telemetry, write-with-response for commands; negotiate MTU up front (default 23 bytes will fragment everything); include a protocol-version characteristic from v1.
- [ ] **Connection lifecycle is a state machine** (core §2 State): `scanning → connecting → discovering → ready → degraded → reconnecting`. Auto-reconnect with exponential backoff + jitter; surface state to UI honestly (no fake spinners).
- [ ] **iOS:** state restoration (`CBCentralManager` restore identifier) for background reconnects; `bluetooth-central` background mode declared *and justified* (see §6); scanning in background requires service UUID filters — plan for it, generic scans won't fire.
- [ ] **Android:** runtime permissions differ by API level (≤30: location required for scan; 31+: `BLUETOOTH_SCAN`/`BLUETOOTH_CONNECT`, add `neverForLocation` flag if true); long-lived connections need a **foreground service** with visible notification, declared type `connectedDevice`.
- [ ] Expect fleet weirdness: test on at least one low-end Android (aggressive battery killers — Xiaomi/Samsung task killers break background BLE; document the "exclude from battery optimization" onboarding step).
- [ ] Never trust device data: validate/bounds-check every packet from the peripheral (core §5 A03 applies to BLE payloads too).

### Raspberry Pi companion patterns
```
Pi and phone on the same LAN, mains-powered Pi?
  → Wi-Fi transport: Pi runs a local server (WebSocket/MQTT); use BLE only
    for first-run Wi-Fi provisioning (send SSID/PSK over an encrypted
    characteristic). mDNS/NSD for discovery. Faster, no BLE range/MTU pain.
Pi is battery/portable or LAN can't be assumed?
  → BLE as primary transport (Pi side: BlueZ + bleak/bluezero peripheral).
Remote access needed (user away from device)?
  → Pi ↔ cloud broker (MQTT over TLS) ↔ app. Don't tunnel BLE semantics
    through the cloud — separate protocol, shared message schema.
```
Provisioning + pairing UX is a project-sized feature: design the "device not
found / wrong network / re-pair" paths first; they dominate support tickets.

### Camera, GPS, background execution
- **Camera:** for on-device ML (ties to `../03-ai-ml/`), get frames via the
  low-level pipeline (CameraX `ImageAnalysis` / AVCapture buffers), process off
  the UI thread, drop frames rather than queue them (process latest, skip stale).
- **GPS:** request the coarsest accuracy + slowest interval the feature
  tolerates; continuous background location triggers store review friction
  (§6) and battery complaints — prefer significant-change/geofence APIs when
  "roughly where" is enough.
- **Background execution truth table** — design to it, don't fight it:

| Need | iOS reality | Android reality |
|---|---|---|
| Keep BLE alive, app backgrounded | `bluetooth-central` mode + state restoration; OS may still suspend — reconnect on wake | Foreground service (`connectedDevice`) with persistent notification |
| Periodic sensor upload | `BGAppRefreshTask` — opportunistic, no guarantees, minutes-level at best | `WorkManager` periodic (≥15 min) — survives Doze |
| Continuous high-rate capture, screen off | Effectively unavailable — buffer **on the Pi** and sync when app foregrounds/reconnects | Foreground service; still degraded by OEM battery killers |

**Design consequence:** on Echosense-style systems, the *peripheral* owns
continuous capture and buffering; the phone is a viewer/configurator that syncs
opportunistically. Never architect assuming the app is always alive.

---

## 6. Store Submission Checklist

Run 1 week before target submission, both stores. Most rejections below are
avoidable with copy-paste-diligence, not engineering.

> **Staleness warning:** these checklists cover the top *practical* rejection
> causes, not the full policies — and Apple and Google both update their
> official guidelines regularly, so a rule here may have changed since this
> file was written. Always check the current official sources immediately
> before a submission: [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
> and [Google Play Developer Program Policies](https://play.google.com/about/developer-content-policy/).

### Apple App Store — top rejection causes
- [ ] **Permission purpose strings** (5.1.1): every `NS*UsageDescription` states the *user-facing benefit* specifically ("connect to your Echosense sensor to display readings" — never "this app needs Bluetooth"). Vague strings = rejection.
- [ ] **Privacy manifest** (`PrivacyInfo.xcprivacy`): required-reason APIs declared (UserDefaults, file timestamps, etc. — third-party SDKs included), data-collection categories match the App Store privacy label *and* the actual behavior.
- [ ] **Background modes justified** (2.5.4): every declared mode demonstrably used in review; unjustified `bluetooth-central`/`location` modes get flagged. Include a reviewer note explaining the hardware flow.
- [ ] **Hardware-dependent app reviewability** (2.1): reviewers have no Pi. Provide a **demo mode** (simulated device) or demo video + credentials in review notes, or expect rejection for "app doesn't function."
- [ ] **Account deletion** in-app if account creation exists (5.1.1(v)); **Sign in with Apple** offered if any third-party social login is.
- [ ] No crashes/placeholder content on a clean install, offline included (2.1 is the #1 rejection reason overall).
- [ ] IAP used for digital goods (3.1.1); physical hardware/services may use external payment.

### Google Play — top rejection causes
- [ ] **Data safety form** matches actual collection incl. SDK telemetry (crash reporters, analytics) — mismatches trigger removals, not just rejections.
- [ ] **Foreground service types** declared in manifest (Android 14+: mandatory per-type declaration + on-store justification, e.g. `connectedDevice` for BLE).
- [ ] **Background location** permission requires a declaration form + in-app prominent disclosure *before* the runtime prompt; don't request it if foreground-only suffices (it usually does).
- [ ] **Target API level** within Play's current requirement window (moves annually — check at project start AND before submission).
- [ ] Restricted permissions (SMS, call log, `MANAGE_EXTERNAL_STORAGE`, `QUERY_ALL_PACKAGES`) — don't request unless core functionality; each needs a declaration.
- [ ] Store listing assets honest (screenshots from the real app, no unbuilt features); testing track with the hardware demo-mode build for reviewer access.

**Both stores:** version the release checklist per project; first submission of
a hardware companion app budget **2–3 review round-trips** into the client timeline.

---

## 7. Mobile Testing Specifics

Core §4 pyramid holds; mobile adjusts the layers:

| Layer | Mobile form | Target |
|---|---|---|
| Unit (~70%) | ViewModels/state holders, use cases, sync merge logic, **protocol codecs** (BLE packet encode/decode — pure functions, test exhaustively incl. malformed input) | All business + protocol logic |
| Widget/component (~20%) | Flutter widget tests / RN Testing Library / Compose UI tests / SwiftUI snapshot tests — screen renders correct state given a fake state holder | Every screen's states: loading/empty/error/populated |
| E2E (~10%) | Maestro (default for **greenfield** projects, both frameworks) or Patrol (Flutter, when native permission dialogs must be driven) / Detox (RN). **Takeover projects: inherit the client's existing E2E tooling — core §7.** | 3–5 money flows only: onboarding+pairing (with simulated device), core capture/read flow, purchase if any |

### Device strategy
- **Own physically:** 1 recent iPhone, 1 recent Pixel, 1 low-end Android (the battery-killer OEM class, §5) — plus the actual peripheral hardware. This trio catches most fleet bugs.
- **Device farm** (Firebase Test Lab / BrowserStack): run the E2E suite on a 6–8 device matrix (min-supported OS + latest, small + large screens) per release candidate — not per commit (slow, flaky, costly).
- **Hardware-in-the-loop:** automate the app against a **simulated peripheral** (fake `DeviceTransport` impl — §5's adapter pays off here) in CI; real-Pi testing stays manual/scripted on-desk. Don't attempt real-BLE automation in CI; it's a flakiness tarpit.

### Manual QA — worth a human, every release (don't automate these)
- [ ] Real-device pairing/provisioning happy path + "device off / out of range / wrong Wi-Fi password" paths
- [ ] Permission flows: deny → use app → grant later via settings (both platforms)
- [ ] Interruptions mid-flow: incoming call, backgrounding during pairing/sync, force-kill and relaunch
- [ ] Offline: airplane mode through the core flow; writes queue and sync on reconnect (§4 outbox observable)
- [ ] §3's four native-feel checks + max font scaling pass
- [ ] Fresh install on a clean device (not just upgrades over dev builds)

---

## Cross-references
- Architecture defaults, testing pyramid, OWASP, secrets, git/ADR: `../00-core/00-core-SKILL.md`
- Backend/API the app talks to: `../02-web/02-web-SKILL.md`
- On-device ML, model deployment to mobile: `../03-ai-ml/03-ai-ml-SKILL.md`
- Release pipelines (Fastlane/EAS, code signing, store CI), crash monitoring: `../04-delivery/04-delivery-SKILL.md`
- Hardware project scoping/pricing (review round-trips, native-layer budget): `../05-business/05-business-SKILL.md` *(placeholder)*
