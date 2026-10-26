# Dashboards and page layouts (Skills Checklist v2, Mobbin-researched)

**Status:** design proposal for Romit. No app code changed. Written 2026-10-26.
**Consulted first:** `../00-design-brief.md`, `../glossary.md`, `../02-decisions-ledger.md`, `../strategy/01..05`, `../dataset-spec.md`, `docs/v2/audit/T4-cross-role.md`, current shots `docs/v2/screenshots/a3-viz-home.png`, `/tmp/sc-audit/shots/{student-home,reviewer-queue,director-records}.jpg`, DS tokens from installed `@exxatdesignux/ui` 1.6.x `src/globals.css` (`:root` and `.theme-prism:not(.dark)`).
**Memory rules applied:** Mobbin first; viz first, text annotates; progress bars last resort; a hero metric with an icon on every landing (pure typography loses storytelling); no vanilla template look; never override DS Card or Button shape; no icons on action buttons; nothing under 12 px; amber for shortfall, never red (Aarti); redesign every region, not only the hero.
**Tags:** `[R#]` Mobbin reference (section 4) · `[REQ id]` · `[BRIEF §]` · `[S01..S05]` strategy docs · `[DS]` dataset-spec · `[T4]` cross-role audit · `[INFER]` my judgement · `[PENDING-ROMIT]`.
**Mockups:** `mockups/admin-A.html`, `admin-B.html`, `admin-C.html`, `student-home.html`, `reviewer-approvals.html`, `director-readiness.html`; 1440 px full-page renders in `mockups/shots/*-1440.png`. Open the HTML directly; no build step.

---

## 0. What this proposes in one paragraph

Every landing page gets the same five-band skeleton (header, hero band, KPI strip, insight row, work area) on a 12-column grid, so a coordinator who learns one page can read all of them. Each landing leads with one hero number that answers the role's first question, in a sentence that names the cause and links to the people behind it [S05 §4; R4, R28]. Charts come before lists, and every chart ships with a visible text summary and a "Show as table" fallback [BRIEF §6]. For the admin landing I give three directions: **A, brief and worklist** (recommended), **B, cohort lens** (the report is the launch page), **C, triage** (one question at a time).

---

## 1. Page layout system

### 1.1 Bands, top to bottom

```
+--------------------------------------------------------------------------------+
| UTILITY BAR 48px  [=] [P] Clinical Education v | Home      [Program v][Search ][AR]|
+-----------+--------------------------------------------------------------------+
| RAIL 240  |  PAGE HEADER   H1 serif 30px + one purpose line   [Sample][seg][1 primary]
|  Home     |--------------------------------------------------------------------|
|  Skills   |  HERO BAND  [icon tile 56] BIG NUMBER (48) + "of N noun"            |
|  Approvals|             one sentence: who, what, cause     [mini viz / unit chart]|
|  Attain.  |             [one outline button]  [secondary link]                   |
|           |--------------------------------------------------------------------|
|           |  KPI STRIP (flat, max 4)  value + "of N" + sparkline + one fact      |
|           |--------------------------------------------------------------------|
|           |  INSIGHT ROW   chart card (7 col)          | chart card (5 col)       |
|           |  title = the question; summary; legend; chart; Show as table         |
|           |--------------------------------------------------------------------|
|           |  WORK AREA   table / list / worklist (8 col) | SIDE RAIL (4 col)      |
|           |                                              | act-on lists, changes  |
|           |--------------------------------------------------------------------|
|           |  STICKY ACTION BAR (forms and bulk selection only)                  |
+-----------+--------------------------------------------------------------------+
```

| Band | Rule | Why | Ref |
|---|---|---|---|
| Utility bar | Toggle, product switcher, page title, program scope, Search (only because it now indexes students, skills, evaluators), profile with "Switch view". No Demo menu, no second role switcher, no inert Notifications or Help | Three role switchers and a Search that finds only nav rows [T4]; chrome budget [S04 §14] | DS compact shell |
| Page header | Serif H1, one purpose line, at most one filled primary. "Sample data" chip on every prototype page | One primary per surface [S03 §6]; honesty rule [S05 §6] | R4 |
| Hero band | One number per page, 48 px, followed by its denominator in words ("of 123 students"), an icon tile in the state tone, one sentence naming the cause, one outline button that opens the exact list. A small unit chart or glyph row sits on the right when it adds meaning | Pure typography loses storytelling; numbers need n [S05 P4]; insight links to a list whose length equals the number [S05 I-3] | R1, R3, R4, R27, R28 |
| KPI strip | DS `KeyMetrics variant="flat"`, max 4, each cell links, never repeats the hero or a tab count, sparkline only when there are 12 real weekly points | Max four [S04 §4.2]; v2 queue repeated KPI and tab counts [T4] | R3, R9 |
| Insight row | Two chart cards. Card title is the question, not the chart type. Summary sentence, legend inside the card, chart, then "Show as table" | Question-first [S05 P1] | R5, R25 |
| Work area | The list the role acts on: worklist rows, queue table, record groups. Row is the link; one button per card at most | "Open X" outline button on every row is a smell [S04 §5.1; a3-viz-home.png] | R12, R13, R31 |
| Side rail | 4 columns: act-on lists (behind, waiting, what changed). Never a second copy of the main chart | Say it once [BRIEF §5.2] | R1, R20, R22 |
| Sticky actions | Only on forms (evaluator, log flow) and when table rows are selected (visible bar, not hover) | [S04 §4.5] | R12 |

### 1.2 Grid

12 columns, 24 px gutter, page padding 32 px, rail 240 px. Content width at 1440 is 1136 px, which matches the 1144 px the audit measured [T4].

| Viewport | Rail | Content | Column | Hero | KPI strip | Insight row | Work + rail |
|---|---|---|---|---|---|---|---|
| 1440 | 240 expanded | 1136 | ~73 px | full width | 4 across | 7 + 5 | 8 + 4 |
| 1280 | 240 expanded | 976 | ~59 px | full width | 4 across | 7 + 5 | 8 + 4 |
| 1024 | 56 icon rail | 920 (24 px padding) | ~55 px | mini viz drops under sentence | 2 x 2 | stacked 12 + 12 | rail moves under work area |
| 375 | sheet menu | 343 (16 px gutter) | 1 col | number + sentence, mini viz hidden | 2 columns | each chart switches to its table under 600 px [S04 §10] | single column, rail last |

