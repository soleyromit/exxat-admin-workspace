# Course Evaluation — Design Spec

> PRD-shaped design spec. Source of truth for `apps/pce/admin/app/(app)/course-eval/` + faculty self-view + student survey-taking UX.
>
> **Source:** `apps/pce/docs/research/meetings/2026-05-08-course-evaluation.md` (Aarti, 2026-05-08)
> **Workspace ADRs in force:** ADR-001 (program-level entity universe), ADR-002 (LMS-first), ADR-004 (persona collapse), ADR-005 (AI-first thinking)
> **Maps to action item:** A-1 from the source meeting (write PRD before screens)
> **Status:** Draft — requires Vishal use-case validation (action A-2) before code lands

---

## 1. What this is

The course evaluation flow inside PCE. Course-eval is an **alias of PCE** (per `docs/PRODUCTS.md`), not a separate app — these surfaces live under `apps/pce/admin/` and `apps/pce/student/`.

Three persona views (per ADR-004):
- **Admin** — program director / faculty admin → comprehensive cross-course analytics
- **Faculty** — individual instructor → personal performance, no peer comparison
- **Student** — submits evaluations

---

## 2. Information architecture

### 2.1 Data spine (D-1, immovable)

Every evaluation row is collected at the **course offering** grain — the unique tuple **(faculty × course × term × cohort)**. Every aggregation rolls up from there. This is non-negotiable per Aarti and matches workspace ADR-001.

### 2.2 Routes

Admin app (`apps/pce/admin/app/(app)/course-eval/`):

```
/course-eval                                 → Term overview (default)
/course-eval/cohort                          → Cohort overview tab
/course-eval/faculty/[facultyId]             → Faculty drill-down
/course-eval/course/[courseId]               → Course drill-down
/course-eval/offering/[offeringId]           → Offering drill-down (deepest)
/course-eval/templates                       → Survey template management
/course-eval/templates/[id]                  → Edit a template
```

Faculty self-view (admin app, scoped to current user):

```
/course-eval/me                              → Faculty's personal dashboard
/course-eval/me/courses/[courseId]           → Per-course breakdown
/course-eval/me/action-plans                 → AI-suggested + saved actions
```

Student app (`apps/pce/student/app/`):

```
/surveys                                     → Pending evaluations list
/surveys/[surveyId]                          → Take a survey (single-question-per-screen)
/surveys/[surveyId]/done                     → Submit confirmation
/surveys/responses                           → My past submissions
```

### 2.3 Drill-down chain (per Aarti directive)

```
[High-level AI summary]                                                   
       │                                                                  
       ▼                                                                  
[Question-level detail]                                                   
       │  (click a question)                                              
       ▼                                                                  
[Individual course offering]                                              
       (deepest level — every student submission viewable)                
```

Implements as a sequence of routes, NOT as nested modals. Each level has a stable URL.

---

## 3. Admin term overview (default screen — `/course-eval`)

The most important screen. Loads with the **current term** as default.

