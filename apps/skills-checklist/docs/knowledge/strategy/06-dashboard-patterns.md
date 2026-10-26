# Strategy 06: dashboard patterns (the staff landing page is a Dashboard, not a Home)

**Written:** 2026-10-26 for Romit Soley. **Status:** strategy, not a contract. No app code changed. No `OD-*` is treated as decided.
**Why this file exists:** Romit: the landing page must be a **dashboard**, and its patterns, UI and interaction logic must match a dashboard's purpose [ROMIT 10-26]. Also: cohort is a **filter** on attainment, not a default three-cohort side-by-side; comparison is a secondary view [ROMIT 10-26; REQ RP-01]. This file supersedes the three-cohort layouts in `../design/dashboards-and-layouts.md` (admin A pace lanes, admin B section x cohort grid) where they differ.
**Inputs read:** `../00-design-brief.md`, `../glossary.md`, `../02-decisions-ledger.md`, `01` to `05` in this folder, `../design/dashboards-and-layouts.md` and shots `admin-A/B/C-1440.png`, `../ds-usage-map.md`, `../ds-conformance-v2.md`, `../dataset-spec.md`, REQ (RP-01..10, AE-04, SH-04, AR-01..06), both calls, the competitive analysis (reporting rows), DS `@exxatdesignux/ui` via `node tools/ds/source.mjs`.
**Tags:** `[REQ id]` · `[CALL 10-08]` / `[CALL 10-09]` · `[COMP]` · `[AUDIT Tn]` · `[LEDGER]` · `[S01..S05]` sibling strategy docs · `[M#]` Mobbin reference (section 10) · `[DS]` checked with `source.mjs` · `[INFER]` · `PENDING-ROMIT`.
**Format:** every decision is DECISION, WHY, REJECTED, CHECK.

---

## 1. What a dashboard is for here, and why it is not a Home

A **Home** is a place to start: shortcuts, recent activity, greetings, set-up cards, "what's new". A **dashboard** is an instrument: it **monitors** a population against a standard, helps the reader **diagnose** where the gap sits, **decide** what matters most, and **act** by drilling into the exact people or skills behind a figure.

| # | DECISION | WHY | REJECTED | CHECK |
|---|---|---|---|---|
| D1 | The staff landing answers 3 to 5 fixed questions about a **population** (students in scope) within 10 seconds, above the fold at 1440 | Programs need "attainment across a population, and to move from an aggregate figure to the individual evidence" [REQ section 11 intro, RP-05]; Aarti: "pick a cohort ... 29 students meeting the criteria, who is not meeting" [CALL 10-09] | A Home with a greeting, shortcuts and recent activity | Timed read: a coordinator states the hero number, the main cause and the next click in 10 s |
| D2 | Every number leads to an action: it opens a list whose length equals the number, filtered by the same scope | [REQ RP-05, RP-06]; [S05 I-3]; "my report should be my launch page ... I see I have not met this, I trigger" [CALL 10-08] | Decorative KPIs; counts that open an unfiltered list | Click every figure; row count equals figure (test I-3) |
| D3 | A dashboard is about the population, never about the viewer. Set-up backlog, adoption and "what changed" appear only as worklist rows that need the viewer, not as cards | Keeps the page an instrument [INFER]; set-up meter already moved off the landing [S05 Q6] | "Getting started" or onboarding cards on the landing | No card whose subject is the viewer's account or the product |
| D4 | One scope, one comparison basis, one as-of time apply to the whole page and are always visible | A figure without its scope, standard and time is unreadable [REQ RP-01 "what is currently applied must be evident"] | Per-card scopes that drift | Screenshot: scope chips, basis and as-of readable without interaction |

**The test:** remove the numbers. If the page still works as a launcher (links, greetings, set-up), it was a Home. If nothing is left but navigation, it was a dashboard. A second test: **could this page be a Home? Then it is not a dashboard.**

## 2. Which roles get a dashboard, and the nav label per role

