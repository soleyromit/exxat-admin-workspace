# V2-CONSISTENCY: one pattern per job across the v2 pages (DRAFT)

**Status:** DRAFT, contract only, no app code. Renaming this file to `V2-CONSISTENCY-cross-page-patterns.md` (dropping `_draft-`) is Romit's confirmation and unlocks the code gate (template `docs/build/02-design-contract-template.md`).
**Written:** 2026-10-25 · **Branch:** `feat/skills-checklist-v2` · **Scope:** `admin/app/(v2)`, `admin/components/v2`, `admin/components/skills/page-header.tsx`, one new vendored dir `admin/components/chart-card/`, `admin/lib/v2`.
**Tags:** `[REQ xx-nn]` only IDs in `docs/source/requirements.extracted.txt` · `[OD-n]` open, never decided here · `[D-n]` a v2 decision in `docs/v2/decisions-and-open-questions.md` · `[PROPOSED]` beyond the requirements · `[INFER]` my reading · `[DS]` installed `@exxatdesignux/ui` 1.6.5 types read from `node_modules/@exxatdesignux/ui/dist` · `[AUDIT]` read from the working tree on 2026-10-25 (file:line).

**Romit's decisions this contract executes (2026-10-25):** v2 stays a separate exploration (v2 IA and roles are kept, not merged back into v1); cross-page consistency is fixed; the DS `ChartCard` is vendored for chart surfaces. This contract amends no requirement and decides no OD.

**Self-brief (recurring failures that apply):** "Question structural redundancy, not just polish" (sections 6 and 8: a filter that repeats a grouping, a Home that repeats a first row), "Replicate fixes to all pages in the same turn" (the whole change list is one pass), "Vendoring a DS component is not its dependency contract" (section 7), "A claim cannot reach further than its check" (every test in section 12 names its check), "Never render internal notes in UI copy" (no copy here points at the prototype), "Aarti dislikes red in score and rating viz" (section 5; recorded design preference, tagged `[INFER]` here because it is not in the repo requirements).

**Vault notes consulted:** inherits the notes listed in `V2-IA-shell-and-nav.md` and `docs/build/research/v2-ia-and-content-strategy.md`; no new vault pull. **Mobbin:** not run; this contract chooses among patterns already in the product and the DS, it adds no external pattern.

**Pre-task declaration (workspace rule).** Files: the 28 v2 files in section 11. Current DS violations: detail in section 1. Hand-rolled with a DS equivalent: `AgeCell` bars (`SignalBarsCell`), status text in `Badge` (`StatusBadge`), a raw `PageHeader` inside `StudentPage` (the product `PageFrame`), the Reports and Library filter rows (`FilterBar`), the queue's select-all card (DataTable selection). WCAG issues (static read): status carried by `Badge` `secondary`/`outline` with no icon (`library-table.tsx:75`, `map-courses-page.tsx:131`), and a `Badge` in the `actions` slot (`configure-wizard.tsx:142`). Runtime not checked.

---

## 0. Contract header (template)

```
Surface:              Cross-page consistency pass: page header, KPI strip, filters, table config, status pill,
                      viz vocabulary, ChartCard, reviewer and director landing, student desktop gutter, nav order
                                                                                     Wave: v2 consistency pass
Persona(s) & role:    Administrator (P-A), reviewer (P-R), program director (v2 role, [D29] [PROPOSED]),
                      student (P-S), preceptor and lab instructor (P-P, P-L). RBAC row: docs/ux/03; v2 roles in lib/v2/roles.ts
Scope / data seen:    Unchanged per role. Confidential concerns stay exactly as `concernsFor(s, role)` returns them ([D23] open).
Job-to-be-done:       A person who moves between pages, or between roles in the demo, meets the same header, the same
                      KPI strip, the same filter row, the same table, the same status words and the same progress
                      chart for the same job, so the product reads as one system and not as 14 separately built pages.
Why -> So what:       Today the same job has several answers (3 KPI variants in effect, 3 status renderings, 2 duplicate
                      status functions, 4 filter idioms, 3 header implementations, 3 progress charts stacked on Home).
                      Stakeholders judging the exploration see inconsistency, not the idea. After this pass a change to
                      one primitive changes every page.
Requirements:         SC-15, AR-01, AR-02, AE-03, AE-04, RP-01, RP-02, RP-03, RP-08, RP-09, RP-10, SH-06, ST-01, EV-01,
                      IM-10, CM-03
Open decisions hit:   OD-19 (lab sessions row, untouched), OD-29 (report as launch page, untouched), OD-10 (export
                      format, untouched). Seams in section 13.
Prototype reference:  [PROTO] kept for layout and information architecture as already built. Not copied: nothing new.
Pattern:              route (all pages). Reference hubs: apps/pce/admin/components/charts-overview.tsx (ChartCard),
                      apps/pce/admin/components/key-metrics/index.tsx (KeyMetrics usage)
DS mapping:           section 2 to 10; summary table in section 14
States:               unchanged per page except: filter empty result (section 3), chart empty (section 7)
Edge cases:           see section 13
Copy:                 sentence case, no em dashes; header subtitle = context line only (section 2)
A11y:                 section 12 tests 11 to 13 plus the per-section a11y lines
Out of scope:         route renames; v1 pages (components/shell, lib/skills-nav.tsx); new copy beyond the pill and
                      filter labels named here; REQ section 14 items; deciding any OD; the confidential-concerns count
Acceptance tests:     section 12
Risks / unknowns:     section 15
```

---

## 1. Audit: what is inconsistent today `[AUDIT]`

