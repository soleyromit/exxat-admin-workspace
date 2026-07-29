---
type: meeting
date: 2026-07-28
product: pce
participants: [Romit Soley, Vishaka, David, Monil, Vishal]
source: granola
granola_id: f2964952-3020-4acb-9f42-4275637b6157
---

# Post-Course Survey Cadence — Template Creation Journey Review — 2026-07-28

**Date:** 2026-07-28 8:45 AM EDT
**Participants:** Romit (Me), Vishaka, David, Monil, Vishal

---

## Topics covered

1. Faculty roles evaluated in course evaluation (TA, guest lecturer, DCE, lab instructor, co-instructor)
2. Guest lecturer evaluation — timing, admin-triggered vs. student-initiated
3. DCE (Director of Clinical Education) evaluation — scope clarification
4. Template creation journey role-play: Vishaka as admin creating a template
5. Course type multi-select in template creation
6. "Mark as default for this course type" toggle — usability verdict: remove
7. Faculty role section builder — single-select vs. multi-select direction
8. Clone questions from one faculty role to another
9. Analytics: same-role comparison (instructor vs. instructor)
10. "Experiential" as the correct term for practice/clinical/rotation course type

---

## Topics covered (detail)

### Faculty roles in course evaluation
Roles that get evaluated: course coordinator / course director, instructor/lecturer, guest lecturer, lab instructor (for lab-based courses). Teaching assistants typically NOT evaluated. DCE (Director of Clinical Education) evaluated separately — see scope decision below.

