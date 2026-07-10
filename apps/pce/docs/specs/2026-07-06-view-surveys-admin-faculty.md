# View Surveys — Admin + Faculty · Design & Execution Spec

- **Date:** 2026-07-06
- **Author:** Romit Soley (Product Designer II) · drafted on Claude Opus 4.8 (1M context)
- **Product:** PCE (Practice/Clinical Experience) · `apps/pce/admin`
- **Status:** Ready to build — 2 stakeholder confirmations pending (§3)
- **Scope:** The "View Surveys / View Single Survey Responses / Download Responses" capability set for the **Admin** and **Faculty** personas.

---

## 0. Research provenance (what this spec is grounded in)

| Source | Consulted |
|---|---|
| **Granola raw transcripts** (not summaries) | Jun 25 (Monil sync, Baroda read-out), Jun 30 Cadence (Monil + David), Jun 30 template-builder (Monil), Jun 29 (Vishal + Monil), Jul 2 ×2 (Monil), May 8 (Aarti live-monitoring), May 13 (Arvind faculty research), May 26 / May 28 (survey design + dashboard), Apr 21 / Apr 14 (workflow + distribution) |
| **Obsidian vault** | `aarti-perspective.md`, `2026-06-10-course-evaluation-aarti-brief.md`, `2026-06-09-post-course-survey-cadence-meeting.md`, `2026-05-08-course-evaluation.md`, `2026-05-28-...-moderation-report-access-monil.md`, `2026-05-13-arvind-faculty-eval-research.md` |
| **Live PCE code** | `surveys/[id]/page.tsx`, `my-surveys/[id]/results/page.tsx`, `surveys-table.tsx`, `question-chart-block.tsx`, `pce-modals.tsx`, `pce-badges.tsx`, `pce-mock-data.ts` — verified with file:line |
| **DS vocabulary** | `node tools/ds/source.mjs`, real chart usage in `question-chart-block.tsx` / `analytics-panels.tsx` |
| **Memory** | `feedback_aarti_no_red`, `feedback_no_basic_progress_bar_viz`, `feedback_ds_sheet_convention`, `feedback_survey_status_badge_consistency`, `project_pce_term_flow_reconciliation`, `feedback_no_unauthorized_consolidation` |

**Personas (RBAC):** three login experiences — student, **admin** (single super-user role for P1; sub-admin RBAC deferred), **faculty** (sees *only own* courses + own results, never peer comparisons). Admin ≠ automatic PCE viewer (Aarti, May 5).

---

## 1. Requirement → current-state truth table (verified)

Every "status today" cell below is verified against live code with file:line. This is **~70% gap-closing, not greenfield** — speccing new pages would duplicate working surfaces.

| # | Requirement | Persona | Verified status today | Work |
|---|---|---|---|---|
| **A1** | View/filter live surveys by status, course, **response rate, created by** | Admin | `surveys-table.tsx`: status filter = select `:171`; course filter = **text search** `:241`; term filter = select `:164`; response-rate column = **sortable only, NOT filterable** `:189`; **no "created by" column/filter** | **Enhance** |
| **A2** | **Preview** a live survey form | Admin | No Preview button anywhere (`surveys/[id]/page.tsx` header `:280–337`) | **NEW** |
| **A3** | Manual reminders — **single + bulk** | Admin | Single `SendReminderPopover` exists (`pce-modals.tsx:474`); row action "Send Reminder" `surveys-table.tsx:392`; **bulk not built** (only bulk action = "Push N surveys" `:313`) | **Enhance** |
| **A4** | **Extend closing date** — single + bulk | Admin | Not built; close date immutable post-push | **NEW** |
| **A5** | View single-survey responses **by question + comments** | Admin | Per-question `QuestionChartBlock` mapped per question `surveys/[id]/page.tsx:492–532`; comments = **flat list** (moderation `:541–610` + per-question "View responses" Sheet `question-chart-block.tsx:145–181`) | **Exists** (verified) |
| **A6** | **Download** responses by question + comments | Admin | Not built; no export button | **NEW** |
| **F1** | Assigned courses + **live status at a glance** | Faculty | `/my-surveys` grouped by status + `BulletGauge` + term filter; active courses bubble up | **Polish** |
| **F2** | Send reminders | Faculty | Not exposed to faculty (admin-only popover) | **NEW (reuse A3)** |
| **F3** | **QR code** for a survey | Faculty | Not built — **and zero stakeholder grounding** (see §3) | **DEFERRED** |
| **F4** | **Push back** closing date | Faculty | Not built | **NEW** |
| **F5** | View **own** results by question + comments | Faculty | Per-question Likert `results/page.tsx:406–426`; comments **grouped by sentiment** `:431–498`; **no peer leak** (prior-term own-course only `:320–324`) | **Exists** (verified) |
| **F6** | **Download** own results | Faculty | Not built | **NEW** |

