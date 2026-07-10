# Courses & Evaluatees — Live Prism-Linked Readiness (push flow, step 1)

- **Date:** 2026-07-06
- **Author:** Romit Soley (Product Designer II) · drafted on Claude Opus 4.8 (1M context)
- **Product:** PCE · `apps/pce/admin` · push/setup flow, step 1 "Courses & Evaluatees"
- **Status:** Design documentation — decisions resolved (§8); implementation + execution plan is the next deliverable
- **Supersedes:** the "Run Audit" button model in the Vercel prototype (`pce-three.vercel.app/surveys/setup`)

---

## 0. Research provenance

| Source | What it gave |
|---|---|
| **Live prototype** (Playwright walk of `/surveys/setup`) | Real IA of step 1: scope rail + evaluatee pills + courses table with per-cell readiness chips + soft-warning footer. Captured every state incl. post-audit gaps (`/tmp/visual-check/setup-live/`). |
| **Granola raw transcripts** | Jun 25 Baroda read-out (Monil), Jun 30 Cadence (Monil + David), Jun 30 template-builder, Jun 29 (Vishal + Monil) — verbatim grounding for the audit's *why*, soft-warning, Fix→Add-data rename, Prism as source of truth. |
| **Local code** | `lib/pce-term-readiness.ts` (audit engine already exists), `setup-term-sheet.tsx`, `distribute-wizard/*`, `pce-mock-data.ts` (`CourseOffering` shape). |
| **Mobbin** | Remote, 7shifts, Deel, Melio, Navan, Airbnb — live-validation + gap-at-cell + needs-attention-toggle patterns. |
| **Memory** | `feedback_aarti_no_red`, `feedback_experience_live_page_not_webfetch`, `feedback_wizard_step_data_flow`, `feedback_no_basic_progress_bar_viz`. |

---

## 1. What this step is, and why it exists (context, not UI)

Step 1 of the push flow. The admin scopes **term + academic year + cohort**, declares the **evaluatee criteria** (which roles will be evaluated — e.g. Course, Instructor, Course/Clinical Coordinator), and immediately sees, per course, whether Prism holds the data those criteria require: enrolled students, an assigned instructor, an assigned coordinator. Gaps are surfaced inline with an optional **new-tab deep-link to add the missing record in Prism**.

**Why it works this way (fully grounded, Jun 25 + Jun 30 verbatim):**
- The **Prism faculty-role field is tenant-defined and non-mandatory** — *"this field is not mandatory, so no one adds it"* (David, Jun 30). It's frequently empty because nothing depended on it before.
- The **template renders one section per evaluated role** (Course / Faculty / General; Faculty multi-selects the declared roles).
- So a course **missing a coordinator in Prism → that section silently vanishes for students** — *"students will not see those sections when they fill the survey"* (Monil, Jun 25). The evaluation returns skewed and nobody notices until too late.
- Hence the admin must **declare intent → see Prism completeness → add at source or knowingly proceed.** It is **not** a Prism-vs-product diff — *"it is the data miss on the Prism itself"* (Monil). **Prism is the single source of truth** for who-teaches-what.
- **Soft, never a hard block** (settled): *"if they do not fix their data, we will still give them ability to push… a soft warning… they'll say okay, then we will still allow them to proceed."*
- **Add-data journey:** deep-link to the Prism module (new tab) → add the record → return → data reflects live → continue. An **in-app fix drawer** is an explicit **future** enhancement, not now.

The evaluatee-criteria declaration is load-bearing: it defines **what readiness means** *and* **which template sections exist**. No declaration → nothing to check and no sections to render.

---

## 2. Core design decision — no explicit "Run Audit" button (live Prism link)

**Change from the prototype:** the columns (Students, Instructor, Coordinator) are **live-linked to Exxat Prism**. Because the data is live, there is **no stale snapshot to audit**, so the manual **Run Audit / Re-run Audit** button and the "Last checked at…" timestamp are **removed**. Readiness is **ambient**:

