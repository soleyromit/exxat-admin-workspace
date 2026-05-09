# PCE / CFE — Vision

> Aarti calls this "CFE" (Course Faculty Evaluation) — the simpler framing she imposed on May 8 to push back against an over-engineered PCE design. PCE remains the package name (`@exxat/pce-admin`), but design conversations use CFE.

Synthesized from 3 stakeholder meetings (May 5–8 2026). Aarti drives; Vishaka supports (less voiced in PCE specifically); Vishal authored the original 8-persona PRD that Aarti collapsed.

---

## North star (Aarti, 2026-05-08)

**Ship a simple-as-possible course-faculty-evaluation product fast. Three view tiers (admin/faculty/student). Templates, not question banks. AI extracts themes — schools don't pre-tag.**

> "Course faculty evaluation is just a fucking simple-ass product that should have been designed in one month, but we are going to take three months to design."
> — Aarti, 2026-05-08

This is the strategic frame: CFE is meant to be a small, well-scoped product that ships fast and proves the loop closes (faculty self-view → reflection → next-cohort note → student welcome screen).

## Strategic anchors

| Anchor | What it means | Source |
|---|---|---|
| **Foot in the door** | CFE creates a pull for LMS integration → opens didactic course data ownership for Exxat (currently we own clinical, not didactic). | Vishal channeling Aarti, 2026-05-06 |
| **Mandatory + accreditation-driven** | Course evaluation is required by US accreditation bodies. "Anything you can measure, you can improve." | Vishal, 2026-05-06 |
| **Pull product** | Market demand exists; Exxat just has to be better than competition (Watermark Evaluation Kit, ExplorerBlue, SurveyMonkey, Anthology). | Vishal, 2026-05-06 |
| **Phase-1 ships in months, not years** | The 8-persona model (Vishal's PRD) was bandwidth-prohibitive. Aarti collapsed to 3 view tiers on 2026-05-08. | Aarti, 2026-05-08 |
| **AI-first thinking** | Themes/insights/action plans are AI-generated; trends/averages/comparisons are pulled. Schools don't pre-tag eval questions. | Aarti, 2026-05-06 + 2026-05-08 |
| **Migration from Prism survey-as-eval** | The primary 2026 conversion target = existing Prism users abusing surveys to do evaluations. | Aarti, 2026-05-06 |
| **No question bank** | CFE uses templates only (5–6 per school, one inactive). Eval questions are school-specific, not reusable like exam content. | Aarti, 2026-05-08 (PCE ADR-001) |

## Phasing

| Phase | Target | Scope |
|---|---|---|
| **Phase 1 — Sept 15, 2026** (floor: Nov 1) | Templates only (no QB) + 3 view tiers + AI theme extraction + LMS Canvas integration + term-driven dashboard + faculty self-view + cohort grouping toggle + action-plan flow (lite) | Cohere demo end of August; first usage end of fall semester |
| **Phase 2 (2027)** | Faculty post-course action-item logging (from Vishaka, sourced from Professor Modi); accreditation report transfer (CAPTE 2D1–2D9); cross-cohort didactic↔clinical correlation (FERPA blocker) | Heavier action-plan workflow; Dean-level views |
| **2027+** | AI insights chat with citations (Watermark-class); deeper analytics | TBD |

## Customer adoption

| Vector | Detail |
|---|---|
| **GTM gating Phase 1** | Only Prism customers with term + course offering + students + faculty data populated. Independent (non-Prism) sale unlocks when Prism Base ships (Phase 2). |
| **Beta target** | Existing Prism users who today abuse course-eval / survey to do PCE — natural conversion. Plus OHSU dentistry / OHSU medicine / 2 Row / PCOM / Karen / Dean's list. |
| **Cohere as commercial pivot** | Day 2 session: "Leveraging course and faculty and survey evaluations in Prism." Sept 15 launch lets early adopters set up before fall-end use. |
| **Demoed at Cohere, used Sept-Nov** | An end-of-rotation product cannot use pre-Cohere feedback — Aarti corrects Vishaka's "earlier-launch" pressure. |

## What's been killed (Aarti, 2026-05-08)

| Killed | Why |
|---|---|
| 8-persona model (Vishal's PRD) | Bandwidth — collapse to 3 view tiers |
| Mobile evaluation form (Romit's prototype) | Use existing mobile architecture |
| Cohort readiness | Wrong product — students aren't being assessed in CFE |
| Competency rating | Competencies are outcomes, not student-rated |
| Practice questions | Not in CFE (and out of Phase 1 in Exam Mgmt too) |
| Heavy action-plan tracking | Phase 2/3 — doesn't help sell |
| Question banks | Templates only (PCE ADR-001) |
| Per-course PCE nesting (original PRD framing) | Aarti 2026-05-05: PCE is a specialized survey, not a separate per-course UI; unify under "Course Evaluation and Surveys" |

## What's been green-lit

| Approved | Why |
|---|---|
| 3 view tiers (admin/faculty/student) | Bandwidth + ships fast |
| Templates (5–6 per school, one inactive) | Reuse + standardization |
| AI 3 pillars: comment analysis + recommended action items + eval template builder | Aarti 2026-05-06 — three explicit AI pillars for CFE |
| Term-driven dashboard with cohort grouping toggle | Two valid lenses (term, cohort) |
| Course leaderboard + Faculty leaderboard (top 5 + bottom 5) | Decision-making surface |
| Faculty self-view with course rating + faculty rating side-by-side + trend + lifetime + comparative | Faculty understands both dimensions |
| Action plan flow (lite, Phase 1) | Negative theme → AI recommends → accept/edit/clear/type-own |
| Anonymity must be **truly anonymous** (≥5 response gating, hide-columns, more) | OHSU sticking point on Prism today |
| Restrictive defaults, configurable per section by survey creator | Aarti foundational principle, 2026-05-05 |
| Three new schema attributes: Survey Type / Course Type / Subject | Per Aarti 2026-05-05 |
| Programmatic Surveys (renamed from "General Surveys") | Reflects real use case |
| Module unification: "Course Evaluation and Surveys" home entry | Aarti 2026-05-05 — PCE is a specialized survey, not separate module |

## How this vision shapes design

1. **3 view tiers, not 8 personas.** Per workspace ADR-004 + PCE-specific.
2. **Templates only.** No question bank infrastructure (PCE ADR-001).
3. **AI extracts themes dynamically.** No school-tagged taxonomy. Per workspace ADR-005.
4. **Anonymity is sacred.** ≥5 response gating; hide columns; truly anonymous (Aarti + Vishaka pushback on current Prism).
5. **Restrictive defaults, configurable per section.** Survey creator decides who sees what (Aarti).
6. **Admin ≠ PCE viewer.** Admins must be explicitly granted PCE viewing — faculty-as-admin should not leak peer evaluations.
7. **Existing mobile arch for student form.** Romit does NOT custom-design.

## Source provenance

| Source | Date | Granola ID |
|---|---|---|
| PCE alignment with Aarti (Mohan + David + Aarti drives) | 2026-05-05 9:00 AM | `e9389c39-c819-459a-a0c6-de2b7a35db61` |
| PCE persona mapping (Vishal walkthrough — Aarti not present) | 2026-05-06 9:00 AM | `1b317110-ab98-4b61-b040-d23498850868` |
| Roadmap planning (Aarti+Vishal+Vishaka, both products) | 2026-05-06 7:29 AM | `a73456ab-a1f6-46d5-99e5-e577a3fd5104` |
| Exam + PCE design review (Aarti drives) | 2026-05-08 12:44 PM | `4e1c850e-d760-4d05-81a1-a52287b9ae21` |
