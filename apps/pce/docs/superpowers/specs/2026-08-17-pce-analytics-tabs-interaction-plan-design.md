# PCE Analytics — By Faculty / By Course / By Term: Interaction, UI & Experience Plan

**Status:** Approved by Romit, ready for implementation planning
**Scope:** `/analytics` tabs — By Faculty, By Course, By Term. Overview is explicitly out of scope (not mentioned in the ask).
**Supersedes:** `2026-08-17-pce-by-faculty-analytics-redesign-design.md` (deleted — that spec covered By Faculty alone before the ask broadened to all three tabs; this one folds its content in and corrects two things it got wrong, see "Corrections" below).
**Author:** Claude (brainstorming session), approved by Romit, 2026-08-17

## Why

Romit asked for a thorough requirements evaluation across all three secondary analytics tabs — "proper context, content... better visual analytics, metrics" — focused first on **what question each tab should answer**, then the visuals/metrics that answer it.

## Method

1. Pulled prior settled decisions from the Obsidian vault (`Decisions/pce/2026-07-13-analytics-single-vs-multi-survey-model.md`, the Jul 13 Monil+Romit transcript) and this workspace's binding UX-006 rule (`apps/pce/docs/patterns/pce-ui-patterns.md §0.2` — every visualization must answer one stated question and prompt one stated action).
2. Read the actual current implementation of all three panels (`components/pce/analytics-panels.tsx`, `faculty-leaderboard-section.tsx`) line by line — not from memory or screenshots.
3. Compared against the more mature, decluttered visual vocabulary already shipped on the single-survey `/results/[id]` page (2026-07-18 declutter pass).

## Corrections to the earlier By-Faculty-only assessment

Reading By Course and By Term's actual code (not just screenshots) overturned two assumptions from the narrower first pass:

1. **By Course and By Term are already far more sophisticated than assumed.** Both have genuine AI-insight generation (`ChartLeoInsight` cards) that go beyond text summaries: `courseFacultyLeo` ("is this a staffing problem or a content problem"), `termSlopeLeo` ("which courses got worse, not just which are low"), `termGapLeo` ("coach the person vs. redesign the content"). These are well-designed, already answer real questions, and are **kept as-is** in this plan — not rebuilt.
2. **The "cohort student-count has no visual mark" gap the vault research flagged was stale.** By Term already has a `CohortStudentWaffle` chart ("one square is one student") plus N-aware distribution charts for the cohort's course/faculty populations — already VIZ-006 compliant (no duo-numbers, real distributions). The vault note describing this as unbuilt was outdated; the code caught up since. Not touching this.