```
1440 / 1280                                 1024                     375
+----+------------------------------+       +--+-------------------+  +-----------+
|rail| hero 12                      |       |ic| hero 12           |  | [=] Home  |
|    | kpi | kpi | kpi | kpi        |       |  | kpi kpi / kpi kpi |  | hero 12   |
|    | chart 7      | chart 5       |       |  | chart 12          |  | kpi | kpi |
|    | work 8       | rail 4        |       |  | chart 12          |  | kpi | kpi |
+----+------------------------------+       |  | work 12, rail 12  |  | table     |
                                            +--+-------------------+  | (chart as |
                                                                       |  table)   |
                                                                       +-----------+
```

No horizontal page scroll at any width; the heat grid and wide tables scroll inside their own panel [S04 §10].

### 1.3 Card anatomy (chart card)

```
+-----------------------------------------------------------+
| Who is behind?                              Open in Attainment |
| Each dot is a student. Position is required skills achieved.   |
| 12 of 123 students are behind. 9 are in Cohort 2027...  <- summary (text alt)
| o On pace   <> Behind the term clock   --- Expected now <- legend inside card
| [ chart ]                                                       |
| > Show as table: the 12 students behind                         |
+-----------------------------------------------------------+
```

DS `Card` as is (no radius or shadow overrides); the chart layer is the vendored `ChartCard` pattern plus `components/v2/viz/*` primitives [S04 §5.3, §5.9].

### 1.4 States every landing must render

| State | Pattern | Example copy |
|---|---|---|
| Loading | Skeleton in final shape: hero line, 4 KPI cells, chart frame with axis, 6 table rows. No spinner | none |
| Empty (new program) | The hero becomes the next setup step, charts hidden, worklist shows setup | "No students yet. Import your cohort to see who is behind." |
| All clear | Hero switches to the success tone and says what is true; chart still renders (all dots on pace) | "Nobody is behind the term clock. 123 students, all on pace." |
| Error | Per card, not per page: what failed, what is kept, Try again. Other cards still render | "Pace could not be calculated. The other figures are current. Try again" |
| Impossible filter | Info banner replaces the chart with the cause | "Cohort 2028 has no required IV therapy skills yet." |

### 1.5 Colour and glyph contract used on every page

| Meaning | Mark | Token |
|---|---|---|
| Magnitude, on pace | neutral slate dot | `--viz-mark` (proposed) |
| Behind, shortfall | amber diamond, never red | `--viz-shortfall` fill + `--status-badge-warning-fg` stroke (proposed fill) |
| Counted / achieved | solid check | `--status-badge-success-*` |
| Waiting (overlay) | hatched, clock glyph | `--status-badge-neutral-*` |
| Returned (overlay) | dotted outline, return arrow | `--status-badge-warning-*` outline |
| Age of a request | 4-step neutral ramp; 15+ adds an amber outline | `--viz-age-1..4` (proposed) |
| Matrix magnitude | pale Prism-hue sequential scale, dark ink in every cell | `--viz-seq-1..5` (proposed) |
| Selected row | `--brand-tint` | DS |
| Primary CTA | `--primary` | DS |

### 1.6 Typography

Serif only in the H1 (`--font-heading`). Hero number 48 px Inter semibold, tabular. Chart labels 12 to 13 px; nothing under 12 px (render check found 0 elements under 12 px on all six pages).

### 1.7 Proposed tokens (not in the DS today)

`--viz-mark`, `--viz-mark-soft`, `--viz-grid`, `--viz-shortfall`, `--viz-age-1..4`, `--viz-seq-1..5`. They are defined once in each mockup's `:root` so the design is reviewable; in code they belong in the vendored viz `tokens.ts` or a DS request (open questions Q-U6, Q-U9 in [S04]). Everything else uses real DS token names and values.

---

## 2. Landing page per role

All numbers come from `dataset-spec.md` and are consistent across the six mockups: 123 students (38 / 43 / 42), 154 skills with 142 configured, 50 required per student, 404 waiting requests (162 / 101 / 89 / 52 by age), 20 evaluations awaiting approval in 14 submissions, 64 returned, 14 unverified evaluators, one stalled site. "Today" is the seed's `DEMO_TODAY` 2026-10-19, week 8 of 16 [DS §2, Q3].

### 2.1 Admin / coordinator Home: three variants

The admin's three questions [task brief; S05 §10.1]: who is behind, which required skill blocks the most students, which sites and evaluators are stale. Plus "what needs me" [S01 §3.1].

#### Variant A: Brief and worklist (`mockups/admin-A.html`) RECOMMENDED

```
+--------------------------------------------------------------------------------+
| Home                                                            [Sample data]  |
| Nursing ADN, all three cohorts. Who is behind, what blocks them, what needs you|
+--------------------------------------------------------------------------------+
| [user-clock]  12 of 123 students are behind the term clock      2027 <><><><><>|
|               9 in 2027, all short in IV therapy. 3 in 2028.    2028 <><><>    |
|               [View the 12]  Behind = below term share - 8      2026 none      |
+--------------------------------------------------------------------------------+
| Required achieved 58%  | Waiting 404        | Awaiting approval 20 | Configured |
| 3,583 of 6,150  ~~~    | 52 at 15+ days ~~~ | 2 older than 10  ~~~ | 142 of 154 |
+--------------------------------------+-----------------------------------------+
| WHO IS BEHIND?                       | WHICH REQUIRED SKILL BLOCKS THE MOST?   |
| 2026  .................(31)(7) |96%  | Hangs PB Med            ------<> 31     |
| 2027  <> <><><><> <> |60% ::::::::   | Rate Calculation: Device ----o 26      |
|       [9 behind, all IV therapy]     | INT Flush               ---o 22         |
| 2028  <><> <> |30% ::::::::::        | ... top 8 of 50 ............ [All 50]   |
| 0%    25%    50%    75%    100%      | > Show as table                         |
+--------------------------------------+-----------------------------------------+
| WHICH SITES AND EVALUATORS ARE STALE?| NEEDS YOU (5, oldest first)             |
| Seaside Regional, 4 West  [######] 14| (clock) 2 approvals > 10 days: Amara N. |
| Harbor Point Medical, ED  [..##] 11  | (half) 12 skills need config [Configure]|
| Lakeview LTC              [.##]  8   | (person) 3 evaluator names to adopt     |
| Mercy Clinic / Bayside    [...#] 12  | (warn) 6 required skills, no course     |
| Other 115 sites: 347, 31 at 15+      | (warn) 7 graduating one skill short     |
| [Unverified] 3 evaluators, 8+ days   |                                         |
+--------------------------------------+-----------------------------------------+
```