**Net-new build (6):** Survey Preview · Bulk reminders · Extend/push deadline · Export · "Created by" column + response-rate filter · (QR deferred). Everything else = enhance-or-verified-present.

---

## 2. Surface architecture — no new nav rows, no new routes

Everything hangs off the two hubs and one detail/results pair that already exist. This respects `feedback_no_unauthorized_consolidation` (distinct jobs stay distinct) and avoids the DashboardMonitor/activate-wizard duplication flagged in memory.

```
ADMIN                                       FACULTY
─────                                       ───────
/surveys              (hub — enhance)       /my-surveys              (hub — polish)
  ├─ toolbar: response-rate filter (A1)       ├─ header: live at-a-glance status (F1)
  ├─ toolbar: "Created by" filter (A1)        ├─ row menu: Send reminder (F2)
  ├─ row menu: Preview (A2)                    ├─ row menu: Push back date (F4)
  ├─ row menu: Extend date (A4)               └─ row menu: QR ▸  (F3 — deferred stub)
  ├─ row menu: Export (A6)
  ├─ bulk bar: Send reminders (A3)           /my-surveys/[id]/results  (exists — F5)
  └─ bulk bar: Extend dates (A4)              └─ header: Download ▾ (F6)

/surveys/[id]         (detail — exists A5)
  ├─ header: Preview (A2)
  └─ header: Export ▾ (A6)

SHARED COMPONENTS (new)
───────────────────────
<SurveyPreviewSheet>     — deployed template rendered as a student sees it (A2)
<ExtendDeadlineDialog>   — single + bulk; admin unbounded / faculty guardrailed (A4/F4)
<BulkReminderDialog>     — non-responder counts + template pick (A3)
<ExportResponsesMenu>    — per-question CSV + comments CSV + report-card PDF (A6/F6)
```

**One job per surface:** hub = triage & bulk action · detail/results = read one survey deeply · preview = "what did I send" · each dialog = one reversible action.

---

## 3. Resolved decisions (no placeholders — explicit calls, 2 pending confirm)

Four items were unresolved *upstream* (never decided in any meeting). Rather than leave TBDs, this spec makes an explicit call for each. The two that materially change build shape are flagged **CONFIRM**.

| Decision | Call made | Rationale | Confirm? |
|---|---|---|---|
| **D1 — QR codes (F3)** | **Defer.** Ship faculty "in-class reminder" instead; if QR is later required, it must be a **Prism-authenticated deep link**, never an open form URL. | Aarti, Jun 9 (verbatim): *"Exact Prism only — no email blast, no anonymous link — prevents duplicate responses."* A QR = anonymous open link → breaks duplicate-prevention, the ≥5 anonymity gate, and Prism identity. Zero grounding across Jan–Jul transcripts + vault. | **CONFIRM** |
| **D2 — Reminder anchor** | **Term-end date**, one dynamic template with `{{daysRemaining}}`. Manual reminders (A3/F2) are ad-hoc and anchor-independent. | Jun 10 Aarti explicitly labels the close-date anchor (Jun 9) a *bug to fix*; Jun 10 is newer. | **CONFIRM** |
| **D3 — Admin released label** | Admin sees **"Released to faculty"**; faculty sees **"Results available"**. | Apr 21 / May 28: *"Results available makes sense for a faculty view"*; admin needs a distinct verb. Wording never finalized upstream — this is the call. | Proceed |
| **D4 — Results granularity v1** | **Per-question breakdown ships** (already built, A5/F5); section-level filtering is a v2 analytics concern. | Section-level filtering is backend-supported (Fast) but not surfaced in tagging yet; analytics deferred below the "yellow line" (Jun 29). Per-question rendering already exists, so no regression. | Proceed |

