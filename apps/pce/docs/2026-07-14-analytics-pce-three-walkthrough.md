# Analytics walkthrough — `pce-three.vercel.app` (legacy prototype)

**Date:** 2026-07-14 · **Author:** Claude (browser walkthrough) · **Status:** Reference-app study — intent mining

---

## Scope — what this surface is

`pce-three.vercel.app` is the **legacy reference app** — the live IA we study and design against.
It is deliberately not ours: **nothing here is built from `apps/pce/admin`**. This doc walks it to
mine intent, which is what it's for. The checks below just pin down *how far* it has diverged, so
nobody reads a finding here as a bug in our code.

Evidence it shares no lineage with our tree:

| Check | Result |
|---|---|
| `git log -S "Marcus Williams" --all` | **no hits** — never existed on any branch |
| `git log -S "OT-401" --all` | **no hits** |
| `git log -S "Term Summary" --all` | **no hits** |
| Analytics tabs in repo (`app/(app)/analytics/page.tsx:22`) | `'term' \| 'faculty' \| 'course'` — **no `overview`** |
| `page.tsx:21` comment | `// 'overview' retired Jul 2026 — the monitoring layer moved to the Dashboard home.` |
| Query params repo reads | `courseCode=`, `facultyId=` — **not** the `course=` / `faculty=` that `pce-three` uses |

So `pce-three` is an **earlier, separate generation** of the product — consistent with its known
status as the legacy reference app. Our current build at `exxat-pce-design.vercel.app/analytics` is a
different design entirely (3 tabs, Term/Cohort toggle, Leo AI-insight block, Prism branding, Johns
Hopkins tenant).

**Read §2 and §6 for intent worth borrowing. Read §4 and §5 as observations about the reference app —
not as defects in our code.** The two are related only where we might copy a mistake.

---

## 1. Where Analytics sits

```
Course Evaluations
├── Dashboard
├── Templates
├── Analytics          ← this doc
│   ├── Overview       ?tab=overview
│   ├── By Faculty     ?tab=faculty
│   ├── By Course      ?tab=course
│   └── By Term        ?tab=term
└── Settings
General Surveys
Directory
```

Four sub-nav rows, one query param. Shell: `Exxat · Course Evaluations & Surveys`, tenant
`State University / Physical Therapy`, user `Dr. James Thornton (Admin)`.

---

## 2. The four surfaces

### 2.1 Overview — `?tab=overview`

**Intent: the "brief me on the program" landing.** Answers *how is the program doing, who is
struggling, where's the gap* without a filter choice. It's the only tab with no entity selector —
scope is set by a global time-range dropdown (`Last Term / 1Y / 3Y / 5Y / All Time / Custom Range`),
defaulting to **3 Years**.

Composition, top to bottom — a deliberate **aggregate → rank → pattern → raw** funnel:

```
┌─ Aggregate Breakdown ──────────────────────────────────────────┐
│  By Course        │  By Faculty       │  By Term               │
│  8 evaluated      │  5 evaluated      │  4 terms               │
│  4.00 avg         │  4.02 avg         │  80% response          │
│  50% below bench  │  40% below bench  │  5% below threshold    │
└────────────────────────────────────────────────────────────────┘
        ↑ three cards mirror the three other tabs = table of contents
┌─ Faculty Leaderboard ─── ranked, 5 rows, Export CSV ───────────┐
┌─ Course Leaderboard ──── ranked, 8 rows, Export CSV ───────────┐
┌─ Course Score by Term ── heatmap, 8 × 4, cells link to results ┐
┌─ Gap Analysis ────────── scatter, quadrants                    ┐
┌─ Survey Details ──────── 22 rows, the raw grain                ┐
```

The three Aggregate cards are the cleverest move here: they double as **a preview of and a table of
contents for the other three tabs**. Each card's three KPIs are *count / average / % below
benchmark* — the same rhetorical shape three times, so one glance compares dimensions.

**Benchmarks are explicit, not implied:** `< 4.00 avg score`, `< 4.11 avg score`, `< 70% response
rate`. Each tile states the threshold that produced its percentage.

**Gap Analysis** is the most interesting artifact on the whole surface. Course score (x) vs the
teaching faculty's overall score (y), bubble sized by response count, dashed lines at the program
average (4.02), quadrants labelled:

```
        Faculty ↑
   Faculty Strong  │  Both Strong
   / Course Gap    │
  ──────────────── ┼ ──────────────── Course →
   Both Need       │  Course Strong
   Attention       │  / Faculty Gap
```

**Intent:** separate *"the course is broken"* from *"the instructor is struggling"* — two problems
with completely different interventions (redesign the curriculum vs coach the person). That is a
genuinely sophisticated question to encode in a chart, and it's the one thing here with no
equivalent on the current build.

### 2.2 By Faculty — `?tab=faculty`

**Intent: the person-centric review surface** — a chair preparing for a faculty review.

- Filters: `Faculty (primary)` + `Faculty Role` + an expandable **Filters** disclosure revealing
  `Term` + `Course`. Primary/secondary filter split is explicit in the label `(primary)`.
- KPIs (4): Surveys 22 · Avg Score 4.02 · Response Rate 80% (`614 of 771 responded`) · Faculty with data 5.
- **Score Trends** — two side-by-side line charts (score by term; response rate by term), one line
  per faculty, with reference lines: `Program avg` on scores, `Target 80%` on response rate.
  **Intent:** never show a number without the bar it's judged against.
- **Course × Term Heatmap** — same component as Overview.
- **Theme Distribution** — Teaching effectiveness 4.18 / Communication 4.13 / Assessment practice 3.95.
- **Student Voice** — the payload. Per course/term: an AI-written synthesis paragraph, then verbatims
  split `COURSE MATERIAL` vs `INSTRUCTOR FEEDBACK`, each comment tagged `Positive / Constructive / Neutral`.

Selecting a faculty adds an **identity card** (avatar, name, role badge, email, Avg Score, Response
Rate, trend vs prior term) above the KPI strip.

**Intent behind Student Voice:** the quant scores tell you *that* 3.58 happened; the verbatims tell
you *why*. Splitting course-vs-instructor comments is the same course/faculty disentangling that Gap
Analysis does — the theme runs through the whole tab.

### 2.3 By Course — `?tab=course`

**Intent: the curriculum-committee surface** — is *this course* working, regardless of who taught it.

- Filter: `Course (primary)` + Filters disclosure.
- KPIs: only **2** (Number of Evaluations, Average Course Score) — vs 4 on the other tabs.
- `Course Score by Terms` (all courses) + `Response Rate Trend` (empty until a course is picked:
  *"Select a course to see its trend."*).
- **Student Voice** here is restructured vs the faculty tab: grouped **by survey question**
  (*What did you like most about this course?* / *What could be improved?* / *Additional comments*)
  with sentiment filter chips `All (32) / Positive (13) / Constructive (16) / Neutral (3)`.
- All Surveys table adds `Enrolled` + `Responded` columns (faculty tab omits them).

**Intent:** same raw comments, re-cut by the axis the persona cares about. Faculty tab groups by
*theme about the person*; course tab groups by *the question asked*. Deliberate, and it works.

### 2.4 By Term — `?tab=term`

**Intent: the longitudinal / accreditation surface** — is the program improving over time.

- Filter: `Term (primary)` only — **no Filters disclosure**, unlike faculty/course.
- KPIs (4): Terms tracked 7 (`24 surveys total`) · Avg Response Rate 80% (`↑3% vs prev term`) ·
  Avg Score 4.01 (`↑0.1 vs prev term`) · Total Responses 873.
- Two charts, each with a **reference line** (`Target 4.0`, `Target 80%`) and — the nice part — a
  **per-term chip row under the chart** restating each value with its delta:

```
  Fa 2024   Sp 2025   Fa 2025   Sp 2026
   3.90      4.05      4.00      4.10
             +0.15     -0.05     +0.1
```

  **Intent:** the sparkline shows shape, the chips give exact values + direction. Viz first, text
  annotates — this is the one place the surface does that well.

- **Term Summary** table lists **all 7 calendar terms including empty ones**, with `— — — —` and a
  disabled *No data* action for Spring 2024 / Summer 2024 / Summer 2025. Footer: `7 terms · 4 with
  survey data`.

  **Intent:** absence is information. A gap year of evaluations is an accreditation finding, so empty
  terms are rendered rather than filtered out. Defensible and arguably the right call.

---

## 3. Drill-down graph — what links where

