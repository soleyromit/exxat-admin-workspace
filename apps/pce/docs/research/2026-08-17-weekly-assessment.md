---
type: weekly-assessment
date: 2026-08-17
range: 2026-08-11 to 2026-08-17
products: [pce, portal]
agent: granola-deep-assessment
---

# Weekly Design Assessment — Aug 11–17, 2026

---

## Meetings analysed

| Title | Date | Granola ID | Included | Directives |
|---|---|---|---|---|
| Course Eval sync up (Monil) | Aug 11 | 2a204119 | ❌ SKIP — already documented by prior daily sync (T156–T164 in backlog) | — |
| Exam management review | Aug 11 | f97f9f0c | ❌ SKIP — no content; call rescheduled to following day | 0 |
| Survey completion dashboard (Vishal) | Aug 12 | 611feaa6 | ✅ | 9 |
| Course eval — roles, status, thresholds | Aug 12 | 0ef80c33 | ✅ | 6 |
| Design system — utility bar + home redesign | Aug 10 | 9b24d8d1 | ✅ | DS-level (no PCE code) |
| Survey design — aspects, templates, response rates | Aug 12 | d6d6e961 | ✅ | 5 |
| Design + PM collaboration (Vishal) | Aug 12 | 77e5276a | ✅ SCAN — process/management only | 0 code |
| Survey design — email template + config | Aug 13 | 7aeae56b | ✅ | 4 |
| Home page + login flow (Aarti) | Aug 17 | c9fa0219 | ✅ | 3 (portal product) |

**Total new meetings included: 7 | Total new directives: 27 | Code-applicable directives: 0 (all target not-yet-built T129 or need design/PM input first)**

---

## Five-pass analysis summary

### Meeting — Aug 12: Survey completion dashboard (Vishal) | `611feaa6`

**Pass 1 — Physical layout**
- Admin completion dashboard = separate surface from content/results (different admin role views post-close)
- All 4 action items (send reminder, extend date, view results, close) directly visible — not hidden behind dots menu
- Inline context adjacent to actions: % completion + student count (for reminder), current end date + days remaining (for extend)
- Color-coded faculty average numbers: red = below threshold, green = at or above threshold
- Program average comparison shown as label text ("below program average"), NOT as a delta arrow/trend indicator

**Pass 2 — Scope changes**
- Remove "Overall rating" from collection-phase admin dashboard view
- Remove performance/content metrics from collection-phase admin view (relevant only after close)
- Likert groupings: group questions by identical scale only — do not mix 1–5 with other scales in one group
- Archive/inactive option: needed for mistakenly activated evaluations (wrong course)

**Pass 3 — Missing data fields**
- Recommendation nudge for extended close dates (future, not P1)
- None blocking

**Pass 4 — Killed / deferred**
- Recommendation nudge: future consideration, not P1

**Pass 5 — Code cross-reference**
- All directives target not-yet-built completion/collection dashboard. Not `surveys/page.tsx` or `surveys/[id]/page.tsx` as currently coded.

---

### Meeting — Aug 12: Roles, status tracking, thresholds | `0ef80c33`

**Pass 1 — Physical layout**
- Response rate: three-color bar (red below minimum, orange between min and desired, green at/above desired)
- Faculty display in table: stacked profile icons, color-coded by role (program director vs. affiliation)
- Extension indicator: star or badge on any course row where close date differs from term-level date

**Pass 2 — Scope changes**
- Two configurable response rate thresholds per school: minimum validity threshold + desired target
- Thresholds = school-configurable (settings); recommended defaults TBD
- "Closes today" vs "closes in X days" proximity indicator in table deadline column
- Status vocabulary: must match consistently between table view and kanban/board view

**Pass 3 — Missing data fields**
- Threshold configuration values: not yet specified by PM — need input before `response-gauge.tsx` can be updated

**Pass 4 — Killed / deferred**
- None

**Pass 5 — Code cross-reference**
- `response-gauge.tsx`: currently single-color (`var(--brand-color)`); threshold coloring cannot be applied until PM specifies threshold values and configuration mechanism. Flagged NR.
- Status labels in `surveys/page.tsx` `STATUS_LABELS` map are not connected to any kanban view — consistency check deferred until kanban is built.

---

### Meeting — Aug 10: Design system — utility bar + home redesign | `9b24d8d1`

**Pass 1 — Physical layout**
- Tab bar: all tabs use "line variant" — no primary/secondary tab distinction
- Layout: compact/concise; no card-sort approach
- Sticky navigation + sticky section headers when page scrolls
- Resizable sheet/drawer pattern

**Pass 2 — Scope changes**
- DS-level decision; no PCE product code changes
- Three home design approaches discussed (storefront, spotlight, focused) — separate product