I've written the rest assuming **D1 defer + D2 term-end**. If either flips, only §5.2 (QR) and §5.3 (reminder copy anchor) change.

---

## 4. Product analogies + DS vocabulary

### 4.1 Analogies (recognition before invention)

| Our surface | Converged pattern | Reference products |
|---|---|---|
| Live-survey list + response-rate triage | Distribution/response monitor | Qualtrics Distributions, Explorance Blue dashboard, SurveyMonkey Collector |
| Survey Preview | "Preview as respondent" | Google Forms eye-preview, Typeform preview, Qualtrics Preview |
| Bulk reminder to non-responders | "Remind non-respondents" | Qualtrics reminder email, Doodle, Calendly |
| Extend / push closing date | Edit expiration | Qualtrics survey expiration, Google Classroom due-date extend |
| Per-question results + comments | Question summaries | SurveyMonkey Question Summaries, Qualtrics Results-Reports |
| Faculty own-results card | Manager review results | 15Five, Lattice, Sprig (the already-built pattern) |
| Export (CSV/PDF) | Multi-format export | Qualtrics export, SurveyMonkey export |

### 4.2 DS components & charts — **real, from this repo** (never invented)

| Need | DS component (from `@exxatdesignux/ui` unless noted) | Reference file:line |
|---|---|---|
| Response-rate KPI strip | `KeyMetrics` `variant="flat"` / `"compact"`, `metricsSingleRow` | `surveys-hub.tsx`, `analytics-panels.tsx:375` |
| Likert distribution (1–5) | `ChartContainer` + Recharts `BarChart layout="vertical"` | `question-chart-block.tsx:19–64` (`DistributionBars`) |
| Single-choice ≤6 options | `ChartContainer` + `PieChart`/`Pie` (donut) | `chart-previews.tsx:1119` |
| Multiple-choice counts | `ChartContainer` + `BarChart(vertical)` | `analytics-panels.tsx:403` |
| Trend across terms | `ChartContainer` + `LineChart` multi-series | `analytics-panels.tsx:366–393` |
| Response rate in a table row | `BulletGauge` (vendored) | `surveys-table.tsx:189` |
| Status chips / filter | `ListHubStatusBadge` via `SURVEY_STATUS_BADGE` | `pce-badges.tsx:43` |
| Comment list | `DataTable` (or flat list) inside `Sheet` | `question-chart-block.tsx:145–181` |
| Preview / form drawers | `Sheet` (`showOverlay={false}`, `showCloseButton={false}`, footer Cancel, ≤600px) | DS Sheet convention (`component-consistency.md §6`) |
| Confirm actions | `Dialog` | `pce-modals.tsx` (CloseSurveyDialog) |
| Bulk-action toolbar | `DataTable` `bulkActionsSlot` | `surveys-table.tsx:313` |

**Color discipline** (`feedback_aarti_no_red`) — below-threshold = **amber/orange, never red**. Tokens already in `question-chart-block.tsx`:

```
tierColor:      avg ≥ 4.3 → var(--chart-2) green · 3.7–4.3 → var(--brand-color) · < 3.7 → var(--chart-4) amber
completionColor: pct ≥ 70 → var(--chart-2) · 60–70 → var(--brand-color) · < 60 → var(--chip-4) AA-safe amber
```

**No `Progress` bar exists in the DS** — response rate is `BulletGauge` (row) or a `KeyMetrics` cell (strip), never a flat div (`feedback_no_basic_progress_bar_viz`).

---

## 5. Surface specifications (ASCII = IA, not pixels)

### 5.1 A1 — Admin hub filter enhancements (`surveys-table.tsx`)

Add two things to the existing table; change nothing about the shell.

**(a) Response-rate filter** — DS filter types are `text | select | date`, so use a **select with buckets** (not a range slider):

