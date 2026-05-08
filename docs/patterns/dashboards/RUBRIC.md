# Dashboard Pattern Rubric

> Binds workspace ADR-005 (AI-first thinking) + per-product audit decisions (D14 two-question dashboards).
> Dashboards answer questions. If you can't name the question a card answers, the card shouldn't exist.

---

## The three dashboard shapes

| Shape | Purpose | Pattern |
|---|---|---|
| **Two-question dashboard** | Answer pair: "Am I doing X?" + "Is X working?" — used in curriculum + assessment contexts | (P3) `two-question-dashboard.md` |
| **Leaderboard + drilldown** | Surface top-N + bottom-N + click into any | (P4) `leaderboard-drilldown.md` |
| **Trend + cohort comparison** | One entity over time, with cohort overlay | (P4) `trend-cohort-overlay.md` |

---

## Composition rules

| Rule | Why |
|---|---|
| Every card answers ONE named question | If you can't name it, cut the card |
| Pulled vs AI lanes are visually distinct | ADR-005 — users need to know which content is computed vs generated |
| Frequency counts > percentages for coverage data | Aarti audit D17 — "8 of 20 questions" beats "40%" |
| Three-tier scaling: top-level summary + drill-in + detail | Don't try to fit everything on the landing |
| Color is never the only encoding | A11Y-008 |

---

## The two-question framework (workspace pattern)

From the audit (D14):

> "Am I teaching everything I must teach?" + "Am I testing what I'm teaching?"

Generalizes beyond Exam Mgmt:
- **PCE / CFE:** "Am I rating fairly?" + "Are themes consistent across cohorts?"
- **Skills Checklist:** "Am I observing every required skill?" + "Are observations consistent across preceptors?"
- **Patient Log:** "Am I logging the required encounters?" + "Are diagnoses distributed as expected?"
- **Learning Contracts:** "Are contracts on track?" + "Are outcomes meeting commitments?"

Two questions, two dashboards, one pattern.

---

## Anti-patterns

- ❌ Decorative metrics ("Total students: 1,247" with no decision attached) — cut
- ❌ Mixing pulled and AI content without visual distinction — ADR-005 violation
- ❌ Percentages for coverage when frequency tells the story better — D17
- ❌ Single-axis dashboards that try to answer both questions in one screen — split into two surfaces
- ❌ Auto-refreshing dashboards without "last updated" indicator — see async/RUBRIC.md

## Pattern catalogue (this folder)

P3 (this round):
- `two-question-dashboard.md` — D14 across products

P4+ (later): `leaderboard-drilldown.md`, `trend-cohort-overlay.md`, `coverage-frequency-chart.md`