| From | Link | Goes to | Works? |
|---|---|---|---|
| Faculty Leaderboard | `View Insights` | `?tab=faculty&faculty=m.williams%40university.edu&facultyName=Dr.+Marcus+Williams` | ✅ filters → `4 surveys / 4.38` |
| Course Leaderboard | `View Insights` | `?tab=course&course=DPT-503` | ✅ filters → `4 evaluations / 4.38` |
| Heatmap cell `OT-401 / Fa 2025` | `view →` | `/results/result-006` | ✅ opens result |
| Survey Details `Sp 2026 / DPT-503` | `View Results` | `/results/result-007` | ✅ opens result |
| Result page | `View Longitudinal Insights` | `?tab=course&course=OT-401` | ✅ filters → `4 evaluations / 3.81` |
| **Term Summary `Spring 2026`** | **`View Analytics`** | **`/analytics?term=Spring%202026`** | ❌ **broken — see below** |

Rows marked ✅ were each clicked and the resulting URL + rendered state recorded.

**The one broken link:** Term Summary's `View Analytics` drops `tab=term`, lands on **Overview**, and
`?term=` is **ignored** — Survey Details still shows all **22 rows** across all four terms, and the
KPIs are byte-identical to unfiltered (8 / 4.00 / 4 terms). Since `?course=OT-401` *does* filter
correctly, this is a genuine bug, not a design choice: term is the only drill-down axis not wired.

**Round-trip intent:** every aggregate is meant to be a door — leaderboard → filtered tab → result
page → back to filtered tab. The loop closes everywhere except term.

---

## 4. Data integrity — the numbers disagree with each other

These are the observations that matter most if this prototype is ever mined for a rebuild.

| # | Contradiction | Evidence |
|---|---|---|
| 1 | **Unlabelled scope collision** (not a maths error — corrected on second pass). Faculty identity card reads **4.55 / 84%**; the KPI strip directly below reads **4.38 / 81%**. Both are *correct*: the card shows the **latest term** (Sp 2026 = 4.55 / 84%), the strip shows the **all-time mean** (`(4.20+4.32+4.44+4.55)/4 = 4.38`; `78+81+82+84 → 81%`). Neither states its scope, and the card's label just says `Avg Score`. Two different questions answered in the same visual breath, 6 px apart. | `?tab=faculty&faculty=m.williams@…` |
| 2 | **`4 courses` is simply wrong.** KPI reads `SURVEYS 4 / 4 courses`, but all 4 surveys are the *same* course (DPT-503 across Fa24→Sp26) — the heatmap shows one row and All Surveys shows 4 DPT-503 rows. The Overview leaderboard agrees with reality (`Professor · 1 course`). The strip is counting surveys and labelling them courses. | faculty tab vs heatmap + All Surveys |
| 2b | **Student Voice cites a course the survey log doesn't have.** Filtered to Williams, Student Voice renders `DPT-501 · Musculoskeletal Anatomy I · Spring 2026 · 4.65`, but neither the Course × Term heatmap nor All Surveys (4 rows, all DPT-503) contains DPT-501 for him. The verbatim feed and the survey log disagree about what he taught. | faculty tab, filtered |
| 3 | **Survey total disagrees.** By Term: `24 surveys total` (4+5+7+8). Every other tab: `22 rows`. | By Term KPI vs Survey Details |
| 4 | **Term count disagrees.** Overview: `TOTAL TERMS EVALUATED 4`. By Term: `TERMS TRACKED 7`. | Both defensible (7 = calendar, 4 = with data) but unlabelled on Overview |
| 5 | **Avg score disagrees.** By Term `4.01`; Overview/faculty `4.02`. | Rounding or different denominator |
| 6 | **Response rate disagrees across surfaces — but only sometimes.** Analytics: Fall 2025 OT-401 = **82%** (`28 enrolled / 23 responded`). The result page it links to: **71% (20 of 28)** — enrolled matches, responded doesn't. Yet Spring 2026 DPT-503 reads **84%** on *both* analytics and `/results/result-007` (`32 of 38`). So this is a per-record drift, not a systematic offset — which makes it harder to spot and worse. | heatmap → `/results/result-006`; Survey Details → `/results/result-007` |
| 7 | **Term dropdown ≠ Term table.** Dropdown offers 4 terms; the table lists 7. | By Term |
| 8 | **Duplicate dropdown options.** `DPT-518`, `DPT-527`, `DPT-542`, `DPT-556`, `DPT-522`, `DPT-535` each appear **twice** in the Course selector. | By Course |

Root cause is almost certainly that each panel computes from its own mock slice with its own
weighting (the current repo has the same class of problem — `analytics-panels.tsx:626-627` averages
completion unweighted while `:296-298` weights by enrollment). This is exactly what the
**centralized-list-dataset** rule exists to prevent: one canonical dataset, all views derive.

---

## 5. Design observations

Against the workspace rules and saved decisions:

1. **Red in score viz** — the heatmap ramp runs red → amber → green, and Gap Analysis paints
   *Both Need Attention* red with red quadrant labels. Saved decision: **Aarti dislikes red in
   score/rating viz** — amber/orange for below-threshold. Direct conflict.
2. **Progress bars as the default** — Theme Distribution (faculty tab) and Theme-wise Distribution
   (result page) are both plain horizontal bars. Rule: *progress bars are last resort*; bars are for
   0→100% in-flight, not for a 1–5 rating. A dot plot or bullet chart against the program average
   would say more in the same space.
3. **Color carrying no meaning** — Theme Distribution's three bars are blue / teal / purple for three
   values on one identical scale. Colour encodes nothing; it reads as decoration.
4. **Gap Analysis is half-width** — the scatter renders in a card occupying only the left ~half of
   the content area, with dead space to its right. Looks like a missing grid wrapper, not intent.
5. **Theme Distribution leaves a large empty panel** — three bars in a card sized for far more.
6. **Line chart plunges to the axis floor** for terms with no data instead of breaking the series —
   `Course Score by Terms` with All Courses is unreadable spaghetti, with lines diving off the
   bottom. Needs `connectNulls={false}` and a clamped domain.
7. **Inconsistent filter model across four sibling tabs** — Overview has a time-range dropdown and no
   filters; Faculty has 2 selects + disclosure; Course has 1 select + disclosure; Term has 1 select
   and no disclosure. Four tabs, four filter grammars.
8. **KPI count inconsistent** — 4 / 4 / **2** / 4 across the tabs.
9. **Email as URL identifier** — `?faculty=m.williams%40university.edu` puts a person's address in
   the URL (and thus history/logs/referrers). Should be an opaque ID.
10. **Generic breadcrumb** — result page reads `Results / Result 006` rather than the course name.

---

## 6. What's worth keeping

If any of this is mined for the current build:

- **Gap Analysis** (course-vs-faculty quadrants) — the sharpest idea here; nothing equivalent exists
  on the current deploy.
- **Explicit benchmarks on every KPI** (`< 4.00 avg score`) — states the threshold that produced the number.
- **Per-term chip row under the trend chart** — shape from the line, exact values + deltas from the chips.
- **Rendering empty terms** — absence as an accreditation signal.
- **Re-cutting the same verbatims by persona axis** — by theme for faculty, by question for course.
- **Reference lines everywhere** (`Program avg`, `Target 80%`).

What the current build has that this lacks: the **Leo AI-insight block** (themes → course codes →
representative quote → counts), which compresses what Student Voice spends thousands of words on.

---

## 7. Coverage vs the ADMIN task list

The 20 high-level tasks mapped against what the reference app actually renders.
**PRESENT** = built and does the job · **PARTIAL** = there, but misses part of the ask ·
**MISSING** = no equivalent on that surface.

**Tally: 10 PRESENT · 5 PARTIAL · 5 MISSING.**

### Analytics — Overview (8 tasks) → 3 present · 2 partial · 3 missing

| Task | Verdict | Where / gap |
|---|---|---|
| Key numbers: avg faculty score, course score, overall response rate | **PRESENT** | Aggregate Breakdown — `4.02` faculty, `4.00` course, `80%` response |
| Heat map of course quality across terms | **PRESENT** | `Course Score by Term`, 8 × 4, cells deep-link to results |
| Interactive chart comparing course vs faculty scores *(marked NEW)* | **PRESENT** | **Already built** — `Gap Analysis` scatter with quadrants. Tagged NEW on the list, but the reference app has it; see §2.1 |
| Flag faculty needing attention, on **1-year and 3-year** trends | **PARTIAL** | Faculty Leaderboard has `Last Term Average`, `3Y Avg Faculty Score`, `Trend` — but **no 1Y column**. No per-row alert; "needs attention" is only the aggregate `40% below benchmark` |
| Flag courses needing attention due to low scores | **PARTIAL** | Course Leaderboard ranks and carries `1Y` + `3Y` — but **no Trend column** and no per-row flag. Only `50% below benchmark` in aggregate |
| Chart overall response rate over time | **MISSING** | Overview has **no time-series chart at all** |
| Chart average faculty scores over time | **MISSING** | ⤷ same — lives on By Faculty instead |
| Chart average course scores over time | **MISSING** | ⤷ same — lives on By Term instead |

