---
type: meeting
date: 2026-08-06
product: pce
participants: [Romit Soley, Monil (PM)]
source: granola
granola_id: 182b0d8a-a1d1-43bb-93bf-5c984b316925
---

# PCE — Course Eval Sync Up (Mona) — 2026-08-06

**Date:** 2026-08-06 9:30 AM EDT
**Participants:** Romit (designer, note creator); Monil/Mona (PM — "Them" in transcript). Vishal was expected but could not join; meeting was recorded for him.

---

## Topics covered

1. Role-level toggle for evaluatee type selection (course material vs. instructor)
2. Template change location — restricted to first selection step only; killed at row level
3. Template change confirmation dialog requirement
4. Newly added faculty: inline in table vs. separate horizontal cards (killed horizontal cards)
5. 80/20 design principle: course material + instructor = primary; rare roles = overflow
6. Faculty display: names only, no profile images
7. Cancel evaluation: not available inside wizard; goes to view survey list
8. Time sensitivity — designs to be deployed by end of day Aug 6; engineering handoff imminent

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0806_01 | **Role-level toggle only — not role+person level.** The on/off toggle for evaluating a role (course material / instructor) acts at the ROLE level. It answers: "do you want to evaluate this role at all?" Individual person names are NOT shown at the toggle level. Only a summary count of instructor personas may be shown. "That toggle romit would be only on the roll level… you will ask user to select deselect those roles only." | pce | T129, T149 |
| D_PCE_0806_02 | **Template change restricted to first template selection step only.** Inline template switching at the row level in Step 2 is killed — too complex. Template can only be changed at the "above screen" (the first step where the template is initially assigned per course). "Let's keep let the template change be on that above thing only where they are actually selecting template for the first time." | pce | T129, T142, T150 |
| D_PCE_0806_03 | **Template change requires a confirmation dialog.** When admin changes a template (on the first selection step), show a dialog: "Are you sure you want to change the template? If the template is updated, all the evaluatees will also be updated based on the new template selected." Cannot be a silent switch. | pce | T129, T150, T151 |
| D_PCE_0806_04 | **Newly added faculty: inline in the evaluatee column, not separate horizontal cards.** Romit's design showed horizontal cards appearing above the main table for newly synced faculty. Monil killed this: "cards showing separately will confuse the user." Instead, show newly added evaluatees inline within the existing table's evaluatee column. The accordion/checkbox area on the left has space to spare; use it. "Think of a solution in the table itself. You have in the left side you have used a lot of space to for the checkbox and that drop accordion button. We can shift things on the left and show newly added evaluities on that evaluity column itself." | pce | T129, T134, T152 |
| D_PCE_0806_05 | **80% design rule — course material + instructor are primary; rare roles use overflow.** 80% of users evaluate only: Course Material + Instructor. Design the primary view for these two. Any additional faculty roles (coordinator, lab instructor, etc.) are accessible via a "+" or "see more" mechanism, not shown by default. "I'll tell you 80% of our users will run course evaluation to evaluate the following: Course material and instructor. For rest of them it is like a plus button or see more or view more kind of a thing." | pce | T129, T153 |
| D_PCE_0806_06 | **Faculty display: names only, no profile images.** Faculty profile images are banned from the course eval setup flow. Reasons: (a) many faculty have not uploaded photos; (b) image API calls add latency. Display faculty using their names (text) only. Mona confirmed: show instructor names in front of the instructor row, not avatars with real photos. "Let's avoid using images because some of the faculties might not have images uploaded. And rendering image from engineering standpoint is what you said time consuming." | pce | T129, T154 |
| D_PCE_0806_07 | **Cancel evaluation is NOT in the setup wizard.** Admin cannot cancel an evaluation from inside the setup wizard steps. If they want to cancel, they must navigate to "view survey list." Do not add a cancel CTA inside any wizard step. "They can cancel but not here in this step. They have to go to view survey list and there they can cancel." | pce | T129, T155 |

---

## Verbatim quotes

> **Monil:** "That toggle romit would be only on the roll level. So. And in this case, your end of term evaluation has how many roles to be evaluated. I can see course material and instructor. Only two. Right? So here you will ask user to select deselect those roles only."

> **Monil:** "We will not show who the instructors are at this level. We can just give a summary where you have on the top or else we can say show number of instructor personas also over here. But that toggle is not on a person. That toggle is on a roll."

> **Monil:** "This is too complex for user. Let's keep let it let the template change be on that above thing only where they are actually selecting template for the first time."

> **Monil:** "You will give a dialogue that are you sure you want to change the template if the template is updated, all the evaluities will also be updated based on the new template selected."