### 3.1 Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [☰] Admin / Course Eval                                  [Ask Leo] [⚙]          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Course Evaluation                        [Term: Spring 2026 ▾]  [Cohort: All ▾]│
│  Spring 2026 · 18 courses · 14 faculty · 829 of 1,240 responses (66.9%)        │
│                                                                                 │
│  [ Term  |  Cohort  |  Templates ]    ← view tabs (variant=line)                │
│                                                                                 │
│  ┌─ ✦ AI Insights — cross-course themes ────────────────────────────────────┐  │
│  │                                                                          │  │
│  │  3 themes emerged across 18 courses this term:                           │  │
│  │                                                                          │  │
│  │  ●●●●●●● Online resources lacking                              7 of 18   │  │
│  │  ●●●●●   Pacing concerns in 2nd half                           5 of 18   │  │
│  │  ●●●●●●●●●●●● Strong faculty engagement praised               12 of 18   │  │
│  │                                                                          │  │
│  │  AI confidence: ●●● High · Source: 829 qualitative responses             │  │
│  │  [ View evidence ]  [ Draft action plan ]                                │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌─ Faculty trajectory — small multiples (last 5 terms, shared 3.0–5.0) ────┐  │
│  │                                                                          │  │
│  │  ●●●●●─    ●●●●─●    ●●●●─●    ●●●●●●     ●─●●●●     ●●●●●●            │  │
│  │  Smith     Patel     Lee       Khan ⚠     Garcia      Wilson            │  │
│  │  4.7→4.8   4.3→4.4   4.5→4.6   4.5→3.9    4.0→4.4    4.5→4.6            │  │
│  │                                  outlier                                 │  │
│  │                                                                          │  │
│  │  ●●●●●●    ●─●●●●    ●●●●●─    ●●●●●●     (and 4 more — scroll)         │  │
│  │  …                                                                       │  │
│  │                                                                          │  │
│  │  Click a panel to drill into that faculty's courses.                     │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌─ Course rankings — 18 courses, sorted by current rating ─────────────────┐  │
│  │                                          Median: 4.3                     │  │
│  │  Path Phys I                              ●─────│             4.7        │  │
│  │  Pharm I                               ●────────│             4.5        │  │
│  │  Anatomy II                          ●──────────│             4.4        │  │
│  │  Path II                          ●─────────────│             4.3        │  │
│  │  Pharm II                      ●────────────────│             4.0        │  │
│  │  …                                                                       │  │
│  │  Patient Comm           ●───────────────────────│             3.7  ⚠     │  │
│  │  Med Ethics         ●───────────────────────────│             3.4  ⚠     │  │
│  │                  3.0          3.5         4.0   │   4.5           5.0    │  │
│  │                                                                          │  │
│  │  2 courses below 4.0 threshold. Click to drill in.                       │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌─ Response cadence ──────┐  ┌─ Response funnel ─────────────────────────┐    │
│  │  Calendar heatmap        │  │  Sent     ────► 1,240                    │    │
│  │  Jan 15 → Apr 30, 2026   │  │              ╲   −124 not opened          │    │
│  │  ▤▤▣▤▥▦▣  Fri spike      │  │  Opened   ──► 1,116                       │    │
│  │  ▤▤▤▤▤▥▦                 │  │              ╲   −198 not started         │    │
│  │  ▣▤▥▦▥▤▣                 │  │  Started  ──► 918                         │    │
│  │  ▤▤▥▦▥▣▤                 │  │              ╲   −89 abandoned ⚠          │    │
│  │  ░ ▢ ▣ ▤ ▥ ▦             │  │  Completed─► 829 (66.9% completion)       │    │
│  │  fewer ←→ more           │  │  Largest leak: Started → Completed (−89)  │    │
│  └─────────────────────────┘  └───────────────────────────────────────────┘    │
│                                                                                 │
│  ⚠ Template variance: 4 of 18 courses use a non-standard template. Cross-      │
│     course analysis above limited to 1–5 rating fields only. [ See details ]   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Viz patterns applied (each citation MUST appear in the implementation)

| Section | Pattern | File | Why |
|---|---|---|---|
| AI insights row | `ai-vs-pulled-lane` | `docs/patterns/viz/ai-vs-pulled-lane.md` (VIZ-PATTERN-AI-001) | Aarti's ADR-005 — AI lane visually distinct |
| Faculty trajectory | `small-multiples` | `docs/patterns/viz/small-multiples.md` (VIZ-PATTERN-006) | Replaces "filter by faculty" dropdown UX (VIZ-007 rule) |
| Course rankings | `cleveland-dot` | `docs/patterns/viz/cleveland-dot.md` (VIZ-PATTERN-005) | Median reference line; below-threshold dots `--chart-4` (NEVER red — VIZ-004) |
| Response cadence | `calendar-heatmap` | `docs/patterns/viz/calendar-heatmap.md` (VIZ-PATTERN-007) | Day-of-week intact (VIZ-008 rule mandates this for ≥30 days) |
| Response funnel | `progression-sankey` | `docs/patterns/viz/progression-sankey.md` (VIZ-PATTERN-008) | Drop-off thickness encodes magnitude (VIZ-009 rule) |
| Page-level metric strip (top) | `bullet-vs-target` | `docs/patterns/viz/bullet-vs-target.md` (VIZ-PATTERN-003) | Course count, faculty count, completion % vs target |

