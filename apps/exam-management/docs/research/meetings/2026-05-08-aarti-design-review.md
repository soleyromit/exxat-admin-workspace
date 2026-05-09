---
type: meeting
date: 2026-05-08
product: exam-management
also-affects: [pce, workspace]
participants: [Aarti, Romit, Vishakha (briefly)]
source: granola
granola_id: 4e1c850e-d760-4d05-81a1-a52287b9ae21
session: d0d0715e-ee0f-4acb-a5b0-ecdacd1c4d53
duration: ~3hr
---

# 2026-05-08 — Aarti design review (Exam Management + PCE)

> Cross-product meeting. Same content saved at `apps/pce/docs/research/meetings/2026-05-08-aarti-design-review.md`.

## Topics walked through (in order)

1. Faculty home — courses split, course-add controls
2. Admin view — master courses, terms, course offerings, faculty assignment, role permissions
3. Live monitoring dashboard — student-centric counts, flag handling, alerts, redundancy
4. Assessment statuses + types — taxonomy needs alignment
5. Assessment review/curving — overview tab, per-question analysis, content-area & Bloom's coverage
6. Question-bank gap analysis — moved from competency screen to course screen
7. Accommodations — shared global module, admin-controlled, faculty read-only
8. Course-Faculty Evaluation (PCE/CFE) — collapse to 3 personas, term-based dashboard, AI themes, no QB

## What Aarti is frustrated about

> "My blood boils when we're debating ancillary things without foundationally at least getting facts understood."

Aarti pushed back hard on visualization-first work. She wants the foundational architecture document done first: assessment types, statuses, role/permission matrix, accommodations list, content/competency taxonomies, master entity universe. Then UI.

## Cross-product architectural decisions

These affect the whole workspace, not just Exam Management or PCE:

- **Program-level entity universe** — master lists of courses, terms, course offerings, students, accommodations, content areas, competencies, standards, faculty, permissions, assessment types live ONCE at program level and are subset by each module.
- **LMS-integration-first default** — assume LMS integration is on; when on, disable manual add controls. Today ~5% of customers integrate; this should flip to 95%.
- **Independent module sellability** — every module must be standalone-sellable. Each needs its own student / faculty / course / term entity views (data is shared, views are per-module).
- **Module launcher replaces Prism dashboard** — current Prism dashboard goes away. New React modules open in new tabs from Angular Prism. Romit to help design the launcher.
- **Persona collapse rule** — Phase 1 = 3 view tiers (admin / faculty / student). Aarti will not approve 8-persona designs.
- **AI-first thinking** — pulled data drives trends/comparisons; AI drives themes/insights/action-plans. Don't force preset taxonomies on user-authored content.

## Verbatim quotes (Aarti)

> "As a faculty, I cannot just randomly add a new course to my syllabus."

> "Pharmacology one, spring twenty twenty six, that is like a combination of a term and a course. That's a course offering. Not a base course."

> "While I'm live monitoring it, I'm not so much concerned about what's going on with question nine… I'm more concerned about what's going on with the students."

> "I am personally not a fan of the word live. To me, live means it's actively going on."

> "If I were you, Romit, I would not do any work using my point biserial score until I have actually learned and understood and I can explain that calculation to somebody."

> "A faculty cannot decide whether this student gets this accommodation or not. At the higher level, that decision is made."

> "I do not want eighteen variations of this. You don't have the bandwidth to develop this. So admin level, faculty level, student level. Give me three views."

> "Course faculty evaluation is just a fucking simple-ass product that should have been designed in one month, but we are going to take three months to design."

> "Going forward, I'm going to be with or without prism… each product is independently sellable."

> "AI is good at finding themes and grouping the information by themes. Just let AI do that work… You're still thinking that everything has to be tagged and grouped and organized. But, no, like, let it be dynamic."

## Decisions made (35 total — see ADRs index for status)

