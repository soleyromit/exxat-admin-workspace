# Strategy 05: data, charts and insights at real scale

**Status:** strategy only, no app code changed. Written 2026-10-26. Companions (written separately, link by filename): `01-*.md` to `04-*.md` in this folder; `../00-design-brief.md` (chart table, section 8), `../01-competitive-digest.md`, `../02-decisions-ledger.md`, `../glossary.md`, `../dataset-spec.md`.
**Tags:** `[REQ id]` requirements · `[CALL]` Oct 8/9 transcripts · `[COMP name]` competitive analysis · `[BUILD-PROMPT §n]` · `[AUDIT Tn]` v2 audits · `[CODE file]` read in the tree · `[MEMORY name]` Romit feedback files · `[LEDGER D-x]` · `[INFER]` my judgement, unverified · `[PENDING-ROMIT]`. Untagged means unverified.
**Method:** the `dataviz` skill (form heuristic, colour by job, mark specs, hover layer, accessibility pass). Every decision below is written as: DECISION, WHY (evidence), REJECTED (and why), CHECK (how a reviewer tests it).

## 0. The one-paragraph intent (so nobody asks Romit again)

The data layer must tell a believable story at the scale a real program has: a cohort of 100+ students and 100+ skills across clinical and didactic work [LEDGER D-D]. Reference scale: 123 students (38 / 43 / 42), 154 skills in 10 sections, 142 configured, about 50 required units, 8,879 evidence records, 404 waiting, 20 awaiting approval, 64 returned [dataset-spec §2; BUILD-PROMPT §6]. A chart earns its place only if it answers a question a named role asks, still reads at that scale, and the same student shows the same numbers everywhere [BUILD-PROMPT §13.2]. Viz first, text annotates [MEMORY feedback_viz_first]; no basic progress-bar dashboards [MEMORY feedback_no_basic_progress_bar_viz]; no red for shortfall [MEMORY feedback_aarti_no_red].

## 1. Eight standing decisions

| # | DECISION | WHY | REJECTED | CHECK |
|---|---|---|---|---|
| P1 | Start from the question, not the chart. Each chart in section 3 names the role and the question. | Romit flagged "basic viz" repeatedly; charts picked from a menu produce flat bars [MEMORY feedback_no_basic_progress_bar_viz] | A chart gallery filled "because we have data" | Reviewer can read the question from the card title or subtitle |
| P2 | Whole-cohort views aggregate first and drill down; the default grain is cohort x section (about 123 x 10), never student x skill (123 x 154 = 18,942 cells). | v2 heat-grid renders every cell (`heat-grid.tsx:101-107`); 19k cells is not a viable DOM [CODE dataset-spec §7.6]; a reader cannot scan 19k cells either | Rendering every skill column "so nothing is hidden" | Count rendered `[data-heat-row] x cells` at 123 students; budget in section 9 |
| P3 | Progress bars only for a single in-flight 0 to 100 task (import running, sync). Not for attainment. | Bars hide distribution, benchmark and outliers [MEMORY feedback_progress_bars_last_resort]. The v2 admin landing (Dashboard) draws one stacked bar per skill (screenshot `a3-viz-home.png`); at 154 skills that is 154 stacked bars. | Per-skill stacked bars as the cohort overview | No bar chart whose answer is one number per entity with no benchmark |
| P4 | Every plotted share shows its denominator and its unit ("31 of 38 students", "12 of 50 required"). | A percentage without n misleads on cohorts of 38 and evaluators of 6; REQ RP-04 already demands honesty about overlap | Bare percentages in KPI tiles | Every number on a chart has an "of N" in the label, tooltip or table |
| P5 | The engine's four states (AE-04) are the only attainment states; pending, waiting, returned and unverified are overlays, never states. | [REQ AE-01, AE-04, AE-06]; [BUILD-PROMPT §5]. The v2 waffle and dots disagreed on what "waiting" is [AUDIT T2 line 108] | A fifth "almost done" state invented per chart | Legend of any attainment chart lists exactly 4 states plus overlays |
| P6 | No red for shortfall. Amber carries "did not meet / behind". Red only for a hard blocking error. | Aarti dislikes red in score and rating viz [MEMORY feedback_aarti_no_red]; severity must still be distinct [MEMORY feedback_severity_must_be_visually_distinct] so use glyph and weight, not a second alarm hue | A red "at risk" column | grep chart code for `destructive`; none in viz |
| P7 | One data function per number, shared by every screen (selectors, index once per state). | Consistency invariant, section 7; perf budget, section 9 | Per-component recomputation | Tests in section 7 |
| P8 | Insight sentences are computed from data, name the cause and carry a link to the people or skills behind them. | Success is "who is behind, which skill blocks them" not "a score" [CALL; LEDGER D-C]; REQ RP-05 requires aggregate to individuals | Hand-written insight copy; insights with no drill-down | Section 4 table: each sentence has a formula and a link target |

## 2. What each role asks of the data, and the form that answers it