| Role | Landing | Nav label | Dashboard? | WHY | REJECTED |
|---|---|---|---|---|---|
| Admin / coordinator | Program dashboard | **Dashboard** | Yes, full contract | Monitors 100+ students against required skills; Romit's directive | "Home" (a launcher word); "Overview" (says nothing about monitoring) |
| Reviewer | Approvals | **Approvals** (badge) | Yes, a **queue dashboard**: hero, aging, then the worklist is the main body | The label names the job; the page monitors the backlog (age, outliers) and acts on rows [REQ AR-01; COMP Medtrics approval hub: batch approve, late flags, turnaround] | A separate reviewer "Dashboard" row (adds a row with nothing the queue does not show [S01 4.2]) |
| Director | Readiness dashboard | **Dashboard** (proposal) | Yes | "Is the graduating cohort ready, what blocks them" is a population question [REQ RP-05]. Verification, if kept, becomes the worklist region, so the nav row no longer rests on a non-REQ feature [AUDIT T3] | "Verification" as the landing row (not in REQ; S01 Q-IA3 open) |
| Student | Personal progress | **Progress** (page title "Your progress") | **No.** A personal tracker that borrows dashboard UI rules (hero figure, as-of, drill, states) but has no scope bar, no worklist bulk, no population | D1 says a dashboard is about a population; a student is one person. "Home" is the word Romit rejected; "Progress" names the question [REQ SH-04] and Aarti's "the report is the same as the launch page ... at the student level" [CALL 10-08] | "Dashboard" for students (implies monitoring others); "Home" |
| Evaluator | Requests page | none | No | No account, no chrome [REQ EV-01] | Any chart [S05 section 2] |

Nav after this file (still 11 rows; PENDING-ROMIT on the director row): admin Dashboard, {Skills}, Approvals, Attainment · reviewer Approvals, Students · director Dashboard, Attainment · student Progress, Log, Record.

## 3. Interaction logic

### 3.1 The global scope bar

```
| Scope  [Fall 2026 v] [Cohort: any v] [Group: any v] [Course: any v] [More filters v]   Compare with [Expected now v]  |
| Applied: (Fall 2026)  (Cohort 2027 x)  (Tag: IV therapy x)                Clear filters    Saved views v    As of Oct 25, 09:40 [refresh] |
```

| # | DECISION | WHY | REJECTED | CHECK |
|---|---|---|---|---|
| S1 | One scope bar under the page header on Dashboard, Attainment and Approvals. Primary fields: **term, cohort, group, course**; "More filters" holds **category, tag, location, setting** | RP-01 lists cohort, group, clinical course, category, tag, location, setting [REQ RP-01]; term identifies an offering [REQ CM-01, line 183]; term in the bar is `[INFER]` | Cohort as a page-level tab set; a filter modal that hides state | All seven REQ dimensions reachable; term present |
| S2 | **Single scope.** Default on first visit: current term, every active student, no cohort chosen. The hero speaks for that one population ("12 of 123") | Romit: cohort is a filter, not a default comparison; Aarti picks a cohort and reads one summary [CALL 10-09] | The three-cohort side-by-side as default (my earlier inference in admin A and B) | Default render has one population, no cohort lanes |
| S3 | Cohort and group are peers in the bar. Group exists because programs use tracks, not only cohorts [CALL 10-09: "the cohort idea is getting challenged ... they like to do tracks"] | Cohort-only scoping fails nursing tracks | Cohort only | A group can be chosen without a cohort |
| S4 | Applied scope shows as chips, each removable alone; "Clear filters" resets to the default, not to nothing | [REQ RP-01] | Chips that clear together | Remove one chip: only that dimension changes; figures recompute |
| S5 | Scope lives in the URL (`term`, `coh`, `grp`, `course`, `cat`, `tag`, `site`, `setting`, `basis`) and is **shared**: moving Dashboard to Attainment or Approvals keeps it. Opening a nav row with no query restores the viewer's last scope and writes it into the URL, so the chips show it | One scope everywhere [ROMIT 10-26]; [S01 L2, L6]; pasteable view [S01 5.1] | Per-page memory; scope in hidden state | Change cohort on Dashboard, open Attainment: same chips, same totals (I-5) |
| S6 | Location and setting **recount evidence** (only evidence gathered there) and say so next to the chip: "Counting evidence from Seaside Regional only" | [REQ RP-08] changes the meaning of every figure | Silent recount | Info line appears whenever location or setting is applied |
| S7 | An impossible combination is explained in place of the figures, with one Remove action per offending chip | [REQ RP-09] | Zeros and empty charts | Pick a location without the setting: explanation, not 0 |
| S8 | Approvals honours term, cohort, group and course only (rows are evaluations, filtered by their student); category and tag filter by skill | A queue row has one student and one skill [REQ AR-01] | Ignoring the scope on Approvals | Scope Cohort 2027: queue holds only Cohort 2027 students |

