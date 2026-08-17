# Course Evaluation — Aug 12 Session 2 Action Plan (Why / What / Priority)

- **Date written:** 2026-08-17
- **Source:** "Course evaluation survey — roles, status tracking, and response rate thresholds," 2026-08-12, 1:39 PM, Granola id `0ef80c33-115a-4909-b408-a7909785c41d`. Raw transcript pulled directly (`get_meeting_transcript`), read twice.
- **Supersedes for action-planning purposes:** the Session-2 rows of `2026-08-17-aarti-aug12-gap-analysis.md` (that doc covers all three Aug 12 sessions and is the canonical code-audit source — this doc narrows to Session 2, adds the why, and ranks by priority for planning).
- **Author's role:** this is a synthesis of stakeholder input, not a build order. Per `[[project_pce_team_monil_pm]]`, Aarti's and Monil's directives are input — judgment on scope/sequencing is Romit's. Nothing below should be built without Gate 1 (vault + `pce-ui-patterns.md` + `ds-adoption-reviewer`) for the item picked up.

## Transcript reliability caveat — read before treating any line below as a verbatim quote

This call's Granola transcript has **no speaker-turn separation** — every line is dumped under a single `Me:` label; unlike the 9:30 AM session that day, `Them:` never appears once. So unlike a normal transcript pull, individual lines below are **attributed by content/voice analysis, not by a diarization tag**. Evaluative, requirement-setting statements ("I want to ask the team to specify three levels," "the headers here should match," "extension should be highlighted") read as Aarti's reviewer voice, consistent with her confirmed sessions; descriptive, build-status statements ("I created like a faculty view," "I'll update this," "I'll take care of it") read as Romit's. The *content and decisions* are reliable — two people are clearly negotiating a design across this transcript — but exact phrase-level attribution carries some inference risk. Flag any line below to Romit for correction if it reads wrong.

---

## Priority model

| Tier | Meaning |
|---|---|
| **P0** | Blocks other work; contradicts an existing named directive; needs a stakeholder decision before any code is written |
| **P1** | Real, scoped gap; no conflicting prior decision; ready to design/build now |
| **P2** | Partial — plumbing or most of the surface already exists; cheap to close |
| **P3** | Large net-new surface; needs its own design pass, not a patch |
| **Unverified** | Raised in the transcript but not yet checked against current code — needs an audit pass before it can be prioritized at all |

---

## P0 — Decision required before building anything

### 1. Response-rate validity model: three-band red/orange/green vs. the standing no-red rule

**Why this needs to change (or why it might not):** Aarti described a specific mental model — two independently-editable thresholds (a *minimum validity* floor and a *desired participation* target) with the space between them color-coded red/orange/green, so an admin can tell at a glance whether a response rate is even statistically usable, on its way to ideal, or already there: *"below that number, the survey is not... valid... it cannot be effectively used"* and *"based on those two numbers, you can set the color to be the red orange or green."* This isn't cosmetic — she ties it directly to a downstream product rule: a faculty's rating can't be used in comparative analytics until the survey crosses the validity floor (*"you won't be able to compare faculties rating in one versus the faculties rating in the other... it's not crossed that threshold for it to be a comparable rating"*). Without this, admins currently have no way to tell whether a shown percentage is trustworthy for comparison, and there's no product-level distinction between "green because it's high" and "green because someone marked it in review" — a confusion she explicitly called out on the live screen (*"92%... I don't know if it's showing green because of the percentage or because it have been marked as in review"*).

**What conflicts:** `lib/pce-results.ts:260-264`'s `rateColor()` already implements a two-tier, **no-red** model, with a comment that names her directly as the source of that rule (`aarti_no_red`) — the cross-product "no red in score/rating viz" directive (first stated 2026-04-28, reaffirmed Jun 10 PCE brief). Building her Aug 12 ask literally reverses a rule currently attributed to her own name. It's plausible the two are reconcilable — "red" as a *data-validity* signal is a different claim than "red" as a *performance judgment* — but that's a call for her/Monil to make explicitly, not something to infer silently either direction.