**Pass 3–4 — Missing data / Killed**
- Nothing PCE-relevant

**Pass 5 — Code cross-reference**
- No PCE screen files to change. All decisions are DS-level (exxat-ds submodule, READ ONLY). Romit awareness tracking only.

---

### Meeting — Aug 12: Survey design — aspects, templates, response rates | `d6d6e961`

**Pass 1 — Physical layout**
- Inline accordion expand → replace with DRAWER (consistent with exam management pattern)
- Previously-evaluated instructor: visual indicator in setup wizard ("already evaluated, cannot evaluate again")

**Pass 2 — Scope changes**
- 80% response rate use case = survey-level only; NOT a per-aspect breakdown
- Recipients card in Step 4: REMOVED (confirmed again — confusing and redundant)
- Per-faculty add/remove within an aspect: allowed inside the wizard

**Pass 3 — Missing data fields**
- Indicator design for previously-evaluated instructor not yet specified

**Pass 4 — Killed / deferred**
- Recipients card: killed (reconfirmed)

**Pass 5 — Code cross-reference**
- All directives target not-yet-built T129 wizard (Step 2 + Step 4). No existing file to edit.

---

### Meeting — Aug 12: Design + PM collaboration (Vishal) | `77e5276a`

**Pass 1–4 — Physical / Scope / Data / Killed**
- Management/process discussion only; no design directives
- Priority confirmed: course evaluation only; speed over breadth
- Process recommendation: significantly expand face-to-face video communication with PMs

**Pass 5 — Code cross-reference**
- No code changes. No backlog tasks added.

---

### Meeting — Aug 13: Survey design — email template + config | `7aeae56b`

**Pass 1 — Physical layout**
- Faculty names in evaluate column: three display variants to explore — (A) aspects only, (B) aspects + faculty on hover, (C) both always visible

**Pass 2 — Scope changes**
- Email template redesign: DEFERRED to Settings area; not in wizard scope now
- Priority: survey distribution + view survey screens only; all other screens deferred
- Reminder cards: consider merging anchor-date-related configuration items

**Pass 3 — Missing data fields**
- None new

**Pass 4 — Killed / deferred**
- Email template config in wizard: deferred to Settings

**Pass 5 — Code cross-reference**
- Display variant exploration targets not-yet-built Step 2 evaluate column. Flagged NR.
- Reminder card merge consideration: targets not-yet-built Step 3. Flagged NR.

---

### Meeting — Aug 17: Home page + login flow (Aarti) | `c9fa0219`

**Pass 1 — Physical layout**
- Module grid: all modules visible above fold; purchased = highlighted; unpurchased = grayed with "Request demo" CTA
- Three approaches reviewed (storefront, spotlight, focused)

**Pass 2 — Scope changes**
- Prism = more than a directory — needs intelligent dashboards layer
- OU code switching: NOT a common use case — simplify or remove per-module
- Use real product usage data to back design decisions

**Pass 3 — Missing data fields**
- Usage data source: not yet defined

**Pass 4 — Killed / deferred**
- Detailed next steps deferred to Aug 24 meeting
- Needs DS status tracker + evolved home design for Jan 2027 visualization

**Pass 5 — Code cross-reference**
- Targets portal product home page; not PCE survey code. Tasks added to backlog as portal-product items.

---

## Change inventory

### WILL APPLY (safe, unambiguous)

_None this week._ All directives target either: (A) the not-yet-built T129 wizard, (B) surfaces requiring design direction before any code, or (C) configuration values requiring PM specification. No existing PCE screen file received a safe, unambiguous directive this run.

---

### NEEDS REVIEW (complex, needs Romit's judgment)