> **The one structural gap.** Three of eight Overview tasks ask for trend lines, and Overview has
> zero. The heatmap shows scores *across* terms but reads as a matrix, not a trajectory. The charts
> exist — they're just on By Term and By Faculty. Whoever wrote these tasks expects Overview to
> answer *"which way are we heading"*; the reference app makes you leave Overview to find out.
>
> Note the leaderboards are **asymmetric**: faculty gets `Trend` but no `1Y`; course gets `1Y` but no
> `Trend`. Neither is complete, and they're incomplete in *opposite* directions — which is what makes
> both "flag who needs attention" tasks land on PARTIAL.

### By Faculty Analytics (4 tasks) → 3 present · 1 partial

| Task | Verdict | Where / gap |
|---|---|---|
| Chart breaking down each faculty member's scores by theme | **PRESENT** | `Theme Distribution` — **verified it re-scopes per faculty**: All Faculty `4.18 / 4.13 / 3.95` → Williams `4.62 / 4.58 / 4.40` |
| Chart comparing faculty scores against each other over time | **PRESENT** | `Faculty Score by Term`, one line per faculty + `Program avg` reference line |
| Response-rate trend for a specific faculty member | **PRESENT** | `Faculty Response Rate Trend` + `Target 80%` line; re-scopes when filtered |
| Ranked list of faculty performance with **alerts** for low scores (leaderboard) | **PARTIAL** | The Faculty Leaderboard exists but **lives on Overview, not By Faculty** — a placement mismatch vs this list. And it has no alerts: `Trend` arrows only (red down / green up), no threshold badge |

### By Course Analytics (1 task) → 1 partial

| Task | Verdict | Where / gap |
|---|---|---|
| Key numbers, score trends, and **theme breakdown** for a course | **PARTIAL** | Key numbers ✅ (though only **2** KPIs vs 4 elsewhere) · score trends ✅ (`Course Score by Terms` + `Response Rate Trend`) · **theme breakdown ❌ — verified absent.** `Theme Distribution` exists only on By Faculty; per-course themes appear only on the individual result page (`Theme-wise Distribution`), never on the By Course tab |

### By Term Analytics (1 task) → 1 present

| Task | Verdict | Where / gap |
|---|---|---|
| Term average score trend, response rate trend | **PRESENT** | Both charts, each with a reference line (`Target 4.0` / `Target 80%`) **and** the per-term delta chip row. The best-executed task on the list — see §2.4 |

### Individual Faculty Portfolio Analytics (6 tasks) → 3 present · 1 partial · 2 missing

**IA note first:** there is **no separate portfolio route**. This whole category is served by
By Faculty + a faculty filter. The task list treats it as a fifth surface; the reference app treats it
as a filtered state. That's the single biggest structural decision to make — see below.

| Task | Verdict | Where / gap |
|---|---|---|
| Theme breakdown chart for one faculty member | **PRESENT** | `Theme Distribution`, re-scoped (verified) |
| Student comments with sentiment for one faculty member | **PRESENT** | `Student Voice` — AI synthesis paragraph + verbatims tagged `Positive / Constructive / Neutral`, split `COURSE MATERIAL` vs `INSTRUCTOR FEEDBACK`. Richer than the ask |
| Detailed log of every survey for one faculty member | **PRESENT** | `All Surveys` table, re-scoped to 4 rows, `Export CSV` |
| Key numbers: avg score, **percentile**, response rate | **PARTIAL** | Avg score ✅ · response rate ✅ · **percentile ❌ — no percentile anywhere on the surface.** The nearest thing is leaderboard rank position and `% below benchmark`, neither of which is a percentile |
| List the courses a faculty member teaches, **ranked best to worst** | **MISSING** | Filtered to Williams you get a **Course × Term heatmap** (ordered by term, not rank). No ranked course list per faculty. The Course Leaderboard ranks courses program-wide, not per person |
| Chart one faculty member's score and response trends **by course** | **MISSING** | `Score by Term` and `Response Rate Trend` are both **by term**, one line total. Nothing decomposes a person's trend **per course** — so you can't see that someone is strong in one course and weak in another |

> **The two MISSING items are the same missing idea.** "Courses ranked best to worst" and "trends by
> course" both want the **course as the unit of analysis *within* a person**. The reference app only
> ever slices a faculty member by *term*. That's precisely the gap the Gap Analysis scatter gestures
> at program-wide (§2.1) but nothing does per-person — and Williams is the proof it matters: his four
> surveys are all one course, so his "portfolio" is currently a single line.

### What this implies

1. **Overview needs its trend layer.** 3 of 8 tasks, all missing, all the same shape. Cheapest real win.
2. **Decide the portfolio question.** Is Individual Faculty Portfolio a route, or By Faculty filtered?
   The task list says route (6 dedicated tasks); the reference app says filtered state. Half its
   PARTIAL/MISSING verdicts dissolve if it becomes a real surface with a per-course spine.
3. **Percentile is genuinely new.** Nothing in the reference app computes rank-as-percentile.
4. **Theme breakdown must reach By Course.** The component exists on By Faculty; the data exists on the
   result page. It just isn't wired to the course tab.
5. **Gap Analysis is marked NEW but already exists.** Worth reconciling before it's built twice —
   §2.1 documents its quadrant logic.
6. **Reconcile the leaderboards** into one column set (`Last Term / 1Y / 3Y / Trend / flag`), then place
   it deliberately. Today faculty and course each miss a different half, and the faculty one sits on
   the tab the task list doesn't expect.

---

## 8. Open design decisions — the 10-task subset

> **Scope:** the 10 ADMIN tasks excluding Overview (By Faculty ×3, By Course ×1, By Term ×1,
> Individual Faculty Portfolio ×5). Vault consulted before writing this section; every claim below
> cites its note.

### 8.0 ⚠️ Two vault findings that invalidate part of §7

**(a) Monil, 2026-07-13 — don't mine this prototype for design.**
> *"When generating charts with AI, **do not feed the existing prototype URL to the agent** (biases
> toward the current solution); rethink each chart's intent first."*

That is exactly what §1–§7 did. Aarti's process anti-patterns compound it: **C10 — trim speculative
dashboard polish**; ❌ *"prototype-first design before alignment"*; ❌ *"wearing personas you're not"*.
**⇒ Use §1–§7 as a gap-finder and a list of things to *not* re-inherit. Do not let §6
("what's worth keeping") drive the design.**

**(b) §7 marks "theme breakdown" PRESENT. Per the vault it is architecturally wrong.**
`2026-05-08-aarti-design-review.md` **D28** (marked `ADR? yes`, still PENDING):
> *"Evaluation themes: **AI-extracted from school-authored questions; no preset taxonomy**."*
> Aarti verbatim: *"You're still thinking that everything has to be tagged and grouped and organized.
> **But, no, like, let it be dynamic.**"*
> `experience-principles.md` anti-pattern: **"Pre-tagged theme taxonomies | Aarti 2026-05-08"**.