### 3.3 A11Y rules in force on this screen

| Rule | What it means here |
|---|---|
| A11Y-001 | All icon-only buttons (settings, filter, expand) get `aria-label` |
| A11Y-002 | Focus rings on all interactive elements use `--ring` |
| A11Y-003 | Body text contrast ≥4.5:1 (DS tokens already comply) |
| A11Y-008 | Outlier panels marked with BOTH amber border AND text label "outlier" — color is not the only encoding |
| A11Y-012 | Skip-to-main link required in admin layout (already satisfied at app shell) |
| A11Y-013 | Save / refresh / loading states wrapped in `aria-live="polite"` banner |
| A11Y-016 | Sticky header → `scroll-padding-top` set on main scroll container |
| A11Y-017 | Chart axes ≥3:1 contrast against background — DS chart tokens comply |
| A11Y-019 | Page has exactly one `<h1>` ("Course Evaluation"); subsection headings are `<h2>` |

### 3.4 DS components used

| Component | Use |
|---|---|
| `Button` | Filters trigger, "View evidence", "Draft action plan", drill-in |
| `Tabs` (variant=line) | Term / Cohort / Templates view tabs |
| `Select` | Term picker, cohort filter, department filter |
| `Card` | Each section block |
| `Badge` | "outlier" callout, completion % |
| `LocalBanner` | Template variance notice (per A11Y-013) |
| `DataTable` | NOT used here directly — Cleveland dot replaces sorted-bar list (VIZ-007 spirit) |
| `DropdownMenu` | Card actions (export, expand, configure) |
| `Tooltip` | Outlier reason on hover; completion delta on hover |

### 3.5 Empty / loading / error states

- **Empty (no surveys distributed yet this term):** illustration + "No evaluations distributed for Spring 2026 yet. [ Distribute survey → ]" — actionable empty state per CONTENT-002
- **Loading:** Skeleton placeholders matching final viz shape; never spinners over the whole page
- **Error (data fetch failed):** `LocalBanner` `role="alert"` `aria-live="assertive"` with retry button
- **Template variance > 50% of courses:** elevate banner to amber `--conditional-rule-orange`; cross-course viz hidden, only per-course rendered

---

## 4. Admin cohort overview (`/course-eval/cohort`)

### 4.1 Wireframe sketch

```
[Cohort: Class of 2027 ▾]  [Year in program: 2 of 4]  [Track: All ▾]

Class of 2027 · 78 students · entered Fall 2025 · currently in 4th term
Didactic completed: 12 courses · Currently in: Pharmacology II + 4 more

┌─ Course evaluations across 4 terms ──────────────────────────────────────┐
│                                                                          │
│  Slope graph — paired comparison Fall 2025 → Spring 2026                 │
│                                                                          │
│  Path Phys I        ●──────────●  4.5 → 4.7    movers ↑                  │
│  Anatomy I          ●──────────●  4.3 → 4.6    movers ↑                  │
│  Pharm I            ●──────────●  4.5 → 4.5    flat                      │
│  Med Ethics         ●─────────╲   3.8 → 3.4    declined ⚠                │
│                                ╲                                          │
│                                 ●                                         │
│                                                                          │
│  3 of 12 courses moved up; 1 declined ≥ 0.3 points.                      │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Didactic vs clinical ─────────────────────────────────────────────────┐
│  Two small-multiples panels split by course type.                       │
│  (didactic = lecture-based; clinical = practice-based)                   │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Viz patterns applied

- **Slope graph (paired)** for Fall→Spring per course (VIZ-PATTERN-004)
- **Small multiples** split didactic vs clinical (VIZ-PATTERN-006)
- **Cleveland dot** secondary view for current-term ranking within cohort

---

## 5. Admin faculty drill-down (`/course-eval/faculty/[id]`)

### 5.1 Wireframe sketch

```
< Back to term overview

Dr. Khan (faculty) · Pharm II · Spring 2026 + 5 prior terms
Currently teaching 2 courses · Avg rating: 4.0 (departmental: 4.3)