| # | Directive | Product | Why flagged | Suggested approach | Source quote |
|---|---|---|---|---|---|
| NR-01 | Admin completion dashboard: separate from content/results view | PCE | New surface — no existing file; admin role-based view split needs design direction | Separate page or tab: collection-phase = progress/actions only; post-close = scores/results | "Admin completion dashboard is separate from what the instructors see. Admin sees completion and takes actions; faculty sees content/results." (Vishal, Aug 12) |
| NR-02 | Remove "Overall rating" from collection-phase admin view | PCE | Structural removal on a not-yet-built surface; confirm scope before code | Only show completion % and per-faculty completion in collection view; suppress score cards until closed | "Remove the overall rating from the collection view." (Vishal, Aug 12) |
| NR-03 | Send Reminder inline context: % completion + student count | PCE | New UX pattern — action + inline data, not a modal; requires placement design | Inline adjacent to the "Send Reminder" action: "62% · 14 / 22 students" | "When you hover on the send reminder, show the completion percentage and the student count." (Vishal, Aug 12) |
| NR-04 | Extend Date inline context: current end date + days remaining | PCE | New UX pattern — date context inline with action | Inline adjacent to the "Extend Date" action: "Closes Sep 15 · 3 days left" | "Show current end date and days remaining when admin extends." (Vishal, Aug 12) |
| NR-05 | Color-code faculty average numbers by threshold | PCE | Requires PM-specified threshold values before code | Faculty avg column: red = below minimum validity threshold, green = at/above desired target | "Color code the faculty numbers — red for below threshold, green for above." (Vishal, Aug 12) |
| NR-06 | Program average: label text, not delta trend arrow | PCE | Design pattern decision — overrides any arrow/delta approach | "Below program average" / "Above program average" label. No +0.15 delta indicator. | "Show it as a label — 'below program average' — not as a trend arrow." (Vishal, Aug 12) |
| NR-07 | Likert groupings: same-scale questions only | PCE | New constraint on analytics grouping logic; requires data-model verification | Group questions only when all share the same Likert scale (e.g. all 1–5); do not group mixed scales | "If scales are different, do not group them together." (Vishal, Aug 12) |
| NR-08 | All 4 action items directly visible (not behind dots menu) | PCE | Breaking away from current dots menu pattern — layout redesign required | Inline row actions: Send Reminder, Extend Date, View Results, Close — all visible without a menu | "All four actions should be directly visible. No hiding behind the dots." (Vishal, Aug 12) |
| NR-09 | Archive/inactive option for mistakenly activated evaluations | PCE | New state + action not in current survey status flow | "Archive" action removes from active list; data retained; requires status state addition | "There should be an archive or inactive option for when you activate the wrong course." (Vishal, Aug 12) |
| NR-10 | Two configurable response rate thresholds (minimum + desired) | PCE | Needs PM specification of default values + storage mechanism before code | School-level settings: (1) minimum validity %, (2) desired target % | "Two thresholds: one for minimum validity, one for desired target — both configurable per school." (Aug 12, 0ef80c33) |
| NR-11 | Three-color response rate coding (red / orange / green) | PCE | Depends on NR-10 threshold values; `response-gauge.tsx` change is surgical once values confirmed | red < min, orange ≥ min + < desired, green ≥ desired; affects `ResponseGauge` bar color | "Red means invalid, orange means okay but not great, green means you hit the target." (Aug 12, 0ef80c33) |
| NR-12 | Extension indicator: star/badge when course close date ≠ term close date | PCE | New data point in deadline column — needs design of indicator and tooltip | Badge or star on deadline cell when course-level override is active | "Show that this course has an extension — different from the term date." (Aug 12, 0ef80c33) |
| NR-13 | Proximity indicator: "Closes today" / "closes in X days" | PCE | New formatted display in deadline column | Deadline column: "Closes today" (bold/colored) or "Closes in 3 days" for courses within threshold window | "Show 'closes today' or 'closes in X days' so admin can act quickly." (Aug 12, 0ef80c33) |
| NR-14 | Status vocabulary: consistent between table and kanban view | PCE | Kanban not yet built; carry-forward constraint for T129 | `STATUS_LABELS` map terms must match kanban column headers exactly | "Status names must be the same in both views — table and kanban." (Aug 12, 0ef80c33) |
| NR-15 | Faculty display: stacked profile icons color-coded by role | PCE | New avatar pattern; role color-coding not in current `AvatarFallback` | Stacked initials avatars; border or bg color = role type (program director vs. affiliation) | "Stack the faculty icons and color them by role — program director vs. affiliation." (Aug 12, 0ef80c33) |
| NR-16 | Inline accordion expand → Drawer pattern | PCE | Structural pattern change; consistent with exam management — design confirmation needed | Replace any inline expand in survey list with DS Drawer component | "Use a drawer, like exam management — consistent pattern across products." (Aug 12, d6d6e961) |
| NR-17 | Per-faculty add/remove within an aspect in setup wizard | PCE | Extends T134; need to design the granular add/remove affordance | Within each aspect's evaluatee list: individual add/remove affordance per person row | "You should be able to add or remove a specific faculty from within an aspect." (Aug 12, d6d6e961) |
| NR-18 | Previously-evaluated instructor: indicator in setup wizard | PCE | New informational state in Step 2 evaluatee list | Chip or label per faculty row: "Already evaluated for this course — cannot add again" | "Show some indicator that this instructor has already been evaluated." (Aug 12, d6d6e961) |
| NR-19 | Faculty names in evaluate column: explore three display variants | PCE | Design exploration required before code | Three options: (A) aspects only, (B) aspects + faculty on hover, (C) both always visible — present to Monil | "There are three ways to show faculty names in the evaluate column — we need to explore all three." (Aug 13, 7aeae56b) |
| NR-20 | Home page module grid: above fold, purchased highlighted, unpurchased grayed + "Request demo" | Portal | Portal product, not PCE — surfaces in home/portal app | All modules above fold: active = full color, inactive = grayed with "Request demo" CTA | "All modules visible above the fold. Purchased ones highlighted, unpurchased grayed out with a request demo CTA." (Aarti, Aug 17) |
| NR-21 | OU code switching: simplify or remove (Aarti feedback) | Portal | Portal product scope; engineering alignment needed | Evaluate whether per-module OU switching is needed at all; if not, remove | "OU code switching is not a common use case — simplify or remove it." (Aarti, Aug 17) |
| NR-22 | Prism intelligent dashboards layer in home design | Portal | Portal product — scope expansion from "directory" to "dashboards" | Frame Prism as an intelligent dashboards product, not just a directory, in home design | "The common part of Prism is more than a directory — it needs to have intelligent dashboards." (Aarti, Aug 17) |