### 3.2 Comparison basis (what "behind" is measured against)

| Basis | Formula | When valid | Source |
|---|---|---|---|
| **Expected now** (term clock) | behind if `achieved < required x termShare - margin` | Needs a term with dates; **pace is a v2 assumption** | [S05 4.1; AUDIT T1 D31] PENDING-ROMIT |
| **Peer median** | gap = student achieved minus median of the scope | Scope n >= 5 | [S05 section 6] |
| **All required** | achieved of required for the course offering; no time | Always | [REQ AE-03, CM-03] |

DECISION B1: one basis per page, chosen in the scope bar ("Compare with"), stored in the URL as `basis`, and named in the hero sentence ("behind the term clock", "below the scope median", "short of all required"). Default **Expected now**, with the caption "Expected = share of the term gone" until Romit confirms pace; if he rejects it, the default becomes **All required** and "behind" reads "not yet achieved".
WHY: "behind" means nothing without its standard [S05 P4]; the build prompt and v2 use the term clock [CODE reports.ts]; All required rests on REQ alone. REJECTED: showing all three at once (three answers to one question); a hidden fixed basis. CHECK: switch basis; hero, strip and drill list change together and the sentence names the basis.

### 3.3 As-of, freshness and refresh

| # | DECISION | WHY | REJECTED | CHECK |
|---|---|---|---|---|
| F1 | "As of Oct 25, 09:40" sits at the right end of the scope bar, with an icon-only Refresh button (`aria-label="Refresh figures"`) | A monitoring page must say when its figures were true [M4, M5] | No timestamp; relative time only ("3 min ago") without a hover date | Timestamp present on Dashboard, Attainment, Approvals and in every export |
| F2 | No silent auto-refresh. When new evidence arrives, a quiet line appears: "New evidence since 09:40. Refresh to update." Figures change only on Refresh | Numbers moving under a reader break drill equality and trust [INFER] | Live reflow every few seconds | Submit an evaluation in another tab: line appears; figures unchanged until Refresh |
| F3 | After a rule change, figures are recalculated for evidence already held [REQ AE-02]; while that runs, an info `LocalBanner`: "Recalculating after a rule change to IV therapy. Figures may move." | The engine re-applies rules retroactively; the reader must know why counts shifted | Unannounced jumps | Publish a rule change: banner, then a new as-of |
| F4 | Stale: if figures are older than 24 h (production batch) the as-of turns to a warning chip "Figures from yesterday, 18:00" | Production may compute in batches [INFER]; the prototype computes on load, so stale never fires there | Hiding staleness | Force an old as-of: warning chip renders |

### 3.4 Drill rules

| # | DECISION | WHY | CHECK |
|---|---|---|---|
| R1 | A figure opens the list behind it, filtered by **the same scope, basis and as-of**; the list header repeats the figure ("12 students behind the term clock") | [REQ RP-05]; [S05 I-3] | Count equality on every link |
| R2 | Drill list opens as a route (Attainment view with the condition as a chip, for example `behind=1`), not a sheet, so it has a URL and a breadcrumb "Dashboard > Students behind (12)" | Needs to be shareable and restorable [S01 4.2] | Paste URL in a new tab: same list |
| R3 | Back restores the dashboard scroll and scope | [S01 L6]; "without leaving the report and searching again" [REQ RP-06] | Back lands on the same card |
| R4 | A chart mark (dot, bar, cell) opens the narrowest list: one student, or the students in that bucket | [REQ RP-06] | Click a dot: that student's record |
| R5 | The condition chip ("Behind the term clock") is removable like any filter; removing it widens to the scope | [REQ RP-01] | Remove: list shows all students in scope |

### 3.5 Hover, focus, keyboard