These corrections matter because they change where the real work is: **not** "build missing analysis" (Course/Term's analysis is already strong) but **"make the three tabs consistent with each other and with `/results`, close two specific action gaps, and give By Faculty the comparative insight the other two already have."**

## Second correction — the chart layer itself was misread

The first two passes of this plan treated `analytics-panels.tsx`'s data derivations as the whole picture and only skimmed the JSX that renders them. `components/pce/analytics-plots.tsx` (1954 lines, `import * as Plot from '@observablehq/plot'`) is a real, mature chart-primitives library — not a thin Recharts wrapper — and reading it in full changes three specific claims made earlier:

- **By Faculty's "Scores over time" / "Response rate over time" are not generic line charts and do not need retitling.** `FacultyCompareLines`/`ResponseCompareLines` already implement a "highlight spaghetti" pattern (Romit, 2026-07-15): every faculty member's line renders as faint ghost context on one shared axis against a dashed program-mean/target reference, with only the 3 largest movers inked and labeled — plus an `EntityTrendExplorer` in `ChartCardActions` letting a coordinator pick any individual to trace. The earlier claim that these "read like one person's trend" was wrong — retracted, no change needed here.
- **`DriftDumbbell`** (Overview's "Which way each faculty is moving") is a change-axis arrow/dumbbell chart with real rigor: the axis is deliberately the *drift*, not the absolute score (an earlier version scaled to level and made 4 of 6 arrows an unreadable smudge — documented in the component's own comments as a caught, fixed bug), direction is redundantly encoded in both color and a text delta per A11Y-008 (color alone is banned), and decline is the only state that earns color (amber), matching the "no red, decline gets the only accent" rule. It is Overview-only today — not duplicated, not something to rebuild.
- **`KpiSpark`** is a real, already-built sparkline component (`Plot.line` + a terminal dot, ≥3-point minimum with an honest "not enough data" fallback instead of a silently bare number) — used on Overview's KPI tiles, never wired into By Faculty/Course/Term's. The "add a sparkline" idea in this plan is not new work; it's reusing `KpiSpark` directly.
- **`ByTermPanel`'s "Program trend" chart is a legacy Recharts `LineChart` duplicate of `ProgramTrendStack`**, which is Plot-based, already built, already used on Overview, and does not use a legend (Plot components here teach via dashed reference lines and direct point interaction, not legend boxes). The original "remove the chart legend" fix was too narrow — the real fix is deleting the Recharts implementation and rendering `ProgramTrendStack` instead, which removes the legend as a side effect of removing the duplicate code.

Net effect: fewer new components than the prior draft assumed, and the ones that are genuinely new (aggregate KPI band, By Faculty's course-variance insight) should be built by **reusing** `KpiSpark` and `FacultyLeaderboardDots` respectively, not by inventing parallel patterns.

Two more existing components worth naming: **`BenchmarkDistribution`** (a jittered peer-swarm — already used on both By Faculty and its selected-person portfolio) switches from percentile to plain rank below ~20 people, since a percentile in a 3-person department is false precision. **`CourseTermGrid`** is a real, polished heatmap (course × term, brand-ramped fill, contrast-computed text color) — it exists and is used, but only on Overview, not on any of the three tabs this plan covers. Proposing it for By Course (see the table below): that tab currently shows one course's history at a time with no "how's everything trending" summary above its own selector, which this closes without inventing a new chart.

## Cross-cutting requirements (apply to all three tabs)

### 1. Visual vocabulary — port `/results`' decluttered pattern

All three tabs currently use `KeyMetrics variant="compact"` tiles and Recharts `LineChart`s with visible `ChartLegend`s. `/results/[id]` (2026-07-18 declutter) uses a different, more mature vocabulary that was never ported: `ScoreTile` (photo identity, hero value + delta chip in teal-up/amber-down, never red, caption row), `Popover`-based stat detail instead of tooltips-only, no chart legends (marks + `Popover` teach instead).

**Extraction (Approach A, approved) — shared components, not duplication.** `ScoreTile`, `PopoverStatRow`/`PopoverSection`, and the photo-marker scale-track plot are currently defined *inline* in `results/[id]/page.tsx`, not exported. Extract to `components/pce/`:
- `components/pce/score-tile.tsx`
- `components/pce/popover-stat.tsx`
- `components/pce/scale-track-plot.tsx` (narrow public API: data + optional highlighted-person, so both surfaces can configure it without reaching into internals)

`results/[id]/page.tsx` changes to *import* these instead of defining them inline — behavior-preserving refactor. Verify with `visual-diff.mjs` against the current `/results` page immediately after extraction, before any analytics-side changes, so the refactor is confirmed non-regressive independent of everything built on top of it.

**Apply across all three tabs:**
- Every KPI tile → `ScoreTile`, with a `KpiSpark` sparkline wherever ≥3 points of history exist (reuse the existing component — see "Second correction" above).
- **`FacultyLeaderboardDots` / `CourseRankDots` (the leaderboard dot plots) are NOT replaced.** They're already sophisticated, N-aware Observable Plot components (Cleveland dot ≤30, strip plot above, faint per-offering dots behind the weighted mean) — rebuilding them as a `scale-track-plot` pulled from `/results` would be discarding working, considered code to build a less-mature duplicate. Scope for `scale-track-plot` narrows to wherever `/results` uses a pattern analytics has no equivalent for at all — evaluate case by case during implementation, don't force it onto the leaderboards.
- **`ByTermPanel`'s "Program trend"** — delete the Recharts `LineChart` implementation, render `ProgramTrendStack` (already built, Plot-based, used on Overview) instead. This removes the legend as a side effect of removing the duplicate, rather than patching the legend out of code being deleted anyway.

### 2. Aggregate KPI band — missing on By Faculty and By Course

By Term already opens with a KPI band (`byTermKpis`, before any chart) — this is the settled model (2026-07-13: KPIs → trend → deep-dive). **By Faculty and By Course both skip straight to the leaderboard/selector with no aggregate view.** Add, for each:

- **By Faculty:** `# below median`, `# below response target`, program avg faculty score — reduced from `facultyStats()`, which the leaderboard already computes. No new data-layer function. The program-avg tile gets a `KpiSpark` fed the last N terms of `termSeries()`'s `facultyAvg`.
- **By Course:** same shape from `courseStats()`, spark from `termSeries()`'s `courseAvg`.

Both sit above the leaderboard/selector, answering "how many need attention, program-wide?" before the reader picks one. Built from `ScoreTile` + `KpiSpark` — both existing components, no new chart code.

### 3. By Faculty needs a course-variance insight — the mirror of `courseFacultyLeo`

By Course already asks, per course: "does this course's score depend on WHO teaches it?" (`courseFacultyLeo`, rendered via `FacultyLeaderboardDots` fed `courseFacultyAsStats` — offerings grouped by `facultyId`, one dot per instructor with their own offerings as faint context behind it). By Faculty has no symmetric insight asking, per person: "does this person's score depend on WHICH COURSE they teach?"

**Build it exactly the way `ByCoursePanel` already builds its mirror** — reuse `FacultyLeaderboardDots` directly, not a new chart. Group the selected faculty member's offerings by `courseCode` instead of by `facultyId` (mirroring `courseFacultyAsStats`'s exact shape, just grouped on the other key), so each "row" is one course they've taught, with their own offerings of that course as faint dots behind it. Same spread-based Leo insight logic as `courseFacultyLeo`, reworded for the person axis: "consistently strong/struggling across courses" (tight spread) vs. "one specific course is dragging the average" (wide spread). Lives in `ByFacultyPanel`'s selected-faculty section, same position `courseFacultyLeo`'s chart occupies in `ByCoursePanel` (after the KPI strip, alongside the existing portfolio charts). Zero new Plot code — new data shaping only.

### 4. Internal note — a genuinely missing action, on all three tabs

None of the three tabs let a coordinator record "I looked into this and here's what I found/did" without leaving the tool:
- **By Faculty:** zero actions beyond "View insights" (read-only).
- **By Course:** zero actions beyond "View insights" cross-drill to faculty (read-only).
- **By Term:** has a real action (**Nudge** non-responders, already wired to the attention table) — but Nudge only solves a response-rate problem. A course with adequate responses and a bad score has no action available; the only button on the row is the wrong tool for that job.

**Data model** (mock-data/client-state, mirrors the existing `sendSurveyReminder` pattern in `usePce` — this app has no real backend to design a persistence layer against yet):
```ts
interface AnalyticsNote {
  id: string
  scope: 'faculty' | 'course' | 'term'
  scopeId: string       // facultyId | courseCode | term
  authorName: string    // current coordinator, from usePce
  body: string
  createdAt: string     // ISO, stamped at write time
}
```
One shared shape across all three tabs (`scope` discriminates), one `usePce` state (`analyticsNotes: AnalyticsNote[]`), one mutation (`addAnalyticsNote(scope, scopeId, body)`) — not three separate note systems.

**Placement, per tab:**
- **By Faculty:** compact "Notes" card after the `ScoreTile` KPI strip, before `TermThemesInsight` (coordinator's own record, precedes the AI summary as context the reader carries in, not appended after the evidence). Leaderboard rows get a note-count indicator (icon + count, shown only when >0) beside "View insights" — same drill-in target, not a second interaction pattern.
- **By Course:** same placement pattern, scoped to `courseCode` — after the KPI strip, before `TermThemesInsight`.
- **By Term:** the "Where [term] needs attention" table gets the note-count indicator per row, same as the other two leaderboards. The **Nudge** button changes from always-shown to conditional — only rendered when that row's response rate is below target; rows with adequate response but a low score show "Add note" instead, so the action offered actually matches the problem the row displays.

**States** (component-state-catalog, applies identically across all three): empty → "No notes yet" + always-visible "Add note" affordance (not hidden behind a second click); composing → Save disabled while textarea is empty/whitespace; list → newest-first, author + relative timestamp + body. **Explicitly cut for v1 on all three:** no edit/delete (YAGNI — a wrong note gets corrected by a new note; edit/delete adds real scope — who can delete someone else's note? — that a mock-data internal tool doesn't need yet).

## Section — Chart & mark choices, with external references

Checked against Mobbin (web platform) before finalizing — a real gap in the first pass of this plan, corrected here. Findings:

**Correction, 2026-08-17:** this section originally proposed several of these as new patterns modeled on Mobbin references before the actual `analytics-plots.tsx` chart library had been read in full. Most of what's below is reusing an existing, already-sophisticated Observable Plot component — the Mobbin check still stands as confirmation these are industry-standard shapes, not evidence they needed building from scratch. See "Second correction" above for the full account.

- **Quadrant/gap scatter** (By Term's "Content vs teaching", `GapQuadrant`): checked against Zoho CRM's quadrant chart and TheyDo's bubble-sized 2×2 matrix as a sanity check — and `GapQuadrant` already does this (`r: 'enrolled'`), plus something neither reference does: it colors and labels outliers by **statistical residual from a fitted trend**, not raw quadrant position, and documents *why* it deliberately omits a regression line (measured r²=0.013 — course content explains ~1% of faculty-score variance, so drawing a fit line would assert a relationship the data itself denies). Nothing to change here. Correcting an earlier claim in this plan that enrollment-sizing was missing — it wasn't.
- **KPI tile with inline trend**: Later, Whop, and Navattic all pair a stat number with a small sparkline directly beneath it. This workspace already has that exact component — `KpiSpark` (`Plot.line` + terminal dot, ≥3-point minimum, honest fallback copy below that) — built and used on Overview, never reused on By Faculty/Course/Term. The Mobbin check confirms the pattern is right; the implementation is a reuse, not new code.
- **Ranked leaderboard with drill-in**: 15Five's "My team at a glance" and X's rank/name/stat table validate the existing `FacultyLeaderboardDots`/`FacultyScoreStrip` shape — already correct, no change.
- **Internal note thread**: Employment Hero's comment-on-goal pattern validates the internal-note shape in Section 3 above — this one genuinely is new (no existing PCE component does this).
- **Slope chart** (By Term's "What moved", `Slopegraph`): no strong external analog surfaced — a Tufte-style slopegraph, more common in analyst/BI tooling than consumer SaaS. Keeping it as-is; already well-built (`termSlopeLeo`), noting the external check came up empty rather than skipping it.

Full mark-by-element table:

| Tab | Element | Mark | Note |
|---|---|---|---|
| Faculty | Aggregate KPI band | `ScoreTile` + `KpiSpark` | Both existing components, reused |
| Faculty | Leaderboard | Existing `FacultyLeaderboardDots`/`FacultyScoreStrip` (Observable Plot, N-aware) | Unchanged — already sophisticated |
| Faculty | Scores/response over time | Existing `FacultyCompareLines`/`ResponseCompareLines` (small-multiples + `EntityTrendExplorer`) | **Unchanged** — corrected from an earlier wrong "retitle" claim |
| Faculty | Selected-person KPI strip | `ScoreTile` + `KpiSpark` from `avg1y`/`avg3y` history | |
| Faculty | Course-variance insight (new) | Reuse `FacultyLeaderboardDots`, rows grouped by `courseCode` instead of `facultyId` | Same technique `courseFacultyLeo` already uses in reverse |
| Faculty | Internal note | Comment-thread list | Genuinely new — no existing analog |
| Course | Score trend | Existing `CourseTrendStack` | Unchanged |
| Course | "Who taught it" | Existing `FacultyLeaderboardDots` (via `courseFacultyAsStats`) | Unchanged |
| Term | Program trend | Delete Recharts duplicate, render existing `ProgramTrendStack` | Removes the legend by removing the duplicate |
| Term | Cohort row | Existing waffle + Cleveland dot distributions | Already correct |
| Term | "What moved" | Existing `Slopegraph` | No external analog found; keeping — already well-built |
| Term | "Content vs teaching" gap | Existing `GapQuadrant` (already sized by enrollment, residual-based outlier coloring) | Unchanged |

## Section — Question/action map, by tab

### By Faculty

| Element | Question answered | Action prompted | Status |
|---|---|---|---|
| **NEW** Aggregate KPI band | "How many faculty need attention, program-wide?" | Triage — decide whether to drill in at all | Add |
| Faculty leaderboard (`FacultyLeaderboardDots`/Strip) | "Who is furthest below median, and trending down?" | Pick who to investigate next | Keep — already sophisticated Plot component |
| "Scores over time" / "Response rate over time" (`FacultyCompareLines`/`ResponseCompareLines`) | "Is the faculty POOL improving or declining as a group?" | Escalate a program-wide trend, not an individual | **Keep as-is** — already a small-multiples/ghost-context chart with top-3 highlighting + drill-in explorer, correctly titled |
| KPI strip (once selected) | "Is this person's overall standing healthy?" | Decide if a conversation is warranted | Keep, → `ScoreTile` with real delta from `facultyStats()`'s existing `drift` field |
| **NEW** course-variance insight | "Is this person consistently good/struggling, or is one specific course dragging them?" | Route to a course-specific vs. general coaching conversation | Add — mirrors `courseFacultyLeo` from the other axis |
| `TermThemesInsight` | "WHAT should the conversation be about?" | Pull comments as evidence | Keep |
| `StudentVoice` | "What did students actually say?" | Cite quotes as evidence | Keep |
| Offerings table | "Which offering is driving this?" | Open the survey card | Keep |
| **NEW** Internal note | "What have I already noted about this person?" | Record a follow-up flag | Add |

### By Course

| Element | Question answered | Action prompted | Status |
|---|---|---|---|
| **NEW** Aggregate KPI band | "How many courses need attention, program-wide?" | Triage before picking one | Add |
| **NEW** Course × term grid | "How is every course trending, at a glance?" | Pick a course to open, before this tab's own selector | Add — reuse `CourseTermGrid` (already built, currently Overview-only) |
| KPI strip | "Is this course healthy right now?" | Decide if a redesign conversation is warranted | Keep, → `ScoreTile` |
| Score trend (Leo) | "Is this course sliding across offerings, or one bad term?" | Investigate a multi-term slide | Keep, drop legend |
| "Who taught it" (`courseFacultyLeo`) | "Is a low score a STAFFING problem or a CONTENT problem?" | Route to a staffing conversation or a content redesign | **Keep as-is — best-designed insight on the page** |
| Offerings table | "Which offering is driving this?" | Open the survey card | Keep |
| **NEW** Internal note | "What have I already noted about this course?" | Record a follow-up flag | Add |

### By Term

| Element | Question answered | Action prompted | Status |
|---|---|---|---|
| KPI band | "Is the program healthy this term vs. last?" | Decide if intervention is needed now | Keep, → `ScoreTile` |
| Program trend | "Improving structurally (content) or interpersonally (teaching)?" | Distinguish a curriculum push from a faculty-development push | **Swap Recharts duplicate for existing `ProgramTrendStack`** |
| Response rate across terms | "Will we hit the target this term, on the current trajectory?" | Decide whether to push harder on collection now | Keep |
| Cohort row (waffle + distributions) | "How does THIS cohort break down?" | Investigate an under-represented group | Keep — already correct, no change |
| "What moved" (`termSlopeLeo`) | "Which courses got WORSE, not just which are low?" | Distinguish a course that broke from one that's always been hard | Keep — excellent as-is |
| "Content vs teaching" gap (`termGapLeo`) | "Is it the content or the delivery?" | Route to curriculum vs. coaching | Keep — mirrors By Course's insight from the other axis |
| "Where [term] needs attention" table | "Who hasn't responded yet?" (Nudge) / "What have I noted about this row?" (note) | Nudge non-responders (existing) **conditionally shown** — only when response < target; **NEW** note action for score-only problems | Revise + add |
| "Courses in [term]" table | "Which specific course/offering is this?" | Open the survey card / drill to course | Keep |

## Explicitly out of scope for this pass

- Overview tab (not part of the ask)
- Comment-to-faculty, escalate actions (bigger build — notifications, visibility rules, escalation routing; internal note is the v1 cut)
- A real Benchmarks system (`Specs/pce/specs/2026-06-29-live-vs-local-gap-analysis.md` flags this as unbuilt) — reference lines stay derived from the program median, as today
- Edit/delete on internal notes
- Retrieving Monil's full analytics PRD (not found in vault or repo — proceeding on the 2026-07-13 transcript + this spec's own requirements analysis; flag to Romit if the PRD surfaces later and contradicts anything here)

## Verification plan (this workspace's Gate 2)

- `ds-adoption-reviewer` before writing the three new shared component files
- `visual-diff.mjs` against `/results/[id]` immediately after extraction, before any analytics-side changes
- `state-review` on the notes feature (empty/composing/list states) across all three tabs
- `ds-conformance-reviewer` on all three tabs after changes (DS tokens, axe, WCAG/FERPA)
- Grep-verify every claimed change (Pattern G) before any done claim
- Two-tier verdict (GREENLIGHT static vs. runtime) per this workspace's standard

## Implementation sequencing

By Faculty first (Monil: "the most important tab"), then By Course, then By Term — each gets its own implementation plan and its own done-claim/verification pass, but all three share the extracted components from day one so there's no rework porting the vocabulary tab-by-tab.