| Role | Question | Form chosen | WHY this form | REJECTED and why |
|---|---|---|---|---|
| Student | What is left? | Required-skill checklist grouped by section, each skill a row of segmented dots (one dot per required sign-off), plus one hero sentence | Required units are about 50, a countable set; dots show "2 of 3" without arithmetic [REQ SH-04]; the waffle already exists for count form | Ring only (hides which skill); a progress bar (P3) |
| Student | Am I on pace? | Burn-up line: my cumulative counted vs the expected line for the term, with waiting as a dashed extension | Pace is a trajectory against a clock [CODE reports.ts termShare, PACE_MARGIN 1]; line vs line shows the gap and its history | A "75%" tile (no clock); a bar vs a target (the bar cannot show when I fell behind) |
| Student | Why did this not count? | A sentence naming the failed rule, plus the failed part chip ("Different evaluators 1 of 2") | [REQ SH-03] demands the rule in actionable terms; this is text, not a chart | A red cross icon alone |
| Student | What is waiting or returned? | Two counted lists with ages ("with J. Delgado, 9 days"), not a chart | A small set of actions, each with a person and an age; the nudge N-04 / N-05 lives here [BUILD-PROMPT §10] | A donut of waiting vs returned (2 slices, no action) |
| Evaluator | None. | A form. No chart, no progress ring, no cohort context. | Evaluators have no login and 22 s to 2.7 min to finish [COMP research; REQ EV-01]. Showing the student's overall progress risks bias, and the engine decides what counts [REQ AE-02]. | Student progress on the evaluator page (bias, extra load) |
| Reviewer | What is waiting and why held? | Queue table sorted oldest first with an age chip and a held-because phrase; above it an aging strip (0 to 3 / 4 to 7 / 8 to 14 / 15+) | A queue is a worklist; the strip shows the shape of the backlog once [COMP Medtrics: ageing, per-evaluator backlog] | Pie of statuses; a bar per item |
| Reviewer | Which evaluator returns a lot? | Evaluator dot plot: return rate per evaluator on one axis with the population mean line; only evaluators with n >= 30 are positioned, others sit in a muted "too few to compare" band | Outliers must be seen, not read [MEMORY feedback_viz_first]; honest n floor (section 6) | A ranked bar list of evaluators (invites blame at n = 6); a league table |
| Coordinator / admin | Who is behind? | Pace dot strip (one dot per student, x = required achieved, dashed expected line, only behind dots labelled) and the cohort heat-grid below it | 123 dots fit one strip; labelling 12 behind avoids 123 labels [dataset-spec §4.2]; strip shows distribution and outliers, a bar list does not | Ranked bars of 123 students; a pie of on pace vs behind |
| Coordinator / admin | Which skill is blocking? | Skill attainment: ranked dot plot of "required achieved %" per required skill (about 50), weakest first, top 12 shown then "all 50" in table; click opens skill drill-down | A required unit is the blocker unit [REQ AE-03; BUILD-PROMPT §5]; ranking by weakest answers "which" directly | Heat-grid of students x skills (P2); a treemap (area is unreadable for 50 near-equal items) |
| Coordinator / admin | Which site or evaluator is stale? | Aging stacks by site, top 8 sites by requests older than 8 days plus "other 112 sites"; evaluator open-request table sorted by oldest | Sites number 120 [dataset-spec §2]; top-N plus other keeps the story (site-087) [dataset-spec §4.9] | A bar per site (120 bars); a map (no geography in REQ) |
| Admin | What changes if I change this rule? | Before/after count pair with a named student list: "18 students move from achieved to in progress" | A change preview is a number plus a list, not a chart [REQ SC-19, AE-02; AUDIT T1: impact preview missing] | A before/after bar pair for 2 numbers |
| Director | Is the graduating cohort ready, what blocks them? | Readiness split (ready / one short / four or more short) as a stacked horizontal bar of 38 with counts, then a blocker list: each missing skill with the count of students it blocks | One cohort, three groups: a single stacked bar is the honest form for part-to-whole with 3 parts [dataviz choosing-a-form]; the list answers "what" | Radar (n = 38 fine, but 50 axes); a gauge |
| Accreditation | What evidence backs the claim? | The number, then a table of student x evidence rows (RP-07), export with filters recorded [REQ RP-06, RP-07, RP-10] | An auditor needs the record, not the picture; a chart is a way in, never the proof | A chart as the evidence |

## 3. Chart catalogue

Column legend: Q = question; Data = selector; Enc = encoding. "DS" means what exists in `@exxatdesignux/ui` 1.6.5 [CODE `node tools/ds/source.mjs`]: `KeyMetrics`, `MetricChart`, `ProgressCell`, `SignalBarsCell`, `StatusBadge`, `DataTable`, `HorizontalScrollRegion`, `Tabs`, `FilterBar`. `ChartCard` is NOT exported by the package (checked); this app vendors it at `admin/components/chart-card/index.tsx` [CODE]. Existing primitives live in `admin/components/v2/viz/` [CODE].

### 3A. Spec