**Hero metric:** 12 of 123 students behind the term clock (answers question 1 before any scroll).

| Region | Question | Chart / number | Data source | Link target |
|---|---|---|---|---|
| Hero | Who is behind? | 12 of 123 + unit glyph row by cohort | `paceRows` behind flag [S05 §4.1] | Attainment, Students view filtered `behind=true` (12 rows) |
| KPI 1 | How far is the program overall? | 58%, 3,583 of 6,150 student-skill records, sparkline | `progressMatrix` summary | Attainment, Students |
| KPI 2 | How much evidence is stuck with evaluators? | 404 requests, 52 at 15+ days | `evidenceStatusCounts.waiting`, `ageDays` | Approvals, Stalled tab |
| KPI 3 | What waits for approval? | 20 evaluations, 14 submissions | `queueItems` | Approvals |
| KPI 4 | Is setup finished? | 142 of 154 configured | library counters | Skills, filter Needs configuration |
| Insight 1 | Who is behind, and how far? | Pace dot strip, one lane per cohort, expected marker, amber diamonds; the 31 complete graduating students collapse into a count pill instead of 31 stacked dots | `paceRows` per cohort | dot opens Student record; card link to Attainment |
| Insight 2 | Which required skill blocks most? | Ranked dot plot, top 8 of 50 by students short where the skill is expected now | NEW `blockerRank` over `progressMatrix` [INFER] | Skill drill-down in Attainment, Skills view |
| Work 1 | Which sites and evaluators are stale? | Aging stack for the 5 sites with the oldest requests; "Other 115 sites" as a sentence so it cannot flatten the scale; unverified evaluator row | NEW `siteAging` (requests by `siteId` x age bucket) [DS §3.5 adds `siteId`] | Site page; evaluator directory with adopt / merge |
| Work 2 | What needs me? | Worklist, 5 rows, glyph + sentence + one link; one outline button (Configure next skill) | home `needsAttention` reworked to link the exact record [T4 P2-3] | exact record per row |

States: loading (skeleton in this exact layout), empty program (hero becomes "Import your skills" step and charts are hidden), all clear (hero "Nobody is behind", pace strip still drawn), error per card.
Removed vs v2 Home (`a3-viz-home.png`): the plain "In use 12 of 31" bar (progress bar for attainment, [S05 P3]); one stacked bar per skill in brown, blue, green (154 bars at scale, similar lightness); "X, Y, Z and 12 more" text lists; an outline button on every row; the separate Set up and Cohort sections that restated the same counts. Each v2 row still has a home: setup counts in KPI 4 and the worklist, behind students in the hero and strip.
Refs: R1 (hero + student list + insight link "View 2 students"), R3 (big number with "% of all shifts" denominator), R4 (sentence hero), R2 (status bucket rows each with View), R9 (stage counts), R18 and R19 (age on every row).

#### Variant B: Cohort lens, report as launch page (`mockups/admin-B.html`)

```
+--------------------------------------------------------------------------------+
| Home                                         [Sample data] [Required|All skills]|
+--------------------------------------------------------------------------------+
| [target]  38% of IV therapy achieved in Cohort 2027, against 60% expected now  |
|           IV therapy holds the largest gap. It is why 9 of the 12 are behind.  |
+--------------------------------------------------+-----------------------------+
| WHERE IS EACH COHORT SHORT?                      | STUDENTS BEHIND  12 of 123  |
| Section (req)        2026 38   2027 43   2028 42 | <> Amara Nwosu   2027  15%  |
| Basic Skills 14      100  96   81  75    54  50  | <> Noah Whitfield 2027 22%  |
| Safety 12             99  96   74  70    47  45  | ... 12 rows                 |
| Oxygenation 3         98  96   58  55   [14 /!25]|-----------------------------|
|   IV therapy 6        97  96  [38 /!60]  not yet | NEEDS YOU                   |
| All required 50   31 of 38    58%       28%      | 2 approvals > 10 days       |
+--------------------------------------------------+ 12 skills need config       |
| WHERE ARE REQUESTS STUCK?  3 stale sites, aging  | 3 names to adopt            |
+--------------------------------------------------+-----------------------------+
```

**Hero metric:** 38% of required IV therapy achieved in Cohort 2027 against 60% expected.
Main canvas is the aggregated section x cohort grid (10 sections plus the IV therapy group, 3 cohorts = 33 cells, not 123 x 154) [S05 P2]. Each cell shows achieved % in a pale Prism-hue scale with the expected value as a small number; cells 8+ points under expected get an amber outline and triangle with the expected value. The rail carries the 12 behind students and the worklist.

| Region | Question | Chart / number | Data source | Link |
|---|---|---|---|---|
| Hero | Where is the biggest gap? | 38% vs 60% | `heatmap` at section x cohort grain | Attainment, Students view, Cohort 2027, section IV therapy |
| Grid | Where is each cohort short? | Section x cohort matrix with expected | `heatmap` aggregated + expected-by-section table [INFER: expected per section is new] | Cell opens the students of that cohort short in that section |
| Stuck | Where are requests stuck? | Aging stack, 3 stale sites | `siteAging` | Site page |
| Rail 1 | Who is behind? | 12 named rows, diamond + cohort + where short + % | `paceRows` | Student record |
| Rail 2 | What needs me? | 3 links | as A | as A |

Trade-offs: strongest "where" answer and the closest to Aarti's "make my report my launch page" [CALL Oct 8; OD-29 open, not decided]; but the "which skill" answer is one level down (section, not skill), the matrix is a new component to build, and expected-per-section is a new concept that needs SME confirmation. Removed vs v2: same as A, plus the KPI strip (the grid's bottom row carries the cohort totals).
Refs: R36 (single-hue matrix with values in every cell, rows and values switch), R35 (skill-set rows with % cells), R1 (student list in a rail), R25 (n of N per category); anti-refs R38 (zeros everywhere, unreadable) and R10 (donut wall above a table).