┌─ Trajectory across 6 terms ──────────────────────────────────────────────┐
│  Larger version of the small-multiples panel from term overview          │
│                                                                          │
│  Sparkline + delta:        4.6 → 4.5 → 4.7 → 4.5 → 4.0 → 3.9   ↓ −0.1   │
│                                                                          │
│  Department average:       ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ 4.3      │
│                                                                          │
│  Khan's series sits below dept average for 2 consecutive terms.          │
└──────────────────────────────────────────────────────────────────────────┘

┌─ Per-course breakdown — bullet vs department average ────────────────────┐
│                                                                          │
│  Pharm II    █████████░░  4.0     dept: ────────── 4.3                  │
│  Pharmacology Quizzes Spring 2026                                        │
│                                                                          │
│  Pharm II Lab  ████████░░  3.9    dept: ────────── 4.2                  │
│  Pharmacology Lab Spring 2026                                            │
│                                                                          │
│  ↑ click a row to drill into individual course offering                  │
└──────────────────────────────────────────────────────────────────────────┘

┌─ ✦ AI insights — themes from Khan's evaluations ─────────────────────────┐
│  Pacing concerns: 18 of 42 responses                                     │
│  Difficult exam structure: 14 of 42 responses                            │
│  Clear lectures: 31 of 42 responses                                      │
│  ─                                                                       │
│  Recommended action: revisit pacing for chapters 7–9 (cited in 12 of 18) │
│  [ Save action ]   [ Discuss with chair ]                                │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Admin offering drill-down (`/course-eval/offering/[id]`)

### 6.1 Purpose

Deepest level — individual course offering. Every student submission viewable here.

### 6.2 Wireframe sketch

```
< Back to course (Pharm II) | < Back to faculty (Khan)

Pharmacology II · Khan · Spring 2026 · Class of 2027
42 of 51 responses (82%) · last submission 4 hours ago

┌─ Quantitative — per question ────────────────────────────────────────────┐
│                                                                          │
│  Question                              Avg    Distribution               │
│  Lecture clarity                       4.3    ░░░░▣▤▥▥▥▦                 │
│  Lecture pacing                        3.6    ▢▢▣▤▤▥▤▣▢                 │
│  Course materials                      4.4    ░░░▢▤▥▥▥▦▦                 │
│  Exam structure                        3.8    ▢▣▣▤▤▤▥▥▣                 │
│  Office hours availability             4.5    ░░▢▣▤▤▥▥▦▦                 │
│  Overall course rating                 4.0    ░▢▣▣▤▤▤▥▥▣                 │
│                                                                          │
│  Click a question to see all responses.                                  │
└──────────────────────────────────────────────────────────────────────────┘

┌─ ✦ AI themes from qualitative responses (n=42) ──────────────────────────┐
│  Themes are AI-extracted — verify by clicking through to source.          │
│                                                                          │
│  ●●●●●●●●●●●●  Pacing in chapters 7–9      18 mentions  [ See quotes ]  │
│  ●●●●●●●●●     Exam covered material not lectured  14    [ See quotes ]  │
│  ●●●●●●        Lab time too short          9 mentions   [ See quotes ]  │
│  ●●●●●●●       Strong office hours          7 mentions  [ See quotes ]  │
│                                                                          │
│  AI confidence: ●●● High · Themes verified by similarity threshold       │
└──────────────────────────────────────────────────────────────────────────┘

┌─ All responses (anonymous) ──────────────────────────────────────────────┐
│  [Filter: all ▾]                       Sort: most recent ▾  | rating ↓   │
│                                                                          │
│  ★★★★☆ 4.0  Spring 2026 · Submitted 2 days ago                          │
│  "The professor knows the material well, but the pace in the second      │
│   half made it hard to keep up. Lab sessions were rushed."               │
│  Themes: pacing, lab time                                                │
│                                                                          │
│  ★★★☆☆ 3.0  Spring 2026 · Submitted 4 days ago                          │
│  "Exam questions covered topics not addressed in class lectures."        │
│  Themes: exam structure                                                  │
│                                                                          │
│  …                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Faculty self-view (`/course-eval/me`)

### 7.1 Critical guardrail (D-4)

**Faculty cannot see peer comparisons by name.** Only their own performance vs averaged benchmarks (department, university). NO ranked lists of other faculty. NO "you're #4 of 14" framing.

### 7.2 Wireframe sketch

```
[☰] Faculty / My Course Evaluations                                      