| Job | What the code does now | Evidence |
|---|---|---|
| Page header | `PageFrame` (DS `PageHeader` + `px-6 py-5`) on staff pages. Student pages call the raw DS `PageHeader` inside `StudentPage` with `px-4` and a centred `max-w-md` column. Subtitle strings differ: `{code}, {term}` (queue, outcomes, records, lab), plus cohort (Reports), plus course name and cohort (Courses), school and program (Home), none (Skills library). `actions` slot holds an outline button (queue, Reports), a filled button (remediation), and a status `Badge` (configure) | `components/skills/page-header.tsx:11-18`, `student/student-frame.tsx:114`, `review-queue-page.tsx:123-130`, `reports-page.tsx:142-150`, `admin-home.tsx:107`, `map-courses-page.tsx:55`, `remediation-page.tsx:153-160`, `configure-wizard.tsx:140-142` |
| KPI strip | `variant="cards"` on queue, outcomes, records; `variant="compact"` on Reports. All with `size="sm" showHeader={false} metricsSingleRow` | `review-queue-page.tsx:133`, `outcomes-page.tsx:51`, `verification-pages.tsx:57`, `reports-page.tsx:153` |
| Filters | Reports: hand row of 3 `Select`, one `Checkbox`, hand chips with remove buttons. Queue: `ToggleGroup`. Outcomes: `Tabs` used as a filter over one table. Library: one `Select` labelled "Show". Courses: one `Select` labelled "Library". DS `FilterBar` is not used anywhere | `reports-page.tsx:157-216`, `review-queue-page.tsx:162-170`, `outcomes-page.tsx:79-84`, `library-table.tsx:44-58`, `map-courses-page.tsx:92-111` |
| Table | All lists go through `V2Grid` (DS `DataTable`, query controls off) with one exception pattern: the queue sets `selectable={false}` and hand-builds a select column and a select-all card. Records is a `<ul>` of rows, not a table. Queue shows 12 columns | `v2-grid.tsx:13-31`, `review-queue-page.tsx:171-197`, `verification-pages.tsx:60-72` |
| Status pill | `StatusBadge` with local tone maps in 8 places; `Badge secondary/outline` text with no icon for skill status in 2 places; `statusOf` defined twice | `library-table.tsx:21,75`, `map-courses-page.tsx:25,131`, `verification-pages.tsx:26`, `preceptor/evaluation-form.tsx:32`, `outcomes/version-timeline.tsx:10`, `student/skill-card.tsx:16-17`, `student/history-page.tsx:22`, `outcomes/remediation-page.tsx:26`, `reports/reports-page.tsx:60`, `review-queue-page.tsx:32-36` |
| Progress viz | Admin Home stacks 3 `BulletMeter` + N `StackedBar` + `DotStrip`. The student skill card stacks `SegmentedDots` + up to N `BulletMeter`. `AgeCell` hand-draws signal bars that the DS ships as `SignalBarsCell` | `admin-home.tsx:112,188,204`, `student/skill-card.tsx:37,41`, `review-queue-page.tsx:43-58` |
| Charts in cards | Pace line sits in a hand `Card` with an `h2`; other viz sit bare or in `PageSection`. `ChartCard` is not exported by the installed DS | `student/history-page.tsx:42-51`, `student-home.tsx:72-87`, `reports-page.tsx:239,261`, `map-courses-page.tsx:57`; `node tools/ds/source.mjs ChartCard` reports not exported |
| Nav order | Shared rows appear as Outcomes, Records, Reports (admin), Outcomes, Records (reviewer), Records, Reports, Outcomes (director) | `lib/v2/roles.ts:46-65` |
| Student desktop | A 28rem column centred in the shell content area; the 4 nav rows are already in the left shell from 768 px, so the centred phone column leaves wide gutters and a header that does not align with any staff page | `student/student-frame.tsx:106-118` |

---

## 2. Decision 1: page header, actions slot, context subtitle

**One implementation:** `PageFrame` (`components/skills/page-header.tsx`), which wraps the DS `PageHeader` `[DS]`. Nothing else renders a page title. `StudentPage` becomes a thin wrapper over `PageFrame` (decision 9).

**Props, exact.** `PageFrame` keeps `title`, `subtitle`, `children`. Changes are additive so the three v1 consumers (`components/placeholder-page.tsx`, `components/mapping/page-body.tsx`, `components/evaluator/email-preview.tsx`) do not move:

| Prop | Type | Rule |
|---|---|---|
| `title` | `React.ReactNode` | The nav label for a nav-row page; the object name for a sub-page. Per `V2-IA` 4.1 `[REQ ST-01]` for the student Home exception. |
| `subtitle` | `string` | **Context line only:** `{course.code}, {course.term}` for every course-scoped staff page. Built by one helper `contextLine(state)` in new `lib/v2/page-context.ts`. Omitted on Skills library (not course-scoped) and on sub-pages whose title already names the record. Never a sentence, never instructions, never a status. `[INFER]` consistent with the copy budget in `research/v2-ia-and-content-strategy.md` (subtitle only when it adds a fact). |
| `actionItems` (new) | `PageHeaderActionItem[]` `[DS]` | The only way to put commands in the header. Forwarded to the DS `PageHeader` `actionItems`. Replaces the `actions` slot. |
| `actions` | `React.ReactNode` | Kept in the type for v1 consumers only. v2 pages must not pass it. |
| `width` (new) | `"full" \| "reading" \| "wide"` | `full` default for lists and dashboards. `reading` = `max-w-3xl`, left aligned, for forms and detail pages. `wide` = `max-w-5xl`, left aligned, for side-by-side comparison (review item). **No `mx-auto` on any body**, so the title and the body share one left edge (`preceptor/evaluation-form.tsx:67` currently centres). |
| `lead` (new) | `React.ReactNode` | Content above the header inside the same column (the student sync strip and device banners). |

**Gutter:** `px-4 md:px-6`, `py-5`, 16px between blocks. One place sets it (today `px-6` fixed, `page-header.tsx:12`).

**Actions slot rule (`actionItems`):**
1. At most **one** filled primary per page, anywhere on the page (`variant: "default"`, which the DS requires to carry a `shortcut` `[DS]`). If the page already has a filled primary in the body (Home rows, queue bulk approve), the header has none.
2. At most **2** `placement: "row"` items; everything tertiary is `placement: "overflow"`. The DS caps the row at 3 and collapses to icon-only below 640 px `[DS]`.
3. Header actions are commands that act on the whole page: Export (Reports) `[REQ RP-10]`, Close plan (remediation plan page), Reopen or Confirm (evaluation page). Help is `placement: "overflow"`: **"How this is counted"** is an overflow item on the queue and on Reports (today a visible outline button on the queue and a ghost button inside the Reports filter row, `review-queue-page.tsx:126-130`, `reports-page.tsx:192-195`). `[PROPOSED]`, see open question 5.
4. A status never goes in the header actions (`configure-wizard.tsx:142` moves the status to a `StatusPill` under the header, section 6).
5. Page-level `Button` size is the DS default for `actionItems`; no per-page `size="lg"` overrides in the header.

**Context subtitle examples:** `NURS 350, Fall 2026` on queue, Outcomes, Records, Reports, Courses, Home, Lab sessions. Reports drops the cohort from the subtitle; the cohort count is already in the first KPI tile description. Courses drops the course name (the h1 is "Courses" and the code identifies the course). Home drops school and program. `[PROPOSED]`: these three edit `V2-IA` 4.1/4.4 subtitle strings that the research amendment already told to be shortened (`V2-IA` Amendment 2026-10-25), so the budget wins; no requirement is touched.

**DS mapping:** `PageHeader` → IMPORT (via `PageFrame`); `PageHeaderActionItem` → IMPORT type. **A11y:** one `h1` per page (DS `headingLevel="h1"` default); sections below are `h2` (`PageSection`).

---

## 3. Decision 2: KeyMetrics, one variant and one tile anatomy

**One variant, exact props:**

```tsx
<KeyMetrics variant="cards" size="sm" showHeader={false} metrics={metrics} metricsSingleRow className="px-0 lg:px-0" />
```

`cards` because the DS marks it "preferred for list hubs" `[DS]` and 3 of 4 pages already use it. `compact` (Reports) is retired; its tiles already carry `description`, which `cards` supports. No `insight`, no `periods`, no `title`/`description` on the strip.

**Tile anatomy (`MetricItem`):**

| Field | Rule |
|---|---|
| `id` | kebab-case stable key; used by tests |
| `label` | 1 to 3 words, a noun phrase naming what is counted ("Awaiting review", "Records verified") |
| `value` | an integer, a percentage string, or "N days"; never a sentence |
| `delta` / `trend` | `delta: ""`, `trend: "neutral"` always, because v2 has no comparison period `[INFER]` (a hidden chip is the DS behaviour when `delta` is empty `[DS]`). Never invent a delta |
| `trendPolarity` | set (`"lower_is_better"`) only on a tile whose count rising is bad ("Students behind pace") |
| `description` | at most 6 words or one name; only when it adds a fact ("of 12", "Amara N., IV catheter insertion") |
| `alert` | `"warning"` only, on at most **one** tile per strip, and only when something is overdue (queue "Oldest waiting" over 7 days, research V5). `"danger"` is not used (section 5) |
| `progress`, `chart`, `href`, `onClick` | not used in v2; tiles are read-out, not controls `[INFER]` |
| Count per strip | 3 or 4 tiles, never more (workspace KPI max-four) |