Hover or focus on a figure shows a `Tip` with the formula in words and its inputs ("Behind: 6 of 50 required achieved, 26 expected by now"). Tab order: scope bar, hero action, KPI cells, chart cards (Tab enters the figure, arrows move between marks, Enter drills), worklist. Every hover fact is also reachable by focus and present in the table fallback. No hover-only actions.

### 3.6 Worklist, selection and bulk

| # | DECISION | WHY | REJECTED |
|---|---|---|---|
| W1 | The admin and director worklists are heterogeneous rows ("2 approvals older than 10 days", "3 evaluator names to adopt"); each row links to the exact record. **No selection on the dashboard** | Rows differ in kind; one bulk action cannot apply [INFER] | Checkboxes on mixed rows |
| W2 | Bulk lives where rows are alike: Approvals (bulk approve with named blockers [S01 section 8]), {Skills} (bulk configure [REQ IM-14]), drill lists (export) | Bulk by default for 100+ [S03 section 10] | Bulk nudges from the dashboard: reminders and notifications are out of scope [REQ 14] |
| W3 | Worklist order: oldest or most blocking first, capped at 5 rows plus "All n" | Triage, not roll-call [S03 section 10] | Alphabetical |

### 3.7 Saved views, export, density

- **Saved views** [INFER]: up to 5 named scope sets per user ("Cohort 2027, behind"), stored as the URL query, shared by Dashboard and Attainment, chosen from a menu in the scope bar [M6]. Rejected: a dashboard builder (out of scope [S01 section 8]).
- **Export exactly what is on screen**: `ExportDrawer` with two outputs, the aggregate view and a row-per-evaluation detail; both record scope chips, basis and as-of in a header block [REQ RP-10]. Format is OD-10, open. Export is a page action, never per card [M7, M9].
- **Density**: no page-level density toggle. Drill lists inherit the DS `DataTable` row height setting. Rejected: a compact mode for the dashboard (fewer regions is the density answer).

## 4. UI rules

### 4.1 Region hierarchy and DS components

```
PAGE HEADER     H1 + one purpose line + Export (one action) + "Sample data" chip        PageHeader
SCOPE BAR       fields + chips + Compare with + Saved views + As of + Refresh           Select/Popover + FilterBar + ButtonSegmentedControl + Tip
HERO VERDICT    icon tile, number + "of N noun", one cause sentence, one outline button  Card + Button variant="outline" size="sm" + vendored viz glyph row
KPI STRIP       max 4, each links, never repeats the hero or a tab count                 KeyMetrics variant="flat" size="sm" metricsSingleRow (MetricItem.href)
DIAGNOSE ROW    2 chart cards, title = the question, summary, legend, chart, table        vendored ChartCard + components/v2/viz/* + Collapsible "Show as table"
WORKLIST        rows that need the viewer, oldest first, 5 + "All n"                      DataRowList or DataTable (queue), StatusBadge, TabsCountBadge on tabs
```

| Rule | WHY | CHECK |
|---|---|---|
| Max 4 KPIs, max 2 diagnose cards, one worklist [S05 section 10] | Each landing earns its content; fewer rows [LEDGER D-A] | Count regions |
| Hero is one number with a denominator and a glyph, never a gauge or progress bar | [S05 P3, P4]; memory pure-typography-loses-storytelling | No `ProgressCell`, no meter in hero |
| KPI polarity set per metric (`lower_is_better` for waiting) [DS MetricTrendPolarity] | Wrong tint reads bad as good [S04 4.2] | Inspect props |
| Amber for behind, never red; glyph plus word | [MEMORY aarti_no_red]; [S05 P6] | grep viz for `destructive` |
| Brand colour only on primary CTA, rail tint, selected row; chips neutral | [S04 section 7] | Screenshot |
| `ChartCard` is not exported by the DS; use the app's vendored copy [DS: "NOT exported by 1.5.1"] | No hand-rolled cards | import path check |

### 4.2 Responsive