| ID | Chart | Q | Data | Enc | Colour and glyph rule |
|---|---|---|---|---|---|
| C1 | Hero sentence + KeyMetrics strip | What is the headline? | counts from one `summary` selector | Number >= 48 px, label, delta; max 4 tiles | Neutral ink; delta uses amber for "behind" never red |
| C2 | Segmented dots per skill (exists: `segmented-dots.tsx`) | Student: what is left per skill? | `skillProgress` | One dot per required sign-off | States met / notYet / pending (dashed) / none with glyph + word |
| C3 | Waffle (exists) | Student: mandatory set at a glance | `mandatoryWaffle` | One square per required evaluation, grouped by skill | counted solid, pending hatched, remaining outline. Must share the dots' palette [AUDIT T2: two encodings today] |
| C4 | Burn-up (exists: `cumulative-line.tsx`) | On pace over time? Student, and cohort for staff | `paceSeries` | x week, y cumulative counted, expected line | Actual solid `--chart-1`; expected dashed neutral; waiting dashed `--chart-1` |
| C5 | Pace dot strip (exists: `dot-strip.tsx`) | Who is behind? | `paceRows` | One dot per student on 0 to 100 required achieved, expected marker | Behind = amber diamond with label; on pace = `--chart-1` circle |
| C6 | Cohort heat-grid (exists: `heat-grid.tsx`) | Who is behind on what? | `heatmap` at section grain | rows students, columns sections (10) or required skills (50) | VizState glyph + word; four fills |
| C7 | Skill attainment ranked dots | Which required skill blocks? | `skillAttainment` | y skill name (top 12), x % of cohort achieved, n label | One hue; weakest labelled in amber |
| C8 | Aging stack | How long waiting? | queue + `ageDays` | 4 buckets 0 to 3 / 4 to 7 / 8 to 14 / 15+ per site or evaluator | Sequential one hue light to dark; 15+ also amber outline |
| C9 | Evaluator rate dot plot | Who returns / does not qualify a lot? | `raterRows` | x rate, y evaluator, mean line, n in label | One hue; outliers amber; sub-floor evaluators muted |
| C10 | Funnel | Where does evidence drop off? | counts sent / submitted / counted | 3 horizontal stages with step % | One hue sequence |
| C11 | Skill scatter | Attempted but not achieved? | per skill: % attempted, % achieved | 154 dots, 10 labelled outliers | Neutral dots; outliers amber; quadrant guide |
| C12 | Self vs evaluator agreement | Do they agree? [REQ AR-02] | `itemAgreement` | Paired dots per criterion on the same scale | Agree neutral; differ amber |
| C13 | Coverage matrix | Required skills x courses | course mapping | rows required skills, columns courses | Mapped = filled; unmapped required row marked with N-13 chip |
| C14 | Radar vs cohort median | Student vs peers by section | section attainment | 10 axes, student polygon, median polygon | Student `--chart-1`; median dashed neutral. Only if cohort n >= 5 |
| C15 | Mosaic / hierarchy | Whole list of 154 skills | `skillProgress` for one student | Cells grouped section > group, state fill | Same VizState glyph; see 3B |
| C16 | Readiness split | Graduating cohort ready? | `verificationRows` | One stacked bar of N with 3 groups | ready green, one short info, four or more short amber (third group pending Q1) |
| C17 | Rule impact pair | What changes if I edit a rule? | re-evaluate over existing evidence [REQ AE-02] | Number before/after plus student list | Delta amber when students fall back |
| C18 | Sparkline in KeyMetrics tile | Trend of a headline | weekly counts | 12 weekly points, no axis | `MetricChart` from DS |

### 3B. Scale, fallback, summary, interaction, component

