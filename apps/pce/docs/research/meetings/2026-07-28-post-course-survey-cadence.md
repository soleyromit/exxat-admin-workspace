---
type: meeting
date: 2026-07-28
product: pce
participants: [Romit Soley, Vishaka, David, Monal (PM/PO)]
source: granola
granola_id: f2964952-3020-4acb-9f42-4275637b6157
---

# Post-Course Survey Cadence Meeting — 2026-07-28

**Date:** 2026-07-28 8:45 AM EDT
**Participants:** Romit (note creator / designer); Monal (PM/PO, meeting facilitator); Vishaka (domain expert — product owner perspective); David (external stakeholder / admin user perspective)

---

## Topics covered

1. Faculty roles evaluated in PCE: course instructor, course director/coordinator, guest lecturer, lab instructor
2. Student-initiated evaluations — scope decision
3. DCE (Director of Clinical Education) 360 evaluation — scope decision
4. Course with multiple components (classroom + lab + experiential) — template structure
5. Live prototype walkthrough: template creation UX (Vishaka as admin role-play)
6. Course type → multi-select feedback
7. "Mark as default for this course type" toggle confusion and removal
8. Faculty role selection: single-select vs. multi-select and clone/copy pattern
9. Analytics comparison: same-role comparisons (coordinator vs. coordinator, instructor vs. instructor)
10. Course director evaluation ambiguity: management vs. teaching role

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0728B_01 | **Student-initiated evaluations = OUT OF SCOPE for v1.** All surveys in PCE v1 are triggered by admin for a specific window. Guest lecturer feedback at end of term is acceptable substitute. "Right now we will not support student initiated evaluations. All of them are triggered by admin for a specific window." (Monal) David: "I can't see a common use case where the student would initiate like this type of survey. It's almost always going to be the faculty or the administrator." Future requirement — track for v2. | pce | T148 |
| D_PCE_0728B_02 | **DCE (Director of Clinical Education) 360 evaluation = OUT OF SCOPE for PCE.** DCE evaluation is not course-bound and is done once a year. "Is it right to say DC evaluation is scope of general survey? Yes." Routes to the existing annual/general surveys tool, not PCE. If clinical placement programs want per-course feedback on DCE management, they can build a template section for it, but the formal DCE 360 is out of PCE scope. | pce | T149 |
| D_PCE_0728B_03 | **Course type in template creation → MULTI-SELECT.** A single course can have multiple components (classroom + lab + experiential). Current prototype is single-select. "It's single select. It's not multi-select… I am not able to pick all three components… So first thing is that should be multi select." (Vishaka). Courses like nursing practicums with classroom + lab + rotation components need all three types selected. | pce | T144 |
| D_PCE_0728B_04 | **"Practice" renamed to "Experiential" across all course type labels.** Multi-stakeholder agreement. "Experiential, I think, would be a better word. Yeah. Experiential is what we should call to keep it… in Pharmacy we do use Practice department… but then the experiential is what we call for the rotation. So we come up with a term that everyone can connect with." ✅ **Code applied 2026-08-03:** `pce-mock-data.ts` type + data values + `analytics/page.tsx` type + toggle label updated. | pce | T145 |
| D_PCE_0728B_05 | **"Mark as default for this course type" toggle → REMOVE from template creation.** Both Vishaka and David found it confusing. David: "I almost feel like a better flow or user experience, we force them to choose every time… I can't see what that would do for the user… Or remove it completely." Vishaka: "This might confuse or complicate or they might not understand what this bit is going to do for them." If a default-template concept is needed later, it belongs on the Templates list screen, not inside individual template creation. **Not in code — only in Lovable prototype.** | pce | T146 |
| D_PCE_0728B_06 | **Faculty role selection in template → SINGLE-SELECT + clone/copy from previous role.** Multi-select implies all selected roles share the same questions. Vishaka: "Just give them the ability to curate questions for one role at a time. And if they pick additional roles, you give them the option to copy the same question from the previous role. That would be a better way to save effort." "So this should not be multi-select because then it makes me think that I select all of them at once. It should be single select." User adds one role, configures its questions, then adds the next role with clone option. | pce | T147 |
| D_PCE_0728B_07 | **Template creation wizard: Next button must guide through ALL sections sequentially — including faculty.** Vishaka: "I didn't realize I had to go on the left hand panel, click faculty and complete that. Because if I see a next button, I'm gonna [expect] that you're going to take me through the whole journey." Current left-panel navigation pattern (static tabs) requires user to discover faculty sections manually. Wizard must use a linear Next/Back flow that surfaces every section. | pce | T150 |
| D_PCE_0728B_08 | **Analytics: same-role comparisons.** "Course coordinator should be compared with course coordinators. Instructors should be compared with instructors." Each role is its own comparison group. Instructor and co-instructor can be compared when configured. No cross-role comparisons. | pce | — |
| D_PCE_0728B_09 | **Guest lecturer = ADMIN-CONFIGURED, not student-initiated.** Admin adds guest lecturer as an evaluatee within the course survey setup. Survey window for guest lecturer can use a custom date range different from the main term window. Admin does not have to wait for end-of-term — a shorter window immediately post-lecture is supported. | pce | T148 |

---

## Verbatim stakeholder quotes

> "Right now we will not support student initiated evaluations. All of them are triggered by admin for a specific window. They can do like guest lecture evaluation for a custom window that they want to do it for." — Monal

> "I can't see a common use case where the student would initiate like this type of survey. It's almost always going to be the faculty or the administrator." — David

> "Is it right to say DC evaluation is scope of general survey? Yes." — Monal