- The instant the admin sets **term + academic year + cohort** → the matching courses load.
- The instant the admin toggles an **evaluatee criterion** → its column appears and populates with **live Prism data** (value if present, gap chip if absent).
- Gaps are visible **immediately**, with no "run" step. Each gap is an optional **"Add [role] →"** deep-link into the relevant Prism module.
- **Continue is always enabled** (soft model); proceeding with gaps triggers the soft-warning `AlertDialog`.

**Returning from Prism (add-data round-trip):** because the source is live, no audit re-run is needed — the table **re-syncs on tab focus** (and offers a subtle manual `Refresh` icon), showing *"Synced with Prism · just now."* This is a live-sync affordance, **not** an audit gate.

> Net: the step keeps *declare criteria → see readiness → optionally add data → proceed*, but drops the discrete "audit" verb. Readiness is a property of the live data, not a button you press.

---

## 2a. Verified prototype fields + course-type taxonomy

**Fields captured from the live prototype** (Playwright, re-verified across five term/year combos):

| Field | Values / behavior |
|---|---|
| **Term** * | Spring · Summer · Fall |
| **Academic Year** * | 2023-2024 … 2027-2028 |
| **Cohort** | Year 1 · Year 2 · Year 3 · Year 4 — **required** (confirmed important, Romit, Jul 6) |
| **Evaluatee criteria** | Course · Instructor · Course Coordinator (clinical adds Clinical Coordinator) |
| **Table columns** | `COURSE · STUDENTS · INSTRUCTOR · COORDINATOR · STATUS · TYPE` (Students/Instructor/Coordinator are derived from criteria) |
| **STUDENTS cell** | live count (`40 students`) **or gap `0 students`** — a real readiness gap, seen on DPT-556 Pediatric, DPT-535 Health Policy |
| **INSTRUCTOR / COORDINATOR cell** | name (`Dr. Marcus Williams`) **or** gap link `Add [role] →` |
| **STATUS** | empty (`—`) pre-push |
| **TYPE** | **CB / LB / PB** — see taxonomy below |

**Course-type taxonomy (confirmed, Romit):**

| Code | Type | Typical evaluatee roles (Prism) |
|---|---|---|
| **CB** | **Classroom Based** (didactic) | Course Coordinator, Instructor |
| **LB** | **Lab Based** | Lab Instructor, Lab TA / TA |
| **PB** | **Practice Based** (clinical/placement) | Clinical Coordinator / DCE, Placement Faculty |

Course type drives **template auto-assignment** at push (Jun 30 Cadence: *"template is marked to a course type… we know the course type from the Prism base"*) **and** the evaluatee-role set that a course's columns are checked against. The prototype's mock data only contains CB courses, so LB/PB never render there — the build must support all three.

⚠️ **Local data mismatch:** `CourseOffering.courseType` is currently `'didactic' | 'clinical'` (`pce-mock-data.ts`). It must be **expanded to `'classroom' | 'lab' | 'practice'` (CB/LB/PB)** and the mock data seeded with LB + PB rows so gaps and role-mapping can be exercised.

---

## 3. Grounded vs. prototype-only (updated)

| Element | Status | Decision |
|---|---|---|
| Per-course readiness against Prism | **Grounded** | Keep — now **live**, not audited |
| Readiness scoped to *declared* evaluatee criteria + students | **Grounded** | Keep |
| Soft-warning / proceed-anyway | **Grounded** | Keep (`AlertDialog`) |
| **"Run Audit" button + "Last checked"** | Prototype device for a snapshot | **Removed** — live Prism link makes it unnecessary (this change) |
| "Fix in Prism" wording | **Regression** — Aarti renamed Fix→**Add data** | Use **"Add data"** / "Add [role]" (local code already does) |
| **Cohort (Year 1–4)** scoping | **Required** — confirmed important (Romit, Jul 6); no transcript backing but a product decision | **Keep as a required scope selector** |
| Course **TYPE** = CB / LB / PB | **Confirmed** (Romit) = Classroom / Lab / Practice Based | Replace local `courseType: 'didactic'\|'clinical'` → 3-value; drives template + evaluatee roles |
| **Derived columns** ("appear as you select") | **No backing** — prototype-only | Keep — principled progressive disclosure (columns follow the declared criteria) |
| Hard mandatory block | **Not the decision** | Never gate Continue |
| Teal / native selects / custom pills | Prototype styling | Replace with DS (§6) |