Welcome, Dr. Khan
Spring 2026 · 2 active courses · 84 of 102 responses

┌─ My trajectory across last 6 terms ──────────────────────────────────────┐
│  4.0                                                                     │
│  4.5  ●─────●─────●─────●                                                │
│              \                                                           │
│  4.0          ●─────●                                                    │
│                       \                                                  │
│  3.5                   ●  ← Spring 2026                                  │
│       Fa24 Sp25 Fa25 Sp26                                                │
│                                                                          │
│  Department avg ──────────────────────────  4.3                          │
│                                                                          │
│  Your rating dropped 0.4 over 2 terms.                                   │
└──────────────────────────────────────────────────────────────────────────┘

┌─ My courses — bullet vs department average ──────────────────────────────┐
│  (same pattern as faculty drill-down §5.2 — but no other-faculty visible)│
└──────────────────────────────────────────────────────────────────────────┘

┌─ ✦ AI insights — themes from your evaluations ───────────────────────────┐
│  Pacing concerns (18 of 42 responses)                                    │
│  Exam structure (14 of 42)                                               │
│  Clear lectures (31 of 42)                                               │
│  ─                                                                       │
│  AI suggested action: revisit pacing for chapters 7-9                    │
│  [ Save to my action plan ]    [ Reject ]                                │
└──────────────────────────────────────────────────────────────────────────┘