| ID | At 123 students x 154 skills | Table fallback | Text summary | Interaction | Component |
|---|---|---|---|---|---|
| C1 | n/a | The tile is the table | The sentence itself | Whole tile links to the list behind it | DS `KeyMetrics` |
| C2 | Required only (about 50), grouped by section; optional behind a toggle | Skill table with "n of m" column | "Sterile dressing change: 2 of 3 counted, 1 waiting" | Dot hover shows evaluator, date, setting | Existing `SegmentedDots` |
| C3 | One student, 50 to 100 squares, fine | Per-skill rows | "6 of 12 evaluations counted, 2 waiting" | Square focus names skill and attempt | Existing `Waffle` |
| C4 | One line (student) or 3 cohort lines max; weekly points (about 16) | Week x cumulative table | "Cohort 2027: 29 of 50 expected by now, 24 counted" | Crosshair + tooltip with both values | Existing `CumulativeLine` (recharts in DS `ChartContainer`) |
| C5 | 123 dots; if one cohort view, 43 dots; vertical jitter by index to avoid overlap, label only flagged (12) | Pace table, behind first | "12 of 123 students are behind; 9 are in Cohort 2027" | Dot click opens student record | Existing `DotStrip` |
| C6 | Section grain: 123 x 10 = 1,230 cells; required-skill grain: 123 x 50 = 6,150 cells with row virtualisation (about 30 rows rendered); never 154 columns | "Show as table" (exists) | "Weakest section: IV therapy, 38% achieved" | Cell click opens that student x skill evidence; sort fewest met | Existing `HeatGrid` + virtual rows |
| C7 | Top 12 shown, rest in table; one row per required skill | Skill table (RP-03) | "Hangs PB Med is the least achieved required skill, 82%" | Row click opens skill drill-down | New, on `ChartCard` |
| C8 | Top 8 sites or evaluators by 8+ day requests, then "Other (n)" bar; click Other expands table | Aging table | "52 requests are older than 15 days, 14 at one site" | Bucket click filters the queue | Existing `StackedBar` (extend) |
| C9 | 180 evaluators: position only those with n >= 30 (about 100); show top 10 outliers labelled; rest as gray dots; others listed in table | Evaluator table with n and rate (exists, SMALL_NUMBERS 5) | "One evaluator returns 3.5 times the average (n = 48)" | Dot click opens evaluator's items | New, on `ChartCard` |
| C10 | 3 bars | Count table | "8,879 sent, 8,475 submitted, 8,031 counted" | Stage click filters | Existing `StackedBar` or DS `MetricChart` funnel |
| C11 | 154 dots, label 10 outliers only; log-free linear axes 0 to 100 | Skill table with both columns | "10 skills are attempted often and achieved rarely" | Dot click opens skill | New; recharts scatter in `ChartCard` [INFER: see Q4] |
| C12 | Per queue item, about 6 to 12 criteria | Two-column table | "3 of 8 answers differ" | Row focus | Existing agreement counts [CODE queue-viz] |
| C13 | Required about 50 rows x 22 courses; filter by term to 5 to 8 columns; scroll inside panel | Matrix as table | "6 required skills have no mapped course" | Row opens mapping | New table-based, DS `DataTable` |
| C14 | 10 axes max, student vs median; suppressed under n 5 | Section table | "Strongest: Medication; weakest: IV therapy" | Axis hover | New, `ChartCard` radar |
| C15 | 154 cells in 10 section blocks, grouped; fits 1 screen at 14 px cells | Grouped list | "88 of 142 configured skills achieved" | Cell opens skill; section collapses | New; hierarchy tree with roll-up bars [BUILD-PROMPT §10] |
| C16 | One bar of 38 | Verification table | "31 ready, 7 one short" (third group pending Q1) | Segment opens list | Existing `StackedBar` |
| C17 | List capped at 10 names then "and 8 more" | Student list | "18 students move back to in progress" | Row opens student | Text + `StatusBadge` |
| C18 | 12 points | Value in tile | Tile aria-label | None | DS `MetricChart` |

Not in the catalogue on purpose: pie and donut (2 to 3 slices read better as a number; P1), gauge, 3D, treemap (REJECTED, section 2), dual-axis charts (never; dataviz non-negotiable), maps.

## 4. Hero metric and insight sentence pattern

DECISION: each analytic surface leads with one hero sentence in the Leo-insight style [MEMORY exxat-chart-leo-spotting]: a number the eye lands on, a plain sentence stating the cause, one link to the people or skills behind it. The chart below it proves the sentence; text never replaces the chart [MEMORY feedback_viz_first].
WHY: Pure typography loses storytelling, a graphic hero metric is required [MEMORY feedback_pure_typography_loses_storytelling]; REQ RP-05 requires aggregate to individuals; Romit's jobs-to-be-done are "tell me what is left", "show me why this is held" [../00-design-brief.md §2].
REJECTED: free-text AI summaries (not auditable; AI decides, not helps [COMP section 6]); insight cards with no link.
CHECK: each insight shows the formula inputs on hover, links to a list whose length equals the number in the sentence (section 7 test I-3).
Pattern: `[hero number] [noun]` / one sentence: who, what, since when / link "View the 12".

### 4.1 How each insight is computed

| Insight | Formula (all from the shared index) | Floor to fire | Link target |
|---|---|---|---|
| Behind pace | student behind if `collected < expectedByNow(needTotal, termShare) - PACE_MARGIN` [CODE reports.ts] | any | list of behind students |
| Behind where | among behind students, section with the largest summed shortfall | at least 3 students | section filtered report |
| One away from done | skill in progress with `counted >= need - 1` [BUILD-PROMPT N-01] | any | student list |
| Single-rater flag | skill with n >= 5 counted and 1 distinct evaluator (the existing tile "Skills with one evaluator") | n >= 5 | skill list |
| Outlier evaluator | return rate >= 3 x population rate, n >= 30 and at least 5 returns [INFER: dataset uses 40+; Q3] | n >= 30 | evaluator's items |
| Aging | requests older than 3, 8, 15 days [BUILD-PROMPT N-04, N-11; v2 uses 7, AUDIT T3] | any | queue filtered |
| Stalled site | site with all open requests older than 15 days and at least 5 requests | 5 | site page |
| Rule impact | re-evaluate evidence under the draft rule, diff achieved sets [REQ AE-02] | on edit | named list |
| Graduating blockers | required skills unmet among cohort with a graduating date, group by skill | cohort n >= 5 | verification list |
| Config backlog | configured skills / total skills; unconfigured count [N-12] | any | library filter |

### 4.2 Example sentences using dataset-spec numbers (copy style: plain, no em dashes, no internal IDs)

