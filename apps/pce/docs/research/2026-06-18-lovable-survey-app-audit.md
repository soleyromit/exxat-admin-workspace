# Reference Audit — Lovable "Exxat Surveys" app vs PCE admin

**Date:** 2026-06-18
**Reference:** https://exxat-survey.lovable.app (org: Johns Hopkins University · School of Medicine)
**Audited by:** traversed every reachable route via web fetch. Two surfaces could **not** be
inspected (client-rendered, no static route): the **New-evaluation creation flow**
(`/evaluations/new` → 404; almost certainly a modal/sheet triggered by the "New evaluation"
button) and the **Template editor** (deep route fell back to the dashboard shell). Treat those
two as "not yet audited," not "absent."

---

## 1. Their information architecture

```
Surveys
├── Course Evaluations          /evaluations         (list + monitoring panels)
│   ├── Dashboard               /evaluations/dashboard
│   ├── Templates               /evaluations/templates
│   ├── Course Offerings        /courses
│   └── Faculty & Staff         /faculty
├── General Surveys             /surveys
Directory
└── Students                    /students
Insights
├── Reports                     /reports
└── Settings                    /settings
```

Two IA moves worth noting:
- **Course Offerings + Faculty are nested *under* Course Evaluations** — placed where the
  evaluation job happens, not in a generic directory.
- **No Terms entity.** Term/calendar config lives in **Settings → Academic Calendar**.
- **Reports** is a cross-cutting "Insights" hub, separate from the per-evaluation Dashboard.

Our PCE IA, by contrast: `Course Evaluation` (Evaluations/Templates/Analytics) ·
`Programmatic Surveys` · `Directory` (Students/Faculty/Course Offerings/Terms) ·
`Setup` (8 items).

---

## 2. Gaps — what they have that we're missing

Prioritized. Each row: what it is · where seen · our current state · recommendation.

### P1 — high value, clear gaps

| # | Gap | Their version | Our state | Recommendation |
|---|-----|---------------|-----------|----------------|
| 1 | **Evaluation monitoring Dashboard** | Dedicated dashboard: status distribution (Live/Scheduled/Closed/Draft), Response-by-course-type, At-risk table, Top responding, Recent | Our Evaluations hub is a **list** with a few KPIs; no monitoring dashboard | Add a Dashboard surface under Course Evaluation (we already have the `Analytics` slot — could host it, or a new "Overview") |
| 2 | **"Courses at risk" panel** | Front-and-center table of courses **below 60% response**, for proactive nudging | We have a **Nudge** action but it's buried in Analytics rows; no at-risk roll-up | Surface an at-risk panel on the dashboard; reuse existing Nudge action |
| 3 | **Response-by-course-type viz** | Didactic 86% vs Clinical 61% completion side-by-side | We carry `courseType` in data but don't visualize the split | Add a small grouped bar / two-stat block on the dashboard |
| 4 | **Settings → Access Controls (RBAC)** | System vs Custom roles table, **permission-matrix editor**, "+ New custom role", **immutable audit trail** of RBAC changes | We have role **assignment** (role × scope); matrix editor is Phase 2 (pending Vishaka R7); **no audit trail** | Plan the matrix editor + audit log; custom-role creation |

### P2 — column / detail-page parity

| # | Gap | Their version | Our state | Recommendation |
|---|-----|---------------|-----------|----------------|
| 5 | **Faculty directory columns** | Name · **Type** (faculty/staff) · **Rank** · Department · **Position** · Courses · Surveys · **Status** | Name · Department · Offerings · Completion · Avg rating | Add Type, Rank, Position, Status; we keep the richer Completion/Rating |
| 6 | **Faculty detail — contact + role** | Email + **phone**, title line "Associate Professor · PT · **Department Chair**", status badge, **Surveys tab**, "View in PRISM" | Avatar, dept, KPIs, **radar + distribution band** (richer!), Courses table | Add contact info, rank/role line, a Surveys tab. **Keep our radar/distribution — they don't have it** |
| 7 | **Course Offerings extras** | **Program** column, **per-term-group totals** ("2026 · Fall — 8 courses, 625 students"), "**Active courses only**" toggle, "Push survey" at top | We have grouping + status + response; check Program col + group totals + active toggle | Add Program column, group subtotal counts, active-only toggle |
| 8 | **Students directory columns** | Name · Student ID · Cohort · **Campus** · **Category** · Courses · Surveys · Status (Active/On Leave/Graduated) | Name · ID · Email · Cohort · Status · Accommodations · Courses · Evals | Add Campus, Category; confirm On-Leave/Graduated statuses. We keep Email + Accommodations |
| 9 | **General Surveys "Target population"** | Clean scope column: "Graduating cohort", "All faculty", "DPT Year 3", "All students" | Programmatic surveys exist; verify the audience/scope is shown this cleanly | Surface target-population as a first-class column |

### P3 — smaller / cosmetic

| # | Gap | Note |
|---|-----|------|
| 10 | Breadcrumb prefix "Admin › …" | They anchor every breadcrumb to "Admin". We anchor to the section (Directory/Analytics). Stylistic — decide one convention. |
| 11 | KPI deltas ("+4% vs last term") | They show period-over-period deltas on KPIs. Our KPIs are static (`delta: ''`). Add trend deltas where data allows. |
| 12 | "Responses collected: 470 of **1,006 students**" | Absolute numerator/denominator alongside the %. Cheap, informative. |

---

## 3. Where we're already ahead (preserve — do not regress)

- **Analytics drill-ins**: dedicated faculty + course profile pages with **radar + rating-over-time
  distribution band**. Their faculty detail is a plain courses table; their Reports page is thin
  (no term/faculty breakdown, no export).
- **By Term / By Faculty / By Course** analytics tabs with nudge.
- **Ask Leo AI built-in** — they gate "AI insights" behind an "Exxat One Premium" upsell.
- **Terms as a first-class entity** with `enabledForEval` + the **Activation wizard** and
  **Push Evaluation** from faculty/offering selection.
- **Deeper Setup**: Reminder Schedule, Competencies, Content Areas, Standards, Assessment Types,
  Accommodations.

---

## 4. IA decisions for Romit

1. **Nest Course Offerings + Faculty under Course Evaluation?** They place these contextually
   under the evaluation job; we just moved them to a generic Directory. Worth a deliberate call.
2. **Terms → Academic Calendar in Settings?** They treat term/calendar as config, not a directory
   entity. We made Terms first-class (it drives the Activation wizard) — likely keep ours, but note
   the divergence.
3. **Dashboard vs Analytics naming.** They split "Dashboard" (live monitoring) from "Reports"
   (analysis). We have one "Analytics". Decide if we want a monitoring Overview + deeper Analytics.

---

## 5. Not yet audited (need a second pass)

- **New-evaluation creation flow** — compare their wizard/modal against our 5-step Activation wizard.
- **Template editor / question builder** — question types, sections, AI/question-bank assist.

To capture these: screen-record or screenshot the two flows in their app, or share the Lovable
project source.