**When a strip appears:** only on a **staff page whose body is a list or grid of records** and that is not a landing worklist.

| Page | Strip | Tiles (existing, unchanged unless stated) |
|---|---|---|
| Review and approve (admin, reviewer) | yes | Awaiting review, Oldest waiting, Stalled requests, Returned to students (`review-queue-page.tsx:117-122`) |
| Outcomes | yes | Evaluations that count, Open remediation plans, Reopened evaluations, Confidential concerns (`outcomes-page.tsx:44-49`; concerns tile **unchanged**, `[D23]` open, flagged in section 16) |
| Records | yes | Records verified, Changed since verified, Not verified yet, Students in the cohort (`verification-pages.tsx:40-45`) |
| Reports | yes | the 4 existing tiles (`reports-page.tsx:134-139`), now `cards` |
| Admin Home | **no** | Home is the worklist (`V2-IA` 4.4); a strip would repeat its rows as bare counts |
| Skills library, Courses | **no** | each carries one bullet or one coverage bar (section 6) |
| Student pages, preceptor pages, every sub-page | **no** | phone width, single job `[INFER]` |

**DS mapping:** `KeyMetrics`, `MetricItem` → IMPORT from `@exxatdesignux/ui` `[DS]`. The registry's vendored `components/key-metrics` copies in PCE and exam-management are not used here. **A11y:** the strip wraps in `<section aria-label="…summary">` only on Reports today (`reports-page.tsx:152`); apply the same wrapper on all four pages, label "{Page} summary". **Check:** section 12 tests 4 and 5.

---

## 4. Decision 3: filters, DS FilterBar position and which pages use it

**One idiom:** a single row directly above the data it filters, built on the DS `FilterBar` container with `FilterBarAddButton` and `FilterBarClearButton` `[DS]`, plus removable chips. **Gap:** the DS does not export `FilterPill`; the chips inside the DS DataTable toolbar are internal `[DS]` (the PCE catalog mocks them locally). So one small product component, **`V2FilterBar`** (`components/v2/v2-filter-bar.tsx`), composes `FilterBar` + `FilterBarAddButton` + `FilterBarClearButton` + `Button variant="outline" size="sm"` chips + `Popover`/`Select` for the value, and takes the DS types `FilterFieldDef[]` and `ActiveFilter[]` `[DS]` so its data model equals the table's. It must pass `ds-adoption-reviewer` (verdict HAND-ROLL composition of DS parts, documented in `docs/governance/ds-adoption.md` Documented hand-rolls) before it is written. The DataTable's own toolbar (`showQueryControls`) stays off, as `V2Grid` sets it today (`v2-grid.tsx:24`), because 4 of the 6 filtered pages have a non-table body.

**Position rule (exact):**
1. Order on every filtered page: header → KPI strip (if the page has one) → `V2FilterBar` → data. Full content width, left aligned, 12px above the data.
2. If `Tabs` exist and the filters scope **every** tab, the bar sits above the `Tabs` (Reports). If the filters scope **one** tab only, the bar sits inside that tab panel above its table (queue "Awaiting").
3. Applied filters are always visible as chips and each is removable on its own; "Clear all" appears from 2 chips `[REQ RP-01]`. A filter set that cannot match explains why and offers the single clearing action, and an empty result says so `[REQ RP-09]`. This behaviour already exists on Reports (`reports-page.tsx:198-216`) and is the reference.

**Which pages use it, and the fields:**

| Page | Fields | Replaces |
|---|---|---|
| Reports | Category, Setting, Clinical setting, Mandatory skills only `[REQ RP-01, RP-08]` | hand row `reports-page.tsx:157-216` |
| Review and approve, Awaiting tab | Self-rating (Agreed, Differed, Not comparable) `[REQ AR-02]`, Setting, Source | `ToggleGroup` `review-queue-page.tsx:162-170` |
| Outcomes | Outcome (Latest, Did not meet, Not yet, Reopened), single value, 1:1 with the existing `OutcomeFilter` so `lib/v2/outcomes.ts` does not change | `Tabs` `outcomes-page.tsx:79-84` |
| Records | Needs action (changed or items to resolve) `[INFER]`, see open question 4 | nothing today |
| Skills library | Status (Not configured, Configured not in use, In use) `[REQ IM-10]`, Library, Category, Came from | `Select` "Show" `library-table.tsx:44-58` |
| Courses | Library, Requirement level (Mandatory, Optional, Not expected, Not mapped) `[REQ CM-03]` | `Select` "Library" `map-courses-page.tsx:92-111` |

**Not on:** Home, any student page, preceptor Requests and Lab sessions, every sub-page.

**Tabs rule:** `Tabs` (DS `TabsList variant="line"`) is for **mutually exclusive sections with different content**, never for filtering one dataset. Remaining tab sets after this pass: Reports (Students, Skills, Evaluators), queue (Awaiting, Stalled, Returned), Skills library "Add skills" (Starter libraries, Import from a file). Each `TabsList` keeps a unique `aria-label` and the shared `className="rounded-md focus-visible:ring-3 focus-visible:ring-ring/50"`.

**A11y:** the bar is `role="group"` with `aria-label="Filters"` (DS `FilterBar` `aria-label` prop `[DS]`); chips are buttons named "Remove filter {label}"; the result count is announced in a polite status region.

---

## 5. Decision 5 first, because 4 depends on it: status pill

(Numbering follows the brief; section 6 is table config.)

**One primitive:** `StatusPill`, a thin module `components/v2/status-pill.tsx` plus `lib/v2/status-pill.ts` that map a domain value to `{ label, tone, icon }` and render the DS `StatusBadge` semantic form `[DS]`:

```tsx
<StatusBadge label={label} tone={tone} icon={icon} size="sm" />
```

`StatusBadge` semantic props: `label`, `tone` (`success | warning | info | danger | neutral`), `icon` (Font Awesome suffix, shown at `sm` and `md`), `size` (`sm | md`) `[DS]`. Never `Badge` for a state.

**Rules:**
1. A pill always has **text and an icon and a tone**. Colour is never the only signal (`STATE_META` in `viz/tokens.ts` already follows this and is the source of the word, icon and tone triples).
2. **No red in score, outcome or progress encodings.** "Did not meet", "Changed since verified", "Blocked", "Needs outcome" are `warning` with `fa-triangle-exclamation` or `fa-circle-exclamation`. `danger` is reserved for system failures (a save that failed, a sync that failed) and no pill uses it today `[INFER]` (recorded design preference: no red in score or rating viz).
3. Tone triples, one table for the whole product:

| Meaning | tone | icon | Used for |
|---|---|---|---|
| Met, achieved, verified, ready, counted | `success` | `fa-circle-check` | outcome Met, skill Achieved, record Verified, queue Ready to approve |
| In progress, not yet met, partial | `info` | `fa-circle-half-stroke` | outcome Not yet, skill In progress, plan open |
| Did not meet, changed, blocked, needs action | `warning` | `fa-triangle-exclamation` | outcome Did not meet, record Changed since verified, queue Blocked, Short by |
| Waiting, pending, not started, no evidence | `neutral` | `fa-clock` (waiting) or `fa-minus` (none) | awaiting approval, Not verified, not configured |

