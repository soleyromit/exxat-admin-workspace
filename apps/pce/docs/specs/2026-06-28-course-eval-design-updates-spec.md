# Course Evaluation — Design Update Spec & Plan

**Source meeting:** Granola "Course Eval sync up" — Jun 25 2026 (raw transcript) · Romit ↔ Aravind (product). **PM: Monil.**
**Design base (IA):** live app `pce-three.vercel.app` — *not* the local `dev` repo (the deploy is ahead; `surveys/dashboard` exists only on the deploy). Build **on** the live IA.
**Method:** requirements from the meeting are *frozen input*; the design solution is Mobbin-driven. Every screen is reviewed with `ds-conformance-reviewer` before "done".

---

## 0. Separation of concerns

| Frozen (product owns) | Design (Romit owns, Mobbin-driven) |
|---|---|
| Data points / no new columns | Every screen layout, hierarchy, density |
| Personas: operational **admin** (response rate) vs **program director** (analytics) | How response-rate triage is surfaced |
| Build order: Setup term → Template → Survey → Settings | Where "Add data" lives (drawer vs Prism tab), stepper shape |
| Naming: "Fixed" → **"Add data"** | Microcopy, empty/warn states |
| Single dashboard metric = **live-term response rate** | Card vs list, reminder affordance placement |

The transcript's on-screen sketch is **requirement-through-a-rough-sketch only** — Aravind himself called it *"a very bad design… bare metal."* It is not the design.

---

## 1. Live IA (the base to build on)

```
Course Evaluations                 General Surveys
 ├─ Dashboard   /surveys/dashboard   └─ Directory
 ├─ Templates
 ├─ Analytics    ← program-director persona; NOT a design priority now
 └─ Settings
```

**Build priority (month-1 eng handoff, grooming order):** ① Setup Term · ② Create Template · ③ Create/Push Survey · ④ Settings. **Defer:** Analytics, General Survey, Directory polish.
**Deadline anchor:** final designs of ①–④ reviewed by Aarti, next Wednesday (Bangalore).

---

## 2. Per-surface specs

### ① Setup Term + "Add data" audit — *priority 1* · nav: Dashboard → Configure Term Calendar

**Requirement (frozen):** Configure a term (name + start/end, end-after-start). System auto-discovers the term's course offerings from Prism, then runs a **data-readiness audit**: each offering must have the faculty roles chosen in Settings (e.g. ≥1 instructor + ≥1 coordinator). Missing → flagged with an **Add data** action that routes to Prism (new tab now; inline drawer later). Audit is a **mandatory gate before push**, with a **soft-warning override** ("students won't see those sections"). Rename "Fixed" → **"Add data"** (positive framing).

