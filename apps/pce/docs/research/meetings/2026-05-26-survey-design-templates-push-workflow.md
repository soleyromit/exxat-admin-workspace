---
type: meeting
date: 2026-05-26
product: pce
participants: [Romit, Nipun]
source: granola
granola_id: 433fe75c-59fd-476d-8fae-41f83e9c95ea
---

# Survey Design — Templates, Push Workflow, and Course Evaluation Separation

**Date:** 2026-05-26 · **Time:** 9:39 AM EDT
**Context:** Romit sharing early design progress on push survey and create-template flows with Nipun (engineering lead). Design was described as "bare minimum, in a hurry — not properly thought out." Goal: first version to share at tomorrow's weekly call.

## Topics covered

1. Create template UI — sections per evaluatee/role, answer type selection
2. Push survey flow — push button, term/course selection, student distribution
3. Survey landing page — columns and what to show
4. Survey statuses — full lifecycle: Draft → Scheduled → Live → Closed (Pending Review) → Results Released
5. Separation of general surveys vs. course evaluation — separate landing pages required
6. Answer types — Likert and free text now, design must accommodate more
7. "Created by" column — optional/hidden, admin hierarchical use case
8. Bounce email — NOT tracked in UI
9. Common question creation design across survey and exam management
10. Survey analytics and moderation — design to come later while engineering builds create/push flows

---

## Decisions

| # | Decision | Product | ADR |
|---|---|---|---|
| D_PCE12 | **General surveys and course evaluation must have SEPARATE landing pages.** "Both of them will have separate landing page and separate creation step." — Nipun. Back-end differentiation: survey_type = 'programmatic' vs 'course_evaluation'. Front-end: two distinct navigation paths, two distinct home pages. This refines §6.1 with explicit landing page separation. | Admin | PCE-ADR-001 update |
| D_PCE13 | **Survey status lifecycle (full detail).** Draft → Scheduled (push configured, future start date) → Live (start date reached, collecting) → Closed / Pending Review (close date reached; admin must review comments) → Results Released (after admin releases; faculty can see results). Adds "Scheduled" as a new status not currently in the code. | Admin | — |
| D_PCE14 | **Faculty sees results ONLY after "Results Released" status.** When status changes to Results Released, faculty login experience shows the survey/evaluation. Before that, faculty cannot see results. | Admin / Faculty | — |
| D_PCE15 | **Review and Release step: admin hides/unhides comments, then clicks Release.** Pending Review = admin reviews all open-text comments and individually hides inappropriate ones. Once done, clicks Release button → status changes to Results Released → faculty can see. "That step is the review step is to hide, unhide any comments. Once you hide all the inappropriate comments, there will be a release button." — Nipun | Admin | — |
| D_PCE16 | **Survey landing page columns.** Required: course name, total students, response rate (count format "34 / 50"), status, start date, end date. Optional / hidden by default: "Created by" (which admin created the survey — useful for hierarchical admin teams, cited in support tickets). | Admin | — |
| D_PCE17 | **Bounce email NOT tracked or shown in UI.** "We will not tell the user that this morning [someone's] email got bounced. It's fine." — Nipun. Bounce handling is at the Prism level (wrong email in system = fix in Prism, not in course evaluation). | Admin | — |
| D_PCE18 | **Answer type selector must use a dropdown — design for extensibility.** Phase 1 will have more than Likert + free text ("definitely, there will be a third type and fourth type very soon. In fact, in phase one only" — Nipun). Use a dropdown for answer type selection, not a fixed set of radio/option buttons. This SUPERSEDES §6.11 which said "Likert scale + free text ONLY." | Admin | — |
| D_PCE19 | **Common question creation design across survey and exam management.** Romit proposes (Nipun agrees) the same question-builder layout handles both assessment creation (exam management) and course evaluation template creation. The logic differs (section-to-evaluatee mapping for course eval; no mapping for general surveys), but the visual design and panel structure should be shared. Unresolved: needs Aarti buy-in. Not yet a hard decision. | Admin | — |
| D_PCE20 | **"Created by" column: optional, hidden by default, user-configurable.** Can be exposed via column visibility controls or grouping. Use case: admin manager wants to know which subordinate admin created a given survey. Not a primary column — secondary/optional. | Admin | — |
| D_PCE21 | **Survey landing for course evaluation: show instructor subjects (evaluatees) per course.** At the progress level, for a given course evaluation instance, show which subjects (roles) are associated — e.g., course coordinator, faculty, program director. Simple display; not the primary column in the landing table, but visible inside the detail. | Admin | — |