4. **Allow-list for a direct `<StatusBadge`** (non-state labels, `tone="neutral"`): `preceptor/lab-grid-page.tsx:334` (setting label), `outcomes/outcomes-page.tsx:140` ("Staff only"), `student/student-frame.tsx:25` (Offline), `reports/reports-page.tsx:315` (small numbers note), `reports/reports-page.tsx:384` (one evaluator). Everything else routes through `StatusPill`, including `student/sync-chip.tsx:19`.
5. `statusOf` exists once, as `StatusPill kind="skill"` (`Not configured` → neutral `fa-minus`; `Configured, not in use` → info `fa-circle-half-stroke`; `In use` → success `fa-circle-check`). Both copies (`library-table.tsx:21`, `map-courses-page.tsx:25`) are deleted. The words are today's strings; no new copy `[AUDIT]`.
6. The eight local maps collapse into `lib/v2/status-pill.ts` kinds: `verify` (`verification-pages.tsx:26`), `outcome` (`evaluation-form.tsx:32`, `version-timeline.tsx:10`; two copies today), `attempt` (`history-page.tsx:22`), `skill-progress` (`skill-card.tsx:16-17`), `plan` (`remediation-page.tsx:26`), `cell` (`reports-page.tsx:60`), `agreement` (`review-queue-page.tsx:32-36`), `sync` (`sync-chip.tsx`). Exported `OUTCOME_TONE` and `STATUS_TONE` are re-exported from the new module so `lib/v2/pdf.ts` and other importers keep compiling (the implementer greps importers first).
7. **Age** is not a pill: `AgeCell` renders the DS `SignalBarsCell({ level, max: 3, tone, label })` `[DS]` with `level` from `BUCKET_BARS` (`recent` 1, `waiting` 2, `overdue` 3), `tone: "warning"` for overdue and `"neutral"` otherwise, `label: "Days since the evaluator finished or the photo arrived"`, and the day count printed beside it. Deletes the hand bars at `review-queue-page.tsx:43-58`.

**A11y:** the word is in the DOM, the icon is `aria-hidden="true"`, contrast is the DS `--status-badge-*` pairs. **Check:** section 12 tests 6 and 7.

---

## 6. Decision 4: table config, one wrapper

**One wrapper:** `V2Grid` (`v2-grid.tsx`), DS `DataTable` `[DS]` with `selectable={false}` default, `showQueryControls={false}`, `searchable={false}`, `edgeInset={false}`, a text `emptyState`, and the region `aria-label={caption}`. Raw `<table>` / `Table*` import is banned outside `viz/heat-grid.tsx` and `preceptor/lab-grid-page.tsx` (the grid is a purpose-built semantic table; justified in `docs/v2/new-components-needed.md`).

**Config rules, all pages:**
1. **First column is the object** (skill, student, evaluation) in `font-medium text-foreground`, and it is the row link when the row opens a route; the secondary line (`text-xs text-muted-foreground`) carries one fact (category, description).
2. **Status column** renders `StatusPill` (section 5); a status never appears as plain text in one table and a pill in another (`outcomes-page.tsx:95` pill but `STATUS_WORD` plain text at the next column is allowed because it is a workflow word, not a state; it stays text).
3. **Row actions:** a trailing "Actions" column; every control is `Button variant="outline" size="sm"` with an `aria-label` naming the row object. One link-styled "Open" is not used.
4. **Selection:** DS selection through `V2Grid selectable` and `bulkActions`, never a hand `Checkbox` column and a hand select-all `Card`. Applies to the queue (`review-queue-page.tsx:171-197`).
5. **Visible columns at most 7**, except the queue, which keeps its 12 because `[REQ AR-01]` requires student, skill, course, setting, location, evaluator and role to be visible; see open question 3.
6. **Widths** are declared per column in px as today; no column wraps its header.
7. **Empty text** states what is missing and what to do, with no apology.
8. **Records is not a table** (`verification-pages.tsx:60-72` is a grouped list with a `BulletMeter` per row). That is allowed: it is the one grouped worklist, and it stays a `<ul aria-label>` of rows with the same row anatomy (object, meter, pill, action). `[INFER]` converting it to a table is not required for consistency.

---

## 7. Decision 6: progress and achievement viz vocabulary

One question, one primitive. The primitives are the existing `components/v2/viz` set.

| The question the viewer asks | Primitive (exact) | Used on | Rule |
|---|---|---|---|
| How far is X of Y (one measure)? | `BulletMeter` | Skills library header (Configured), Records rows (mandatory achieved), Admin Home Set up (one) | `required` is the Y; the value is also printed (`valueText`) |
| Who has met what (cohort x skill)? | `HeatGrid` + `HeatGridKey` | Reports, Students tab, only `[REQ RP-02]` | the only cohort x skill chart; sorted weakest first |
| What is left in one student's mandatory set? | `Waffle` | Student Home `[REQ ST-01]` | one square per mandatory evaluation, grouped by skill |
| Am I on pace over time? | `CumulativeLine` | Student Record | cumulative counted vs dashed pace line |
| How is one set split into states, compared across several items? | `StackedBar` | Admin Home "Weakest mandatory skills", Reports Skills tab `[REQ RP-03]`, Courses coverage | **kept, narrowly:** composition (part to whole) of one set into 3 to 4 states. Not for "X of Y" (that is `BulletMeter`) |
| Where do students sit against an expected marker? | `DotStrip` | Reports, Students tab, pace block only `[REQ RP-02]` | **kept on Reports; retired from Admin Home** (the Home "Needs attention" row already names who is behind and Reports owns the chart) |
| What happened in order (attempts, plan steps)? | `SegmentedDots` | Outcomes by skill and plan steps, remediation plan steps, student skill card evaluations | **kept:** the only primitive for an ordered run of discrete events. **Retired** next to a `BulletMeter` in the same card (below) |

**Budget (the stacking rule):**
1. A card holds **one** viz.
2. A page holds **at most one hero viz** (a `ChartCard`, section 8) plus **one repeated row-viz family inside a list** (Records `BulletMeter` per row, Outcomes `SegmentedDots` per skill).
3. **Never three** of `BulletMeter`, `StackedBar`, `DotStrip` in one region or one page.
4. A viz that carries a state uses `STATE_META` (word, glyph, tone); no viz uses red `[INFER]`.

**Applied:**
- **Admin Home** (`admin-home.tsx`): Set up shows **one** `BulletMeter` ("In use" of all skills; the other two stages are already the first words of the rows beneath it), not three (`:112`); the Cohort section keeps the "Weakest mandatory skills" `StackedBar` list in a `ChartCard`, and the `DotStrip` card is removed (`:200-206`). Result: 1 `BulletMeter` + 1 `StackedBar` family, 2 families, below 3.
- **Student skill card** (`skill-card.tsx:36-47`): keep the `SegmentedDots` (evaluations counted of needed, `[REQ ST-01]`); the per-setting `BulletMeter`s become one text line per required clinical setting ("{setting}: {have} of {min}") with the lab note kept. This **amends research row V14** ("pips plus setting bullets") and is open question 2; the setting minimum itself is untouched `[REQ AE-03]`.
- **Outcomes by skill**, **plan steps**: unchanged (`SegmentedDots` only).
- **Reports Students tab**: `HeatGrid` and the pace `DotStrip` are two hero viz on one tab. Keep both, each in its own `ChartCard`, and leave the `StackedBar` list to the Skills tab: one hero per tab view `[INFER]`. Test counts per tab, not per page.

