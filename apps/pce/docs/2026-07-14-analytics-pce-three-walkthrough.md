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
| 1 | **Same screen, two answers.** Faculty identity card says **4.55 / 84%**; the KPI strip directly below says **4.38 / 81%** — for Dr. Marcus Williams, simultaneously. | `?tab=faculty&faculty=m.williams@…` |
| 2 | **Course count disagrees.** Leaderboard: Williams `Professor · 1 course`. Filtered tab: `SURVEYS 4 / 4 courses`. | Overview vs faculty tab |
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

## 7. Verification

| Claim | How checked |
|---|---|
| All 4 sub-nav walked | Clicked Overview / By Faculty / By Course / By Term; `get_page_text` on each |
| Drill-downs | Clicked `View Insights`, `view →`, `View Results`, `View Analytics`, `View Longitudinal Insights`; URL + rendered state recorded per row in §3 |
| `?term=` ignored | `find` → Survey Details still `22 rows` at `?term=Spring%202026` |
| `?course=` works | `?tab=course&course=OT-401` → `4 evaluations / 3.81`, "Clear all" appears |
| Provenance | `git log -S --all` for 3 identifiers, all zero hits; `page.tsx:21-22` read |
| Current build differs | Loaded `exxat-pce-design.vercel.app/analytics` — 3 tabs, no Overview, Leo block |

**Not verified:** no axe run, no visual-diff vs `localhost:4000`, no token/DS conformance audit — this
is a black-box walkthrough of a deployed prototype whose source is not in this repo, so DS
conformance is not assessable. Design observations in §5 are from rendered screenshots only.
Data contradictions in §4 are reported as observed; root causes are inferred, not traced to source.