---

## 4. Interaction design (Mobbin-informed, no audit button)

1. **Live, as-you-go readiness** — validation is continuous, not a gated "validate" step. (Modern default; Mobbin anti-pattern is the modal-only/manual-validate dump.)
2. **Named-check summary band** above the table (7shifts + Deel): `Students ✓48 · Instructor ✓45 ⚠3 · Coordinator ✓43 ⚠5` — each count links to its filtered set; clean checks still render so the admin trusts the data is live.
3. **Gap-at-the-cell, not the row** (Remote): the amber **"Add instructor →"** sits in that course's Instructor cell; satisfied cells stay neutral/green so it never becomes an amber wall.
4. **"Show only courses that need attention" toggle** (Melio): collapse 50 → the 8 with gaps, add data, untoggle.
5. **State-driven headline + action-count CTA** (Airbnb, but **un-gated**): *"8 courses need attention — add data in Prism or continue"* · **Continue with 50 courses** (count updates live as rows are deselected).
6. **Derived columns** (Deel scope-driven): the table's columns follow the evaluatee criteria — don't evaluate Coordinator → no Coordinator column.
7. **Add-data resolve** — v1: **deep-link to Prism** (new tab) + re-sync on focus (grounded). v2 (future): in-row combobox to assign from Prism without leaving (Navan).

**Anti-patterns to avoid:** modal-only error dumps, all-red walls (use amber, per `feedback_aarti_no_red`), "don't show again" on a data-integrity surface, gating the CTA.

---

## 5. Surface spec (ASCII — IA, DS-native, no audit button)

```
┌─ Push · Step 1 of 4 · Courses & Evaluatees ─────────────────────────────────────────────────┐
│  ①Courses & Evaluatees ─── ②Survey Design ─── ③Communication ─── ④Confirm                    │
│ ┌─ scope rail (~340px) ─────┐ ┌─ live courses table (DataTable) ─────────────────────────────┐│
│ │ Term *        [ Fall ▾ ]  │ │ 8 courses need attention · add data in Prism or continue      ││ ← state headline
│ │ Academic Yr * [2025-26 ▾] │ │ Students ✓47 ⚠1 · Instructor ✓45 ⚠3 · Coordinator ✓43 ⚠5      ││ ← named-check band (links)
│ │ Cohort *                  │ │ [ ] Show only courses that need attention     Synced ⟳ now    ││ ← Melio toggle + live-sync
│ │  ☑ Year 1  ☐ Year 2 …     │ │ ──────────────────────────────────────────────────────────── ││
│ │                           │ │ ☑ COURSE           STUDENTS  INSTRUCTOR    COORDINATOR    TYPE ││ ← derived cols + TYPE
│ │ Evaluatee criteria        │ │ ☑ DPT-510 Evidence ✓ 40     ✓ Dr. Chen    ⚠ Add coord →  CB  ││ ← gap-at-cell (amber)
│ │  ☑ Course                 │ │ ☑ DPT-515 Neuromus ✓ 38     ✓ Dr. Chen    ⚠ Add coord →  CB  ││
│ │  ☑ Instructor             │ │ ☑ DPT-556 Pediatr  ⚠ 0 stud ✓ Dr. Rao     ✓ Dr. Lee     LB  ││ ← students gap
│ │  ☑ Course Coordinator     │ │ ☑ DPT-620 ClinPrac ✓ 22     ⚠ Add instr → ✓ DCE Ramos    PB  ││ ← practice-based
│ │  (roles from Settings /   │ │                                                              ││
│ │   Prism subset; type-     │ │                                                              ││
│ │   aware: CB/LB/PB roles)  │ │                                                              ││
│ └───────────────────────────┘ └────────────────────────────────────────────────────────────── ┘│
│  ⚠ 8 courses have data gaps. Students won't see those sections. Add data in Prism (opens new   │ ← LocalBanner (soft)
│    tab) or deselect before continuing.                                       [ Continue → ]   │ ← always enabled
└──────────────────────────────────────────────────────────────────────────────────────────────┘

Proceed-with-gaps → AlertDialog:
  "8 selected courses are missing data. Those students won't see the affected sections.
   Add data in Prism, deselect them, or continue anyway?"     [ Add data ] [ Continue anyway ]
```