| Width | Scope bar | Hero | KPI | Diagnose | Worklist |
|---|---|---|---|---|---|
| 1440 / 1280 | one row, chips below | number + sentence + glyph row | 4 across | 7 + 5 columns | 8 + 4 with site aging |
| 1024 | fields collapse into "Scope (3)" button opening a `Sheet`; chips stay visible | glyph row drops under sentence | 2 x 2 | stacked 12 + 12 | stacked |
| 375 | "Scope (3)" button + horizontally scrolling chip row inside its own region; as-of under the title | number + sentence | 2 columns | each chart shows its table under 600 px [S04 section 10] | single column, last |

No horizontal page scroll at any width [S04 section 10].

### 4.3 States

| State | Pattern | Example copy |
|---|---|---|
| Loading | `Skeleton` in the final shape: hero line, 4 KPI cells, 2 chart frames, 5 worklist rows; scope bar renders live | none |
| Empty, no data yet | Hero becomes the next set-up step; diagnose row hidden; worklist shows the set-up rows | "No students in Fall 2026 yet. Import your cohort to see who is behind." |
| Empty, scope has no students | Info banner in place of hero, chips stay | "Cohort 2028 has no students in NURS 350." + Remove filter |
| All clear | Hero in the success tone, calm, states what is true; charts still drawn; no confetti | "Nobody is behind the term clock. 43 students, all on pace." |
| Error | Per card: what failed, what is kept, Try again; other cards render | "Pace could not be calculated. The other figures are current." |
| Partial | Suppressed values say why: peer median under n 5, evaluator rates under n 30 | "Too few students in this scope to compare (4)." |
| Sample data | Persistent neutral chip in the header on every prototype page [S05 section 6] | "Sample data" |
| Stale / recalculating | F3, F4 | as above |

## 5. Per-role dashboard specs (single scope)

### 5.1 Admin / coordinator: Dashboard (replaces admin A, B, C)

```
+------------------------------------------------------------------------------------------+
| Dashboard   Who is behind, what blocks them, what needs you.     [Export] [Sample data]  |
| [Fall 2026 v][Cohort v][Group v][Course v][More v]  Compare with [Expected now v]        |
| (Fall 2026) (All active students)                       Saved views v  As of 09:40 [r]   |
+------------------------------------------------------------------------------------------+
| [icon] 12 of 123 students are behind the term clock                 <><><><><><><><><><><>|
|        9 are short in IV therapy. Lowest is 15%.  [View the 12]                          |
+------------------------------------------------------------------------------------------+
| Required achieved 58% | Waiting with evaluators 404 | Awaiting approval 20 | Configured 142 of 154 |
+-----------------------------------------------+------------------------------------------+
| WHO IS BEHIND, AND BY HOW MUCH?               | WHICH REQUIRED SKILL BLOCKS THE MOST?    |
| Split by [None | Cohort | Group]              | Hangs PB Med  -------------<> 31         |
|  -40      -20       0 (on pace)     +20       | Rate calc     ----------o 26             |
|  <> <><><> <><>  ...|ooooooooooooooooo        | ... top 8 of 50          [All 50]        |
|  x = points ahead or behind the basis         | > Show as table                          |
+-----------------------------------------------+------------------------------------------+
| WHERE ARE REQUESTS STUCK? (top 5 sites + other) | NEEDS YOU (5, oldest first)            |
+-----------------------------------------------+------------------------------------------+
```

| Region | Question | DS / component | Drill target |
|---|---|---|---|
| Hero | Who is behind? | `Card`, outline `Button`, vendored glyph row | Attainment Students, chip "Behind the term clock" (12 rows) |
| KPI 1 to 4 | How far overall; how much is stuck; what waits approval; is set-up done | `KeyMetrics variant="flat"`, `MetricChart` sparkline only with 12 real weeks | Attainment; Approvals Stalled; Approvals; {Skills} filter "Needs configuration" |
| Who is behind | One strip for the whole scope; x = gap to the basis in points, so students of different cohorts share one axis; split toggle adds lanes on demand | vendored `ChartCard` + `DotStrip` (x domain changed) + `ViewSegmentedControl` (`aria-label="Split by"`) | dot: Student record |
| Blocking skill | Which required skill is short for most students where it is expected now | `ChartCard` + ranked dots (C7) | Attainment {Skills}, skill drill-down |
| Stuck requests | Which sites and evaluators are stale | `ChartCard` + `StackedBar` aging (C8) | Site snapshot; Evaluators tab |
| Needs you | What needs me | `DataRowList` rows, one outline button at most | exact record per row |