---

## 8. Decision 7: where ChartCard wraps, and the vendoring plan

### 8.1 Where it wraps

A `ChartCard` wraps a **standalone titled chart**: one heading, one one-line description, one viz. It does not wrap in-row micro viz, KPI tiles, or a table.

| Surface | Wraps | Title / description (budget: description at most 12 words) | File:line |
|---|---|---|---|
| Student Record | `CumulativeLine` (the pace line) | Pace this term / Evaluations counted against the expected pace. | `student/history-page.tsx:42-51` replaces the hand `Card` + `h2` |
| Student Home | `Waffle` | Mandatory skills / what is counted, waiting and left | `student/student-home.tsx:72-87` |
| Reports, Students | `HeatGrid` (heat summary) | Students by skill / weakest first | `reports/reports-page.tsx:239` |
| Reports, Students | pace `DotStrip` | Pace / Evaluations collected against the expected pace | `reports/reports-page.tsx:261` |
| Reports, Skills | the `StackedBar` list (bar summary) as one card | Attainment by skill | `reports/reports-page.tsx:391` (loop container above it) |
| Admin Home | the "Weakest mandatory skills" `StackedBar` list | one card | `admin/admin-home.tsx:176-199` replaces `Card className="gap-4 p-4"` |
| Courses | coverage `StackedBar` | Coverage of {course.code} / what the course expects | `admin/map-courses-page.tsx:57-66` |

Not wrapped: `BulletMeter` in the library header and in Records rows, `SegmentedDots` in rows, `AgeCell`.

### 8.2 Vendoring plan `[DS]` registry recipe, `docs/governance/ds-adoption.md` "How to use" step 3