Summary table; per-decision detail is in ADRs (drafts pending in this commit's PR).

| # | Decision | Product | ADR? |
|---|---|---|---|
| D1 | Faculty home: active courses on top, all affiliated below; faculty cannot add courses | Exam Mgmt | yes |
| D2 | Three-concept course architecture: master courses, master terms, course offerings | Exam Mgmt + PCE | yes |
| D3 | LMS integration is the default assumption; disable manual add when on | All | yes |
| D4 | Faculty role hierarchy: 3–4 default roles (Course Director / Instructor / others); rename-able labels, fixed semantics | Exam Mgmt | yes |
| D5 | Faculty can add collaborators only if admin grants permission | Exam Mgmt | yes |
| D6 | Live monitor: student-centric (Not Started / In Progress / Submitted), not question-centric. Question analysis = secondary tab post-close | Exam Mgmt | yes |
| D7 | Drop chart-or-numbers redundancy on completion | Exam Mgmt | small |
| D8 | Flag statuses: addressed / dismissed / acknowledged. No real-time student↔faculty messaging | Exam Mgmt | yes |
| D9 | Curving must allow excluding ANY question, not just flagged | Exam Mgmt | yes |
| D10 | Five assessment types — pop quiz / timed / take-home / open-book / proctored. Document per-type parameters before designing | Exam Mgmt | yes |
| D11 | Drop "live" status label → use "ongoing" | Exam Mgmt | small |
| D12 | Question tagging is question-level metadata (1-to-many to content area / competency / objective), not assessment-level | Exam Mgmt | yes |
| D13 | AI gap analysis lives at course level (course health), not assessment or competency level | Exam Mgmt | yes |
| D14 | Two-question framework: "Am I teaching everything?" + "Am I testing what I'm teaching?" | Exam Mgmt + PCE | yes |
| D15 | Don't use point-biserial in design until Romit can explain the calculation | Exam Mgmt | small |
| D16 | If difficulty is tiered (easy/med/hard), use 3 buckets, not 0–100% scatter | Exam Mgmt | yes |
| D17 | Coverage shows frequency counts ("8 of 20"), not percentages | Exam Mgmt | yes |
| D18 | Add Bloom's Taxonomy distribution to assessment overview | Exam Mgmt | yes |
| D19 | Accommodations administered globally; admin applies, faculty inherits read-only filtered view | All | yes |
| D20 | Non-registered students addable per-assessment (makeup workflow) | Exam Mgmt | yes |
| D21 | Program-level entity universe: master courses, terms, offerings, students, accommodations, content areas, competencies, standards, faculty, permissions, assessment types | All | yes |
| D22 | CFE Phase-1 personas collapse to 3: admin, faculty, student | PCE/CFE | yes |
| D23 | Each module independently sellable; Prism replaced by module launcher | Workspace + all | yes |
| D24 | New React modules open in new tab from Prism (Angular) | Workspace | small |
| D25 | CFE has no question bank — uses templates (5–6 of them, one inactive) | PCE/CFE | yes |
| D26 | CFE primary axis = term, with cohort grouping; 2 leaderboards (course + faculty); trend across 5–6 terms | PCE/CFE | yes |
| D27 | CFE: students rate two distinct entities — course content + faculty teaching style | PCE/CFE | yes |
| D28 | CFE evaluation themes: AI-extracted from school-authored questions; no preset taxonomy | PCE/CFE | yes |
| D29 | "AI-first thinking" for CFE: pulled = trends/averages, AI = themes/insights/actions | PCE/CFE | yes |
| D30 | Practice questions out of Phase 1 | Exam Mgmt | small |
| D31 | Action-plan tracking deferred to Phase 2/3 | PCE/CFE | small |
| D32 | "Notes" concept can return at faculty insights level — low priority | PCE/CFE | small |
| D33 | Faculty self-view in CFE: course rating + faculty rating + trend + lifetime + comparative | PCE/CFE | yes |
| D34 | Romit to help design Prism module-launcher landing page | Workspace | yes |
| D35 | ExamSoft download/lockdown/take-home capabilities are competitive parity targets | Exam Mgmt | small |

## Design tasks (28 total)

See `docs/workflows/_backlog.md` (to be created from this audit) for the per-task detail. Headlines:

**Exam Management:**
1. Faculty home — active/affiliated courses split (T1)
2. Admin: master courses + terms + course offerings + faculty assignment + permissions (T2)
3. Live monitor — student-centric counts (T3)
4. Flagged-question workflow (T4)
5. Alerts-to-students banner primitive (T5)
6. Pre-design doc: assessment types + statuses (T6) — **blocker, do this first**
7. Assessment review/curving redesign (T7)
8. Per-question analysis card (T8)
9. Content-area / objective / Bloom's coverage charts (T9)
10. Question tagging at creation + assessment-build prompts (T10)
11. Course-level question-bank health (gap analysis) (T11)
12. Program-level master lists (admin) (T12)
13. Accommodations module (T13) — shared
14. Course-level mapping screens (T14)
15. Two-question dashboards (T15)
16. Frequency-of-use column on QB rows (T28) — already done

**PCE / CFE:**
17. Admin program overview (term-driven + leaderboards + trend) (T17)
18. All courses tab (term scope) (T18)
19. Course detail (T19)
20. Faculty self view (T20)
21. Course distribution viz (T21)
22. Action plan flow lite (T22)
23. Cohort grouping toggle (T23)
24. Drop mobile evaluation form (T24) — Romit prototyped, Aarti said no
25. Drop "cohort readiness" (T25)
26. Drop competency rating on CFE (T26)

**Workspace:**
27. Prism module launcher (T16) — replaces current dashboard
28. Romit summary doc of all decisions (T27) — for team alignment

## Research / analysis to do (10 items)

| # | Item | Owner | Deadline |
|---|---|---|---|
| R1 | Read up on point-biserial; be able to explain the calculation | Romit | Before next design uses it |
| R2 | Send Aarti a Claude note summarizing point-biserial understanding | Romit | After R1 |
| R3 | Research ExamSoft download / lockdown / take-home patterns | Romit | Phase 1 spec time |
| R4 | Find CAPTE 2C / SSR template (PT accreditation form 2D1–2D9) | Romit | Phase 2 (PCE accreditation) |
| R5 | Five assessment types — get product/PM alignment | Romit + PMs | Before more assessment screens |
| R6 | Assessment status taxonomy — agree with PMs | Romit + PMs | Same |
| R7 | Permissions matrix — define rational levels | Romit + PMs + Vishakha | Same |
| R8 | Faculty profile — Prism-level vs additional fields | Romit + Aarti | Before admin master-list screens |
| R9 | Confirm with Vishakha: flag-during-exam read-only | Romit + Vishakha | Before flag UI design |
| R10 | Get Prism modules diagram from Aarti | Aarti | Before launcher design |

## Persona changes (must update both DESIGN.md files + personas.md)

- **PCE personas collapse from 8 to 3** (admin / faculty / student). The 8 personas in current `apps/pce/docs/personas.md` are now categorized under "admin" view for Phase 1.
- **Faculty (Exam Mgmt)** — cannot add courses, only act on assigned. Can add collaborators only if admin grants permission. 3–4 role variants with rename-able labels.
- **Course Director** — new explicit role: "whole-and-soul navigator" of a course.
- **Adjunct Faculty** — collapses into faculty view in Phase 1.
- **Admin (cross-product)** — owns all master lists; sole authority on accommodations, faculty assignment, permissions.

## Glossary candidates (29 terms — see proposed updates)

Cross-product: course offering, master course, term master list, content area, competency, standard, objective/measure, accommodation, custom accommodation, cohort.
Exam Mgmt: course director, collaborator, course health, question-bank gap, flag (statuses), curving, point-biserial (definition deferred), difficulty index, distractor analysis, assessment types, assessment statuses.
PCE/CFE: reflection, CQI, lifetime average, course rating vs faculty rating, CAPTE 2C / 2D1–2D9, action plan.
Workspace: module launcher.

## Things Aarti explicitly killed

| Killed | Why |
|---|---|
| Mobile evaluation form (Romit's prototype) | Use existing mobile architecture; don't custom-design |
| Cohort readiness in CFE | Students aren't being assessed; they're assessing faculty |
| Competency rating in CFE | Competencies aren't rated; they're outcomes |
| 8-persona variations | Bandwidth; collapse to 3 views |
| Point-biserial in current designs | Romit doesn't yet understand the metric well enough to design with it |
| The word "live" as a status | Ambiguous — use "ongoing" |
| Practice questions in Phase 1 | Backlog |
| Action-plan tracking in Phase 1 | Phase 2/3 — doesn't help sell the product |