WHY the gap axis: a single scope can hold several cohorts with different expected values; plotting achieved % would need one expected line per cohort, which forces the three-lane layout back. Plotting the gap keeps one population and one zero line [INFER]. Under the All required basis the axis becomes achieved %, with no zero line. REJECTED: admin A's three default lanes; admin C's question list as the desktop layout (hides two of three answers).

### 5.2 Section x scope view (admin B, reworked; lives in Attainment)

```
| Where is this scope short?            Split by [None | Cohort | Group]   Required | All skills |
| Section (required)     Scope 123      <- None: one column, achieved % and expected-now marker |
| Basic Skills 14        81%  (75)                                                              |
| IV therapy 6           38% /!\ (60)   <- amber outline when 8+ points under the basis         |
| Split by Cohort:       2026 38 | 2027 43 | 2028 42   (columns appear only on demand)           |
```

DECISION: B's grid moves into Attainment as the **Sections** view (first tab candidate, PENDING OD-29 for whether Attainment is the launch page). Default is one column for the scope; "Split by Cohort or Group" adds one column per subgroup, suppressing subgroups under n 5. Cell = `Button` with an accessible name ("IV therapy, Cohort 2027: 38% achieved, 60% expected"); opens students in that cell. WHY: keeps comparison secondary [ROMIT 10-26] while keeping the strongest "where" answer [S05 P2: 10 sections aggregated]. REJECTED: the three-cohort grid as default; 123 x 154 cells.

### 5.3 Reviewer: Approvals (queue dashboard)

```
| Approvals                                    [Sample data]                    |
| [Term v][Cohort v][Group v][Course v]                     As of 09:40 [r]     |
| [inbox] 20 evaluations in 14 submissions wait for you. 2 waited over 10 days. |
| AGE OF WAITING SUBMISSIONS (units)       | IS ONE EVALUATOR AN OUTLIER? (n>=30)|
| Awaiting approval (14) | Stalled requests (141) | Returned (64)               |
| [] Student | Skills | Evaluator | Held because | Answers agree | Waiting | ->  |
```

DS: `Tabs` + `TabsCountBadge`, `DataTable` with selection and `BulkAction` "Approve selected" (blocked rows named before confirm), `StatusBadge` for "Unverified", vendored `ChartCard` for aging and outlier strip. Tab counts are the only counts; no KPI strip [AUDIT T4 P2-7]. Scope narrows the queue (S8).

### 5.4 Director: Dashboard (readiness)

```
| Dashboard   Is the graduating cohort ready?            [Sample data]            |
| [Cohort: 2026 (graduating) x] [Group v][Course v]        As of 09:40 [r]        |
| [cap] 31 of 38 graduating students have met every required skill               |
|       7 are one skill short, all on Hangs PB Med. 3 already have a request.    |
|       [28 ready ......][3 pending][7 one short]                                |
| WHAT STOPS THE 7?  skill | students | waiting requests       (one card)        |
| RECORDS BY NEXT STEP  Ready 28 | Pending 3 | One short 7 | Changed since 0     |
```