| Role | Sentence |
|---|---|
| Coordinator | "12 of 123 students are behind the term clock. 9 are in Cohort 2027 and short in IV therapy." |
| Coordinator | "52 requests are older than 15 days. 14 sit at one site where nobody has answered in 15 days." |
| Reviewer | "20 evaluations wait for approval. 2 are older than 10 days. 5 come from one evaluator who returns 3.5 times the average (48 evaluations)." |
| Director | "31 of 38 graduating students have met every required skill. 7 are one skill short, all the same one, and 3 of them already have a request waiting." |
| Admin | "142 of 154 skills are configured. Raising IV therapy to 2 different evaluators moves 18 students back to in progress." |
| Student | "6 of 12 evaluations counted, 2 waiting, 1 returned. You are 1 sign-off from finishing Sterile dressing change." |
| Admin | "5 skills have all evidence from one evaluator." |

## 5. Status colour semantics and legend rules

DECISION: one palette, one glyph per state, used by every chart, badge, dot and cell. Magnitude is one hue (`--chart-1`); state uses the DS status-badge pairs already wired in `viz/tokens.ts` [CODE]. Text always wears text tokens, never the series colour [dataviz non-negotiables].
WHY: the v2 audit found blue squares and green dots meaning "counted" on the same page, and the heat-grid, waffle and dots disagree on "waiting" [AUDIT T2 lines 108, 205]. One legend is learnable; four are not.

| Status | Meaning | Colour token | Glyph + word | Texture | Counts toward attainment |
|---|---|---|---|---|---|
| Counted (met) | Qualifies under the current rule [REQ AE-01, AE-02] | `--status-badge-success-*` | check-circle "Met" | solid | Yes |
| Not yet met (PENDING-ROMIT, see 02-content 6.4) | Some qualifying evidence, criteria not met [REQ AE-04] | `--status-badge-info-*` | half-circle "Not yet met" | solid | Partial |
| Did not qualify | Evidence exists, none qualifies [REQ AE-04, SH-02] | `--status-badge-warning-*` (amber) | triangle "Did not meet" | solid | No |
| Pending (waiting or awaiting approval) | Overlay, with who holds it [REQ AE-06] | `--status-badge-neutral-*` | clock "Waiting for X" | hatched 45 degrees | Never |
| Returned | Overlay: sent back for correction [REQ AR-05, RV-02] | neutral outline | return-arrow "Returned" | dotted outline | Never |
| No evidence | Nothing yet [REQ AE-04] | transparent, muted ink | dash "No evidence" | none | No |
| Unverified evaluator | Overlay on evaluator, not on evidence [REQ SL-09] | none | small "Unverified" chip | dotted outline | n/a |

Returned vs did-not-qualify: both are shortfalls; to avoid one amber meaning two things, returned is a process state (neutral, outline, return-arrow) and did-not-qualify is a verdict (amber, triangle) [INFER; PENDING-ROMIT Q2].
Legend rules: (1) a legend is always present for 2 or more encodings, and lists only states present in the data; (2) order is met, not yet, did not meet, pending, returned, none; (3) the legend sits inside the chart card, above the plot; (4) counts in the legend ("Met 31") when the chart is aggregate; (5) the same words as the glossary [../glossary.md].
REJECTED: a green to red scale (Aarti; also colour-only); a sequential brown/blue/green set as in the v2 home bars (`a3-viz-home.png` uses dark green, blue and brown whose lightness is similar, so adjacent segments are hard to separate [INFER from the screenshot; validator not run]).
CHECK: run `validate_palette.js` on the resolved token hexes in light and dark before shipping; not run in this session [UNVERIFIED]. Chart shows glyph or word for every state at least once.

## 6. Honesty rules

| Rule | WHY | CHECK |
|---|---|---|
| Show the denominator ("31 of 38") everywhere a share appears | A 92% on 38 students is a different claim from 92% on 4 | grep tile templates for `%` without "of" |
| Small-n suppression: radar and cohort median only when the cohort n >= 5; evaluator rates shown at n >= 5 (exists: `SMALL_NUMBERS`), compared and flagged at n >= 30 | [BUILD-PROMPT §10]; [CODE reports.ts:343]; the dataset hides evaluators under 5 pieces | Unit test with a cohort of 4 and an evaluator with 4 pieces |
| Axis honesty: bars and dot strips start at 0; a truncated domain only on a line, labelled "axis starts at X", and set `clip: true` per mark if Plot is used | [MEMORY feedback_plot_truncated_domain_needs_clip] | Visual check; axis labels present |
| Counts are a floor, not proof of competence | [COMP research: Dawson 2021; Tamblyn 2022] | Copy under reports: "Counts show recorded evidence" [INFER] |
| Overlapping tags are not a partition | [REQ RP-04] | Tag report carries a note "A skill can have several tags" |
| No red for shortfall (P6) | [MEMORY feedback_aarti_no_red] | grep |
| Uncertain data is labelled "Sample data" | The 8,879 records are generated, not real; an exec seeing "92%" could take it as fact | Persistent chip on every chart in the prototype build |
| Explain impossible filters, do not show empty [REQ RP-09, ST-08] | | A filter that cannot produce evidence renders the explanation |
| The pace line is a convention, not a rule | Pace is a v2 assumption (OD-level) [AUDIT T1 line 214] | Caption "Expected = share of the term gone", reviewed by Romit (Q5) |
| Sort order stated ("fewest met first") and changeable | Order implies judgement | Sort control visible |
| Never rank people on a league table; use position on a distribution | Evaluators and students are not competing | No ordinal 1, 2, 3 labels on people |