- **Evaluatee criteria** are the declared roles from Settings (a subset of the Prism role universe, Jun 30), and are **type-aware** (§2a): CB → Course Coordinator / Instructor; LB → Lab Instructor / TA; PB → Clinical Coordinator (DCE) / Placement Faculty. Columns are derived from whatever criteria are checked.
- **Cell states:** `✓ value` (green, `ListHubStatusBadge` SUCCESS) when Prism has it; **`⚠ Add [role] →`** (amber WARNING) new-tab Prism deep-link when absent. The **Students** cell shows the live enrolled count, or **`⚠ 0 students`** as its own gap state. No red anywhere.
- **Add-data link opens Prism in a new tab**; on return, the table re-syncs on focus (`Synced with Prism · ⟳`) — no re-audit.
- **Gapped rows** get a left amber accent + pale tint (as in the prototype) but via DS tokens.

---

## 6. DS mapping (replaces teal prototype)

| Prototype | DS build |
|---|---|
| Two-column step | Keep; rail = DS form controls |
| Native `<select>` Term / Year | DS `Select` |
| Cohort checkboxes | DS `Checkbox` group |
| Teal evaluatee pills | DS selectable `Badge` / toggle group |
| Courses table | **Vendored `DataTable`** (already in `step-courses.tsx`) |
| Green/amber cells | `ListHubStatusBadge` SUCCESS / WARNING — **no red** |
| "Add [role] →" link | DS `Button variant="link"` → Prism URL (new tab) |
| Footer warning | `LocalBanner` (warning) |
| Proceed-anyway | `AlertDialog` (already imported in wizard) |
| ~~Run Audit button~~ | **Removed**; replace with `Synced with Prism · ⟳` indicator |

---

## 7. Build anchors — what exists locally (build ON, don't duplicate)

- **Readiness engine (reuse the types, drop the "run" framing):** `lib/pce-term-readiness.ts` — `GapType = 'coordinator' | 'instructor' | 'students'`, `ReadinessGap`, `OfferingReadiness`, `TermReadiness`, `auditOffering()`, `auditTerm()`. Already says *"Framed as 'Add data' (positive), never 'Fix'."* In the live-link model these become **derivations over live data**, computed on scope/criteria change rather than on a button press.
- **Harvest UI from:** `setup-term-sheet.tsx` (readiness list, needs-data banner, soft-warning override).
- **Integrate into:** `surveys/push/page.tsx`, `distribute-wizard/step-courses.tsx` (DataTable), `wizard-nav.tsx` (`DEFAULT_STEPS`), `step-properties.tsx` (term select today).
- **Data shape (needs one change):** `CourseOffering { enrolledCount, primaryFacultyId (coordinator), collaboratorIds (instructors), courseType }` maps to the live columns — but `courseType` is currently `'didactic' | 'clinical'` and must be **expanded to `'classroom' | 'lab' | 'practice'` (CB/LB/PB)**, with mock rows seeded for LB + PB. Lab/practice roles (Lab TA, DCE, Placement Faculty) may need fields beyond `primaryFacultyId`/`collaboratorIds`.
- **Wizard data-flow pattern:** derive columns/criteria with the `manualOverride: T[] | null` pattern (`feedback_wizard_step_data_flow`) so columns auto-follow the declared criteria.
- **Does NOT exist yet:** evaluatee-criteria declaration in the wizard, per-cell live readiness chips, named-check summary band, needs-attention toggle, live Prism-sync indicator, wiring into push step 1.