#### Variant C: Triage, one question at a time (`mockups/admin-C.html`)

```
+----------------------------+---------------------------------------------------+
| QUESTIONS                  | [user-clock] 12 of 123 students behind            |
| [*] Who is behind?   12 ~~ |  9 in 2027, IV therapy; 3 stuck at Seaside   [Open the 12 in Attainment]
|     Which skill blocks? 31 |---------------------------------------------------|
|     Which sites stale?  52 | WHERE THEY SIT AGAINST THE BAR  (pace strip)      |
|     What waits approval?20 |---------------------------------------------------|
|     What is not set up? 12 | THE 12, FURTHEST BEHIND FIRST (table with request)|
+----------------------------+---------------------------------------------------+
```

**Hero metric:** whichever question is selected (default: 12 behind).
Left: five question cards, each with icon, hero number, unit, cause line and a 12-week sparkline; selected card uses `--brand-tint`. Right: the selected question answered in full (hero, chart, table with each student's waiting request). This is the Vercel Speed Insights model [R5] and an inbox model [R17].
Trade-offs: deepest single answer and the cleanest scan; but two of the three admin questions are hidden behind a click, the page changes shape per question (harder to learn), and the five question cards are effectively a second nav, which works against "fewer rows" [LEDGER D-A].
Removed vs v2: everything A removes; KPI strip replaced by the question list.
Refs: R5 (metric list plus detail), R17 (list and detail), R8 (left stage filter with counts), R7 (peek without losing the list).

#### Comparison and recommendation

| Criterion | A Brief + worklist | B Cohort lens | C Triage |
|---|---|---|---|
| Answers all 3 admin questions above or near the fold | Yes, all 3 plus "needs you" | Where yes, who yes, which skill one level down | 1 of 3, the rest one click away |
| Scales to 123 x 154 | Yes (aggregated strip, top 8, top 5 + other) | Yes (33 cells) | Yes |
| Build cost on existing viz primitives | Low: `DotStrip`, ranked dots, `StackedBar` exist [S05 §3] | Medium: new matrix + expected-by-section data | Medium: new master-detail shell |
| Learnability across roles | Same bands as reviewer and director pages | Unique layout | Unique layout |
| Risk | Dense for a first-time admin | Treats OD-29 as decided if shipped as the only home | Hides answers; feels like a second nav |

**Recommendation: A.** It is the only variant that answers who, which skill and which site without a click, it uses the same five bands as the reviewer and director pages, and it is the cheapest to build from primitives that already exist. Take B's section x cohort grid as the default view of **Attainment** (one click from A's pace card), so the "report as launch page" idea is available without deciding OD-29. Keep C's question list as the 1024 and 375 adaptation of A, where two columns do not fit.

### 2.2 Student Home (`mockups/student-home.html`)

```
+--------------------------------------------------------------------------------+
| Home   Maya Ferreira, Cohort 2027. NURS 350, Fall 2026.   [Sample][NURS 350|All]|
+--------------------------------------------------------------------------------+
| [target] 6 of 12 required sign-offs counted        [###][##/][#r.][/..]        |
|          2 waiting, 1 came back to fix. On pace:     Vital Cath  Oral Gluc      |
|          6 were expected by now.                     legend: counted waiting.. |
+----------------------------------------------+---------------------------------+
| [Do this next] Returned Oct 16 by L. Haddad  | AM I ON PACE?  burn-up, today   |
| Fix and send Oral medication administration  | counted vs expected, waiting    |
| "Add the medication name and route."         | dashed                          |
| [Fix and send again]                         |---------------------------------|
|----------------------------------------------| WAITING ON OTHERS (2)           |
| MANDATORY IN NURS 350  4 skills, 12 sign-offs| J. Delgado, RN  catheter  4 days|
| Vital signs ...        (v)(v)(v)  Achieved   | Program approval glucose 3 days |
| Catheter insertion     (v)(v)(/)  In progress| Resend or change evaluator      |
| Oral medication        (v)(r)( )  Returned   |---------------------------------|
| Blood glucose          (/)( )( )  In progress| WHAT CHANGED FOR YOU            |
|----------------------------------------------| S. Okonkwo signed Vital signs.. |
| NOT MANDATORY  3 skills, likely here         | L. Haddad returned Oral meds    |
+----------------------------------------------+---------------------------------+
```

**Hero metric:** 6 of 12 required sign-offs counted, with a 12-square waffle grouped by skill (counted solid, waiting hatched, returned dotted, to do outline) [S05 C3].

| Region | Question | Chart / number | Data source | Link |
|---|---|---|---|---|
| Hero | How far am I? | 6 of 12 + waffle | `mandatoryWaffle` | each square opens its skill |
| Do this next | What do I do now? | One card, one filled button; returned beats waiting beats one-away (N-05, N-04, N-01) [S03 §7] | `nextAction` | revise form, prefilled, same submission [REQ RV-01] |
| Mandatory list | What is left per skill? | Segmented dots + state pill + one cause line with a person and an age | `skillProgress` | skill record |
| Not mandatory | What else is likely here? | Rows, soft-mapped, all reachable [REQ CM-05] | mapping | skill record |
| Pace | Am I on pace? | Burn-up: counted line, expected dashed, waiting extension | `paceSeries` | Record |
| Waiting | Who holds my evidence? | 2 rows with age chips | submissions `with-evaluator`, `awaiting-approval` | resend or change evaluator [REQ RV-04] |
| What changed | What did others do? (H3, H5, H6) | 3 lines with glyph and date | handoff feed [S03 §3] | skill card |

