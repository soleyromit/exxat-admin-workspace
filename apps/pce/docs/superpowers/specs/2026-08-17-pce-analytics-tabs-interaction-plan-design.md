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

## Cross-cutting requirements (apply to all three tabs)

### 1. Visual vocabulary — port `/results`' decluttered pattern

All three tabs currently use `KeyMetrics variant="compact"` tiles and Recharts `LineChart`s with visible `ChartLegend`s. `/results/[id]` (2026-07-18 declutter) uses a different, more mature vocabulary that was never ported: `ScoreTile` (photo identity, hero value + delta chip in teal-up/amber-down, never red, caption row), `Popover`-based stat detail instead of tooltips-only, no chart legends (marks + `Popover` teach instead).

**Extraction (Approach A, approved) — shared components, not duplication.** `ScoreTile`, `PopoverStatRow`/`PopoverSection`, and the photo-marker scale-track plot are currently defined *inline* in `results/[id]/page.tsx`, not exported. Extract to `components/pce/`:
- `components/pce/score-tile.tsx`
- `components/pce/popover-stat.tsx`
- `components/pce/scale-track-plot.tsx` (narrow public API: data + optional highlighted-person, so both surfaces can configure it without reaching into internals)

`results/[id]/page.tsx` changes to *import* these instead of defining them inline — behavior-preserving refactor. Verify with `visual-diff.mjs` against the current `/results` page immediately after extraction, before any analytics-side changes, so the refactor is confirmed non-regressive independent of everything built on top of it.

**Apply across all three tabs:**
- Every KPI tile → `ScoreTile`.
- Faculty leaderboard's dot-strip, "Who taught it" leaderboard dots → `scale-track-plot` (photo identity replaces plain colored dots / initials).
- Program trend chart's `ChartLegend` → removed. The two lines (course avg, faculty avg) already have distinct colors and the `ChartTooltip`/`ChartLeoPlotInsightOverlay` already teach on interaction — a legend is redundant per the `/results` rubric ("marks + popovers teach, not legends").

### 2. Aggregate KPI band — missing on By Faculty and By Course

By Term already opens with a KPI band (`byTermKpis`, before any chart) — this is the settled model (2026-07-13: KPIs → trend → deep-dive). **By Faculty and By Course both skip straight to the leaderboard/selector with no aggregate view.** Add, for each:

- **By Faculty:** `# below median`, `# below response target`, program avg faculty score — reduced from `facultyStats()`, which the leaderboard already computes. No new data-layer function.
- **By Course:** `# below median`, `# below response target`, program avg course score — reduced from `courseStats()`, same reasoning.

Both sit above the leaderboard/selector, answering "how many need attention, program-wide?" before the reader picks one.

### 3. By Faculty needs a course-variance insight — the mirror of `courseFacultyLeo`

By Course already asks, per course: "does this course's score depend on WHO teaches it?" (`courseFacultyLeo`). By Faculty has no symmetric insight asking, per person: "does this person's score depend on WHICH COURSE they teach?" That's a real, missing comparative insight — not a new capability, just the same `courseFacultyLeo` pattern computed from the other axis (group a selected faculty member's offerings by `courseCode` instead of by `facultyId`, same spread/staffing-vs-content framing, reworded for the person axis: "consistently good/struggling across courses" vs. "one specific course is dragging the average"). Lives in `ByFacultyPanel`'s selected-faculty section, same position `courseFacultyLeo`'s chart occupies in `ByCoursePanel` (after the KPI strip, alongside the existing portfolio charts).

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