## 7. Consistency invariant: the same student shows the same numbers everywhere

DECISION: all counts derive from one memoised `progressMatrix(state)` (per-student, per-skill, plus per-student summaries) read by every screen [BUILD-PROMPT §5 "Precompute"; dataset-spec §7.4].
WHY: the v2 audit found pending counts disagreeing across card dots, home waffle and Record page ("Waiting 3") [AUDIT T2 lines 108, 135]; the build prompt makes cross-screen equality a definition of done [BUILD-PROMPT §13.2].
REJECTED: each chart computing its own counts (current state); a fixture asserted by literals.

| Test | Assertion | Source |
|---|---|---|
| I-1 student totals | for all 123 students: `mandatoryProgress.achieved` == `paceRows.achieved` == heat-grid row achieved == student Home skill-card count == verified record skills | dataset-spec §6.3 |
| I-2 status partition | counted + did-not-qualify + waiting + awaiting + returned == total evidence (8,879) and equals each chart's sum | dataset-spec §6.4 |
| I-3 link equals number | every insight number N: the target list has N rows | new |
| I-4 aging | sum of aging buckets == waiting requests (404) | dataset-spec §4.6 |
| I-5 cohort totals | strip dots == heat-grid rows == KeyMetrics "students" == 123 unscoped | dataset-spec §6.1 |
| I-6 no NaN | sweep all students x screens for `NaN`, `undefined`, `Infinity` | BUILD-PROMPT §13.1 |
| I-7 table equals chart | each chart's table fallback sums to the chart | new |
| I-8 student switch | picker change then "Same record in other views" keeps the student and numbers | BUILD-PROMPT §13.1 |

## 8. Accessibility

DECISION: WCAG 2.1 AA; every chart has (a) a text summary in the accessible name, (b) a table view, (c) keyboard reach [BUILD-PROMPT §2.7, §10]. Existing primitives already expose names (heat cells read "Jon Ruiz, IV start: Did not meet") and `role=meter` [CODE tests/v2/viz.test.tsx].

| Requirement | Rule | CHECK |
|---|---|---|
| No colour-only | glyph + word per state (section 5) | Greyscale screenshot still readable |
| Table + summary | "Show as table" toggle on every chart; summary string computed by the same selector | axe + test I-7 |
| Keyboard | Cells, dots and rows are buttons when selectable; Tab enters the figure, arrow keys move; visible focus | Keyboard-only walk-through |
| Hit targets | >= 24 px (dataviz: larger than the mark) | Inspect |
| Reduced motion | No animation on mount; transitions off under `prefers-reduced-motion` | Toggle OS setting |
| Contrast | Marks vs surface >= 3:1 (non-text, SC 1.4.11); text >= 4.5:1; high-contrast and forced-colors keep texture (hatch for pending) | axe with contrast on, not disabled (v2 tests disable `color-contrast`, so contrast is unverified [CODE viz.test.tsx:9]) |
| Dark mode | Own steps validated against dark surface | Validator both modes |
| Touch | On phone, heat-grid scrolls inside its own panel with a "Scroll sideways" hint (exists) | 375 px screenshot |

## 9. Performance

DECISION: index once per state, memoise, render windows. Budget: first render of any staff screen under 300 ms on the full dataset; `createSeed()` under 400 ms [BUILD-PROMPT §13.4; dataset-spec §6.12].
WHY: selectors are O(evaluations) per call and called per student x skill; a heat-grid is about 110 M comparisons, likely 0.3 to 1 s [INFER dataset-spec §7.4]. Persisting 8,879 evaluations to localStorage is about 3.8 M chars and fails silently [dataset-spec §7.3].

| Tactic | Detail |
|---|---|
| Index selectors | `WeakMap<V2State, Index>` with `byStudent`, `byStudentSkill`, `bySkill`, `byEvaluator`; invalidates on a new state object |
| One matrix | `progressMatrix(s)` lazily fills a row on first read |
| Aggregate before render | section grain for the cohort grid; top-N plus "Other" for sites and evaluators |
| Virtualise | Rows over 50 (students, evaluators, queue); heat-grid rows windowed; columns capped at 50 |
| Lazy evidence | Student, library screens do not build the 8,879 records [dataset-spec §7.5] |
| Persist deltas, not the dataset | Envelope with patch [dataset-spec §7.3] |
| Do not animate large sets | No per-cell transitions above 500 marks |
CHECK: vitest coarse timers on `paceRows` + `heatmap` after warm-up; Lighthouse or Performance panel on `/reports` with 123 students.

## 10. Per-screen chart plan

Principle: landing = hero sentence, then at most 2 charts, then the worklist. Fewer rows of nav [LEDGER D-A] means fewer places to hang a chart, so each landing earns its content.

### 10.1 Admin / coordinator landing (Dashboard)

Rename note (2026-10-26): the staff landing is a Dashboard, not a Home [ROMIT 10-26]. Scope, basis, drill and state rules: `06-dashboard-patterns.md`, which replaces the default three-cohort lanes with one scope plus a "Split by" toggle.

