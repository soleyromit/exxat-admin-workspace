---
type: meeting
date: 2026-05-28
product: pce
participants: [Romit, Aarti (Aditi), Vishaka, Monil, David, Vishal]
source: granola
granola_id: 666c9e88-4d5a-4cd3-9644-4c2bc2d9c92e
---

# Post Course Evaluation — Dashboard, Navigation, and Distribution Flow

**Date:** 2026-05-28 · **Time:** 8:10 AM EDT
**Context:** Romit walking through PCE dashboard structure and 5-step push survey flow with Aarti, Vishaka, Monil, and David. First time these screens were reviewed together at this level of detail. Engineering (Vinay) is waiting on finalized designs to start development by June 1.

## Topics covered

1. Navigation placement: post course evaluation vs. general/programmatic surveys — keep together for now, modularization pending
2. Post course evaluation must keep its own dedicated dashboard — confirmed
3. Admin landing: term + academic year picker, KPI widget, master survey list
4. "All" filter across all terms — should be available
5. Analytics dimensions: semester, faculty, course (question = Phase 2)
6. Step-zero audit screen — "Use Leo" to prepopulate course list for term
7. Program dropdown on step-zero — should NOT exist (PCE is program-level only)
8. 5-step push survey flow: properties → scope → design/templates → communication → review
9. Template auto-assignment via default tag per course type
10. Email template options: Standard and Custom only (remove "Brief")
11. Status label for admin: "Released" → should clarify released to faculty
12. Settings → should follow existing "Setup" tab pattern, not a separate nav item
13. Roles: three only — admin, faculty, student. No separate "program director" role.
14. Two academic year formats: single (2026) and range (25-26) — design must accommodate both
15. Survey window close date: can exceed term end date — do NOT enforce logic around it

---

## Decisions