---

## 8. Resolved decisions (Romit, Jul 6)

1. **Cohort** — **required scope selector** (Year 1–4), alongside Term + Academic Year. Not optional.
2. **Add-data resolve** — **v1 = Prism new-tab deep-link** per gap (`Add [role] →`), table re-syncs on focus. The in-row combobox (Navan) stays a **future v2**, not now.
3. **Course type** — **CB / LB / PB** (Classroom / Lab / Practice Based); expand `CourseOffering.courseType` accordingly and make evaluatee-role columns type-aware.
4. **No explicit audit button** — readiness is live off the Prism link (§2).

No open questions remain — ready for the implementation + execution plan.

---

## 9. Next deliverable

Decisions are resolved (§8). The implementation + execution plan follows in §10–§12.

---

## 10. Implementation plan (files, types, components)

### 10.1 Data model — `lib/pce-mock-data.ts`

> **IMPLEMENTED (P0) — additive, not a rename.** Blast-radius check found `courseType: 'didactic' | 'clinical'` is the **template-matching join key** (`push/page.tsx:59-60,218`) and drives `step-survey-design.tsx` bulk-assign. A global rename to CB/LB/PB would be a large, risky refactor across template/course surfaces unrelated to this feature. **Decision:** keep legacy `courseType` untouched; add a **new, additive `deliveryMode: 'classroom' | 'lab' | 'practice'`** with a `deliveryModeOf()` fallback (didactic→classroom, clinical→practice; `'lab'` has no legacy equivalent → set explicitly). **P0 boundary (documented in code):** the readiness step is the only `deliveryMode`-aware surface; `step-survey-design.tsx` + `push/page.tsx` bulk-assign still group by legacy `courseType`, so LB offerings appear under "Didactic" there until a later phase makes that step deliveryMode-aware. Vocabulary bridge (`DeliveryMode` vs `courseType` vs `MasterCourse.type`/`'seminar'`) is commented on the `DeliveryMode` type.


```ts
// CourseOffering — change courseType, add lab/practice role fields
interface CourseOffering {
  id: string
  masterCourseId: string
  termId: string
  cohort: string                              // e.g. "Year 1" — now a first-class scope filter (§8)
  enrolledCount: number                       // Students dimension (0 = gap)
  primaryFacultyId: string                    // Coordinator: CB course-coordinator / PB clinical-coordinator(DCE)
  collaboratorIds: string[]                   // Instructor: CB instructor / LB lab-instructor
  labTaIds?: string[]                         // LB only — lab TAs (NEW)
  placementFacultyIds?: string[]              // PB only — placement faculty (NEW)
  courseType: 'classroom' | 'lab' | 'practice' // CB / LB / PB  (was 'didactic' | 'clinical')  (CHANGE)
  status: 'planned' | 'active' | 'completed' | 'archived'
}
```
- **Migration:** map existing `didactic → 'classroom'`, `clinical → 'practice'`; add `'lab'`.
- **Seed:** add ≥2 LB and ≥2 PB offerings, at least one each with a gap (LB with `enrolledCount: 0` and empty `labTaIds`; PB with empty `primaryFacultyId` so the DCE/coordinator gap renders).
- Add a `COURSE_TYPE_LABEL = { classroom:'CB', lab:'LB', practice:'PB' }` and a full-name map for tooltips.