```
+--------------------------------------------------------------------------+
| Hero: "12 of 123 students are behind. 9 are in Cohort 2027, IV therapy." |
|  [View the 12]                                     Sample data           |
+--------------------------------------------------------------------------+
| KeyMetrics (4):  Required achieved | Behind pace | Waiting 404 | Backlog 12|
|                  sparkline each (C18)                                     |
+------------------------------------+-------------------------------------+
| Pace strip (C5)                    | Blocking skills (C7), top 8         |
| 0%---o-o-o-<>-<>--|--o-o-o-o--100% |  Hangs PB Med     ............ 82%  |
|        (12 labelled diamonds)      |  IV push          .......... 61%    |
+------------------------------------+-------------------------------------+
| Needs attention (worklist, not chart): stalled site, aged queue, backlog  |
+--------------------------------------------------------------------------+
```
WHY: replaces per-skill stacked bars (v2 admin landing) with distribution + blocker ranking [P3]. The set-up meter from v2 is a configuration list, not a chart, and moves to the library page [INFER; section 12 Q6].

### 10.2 Reports (Students tab, key staff screen)

```
Filters: [Cohort 2027 x] [Course x] [Add filter]    applied chips, each removable
Hero: "38 of 43 have not finished IV therapy"
+ Pace strip (C5) ---------------------------------------------------------+
+ Heat-grid (C6): rows = 43 students, cols = 10 sections                    +
|                Med  IV   Wound  Resp ...   [Show as table] [Section|Skill]|
|  Amara N.      [v]  [!]  [-]   [i] ...    legend: Met / Not yet / Did not|
|  ... virtualised, sticky header, sort fewest met first ...                |
+ Burn-up (C4): 3 cohort lines vs expected --------------------------------+
```
Tabs: Students, Skills, Evaluators (exists) [CODE reports-page]. Switching to "Skill" grain shows the 50 required skills with row virtualisation.

### 10.3 Reports (Skills tab)

```
Hero: "Hangs PB Med is the least achieved required skill (82% not yet)"
+ Ranked dots (C7) top 12 + [All 50 as table] ------------------------------+
+ Scatter (C11): x % attempted, y % achieved, 10 outliers labelled, quadrant +
```

### 10.4 Reports (Evaluators tab) and Review queue

```
Hero: "5 of 14 waiting items come from one evaluator who returns 3.5x average"
+ Aging strip (C8): 0-3 | 4-7 | 8-14 | 15+   per site, top 8 + Other --------+
+ Evaluator dot plot (C9): mean line; n >= 30 positioned; others muted ------+
+ Queue table (worklist): age chip, held because, oldest first, bulk approve +
```

### 10.5 Student home (web-first, adapts to phone) [PENDING-ROMIT Q2 in ledger]

```
Hero: "6 of 12 counted. 2 waiting. 1 returned. 1 sign-off from Sterile dressing."
+ Next action card (one button) ---------------------------------------------+
+ Burn-up (C4): me vs expected, waiting dashed --------------+ Waffle (C3)   +
+ Skill rows (C2): grouped by section, dots + words; Returned panel first ----+
```
No cohort data on the student page except a peer median, shown only when n >= 5 [section 6]. The v2 Record page repeats the pace chart; keep it on one page [AUDIT T2 line 178].

### 10.6 Student record (per skill, across courses)

```
Skill header + rule sentence ("Needs 2 sign-offs from 2 evaluators")
Part chips: [Sign-offs 1 of 2] [Different evaluators 1 of 2 (!)]
Attempt timeline: dot per attempt with outcome glyph, evaluator, course, setting
Course filter [All | NURS 350 | ...]  [REQ SH-06]
```
This is a timeline, not a chart. Setting progress "0 of 2 in Inpatient" uses segmented dots; "Lab does not count" note [REQ SC-12, SH-05].

### 10.7 Director readiness (graduating cohort)

```
Hero: "31 of 38 ready. 7 one skill short."
+ Readiness split (C16): [31 ready | 7 one short]  (third group: Q1) ----------+
+ Blockers: skill name | students blocked | waiting requests | link ---------+
+ Student list (table): what stops this | verify (see Q3 in ledger) ---------+
```
Verification and director are v2 proposals, not REQ [AUDIT T3]; keep the chart honest: "Ready" means the engine says required skills are met, not that the director has verified [LEDGER Q3].

### 10.8 Admin: rule change impact (inside configure wizard, last step)

```
Rule: [Different evaluators] 1 -> 2
+ Impact pair (C17): Achieved 112 -> 94 (-18)   In progress 6 -> 24 ---------+
+ Named list of 18 students (10 shown, "and 8 more"), each with skill ------+
[Cancel]  [Publish]
```

### 10.9 Evaluator form (non-chart)

```
Skill 1 of 3: Sterile dressing change     rule sentence    outcome [Met|Not yet]
Feedback (required when configured)                       [Submit]
Message after submit: "Counts now" or "Goes to approval"   no charts
```

### 10.10 Courses and coverage

Coverage matrix (C13) with an "unreachable minimum" warning [COMP Platinum Planner]; unmapped required rows carry the N-13 chip.

## 11. Storytelling arcs mapped to the chart that reveals them