| Item | Decision |
|---|---|
| Registry verdict | `ChartCard` is **VENDOR**: not exported by `@exxatdesignux/ui` 1.6.5 (checked in `dist`; `node tools/ds/source.mjs ChartCard` reports not exported). `ds-adoption-reviewer` confirms before the file lands and the registry row is added (workspace `docs/governance/ds-adoption.md`, outside this product; requires Romit's edit approval) |
| Source | `apps/pce/admin/components/charts-overview.tsx`: the `ChartCard` function (`:451`) with `ChartCardHeader` (`:374`), `resolveChartCardFilter` (`:425`) and the `chartCard*Class` constants (`:211-229`). Upstream of that copy: `exxat-ds/apps/web/components/charts-overview.tsx` (read only, never edited). The live catalog `http://127.0.0.1:4000/design-os/design-system/chart-card` is the visual reference |
| Destination | `admin/components/chart-card/index.tsx` (the registry's directory-per-vendor convention, like `components/key-metrics/index.tsx`). Exports `ChartCard` and `ChartCardVariant`. Not under `components/v2`, so v1 can adopt it |
| Variants kept | `normal` (title, description, body) and `tabs` with `tabOptions` / `selector` with `filterOptions`. Dropped: `metrics-tabs` and `kpi-chart` (the KPI strip covers them; they drag in `MiniMetric`) and the default Chart/Trend tabs block. v2 uses `normal` only |
| Dependencies | `react`; `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` from `@exxatdesignux/ui/components/ui/card`; `Tabs*` from `.../ui/tabs`; `Select*` from `.../ui/select`; `cn` from `@exxatdesignux/ui/lib/utils` (already used at `v2-utility-bar.tsx:18`). `recharts` ^3.8.1 is already a dependency (`package.json:30`) and is not imported by `ChartCard` itself. The PCE imports of `@/components/ui/*`, `@/lib/chart-*`, `@/components/key-metrics`, `@/components/dashboard-quota-progress-card`, `@/lib/mock/dashboard` are **not** copied; the gallery bodies (`AreaChartContent` and the rest, `:743` on) are **not** copied |
| Leo props to omit | The `leoInsight` prop and its type `ChartLeoInsight`; every `ChartLeoInsightOverlay` wrapper around the body; the re-exports of `ChartLeoPlotInsightOverlay`, `ChartLeoInsightOverlay`, `ChartLeoPixelPlotInsightOverlay`; imports of `@/components/leo-insight-indicator`, `@/components/chart-leo-spotting`, `@/lib/chart-leo-spotting`; the Ask Leo icon guidance comment. v2 has no Leo surface and the PCE header already removed the per-chart Ask Leo button (`:394-397`) |
| Deviations from the vendored source (documented in the registry row) | (1) The title renders as `<CardTitle asChild><h2 …>` with an optional `headingLevel?: "h2" \| "h3"` (default `h2`) so the outline stays valid under the page `h1`; the source `CardTitle` has no heading element. (2) `className` default becomes `""` and v2 passes `h-auto` (the source shell is `h-full`, which stretches inside a stacked column). (3) No `minHeight: 200px` on the body for the `normal` variant |
| A11y carried over | `Card role="figure" aria-label={title}` (source `:549`); the viz inside keeps its own accessible name, which must differ from the card title (for example title "Pace this term", viz label "Evaluations counted against the expected pace") so a screen reader does not announce the same string twice. The viz primitives already provide keyboard focus and a text fallback (`CumulativeLine` via `ChartContainer`; `HeatGrid` is a semantic table). The source's `ChartFigure` and `ChartDataTable` are not vendored; if a later chart needs the arrow-key data-point model it is vendored then, not now |
| Tokens | no hex; chart colours stay in `viz/tokens.ts` |
| Registry text to add | "ChartCard | VENDORED into skills-checklist 2026-10-25 at `apps/skills-checklist/admin/components/chart-card/index.tsx` from `apps/pce/admin/components/charts-overview.tsx`; variants normal, tabs, selector; Leo overlay stripped; title is an h2." Re-vendor only when upstream changes |

---

## 9. Decision 8: landing anatomy for Reviewer and Director, no new Home

`V2-IA` 3.2 and 3.3 stand unchanged: the reviewer and the director have **no Home**; `/v2/reviewer` redirects to Review and approve and `/v2/director` redirects to Records. Their landings are the first nav page, built to one anatomy:

```
┌ PageFrame ──────────────────────────────────────────────────────────────────┐
│ h1  = nav label                                  [ ⋯ More ]   (actionItems) │
│ NURS 350, Fall 2026                                      (contextLine)      │
├─────────────────────────────────────────────────────────────────────────────┤
│ KeyMetrics variant="cards" size="sm", 4 tiles, metricsSingleRow             │
├─────────────────────────────────────────────────────────────────────────────┤
│ V2FilterBar  (one row: chips, Add filter, Clear all)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ the work: queue table (Awaiting) | records grouped list                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Reviewer landing = Review and approve** (`review-queue-page.tsx`). Header: title, context line, overflow "How this is counted". Strip: the 4 queue tiles. Filter: Self-rating, Setting, Source, inside the Awaiting tab. Body: the Awaiting table with DS selection and bulk approve.
- **Director landing = Records** (`verification-pages.tsx`). Header: title, context line, no actions. Strip: the 4 records tiles. Filter: one `V2FilterBar` with "Needs action". Body: the status-grouped list.
- Neither page gains a tile, a section or a card that the current page does not have; the only additions are the filter bar on Records and the removal of local idioms. Admin sees the same two pages under its own nav (rows 4 and 6 of `V2-IA` 3.1), so the three roles share one component per page.
- Why no Home: a reviewer Home repeating the queue count is a bare-count surface `[INFER]`; the strip already is the count.

---

## 10. Decision 9: student desktop gutter

At 768 px and up the student uses the DS left shell (`V2-IA` 3.5). The current 28rem centred phone column leaves two wide gutters and a header that sits at a different left edge from every staff page `[AUDIT]`.

**Rule:** below 768 px unchanged (phone column, `px-4`, bottom bar). At 768 px and up, `StudentPage` renders `PageFrame width="reading"`: header and body share the **left edge and the `px-6` gutter of the staff pages**, the body is a single column capped at `max-w-3xl` (48rem), left aligned, **not centred**. The sync strip and device banners go into `lead`. `StudentNav` keeps `md:hidden`. The `wide` prop on `StudentPage` is removed (`sync-page.tsx:194` becomes the default). Cards, blocks and the skill list are unchanged; no two-column Home is introduced (not decided, open question 6).

Net effect: switching role in the demo moves the title by zero pixels, and a student at 1440 px reads a 48rem column beside the left shell instead of a 28rem strip in the middle.

---

## 11. Decision 10: nav order of the shared Outcomes, Records, Reports rows

**One relative order for every role:** Review and approve → **Outcomes → Records → Reports** (what happened → verify it → read it out). Rows a role does not have are skipped.

| Role | Order after this pass | Change |
|---|---|---|
| Admin | Home, Skills library, Courses, Review and approve, Outcomes, Records, Reports | none |
| Reviewer | Review and approve, Outcomes, Records | none |
| Director | **Outcomes, Records, Reports** | was Records, Reports, Outcomes (`lib/v2/roles.ts:61-65`) |

Consequence: `V2-IA` 4.3 says the director redirects to "the role's first nav row". After the reorder Records is the second row, so the redirect target is set explicitly (a `landing` field per role in `lib/v2/roles.ts`, used by `app/(v2)/v2/[role]/page.tsx`, and by `ROLES[].home`). The director still lands on Records. This amends `V2-IA` 3.3/4.3 wording ("first nav row") and is open question 1; no route, label or icon changes.

---

## 12. Acceptance tests

Run from `apps/skills-checklist` unless stated. Static unless marked runtime.

| # | Test | Check |
|---|---|---|
| 1 | One header: `grep -rn "<PageHeader" admin/components/v2` returns nothing; `grep -rn "<PageHeader" admin/components/skills/page-header.tsx` returns exactly 1 | grep |
| 2 | v2 pages pass no `actions=` prop: `grep -rnE "(PageFrame|StudentPage)[^>]*actions=|^\s+actions=" admin/components/v2` returns nothing | grep |
| 3 | Subtitle is the helper: every `subtitle={` in `admin/components/v2` either calls `contextLine(` or is absent on sub-pages; `grep -rn "course.cohort" admin/components/v2/reports admin/components/v2/admin` returns nothing | grep |
| 4 | One KPI variant: `grep -rn "<KeyMetrics" admin/components/v2` returns exactly 4 lines and `grep -rn "<KeyMetrics" admin/components/v2 \| grep -vc 'variant="cards" size="sm" showHeader={false}'` prints `0`; `grep -rn 'variant="compact"' admin/components/v2/reports` returns nothing | grep + count |
| 5 | Strip only where decided: files containing `<KeyMetrics` are exactly `review-queue-page.tsx`, `outcomes-page.tsx`, `verification-pages.tsx`, `reports-page.tsx`; each strip has 3 to 4 `id:` entries and at most one `alert:` | grep + unit test `tests/v2/kpi.test.ts` reading the exported metric builders |
| 6 | One status renderer: `grep -rn "<StatusBadge" admin/components/v2 \| grep -v status-pill.tsx` returns exactly the 5 allow-list lines of section 5.4; `grep -rn "statusOf" admin/components/v2` returns nothing; `grep -rlE "components/ui/badge" admin/components/v2` lists only the allow-list `admin/starter-libraries-panel.tsx`, `admin/import-panel.tsx`, `admin/wizard-steps.tsx`, which keep `Badge` for plain count or label chips that are not states ("8 skills", "Repeats X", "Copied 2 times", "N already in your library"); no state uses `Badge` | grep + count |
| 7 | Pill triples: new `tests/v2/status-pill.test.ts` asserts every kind returns a non-empty `label`, a `tone` in `success\|info\|warning\|neutral` (never `danger`), and a non-empty `icon`; asserts no two values of one kind share a label | unit test |
| 8 | Age uses the DS cell: `grep -n "SignalBarsCell" admin/components/v2/review/review-queue-page.tsx` returns 1 or more; `grep -n "BUCKET_BARS\[bucket\]" admin/components/v2/review/review-queue-page.tsx` returns only the `level` use | grep |
| 9 | Filters: `grep -rln "<V2FilterBar" admin/components/v2` lists exactly the 6 files of section 4; `grep -rn "ToggleGroup" admin/components/v2/review` returns nothing; `grep -n "<Tabs" admin/components/v2/outcomes/outcomes-page.tsx` returns nothing; `grep -rln "<Tabs " admin/components/v2` lists exactly `review-queue-page.tsx`, `reports-page.tsx`, `starter-library-page.tsx` | grep + count |
| 10 | Filter behaviour: new `tests/v2/filter-bar.test.tsx` (applied chip appears, removable alone, Clear all from 2 chips, impossible combination renders an explanation and one clearing action) | unit test `[REQ RP-01, RP-09]` |
| 11 | Table: queue uses DS selection: `grep -n "data-bulk-bar" admin/components/v2/review/review-queue-page.tsx` returns nothing and `grep -n "selectable" admin/components/v2/review/review-queue-page.tsx` shows `selectable` true or the prop omitted (default per `V2Grid` change); `grep -rn "<table\|<Table" admin/components/v2 \| grep -v "viz/heat-grid.tsx\|preceptor/lab-grid-page.tsx"` returns nothing | grep |
| 12 | Viz budget: `grep -c "<BulletMeter" admin/components/v2/admin/admin-home.tsx` is `1`; `grep -c "<DotStrip" admin/components/v2/admin/admin-home.tsx` is `0`; `grep -c "<BulletMeter" admin/components/v2/student/skill-card.tsx` is `0`; `grep -rln "<DotStrip" admin/components/v2` lists exactly `reports-page.tsx` | grep + count |
| 13 | ChartCard vendored clean: `grep -rniE "leo" admin/components/chart-card` returns nothing; `grep -rn "recharts" admin/components/chart-card` returns nothing; `grep -c "<ChartCard" ` over the 7 surfaces of section 8.1 totals 7 or more | grep |
| 14 | Nav order: extend `tests/v2/nav.test.ts` so the filtered subsequence of `buildV2Nav(role)` titles over `["Outcomes","Records","Reports"]` equals that order for admin, reviewer and director; `GET /v2/director` redirects to `/v2/director/director-verification` | unit test + `curl -sI localhost:3007/v2/director` |
| 15 | Alignment (runtime, `docs/v2/verify/shoot.mjs`): at 1440 px, the `h1` bounding-box `left` is identical (within 1 px) on all staff list pages and all student pages, and the `h1` `top` is identical within 1 px; at 390 px no horizontal overflow | screenshot + script assertion |
| 16 | Student desktop (runtime): at 1440 px the student Home body width is 768 px or less, left aligned (body `left` equals the header `left`); at 390 px the layout and bottom bar are unchanged versus the last `report.json` | screenshot |
| 17 | A11y (runtime): `node docs/v2/verify/shoot.mjs` reports 0 new axe violations against the last `report.json`; every chart card has exactly one `h2` and one `role="figure"`; no pill has `color` as the only difference between two states (tests 7 plus a visual check of the Outcomes and Records pills at 1440 px) | axe + screenshot |
| 18 | Regression: `cd admin && npx tsc --noEmit` and `npx vitest run tests/v2` pass; `docs/v2/verify/stage1..5.e2e.mjs` pass after their selectors for removed attributes are updated (the e2e files are owned by T0, see section 13) | tsc + vitest + e2e |
| 19 | Requirement IDs: `node .claude/hooks/check-req-ids.mjs docs/build/contracts/_draft-V2-CONSISTENCY-cross-page-patterns.md` passes | script |

---

## 13. Change list, grouped into tasks with disjoint file ownership

Line numbers are the current working tree `[AUDIT]` and shift once T0 lands. No file appears in more than one task.

### T0 Shared primitives (runs first; blocks T1 to T3)

| File | Change |
|---|---|
| `components/skills/page-header.tsx:11-18` | `PageFrame`: add `actionItems`, `width`, `lead`; gutter `px-4 md:px-6`; keep `actions` for v1; additive only |
| `components/chart-card/index.tsx` (new) | vendored `ChartCard` per section 8.2 |
| `components/v2/v2-filter-bar.tsx` (new) | `V2FilterBar` per section 4 (after `ds-adoption-reviewer`) |
| `components/v2/status-pill.tsx` (new), `lib/v2/status-pill.ts` (new) | section 5 |
| `lib/v2/page-context.ts` (new) | `contextLine(state)` |
| `components/v2/v2-grid.tsx:13-31` | no prop change except forwarding `selectable` / `bulkActions` to the DS selection column (already typed); confirm `getRowSelectionLabel` text |
| `components/v2/student/student-frame.tsx:106-118` | `StudentPage` becomes `PageFrame width="reading" lead={<><SyncStrip/><DeviceBanners/></>}` inside the phone column below 768 px; delete the raw `PageHeader` at `:114`; remove the `wide` prop; keep `StudentNav` |
| `lib/v2/roles.ts:61-65, ROLES home` | director order Outcomes, Records, Reports; add `landing` per role |
| `app/(v2)/v2/[role]/page.tsx` | redirect to `ROLES[role].landing` |
| `tests/v2/nav.test.ts`, new `tests/v2/status-pill.test.ts`, `tests/v2/filter-bar.test.tsx`, `tests/v2/kpi.test.ts` | tests 5, 7, 10, 14 |
| `docs/v2/verify/*.mjs`, `docs/v2/README.md` | selector updates (removed attributes), new check 15 and 16 |
| workspace `docs/governance/ds-adoption.md` | ChartCard and V2FilterBar rows (needs Romit's approval; outside the product) |

### T1 Admin pages (parallel after T0)

| File:line | Change |
|---|---|
| `admin/admin-home.tsx:107,109-123` | subtitle → `contextLine`; Set up card shows one `BulletMeter` (drop `:112` loop to one meter); keep `WorkRow` list |
| `admin/admin-home.tsx:176-206` | replace `Card gap-4 p-4` with `ChartCard` titled "Weakest mandatory skills"; delete the DotStrip card `:200-206`; drop the `DotStrip` import and `shortName` helper if unused |
| `admin/library-table.tsx:21,75` | delete `statusOf`; status cell → `StatusPill kind="skill"` |
| `admin/library-table.tsx:36-59` | `BulletMeter` stays; replace the `Select` "Show" with `V2FilterBar` (fields section 4) above the table |
| `admin/map-courses-page.tsx:25,131` | delete `statusOf`; status cell → `StatusPill` |
| `admin/map-courses-page.tsx:55` | subtitle → `contextLine` |
| `admin/map-courses-page.tsx:57-66` | wrap the coverage `StackedBar` in `ChartCard` ("Coverage of {code}") |
| `admin/map-courses-page.tsx:91-111` | `Select` "Library" → `V2FilterBar` (Library, Requirement level) |
| `admin/starter-library-page.tsx:23` | `PageFrame` with no subtitle (not course-scoped); tabs unchanged |
| `admin/configure-wizard.tsx:140-142` | delete the `Badge` from `actions`; render `StatusPill kind="skill"` as the first child under the header |

### T2 Reviewer, director and shared staff pages (parallel after T0)

| File:line | Change |
|---|---|
| `review/review-queue-page.tsx:43-58` | delete hand bars; `AgeCell` → `SignalBarsCell` (section 5.7) |
| `review/review-queue-page.tsx:32-36,213-222` | `AGREE_WORD` and status cells → `StatusPill kind="agreement"` and `kind="queue"` |
| `review/review-queue-page.tsx:123-130` | header: subtitle `contextLine`; `actions=` → `actionItems=[{ id:"how", label:"How this is counted", icon:"fa-circle-info", placement:"overflow", onSelect }]` |
| `review/review-queue-page.tsx:133` | `KeyMetrics` already `cards`; add `<section aria-label="Review summary">`; keep `alert` rule on "Oldest waiting" |
| `review/review-queue-page.tsx:162-170` | `ToggleGroup` block → `V2FilterBar` inside the Awaiting panel |
| `review/review-queue-page.tsx:171-197` | remove `data-bulk-bar` Card and the `"pick"` column; use `V2Grid selectable` + `bulkActions` ("Approve N and count", "Clear selection") |
| `review/review-item-page.tsx:117` | `PageFrame width="wide"`; subtitle `contextLine` |
| `outcomes/outcomes-page.tsx:44-51` | strip unchanged (D23 tile untouched); wrap in `<section aria-label="Outcomes summary">` |
| `outcomes/outcomes-page.tsx:49` | subtitle `contextLine` |
| `outcomes/outcomes-page.tsx:79-84` | `Tabs` → `V2FilterBar` field Outcome (value set unchanged, `OutcomeFilter`); remove `TabsContent` wrapper `:85` |
| `outcomes/outcomes-page.tsx:95` | outcome cell → `StatusPill kind="outcome"` |
| `outcomes/evaluation-page.tsx:149`, `outcomes/remediation-page.tsx:153-160` | staff branch: `actions=` → `actionItems` (one filled primary only: "Confirm version N as final" or "Reopen", and "Close plan"); `width="reading"`; delete local `TONE` `remediation-page.tsx:26`; `version-timeline.tsx:10` re-exports from `lib/v2/status-pill.ts` |
| `director/verification-pages.tsx:26` | delete local `STATUS_TONE`; export from `lib/v2/status-pill.ts` |
| `director/verification-pages.tsx:55,57-72` | subtitle `contextLine`; strip stays; add `V2FilterBar` (Needs action) above the groups; add `<section aria-label="Records summary">` |
| `director/verification-pages.tsx:135` | sub-page `PageFrame` subtitle `contextLine` |
| `reports/reports-page.tsx:142-150` | `actions=` Export → `actionItems=[{ id:"export", label:"Export", icon:"fa-file-export", variant:"outline" }, { id:"how", label:"How this is counted", icon:"fa-circle-info", placement:"overflow" }]`; subtitle `contextLine` (no cohort) |
| `reports/reports-page.tsx:153` | `variant="compact"` → `"cards"` |
| `reports/reports-page.tsx:157-216` | hand filter row and chips → `V2FilterBar`; keep the conflict and empty `LocalBanner`s (`:203-215`) |
| `reports/reports-page.tsx:239,261,391` | wrap `HeatGrid`, pace `DotStrip` and the skills `StackedBar` list each in `ChartCard`; keep `HeatGridKey` inside the heat card |
| `reports/reports-page.tsx:60,423,436` | tone map and cells → `StatusPill kind="cell"` |

### T3 Student and preceptor pages (parallel after T0)

| File:line | Change |
|---|---|
| `student/student-home.tsx:39,72-87` | title unchanged (Home exception); wrap `Waffle` in `ChartCard`; no strip |
| `student/history-page.tsx:41-51` | wrap `CumulativeLine` in `ChartCard` "Pace this term", description "Evaluations counted against the expected pace." (viz label unchanged and different from the title) |
| `student/history-page.tsx:22,95,106,206` | tone map → `StatusPill kind="attempt"` and `kind="verify"` |
| `student/skill-card.tsx:16-17,36-47,70` | tone maps → `StatusPill kind="skill-progress"`; remove the `BulletMeter` loop; add one text line per required setting |
| `student/record-page.tsx:66,78` | `StudentPage` unchanged call; status → `StatusPill kind="verify"` |
| `student/request-signoff.tsx:148`, `student/log-flow.tsx:153,383` | no change beyond inheriting T0 `StudentPage` |
| `student/sync-chip.tsx:19` | render through `StatusPill kind="sync"` (never `danger`, as today) |
| `student/sync-page.tsx:75,194` | drop `wide`; default width applies |
| `preceptor/evaluation-form.tsx:32,51-70` | local `OUTCOME_TONE` → `StatusPill kind="outcome"`; `Frame`: delete `mx-auto` (`:67`), use `PageFrame width="reading"` |
| `preceptor/lab-grid-page.tsx:194` | subtitle `contextLine`; `:334` stays on the allow-list |

---

## 14. DS mapping summary

| Need | Component | Verdict | Source |
|---|---|---|---|
| Page title and actions | `PageHeader` (+ `PageHeaderActionItem`) via `PageFrame` | IMPORT | `[DS]` `page-header.d.ts` |
| KPI strip | `KeyMetrics`, `MetricItem` | IMPORT | `[DS]` `key-metrics.d.ts` |
| Filters | `FilterBar`, `FilterBarAddButton`, `FilterBarClearButton`, `FilterFieldDef`, `ActiveFilter`, composed as `V2FilterBar` | IMPORT parts, HAND-ROLL the composition | `[DS]` `filter-bar.d.ts`, `table-properties-types.d.ts`; `FilterPill` is not exported |
| Table | `DataTable` via `V2Grid` | IMPORT | `[DS]` `components/data-table` |
| Status | `StatusBadge` semantic | IMPORT | `[DS]` `status-badge.d.ts` |
| Age | `SignalBarsCell` | IMPORT | `[DS]` `table-cells.d.ts` |
| Chart shell | `ChartCard` | VENDOR | PCE `charts-overview.tsx:451` |
| Chart body | `ChartContainer`, `ChartTooltip` | IMPORT (already in `cumulative-line.tsx:4`) | `[DS]` `chart.d.ts` |
| Viz | `components/v2/viz/*` | existing product feature components, documented in `docs/v2/new-components-needed.md` | |

---

## 15. Risks and unknowns (max 3)

1. **`V2FilterBar` is a hand composition** because the DS does not export `FilterPill`. If `ds-adoption-reviewer` prefers the DataTable's native `showQueryControls` toolbar, only Library, Courses, queue and Outcomes (the table pages) can use it; Reports and Records would still need the composition. Decide before T0 starts.
2. **`PageFrame` is shared with v1** (3 consumers). The change is additive, but its `px-4 md:px-6` gutter changes v1 below 768 px unless gated; T0 gates it by a `compactGutter` default of the old value for v1 call sites, or accepts the shift. Run v1 screenshots before and after.
3. **Verification environment drift:** `tools/ds/source.mjs` printed `@exxatdesignux/ui@1.5.1` while `admin` installs 1.6.5; I read `FilterBar`, `PageHeader.actionItems`, `KeyMetrics`, `StatusBadge` and `SignalBarsCell` from the 1.6.5 `dist` of the admin app, and the live catalog page `chart-card` returned only the app shell to a plain fetch, so the visual reference was **not** compared. Visual match is therefore not verified here.

---

## 16. Not decided (flagged, left unchanged)

- **[D23] Confidential concerns count.** The Outcomes strip keeps the "Confidential concerns" tile and `concernsFor(s, role)` exactly as is, so the reviewer and director still see it. Whether they should is open (`docs/v2/decisions-and-open-questions.md:46`). Not changed, not extended to the queue or Records.
- **[OD-29]** report as launch page, **[OD-19]** lab batch grid, **[OD-10]** export format: untouched.
- Whether the strip may carry a comparison delta once the seed has a prior period. No delta is invented.
- A two-column student Home at wide widths.
- Whether `Records` should become a `V2Grid` table.
- Skill-level status words beyond today's strings; wording for the four achievement states `[REQ AE-04]` stays with `ux/09-content-and-microcopy.md`.
- Anything in v1 (`components/shell`, `lib/skills-nav.tsx`) or the production `/e/{token}` evaluator route.

## 17. Open questions for Romit (recommendation first)

1. **Director lands on Records although it becomes the second nav row?** Recommend yes, via an explicit `landing` field. Alternative: keep director order Records, Reports, Outcomes and accept one role whose shared rows differ.
2. **Remove the per-setting `BulletMeter`s from the student skill card?** Recommend yes: the card keeps its evaluation dots and prints the setting minimums as text. This amends research row V14.
3. **Queue keeps 12 columns** because `[REQ AR-01]` lists the attributes. Recommend yes; if the DS table properties drawer can hide columns without `showQueryControls`, offer default-hidden for Course, Source and Since. Not verified.
4. **Records filter field.** "Needs action" avoids repeating the status groups. Recommend adding it. If you would rather leave Records unfiltered, the director landing anatomy has no filter row and the "one FilterBar" rule becomes "one FilterBar where a list can be filtered".
5. **"How this is counted" as an overflow action.** Recommend yes (tertiary, same place on queue and Reports). Cost: one extra click to reach the method.
6. **Student desktop:** left-aligned 48rem column (recommended) or keep the centred phone column on desktop and align only the header.
7. **Reports Students tab shows two chart cards** (heat grid and pace). Recommend yes; the alternative is one card per tab view via an inner toggle.