> "It's single select. It's not multi select. So I am not able to pick all three components. So first thing is that should be multi select. Because there are three components to the course that you are creating." — Vishaka

> "Experiential, I think, would be a better word. Yeah. Experiential is what we should call to keep it. And that's why I asked you this question because in Pharmacy we do use Practice department… but then the experiential is what we call for the rotation. So we come up with a term that everyone can connect with. This is a good word. Let's note it down and change it to experiential paste." — David / Monal

> "I don't know how we use [Mark as default]. Is it tied to the template name? I'm so confused as to what that would do for the user… Or remove it completely." — David

> "This might confuse or complicate or they might not understand what this bit is going to do for them." — Vishaka

> "Just give them the ability to curate questions for one role at a time. And if they pick additional roles, you give them the option to copy the same question from the previous role. That would be a better way to save effort." — Vishaka

> "So this should not be multi-select because then it makes me think that I select all of them at once. It should be single select. And then I know, okay, I did all these for the course coordinator. Now I go to my lab assistant. I can clone or copy forward from course coordinator." — Vishaka

> "I didn't realize I had to go on the left hand panel, click faculty and complete that. Because if I see a next button, I'm gonna [expect] that you're going to take me through the whole journey." — Vishaka

> "Course coordinator should be compared with course coordinators. Instructors should be compared with instructors." — David

---

## Code cross-reference (Pass 5)

| Directive | Existing code | Gap / Status |
|---|---|---|
| D_PCE_0728B_03: Course type → multi-select | ❌ Not in code | `CreateTemplateSheet` (pce-modals.tsx) has no course type picker at all. Course type field lives only in Lovable prototype. T144 added as design task for when template creation is rebuilt. |
| D_PCE_0728B_04: "Practice" → "Experiential" | ✅ **Code applied 2026-08-03** | `pce-mock-data.ts`: type definition + lines 200, 220 (`courseType: 'practice'` → `'experiential'`). `analytics/page.tsx`: `CourseTypeFilter` type + ToggleGroupItem value/label. |
| D_PCE_0728B_05: Remove "Mark as default" toggle | ✅ Already absent from code | `CreateTemplateSheet` has no such toggle. Exists only in Lovable prototype. No code removal needed. T146 notes this for when prototype is realigned. |
| D_PCE_0728B_06: Faculty role → single-select + clone | ❌ Not in code | `CreateTemplateSheet` has Faculty Performance + Course Director as checkboxes (no role-based question-building flow). Full faculty role UX is not yet built. T147 added as design task for T129/template rebuild. |
| D_PCE_0728B_07: Next button guides full journey | ❌ Not in code | `templates/[id]/page.tsx` uses a static left-panel tab navigation. No wizard-style Next/Back flow. T150 added as design task for template editor UX rebuild. |
| D_PCE_0728B_01: Student-initiated = v1 out of scope | — | No code to remove. T148 documents the out-of-scope decision for future reference. |
| D_PCE_0728B_02: DCE = out of scope | — | No code to remove. T149 documents the out-of-scope decision. |

**Pass 5 verdict:** One safe code change applied (D_PCE_0728B_04, "Practice" → "Experiential"). All other directives target the not-yet-built template creation UX or prototype-only features. Tasks T144–T150 added to backlog.

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T144 | Course type in template creation → multi-select (classroom / lab / experiential) | P1 — DESIGN-REVIEW | When template creation is rebuilt per T129/T144 scope, the course type picker must be multi-select. A single course can have multiple components. "First thing is that should be multi select." Vishaka. Not in code today — Lovable prototype only. D_PCE_0728B_03. |
| T145 | "Practice" → "Experiential" terminology. ✅ Code applied 2026-08-03 | P0 — ✅ APPLIED | `pce-mock-data.ts` type + data values updated. `analytics/page.tsx` type + toggle label updated. Carry forward to all prototype/design screens. D_PCE_0728B_04. |
| T146 | Remove "Mark as default for this course type" toggle from template creation | P1 — prototype only | Does not exist in code. Exists in Lovable prototype. When prototype is realigned, remove this control. If default-template auto-assign is ever revived, it belongs on the Templates list screen (not inside template creation). David: "remove it completely." D_PCE_0728B_05. |
| T147 | Faculty role selection in template → single-select + clone from prior role | P1 — DESIGN-REVIEW | Template creation faculty section: user selects one role at a time, configures questions for it, then adds the next role. Adding next role offers clone/copy from previous role. Multi-select removed. Vishaka: "just give them the ability to curate questions for one role at a time." D_PCE_0728B_06. |
| T148 | Out of scope (v1): student-initiated evaluations | P0 — SCOPE LOCK | Document in product spec that student-initiated evaluations are NOT part of PCE v1. All surveys are admin-triggered with a defined window. Guest lecturer feedback uses admin-set custom date range. Revisit for v2. D_PCE_0728B_01, D_PCE_0728B_09. |
| T149 | Out of scope: DCE 360 evaluation | P0 — SCOPE LOCK | DCE evaluation is not course-bound; it routes to the annual/general surveys tool. Document as out-of-scope in PCE product spec. "Is it right to say DC evaluation is scope of general survey? Yes." D_PCE_0728B_02. |
| T150 | Template creation wizard: Next button traverses ALL sections sequentially including faculty | P1 — DESIGN-REVIEW | Current left-panel tab model requires manual discovery of faculty sections. Wizard must use a linear Next/Back flow that surfaces every required section before the user can complete the template. "I didn't realize I had to go on the left hand panel, click faculty and complete that." Vishaka. D_PCE_0728B_07. |