The reference app's `Theme Distribution` is **three fixed categories** (`Teaching effectiveness /
Communication / Assessment practice`) — precisely the preset taxonomy D28 bans. It is also
**internally inconsistent**, which is the tell: the By Faculty tab shows **3** themes; the result page
shows **4** (`+ Course Content`, and `Assessment Practice*s*`), with per-theme question counts that
**vary by course** (OT-401 = 1/2/1/2; DPT-503 = 2/1/1/2). A "theme" whose question count changes per
course is not a comparable axis. **⇒ §7's PRESENT verdicts on tasks 1, 4 and 8 should read
PRESENT-BUT-WRONG.**

### 8.1 Revised verdicts for the 10 (vault-adjusted)

| # | Task | §7 said | Vault-adjusted |
|---|---|---|---|
| 1 | By Faculty — theme breakdown per faculty | PRESENT | **WRONG SHAPE** — preset taxonomy banned (D28) |
| 2 | By Faculty — ranked leaderboard **with alerts** | PARTIAL | **BLOCKED ×3** — IA contradiction, weighting undecided, "low" undefined |
| 3 | By Faculty — response-rate trend, specific faculty | PRESENT | **PRESENT** ✅ shape settled |
| 4 | By Course — key numbers + trends + theme breakdown | PARTIAL | **PARTIAL + WRONG SHAPE** — themes absent *and* mis-modelled; needs C9 template guard |
| 5 | By Term — avg score + response trends | PRESENT | **PRESENT, INCOMPLETE** — vault wants 5–6 terms (app: 4), courses grouped by **cohort**, course vs faculty averages shown **separately** |
| 6 | Portfolio — key numbers incl. **percentile** | PARTIAL | **BLOCKED** — percentile banned faculty-side (§7.3); admin-side boundary unwritten. Also D27: never show a single average |
| 7 | Portfolio — courses ranked best→worst | MISSING | **MISSING, blocked on weighting** |
| 8 | Portfolio — theme breakdown, one faculty | PRESENT | **WRONG SHAPE** (D28) |
| 9 | Portfolio — comments with sentiment | PRESENT | **PRESENT** ✅ (vault frames sentiment as moderation, not portfolio — thin but no conflict) |
| 10 | Portfolio — score + response trends **by course** | MISSING | **MISSING, wanted** (Arvind; §4.1 slopegraph) |

Genuinely clean: **3 of 10** (tasks 3, 5, 9). Everything else is blocked or mis-shaped.

### 8.2 The decisions, ranked by what they unblock

**D1 — "Theme breakdown" means *sections* or *AI themes*? → blocks tasks 1, 4, 8**
The vault holds two different objects and the task list conflates them:
- **Template sections** — fixed, comparable, chartable. `2026-06-18` build plan §3: *"Score by dimension? | **Radar** (have) | **5 survey sections**. Keep."* `_Insights.md` (Jun 10): *"faculty **spider graph maps to survey sections**."*
- **AI themes** — dynamic, per-slice, 3–6 per course/faculty, cited, uneditable (`ai-layer.md` F1).

**Recommendation: build both, they are different jobs.** Radar/bullet **by section** = the comparable
quantitative axis. AI themes = a cited insight block placed **above** the detail (D14/C3: *"AI
summaries surface BEFORE question-level detail at every aggregation level"*). Rename the task to
kill the ambiguity. The reference app's 3 fixed themes are the banned middle ground — don't port them.

**D2 — Is the Portfolio the *admin lens* or the *faculty self-view*? → blocks task 6, gates all RBAC**
`course-evaluation.md` §7.3 bans, for the faculty view: *"❌ Any peer-comparison metric (**'you're at
the 60th percentile' included** — that reverse-encodes peer rank)"*. D-4: *"Faculty cannot see peer
comparisons — only their own performance vs. averages."* But `prototype-cards-catalog.md` (Chair
persona): *"**same component as faculty self-view but different access scope**."*
**The ban's scope boundary is never drawn — that is the open question, and only Aarti can draw it.**

**Recommendation:** one component, two access scopes; the **peer/percentile layer is the toggle**,
default OFF. Ship the admin lens first. Do **not** ship percentile until the boundary is written down.
Note ≥5 anonymity suppression is already settled and the app has **no suppressed state** to speak of.

**D3 — Weighted or simple mean? → blocks tasks 2 and 7 (all ranking)**
`2026-06-22-evaluations-dashboard-consolidation.md` §4, flagged **for Aarti**, still unanswered:
> *"So a course with 100 students is weighted more than one with 10 students? **Not sure if we want
> this — further discussions needed.**"* — Recommendation in-note: *"decide with Aarti **before the
> rankings work**."*

Arvind (2026-05-13) is the evidence: *"**Misleading averages** when teaching diverse course types
(5-student PhD vs 85-student MBA)"* and *"**small differences (3.2 vs 3.25) determine top 20% vs 40%**
faculty rankings."* **⇒ A ranked list is a career artefact built on an undefined number. Hard blocker
— get the answer before designing the leaderboard.**

**D4 — What is "low"? → blocks task 2's alerts**
No note defines a score threshold, names an owner, or makes it configurable. Settings covers
**response** threshold + Likert only (`THRESHOLD_OPTIONS = [3,4,5,7,10]`, default 5). §7.3's
*"threshold (e.g., 'below 4.0')"* is illustrative, not a decision.
**Recommendation:** program-configurable **score** threshold in Settings beside the response one.
Styling is already settled and non-negotiable: **amber/orange, NEVER red** (VIZ-004, Aarti).

**D5 — Leaderboard: top-level, or one click down? → blocks task 2**
A live, unreconciled contradiction:
| Note | Says |
|---|---|
| `2026-05-08-aarti-curriculum-mapping.md` **D5, P0** | *"**Demote faculty leaderboard from top** — make faculty one-click drill-down."* Aarti verbatim: *"Faculty is one click down."* |
| `Decisions/pce/2026-07-13-…` **accepted** | *"**By-Faculty (a score leaderboard drilling into per-faculty longitudinal views) is the most important.**"* |
Neither cites or supersedes the other.
**Recommendation — these reconcile.** Put the leaderboard **on the By Faculty tab** (one click down
from Analytics), not on Overview. That satisfies D5's IA, honours Jul 13's priority, *and* fixes §7's
"placement mismatch" (the app has it on Overview; the task list files it under By Faculty). Confirm
with Aarti, but this is the cheap resolution.

**D6 — Where is Cohort? → affects all 10**
Aarti **D4**: CFE has **two co-equal top-level axes: Term + Cohort**. **D-1/D3**: the collection grain
is a 4-tuple — *"course × term × cohort × faculty"*, verbatim *"it is always on a course offering,
which is for a particular cohort in a particular term."* **The 10 tasks contain no cohort anywhere.**
Either the list is incomplete or cohort was dropped — raise it before building, because it changes the
grain of every aggregate here.

**D7 — Single average, or decomposed? → task 6**
Task 6 says *"average score"*. `2026-07-13` (**accepted**): *"**Average score is never shown as a
single number** — it breaks into course-content, faculty-role, and other per-actor scores."* D27:
students rate **two distinct entities** — course content + faculty teaching style. D33 (pending): the
self-view *"must show all five"* — course rating, faculty rating, trend, lifetime, comparative.
**⇒ Task 6 as literally written contradicts an accepted decision. Decompose it.**

**D8 — Tasks 7 + 10 are one component, not two**
"Courses ranked best→worst" and "score/response trends by course" both want **the course as the unit
of analysis within a person** — the thing the app never does (it only slices a person by term).
**Recommendation:** a single ranked course list where each row carries a sparkline (per-course
trend). One component closes both tasks. Guard the n=1 case — Williams' whole portfolio is one course,
so "ranked best to worst" over a list of one must degrade gracefully.

### 8.3 What to settle before any JSX

1. **D3 weighting** and **D4 threshold** — Aarti. Both gate the leaderboard; both are already logged as
   open *for her* and never answered.
2. **D2 portfolio scope** (admin vs self-view) — Aarti. Gates percentile and the whole RBAC surface.
   The report-access matrix is **P0-assigned to Romit since 2026-05-28 and still unwritten**.
3. **D5 leaderboard placement** — Aarti/Monil. Reconcile D5 vs 2026-07-13 explicitly, mark one superseded.
4. **D1 sections vs themes** — this one is arguably already answered (D28 + radar-by-section); it just
   needs writing down as an ADR. **D26/D27/D28/D33 are all directives with no accepted ADR.**
5. **D6 cohort** — confirm the omission is deliberate.

> Aarti, on exactly this: *"There is no document that lists all of these things. And then I will get on
> a review call, and I will see eight versions of it, and I will lose it."* — §8 is that list.
> **Vishaka has no PCE voice (scaffold only); Nipun has zero course-eval notes.** Aarti is the only
> authority for D1–D7.

---

## 9. Chart types per decision — and where each comes from

> **No invented charts.** Every type below is either (a) a component that already exists with a
> file:line, or (b) explicitly marked NOT FOUND. Sources are the vendored DS OS chart suite, the
> proven in-product primitives, and the vault's settled viz decisions — never a default from thin air.

### 9.0 Premise correction: the DS package ships **zero** chart types

`node tools/ds/source.mjs` → `@exxatdesignux/ui@0.6.57 — 702 exports`. `Chart` is **not** among them.
The entire chart surface in the package is **8 primitives**: `ChartConfig`, `ChartContainer`,
`ChartLegend`, `ChartLegendContent`, `ChartStyle`, `ChartTooltip`, `ChartTooltipContent`,
`chartTooltipKeyboardSyncProps`. `components/ui/chart.tsx` is a one-line re-export.

**⇒ "DS OS chart vocabulary" means the vendored suite in `apps/pce/admin`, not the package.**

| Source | What it gives |
|---|---|
| `components/charts-overview.tsx:209` | `ChartCardVariant = normal \| tabs \| selector \| metrics-tabs \| kpi-chart` — **confirmed** |
| `:455` `ChartCard` | `miniMetrics: MiniMetric[]`, `leoInsight`, `trendContent`, `filterOptions` |
| `:271` `ChartFigure` | a11y shell — `role="application"`, arrow-key nav, `aria-live` |
| `:241` `ChartDataTable` | `sr-only` table fallback — **mandatory pairing** |
| `components/design-system/chart-previews.tsx:1318` `CHART_TABS` | the DS type enumeration — **9 families, 21 types** |
| `components/chart-leo-spotting.tsx:352/447/469` | 3 Leo overlays (cartesian / context / pixel-for-canvas) |

### 9.1 The mapping — **redone through `viz/RUBRIC.md`** (supersedes 9.1-old below)

The rubric is five questions. **Match the task's question to a question, take its answer.** Every row
below names the rubric question it resolves under, so the choice is auditable rather than asserted.

> `RUBRIC.md:25` — *"If your question matches none, ask Romit before generating."*

#### First: which lane? (`VIZ-PATTERN-AI-001`)

Before picking any chart, `ai-vs-pulled-lane.md:14-15` splits the surface — and **this decides D1 outright**:

| Lane | Contents (verbatim) | Treatment |
|---|---|---|
| **Pulled** | *"trends, averages, comparative metrics, distributions, **leaderboards** (computed from data)"* | Standard DS chart. **No AI badge.** |
| **AI** | *"**themes**, insights, action plans, summaries (LLM-extracted from open-text)"* | `Banner`/distinct card · `fa-light fa-sparkles` + "AI insight" · **must cite source** (*"Based on 47 open-text responses · 6 themes"*) |

⇒ **Sections are pulled → chart them. Themes are AI → they are NOT a chart.** The pattern's own bad-content
example makes the boundary explicit (`:99`): ❌ *"'Average rating is 4.2.' (that's pulled, not AI)."*

⇒ The reference app's `Theme Distribution` bar chart is a **double violation**: it charts AI themes as
if they were pulled data (`:158` ❌ *"AI content visually identical to pulled-data content — ADR-005
violation"*) **and** uses a preset taxonomy (D28). **Delete it. Do not port it.**

#### The mapping

| Task | Rubric Q | Chart | Pattern | Why the rubric says so |
|---|---|---|---|---|
| **1, 8** — section scores, one faculty | **Q2** (outlier across N≤30) | **Cleveland dot**, sections ranked, program-avg reference line | `VIZ-PATTERN-005` | 5 sections = *"N≤30 named entities"* on a single metric. ⚠️ **Not radar — see 9.1c** |
| **1, 8** — themes | — | **AI-lane card. NOT a chart** | `VIZ-PATTERN-AI-001` | Themes are the AI lane by definition (`:15`) |
| **2** — faculty leaderboard + alerts | **Q2** | **Cleveland dot**, median reference line, below-threshold dots amber | `VIZ-PATTERN-005` | `cleveland-dot.md:14` lists **"Ranked faculty response rate"** as a use case verbatim. Q2 ❌ *"Sorted bar list"*; `:21` ❌ *"anywhere a `<table>` … exists for a ranking"* |
| **3** — response-rate trend, one faculty | **Q4** (change over time) | **Line + target reference line** | (P3) `line-trajectory` | Q4 ❌ *"Single % delta with arrow. **Hides the path; a drop-and-recovery looks identical to flat.**"* |
| **4** — course key numbers | — | Each card needs **≥1 of**: sparkline (≥3 pts) · bullet-vs-target · delta-from-cohort · n-of-total | **VIZ-010** | Bare numbers are non-compliant |
| **4** — course score trend | **Q4** | **Line + program-avg reference line** | (P3) `line-trajectory` | — |
| **4** — course themes | — | **AI-lane card** | `VIZ-PATTERN-AI-001` | — |
| **5** — term trends ×2 | **Q4** | **Line ×2 + reference lines**; delta chips as `miniMetrics` | (P3) `line-trajectory` | Chips are legal *because the line is shown* — VIZ-002: *"text below a chart labels values; it does not interpret"* |
| **5** — spread across a term's courses | **Q2** | **Cleveland dot** (N=8) | `VIZ-PATTERN-005` | ⚠️ **The vault's "histogram/beeswarm" is wrong at this N** — strip plot is for **N>30** (`cleveland-dot.md:25`). 8 courses → dot plot |
| **6** — portfolio key numbers | **Q1** (vs target/cohort) | **Bullet** vs dept avg + university avg | `VIZ-PATTERN-003` | Q1 ❌ *"Progress bar. Hides cohort, hides target, hides trajectory."* Decompose per D7 — never one number |
| **6** — **percentile** | **Q1** | **Bullet vs two nested benchmarks** — the percentile substitute | `VIZ-PATTERN-003` | Rubric Q1 + Aarti A5 (*"vs the department average to the university average"*, Anthology/Watermark-proven) + §7.3 ban. Three sources converge |
| **7 + 10** — courses ranked **and** trending | **Q2 + Q4** | **Small multiples** — one mini slope/line **per course**, panels **sorted by score** | `VIZ-PATTERN-006` | **Supersedes my D8 "table + sparkline".** VIZ-007: *"faceted views default to small multiples, **not dropdowns**"*. Panel order is meaningful (A11Y-008) ⇒ **sort order IS the ranking**. One component answers both tasks. `small-multiples.md:8`: *"the eye scans 16 mini-charts in 5 seconds; outliers self-announce"* |
| **9** — comments + sentiment | — | **AI-lane card**, chips + verbatims + citation | `VIZ-PATTERN-AI-001` | Sentiment polarity is AI-extracted |
| *(ref app's Gap Analysis)* | **Q2** | **Scatter, quadrants** — already correct | (P3) `scatter-quadrants` | Q2 row 3: *"Quadrants surface high-low / low-high outliers"* |
| *(ref app's course × term heatmap)* | **Q3** (two-dim gaps) | **Heatmap** — already correct | `VIZ-PATTERN-001` | — |

#### 9.1c ⚠️ Radar is not in the rubric — and the vault says keep it

`2026-06-18` §3 says *"Score by dimension? \| **Radar** (have) \| 5 survey sections. **Keep.**"*, and
`faculty-profile-dashboard.tsx:57` already ships it. But **radar appears nowhere in `RUBRIC.md`** — not in
any of the five questions, not in the decision flow, not in the pattern index. Under `RUBRIC.md:25` an
unmatched question means *ask before generating*.

The rubric's own reasoning cuts against radar (`cleveland-dot.md:101`): *"Per Schwabish … and
**Cleveland's original perception experiments, dot plots beat bars on accuracy of judgment for ranked
data**"* — and radar is worse than bars, encoding by **angle and area**, the two channels Cleveland
ranked lowest.

**Recommendation: Cleveland dot for section scores; raise the radar conflict with Romit rather than
silently keeping it.** VIZ-005 makes the rubric binding, so "we already built radar" is not an argument.
Note this is *not* blocked by §7.3 — that bans ranking **faculty by name**; ranking a person's own
**sections** is not peer comparison.

#### 9.1d The rubric answers D4 ("what is low?")

`cleveland-dot.md:86` — `const threshold = props.threshold ?? median  // can be set per metric`.