**Mobbin analogy:**
- [Apollo — Data Health Center](https://mobbin.com/flows/cc88e7e2-b3c7-47eb-b1f0-fa4d90ae4179): coverage donuts ("X% have accurate data" / "Missing emails") + per-segment breakdown + **View / Schedule** actions. Positive "health" framing = the "Add data" tone we want.
- [Rox — Needs Attention tab](https://mobbin.com/flows/e88d71cc-ca76-4aec-848f-01c78fc7b29c): segmented tabs (All / … / **Needs Attention (3)**) with per-row status chips ("Enrichment failed"). Maps to the audit results list.
- [Apollo — Setting up dashboard](https://mobbin.com/flows/e5fe463d-a564-4565-b5bb-4d8f6d9b4207): numbered setup steps as a guided readiness flow.

**Spec:**
- Term config as a **right Sheet** off the dashboard (term name, start, end) — date validation end-after-start; evaluation/result windows are *derived*, not asked (see Settings ④).
- On save → audit runs → **readiness summary**: a coverage header (offerings ready / needs data) + a list scoped to "Needs data". Frame as readiness, not failure.
- Each row: offering · which role is missing · **Add data** (routes to Prism, new tab) · re-run affordance.
- Push gate: primary CTA disabled→enabled by readiness; override = secondary path with a confirm carrying the soft warning.

**DS components:** `Sheet` (term config) · `KeyMetrics` (variant `compact`) or coverage header for ready/needs counts · `DataTable` for the needs-data list (PCE vendored table) · `ListHubStatusBadge` for row status · `LocalBanner` for the soft-warning override · confirm `Dialog`. *(Verify APIs via `node tools/ds/source.mjs` before JSX.)*

**States:** loading (audit running) · empty (all offerings ready → success state, push enabled) · partial (some need data) · error (Prism fetch fails) · override-confirm.

---

### ② Create Template — *priority 2* · nav: Templates

**Requirement (frozen):** Exactly **3 aspects: Content, General, Faculty**. Faculty contains **multiple roles**; the same question set can apply across roles. **Clone from a role** (e.g. Instructor → Course Coordinator) — a builder-level control (**not** AI/Fast), placed **outside** the question tab. Answer/scale type **restricted to 5-point** (driven by Settings standardization).

**Mobbin analogy:**
- [Lyssna — Duplicate section](https://mobbin.com/flows/3154c5f5-54db-4b3e-bb93-a31891fd1b9d): left rail of numbered sections + inline **duplicate-section icon** on each section header → clones the whole block. This *is* the clone-from-role interaction.
- [Maze — Duplicate block](https://mobbin.com/flows/54c92c68-a783-4236-be7e-33697593a15e): section overflow menu → Duplicate / Hide / Delete; left rail navigates blocks.
- [Tally — Duplicate a block](https://mobbin.com/flows/97b5ce60-7792-46e9-956e-6ea9c843282b): right-click block → Duplicate.

**Spec:**
- Left rail = aspects (Content / General / Faculty); Faculty expands to role sections.
- Each role section header carries an inline **Clone role** (duplicate) control + overflow (rename / delete) — module-maintained, sits on the section chrome (outside the question editor body, satisfying "outside this tab").
- Question editor: type/scale picker shows **5-point only** (no 3/4/7) — bound to Settings ④.
- Reuse the prior "multiple roles share the same question set" pattern (product confirmed this is the better design).

**DS components:** section list / left rail per `templates/[id]` shell · row-flat question editor (border-b rows — **no** rounded cards/accent strips per [[feedback_template_editor_violations]]) · `DropdownMenu` for section overflow · `Select`/`RadioGroup` for scale (locked to 5) · active nav = `var(--background)`.

**States:** empty template · cloning (optimistic) · 5-point lock (disabled other options with reason tooltip) · validation (section needs ≥1 question).

---

### ③ Create / Push Survey — *priority 3* · nav: Dashboard → Push Survey (connected from Setup Term)

**Requirement (frozen):** **5-step → 4-step**: ① Select course → ② Assign/design template → ③ Evaluation window → ④ Communication. Term + academic year **pre-populated** (carried from Setup Term — skip term selection). Template **auto-assigned by course type**; window / result date / email / reminder **auto-filled from Settings** (all editable dropdowns). **Remove "Run with AI."** Keep a manual fallback (assign per row when no settings).

**Mobbin analogy:**
- [Wix — numbered stepper + Campaign Overview](https://mobbin.com/flows/9ca0fc19-6356-44ef-b2cb-d55c68213c9a): "1. Create → 2. Add Recipients → 3. Campaign Overview" with a final **review** (Subject / Sender / Recipients, each Edit) + preview + Schedule / Send Now. Model for a clean 4-step + review.
- [Eventbrite — recipients → schedule](https://mobbin.com/flows/dc7e7200-303e-403e-b8d9-546205d88df2): recipient list select + Send Now / Schedule Send (date + time).
- [Pipedrive — pre-send checklist](https://mobbin.com/flows/44e60417-3cfe-45c7-bc65-a922f4b34d5d): "Before you start sending" readiness items with right-aligned actions (ties to the ① audit gate).

**Spec / reconciliation needed:** local wizard is already merged to `1|2|3|success` ("Scope and design"). Product wants a **4-step *purpose* model**. Map current steps → target purposes **before** editing `step-*.tsx`; do not silently re-merge/split (per [[feedback_no_unauthorized_consolidation]]).
- Auto-filled fields shown as **pre-filled editable dropdowns** with a subtle "from Settings" hint, so the minimum-click path is one Continue per step while manual override stays available.
- **Remove the "Run with AI"** CTA from the wizard + dashboard.

**DS components:** existing `distribute-wizard` stepper · `DataTable` (course select) · `Select` (template/window/email/reminder, pre-filled) · review step list · `LocalBanner` (not toast) for any inline feedback.

**States:** pre-filled (settings present) · manual (no settings) · per-row missing template (block continue) · success.

---

### ④ Settings — *priority 4* · nav: Settings

**Requirement (frozen):** Centralized defaults so distribution = minimum clicks:

| Setting | Behavior |
|---|---|
| Scale standardization | **5-point only** globally (no 3/4/7) — drives Template ②. |
| Answer labels | Define the 5 labels with the scale (Strongly agree…Disagree, or custom Excellent/Good/…). |
| Faculty roles to evaluate | e.g. Instructor + Coordinator — **drives the ① audit** (only flag evaluated roles). |
| Evaluation window rule | Anchor to term end: **start −7d, end +7d** — never asked at distribution. |
| Result release rule | Same auto-derive concept. |
| Reminder cadence | "From N days before close, every X days" (~4 reminders). |
| Benchmark | School target for analytics — **later**. |

**Mobbin analogy:** standard settings/defaults layout (sectioned form, left section nav). The interesting bit is **derived-from-anchor** controls (window = term-end ±7d) — present as a rule with a live "resolves to …" preview, not a date picker.

**DS components:** sectioned settings form · `RadioGroup`/`Select` (scale, labels) · multi-select (roles) · numeric steppers (cadence) · inline derived-value preview · `LocalBanner` save confirmation.

**States:** default vs edited · save/disabled · the coupling note below.

> **Coupling:** ① audit depends on ④ "roles to evaluate"; ③ auto-fill depends on ④ window/cadence. Even though Settings is build-priority 4, its data contract must be agreed first. Flag to Monil/Aravind.

---

### Dashboard (home for ①–③) · nav: Dashboard

Already on the live deploy (Spring 2026 current / Fall 2025 last / "No upcoming term yet"; KPIs Avg Response Rate / Total Surveys / Pending Review; CTAs Configure Term Calendar, Push Survey, **Send Reminders to At-Risk (2)**, Run with AI). **Refinements only:**
- Single metric focus = **live-term response rate**; keep exactly 3 term cards (Last / Current / Upcoming) that roll forward.
- At-risk triage (courses below threshold) → inline reminder action (no 3-click drill). Live app already has "Send Reminders to At-Risk (2)" — validate it acts inline.
- **Remove "Run with AI."**
- Empty/first-run = only "Configure Term Calendar".
- Card → Layer-2 survey list (courses + completion; results when closed).

**Mobbin analogy:** [Uxcel dashboard](https://mobbin.com/flows/38221852-5363-49cd-9565-723f121a23df) · [Teachable admin](https://mobbin.com/flows/ae96f1d6-0b9e-461e-9ef9-3821593bd97b) (metric small-multiples) — secondary; the live surface is the base.

---

### Directory (defer) · nav: General Surveys → Directory

Strip exam-management/assessment leftovers; rebuild as PCE Faculty + Students **view tables** (frozen columns, UX polish only). Not in month-1 four.

---

## 3. Build & review plan

| # | Surface | Mobbin anchor | Output |
|---|---|---|---|
| 1 | Setup Term + Add-data audit | Apollo Data Health · Rox Needs-Attention | Sheet + readiness list + push gate |
| 2 | Create Template | Lyssna / Maze duplicate-section | 3 aspects + role sections + clone control |
| 3 | Push Survey (4-step) | Wix stepper+overview · Eventbrite | reconciled 4-step, auto-fill, no AI |
| 4 | Settings | sectioned defaults + derived-anchor | scale/labels/roles/window/cadence |
| — | Dashboard | live base | refinements (3 cards, at-risk, no AI) |

**Review gate (every surface):** `ds-conformance-reviewer` (localhost:4000 visual-diff + tokens + axe + WCAG/FERPA) → then `state-review` (list/form/async) → then `verification-reviewer`. Paste literal verdicts. No "done" without an evidence block.

**Open decisions to confirm with Monil/Aravind before JSX:**
1. Settings data contract (roles-to-evaluate, window rule) — gates ① and ③.
2. Push-wizard step reconciliation (current 3-merged vs target 4-purpose).
3. "Add data" drawer-now vs Prism-tab-now (transcript says tab now, drawer later).

---

## Build record (Jun 28 2026)

Process followed: `apps/pce/docs/surface-design-process.md` (Granola → Mobbin → design-contract → spec → build → ds-conformance/state/verification → visual pass).

### ① Setup Term + Add-data audit — BUILT · GREENLIGHT (runtime)
- `lib/pce-term-readiness.ts`, `components/pce/setup-term-sheet.tsx`; entry from Dashboard "Configure Term Calendar".
- Mobbin: Apollo Data Health Center · Rox Needs-Attention. Reviewers fixed: seeded audited term (label==data), Field/FieldError validation, loading+error states, amber chips. Visual pass: config / loading / readiness / soft-warning all confirmed.

### Dashboard home (Layer 1) — BUILT · runtime visual-confirmed · CHART-FREE (matches live)
- `components/pce/dashboard-home.tsx` + route `app/(app)/surveys/dashboard/page.tsx`. Nav `Dashboard → /surveys/dashboard`; `/surveys` = Layer-2 list.
- Mobbin: Jobber Home · Trello period-columns · Remote Dashboard · Zoho CRM.
- **Cross-checked live (Jun 29):** live `/surveys/dashboard` is **chart-free** (cards + KPIs + at-risk worklist, no graphs). Built to match: 3 rolling term cards (Fall 2025 / **Spring 2026 current** / Fall 2026 upcoming) + **Needs attention** worklist (live courses below the **40%** reminder threshold) with per-course + bulk Remind; "Run with AI" dropped; Configure Term Calendar reuses `SetupTermSheet`.
- **Reconciliation (Romit Jun 29):** the operational monitor (at-risk + Remind) already existed in `/analytics` Overview (`DashboardMonitor`). Resolution = **reposition**: Dashboard = chart-free worklist; Analytics keeps the charted monitor (Overview) + By Term/Faculty/Course. At-risk logic + thresholds extracted to **`lib/pce-at-risk.ts`** (single source: `AT_RISK_THRESHOLD=60` analytics tier · `REMINDER_THRESHOLD=40` operational); `DashboardMonitor` + Dashboard both consume it.
- ⚠ OPEN: unify the two thresholds (40 reminder vs 60 analytics tier)? · `DashboardMonitor` internally still uses 60 for its at-risk insight.

### Nav (aligned to live IA)
- Course Evaluation → **Dashboard / Templates / Analytics / Settings** (Dashboard = operational home, separated from program-director Analytics); standalone "Setup" folded into Settings.

### Still TODO (priority order): ② Create Template · ③ Push Survey (4-step) · ④ Settings · Directory polish · General Survey.