- **Quadrant/gap scatter** (By Term's "Content vs teaching"): validated by Zoho CRM's "Revenue vs Deals" quadrant chart (labeled axes, dashed divider, plotted dots) and TheyDo's 2×2 opportunity matrix, which additionally **sizes each bubble by a third variable**. Adopt that: size each course's dot by enrollment, so a 200-student outlier reads differently from a 12-student one — currently all dots are fixed-size.
- **KPI tile with inline trend**: Later, Whop, and Navattic all pair a stat number with a small sparkline directly beneath it, not just a static delta. This workspace's own `pce-ui-patterns.md §0.2` already names "MicroTrend sparkline" as a pattern (`"Is this course improving, stable, or declining?"`) but it's never been applied at the analytics-tab level. Add a 2–3 point sparkline to the rating `ScoreTile` wherever `avg1y`/`avg3y` exist.
- **Ranked leaderboard with drill-in**: 15Five's "My team at a glance" (named rows, last-interaction, avg score) and X's plain rank/name/stat table both validate the existing Cleveland-dot leaderboard + ranked-row pattern — no change needed to the shape, just the visual vocabulary port (Section above).
- **Internal note thread**: Employment Hero's comment-on-goal pattern (author, timestamp, body, chronological) validates the internal-note shape in Section 3 above.
- **Slope chart** (By Term's "What moved"): no strong external analog surfaced — this is a Tufte-style slopegraph, more common in analyst/BI tooling than consumer SaaS. Keeping it as-is; it's already well-built and answers a real question (`termSlopeLeo`), just noting the external check came up empty rather than skipping it.

Full mark-by-element table:

| Tab | Element | Mark | Note |
|---|---|---|---|
| Faculty | Aggregate KPI band | `ScoreTile` + inline micro-sparkline | New — sparkline validated externally, see above |
| Faculty | Leaderboard | Cleveland dot plot, photo-identity marks (`scale-track-plot`) | Existing shape, visual-vocab port only |
| Faculty | Scores/response over time | Dual-line chart, legend removed | Content fix only |
| Faculty | Selected-person KPI strip | `ScoreTile`, rating tile gets sparkline from `avg1y`/`avg3y` | |
| Faculty | Course-variance insight (new) | Reuse `FacultyLeaderboardDots`, axis flipped to courses | Not a new chart type |
| Faculty | Internal note | Comment-thread list | |
| Course | Score trend | Existing `CourseTrendStack` | Unchanged |
| Course | "Who taught it" | Existing Cleveland dot leaderboard | Unchanged |
| Term | Program trend | Dual-line, legend removed | |
| Term | Cohort row | Waffle pictogram + Cleveland dot distributions | Already correct |
| Term | "What moved" | Slope chart (two-point connected lines) | No external analog found; keeping — already well-built |
| Term | "Content vs teaching" gap | Quadrant scatter, dots sized by enrollment | Enrollment-sizing is new, validated externally |

## Section — Question/action map, by tab

### By Faculty

| Element | Question answered | Action prompted | Status |
|---|---|---|---|
| **NEW** Aggregate KPI band | "How many faculty need attention, program-wide?" | Triage — decide whether to drill in at all | Add |
| Faculty leaderboard (scale-track + ranked list) | "Who is furthest below median, and trending down?" | Pick who to investigate next | Keep, port visual vocab |
| "Scores over time" / "Response rate over time" | "Is the faculty POOL improving or declining as a group?" | Escalate a program-wide trend, not an individual | Keep, retitle (currently reads as one-person; it's a cohort chart) |
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
| KPI strip | "Is this course healthy right now?" | Decide if a redesign conversation is warranted | Keep, → `ScoreTile` |
| Score trend (Leo) | "Is this course sliding across offerings, or one bad term?" | Investigate a multi-term slide | Keep, drop legend |
| "Who taught it" (`courseFacultyLeo`) | "Is a low score a STAFFING problem or a CONTENT problem?" | Route to a staffing conversation or a content redesign | **Keep as-is — best-designed insight on the page** |
| Offerings table | "Which offering is driving this?" | Open the survey card | Keep |
| **NEW** Internal note | "What have I already noted about this course?" | Record a follow-up flag | Add |

### By Term

| Element | Question answered | Action prompted | Status |
|---|---|---|---|
| KPI band | "Is the program healthy this term vs. last?" | Decide if intervention is needed now | Keep, → `ScoreTile` |
| Program trend | "Improving structurally (content) or interpersonally (teaching)?" | Distinguish a curriculum push from a faculty-development push | Keep, **remove legend** |
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