### 10.2 Type-aware criteria + live readiness — `lib/pce-course-readiness.ts` (NEW)

Replaces the **button-triggered** `auditTerm()` with a **pure derivation** recomputed whenever scope/criteria/live-data change.

```ts
export type Criterion = 'students' | 'instructor' | 'coordinator'
// UI labels: 'Course' → students · 'Instructor' → instructor · 'Course Coordinator' → coordinator

// Which Prism field satisfies a criterion, per course type (drives label + gap CTA + deep-link target)
export const CRITERION_BY_TYPE: Record<CourseOffering['courseType'], Partial<Record<Criterion, {
  label: string                 // column header + gap verb, e.g. "Clinical Coordinator"
  resolve: (o: CourseOffering) => string | null   // value if present, else null
  prismTarget: string           // deep-link segment, e.g. 'coordinator' | 'placement-faculty'
}>>> = {
  classroom: {
    students:    { label:'Students',    resolve:o=>o.enrolledCount>0?`${o.enrolledCount} students`:null, prismTarget:'roster' },
    instructor:  { label:'Instructor',  resolve:o=>o.collaboratorIds[0]??null,   prismTarget:'instructor' },
    coordinator: { label:'Coordinator', resolve:o=>o.primaryFacultyId||null,      prismTarget:'coordinator' },
  },
  lab: {
    students:    { label:'Students',    resolve:o=>o.enrolledCount>0?`${o.enrolledCount} students`:null, prismTarget:'roster' },
    instructor:  { label:'Lab Instructor', resolve:o=>o.collaboratorIds[0]??o.labTaIds?.[0]??null, prismTarget:'lab-instructor' },
    coordinator: { label:'Coordinator', resolve:o=>o.primaryFacultyId||null,      prismTarget:'coordinator' },
  },
  practice: {
    students:    { label:'Students',    resolve:o=>o.enrolledCount>0?`${o.enrolledCount} students`:null, prismTarget:'roster' },
    instructor:  { label:'Placement Faculty', resolve:o=>o.placementFacultyIds?.[0]??null, prismTarget:'placement-faculty' },
    coordinator: { label:'Clinical Coordinator', resolve:o=>o.primaryFacultyId||null, prismTarget:'clinical-coordinator' },
  },
}

export interface CellReadiness { ok: boolean; value: string | null; label: string; prismHref: string | null }
export interface CourseReadiness { offering: CourseOffering; cells: Partial<Record<Criterion, CellReadiness>>; hasGap: boolean }

export function deriveReadiness(offerings: CourseOffering[], criteria: Criterion[]): CourseReadiness[]
export function readinessSummary(rows: CourseReadiness[], criteria: Criterion[]): Record<Criterion, { ok: number; gap: number }>
export function prismAddHref(o: CourseOffering, c: Criterion): string   // `${PRISM_BASE}/offerings/${o.id}?add=${prismTarget}`
```
The existing `lib/pce-term-readiness.ts` types (`GapType`, `OfferingReadiness`) are superseded by these; keep the "Add data" voice.

### 10.3 New step component — `components/pce/distribute-wizard/step-courses-evaluatees.tsx` (NEW)

Two-column composition; **no audit button**.