States: offline (warning banner only while offline, entries show Queued) [S03 §6]; nothing mapped ("No skills are mapped to NURS 350 yet. Every skill in your program is still open in Log."); all achieved (hero success "12 of 12 counted. NURS 350 is complete." and the next-action card offers the Record share step if verification is kept); error (per card).
Removed vs v2: the sync conflict stated three times above the fold [T4 #11]; "What is counted, waiting and left" subheading; the blue squares (Q-U6); the info banner for a skill that is not open (a disabled row with "Not open yet" says it once) [REQ IM-09]; the 720 px phone column in a desktop shell [T4 screenshots], now an 8 + 4 layout that stacks at 375.
Refs: R22 (one "continue" hero card with one button plus a checklist rail), R23 (one task card plus quests rail; leagues rejected, no league tables [S05 §6]), R20 (ordered list with per-row action and "5 of 61" in a rail), R21 (weekly target as glyphs, not a bar), R24 (continue first), R29 ("2 tasks remaining").
Open: web-first versus phone-first is still PENDING-ROMIT [LEDGER Q2]; this layout is designed so the 375 stack is complete (hero, next action, list, then rail).

### 2.3 Reviewer: Approvals (`mockups/reviewer-approvals.html`)

```
+--------------------------------------------------------------------------------+
| Approvals  Evaluations held before they count.                  [Sample data]  |
+--------------------------------------------------------------------------------+
| [inbox] 20 evaluations in 14 submissions wait for you                           |
|         2 waited > 10 days. 5 of 14 from T. Brandt, RN (3.5x average)           |
|         [Start with the oldest]  Show T. Brandt's 5                             |
+--------------------------------------+-----------------------------------------+
| HOW LONG HAVE THEY WAITED?           | IS ONE EVALUATOR AN OUTLIER?            |
| [3][2][2][1] [7][6][5][5][4] [14][12][9][9][8]  None | ::::::|:::  .   <>Brandt |
| 0-3: 4      4-7: 5      8-14: 5   15+: 0        | avg 4.8%    <>Vance          |
+--------------------------------------+-----------------------------------------+
| Awaiting approval (14) | Stalled requests (141) | Returned (64)                 |
| [Held because][Evaluator][Unverified][8+ days]  14, oldest first [Approve sel.] |
| [] Student | Skills (n) | Evaluator [Unverified][3.5x] | Held because | Answers | Waiting | Review |
+--------------------------------------------------------------------------------+
```

**Hero metric:** 20 evaluations in 14 submissions wait for you.

| Region | Question | Chart / number | Data source | Link |
|---|---|---|---|---|
| Hero | How much is waiting, and is anything unusual? | 20 in 14, oldest, outlier share | `queueItems`, `raterRows` | queue sorted oldest; filter by evaluator |
| Aging units | How long have they waited? | Unit histogram: each square is a submission labelled with its days, 4 buckets including an explicit empty 15+ bucket; Brandt's squares outlined amber | `queueItems.ageDays` | square opens the submission |
| Outlier strip | Is one evaluator an outlier? | Beeswarm of returned-or-did-not-meet rate for 98 evaluators with n of 30 or more, average line, two labelled amber diamonds | `raterRows` with the n floor [S05 §6] | evaluator's submissions |
| Tabs | Which list am I in? | Awaiting approval / Stalled requests / Returned with counts once, not repeated in a KPI | queue, `stalled`, returned | tab |
| Queue table | Why is each one here? | Held because, self vs evaluator agreement (word + glyph), age, unverified chip | `queueItems` + `pendingReasons` [S03 H4] | student record, evaluator, submission |

States: empty ("Nothing waits for approval. Approval applies only to skills that require it." with a link to those skills) [S03 §4.3]; bulk approve with blockers (list blocked rows before confirm); all clear (hero success tone, aging chart hidden, tabs stay); error per card.
Removed vs v2 (`reviewer-queue.jpg`): four KPI cards that repeated the tab counts with empty space below [T4 P2-7, S04 §4.2]; signal-bar age icons (the number carries it, bold at 8+); the clipped Status column (status is now the "Held because" sentence, never the column that clips); "Add filter" dashed button replaced with named filter chips.
Refs: R13 (To review / Changes requested / Approved tabs, one Review per row), R12 (section count, bulk approve all), R14 (who holds it: "Next approver"), R16 (sentence rows, PR analogy [S03 §4.3]), R18 and R19 (age on every row, age bands), R15 (pending your approval vs all).
Data note: dataset-spec's outlier "3.5x the returned rate" gives about 1 return on 48 evaluations at the 0.7% population rate, which is not drawable. The strip therefore uses returned **or** did not meet criteria (424 of 8,879 = 4.8%): Brandt 8 of 48 = 16.7% (3.5x), Vance 6 of 41 = 14.6% (3x). Flag for Romit (section 6).

### 2.4 Director: Verification / readiness (`mockups/director-readiness.html`)

```
+--------------------------------------------------------------------------------+
| Verification  Cohort 2026, graduating.           [Sample data] [2026|2027|2028]|
+--------------------------------------------------------------------------------+
| [grad cap] 31 of 38 graduating students have met every required skill          |
|            7 are one skill short, all the same one: Hangs PB Med. 3 have a     |
|            request waiting.                                                     |
|   28 ready to verify                       3 pending   7 one skill short       |
|   [##########################]             [///]       <><><><><><><>           |
+--------------------------------------------------+-----------------------------+
| WHAT STOPS THE 7?                                | OTHER COHORTS  Attainment   |
| Hangs PB Med (IV therapy) | 7 | 3 waiting | Open | 2027  9 behind, IV   58%    |
| No other required skill blocks a graduate.       | 2028  3 behind       28%    |
+--------------------------------------------------+-----------------------------+
| RECORDS, grouped by what you can do next                                       |
| [Ready to verify] 28  | [Met, evidence pending] 3 | [One skill short] 7 | [Changed since verified] 0 |
+--------------------------------------------------------------------------------+
```

**Hero metric:** 31 of 38 graduating students have met every required skill, drawn as a 38-unit chart in three groups (28 ready, 3 met with evidence pending, 7 one short).

| Region | Question | Chart / number | Data source | Link |
|---|---|---|---|---|
| Hero | Is the graduating cohort ready? | 31 of 38 + unit chart | `verificationRows`, `pendingReasons` | group anchors below |
| Blockers | What blocks the rest? | Required skill x students blocked x requests waiting | graduating blockers [S05 §4.1] | the 7 students; the skill |
| Other cohorts | Anything else I should know? | 2 rows | `paceRows` | Attainment |
| Records | Which records need me, in order? | Groups: Ready, Pending, One short, Changed since verified; "Review record" per row, verify happens on the record [S01 §4.1] | `verificationRows` | Student record |

States: nothing ready ("No graduating record is ready yet. 7 are one skill short." and the unit chart still shows the split); changed since verified moves to the top when it is non-zero [S03 §4.4]; all verified (success tone, groups collapse to "Verified 38"); error per card.
Removed vs v2 (`director-records.jpg`): one "Has unmet mandatory skills (12)" group with no priority [T4 P1-4]; a progress bar per student; a verify action reachable on incomplete records from the list (Q3 stays open; this layout does not decide it, it only puts verify on the record page).
Refs: R26 (readiness scale plus key issues, warnings versus blocking chips), R27 ("not ready" count plus "take action on the users below"), R28 (hero pass count, then grouped table with a reason column), R25 (n of N per group). Anti-ref R30 (a gauge for readiness).
Scope note: director and verification are v2 proposals, not REQ [BRIEF §1; LEDGER Q3]. The page is designed so that, if verification is dropped, the same layout becomes the Attainment "Graduating cohort" view.

### 2.5 Preceptor / evaluator page (no dashboard, a form)

Not a landing page and not mocked here; specified so the dots connect [S03 §4.2].

```
+------------------------------------------------------------+
| Prism  Secure evaluation link, no account needed           |   light header, no rail,
+------------------------------------------------------------+   no switchers, no search
|        (820 px centred column)                             |
|  Maya F., NURS 350, Seaside Regional 4 West     [Maya][Priya]  <- student chips if several
|  Requested Oct 15. Her self-rating is shown under each skill. |
|  ---------------------------------------------------------- |
|  1 of 2  Indwelling urinary catheter insertion              |
|  What you are judging: <rule-free checklist the program set> |
|  Outcome  ( ) Met   ( ) Unmet          Level [v] if configured|
|  Feedback (required by this program)  [..............]      |
|  ---------------------------------------------------------- |
|  2 of 2  ...                                                 |
+------------------------------------------------------------+
| [sticky] 1 of 2 complete. Feedback missing on skill 2  [Submit evaluation] |
+------------------------------------------------------------+
RECEIPT: "Counted now" or "Held for program approval"  [Next: Priya S., 2 skills]
```

| Element | Rule | Source |
|---|---|---|
| Hero | None. No chart, no student progress, no cohort context | bias and load [S05 §2]; [REQ AE-02] |
| Header | Light header only, program name, "no account needed" said once | [REQ EV-01]; [T4 P1-3] |
| Body | One sitting, several skills, each with its own outcome and feedback | [REQ EV-05, EV-06] |
| Submit | Sticky bar with an error summary that links to the field | [S04 §4.5] |
| After | Receipt states whether it counts now, plus Next request; no dead end | [REQ EV-07]; [T4 handoff 4] |
| States | Invalid or expired link: one neutral message; already submitted is the only distinct one | [S03 §4.2] |

Refs: R43 (icon plus "0 of 3 done" summary above sections), R22 (one primary action), R29 ("2 tasks remaining").

---

## 3. Why this beats v2

| v2 today (evidence) | Proposal | Why it is better | Rule / ref |
|---|---|---|---|
| Admin Home opens with a plain "In use 12 of 31" progress bar and stacked bars per skill (`a3-viz-home.png`) | Hero "12 of 123 behind" + pace dot strip + ranked blocker dots | Distribution and outliers visible; works at 154 skills | [S05 P3]; memory progress-bars-last-resort; R1, R3 |
| 9 text rows of "X, Y, Z and 12 more", an outline button on every row, 410 words [T4] | 5 worklist rows, each a sentence that links the exact record, one button | Say it once; rows link to the record, not the list | [BRIEF §5.2-5.3]; [T4 P2-3]; R2, R12 |
| No answer to "which site or evaluator is stale" on any page | Aging stack by site, top 5 + other sentence, unverified evaluator row | Arc 1 and arc 8 become visible | [DS §5]; R18, R19 |
| Reviewer queue: 4 KPI cards repeating tab counts, empty space, Status column clipped (`reviewer-queue.jpg`) | Hero + aging unit chart + outlier strip; counts live in tabs; "Held because" column | Each number once; cause visible; outlier seen, not read | [S04 §4.2]; [T4 P2-7]; R13, R16 |
| Student Home leads with a sync conflict stated three times; "what is left" below the fold (`student-home.jpg`) | Hero waffle "6 of 12", one next-action card, list with causes | First glance answers SH-04 | [REQ SH-04]; [T4 #11]; R22, R23 |
| Student never told an evaluation counted, was approved or returned [T4 P0-1] | "What changed for you" rail and "Waiting on others" with names and ages | Receiver-side cue for H3, H5, H6 | [S03 §3]; [LEDGER D-C] |
| Director sees 12 of 12 in one "unmet" group [T4 P1-4] | 38-unit chart, blocker table, records grouped by next action | Priority order; blocker named | [S03 §4.4]; R26, R28 |
| Three different layouts per role, chrome with Demo menu and role switcher on every page [T4] | One five-band system, 12-column grid, chrome budget per shell | Learn once, read everywhere | [S04 §3, §14] |
| Charts without a text summary or table on several pages | Summary sentence and "Show as table" on every chart | WCAG and honesty | [BRIEF §6]; [S05 §8] |
| State colour in saturated blue and brown, red count chip | Amber diamond for behind, neutral for magnitude, status tokens for state | Aarti no-red; brand never means good or bad | [S04 §7.2-7.3]; memory aarti-no-red |
| 7 to 12 student demo hides scale [LEDGER D-D] | Every figure at 123 students, 154 skills, 404 waiting | Designs survive the real dataset | [DS §2] |

---

## 4. Mobbin references (all viewed; web platform)

Cohort and progress dashboards
- R1 SchoolAI, class session: https://mobbin.com/screens/00828d09-252c-4d02-92a1-58966ebbe19d . Teaches: hero mastery score, student list with outcome dots, insight rail whose claims link to the students ("View 2 students"). Do not copy: the gauge, AI-written prose about each student.
- R2 15Five, objectives status: https://mobbin.com/screens/931f1477-18c1-49c4-be77-2d5ca57eac45 . Teaches: status rows (on track, behind, at risk) each with a figure and a View link. Do not copy: weekly 100% stacked bars, red for at risk.
- R3 Deputy, attendance: https://mobbin.com/screens/a94b862d-1c9d-4cdf-b7a5-299fa1144bdd . Teaches: three large numbers each with "x% of all shifts", the denominator under every number. Do not copy: red deltas, a 3-point line chart.
- R4 Asana, portfolio progress: https://mobbin.com/screens/5c8ffa18-4e11-4bf9-b3ba-0733c10f99b2 . Teaches: a hero sentence ("This portfolio is on track") above four counts. Do not copy: AI summary card.
- R5 Vercel, Speed Insights: https://mobbin.com/screens/7ecc2280-d362-4eb8-9810-9fe1b8ce252e . Teaches: metric list on the left, selected metric in detail, threshold lines, bucketed columns. Do not copy: red and green semantics.
- R6 Charma, coaching summary: https://mobbin.com/screens/8cff7fde-4b59-4cee-8087-4f3eae991f5b . Teaches: grouped column headers in a people table. Do not copy: a wall of raw counts with no visual.
- R7 Remote, onboarding with side sheet: https://mobbin.com/screens/20465b91-4ab1-4d34-8b86-5a00b1a0eb7a . Teaches: peek one person's steps without leaving the list. Do not copy: progress bar in the sheet.
- R8 Workable, onboarding: https://mobbin.com/screens/a9e0a0c8-4dfa-4cde-adf9-efda32ae719e . Teaches: left stage filter with counts. Do not copy: progress underline per card.
- R9 Deel, home tracker: https://mobbin.com/screens/fb197e1a-8fc1-4c06-8ef3-8d143084834b . Teaches: stage counts as a compact grid. Do not copy: promotional cards on a work home.
- R10 Deel, assignments (anti): https://mobbin.com/screens/8fcd1acc-25fd-4d6e-8273-1eac2afe2922 . Shows what to avoid: four donuts of zeros above the table. Keeps: "Total n" above the table.
- R11 Employment Hero, onboarding widget (anti): https://mobbin.com/screens/dc7f2bfe-5298-40be-955b-6cfff6908357 . Avoid: progress bar per person plus a donut for 3 people.

Approvals and inbox
- R12 Deel, action required: https://mobbin.com/screens/ebede796-0ca0-408a-bf05-630420732e1f . Teaches: count on the section, bulk approve in an Actions menu. Do not copy: icon-only approve and deny on every row.
- R13 ClickUp, timesheet approvals: https://mobbin.com/screens/72d64728-a1bb-4767-929c-fe34a6907c80 . Teaches: To review / Changes requested / Approved tabs, one Review entry per row.
- R14 Aboard, approvals: https://mobbin.com/screens/2d7a7bf0-9c57-4f9f-8919-354d044f7660 . Teaches: "Next approver" column and "Awaiting approval from" filter, i.e. who holds it.
- R15 Airwallex, spend requests: https://mobbin.com/screens/64cb7251-edd5-4bfa-ad69-8f89182ffafa . Teaches: "pending your approval" versus "all in approval".
- R16 StackAI, pull requests: https://mobbin.com/screens/3ee3b3f3-ee96-480d-bb21-17369bed1b03 . Teaches: sentence rows ("X wants to publish Y"). Do not copy: Rejected as a tab name (we say Returned).
- R17 Plane, inbox: https://mobbin.com/screens/849ec3f0-a1f0-4699-85eb-f895f7330036 . Teaches: list plus detail.
- R18 Front, inbox: https://mobbin.com/screens/a25fd5f3-a74a-4abc-b5f5-11b38cb684fa . Teaches: age on every row; Open / Later / Done.
- R19 Superhuman, mail: https://mobbin.com/screens/cc4d247f-4d87-4c36-9067-0996032194ca . Teaches: rows grouped by age band.

Personal progress home
- R20 Babbel, learning plan: https://mobbin.com/screens/a422a982-e18c-4b0a-9827-3edf3ddad400 . Teaches: ordered list with a per-row action, "5/61 completed" in a rail.
- R21 Codecademy, dashboard: https://mobbin.com/screens/1c9ca0fe-bb9a-4753-b41d-c4ef4f3a375c . Teaches: weekly target as day glyphs, progress by subject on a shared axis. Do not copy: XP points.
- R22 Uxcel, home: https://mobbin.com/screens/68933767-f763-41a5-94ed-967cadaac831 . Teaches: one "continue" card with one button, a getting-started checklist in the rail. Do not copy: upsell cards.
- R23 Duolingo, practice: https://mobbin.com/screens/990e202e-248a-4e84-b44c-ce7d71107b04 . Teaches: single hero task, quests rail. Do not copy: leagues and rankings.
- R24 Coursera, home: https://mobbin.com/screens/18683325-d982-4756-b06e-4ed52c933b06 . Teaches: "Continue learning" first, weekly goal tracker.

Readiness and compliance
- R25 Vanta, controls: https://mobbin.com/screens/ecd5d521-293f-4c90-a0bc-508b74813cc3 . Teaches: "n of N" per category with a definition tooltip. Do not copy: progress bar per card.
- R26 Base44, store readiness: https://mobbin.com/screens/89946769-4d5e-4396-8667-e4523690e0ce . Teaches: readiness scale, key issues list, warning versus blocking chips that look different. Do not copy: red banner.
- R27 Snowflake, trust center: https://mobbin.com/screens/c04490cc-bbb7-432b-b656-ae5f279852d0 . Teaches: "1 not ready" plus "take action on the users below".
- R28 Adaline, evaluation results: https://mobbin.com/screens/bc283f1b-d003-4ec8-950c-942a1aff9ac7 . Teaches: hero pass rate with passed / failed / unknown / total, then a table with a Reason column.
- R29 Remote, contractor checklist: https://mobbin.com/screens/42074683-8843-4220-8a92-d33c9c73ed4b . Teaches: "2 tasks remaining" as the headline.
- R30 Okta, dashboard (anti): https://mobbin.com/screens/72c7a956-c9ec-45ef-872e-c3ec74d672df . Avoid: a gauge for "10 of 18". Keeps: a task table with View.

Data-dense tables and saved views
- R31 Deel, people: https://mobbin.com/screens/5e01459c-5eb8-4a68-80be-ae6cbbc32f21 . Teaches: total count, filter dropdowns, "View as report", two-line person cell.
- R32 Aboard, people: https://mobbin.com/screens/177af199-1ac2-444d-8494-fc41d4268ad8 . Teaches: saved views with counts, removable filter chips, Save view.
- R33 Apollo, people: https://mobbin.com/screens/a9e82d07-16e2-48de-89f4-91d036a60dac . Teaches: saved-view menu, Save as new view, record count.
- R34 Dovetail, contacts: https://mobbin.com/screens/832e5719-7133-4733-a7d2-87061364df60 . Teaches: column chooser. Do not copy: coloured tag soup.

People x requirements matrices
- R35 Codecademy, skills tracking: https://mobbin.com/screens/41d3d178-1703-47b1-820d-b5c5348118a6 . Teaches: skill-set rows with a % in each cell, level scale with a "You" marker.
- R36 Profound, matrix view: https://mobbin.com/screens/58b40c44-7fe9-4085-9340-aa12d196c8a1 . Teaches: one-hue sequential matrix with a value in every cell; rows and values switch, i.e. aggregate grain.
- R37 15Five, competency results: https://mobbin.com/screens/e99a8704-df37-4c4b-8047-fb770aaf5b47 . Teaches: competency by level grid. Do not copy: a mostly empty grid.
- R38 Intercom, hourly heatmap (anti): https://mobbin.com/screens/472677b1-f3df-4e12-b38b-fa492a3348be . Avoid: zeros printed in every cell at low contrast.

Record detail with timeline and tabs (for the Student record and Submission pages these landings link to)
- R39 Attio, company record: https://mobbin.com/screens/297adfeb-8312-496b-8acf-41839a6cf775 . Teaches: tabs with counts, timeline grouped by period with expandable changes, details rail.
- R40 Calendly, contact: https://mobbin.com/screens/1550336d-24c8-42f6-9403-94bfdb342316 . Teaches: date-grouped timeline plus details rail.
- R41 Customer.io, person: https://mobbin.com/screens/a8cabaf8-cf6f-4331-9e8b-98523d4b1776 . Teaches: fact row (status, last activity) above the tabs.
- R42 Zoho CRM, timeline: https://mobbin.com/screens/e1a5b857-6011-49b4-87a8-5e8f0ae53cf2 . Teaches: dated nodes on a vertical timeline.
- R43 Aboard, onboarding person: https://mobbin.com/screens/4f90f332-e4d8-4201-b341-da664b1fdfe8 . Teaches: icon plus "0 of 3 done" summary strip above sections.

---

## 5. Data used in the mockups

| Figure | Value | Source |
|---|---|---|
| Students | 123 (38 / 43 / 42) | [DS §2] |
| Behind pace | 12: 9 in 2027 (IV therapy), 3 in 2028 incl. 1 Accelerated track | [DS §4.2] |
| Graduating | 31 of 38 complete (28 ready, 3 pending), 7 one short on Hangs PB Med, 3 with a request | [DS arc 2, §3.9] |
| Required per student | 50; program 3,583 of 6,150 = 58% (weighted 2027 58%, 2028 28%) | [DS §4.1] |
| Waiting | 404: 162 / 101 / 89 / 52; Seaside Regional 4 West 14 at 15+; 120 sites | [DS §4.6, §4.9] |
| Approvals | 20 evaluations, 14 submissions, ages 1 to 14, 5 from one outlier, 2 over 10 days, 1 with 3 of 8 answers different | [DS arc 3] |
| Unverified evaluators | 14; 3 with 8+ day requests; "Jon Delgado, RN" may be J. Delgado | [DS arc 8] |
| Skills | 154, 142 configured, 12 not | [DS arc 5] |
| Maya | 6 of 12 in NURS 350, on pace (6 expected at week 8) | [DS §3.3] |
| Names of sites, generated people, T. Brandt, K. Vance | fictional | [DS §3.4] |

---

## 6. Open questions and conflicts found (for Romit)

1. **Dataset conflict, graduating cohort.** Arc 2 (31 complete + 7 one short = 38) cannot coexist with arc 9 (4 students missing 4 or more) or with "Cohort 2026 mean 92%, range 66 to 100" [DS §4.1, §5; also S05 Q1]. The mockups follow arc 2, so 2026 shows no one behind. Decide which holds.
2. **Outlier metric.** 3.5x of a 0.7% return rate on 48 evaluations is about one return, which cannot be drawn honestly. Mockups use returned or did-not-meet (4.8% average). Confirm the metric and the n floor (30 proposed, dataset uses 40) [S05 Q3].
3. **Expected per section** (variant B) is a new concept; the pace line itself is a v2 assumption [S05 Q5].
4. **Admin recommendation A**, with B's grid inside Attainment. OD-29 (report as launch page) stays open.
5. **Nav count chip**: mockups use a neutral dark chip instead of the DS red `BadgeCount` [S04 Q-U5].
6. **Proposed viz tokens** (section 1.7) need a home: vendored `tokens.ts` or a DS request [S04 Q-U6, Q-U9].
7. Unchanged and not decided here: web-first versus phone-first for student and evaluator, verification scope (Q3), Approvals row visibility, reopen versus correction.

## 7. Verification done and not done

- Rendered all six mockups with Playwright Chromium at a 1440 x 900 viewport, full page; screenshots in `mockups/shots/`. Measured per page: `scrollWidth` 1440 (no horizontal scroll), 0 text elements under 12 px, 0 cards with overflowing content. Viewed every screenshot and fixed: collapsed pace strip lanes, 2026 dots stacking out of the lane, "Other 115 sites" flattening the aging scale, wrapping table links, outlier labels over dots, unbalanced columns in B, an overstated sentence in B's hero, an inconsistent "4 of them at Seaside" in C.
- Opened admin-A in the Chrome extension tab as well; the extension cannot load `file://` and the screen caps the window at 1384 px, so the Chrome view shows a 56 px horizontal clip of the 1440 frame. Full 1440 renders come from Playwright.
- Grep: no em or en dashes in any mockup; no `undefined` or `NaN`.
- NOT done: axe or contrast validation (the proposed `--viz-shortfall` and `--viz-seq-*` steps are unvalidated, [S05 §5] validator not run); dark theme; 1024 and 375 renders (layout rules are written, not mocked); `ds-conformance-reviewer`, `state-review`, `verification-reviewer` (no app code, so no runtime GREENLIGHT is claimed); requirements-auditor pass on the claims in this doc; SME check of required-skill names and sections used from the HGTC JSON.