> **Monil:** "Cards showing separately will confuse the user because each instructor is associated to a course. So it has to be in front of a course line."

> **Monil:** "Think of a solution in the table itself. You have in the left side you have used a lot of space to for the checkbox and that drop accordion button. We can shift things on the left and show newly added evaluities on that evaluity column itself."

> **Monil:** "I'll tell you 80% of our users. Will run course evaluation to evaluate the following. Course material and instructor. So yes, also give me this feedback that let's design for those 80%. But our system supports other n faculty roles also. For rest of them it is like a plus button or see more or view more kind of a thing."

> **Monil:** "Let's avoid using images because some of the faculties might not have images uploaded. And rendering image from engineering standpoint is what you said time consuming."

> **Monil:** "They can cancel but not here in this step. They have to go to view survey list and there they can cancel."

> **Monil:** "Try to accommodate this today it's time sensitive now we have to hand it over to dev."

---

## Code cross-reference (Pass 5)

| Directive | Existing code | Gap / Status |
|---|---|---|
| D_PCE_0806_01: Role-level toggle | ❌ Not built | Step 2 wizard (T129) not yet in code. Old `surveys/push/page.tsx` is pre-T129 3-step flow. T149 added. |
| D_PCE_0806_02: Template change location | ❌ Not built | No row-level inline template change in code — directive is to prevent it being built that way. T150 added. |
| D_PCE_0806_03: Template change dialog | ❌ Not built | No template change dialog in current code. T151 added. |
| D_PCE_0806_04: Newly added faculty inline in table | ❌ Not built | No faculty-card pattern in current production code. Horizontal-card design was Lovable prototype only. T152 added. |
| D_PCE_0806_05: 80% rule (course material + instructor primary) | ❌ Not built | Design principle for T129 Step 2 — no code equivalent yet. T153 added. |
| D_PCE_0806_06: Faculty names not images | ✅ Existing code already compliant | `pce-modals.tsx:598-600` uses `AvatarFallback` with initials, not `AvatarImage`. No photo-based display exists in production code. Image-based design was Lovable prototype only. No code change needed. |
| D_PCE_0806_07: No cancel CTA in wizard | ❌ Not built | Step 2 wizard (T129) not yet in code. T155 added as reminder spec note. |

**Pass 5 verdict:** No immediate code changes required to existing files. All directives apply to the not-yet-built T129 setup evaluations wizard. The "no images" directive is already satisfied in production code (initials-only avatars). Tasks T149–T155 added to backlog.

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T149 | Step 2 — Role-level evaluatee toggle (not person level) | P1 — DESIGN-REVIEW | Toggle = "do you want to evaluate this role?" at role level only. No individual person names at the toggle level. Summary count of personas (e.g. "2 instructors") is acceptable. D_PCE_0806_01. |
| T150 | Step 2 — Kill inline template change; restrict to first selection step | P1 — applies at T129 implementation time | Do NOT build a template-switching control inside the Step 2 row. Template selection is only on the "above screen" (Step 1 or equivalent first-step). Supersedes any inline template picker in Step 2. D_PCE_0806_02. Supplements T142. |
| T151 | Step 2 — Template change confirmation dialog | P1 — DESIGN-REVIEW | On template change (at the first selection step), surface a dialog: "Are you sure you want to change the template? All evaluatees will be updated based on the new template." Cannot be silent. D_PCE_0806_03. |
| T152 | Step 2 — Newly added faculty inline in evaluatee column | P1 — applies at T134/T129 implementation time | When Prism sync adds new faculty to a course, show them as a new row inline within the existing course row's evaluatee column — not as separate horizontal cards above the table. Left-side accordion/checkbox area can absorb the space. D_PCE_0806_04. Supplements T134. |
| T153 | Step 2 — 80% rule: course material + instructor primary; rare roles = overflow | P1 — DESIGN-REVIEW | Default view shows only Course Material + Instructor (80% of usage). Any additional faculty roles are accessible via "+" or "see more" affordance — hidden by default. Design the overflow pattern. D_PCE_0806_05. |
| T154 | Step 2 — Faculty display: names only, no profile images | P1 — applies at T129 implementation time | All faculty/instructor displays in the setup wizard must use text names only. No `AvatarImage` with real photos. Initials-based fallback (`AvatarFallback`) is acceptable only if confirmed not to require a photo API call. Safest = plain text name. D_PCE_0806_06. |
| T155 | Setup wizard — no cancel CTA inside wizard steps | P1 — applies at T129 implementation time | Do not place a "cancel evaluation" action anywhere inside the setup wizard. If admin wants to cancel, they navigate to "view survey list" for that action. D_PCE_0806_07. |