---

### ALREADY DONE (directive found, code already correct)

_None this week._

---

### BLOCKED (needs alignment before proceeding)

| # | Directive | Product | What's blocking |
|---|---|---|---|
| BL-01 | Email template config in wizard | PCE | Explicitly deferred to Settings area. Romit: confirmed no wizard scope. Await Settings phase. |
| BL-02 | DS utility bar + home redesign tab/layout changes | DS | DS-level; exxat-ds submodule is READ ONLY. Changes must go through DS team. Romit awareness only. |
| BL-03 | Response rate threshold coloring (`response-gauge.tsx`) | PCE | PM has not specified threshold values or storage mechanism. Unblock: get PM to specify min + desired % defaults in a settings ticket. |
| BL-04 | Archive/inactive evaluation state | PCE | New survey status not in current mock data or state flow. Needs backend API alignment + PM spec before UI. |

---

## Pre-filing note

Meeting notes for `2026-08-11-course-eval-sync-up.md` already existed before this run (created by prior daily sync). Tasks T156–T164 already appended.

New meeting notes created this run:
- `apps/pce/docs/research/meetings/2026-08-10-ds-utility-bar-home-redesign.md` ✅
- `apps/pce/docs/research/meetings/2026-08-12-survey-completion-dashboard-vishal.md` ✅
- `apps/pce/docs/research/meetings/2026-08-12-roles-status-thresholds.md` ✅
- `apps/pce/docs/research/meetings/2026-08-12-pm-collaboration-vishal.md` ✅
- `apps/pce/docs/research/meetings/2026-08-12-survey-design-aspects-templates.md` ✅
- `apps/pce/docs/research/meetings/2026-08-13-email-template-config.md` ✅
- `apps/pce/docs/research/meetings/2026-08-17-home-page-login-flow-aarti.md` ✅

Backlog tasks T165–T187 appended to `apps/pce/docs/workflows/_backlog.md` ✅

---

## Weekly Assessment Complete — 2026-08-17

### Summary

| Metric | Count |
|---|---|
| Meetings analysed | 7 |
| Meetings skipped (already documented / no content) | 2 |
| Directives found | 27 |
| Changes applied this run | 0 |
| Flagged for Romit's review | 22 |
| Already correct in code | 0 |
| Blocked (needs alignment) | 4 |

### Changes applied

None this run. All directives target either the not-yet-built T129 setup evaluations wizard, new surfaces without existing code targets, or configuration values requiring PM specification before any code can be written.

### Needs Romit's review (priority order)

1. **NR-08** (all 4 actions directly visible) + **NR-03/04** (inline action context) — affects collection dashboard layout; must be designed as a unit
2. **NR-10 + NR-11** (two thresholds + three-color coding) — PM must specify threshold values; then `response-gauge.tsx` update is a surgical, safe change
3. **NR-16** (accordion → drawer) — structural pattern change; confirm with exam-management pattern before building T129
4. **NR-01/02** (completion dashboard structure + remove overall rating) — core layout of the post-collection admin view
5. **NR-05/06** (faculty avg color-coding + program avg as label) — analytics display design; follow from NR-10 threshold work
6. **NR-19** (three faculty name display variants) — present variants to Monil for selection before Step 2 code

### Blocked (needs alignment before proceeding)

- `response-gauge.tsx` threshold coloring (BL-03) — waiting for PM threshold values
- Archive/inactive state (BL-04) — needs backend API + PM spec
- Email template config (BL-01) — deferred to Settings phase
- DS utility bar changes (BL-02) — DS team scope
