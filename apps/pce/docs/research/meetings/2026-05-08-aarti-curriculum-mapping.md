---
type: meeting
date: 2026-05-08
time: 16:09 EDT
product: pce
also-affects: [exam-management, workspace]
participants: [Aarti, Romit, Vishaka (named, did not speak)]
source: granola
granola_id: f274ade0-f47a-4d61-bbdc-1eeee5e08ca0
duration: ~60min
---

# 2026-05-08 16:09 — Aarti curriculum mapping + base entities + product alignment

> **Second Aarti meeting today** (first was 12:44 PM, see `2026-05-08-aarti-design-review.md`). Vishaka was named as participant but did not speak meaningfully on PCE — her PCE-specific perspective file remains a scaffold; dedicated session needed.

## Topics covered

1. Curricular Assessment Loop — 4-phase model (must-teach → teaching → assessing → learning)
2. Base entity universe + refinements vs 12:44 PM
3. Product alignment Exam Mgmt ↔ CFE
4. Comp Genie–style AI gap analysis (new today)
5. CFE dashboard structure (Term + Cohort axes; faculty one-click-down)
6. Aarti's process anti-patterns (prototype-first, persona-wearing)

## Verbatim Aarti quotes

> "If I teach them and I don't assess them, I don't have evidence that students learn. If I don't teach them and I assess them, I'm being unfair to them."

> "Either we create the link between the standard and the questions via the course objective… or we also allow them to directly map their questions to the standards independent of their course mapping."

> "Whenever you are collecting information or a student is doing it, it is always on a course offering, which is for a particular cohort in a particular term."

> "Faculty is one click down" — i.e., not a top-level dashboard axis; one click from term/cohort.

> "What Influx has been [doing], they call it the Comp Genie feature. For all published content area standards, like the NAPLEX blueprint or the NCLEX for nursing… AI has that."

> "It is not [Romit's] position to start answering the question, what would a program director want to see? That's not expected."

> "There is no document that lists all of these things. And then I will get on a review call, and I will see eight versions of it, and I will lose it."

> "My whole definition of Prism is going to have to change… Prism is no longer Prism, it's modules."

> "Just go fucking create these pages. Like, what are you waiting for?"

## Decisions (15; details in audit report)

| # | Decision | Product | ADR? |
|---|---|---|---|
| D1 | Curricular Assessment Loop = canonical 4-phase model | All | yes |
| D2 | Two question-mapping pathways: via course objective + direct-to-standards | Exam Mgmt | yes |
| D3 | Course offering = `course × term × cohort × faculty` (4-tuple, was 3-tuple) | All | yes |
| D4 | CFE has TWO top-level dashboard axes: Term + Cohort | CFE | yes |
| D5 | Faculty is one-click-down, NOT a top-level axis | CFE | yes |
| D6 | Phase 1 = 3 roles + 2 faculty sub-roles (Course Coordinator vs Instructor) | All | yes (refines morning persona collapse) |
| D7 | Collaborator = first-class concept (read-only / co-edit) | Exam Mgmt + CFE | yes |
| D8 | Comp Genie–style AI: gap analysis vs published board blueprints (NAPLEX/NCLEX) — NO customer data needed | Exam Mgmt | yes |
| D9 | Course landing = assessments primary, course details secondary tabs | Exam Mgmt | small |
| D10 | All net-new screens in React; legacy Angular opens in new tab | All | small |
| D11 | Prism redefined: module shell, not destination; base entities platform-level | Platform | yes (reinforces workspace ADR-003) |
| D12 | Faculty profile = shared component between Exam Mgmt + CFE | Platform | small |
| D13 | Assessment types phased: P1 quizzes/take-home/proctored; P2 lockdown; P3 monitored | Exam Mgmt | small |
| D14 | AI summaries surface BEFORE question-level detail at every aggregation level | CFE | small |
| D15 | Curriculum mapping is NOT a prerequisite; AI value scales with data | Exam Mgmt | small |

## CFE design tasks (11 — actionable)

| # | Task | Priority |
|---|---|---|
| C1 | Restructure top-level dashboards into Term + Cohort axes; faculty becomes drill-down | **P0** |
| C2 | Course offering as atomic data unit (4-tuple) | P0 |
| C3 | AI insights summary card at every aggregation level | P1 |
| C4 | Drill-down: summary → question detail (not the reverse) | P1 |
| C5 | Add clinical vs didactic split as filter on cohort dashboard | P1 |
| C6 | Course-level summary: how-am-I-doing + how-vs-others (already partial) | P2 |
| C7 | Trend viz at course-offering level (slope per offering) | P1 |
| C8 | Faculty page: list of course offerings taught + table; one click down from term/cohort | **P0** |
| C9 | Template-aggregation guard rail (warn on aggregating across mismatched templates) | P2 |
| C10 | Trim speculative dashboard polish (Aarti's anti-pattern) | P1 |
| C11 | 3-persona collapse already in DESIGN.md applies (no PD/CCC/Dean as separate views) | already done |

## Cross-product implications

- Faculty profile shared base-entity React page (Exam Mgmt + CFE today; PCE/Patient Log/Skills/Learning Contracts later)
- Course detail page (objectives, syllabus, reading material, lectures, events) shared across modules
- Course offering 4-tuple is platform-level
- Collaborator pattern is platform-level
- Comp Genie pattern reusable (PCE clinical placements vs accreditor-published competencies; Skills vs profession-published lists)

## What changes in current PCE/CFE design

Today's findings against current admin app at `apps/pce/admin/`:

| Current state | Change required | Rule |
|---|---|---|
| `/analytics` shows course leaderboard + faculty leaderboard at top level (peers) | Demote faculty leaderboard from top — make faculty one-click drill-down | C8, D5 |
| Cohort grouping toggle exists (UC-07) | Reframe as Term axis ↔ Cohort axis (two equal top-level views) | C1, D4 |
| No clinical/didactic filter | Add toggle/filter on cohort view | C5 |
| Course-level trend uses arrows/deltas only | Add slope chart per offering | C7 |
| Term aggregation may mix templates silently | Add template-aggregation banner | C9 |

## Process anti-patterns Aarti called out

- ❌ Prototype-first design before alignment ("you'll get so many things wrong if you start here")
- ❌ Wearing personas you're not (Romit can't decide what a Program Director wants to see)
- ❌ Undocumented decisions ("eight versions of it, and I will lose it")
- ❌ Speculative dashboard polish (trend graphs, viz without articulated purpose)

## Vishaka voice — STILL SCAFFOLD

Vishaka was a meeting participant but the transcript shows ~100% Aarti↔Romit dialogue. No PCE-specific Vishaka contribution captured. Action: schedule dedicated PCE-only session with Vishaka before relying on her input for PCE design.