**What (once decided):**
- Add a real two-threshold config: `validityThreshold` (floor, school-editable, default TBD — she floated 30–50 in different parts of the call) and `desiredThreshold` (target — she referenced 70 as the number "we were having this conversation" about, and separately floated 80).
- Reconcile against the *four* different single-cutoffs currently scattered and disagreeing: `AT_RISK_THRESHOLD = 60` (`pce-at-risk.ts:9`), `EVAL_RELEASE_THRESHOLD_PCT = 60` (`pce-mock-data.ts:130`), `RESPONSE_TARGET = 70` (`pce-term-metrics.ts:21`), `80` (`pce-analytics.ts:97`) — these need to collapse into the same two-threshold model, not keep existing in parallel.
- Once a survey is below the validity floor, gate it out of comparative analytics (not out of raw comment visibility — she was explicit: *"it's not like until that hits, you are not able to read the comments, but you're not able to use it in a competitive analysis"*).

**Priority:** P0. Everything downstream of "what does a response-rate percentage mean" (the term workspace, results comparisons, the dashboard KPI band) reads off whatever model wins here.

### 2. Response-rate scope: survey-level vs. per-aspect

**Why:** Same conversation, same root cause. Aarti flagged that showing course-material and faculty as separately-tracked response rates within one offering is the wrong default: *"there are 20 cases where you will see... a breakdown of like a course offering to course and faculty... But it will be just surveys... that's the design update that I'll be making today."* Her reasoning: a student fills the whole survey in one sitting in the common case, so response rate is a property of the *survey*, not each aspect inside it.

**What conflicts:** `EvaluationInstance` (`pce-mock-data.ts:11-29,361-365`) still tracks `course_material` and `faculty_roles` as independently-rated aspects, each with its own `responseRate` — the per-type model this call was pushing back on. This is also flagged as a load-bearing decision in `[[project_pce_per_type_evaluation_status]]` (Romit, Jul 17: "one offering runs 3 evaluation types, each own status") — i.e. there's a **second named prior directive on the opposite side of this same question**, from Romit himself, more recent in build terms than this transcript is old.

**What (once decided):** collapse `EvaluationInstance` response-rate tracking to survey-level, OR explicitly reconfirm the per-type model and treat Aug 12 as superseded/misread. Either way, resolve in the same conversation as item 1 — they're the same underlying "what does response rate mean" question, and the color-coding in item 1 needs the scope decided first.

**Priority:** P0, bundled with item 1.

---

## P1 — Real gaps, no conflict, ready to build

### 3. Board and grid status vocabulary must match exactly

**Why:** Same information, same underlying survey, rendered with different labels depending on which view an admin has open — she caught it live, comparing the grid's "Draft" against the board's differently-worded equivalent, and "Closed pending review" (grid) against "In review" (board): *"the headers here should match the statuses there because it's the same information that is being displayed either as a grid or as a board... there needs to be consistency in the table view versus the board view."* She explicitly declined to arbitrate which label wins (*"I'm not giving you my point of view on whether you should call it closed pending review or in review... for you guys to debate"*) — only that they must agree.

**What:** `surveys-table.tsx:75-81` keeps seven statuses distinct in its filter; `term-evaluations-board.tsx:85-100` and `surveys-hub.tsx:53-64` each bucket/label them differently. Pick one canonical status→label map, consume it from all three surfaces.

**Priority:** P1 — contained, no design ambiguity, just needs the single source of truth built and adopted.

### 4. Faculty avatar role-color-coding (Program Director visually distinct)

**Why:** She wants an admin to be able to tell at a glance whether a shown avatar is someone with program-wide visibility versus someone only affiliated with this one course, without reading names: *"program director who has that senior program complete visibility across everything can be shown in a different color. People who have just affiliation to that course can be shown in a different color icon."*

**What:** `PceInstructor.position` (`pce-mock-data.ts:342`) already carries `'Program Director'` as real fixture data (`f3`, line 2358) — no schema change needed. `faculty-avatar-row.tsx:24-42` already has a header comment citing this exact meeting, so the ask was read and partially built (the avatar cluster, hover names, "+1" overflow all shipped), but every avatar still renders identically — no color branch exists. Per the fuller code audit's scoped fix (§3a of the Aug 12 gap-analysis doc): key off `position === 'Program Director'`, use a DS chart-family token (not `--brand-color` — reserved for CTAs per `[[feedback_ds_typography_color_discipline]]`) as a ring/dot accent, and extend the existing hover tooltip to state the role in text too (color alone can't be the only signal, WCAG).