```
StepCoursesEvaluatees
├─ ScopeRail (left, ~340px)
│   ├─ <Select> Term *              (Spring/Summer/Fall)
│   ├─ <Select> Academic Year *     (2023-24 … 2027-28)
│   ├─ <Checkbox> group Cohort *    (Year 1–4)  — required
│   └─ EvaluateeCriteria           (selectable <Badge> toggles: Course · Instructor · Course Coordinator)
└─ ReadinessPanel (right)
    ├─ StateHeadline                 ("8 courses need attention · add data in Prism or continue")
    ├─ ReadinessSummaryBand          (Students ✓47 ⚠1 · Instructor ✓45 ⚠3 · Coordinator ✓43 ⚠5 — each links to filtered set)
    ├─ Toolbar                       (<Checkbox> "Show only courses that need attention" · "Synced with Prism · ⟳")
    ├─ <DataTable>                   (derived columns — §10.4)
    └─ <LocalBanner variant="warning"> (soft, when gaps exist)
```
- **Wizard state (lifted to `page.tsx`):** `{ term, academicYear, cohorts: string[], criteria: Criterion[], selectedOfferingIds: Set<string> }`, using the `manualOverride: T[] | null` pattern (`feedback_wizard_step_data_flow`) so column set auto-follows `criteria`.
- **Live re-sync:** `useEffect(() => { const f=()=>setReadiness(deriveReadiness(...)); window.addEventListener('focus',f); return ()=>window.removeEventListener('focus',f) }, [criteria, offerings])`.

### 10.4 Derived DataTable columns (type-aware)

```ts
const columns: ColumnDef<CourseReadiness>[] = [
  selectColumn,                                   // lockPin left
  { key:'course', label:'Course', sortable:true, cell:r=>`${code} – ${name}` },
  criteria.includes('students')    && readinessColumn('students'),
  criteria.includes('instructor')  && readinessColumn('instructor'),
  criteria.includes('coordinator') && readinessColumn('coordinator'),
  { key:'type', label:'Type', width:72, cell:r=><Badge variant="outline">{COURSE_TYPE_LABEL[r.offering.courseType]}</Badge> },
].filter(Boolean)

// readinessColumn renderer:
//   ok  → <ListHubStatusBadge tint=SUCCESS>{cell.value}</...>       ("40 students" / "Dr. Chen")
//   gap → <Button variant="link" className="text-amber-*">          ("Add coordinator →" / "0 students")
//           onClick={() => window.open(cell.prismHref!, '_blank', 'noopener')}
//   header label = CRITERION_BY_TYPE[...] label (but header is per-column generic; per-row label lives in the gap CTA)
```
Amber = `WARNING` tint / `--chip-4`; **never red** (`feedback_aarti_no_red`). Gapped rows get a left amber accent via row className.

### 10.5 Continue (soft, never gated) — `AlertDialog`

```ts
function onContinue() {
  const gapped = selectedRows.filter(r => r.hasGap)
  if (gapped.length) setShowSoftWarning(true)   // AlertDialog
  else advance()
}
// AlertDialog: "{n} selected courses are missing data. Those students won't see the affected
//   sections. Add data in Prism, deselect them, or continue anyway?"
//   [ Add data ] (focus first gap's prismHref)   [ Continue anyway ] (advance())
```

### 10.6 Wizard wiring

- `components/pce/distribute-wizard/wizard-nav.tsx` — `DEFAULT_STEPS[0]` label → **"Courses & Evaluatees"**.
- `app/(app)/surveys/push/page.tsx` — for `course_evaluation` mode render `StepCoursesEvaluatees` as step 1; lift the scope/criteria/selection state; drop the old term-only `step-properties` first step for this mode (**survey title** defaults to `"{Term} {Year} Course Evaluations"`, editable in **Confirm**). Programmatic mode keeps `step-properties`.
- Course loading: extend the existing `MOCK_COURSE_OFFERINGS.filter(o => o.termId === termId …)` to also filter by `academicYear` + `cohorts`.

### 10.7 File change summary

| File | Change |
|---|---|
| `lib/pce-mock-data.ts` | `courseType`→CB/LB/PB, add `labTaIds`/`placementFacultyIds`, seed LB/PB rows, `COURSE_TYPE_LABEL` |
| `lib/pce-course-readiness.ts` | **NEW** — `Criterion`, `CRITERION_BY_TYPE`, `deriveReadiness`, `readinessSummary`, `prismAddHref` |
| `components/pce/distribute-wizard/step-courses-evaluatees.tsx` | **NEW** — the step (§10.3) |
| `components/pce/distribute-wizard/wizard-nav.tsx` | step-1 label |
| `app/(app)/surveys/push/page.tsx` | render new step, lift state, scope filtering, title default |
| `lib/pce-term-readiness.ts` | superseded by 10.2 (retire or thin to a re-export) |