**Default threshold = the median, overridable per metric.** Below-threshold dots take `--chart-4` amber,
which `:65` calls *"THE redundant encoding (color + position) for A11Y-008"*. The median reference line is
mandatory (`:75` ❌ *"Hiding the median reference line — that's the anchor"*). And the required takeaway
line (`:66`) — *"3 of 8 students below 75% threshold; lowest is Student H at 62%"* — **is Aarti's D17
frequency-count rule already shipped in a pattern**.

⇒ **D4 is less open than §8 claimed.** A defensible default exists in-pattern. What still needs Aarti is
whether the program can override it in Settings — not what the default should be.

#### 9.1e ⚠️ The rubric itself is out of date — 11 of the files it points at don't exist

Verified by listing `docs/patterns/viz/` against every filename `RUBRIC.md` references:

| Referenced by the rubric | On disk |
|---|---|
| `strip-with-marker` · `slope-single` · `slope-multi` · `slope-pair` · `scatter-quadrants` · `box-distribution` · `line-trajectory` · `sparkline-table` · `cumulative-area` · `distribution-overlay` · `grouped-bar` | ❌ **all 11 MISSING** |
| `bullet-vs-target` · `outlier-strip-plot` · `gap-heatmap` · `cleveland-dot` · `small-multiples` · `slope-paired` · `calendar-heatmap` · `progression-sankey` · `ai-vs-pulled-lane` | ✅ 9 exist |

Three defects, all worth a follow-up PR:
1. **The P1/P3 footer (`:126-131`) is stale.** It lists `small-multiples`, `slope-*`, `cleveland-dot` as
   *"(P3) later"* — but `small-multiples.md`, `slope-paired.md`, `cleveland-dot.md`,
   `calendar-heatmap.md`, `progression-sankey.md` and `ai-vs-pulled-lane.md` all shipped. It claims only
   3 P1 patterns; there are 9.
2. **Naming drift.** Q4/Q5 cite `slope-multi.md` / `slope-pair.md` / `slope-single.md`; the real file is
   **`slope-paired.md`**.
3. **Header miscount** (`:7`) — *"8 patterns"*; the index lists **9**.