**Priority:** P1/P2 — narrowly missed on the original build pass, single file, fix is already scoped.

---

## P2 — Partial, cheap to close

### 5. Archive/undo a mistakenly-activated survey

**Why:** She raised a real operational gap: an admin who fat-fingers a survey live (wrong faculty attached, wrong course activated) currently has no way to stop it — *"I made a mistake. I attached the wrong faculty to the wrong course or I activated the course that was not going to be offered this semester... there has to be a way to say I made a mistake."* She was specific about the verb: not "delete," but **archive/inactivate** (*"I think instead of delete, I would say archive... meaning like you don't want any more students to fill it"*).

**What:** `archiveSurvey`/`cancelSurvey` already exist in state (`pce-state.tsx:140,146,271-279`) with `archivedAt` fields on the models — but there is zero UI call site. Needs a row/menu action wired to the existing function.

**Priority:** P2 — the hard part (state + data model) is already done; this is a UI wiring task.

---

## P3 — Large net-new, needs its own design pass

### 6. Five-role model (Super User / Admin–Setup / Admin–Content / Course / Course Affiliation)

**Why:** Current RBAC is binary (`admin`/`faculty`), but the actual permission surface she described is five roles split along two axes — a catch-all Super User, then Admin split into **setup** (dates, templates, faculty association, email — everything except content) and **content** (feedback/results), then Course and Course Affiliation (pre-existing). This isn't just a permissions list — she flagged it changes what each role's *home screen* looks like on login (*"it is how a particular role, when they log into the product, are going to..."*), and noted she'd need a separate discussion with Vishal since it touches more than this one screen.

**What:** `UserRole = 'admin' | 'faculty'` (`pce-mock-data.ts:3`) is the entire current model. The only multi-role construct in the codebase is `step-report-access.tsx:17-34`'s 6-key results-visibility checklist — a per-template visibility matrix, not an RBAC system, and not a substitute for one.

**Priority:** P3. No design work has started. This will interact with `step-report-access.tsx` (results visibility) and likely the archive-action (item 5) permissions, so sequence it after the P0/P1 items above, not before.

---

## Unverified — raised in the call, not yet checked against code

| Item | What she said | Why it matters |
|---|---|---|
| Trend viz vs. previous offering, not a static program-average delta | Not directly quoted in this excerpt but referenced as part of the same design-review thread across the three Aug 12 sessions | Affects whether `results/[id]/page.tsx` and the analytics charts compare a course against the right baseline |
| Percentile ranking as a comparison alternative | Same | Would need reconciling against the existing **no-percentile** decision in `[[project_pce_faculty_view]]` (D-4: "no peer comparison AND no percentile — a percentile reverse-encodes peer rank") — a likely second P0-style conflict if pursued |
| Smart nudge ("extend by 3 days → expect +2–3 completions") | Same | Net-new predictive feature, not scoped anywhere yet |

**Action:** audit `results/[id]/page.tsx` + the analytics chart components before scoping any of these — don't design against an unverified premise.

---

## Recommended sequencing

1. **Take items 1+2 to Aarti/Monil together, as an explicit either/or**, not a unilateral pick — this is the one place Session 2 directly contradicts a named prior directive (twice: once against the no-red rule, once against Romit's own per-type evaluation model). Resolving this also unblocks the color logic and scope for the entire response-rate surface.
2. **Item 3** (status vocabulary) — build now, no blockers.
3. **Item 4** (avatar color) — build now, already scoped, single file.
4. **Item 5** (archive UI) — build now, cheapest possible close since the state layer exists.
5. **Item 6** (5-role RBAC) — schedule as its own design pass once 1–5 are clear, since it will reshape navigation/permissions broadly rather than one surface.
6. **Unverified row** — audit before any of the three items get scoped as work.

Per workspace protocol: none of P1–P3 should produce JSX without Gate 1 (vault + `pce-ui-patterns.md` + `ds-adoption-reviewer`) run first on whichever item is picked up.