┌─ My action plan ─────────────────────────────────────────────────────────┐
│  ☐ Revise pacing chapters 7-9                       Saved 2026-04-22     │
│  ☑ Move to weekly office hours instead of bi-weekly Saved 2026-04-15     │
│  ☐ Add formative quiz at midpoint                   Saved 2026-03-30     │
└──────────────────────────────────────────────────────────────────────────┘
```

### 7.3 What's NOT shown (guardrail enforcement)

- ❌ Cleveland dot plot of faculty rankings (by name)
- ❌ Faculty leaderboard
- ❌ "Top 5 faculty this term"
- ❌ "Other faculty in your department" with names + ratings
- ❌ Any peer-comparison metric ("you're at the 60th percentile" included — that reverse-encodes peer rank)

✅ Allowed: department average, university average, threshold (e.g., "below 4.0").

---

## 8. Student survey-taking (`apps/pce/student/`)

### 8.1 Pending evaluations list (`/surveys`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ My Course Evaluations                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ 3 pending · Due in 7 days                                               │
│                                                                         │
│ Pharmacology II                            12 questions · 8 min         │
│ Dr. Khan · Spring 2026                                                  │
│ Closes May 16, 2026                                  [ Take survey →  ] │
│                                                                         │
│ Pathophysiology II                         12 questions · 8 min         │
│ Dr. Garcia · Spring 2026                                                │
│ Closes May 16, 2026                                  [ Take survey →  ] │
│                                                                         │
│ Patient Communication                      10 questions · 6 min         │
│ Dr. Wilson · Spring 2026                                                │
│ Closes May 18, 2026                                  [ Take survey →  ] │
│                                                                         │
│ ─                                                                       │
│ Already submitted (this term)                                           │
│ Anatomy II  · ★★★★☆ 4.0  · Apr 12   [ View ]                           │
│ Path Phys I · ★★★★★ 5.0  · Apr 10   [ View ]                           │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Single-question take screen (`/surveys/[id]`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Pharmacology II / Dr. Khan                                  3 of 12   │
├─────────────────────────────────────────────────────────────────────────┤
│ ●●●○○○○○○○○○                                                            │
│                                                                         │
│                                                                         │
│   How would you rate the pacing of lectures?                            │
│                                                                         │
│                                                                         │
│   ◯  1 — Way too fast / way too slow                                    │
│   ◯  2 — Often too fast or too slow                                     │
│   ◯  3 — Mostly OK                                                      │
│   ◯  4 — Well-paced most of the time                                    │
│   ◯  5 — Excellent pacing                                               │
│                                                                         │
│   Comment (optional)                                                    │
│   ┌───────────────────────────────────────────────────────────────────┐ │
│   │                                                                   │ │
│   │                                                                   │ │
│   └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│                                                  [ Back ]  [ Next →  ]  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

Per ANALOGY-01 (TypeForm one-at-a-time): single question per screen reduces cognitive load. Use `--brand-color` for selected radio. Touch targets all ≥44px (A11Y-005). Live region announces progress per A11Y-013.

### 8.3 A11Y on student survey screen

| Rule | Manifests |
|---|---|
| A11Y-005 | Radio touch targets ≥44px (DS RadioGroup compliant) |
| A11Y-011 | Every input has explicit `<Label htmlFor>` association |
| A11Y-012 | Skip-to-main link in student layout |
| A11Y-013 | Progress count ("3 of 12") in `aria-live="polite"` region |
| A11Y-014 | "Next" button conveys purpose without context (not "click here") |
| A11Y-019 | Question is `<h1>` per page; "Comment (optional)" is `<h2>` |

---

## 9. AI integration plan (per Aarti's 3 pillars)

### 9.1 Three pillars (from D-1 era + 2026-05-08 reaffirmed)

1. **Research analytics** — what does the data say
2. **Action items from data** — what should be done about it
3. **Building evaluation templates** — AI-suggested question sets

### 9.2 Pillar manifestation in this design

| Pillar | Where | Pattern |
|---|---|---|
| Research analytics | "AI insights — cross-course themes" panel on term overview | `ai-vs-pulled-lane.md` |
| Action items | "Recommended action" in faculty drill-down + "Draft action plan" CTA on term overview | Same pattern |
| Template building | `/course-eval/templates/[id]` (out of scope for v1; queue) | Defer |

### 9.3 AI affordance discipline (per ai-vs-pulled-lane.md)

- AI lane has `--brand-color` accent + `fa-sparkles` (NOT `fa-star-christmas` — that's reserved for Leo per the DS — Leo = AvatarLeoAssistant)
- AI source citation MUST be visible — "based on 829 qualitative responses"
- AI confidence indicator MUST be visible — `●●●` high / `●●○` medium / `●○○` low
- AI output is REJECTABLE — never auto-applied. Faculty + admin decide.

---

## 10. Template-consistency UX (concern C-1, C-2)

### 10.1 Detection

Compute "template variance" per term: count of distinct survey templates active across courses in the term.

```typescript
const templateVariance = new Set(courses.map(c => c.templateId)).size
```

### 10.2 UX response

| Variance | Banner | Cross-course viz |
|---|---|---|
| 1 (single template) | none | full |
| 2-3 templates | LocalBanner: "N templates in use across these courses. Cross-course analysis below covers shared 1-5 rating fields only." | full but limited to common fields |
| ≥4 templates OR > 50% of courses | Amber LocalBanner: "Heavy template variance — cross-course analysis is not reliable. Use per-course views." | hidden; only per-course views shown |

### 10.3 Where the banner sits

Top of the "Course rankings" section (since that's where cross-course aggregation is most affected). Banner content has [ See details ] link to the templates list.

---

## 11. State / data model (high level)

```typescript
type CourseEvaluation = {
  offeringId: string                 // (faculty × course × term × cohort)
  facultyId: string
  courseId: string
  termId: string
  cohortId: string
  templateId: string                 // critical for variance detection
  responses: Response[]
  metrics: {
    averageRating: number
    completionRate: number
    responsesReceived: number
    responsesSent: number
  }
  qualitativeThemes?: AIInsight[]    // populated async by AI service
}

type AIInsight = {
  theme: string                      // "Pacing concerns"
  mentions: number
  evidenceSnippets: string[]         // 3-5 sample quotes for citation
  confidence: 'high' | 'medium' | 'low'
  generatedAt: Date
  staleSince?: Date                  // if pulled data refreshed but AI didn't
}