| # | Decision | Scope | ADR |
|---|---|---|---|
| D_PCE22 | **"Released" badge label → "Shared with Faculty".** Admin view status badge for the released state must clearly indicate results were shared with faculty — not just "Released" (ambiguous) and not "Results Available" (that's faculty-facing language). "It should be more like a published or release to faculty, something like that." — Vishaka. "Results shared with faculty or release." — Monil. APPLIED: `pce-badges.tsx:45`. | Admin | — |
| D_PCE23 | **Post course evaluation keeps its own dedicated dashboard — not merged with general surveys.** "I am aligned with you that post course evaluation will have its own dashboard, and we are not taking that away. It's just positioning." — Aarti. The current nav position (under Curriculum) is temporary pending modularization. When modularization happens, there will be 6 module entry points. Do not rearrange nav until that decision is finalized. | Admin | — |
| D_PCE24 | **Admin landing: term-driven KPI + master survey list.** When admin lands on course evaluation screen: (1) Term picker = two fields: Term + Academic Year. (2) KPI widget at top: e.g., "53% of courses have an evaluation posted" — drives admin action. (3) Below: master list of all surveys for that term across all statuses. "All" filter also available to see surveys across all historical terms. NEW DESIGN TASK (T46). | Admin | — |
| D_PCE25 | **Analytics dimensions: Semester, Faculty, Course. Question = Phase 2.** Three analytics entry points for admin: (1) Semester/time-based, (2) Faculty as entity — shows faculty evaluations AND course-evals for courses they taught, (3) Course as entity — shows all offerings and historical trend. Question-level analytics explicitly Phase 2: "We can put it for phase two. We don't want to worry about it in the beginning." — Aarti + Vishaka. NEW DESIGN TASK (T47). | Admin | — |
| D_PCE26 | **Faculty analytics groups two types.** Under a faculty entity in analytics: group (a) faculty evaluation surveys for that faculty, and (b) course evaluation surveys for courses that faculty taught. "A survey could be a faculty evaluation. Or it could be a course evaluation that is taught by that faculty. So you'll have to be able to group both those things under faculty." — Monil. Informs T47. | Admin | — |
| D_PCE27 | **Step-zero audit screen with "Use Leo" (not "Run with AI").** When a new term starts, admin sees: "[Term] evaluation is ready to launch. Use Leo." Leo audits course offerings for that term + academic year, surfaces courses with no faculty assigned. Admin can exclude placeholder courses. No program dropdown — PCE runs at program level only. Term + Academic Year pre-populated from current date where possible (once academic calendar data is reliable). NEW PAGE NEEDED (T48). Label must use "Leo" (Exxat AI brand), not "Run with AI" or "AI". | Admin | — |
| D_PCE28 | **5-step push survey flow replaces current 3-step flow.** Step 1 — Properties: title, survey window (open + close dates), result release date. Step 2 — Scope: select courses (cohort + term + academic year filters; from right drawer à la Prism). Step 3 — Design: assign template to each course (auto-assign via default tag per course type). Step 4 — Communication: invite email template + reminder cadence (anchor dates: start, mid, end). Step 5 — Final review. The current 3-step flow (select template → select courses → set window) is superseded. DESIGN-REVIEW — structural rearchitecture (T49). | Admin | — |
| D_PCE29 | **Template auto-assignment via "default" tag per course type.** For each course type (didactic, clinical, etc.), one template is marked as default. When admin hits step 3 of push survey, the default template for each course type auto-assigns. If no default exists for a type, open template creation UI. "They once they mark that this is what we want to be used every time unless we make a conscious change." — Vishaka. Part of D_PCE28 / T49. | Admin | — |
| D_PCE30 | **Email options: Standard and Custom only. "Brief" option removed.** The AI-generated "brief" email option from Monil's prototype is not adopted. "I think we should not over engineer. So standard and custom should suffice." — Aarti. Standard = Exxat's out-of-the-box invite/reminder template. Custom = starts from standard, admin can edit. Both must have placeholders (course name, dates, etc.). Part of D_PCE28 / T49. | Admin | — |
| D_PCE31 | **Survey window close date must NOT be logic-gated to term end date.** Academic calendar term end date is a reference for pre-populating the distribution window. The actual close date can exceed the term end date — do not enforce any constraint around this. "Let's not build logic around it because then it might be a limitation. It's a good reference to prepopulate for them but not for actual logic." — Monil. | Admin / Eng | — |
| D_PCE32 | **Settings for PCE module → should live under "Setup" tab, not a separate "Settings" nav.** "There is a setup tab, you know, in all modules. In our product. We should just follow that guideline. And not create a new navigation for settings." — Monil. The existing `/admin` (Setup) nav item in the PCE sidebar is the correct home for program-level configuration (e.g., Likert scale, default templates). No change to code needed — Setup already exists. | Admin | — |

---

## Verbatim quotes

> "I am aligned with you that post course evaluation will have its own dashboard, and we are not taking that away. It's just positioning and curriculum management should be very right now." — Aarti

> "So as an admin, when I land on the screen, I see a term — read this term as two fields: term plus academic year. I come and select the term that I am interested in." — Monil

> "The screen says the spring twenty twenty six evaluation is ready to launch. Run with AI. At this step, what we are expecting from user is to run the audit on their existing data point." — Monil (re: step-zero)

> "That drop down menu of program selection should not be there because we have decided that post course evaluation will only run at a program level for now." — Vishaka

> "Instead of run with AI, we want to use our brand, which is Leo. That's our AI agent for Exxat." — Vishaka

> "For question, I have some data points that I want to give. It is important because questions repeat across courses. But we can put it for phase two." — Vishaka. "We don't want to worry about it in the beginning. Let's make it phase two." — Aarti

> "Results available makes sense for a faculty view, but how do you differentiate it for admin view? My question." — Vishaka

> "It should be more like a published or sales. Release to faculty, something like that." — Vishaka

> "Results shared with faculty or release. We'll have to come up with the label, but it's not available." — Monil

> "I think we should not over engineer. So standard and custom should suffice." — Aarti (re: email options)

> "There is a setup tab, you know, in all modules. In our product. We should just follow that guideline. And not create a new navigation for settings." — Monil

> "Let's not build logic around it because then it might be a limitation. It's a good reference to prepopulate for them but not for actual logic." — Monil (re: survey window vs. term end date)

> "You only need two entry points because templates can be part of the design of that section." — Vishaka (re: PCE nav top-level items)

---

## Cross-reference — existing code findings (Pass 5)

| File | Finding | Action |
|---|---|---|
| `apps/pce/admin/components/pce/pce-badges.tsx:45` | Badge label `'Released'` — ambiguous for admin, doesn't clarify results were shared with faculty. | ✅ APPLIED: changed to `'Shared with Faculty'`. Aligns with D_PCE22. |
| `apps/pce/admin/app/(app)/surveys/page.tsx:32` | Group label for `released` = `'Shared with Faculty'` — already correct and consistent with new badge label. | ✅ No change needed. |
| `apps/pce/admin/app/(app)/page.tsx` | Module home has two folder cards: "Course Evaluation" and "Programmatic Surveys (coming-soon)". This aligns with D_PCE23 intent. | ✅ Consistent with direction. No change needed. |
| `apps/pce/admin/components/app-sidebar.tsx:148–151` | ADMIN_NAV has `Setup` at `/admin`. This is the correct location for settings per D_PCE32. | ✅ No change needed. |
| `apps/pce/admin/app/(app)/surveys/push/page.tsx` | Current push flow has 3 steps (select template, select courses, set window). D_PCE28 requires 5 steps. | 🔴 DESIGN-REVIEW — structural rearchitecture (T49). Do not apply. |
| Step-zero screen | No route or page exists for the pre-term audit workflow. | 🔴 NEW PAGE NEEDED (T48). |
| Analytics dimensions | `apps/pce/admin/app/(app)/analytics/page.tsx` exists — needs to be designed with semester/faculty/course entry points per D_PCE25. | 🔴 DESIGN-REVIEW (T47). |

---

## Design tasks generated

| Task | Priority | Notes |
|---|---|---|
| T46 — Admin landing: term KPI dashboard | P1 | Admin course evaluation landing: term + academic year picker → KPI widget (coverage %) + master survey list. "All" filter for cross-term view. D_PCE24. NEW PAGE NEEDED. |
| T47 — Analytics: semester / faculty / course entry points | P1 | Three analytics entry points for course evaluation. Faculty entry groups faculty-eval AND course-eval for courses they taught. Question analytics = Phase 2. D_PCE25, D_PCE26. NEW PAGE/major redesign. |
| T48 — Step-zero: Leo audit screen | P1 | New screen for term launch. Uses Leo branding (not "Run with AI"). No program dropdown. Pre-populates course list; highlights courses missing faculty. Admin can exclude placeholder courses. D_PCE27. NEW PAGE NEEDED. |
| T49 — 5-step push survey flow | P1 | Replace current 3-step flow with: Properties → Scope → Design/Templates → Communication → Review. Default template auto-assign per course type. Email options: standard + custom only. D_PCE28–D_PCE30. DESIGN-REVIEW — structural. |