Default scope: the cohort with the nearest graduation date, shown as a removable chip (the one place a cohort is preselected, because the director's question names it). Readiness split = vendored `StackedBar` (C16); records = `DataTable` grouped. Verification actions live on the student record only (Q3 stays open). If verification is dropped, the "Records by next step" region becomes "Students by next step" and the page is unchanged otherwise.

### 5.5 Student: Progress (personal, not a dashboard)

Hero waffle "6 of 12 required sign-offs counted", Do this next card, mandatory list with causes, Waiting on others, What changed for you [design 2.2]. Scope = one control: course `ViewSegmentedControl` "NURS 350 | All courses" [REQ SH-06]. No basis selector; pace line shown only if pace is confirmed. No peer comparison by default (S05 Q7). As-of shown only when offline or queued [S03 section 6].

## 6. Metric definitions

| Metric | Formula (one selector, shared) | Denominator shown | Links to | Status |
|---|---|---|---|---|
| Behind (term clock) | student in scope with `achievedRequired < requiredTotal x termShare - PACE_MARGIN` | students in scope ("of 123") | Attainment Students, chip "Behind the term clock" | **PENDING-ROMIT** (pace is assumption D31 [AUDIT T1]); margin value also unconfirmed |
| Behind (peer median) | achieved below scope median minus margin | students in scope, n >= 5 | same, chip "Below scope median" | INFER |
| Not yet achieved (all required) | required skill records not Achieved [REQ AE-04] | required skill records in scope | Attainment {Skills} | REQ-safe |
| Required achieved % | Achieved required skill records / required skill records in scope | "3,583 of 6,150" | Attainment Students | [REQ RP-02] |
| Blocking skill | per required skill: students in scope not Achieved where the skill is mandatory in their offering (and expected now under the term-clock basis); rank desc | students it is mandatory for | skill drill-down | INFER; "expected now per skill" is new, PENDING-ROMIT |
| Waiting | submissions with an evaluator, no completed evaluation, students in scope | requests, with age buckets 0-3 / 4-7 / 8-14 / 15+ | Approvals Stalled, sorted oldest | [REQ SH-02]; buckets [BUILD-PROMPT N-04, N-11] |
| Stale site | site with 5+ open requests, all older than 15 days | requests at that site | Site snapshot | [S05 4.1] INFER thresholds |
| Stale evaluator | evaluator (often unverified) holding a request older than 8 days | evaluators | Evaluators tab, filter | [BUILD-PROMPT N-09]; INFER |
| Awaiting approval | evaluations held for approval, excluded from achievement [REQ AR-06] | evaluations and submissions ("20 in 14") | Approvals Awaiting | REQ |
| Ready (director) | graduating student with every required skill Achieved | graduating students | Records, Ready group | INFER (director not in REQ) |

Rule: pending never counts [REQ AE-01]; every figure obeys invariants I-1 to I-7 [S05 section 7].

## 7. Accessibility

| Requirement | Rule | CHECK |
|---|---|---|
| Landmarks | Scope bar is a `form` region named "Scope"; chips are a group named "Applied filters" (`FilterBar aria-label`) | axe; screen-reader rotor |
| Change announcements | After a scope or basis change, a polite live region states the new hero ("12 of 123 students behind") | NVDA or VoiceOver walk-through |
| Chip removal | Each chip remove button: `aria-label="Remove Cohort 2027"`; focus moves to the next chip, or to "Add filter" | Keyboard |
| Charts | Text summary in the accessible name, "Show as table", arrows between marks [S05 section 8] | axe with contrast on |
| Colour | Behind = amber diamond + word; never colour alone | Greyscale screenshot |
| Targets | 24 px minimum; 44 px on touch | Inspect |
| Motion | No animated counters; respect reduced motion | OS toggle |
| Timestamp | As-of is text, not only an icon; Refresh is labelled | axe `button-name` |

## 8. Open questions for Romit

| # | Question | Recommendation | Why it matters |
|---|---|---|---|
| Q1 | Is pace (term clock) a real program concept? | Keep as default basis with caption until confirmed; fallback All required | Drives hero, strip and blocking skill |
| Q2 | Student landing label: "Progress" (proposed) or keep "Home"? | Progress | Romit's rename covered staff; student label was not stated |
| Q3 | Director rows: Dashboard + Attainment, with Verification folded into the worklist? | Yes | Removes a nav row that rests on a non-REQ feature |
| Q4 | Default scope on first visit: all active students (proposed) or the user's own cohort? | All active students; then remember last scope | Aarti picks a cohort [CALL 10-09]; remembering covers that |
| Q5 | Is term a scope field? Not listed in RP-01 | Yes, via course offering | Needed for the term clock |
| Q6 | Attainment Sections view as first tab, and Attainment as the launch page (OD-29)? | Keep Dashboard as landing; Sections one click away | OD-29 open |
| Q7 | Saved views in v1? | Yes, 5 per user | Weekly review cadence [COMP Chen 2026] |

## 9. Review a dashboard against this doc

1. Could this page be a Home? If yes, it fails (section 1).
2. It answers its 3 to 5 questions above the fold at 1440 in 10 s; the hero names number, denominator, basis and cause.
3. Scope bar present; default is a single population; every applied filter is a removable chip; all seven RP-01 dimensions reachable.
4. Change the scope on the dashboard, open Attainment and Approvals: same chips, same totals.
5. Comparison basis visible, changeable, named in the hero sentence; pace caption shown while PENDING-ROMIT.
6. As-of timestamp and Refresh present; no silent reflow; rule-change recalculation announced.
7. Every figure opens a list of equal length with the same scope; breadcrumb back restores scroll.
8. Max 4 KPIs, max 2 diagnose cards, one worklist; no progress bars, gauges or red; amber with glyph and word.
9. Comparison across cohorts or groups appears only through "Split by", never by default; subgroups under n 5 suppressed.
10. No selection on mixed worklists; bulk only where rows are alike; no reminders (REQ 14).
11. Export records scope, basis and as-of; covers the full filtered scope [REQ RP-10].
12. States: loading skeleton, no data, empty scope, impossible filter, all clear, per-card error, partial, sample data, stale.
13. Responsive at 1440, 1024, 375 with no horizontal page scroll; scope collapses into a Sheet below 1280.
14. DS only: `PageHeader`, `FilterBar`, `KeyMetrics variant="flat"`, `ViewSegmentedControl`, `Tabs` + `TabsCountBadge`, `DataTable`, `ExportDrawer`, `LocalBanner`, `Skeleton`, `Tip`, vendored `ChartCard`; checked with `node tools/ds/source.mjs`.
15. Copy: sentence case, no em dashes, no requirement IDs, none of the banned generic nouns (glossary section 5 rule 9); skill noun from `{itemNoun}`.

## 10. Mobbin references (viewed)

- M1 AirOps, analytics with labelled scope selects (Date, Region, Platforms) and a per-card breakdown menu: https://mobbin.com/screens/ef4f113f-b98a-49b6-a028-4b43d9de78df . Teaches: scope fields named in the control; breakdown is per card, secondary.
- M2 Square, report chips ("Locations All", "Compare to Last year" removable): https://mobbin.com/screens/69be9b8b-34ee-418a-b20e-01682f8b9d4d . Teaches: comparison as a removable chip; table under chart carries both periods.
- M3 Square, "Today vs Yesterday" compare control: https://mobbin.com/screens/6e267440-5f3e-470f-b69a-465ba480df46 . Teaches: basis as an explicit control.
- M4 Browserbase, "Last updated Aug 3, 10:54" plus Refresh beside the analytics range: https://mobbin.com/screens/654392d0-9063-4db4-8987-6b7fc6742537 . Teaches: as-of next to scope.
- M5 Customer.io, "Healthy. Everything is running smoothly" with last updated: https://mobbin.com/screens/b9743841-5a29-4454-bc39-133d7b0d7d9c . Teaches: calm all-clear that still states the time.
- M6 Snowflake, "Preset" saved view, range, and a drill panel split "By warehouse / role": https://mobbin.com/screens/fc035908-b904-44a1-9e13-8559a7e7988e . Teaches: saved scope presets; split toggle on demand.
- M7 Calendly, Filters and Export at page level, card repeats its range: https://mobbin.com/screens/1d417c2e-234a-4bf0-a87e-dc65703c2b64 . Teaches: one export for the page's scope.
- M8 Meetup, Filters, Groups, Clear filters above KPIs: https://mobbin.com/screens/5fb395bc-b7da-46af-83d5-6c5e07058b24 . Teaches: clear-all beside the filters. Do not copy: zero-only KPIs.
- M9 Plane, chart with the same data as a table and "Export as csv": https://mobbin.com/screens/e72a4c38-297c-4f7e-b540-2fda1271cab9 . Teaches: table fallback under every chart. Do not copy: red and green bars.
- M10 Gumloop, KPI row, "Compare to previous period", refresh: https://mobbin.com/screens/cdff9767-1030-4ba3-8339-a3b5fd5fc2d3 . Teaches: comparison off by default, one click on.

Competitive: Typhon compares students, sites and preceptors with filters; Medtrics runs an approval hub on batch approve, late flags and turnaround; Competency.AI sells at-risk and gap analytics [COMP]. All three support filter-first, single-scope monitoring with comparison as a choice.