**What this costs us here:** the rubric's answer for the most common question in this task set —
**Q4, "how is X changing over time"** (tasks 3, 4, 5, 10) — routes to `line-trajectory.md` and
`sparkline-table.md`, **neither of which exists**. The chart is obvious and proven in product
(`analytics-panels.tsx`, `trend-sparkline.tsx:44`), so nothing is blocked — but four of the ten tasks
resolve to a pattern doc that was never written. Same for `scatter-quadrants` (the Gap Analysis) and
`strip-with-marker` (the honest percentile encoding).

#### 9.1f 🛑 BUILD HALTED — the mapping does not survive the real data

Gate 1 (`ds-adoption-reviewer` + governance/data read) was run before any JSX. **Four of the seven
"unblocked" builds died.** Recording honestly rather than shipping around it.

**(a) Tasks 1 + 8 (section scores) — NO DATA. Not buildable.**
- `TemplateSection` (`pce-mock-data.ts:2`) has **three** values: `course_content | faculty_performance
  | course_director`. My mapping assumed 5.
- `PceResponse.sectionScores` (`:359-363`) is keyed by **`surveyId` only — no `facultyId`**.
  `deriveResultsForSurvey` (`pce-results.ts:106-131`) gives every instructor on a survey the *same*
  `avgScore` — co-taught faculty are byte-identical.
- **3 rows is not a ranking.** `cleveland-dot.md:23` targets ≤30 *entries*; a 3-row dot plot is a table
  with extra steps.
- ⇒ **This also moots the radar-vs-Cleveland conflict in 9.1c — neither chart has data.** The vault's
  *"5 survey sections"* is not in the data model; `offerings/[code]/page.tsx:37-46` **synthesizes** five
  fake sections from `seedKey.charCodeAt()` + a fixed offsets array. Invented labels.
- **Needs a data-model decision (Romit/Himanshu), not a design one:** add `facultyId` to
  `sectionScores`, or drop section-breakdown as a chart.

**(b) Task 10 (per-course trends) — the pattern excludes itself. My §9.1 pick was wrong.**
`small-multiples.md` **When NOT to use** (`:27`): *"Single chart with category encoding suffices
(**≤5 series → use one chart with colored lines**)"*; `:74` *"**Min 3**, max ~24 panels"*; `:83` ❌
*"Using small multiples when one chart with categories would do."*
In this data faculty teach **1–3 courses** (Williams: **1**). Below the minimum, inside the exclusion.
⇒ **Task 10 = one LineChart, one colored line per course.** Not small multiples. VIZ-007 doesn't
override this — the pattern's own exclusion is narrower and wins.
*(The pattern does name "Faculty home: 1 sparkline per course they teach (4-12 panels)" at `:14` — that's
the shape we'd want if a faculty taught 4+. Revisit at real data volume.)*

**(c) Task 3 (response-rate trend) — no history.** `PriorOffering` (`:333-345`) carries `term`,
`courseAvg`, `facultyAvg` but **no `responseRate`**. Per-term response history for a faculty would have
to be derived from `EvalResult` (`pce-results.ts:29-53`, keyed `${surveyId}:${facultyId}`, *does* carry
`responseRate`) — feasible, but it's a data-derivation task, not a chart task.

**(d) Task 5 (trend lines) — already built. Do not create files.** `analytics-panels.tsx` `ByTermPanel`
(`:319-492`) already renders the dual course/faculty line chart; `ByCoursePanel` (`:793-883`) the
per-course line. Adding target lines is a **`<ReferenceLine>` edit**, not a component. The file's own
contract (`:3`) calls it *"the SINGLE source of design for the By Term / By Faculty / By Course views"* —
a separate trend component would break it.

**(e) Task 1/4/8/9 AI card — already built. My plan was a duplicate.** `AiInsightCard`
(`components/pce/ai-insight-card.tsx:38-45`) ships the exact spec — sparkles + `var(--brand-color)` +
"AI insight" + body + `Based on {source}`. Live at `results/[id]/page.tsx:1712`, `surveys/[id]/page.tsx:573`,
`term-themes-insight.tsx:91`. **Pass `source="47 responses · 6 themes"` — the card prepends "Based on".**
⚠️ **`ai-vs-pulled-lane.md:121`'s recipe is stale and now self-violating** — it hand-rolls
`rounded-lg border border-border`, which `design-anti-patterns.md:61` bans, and imports from the old
`@exxat/ds` path. **The shipped component supersedes the doc.**

#### 9.1g What actually survives

| Task | Verdict |
|---|---|
| 1, 8 sections | 🛑 **blocked — data model** |
| 1, 4, 8, 9 themes | ✅ **done** — use `AiInsightCard`, build nothing |
| 2, 7 rankings | 🛑 blocked — D3 weighting |
| 3 response trend | ⚠️ derive `responseRate` history from `EvalResult` first |
| 4, 5 score trends | ✅ **edit** `analytics-panels.tsx` — add `<ReferenceLine>` |
| 6 bullet vs benchmarks | ✅ **buildable** — needs 2 derived averages (dept + university) |
| 10 per-course trend | ✅ **buildable — as ONE line chart**, not small multiples |

**Net: one genuinely new component** (`score-bullet.tsx`), one line-chart addition, and two
`<ReferenceLine>` edits. Everything else is blocked, already built, or a data task.

#### 9.1h Gate-1 findings that bind any build

- **A11Y-021** (`design-anti-patterns.md:90`) — `var(--border)` as the *only* state indicator **fails**
  (≈1.2:1; WCAG 1.4.11 needs 3:1). **Existing code violates this:** `bullet-gauge.tsx:106` and
  `micro-trend.tsx:131` both `stroke="var(--border)"` on their ReferenceLine. My reference lines (program
  avg, dept avg, target) **are** the state indicator ⇒ `--muted-foreground` minimum;
  `cleveland-dot.md:38` independently says `--foreground` for the median.
- **Amber is fine — the ban is narrower than it reads.** `design-anti-patterns.md:88` bans *ad-hoc oklch*
  amber, not amber. `var(--chart-4)` **is** the DS token, already shipping at `bullet-gauge.tsx:68`.
- **`SectionScoreStrip` is dead code** — zero call sites in `apps/pce/admin`. Candidate for deletion.
- **`MicroTrend` lives in two places** (`components/pce/micro-trend.tsx` **and**
  `apps/exam-management/admin/components/micro-trend.tsx`, `:14-18`) — any edit must be mirrored.
- **`claude-practices.md:236` is wrong** — it marks `VIZ-PATTERN-006` *"✅ shipped"*; **no code backs it.**
- **Register the viz**: `pce-ui-patterns.md:45-56` §0.2 — *"Every viz answers one question and prompts one
  action."* Any new chart must be added there; `BulletGauge`/`SectionScoreStrip`/`MicroTrend` are rows 51-53.
- **`BulletGauge` cannot absorb task 6.** Its API is count/count (`responseCount`/`enrollmentCount`
  required, `:27-46`) with `pct = responseCount / enrollmentCount`; a 1–5 score vs two benchmarks has no
  numerator. It's live in 3 call sites, so prop changes break them. New file — named `*Bullet`, never
  `*Gauge`. (VIZ-011 bans **circular dials**, not Tufte bullets; the existing `BulletGauge` *name* is the
  misnomer, not its shape.)

### 9.1-old The mapping (superseded — kept for the audit trail)

| Task | Chart type | Component (file:line) | Source & proof |
|---|---|---|---|
| **1, 8** — section breakdown per faculty | **Radar**, 2 series (faculty + program avg overlay) | `RadarChartContent` `charts-overview.tsx:1400`; product: `components/pce/faculty-profile-dashboard.tsx:57` | Vault `2026-06-18` §3: *"Score by dimension? \| **Radar** (have) \| **5 survey sections**. Keep."* · `_Insights` Jun 10: *"faculty **spider graph maps to survey sections**."* **Already rendering sections in product.** Second series satisfies Aarti: *"averages drawn **ON viz**, not in prose"* |
| **1, 8** — AI themes | **NOT A CHART** — cited theme block | `leoInsight` on `ChartCard:455`; `ChartLeoInsight` `leo-insight-indicator.tsx:58` | D28: themes are dynamic AI clusters, *"let it be dynamic"* · `ai-layer.md`: 3–6 themes, *"provenance always cited"*. **Current progress bars violate VIZ-001 — delete, don't port** |
| **2** — leaderboard + alerts | **DataTable + row sparkline**; alert = amber badge | `TrendSparkline` `components/pce/trend-sparkline.tsx:44` (72×20, row-sized) → `MicroTrend` `micro-trend.tsx:83` | Proven. Amber-never-red is enforced in code: `bullet-gauge.tsx:11` *"Aarti's rule"* (VIZ-004). ⚠️ §7.3 bans **Cleveland dot plot of faculty rankings by name** — faculty-side only; admin-side allowed but unbuilt. **Blocked on D3/D4** |
| **3** — response-rate trend, one faculty | **Line + target ReferenceLine** | `LineChartContent` `charts-overview.tsx:1087`; product: `analytics-panels.tsx` | Proven. (Distinct from the *cumulative* curve below — this is across terms, that is within one collection window) |
| **4** — By Course key numbers | **KeyMetrics**, ≤4 tiles | DS `KeyMetrics` | `exxat-kpi-max-four`; ref app ships only 2 here |
| **4** — By Course score trend | **Line + program-avg ReferenceLine**, or `ChartCard variant="kpi-chart"` | `charts-overview.tsx:1087` / `:455` | Jun 10 brief: *"slope/strip plot preferred, **progress bars last resort**"* |
| **4** — template variance guard | **NOT A CHART** — `LocalBanner` | — | C-2: *"Cross-course analysis limited — N templates in use across these courses"*; D-3/C9. Never toast |
| **5** — term trends ×2 | **Line ×2 + ReferenceLine** (`Target 4.0` / `Target 80%`); delta chips = **`miniMetrics`** | `charts-overview.tsx:1087`; `MiniMetric[]` on `ChartCard:455` | Proven. The ref app's per-term chip row (§2.4) has a real DS home — `miniMetrics`, not a bespoke row. Vault: 5–6 terms, cohort grouping, course vs faculty averages **separately** |
| **5** — spread across a term's courses | **Strip/dot plot** *(beeswarm substitute — see 9.2)* | `SectionScoreStrip` `components/pce/section-score-strip.tsx:60` (`ChartContainer` + recharts `ScatterChart`, dot on a 1–5 track) | Proven at `results/[id]/page.tsx:570` *"theme strip plot"* |
| **6** — portfolio key numbers | **KeyMetrics**, decomposed | DS `KeyMetrics` | D7/D27: *"average score is **never** shown as a single number"* → course rating + faculty rating, ≤4 tiles |
| **6** — **percentile** | **NOT A CHART — substitute `BulletGauge` vs dept + university averages** | `BulletGauge` `components/pce/bullet-gauge.tsx:48` (BarChart + `ReferenceLine`) | **The key move.** §7.3 bans percentile (*"reverse-encodes peer rank"*), but Aarti **validated** the alternative — A5: *"How am I doing with respect to others? **compared to the department average to the university average.**"* A bullet vs averages answers the same question **without** encoding peer rank. Proven: `offerings/[code]`, `analytics/programmatic` |
| **7 + 10** — ranked courses **with** per-course trend | **One component:** DataTable ranked + `TrendSparkline` per row | `trend-sparkline.tsx:44` | D8 — the two tasks collapse. Sparkline pairs with delta text so colour isn't sole encoding (A11Y-008). Guard n=1 |
| **9** — comments with sentiment | **NOT A CHART** — sentiment chips + verbatims | — | 3 numbers don't earn a chart (`RUBRIC`: *"decorative metrics with no decision"*). `ai-layer.md`: polarity positive/negative/neutral |
| *(response-rate collection curve, if wanted)* | **Cumulative line vs target + reminder markers** | `lib/pce-collection.ts:5`, `:21` `cumulativePct`; rendered `results/[id]/page.tsx:870-965` | Proven, exactly this use case |
| *(question-level detail)* | **Heatmap** — course × term or question × term | `ChartHeatmap` `chart-heatmap.tsx:234` (**ECharts**, generic via `buildChartHeatmapPoints:36`) | ⚠️ Primitive exists but **gallery-only** — course × term would be its **first product use**. Uses `ChartLeoPixelPlotInsightOverlay:469` (canvas, not cartesian) |

### 9.1b ⚠️ CORRECTION — §9.1 was written without the mandatory rubric

`DESIGN.md:98` — **VIZ-005: *"Viz selection rubric (in `docs/patterns/viz/RUBRIC.md`) must be
consulted for every analytics card."*** §9.1 was written without opening it. **That is a rule
violation.** Worse, I quoted `VIZ-001` / `VIZ-004` / `VIZ-PATTERN-006` secondhand from vault prose
without reading the catalogue. Corrections:

| I said | Truth | Source |
|---|---|---|
| "VIZ-PATTERN-006 = amber-border outlier panels" | **VIZ-PATTERN-006 = Small Multiples.** The amber border is a styling detail *inside* it | `docs/patterns/viz/small-multiples.md:5`, `:61-62` |
| "Slopegraph NOT FOUND" | **NOT FOUND as a *component*. It EXISTS as a sanctioned *pattern*** — `VIZ-PATTERN-004` slope-paired | `docs/patterns/viz/slope-paired.md` |
| "Beeswarm NOT FOUND → substitute strip plot" | Right answer, wrong reasoning — the strip plot is itself a **named pattern**, `VIZ-PATTERN-002` outlier-strip-plot | `docs/patterns/viz/outlier-strip-plot.md` |

**We already have the chart analogue of Mobbin. I wasn't using it.** `docs/patterns/viz/` — **9 named
patterns**: `-001` gap-heatmap · `-002` outlier-strip-plot · `-003` bullet-vs-target · `-004`
slope-paired · `-005` cleveland-dot · `-006` small-multiples · `-007` calendar-heatmap · `-008`
progression-sankey · `AI-001` ai-vs-pulled-lane. Plus **11 VIZ-* rules** (`DESIGN.md:94-104`) and the
**gate** at `docs/patterns/viz/RUBRIC.md` (five questions, each with an explicit ❌ Wrong row).

**Four rules that land directly on these 10 tasks and that §1–§9 missed:**

- **VIZ-006** — *"Cohort comparison must show pairing or distribution, never duo-numbers. **Two large
  numbers side-by-side is forbidden in dashboard contexts.**"* ⇒ This is exactly §4.1's `4.55/84%`
  above `4.38/81%`. There was already a rule for it.
- **VIZ-007** — *"**Faceted views default to small multiples, not dropdowns.** The dropdown becomes an
  optional drill-down."* ⇒ The whole reference app is dropdown-driven (Faculty / Course / Term
  selectors). VIZ-007 inverts that default — and independently confirms **D8** (ranked list + per-row
  sparkline *is* small multiples).