### Guest lecturer evaluation
Guest lecturers can be included in PCE. Admin triggers the evaluation with a custom date window (not tied to term end date). Student-initiated evaluation is NOT in Phase 1 — this was explicitly confirmed by Monil: "Right now we will not support student initiated evaluations. All of them are triggered by admin for a specific window." Time-sensitivity issue noted (want feedback while it's fresh), but admin-triggered custom window addresses this.

### DCE evaluation — out of PCE scope
The DCE evaluation is done once a year (not per course/term). Vishaka confirmed: "Is it right to say DC evaluation is scope of general survey? Yes." DCE survey stays in the general survey / annual survey module, NOT in post-course evaluation.

### Template creation role-play — Vishaka as admin
Vishaka demoed creating a template for a nursing program with 3 course components (classroom + lab + practice/rotation):

**Finding 1 — Course type is single-select, should be multi-select.** Vishaka tried to pick all three components but couldn't: "It's single select. It's not multi select. So I am not able to pick all three components." A course can have multiple types simultaneously. Current design must be changed.

**Finding 2 — "Mark as default for this course type" toggle is confusing.** Both Vishaka and David did not understand what it would do. David: "If I'm creating a template, I have a certain structure in mind for that template. I don't understand what this bit is going to do for me." Verdict: remove it. If a "default template per course type" affordance is needed, it belongs on the template LIST screen, not inside template creation. Monil: "remove it completely."

**Finding 3 — Faculty role nav is non-obvious.** Vishaka didn't realize she had to click the left panel to navigate to the faculty section. She expected the "Next" button to guide her through all sections: "I didn't realize I had to go on the left hand panel, click faculty and complete that. Because if I see a next button, I'm gonna [expect] you to take me through the whole journey." This is additional evidence for the T128 template builder redesign.

**Finding 4 — Faculty role selector should be SINGLE SELECT.** Vishaka: "This should not be multi-select because then it makes me think that I select all of them at once. It should be single select." When admin adds a faculty role, they configure questions for ONE role at a time, then add another. Give option to clone question set from previous role: "You can clone or copy forward from course coordinator. You can edit or tweak or add ones, and then I add another role." This REVERSES T62 (Jun 9, multi-select direction).

### Course type terminology
"Practice" is ambiguous (Pharmacy uses "Practice" as a department name, not a course type). Monil's decision: "Experiential is what we should call to keep it. Let's note it down and change it to experiential." Rename "Practice" → "Experiential" across the product.

### Analytics — same-role comparison
Instructor vs. instructor, co-instructor vs. co-instructor. Do not mix roles for comparison. David: "course coordinators should be compared with course coordinators. Instructors should be compared with instructors."

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0728B_01 | **Course type in template creation = MULTI-SELECT.** A single course can have multiple types simultaneously (e.g. classroom + lab + experiential). Current single-select must be redesigned. DESIGN-REVIEW — structural. | pce | T134 |
| D_PCE_0728B_02 | **Remove "Mark as default for this course type" toggle from template creation.** Both Vishaka and David found it confusing and unnecessary. If default-template-per-course-type is ever needed, it belongs on the template list screen, not inside creation. Monil: "remove it completely." | pce | T135 |
| D_PCE_0728B_03 | **Faculty role selector in template builder = SINGLE SELECT (add one at a time).** REVERSES T62. Admin adds one faculty role, configures questions, then adds the next. Give a "clone question set" affordance when adding a second role. Consistent with T88 cloning task. | pce | T136, REVERSES T62 |
| D_PCE_0728B_04 | **Template builder "Next" should guide through ALL sections.** Current left-panel tab navigation is non-obvious. Users expect "Next" to step them through each section sequentially. Reinforces T128 redesign need. | pce | T137, T128 |
| D_PCE_0728B_05 | **DCE evaluation = general survey scope, NOT PCE.** Annual, not per-course. Stays in existing general survey module. | pce | T138 |
| D_PCE_0728B_06 | **Guest lecturer evaluation: admin-triggered, custom date window.** Not student-initiated (T39 killed student-initiated). Admin can include guest lecturer as an evaluatee with a custom date window independent of term end date. Clarifies T39 — admin-triggered form IS supported in PCE. | pce | T139, T39 |
| D_PCE_0728B_07 | **Student-initiated evaluations = NOT Phase 1.** Confirmed by Monil with Vishaka + David present. All evaluations triggered by admin for a specific window. | pce | T140 |
| D_PCE_0728B_08 | **"Practice" → "Experiential" across product.** Rename course type label everywhere. Monil: "Let's note it down and change it to experiential." ✅ APPLIED to `analytics/page.tsx:509`, `pce-mock-data.ts:43,200,220`. | pce | T141 ✅ APPLIED |
| D_PCE_0728B_09 | **Analytics same-role comparison.** Instructor vs. instructor, co-instructor vs. co-instructor. Do not mix roles. Affects analytics design for T105, T106. | pce | T142 |

---

## Verbatim quotes

**Vishaka:**
> "It's single select. It's not multi select. So I am not able to pick all three components."

> "So this should not be multi-select because then it makes me think that I select all of them at once. It should be single select. And then I know, okay, I did all these for the course coordinator. Now I go to my lab assistant. I can clone or copy forward from course coordinator. I can edit or tweak or add ones, and then I add another role."

> "I didn't realize I had to go on the left hand panel, click faculty and complete that. Because if I see a next button, I'm gonna [expect] you to take me through the whole journey."

**David:**
> "If I'm creating a template, I have a certain structure in mind for that template. I don't understand what this bit [mark as default] is going to do for me."

> "I almost feel like a better flow or user experience, we force them to choose [the template] every time."

**Monil:**
> "Right now we will not support student initiated evaluations. All of them are triggered by admin for a specific window."

> "Experiential is what we should call to keep it. Let's note it down and change it to experiential."

> "Remove it [mark as default] completely."

**Vishaka (confirming DCE scope):**
> "Is it right to say DC evaluation is scope of general survey? Yes."

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T134 | Course type in template creation → multi-select | P1 — DESIGN-REVIEW | D_PCE_0728B_01. Prototype update needed. Structural. |
| T135 | Remove "mark as default for this course type" toggle from template creation | P1 — DESIGN-REVIEW | D_PCE_0728B_02. Lovable prototype update. |
| T136 | Faculty role selector in template builder → single select + clone | P1 — DESIGN-REVIEW | D_PCE_0728B_03. REVERSES T62. |
| T137 | Template builder navigation — guided wizard via "Next" through all sections | P1 — DESIGN-REVIEW | D_PCE_0728B_04. Reinforces T128. |
| T138 | DCE evaluation → general survey scope (not PCE) | P1 — logged | D_PCE_0728B_05. No design work needed in PCE. |
| T139 | Guest lecturer evaluation: admin-triggered custom window in PCE | P1 — DESIGN-REVIEW | D_PCE_0728B_06. Clarifies T39. |
| T140 | Student-initiated evaluations confirmed NOT Phase 1 | P1 — logged | D_PCE_0728B_07. Existing direction re-confirmed. |
| T141 | ✅ APPLIED — "Practice" → "Experiential" across codebase | — | D_PCE_0728B_08. Applied to analytics/page.tsx + pce-mock-data.ts. |
| T142 | Analytics: same-role comparison only (instructor vs. instructor) | P1 — DESIGN-REVIEW | D_PCE_0728B_09. Affects T105, T106. |