| Arc (dataset-spec §5) | Reveal chart | What the reader sees | Data condition that must hold |
|---|---|---|---|
| 1 Coordinator: 9 behind in IV therapy, 3 stale sites | C5 pace strip, C6 section grid, C8 aging by site | 9 amber diamonds, one dark IV column, site-087 with 14 requests in 15+ | 9 students at 0 or 1 of 7 IV items; 12 requests older than 15 days |
| 2 Director: 31 of 38 ready, 7 one short | C16 readiness split, blocker list | Three-segment bar; one blocker row naming Hangs PB Med | 7 students each missing the same required skill |
| 3 Reviewer: aged queue + outlier evaluator | C8, C9, queue table | 2 items in the 8+ bucket; one amber outlier dot | 5 of 14 items from one evaluator at 3.5 x |
| 4 Student: one away, lab-only gap | C2 dots, Returned panel, setting progress | A dot row with 1 missing; "Lab does not count" note | 6 twins one sign-off away; 4 lab-only |
| 5 Admin: 142 of 154 configured, rule moves 18 | C17 impact pair, backlog list | "-18" pair with names | Rule edit flips 18, not 0 |
| 6 Preceptor: 11 open across 7 students | Non-chart: request list with age chips | Two older than 8 days flagged | Busiest evaluator at 4.6% |
| 7 Lab instructor: batch of 24 | Grid of 24+ rows with a bulk action | Check-off column filling | Lab grid scoped to cohort, not all 123 [CODE lab.ts:69] |
| 8 Unverified evaluator | Chip on queue and evaluator table | "Unverified" overlay; merge action | 14 unverified, 3 with 8+ day requests |
| 9 Director: 4 need lab return demonstration | Readiness split third segment (pending Q1) | "four or more short" group | 4 students missing 4 or more required of about 50 |

Caveat: dataset-spec arc 2 (31 of 38 complete, 7 one short) already sums to 38, yet arc 9 describes 4 students missing four or more; the spec says they are different groups, which cannot both hold [dataset-spec §5 note]. Do not draw both in one readiness bar until the generator fixes the partition [Q1].

## 12. Open questions for Romit

| # | Question | Why it matters |
|---|---|---|
| Q1 | Dataset-spec arcs 2 and 9 do not partition the 38 graduating students (31 complete + 7 one-short already sum to 38, yet 4 are described as missing four or more). Which is right? | The director readiness bar cannot sum. |
| Q2 | Returned vs did-not-qualify visual: neutral outline (process) vs amber (verdict), as proposed? | Keeps one amber meaning |
| Q3 | Evaluator outlier floor: n >= 30 with at least 5 returns (proposal) or the dataset's 40? | Avoids blaming small samples |
| Q4 | Chart library: recharts is installed and used by DS `ChartContainer` (bullet meter); PCE moved to Observable Plot / ECharts for richer charts [MEMORY feedback_stop_recharts_pick_library_first]. Add Plot here for the dot plots and scatter, or stay on recharts and hand-built SVG? | Dependency decision, not mine |
| Q5 | Is "pace" (term-clock line) a real program concept or a v2 assumption? It drives C4, C5 and the behind-N insight. | [AUDIT T1: D31 assumption] |
| Q6 | Does the set-up meter (12 of 31 in use) stay on the admin Dashboard, or move to the library? | The Dashboard owns 2 charts only |
| Q7 | Do students see a peer median at all (privacy, anxiety)? | C14 and cohort lines |
| Q8 | Should the prototype carry a permanent "Sample data" chip? | Honesty vs demo polish |
| Q9 | Is the Leo-insight overlay style (pill + dashed connector) in scope for this product, or just the sentence above the chart? Only the sentence is assumed here. | The overlay components are vendored in PCE, not here [CODE] |

## 13. Review a chart against this doc (checklist)

1. Names the role and question it answers (section 2); would a number or sentence do better (P1)?
2. Chosen form matches the catalogue (section 3); not a progress bar, pie, donut, gauge or dual axis.
3. At 123 students x 154 skills: what is the grain, the cap (top-N + Other) and the render count? Under the 300 ms budget?
4. Every share shows its denominator; sample data labelled.
5. States: exactly the four engine states plus overlays; glyph and word on each; legend present, in order.
6. No red; amber for shortfall; no colour-only meaning; palette validated in light and dark (validator run, result pasted).
7. Axes start at 0 (bars, strips); truncated line axes labelled and clipped.
8. Small-n suppressed (radar cohort n >= 5, evaluator compare n >= 30).
9. Insight sentence computed (section 4.1), links to a list whose length equals the number.
10. Table view and text summary exist and agree with the chart (I-7); keyboard reachable; targets >= 24 px; reduced motion honoured; contrast on in axe.
11. Same student, same numbers on every screen (I-1, I-5).
12. Uses `@exxatdesignux/ui` or the vendored `ChartCard` + existing `viz/` primitive before anything new; tokens only, no hex.
13. Screenshot reviewed at 1440 and 375, not only tests (visual review is not verification [MEMORY feedback_visual_review_is_not_verification]).
14. Nothing here treats an OD as decided; no REQ section 14 feature is charted.