- **VIZ-011** — banned: *"gauges/dials, donut/pie >5 slices, exploded pies, 3D anything, dual y-axis
  line charts, stacked bars >4 stacks."* ⚠️ **Conflict:** the DS gallery ships a `gauge` type
  (`chart-previews.tsx:1147`) and `dashboard-quota-progress-card.tsx` renders `RadialBarChart`.
  **Our own gallery ships a banned chart.** Worth raising separately.
- **`docs/patterns/dashboards/RUBRIC.md:20-26`** — *"frequency counts > percentages for coverage data"*
  (*"8 of 20 questions" beats "40%"* — **Aarti D17**). ⇒ The ref app's `% COURSES BELOW BENCHMARK 50%`
  should read **"4 of 8 courses."**

Also two **live ID bugs** now in circulation, worth fixing at source:
`docs/governance/claude-practices.md:182` cites **VIZ-008** (calendar-heatmap) where it means
**VIZ-002** (annotation); and the vault's `2026-05-08-course-evaluation.md:75` reduces
**VIZ-PATTERN-006** to "amber border" — the same misreading I repeated.

### 9.2 ⚠️ The vault asks for two charts that have patterns but no components

| Vault asks for | Status | Resolution |
|---|---|---|
| **Slopegraph** — `2026-06-18` §4.1 *"section-score slopegraph"*; C7 *"slope per offering"* | **NOT FOUND as a primitive.** No `slope` in `CHART_TABS`, no renderer. A **rogue hand-rolled `<svg>`** exists at `app/(app)/admin/setup/_view-retrospective.tsx:34` (`<line>` at `:80`) — which **violates the Jul 2026 no-hand-rolled-SVG-viz directive** cited in `section-score-strip.tsx:15-16` and `bullet-gauge.tsx:19-20` | A slopegraph is a Line restricted to two x-positions. **Add `slope` to `CHART_TABS` as a named DS type** built on `ChartContainer` + recharts `Line`. **Do not hand-roll SVG** — and retire the rogue one |
| **Beeswarm** — `2026-06-18` §4.4 *"histogram/beeswarm across term's courses"* | **NOT FOUND** — zero hits for `beeswarm`/`swarm` | Use **`SectionScoreStrip`** (`section-score-strip.tsx:60`) — a strip/dot plot on a track is the proven substitute, already shipping |
| **Histogram** — same note | **NOT FOUND as a primitive** | Not a real gap: Likert buckets are ordinal, so a **bar over buckets** is correct and proven — `question-chart-block.tsx:82`, `medianFromDistribution` (`results/[id]:1264`) |

### 9.3 Binding rules these choices already encode