type ActionPlan = {
  id: string
  facultyId: string
  text: string
  source: 'ai-suggested' | 'faculty-authored'
  status: 'pending' | 'in-progress' | 'completed'
  createdAt: Date
}
```

---

## 12. Open questions (require Vishal/Aarti before code)

| Q | Routes to |
|---|---|
| What happens when an evaluation is in-progress (started but not submitted) and the term ends? Auto-discard or carry forward? | Vishal |
| Is the action plan shared with the chair / admin? Or strictly private to faculty until faculty shares? | Aarti |
| Cohort-based view default cohort: most-recent-graduating-class or current-class? | Aarti |
| AI confidence thresholds: how is "high" computed? (theme similarity score? quote count?) | Aarti + AI team |
| Template editing UX: out of scope for v1, but is there an MVP cut? | Aarti / Vishal |

---

## 13. Implementation sequence

### Sprint 1 — Admin term overview (this is the spike)

1. Route `apps/pce/admin/app/(app)/course-eval/page.tsx` + layout
2. Tab bar (Term / Cohort / Templates) using DS `Tabs` variant=line
3. Filter row (Term / Cohort / Department selects)
4. AI insights row using `ai-insight-card.tsx` (UPGRADED — see component upgrades note below)
5. Faculty trajectory using new `<SmallMultiples>` component (NEW — implementing VIZ-PATTERN-006)
6. Course rankings using new `<ClevelandDot>` component (NEW — implementing VIZ-PATTERN-005)
7. Response cadence using new `<CalendarHeatmap>` component (NEW — implementing VIZ-PATTERN-007)
8. Response funnel using new `<ProgressionSankey>` component (NEW — implementing VIZ-PATTERN-008)
9. Template variance banner using DS `LocalBanner` (per A11Y-013)

### Sprint 2 — Cohort overview

1. Route `/course-eval/cohort`
2. Slope-paired graph using new `<SlopeGraph>` component (NEW — implementing VIZ-PATTERN-004)
3. Didactic vs clinical small-multiples split

### Sprint 3 — Drill-downs

1. `/course-eval/faculty/[id]` (uses upgraded `<TrendSparkline>`)
2. `/course-eval/course/[id]`
3. `/course-eval/offering/[id]` (deepest)

### Sprint 4 — Faculty self-view

1. `/course-eval/me`
2. `/course-eval/me/courses/[id]`
3. `/course-eval/me/action-plans`
4. **Privacy guardrail tests**: peer-comparison fields ABSENT from this surface

### Sprint 5 — Student survey-taking

1. `/surveys` list
2. `/surveys/[id]` single-question-per-screen
3. `/surveys/[id]/done` confirmation

---

## 14. Component upgrades implied (from viz audit)

These are implementation prerequisites for Sprint 1:

| Component | Upgrade | Pattern |
|---|---|---|
| `apps/pce/admin/components/pce/ai-insight-card.tsx` | Add `themes` chip row, `confidence` indicator dots, `staleSince` callout | ai-vs-pulled-lane |
| `apps/pce/admin/components/pce/trend-sparkline.tsx` | Add min/max marker dots, `band` prop for cohort range, `currentLabel` | bullet-vs-target / sparkline |
| (NEW) `apps/pce/admin/components/pce/small-multiples.tsx` | Build per VIZ-PATTERN-006 spec | small-multiples |
| (NEW) `apps/pce/admin/components/pce/cleveland-dot.tsx` | Build per VIZ-PATTERN-005 spec | cleveland-dot |
| (NEW) `apps/pce/admin/components/pce/calendar-heatmap.tsx` | Build per VIZ-PATTERN-007 spec | calendar-heatmap |
| (NEW) `apps/pce/admin/components/pce/progression-sankey.tsx` | Build per VIZ-PATTERN-008 spec | progression-sankey |
| (NEW) `apps/pce/admin/components/pce/slope-graph.tsx` | Build per VIZ-PATTERN-004 spec | slope-paired |

---

## 15. ADR candidates produced by this spec

If approved, draft these ADRs into `apps/pce/docs/decisions/`:

- **PCE-ADR-002** — Course offering as the atomic data grain for evaluations (codifies D-1)
- **PCE-ADR-003** — Faculty self-view: no peer comparisons (codifies D-4)
- **PCE-ADR-004** — Template-consistency degradation policy (codifies C-1, C-2 response)

---

## 16. Maintenance

When this spec changes:
1. Update the relevant section + bump the date in the section header
2. If a decision changes, add a new dated meeting note in `apps/pce/docs/research/meetings/`
3. Don't silently re-interpret — backlink-audit will catch missing citations
4. After implementation lands, link from this spec to the actual files