```ts
// STATUS_FILTER_OPTIONS sibling
const RESPONSE_RATE_FILTER_OPTIONS = [
  { value: 'low',    label: 'Below 40%' },   // amber — the triage bucket (Jun 25 north-star)
  { value: 'mid',    label: '40–70%' },
  { value: 'high',   label: 'Above 70%' },   // meets target (EVAL_BENCHMARKS.targetResponseRate = 70)
]
// responseRateColumn: add filter: { type: 'select', icon: 'fa-chart-simple', options: RESPONSE_RATE_FILTER_OPTIONS }
// keep sortable: true
```

**(b) "Created by" column** — hidden by default, filterable, group-by-creator (May 26: *"based on the need, they can populate"* — hide-by-default was Romit's call, Aarti agreed):

```ts
const createdByColumn: ColumnDef<SurveyRow> = {
  key: 'createdByName',
  label: 'Created by',
  hidden: true,                                   // off by default; user enables via column menu
  sortable: true,
  filter: { type: 'select', icon: 'fa-user-pen', options: creatorFilterOptions },
}
// enable group-by via existing defaultGroupBy/groupOrder machinery keyed on createdBy
```

```
┌─ /surveys ────────────────────────────────────────────────────────────────┐
│  Course evaluations · Fall 2025                          [ Push evaluations ]│
│  ┌ KeyMetrics (flat) ───────────────────────────────────────────────────┐  │
│  │ Overall 62%   ·   Live 5   ·   Pending review 3   ·   Released 4       │  │  ← north-star = response rate
│  └──────────────────────────────────────────────────────────────────────┘  │
│  Search…   [Status ▾] [Term ▾] [Response rate ▾] [Created by ▾]   ⚙        │
│ ───────────────────────────────────────────────────────────────────────────│
│  ☐ Course            Instructor   Status   Context      Response   Deadline ⋮│
│  ☐ DPT 510 Neuro…    Dr. Rao      ● Live   Closes May21 ▓▓░░ 34%   May 21  ⋮│  ← amber bullet <40 not shown; 34% mid
│  ☐ DPT 512 Kines…    Dr. Shah     ● Live   Closes May21 ▓░░░ 22%   May 21  ⋮│  ← 22% amber (low bucket)
│ ───────────────────────────────────────────────────────────────────────────│
│  [2 selected]   [ Send reminders ]  [ Extend dates ]                        │  ← bulkActionsSlot (A3/A4)
└─────────────────────────────────────────────────────────────────────────────┘

Row ⋮ menu by status (existing + additions in bold):
  collecting/active → View · Preview** · Send Reminder · Extend date** · Export** · Close Survey
  pending_review    → Review responses · Preview** · Export**
  released          → View Results · Preview** · Export**
  scheduled         → View · Preview** · Edit
  draft             → Edit
```

### 5.2 A2 — Survey Preview (`SurveyPreviewSheet`, shared admin+faculty)

Renders the **deployed** template exactly as a student sees it. Read-only, disabled inputs, no submit. Reuses the builder's `TemplateQuestion[]` renderer — **no new question components**.

```
┌─ Sheet (right ~600px · showOverlay=false · showCloseButton=false) ─────────┐
│  Preview · DPT 510 — Neuroanatomy                          Student view      │
│  Fall 2025 · Template: Standard CE v3 · Anonymous                            │
│ ────────────────────────────────────────────────────────────────────────── │
│  Section 1 · Course performance                                             │
│   1. The course was well organized.                                         │
│      ◯ Strongly disagree  ◯ Disagree  ◯ Neutral  ◯ Agree  ◯ Strongly agree  │  ← disabled RadioGroup
│   2. What worked well in this course?                                       │
│      ┌──────────────────────────────────────────────────────────────┐       │
│      │ (free-text — disabled)                                        │       │
│      └──────────────────────────────────────────────────────────────┘       │
│  Section 2 · Faculty — Dr. Rao        (repeats once per instructor)          │
│   3. The instructor explained concepts clearly.                             │
│      ◯ … ◯ … ◯ … ◯ … ◯ …                                                     │
│ ────────────────────────────────────────────────────────────────────────── │
│  This is a preview. Student responses are anonymous.            [ Close ]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

Faculty entry: `/my-surveys` row menu "Preview" (same component, scoped to own survey).

### 5.3 A4 / F4 — Extend / Push closing date (`ExtendDeadlineDialog`)

```
┌─ Dialog ─────────────────────────────────────────────────┐
│  Extend closing date                                     │
│  DPT 510 — Neuroanatomy · currently closes Wed May 21    │
│                                                          │
│  New closing date   [ May 24, 2026        📅 ]           │
│  ⓘ Term ends May 22 — this extends 2 days past the term. │  ← ADMIN: soft note only, NOT a block
│                                                          │
│  Reminders re-anchor automatically to the new window.    │
│                          [ Cancel ]   [ Extend date ]    │
└──────────────────────────────────────────────────────────┘
```

**Admin — no hard bound** (Aarti May 28, verbatim): *"the actual closing may be a little off with this window… don't build logic around it because then it might be a limitation. It's a good reference to prepopulate, not for the actual logic."* → soft warning if `newDate > term.endDate`, never disabled.

**Faculty — clamped to admin-set min/max** (Arvind May 13, real-world): *"you cannot start before X, cannot end before Y, but within that you can modify the window."*

```ts
// faculty guardrail (uses new PceSurvey.facultyDateBounds)
const clampedMin = survey.facultyDateBounds.min   // e.g. current close date
const clampedMax = survey.facultyDateBounds.max   // e.g. admin-set hard ceiling
// date picker disabled outside [clampedMin, clampedMax]; helper text:
//   "You can move the close date between May 21 and May 28."
```

**Bulk (admin)** — same dialog from `bulkActionsSlot`: *"Extend N surveys to [date]."* Course-level override sits above term-level defaults (Jun 30 David + Monil: session-based / half-credit courses need their own dates).

**On extend:** re-compute the reminder cadence window against the new close date (D2 anchor) so scheduled reminders don't fire past close.

### 5.4 A3 / F2 — Reminders (single popover + `BulkReminderDialog`)

Single path keeps the existing `SendReminderPopover`. Bulk path from the selection toolbar:

```
┌─ Dialog ─────────────────────────────────────────────────┐
│  Send reminders to non-responders                        │
│  2 surveys · 44 students haven't responded               │
│    • DPT 510 — 26 of 40 pending                          │
│    • DPT 512 — 18 of 55 pending                           │
│                                                          │
│  Template   [ Standard reminder ▾ ]                       │  ← invite + reminder templates only (May 28)
│  Subject preview:                                        │
│  "{{daysRemaining}} days left to share feedback on       │
│   {{courseName}}"                                        │
│                          [ Cancel ]   [ Send 44 emails ] │
└──────────────────────────────────────────────────────────┘
```

**Non-responder targeting is anonymity-safe:** the system knows *who submitted* (Prism identity) but not *what they answered* — reminders go only to the non-submitter set; no response content is exposed. Confirmation via `LocalBanner`, never `toast()`: *"Reminders sent to 44 students who haven't responded."*

**Concrete copy (D2 term-end anchor):**
- Invite subject: `Your feedback on {{courseName}} is requested`
- Reminder subject: `{{daysRemaining}} days left to share feedback on {{courseName}}`
- Faculty in-class reminder (F2, the QR alternative): same reminder, sent on demand right before a scheduled in-class window (Arvind's proven tactic).

### 5.5 A6 / F6 — Export (`ExportResponsesMenu`)

```
Export ▾
 ├─ Per-question summary (CSV)
 ├─ Comments (CSV)
 └─ Report card (PDF)
```

**Per-question summary CSV columns:**
```
Question ID, Question text, Section, Subject/Instructor, Answer type,
Response count, Average,
Strongly disagree (n), Strongly disagree (%), Disagree (n), Disagree (%),
Neutral (n), Neutral (%), Agree (n), Agree (%), Strongly agree (n), Strongly agree (%)
# for choice questions: one (n)/(%) pair per choice instead of the 5-point columns
```

**Comments CSV columns:**
```
Question ID, Question text, Section/Subject, Sentiment, Response text
```
- Rows are **shuffled** (not submission order) to prevent re-identification.
- **Moderation-aware:** hidden/flagged comments excluded.
- **Anonymity gate:** if response count < 5, export is blocked with the gate message (§6).

**Report card (PDF):** the evaluation card layout (KPI strip + per-question charts + grouped comments) — faculty-dossier ready. Grounded hard by Arvind (May 13): *"I download it, save it in my teaching-evaluations folder… for tenure dossier and annual review."*

**Faculty (F6):** identical menu scoped to **own** results; header of `/my-surveys/[id]/results`.

### 5.6 F1 — Faculty at-a-glance (polish, `/my-surveys`)

Already grouped by status with `BulletGauge`. Polish only:
- Active/current courses bubble to top (Aarti May 8).
- Live response rate shown even while open (David Apr 21: *"surface it even if still open… so faculty remind their students"*) → `8/14 · 3 days left`.
- Search/filter spans **all terms**, not just active (fix scoping bug noted May 8).

### 5.7 F3 — QR (deferred stub)

Not built in this cycle (D1). If approved later:
```
[ QR code ▾ ]  →  Prism-authenticated deep link (NOT an open form URL)
                   + "Display in class" fullscreen  + downloadable PNG
```

---

## 6. States · a11y · voice (concrete copy, no placeholders)

| State | Surface | Copy |
|---|---|---|
| Empty (admin, pre-first-push) | `/surveys` | "No evaluations yet. Configure your term calendar to begin." + `Configure term calendar` CTA |
| Empty (faculty) | `/my-surveys` | "No surveys assigned to you yet." |
| Loading | all lists/charts | Skeleton rows (no DS Progress bar) |
| Anonymity gate (<5) | detail / results / export | "Results appear once at least 5 students respond. 3 of 5 so far." |
| Locked faculty results | `/my-surveys` row | Lock icon + "Pending admin release" (generic label, Apr 21) |
| Reminder sent | hub / detail | `LocalBanner`: "Reminders sent to 44 students who haven't responded." |
| Extend past term (admin) | ExtendDeadlineDialog | "Term ends May 22 — this extends 2 days past the term." (soft) |
| Export blocked (<5) | ExportResponsesMenu | "Export is available once at least 5 students respond." |

**A11y:** charts carry `role="img"` + `aria-label` (already the pattern, `question-chart-block.tsx:34`); icon-only row/menu actions get `aria-label`; contrast ≥ 4.5:1; below-threshold uses amber-not-red so it stays legible; Enter/Esc on dialogs; focus ring visible; targets ≥ 24×24.

**Voice:** no `toast()` (use `LocalBanner`/inline); admin status verb "Released to faculty" (D3); "Add data" not "Fix data" (Baroda rename); "Share results" not "access."

---

## 7. User journeys

**Admin — "week 2, response rates are low":**
1. `/surveys` → KPI strip `Overall 62% · Pending 3` (north-star).
2. Filter **Response rate = Below 40%** → the amber courses surface.
3. Optionally filter **Created by = me** to scope to own pushes.
4. Multi-select the low courses → **Send reminders** (bulk) → 44 emails to non-responders → `LocalBanner` confirm.
5. One course needs air → row menu **Extend date** → +3 days, soft "past term" note, reminders re-anchor.
6. Curious what students see → row menu **Preview**.
7. Window closes → *Closed · Pending review* → moderate comments → release → admin badge reads **"Released to faculty"**, faculty badge reads **"Results available"**.
8. Row menu **Export → Report card (PDF)** for the dept chair.

**Faculty — "did my students respond, and what did they say":**
1. `/my-surveys` → active courses top, each `8/14 · 3 days left`.
2. Low response → **Send reminder** (F2) or plan an in-class nudge.
3. Needs 2 more days → **Push back date** (F4), clamped to the admin window.
4. After release → `/my-surveys/[id]/results`: section averages + **per-question** Likert bars + comments grouped *appreciated / for consideration / also noted* — **own scores only** (verified no peer leak).
5. **Download ▾ → Report card (PDF)** for the annual review.

---

## 8. Implementation plan (files + concrete diffs)

### 8.1 Data model (`lib/pce-mock-data.ts`)

```ts
// PceSurvey — add:
createdBy: string            // admin user id who pushed
createdByName: string        // display, e.g. "Dr. Anita Patel"
isAnonymous: boolean         // CE = true, institutional = false (≥5 gate + no student attribution)
facultyDateBounds?: {        // faculty push-back guardrail (F4)
  min: string                // YYYY-MM-DD — earliest allowed close
  max: string                // YYYY-MM-DD — admin-set ceiling
}
// Backfill MOCK_SURVEYS s1–s6 with createdBy/createdByName/isAnonymous(true for CE).
```

### 8.2 State actions (`components/pce/pce-state.tsx`)

```ts
extendDeadline(surveyId: string, newDeadline: string): void
bulkExtendDeadline(surveyIds: string[], newDeadline: string): void
sendReminder(surveyId: string): { sentTo: number }
sendBulkReminder(surveyIds: string[]): { sentTo: number; perSurvey: { id: string; pending: number }[] }
// extend* also re-anchors reminder cadence to the new close window (D2)
```

### 8.3 Enhance (existing files)

| File | Change |
|---|---|
| `components/pce/surveys-table.tsx` | Add `RESPONSE_RATE_FILTER_OPTIONS` + filter on `responseRateColumn`; add hidden `createdByColumn` (select filter + group-by); extend `bulkActionsSlot` → Send reminders / Extend dates; add row-menu items Preview / Extend date / Export |
| `components/pce/pce-modals.tsx` | Add `ExtendDeadlineDialog`, `BulkReminderDialog`; keep `SendReminderPopover` |
| `app/(app)/surveys/[id]/page.tsx` | Header: add Preview + Export ▾ |
| `app/(app)/my-surveys/page.tsx` | Row menu: Send reminder, Push back date, (QR stub); bubble active courses; all-term search |
| `app/(app)/my-surveys/[id]/results/page.tsx` | Header: Download ▾ |
| `components/pce/pce-badges.tsx` | Context-aware label: `released` → "Released to faculty" (admin) vs "Results available" (faculty) |

### 8.4 New files

| File | Purpose |
|---|---|
| `components/pce/survey-preview-sheet.tsx` | A2 — reuses builder `TemplateQuestion[]` renderer, disabled inputs |
| `components/pce/export-responses-menu.tsx` | A6/F6 — per-question CSV, comments CSV (shuffled, moderation- & anonymity-aware), report-card PDF |
| `components/pce/survey-qr.tsx` | F3 — **deferred**; only if D1 approves (Prism deep link) |

**No new routes · no new nav rows · no new DataTable/KeyMetrics/Chart** (all vendored or DS).

---

## 9. Execution plan (phased)

| Phase | Ships | Depends on | Rationale |
|---|---|---|---|
| **P1** | A1 — response-rate filter + "Created by" column + group-by | — | Pure enhancement, unblocks triage, lowest risk |
| **P2** | A2 — Survey Preview sheet (shared) | builder renderer | Self-contained, high value |
| **P3** | A4/F4 — Extend/Push deadline (single → bulk, guardrails) | 8.1 + 8.2 | New state action; admin then faculty |
| **P4** | A3/F2 — Bulk + faculty reminders | P1 selection toolbar | Builds on P1 |
| **P5** | A6/F6 — Export (CSV → PDF card) | final results shape | Depends on A5/F5 render |
| **P6** | F3 — QR | **D1 approval** | Blocked on stakeholder sign-off |

**Each phase closes with Gate 2:** `ds-conformance-reviewer` (visual-diff vs localhost:4000 + tokens + axe), `state-review`, `verification-reviewer` — paste each literal verdict; grep changed files for `uppercase tracking-wide` · `py-20 text-center` · `color-mix(in oklch`; evidence block (axe path, DS import file:line, grep result); spawn `Explore` to grep-verify every claimed change.

---

## 10. Open items carried into build (all upstream, none blocking except D1/D2)

1. **D1 — QR (F3):** defer vs Prism deep link. *Recommend defer.* **Blocks P6 only.**
2. **D2 — reminder anchor:** term-end confirmed over close-date. *Recommend term-end.* Affects §5.3/§5.4 copy only.
3. **Section-level analytics filtering:** backend-supported (Fast), deferred to a v2 analytics pass — per-question rendering (this spec) is unaffected.
4. **Bulk aggregate export UX:** confirmed to exist per-faculty; bulk shape ("we'll try," Apr 21) — P5 ships per-survey export first, bulk-aggregate follows.