---

## Verbatim quotes

> "Both of them will have separate landing page and separate creation step." — Nipun

> "Draft… Once you click on push survey… survey will go into scheduled state. Once [start date] occurs, that survey would change to live. Once the survey closed at [close] date has occurred, the status of that survey will change to closed pending review. There will be a CTA called review and release." — Nipun

> "That step is the review step is to hide, unhide any comments. Once you hide all the appropriate inappropriate comments, there will be a release button. You can click on release button. That's where the service status will change to results released. And when status is changed to result released, that's when faculty login experience… the faculty will see those surveys in their dashboard." — Nipun

> "We will not tell the user that this morning [person's] email got bounced. It's fine." — Nipun

> "Definitely, there will be a third type and fourth type very soon. In fact, in phase one only, we will have third and fourth type. So we will have to think about an idea to accommodate this." — Nipun

> "So just to align — you will create a more pleasing design on this screen so that in future, if we add a third type, it will look pleasing. Is that what you'll work on?" — Nipun

> "Both of them has different requirement. General service is like, anything you can do. You can add anyone on the recipient side. But post evaluation, you have a specific requirement that it is associated to course." — Nipun

> "In the start, it is fine to just say the course name, total students, basically, the response rate number that 34 slash 50 answered, so there were 50 words. Status also is there. Start date and [end] date." — Nipun

---

## Cross-reference — existing code findings (Pass 5)

| File | Finding | Action |
|---|---|---|
| `apps/pce/admin/app/(app)/surveys/page.tsx:26` | Statuses: `{pending_review, collecting, active, draft, released, closed}`. Missing: `scheduled`. The "Scheduled" status (push configured, future start date) is not in the type. | 🔴 DESIGN-REVIEW — requires TypeScript type update. Add to backlog. |
| `apps/pce/admin/app/(app)/surveys/page.tsx:30` | `active` status has label "Active". Unclear how `active` vs `collecting` maps to the new `scheduled` / `live` distinction. | 🔴 DESIGN-REVIEW — needs status reconciliation. |
| `apps/pce/admin/app/(app)/surveys/page.tsx` | Single surveys page serves all surveys. Per D_PCE12, general surveys and course evaluation need separate landing pages. | 🔴 NEW PAGE NEEDED — course evaluation landing page separate from general surveys page. |
| `apps/pce/admin/app/(app)/templates/[id]/page.tsx` | Answer type selection. Per D_PCE18, must use dropdown not fixed buttons to accommodate extensibility. | 🔴 DESIGN-REVIEW — check current implementation, may need answer type selector redesign. |

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T40 (PCE) — Survey status: add "Scheduled" status | P1 | DESIGN-REVIEW. New status between Draft and Live: push configured but start date is in the future. Requires TypeScript SurveyStatus type update + UI label/badge. D_PCE13. |
| T41 (PCE) — Course evaluation separate landing page | P1 | NEW PAGE NEEDED. General surveys and course evaluation must have separate home pages and separate creation flows. D_PCE12. DESIGN-REVIEW — structural. |
| T42 (PCE) — Faculty results view: only shown at "Results Released" | P1 | Faculty login experience: surveys visible only when status = 'released'. Review the faculty view and gate it correctly. D_PCE14. |
| T43 (PCE) — Review and Release CTA on pending_review surveys | P1 | When status = pending_review, show a "Review & Release" CTA. Inside: list comments with hide/unhide toggle per comment. Release button → changes status to released. D_PCE15. |
| T44 (PCE) — Answer type selector: use dropdown for extensibility | P1 | Replace fixed Likert/Free-text option buttons with a dropdown that can accommodate 3rd and 4th types in Phase 1. D_PCE18. |
| T45 (PCE) — "Created by" column: hidden by default, user-configurable | P2 | Column exists in the landing table but hidden by default. Admin can enable it via column visibility controls. D_PCE16, D_PCE20. |