**No new routes, no new nav rows, no new DataTable/Select/Badge/AlertDialog** (all vendored/DS).

---

## 11. Execution plan (phased, each closes with Gate-2)

> **Build home:** the step is being built at **`/surveys/setup`** (matches the prototype URL) for isolated per-phase verification. **P6 reconciles it into the canonical `/surveys/push`** (term-flow reconciliation) — either fold in as step 1 or redirect. Not a sanctioned second production flow.

> **Status:** ✅ **P0 done** (additive `deliveryMode` CB/LB/PB + `deliveryModeOf`, LB/PB fixtures, `pce-course-readiness.ts`; tsc-clean, runtime-verified, verification-reviewer resolved). ✅ **P1 done** (`ProgramTerm.season` — Term & Academic Year independent selectors; `pce-course-scope.ts`; scope rail). ✅ **Integrated into `/surveys/push` step 1** (replaced `StepCourses`; `/surveys/setup` → 307 redirect to `/surveys/push`; `termId`/`selectedCourseIds` synced). ✅ **P2 done** (Mobbin-researched: chips→columns correlation; vendored `DataTable` with columns derived from criteria; type-aware gap cells `⚠ Add <role> →` → Prism new tab; full type labels "Classroom/Lab/Practice based"; selection via `useTableState` reported up; Gate-2: state-review GREENLIGHT, ds-conformance 4 fixes applied — semantic warning token, sr-only new-tab hint, toolbar count, `getRowSelectionLabel`; axe `A11y 0 · DS 0`).

| Phase | Ships | Depends on |
|---|---|---|
| **P0** ✅ | Data model: additive `deliveryMode` CB/LB/PB, lab/practice role fields, LB/PB mock seed; `pce-course-readiness.ts` lib | — |
| **P1** ✅ | `ProgramTerm.season` (Term/Year independent); scope rail: DS `Select` Term + `Select` Year, required `Checkbox` Cohort, evaluatee-criteria `ToggleGroup`; lifted wizard state; term/year/cohort course loading | P0 |
| **P2** | Derived, type-aware `DataTable` with live readiness cells (✓ value / ⚠ gap) + Type column | P0, P1 |
| **P3** | `ReadinessSummaryBand` (named counts, link-to-filter) + "show only needs attention" toggle + state-driven headline | P2 |
| **P4** | Prism new-tab deep-links (`prismAddHref`) + focus re-sync (`Synced ⟳`) | P2 |
| **P5** | Soft-warning `AlertDialog` on Continue + `LocalBanner`; Continue always enabled | P2 |
| **P6** | Wizard wiring (`wizard-nav`, `page.tsx`), retire old first step, title default | P1–P5 |

**Gate-2 per phase:** `ds-conformance-reviewer` (visual-diff vs localhost:4000 + tokens + axe), `state-review` (loading/empty/error/selection states of the table + rail), `verification-reviewer` — paste each literal verdict; grep changed files for `uppercase tracking-wide` · `py-20 text-center` · `color-mix(in oklch`; evidence block (axe path, DS import file:line, grep); spawn `Explore` to grep-verify every claimed change.

## 12. Out of scope (this build)

- In-app fix **drawer** (grounded as future) — v1 uses Prism new-tab deep-link.
- In-row resolve **combobox** (Navan) — future v2.
- Steps 2–4 (Survey Design / Communication / Confirm) beyond carrying the gap warning + title default.
- Question-level analytics, scheduling/date logic, reminders (separate specs).
- Real Prism API — deep-link targets are URL stubs against the existing `PRISM_BASE` pattern.
```