- **Never red in score viz** — enforced at `bullet-gauge.tsx:11`; amber/orange below threshold (VIZ-004, Aarti).
- **No hand-rolled `<svg>` viz** — `section-score-strip.tsx:15-16`, `bullet-gauge.tsx:19-20`.
- **Progress bars last resort** (VIZ-001) — which condemns the ref app's `Theme Distribution` bars.
- **Every chart pairs with `ChartDataTable`** (`charts-overview.tsx:241`) + `ChartFigure` a11y shell (`:271`).
- **A Leo constant is not proof of a chart** — `CHART_GALLERY_LEO_*` exists for `_BULLET`, `_HEATMAP`,
  `_TREEMAP`, `_SANKEY`… whose renderers live elsewhere or nowhere. Don't infer a chart from an insight.

### 9.4 Where chart choices are sourced from — the full register

Answering *"are we checking anything else, the way we use Mobbin?"* — five sources, four of which
§9.1 skipped:

| # | Source | What it decides | Status |
|---|---|---|---|
| 1 | **`docs/patterns/viz/RUBRIC.md`** (the VIZ-005 gate) | *What shape* a chart takes — 5 questions, each with an ❌ Wrong row; decision flow `:84-94` where the progress bar survives in **exactly one** branch (*"single in-flight task 0–100%"*) | ❌ **was skipped — mandatory** |
| 2 | **`docs/patterns/viz/*` — 9 named patterns** | The chart analogue of Mobbin. Our own vocabulary | ❌ **was skipped** |
| 3 | **`docs/patterns/dashboards/RUBRIC.md`** | *Whether a card exists at all* — *"Dashboards answer questions. If you can't name the question a card answers, the card shouldn't exist."* | ❌ **was skipped** |
| 4 | **Vendored DS suite** (`charts-overview.tsx` etc.) | What's actually buildable | ✅ used (§9.0) |
| 5 | **Mobbin** | Layout/IA of the surface, not the chart type | ❌ was owed → **now run, below** |

**External canon — what we actually hold.** `docs/governance/claude-practices.md:164-186` is a 14-row
banned-pattern table, each row sourced: **Few** *Information Dashboard Design* (gauges) · **Cleveland
1985** perception experiments (donut >5) · **Tufte** *VDQI* (3D, exploded pie, non-zero baseline) ·
**Schwabish** *Better Data Visualizations* (dual y-axis, >4 stacks) · **Knaflic** *Storytelling with
Data* (chart without takeaway) · **Borland 2007** (rainbow colormap).

⚠️ **We do NOT hold the FT Visual Vocabulary.** That header name-drops *"FT canon"* but **no FT source
appears in any of the 14 rows**, and there are zero hits for `Visual Vocabulary` / `data-to-viz` /
`Datawrapper` / `Vega` / `Nivo` / `Tremor` across either tree. There is **no `REFERENCES.md`, no
bibliography, no external chart-choice taxonomy**. If we want an FT-style "chart by analytical intent"
taxonomy, **it does not exist yet and would need adopting deliberately** — that's a real gap, and the
honest answer to the question.

**Domain proof (Aarti-sanctioned).** `prototype-cards-catalog.md:108` — Aarti validated the faculty
dossier *"compared to the department average to the university average"* and **cited Anthology /
Watermark as existence proof**. That shape is **`VIZ-PATTERN-003` bullet-vs-target** — which is exactly
the §9.1 percentile substitute, now with a pattern ID *and* competitor proof behind it. Note she cited
them as proof *faculty accept the comparison*, not as chart-craft reference.

### 9.5 Mobbin pass — run 2026-07-14

The vault says this was never done: `apps/pce/docs/specs/2026-07-08-dashboard-insights-ia-decision.md:75`
— *"Fresh Mobbin pass for 'evaluation insights dashboard'… **no saved reference exists** for the
home-as-insights surface."* Run now (`surface-design-process.md:28` requires min 3 analogies, every
`mobbin_url` cited):

| Screen | What it proves | Maps to |
|---|---|---|
| [Pinterest — Shopping trends](https://mobbin.com/screens/f10d6053-a263-4609-89dd-30107c78effc) | **`Rank │ Category │ Trend (sparkline) │ Growth ↑106% MoM │ Volume`** — ranked table with an inline sparkline **and** a delta text per row | **D8 exactly** (tasks 7+10 as one component). Delta text beside the sparkline satisfies **A11Y-008** |
| [Fresha — team performance](https://mobbin.com/screens/2ad71fd9-6708-4fe9-8956-fb4021a87beb) | **"Top 5 team members" + "Bottom 5 team members"** as two short tables, not one long leaderboard | **Task 2.** Matches the accepted *"surface lowest-scoring faculty descending"* user story better than a full ranking — and shortens the shaming surface |
| [OKX — Rankings](https://mobbin.com/screens/616a128d-2240-490e-9204-749e7902aef3) | Same **best/worst split** ("Top gainers" / "Top losers") + per-row sparkline | **Task 2** — second independent instance of the split. Two apps converging is a signal |
| [Dialpad — Coaching hub](https://mobbin.com/screens/e4f6a829-569c-4095-8568-9bed1a58cae6) | **"Team average" drawn as a marker ON the chart**, leaderboard below | **VIZ-002** (*"outliers/comparisons drawn on the viz"*) + Aarti's *"averages drawn ON viz, not in prose"*. The reference for the radar's program-avg overlay |
| [15Five — answer distribution](https://mobbin.com/screens/ff92b206-5212-49a2-9ad6-176444d35358) | Per-question distribution with **anchor labels at both ends**, plus *"# of questions / # of answers"* frequency counts | **Task 4/9.** The frequency-count footer is **Aarti D17** shipped. (Its bars are the VIZ-001 trap — take the anchors, not the bars) |
| [7shifts — employee profile](https://mobbin.com/screens/cf848844-34ef-403f-8280-5e1b4062b1df) | Left sub-nav (`Info / Performance / Permissions`) + right content | **D2** — the portfolio-as-route IA, if that's the call |

**Prior Mobbin refs already on file** (don't redo): `2026-06-10-course-evaluation-aarti-brief.md:701-735`
(searched Jun 12) — By-Faculty analytics → **Whop: User overview** (profile sidebar KPIs + tabs/DataTable)
and **Amplitude: User profile insights** (*"aggregated-stats-before-drill"*). Both corroborate 7shifts.

**Registry gap:** `docs/ANALOGIES.md` is the log these should live in — 8 rows, all dated 2026-05-09,
**none viz, none PCE**. Its own `:47` says back-fill; nobody has since bootstrap. The Mobbin work keeps
landing in specs and never returns to the registry.

### 9.6 Not verified

- **`localhost:4000` was DOWN** — no visual confirmation against the live DS catalog. Per Pattern L this
  is **static only**; the file:line inventory is from source, not from a rendered gallery.
- **Mobbin not yet consulted** — `feedback_mobbin_first` requires a Mobbin pass before any mockup. This
  section picks *primitives*, not layouts; the layout pass still owes Mobbin research.
- Chart **choices** here are recommendations against decisions that are still open (§8) — D1 in
  particular determines whether the radar is even the right axis.

---

## 10. Verification

| Claim | How checked |
|---|---|
| All 4 sub-nav walked | Clicked Overview / By Faculty / By Course / By Term; `get_page_text` on each |
| Drill-downs | Clicked `View Insights`, `view →`, `View Results`, `View Analytics`, `View Longitudinal Insights`; URL + rendered state recorded per row in §3 |
| `?term=` ignored | `find` → Survey Details still `22 rows` at `?term=Spring%202026` |
| `?course=` works | `?tab=course&course=OT-401` → `4 evaluations / 3.81`, "Clear all" appears |
| Provenance | `git log -S --all` for 3 identifiers, all zero hits; `page.tsx:21-22` read |
| Current build differs | Loaded `exxat-pce-design.vercel.app/analytics` — 3 tabs, no Overview, Leo block |
| §7 theme re-scoping | Loaded faculty tab filtered to Williams; `Theme Distribution` changed `4.18/4.13/3.95` → `4.62/4.58/4.40` |
| §7 no theme on By Course | `find` for theme section on `?tab=course&course=DPT-503` → not found |
| §7 no percentile | Full page text of filtered faculty tab — no percentile string on any surface |
| §7 portfolio scoping | Filtered faculty tab: heatmap 1 row (DPT-503), All Surveys 4 rows, trends by term only |
| §4.1 scope collision | Arithmetic checked: `(4.20+4.32+4.44+4.55)/4 = 4.3775 → 4.38`; card `4.55` = Sp 2026 |

**Not verified:** no axe run, no visual-diff vs `localhost:4000`, no token/DS conformance audit — this
is a black-box walkthrough of a deployed prototype whose source is not in this repo, so DS
conformance is not assessable. Design observations in §5 are from rendered screenshots only.
Data contradictions in §4 are reported as observed; root causes are inferred, not traced to source.
