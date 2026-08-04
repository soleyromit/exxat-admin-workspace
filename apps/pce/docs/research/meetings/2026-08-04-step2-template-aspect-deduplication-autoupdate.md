---
type: meeting
date: 2026-08-04
product: pce
participants: [Romit Soley, Monil (PM)]
source: granola
granola_id: 5f6c8679-8a6a-4a6a-8e33-5dd5d692d679
---

# PCE — Step 2 Design: Template Selection, Aspect Deduplication, Auto-Update Logic — 2026-08-04

**Date:** 2026-08-04 8:00 AM EDT
**Participants:** Romit (designer, note creator); Monil (PM — referred to in transcript as "Them"). Aarti and Vishaka referenced as having reviewed and approved these use cases.

---

## Topics covered

1. Goal of Step 2: identify templates per course and identify missing faculty association
2. Human vs. non-human aspect types — visual separation directive
3. Five user scenarios for the Step 2 table (course × aspect × faculty states)
4. Template switching: Override flow vs. New Survey flow
5. Hard block on same-aspect evaluation per term (aspect-level deduplication)
6. Aspect deselection mechanism — admin can manually deselect a blocked aspect
7. Auto-update toggle: ON (latest Prism at go-live) vs. OFF (freeze at Step 2 completion)
8. Showing excluded Prism faculty when auto-update is off
9. Manual Prism data refresh button in Step 2
10. Draft retrieval scenario (explicitly deferred to later)
11. Term card re-entry point for dropped-off flows (deferred to later)
12. Review aligned with Vishaka and David — build request confirmed; designs expected Aug 5

---

## Decisions

| ID | Decision | Product | Supplements |
|---|---|---|---|
| D_PCE_0804_01 | **Human vs. non-human aspect visual separation in Step 2.** Two categories of aspects exist: (A) Non-person aspects — Course Content, General (no person assignment needed; action is complete once template is selected). (B) Person/faculty aspects — Instructor, Course Coordinator, etc. (require identifying which specific people to evaluate). Step 2 UI must visually separate these two categories so the "who needs an action?" requirement is intuitive. "I would force you to also think from a human and non-human aspect separately. So that the next information where user needs to take action can also be intuitively filled." | pce | T129, T141 |
| D_PCE_0804_02 | **Template switch in Step 2 = two distinct system flows that must be surfaced to admin.** When admin selects the same course but a different template, the system must ask which scenario applies: (A) Override: replace the existing survey with the new template entirely — one entry in DB, previous survey is overwritten; (B) New survey: create an additional independent survey for the course using the new template — two surveys coexist. System asks this question before proceeding. "If you switch template a new survey would be created based on new template." Cannot silently switch. | pce | T129, T142 |
| D_PCE_0804_03 | **Hard block on duplicate aspect evaluation per term for same course offering.** System will NOT allow the same aspect (e.g. Course Content, Instructor) to be evaluated more than once for the same course offering in the same term. Even if the existing survey is in "Scheduled" (not yet live) state, the aspect is blocked for new surveys. Blocked aspects appear in the UI but are deselected (grayed) with a message explaining the duplication. Admin cannot evaluate the same aspect twice via any template for the same course-term combination. Distinct from T130 (which is a person-level triplet duplicate warning for live surveys). | pce | T129, T130, T143 |
| D_PCE_0804_04 | **Blocked aspect deselection: admin can deselect a hard-blocked aspect and proceed with remaining aspects.** When creating a new survey and a duplicate aspect is blocked, admin sees the blocked aspect as deselected by default. Admin can explicitly confirm the deselection and proceed using only the non-duplicate aspects from the new template. "How we can design this better is the goal — the constraint is we cannot reduce any of the action." The deselection UX is a click/toggle on the aspect chip. | pce | T129, T143, T144 |
| D_PCE_0804_05 | **Auto-update toggle ON: at survey go-live time, pull latest Prism faculty data.** If auto-update is ON: faculty added to the course in Prism AFTER Step 2 is completed — but before the survey goes live — are automatically included in the evaluation. Students will see evaluation forms for the newly added faculty. Step 2 must indicate that this toggle is on so admin understands the survey roster will reflect Prism state at go-live, not at Step 2 completion. | pce | T129, T134, T145 |
| D_PCE_0804_06 | **Auto-update toggle OFF: show faculty excluded from survey who exist in Prism.** When auto-update is OFF: only faculty present at Step 2 completion are included. If Prism later adds a person to the course, that person is excluded. Step 2 must show those excluded-by-auto-off faculty as a "deselected" / "not part of evaluation" state — visible but clearly excluded. "You will have to show in the UI that Doctor Y is... is deselected." Admin should not have to guess why some Prism faculty don't appear in the survey. | pce | T129, T145 |
| D_PCE_0804_07 | **Manual Prism data refresh button in Step 2.** A "Refresh" button in Step 2 that pulls the latest faculty associations from Prism on demand. Distinct from auto-update toggle (which governs go-live behavior). Refresh = "get current Prism data right now" for the purpose of seeing who's currently assigned. For demo/prototype, simulates a Prism data pull. "Right now you can propose a manual refresh button on the top. That will just for demo purpose it will just feel like the prism data is pulled with the latest." | pce | T129, T146 |
| D_PCE_0804_08 | **Empty state for instructor/person aspect when no faculty assigned in Prism.** When a person-type aspect (Instructor, Course Coordinator) is selected via template but no faculty are assigned to that course in Prism, the UI shows: state = "No person assigned" with an action CTA ("Assign faculty" — navigating to Prism). After admin assigns faculty in Prism and refreshes, the assigned names appear. Both states (empty and populated) must be designed. Distinct from T134 (add/remove within workflow). | pce | T129, T147 |
| D_PCE_0804_09 | **DEFERRED — Draft retrieval when same-course re-entered.** If admin starts a survey setup for a course, drops off (closes tab), then returns and re-selects the same course from Step 1, system should auto-retrieve the draft survey (same template auto-filled, same state restored). Monil explicitly said: "I think you don't have to design this scenario... this is for later purpose." Needed eventually but out of scope for current Step 2 design. | pce | — |
| D_PCE_0804_10 | **DEFERRED — Term card entry point to resume dropped-off flows.** Dashboard term card should have an entry point to re-enter a setup flow that was abandoned mid-progress (survey status = draft). Would allow admin to resume without treating it as a new survey. Monil: "this is for later purpose." | pce | — |
| D_PCE_0804_11 | **Proposed — List view/dashboard notification for Prism faculty excluded from evaluation.** Outside of Step 2, surface a notification somewhere in the course/survey list view when faculty exist in Prism for a course but are not part of the evaluation. Romit proposed; Monil aligned: "it's a good idea to show somewhere outside also so that they are aware." Cannot be shown inside Prism. Requires Romit design direction before implementing. | pce | T148 |
| D_PCE_0804_12 | **Designs reviewed with Vishaka and David — build request confirmed.** Monil confirmed all scenarios from this session have been reviewed by Vishaka and David ("rears and visual") who have asked to build it. Small modifications expected post-review. Designs targeted for Monil review on Aug 5. "These use cases I have reviewed with Vishaka and David and they have asked me to build it." | pce | — |

---

## Verbatim quotes

> **Monil:** "This screen is right now the most critical step of our product. I feel this screen is going to be a difficult screen from a user perspective. They might drop off because there are a lot of actions. But the constraint is we cannot reduce any of the action. From the screen."

> **Monil:** "I would force you to also think from a human and non-human aspect separately. So that the next information where user needs to take action can also be intuitively filled."

> **Monil:** "You will have to show in the UI to authenticate that doctor Y is unassigned or not part of evaluation, is deselected."

> **Monil:** "These use cases I have reviewed with Vishaka and David and they have asked me to build it."

> **Monil:** "We need to move really fast on this... can we see these designs tomorrow?"

> **Romit:** "We can see the design tomorrow but again it's not like corner cases to be exact because there are some scenarios where the design has to be reevaluated."

---

## Code cross-reference (Pass 5)

| Directive | Existing code | Gap / Status |
|---|---|---|
| D_PCE_0804_01: Human/non-human aspect separation | ❌ Not built | `surveys/push/page.tsx` is the old 3-step flow; new Step 2 from T129 doesn't exist in code yet. T141 added. |
| D_PCE_0804_02: Template switch = two-path decision | ❌ Not built | No template-per-course assignment in current code. T142 added. |
| D_PCE_0804_03: Hard block on duplicate aspect per term | ❌ Not built | No aspect deduplication in current code. T143 added. |
| D_PCE_0804_04: Aspect deselection mechanism | ❌ Not built | T144 added. |
| D_PCE_0804_05: Auto-update toggle ON behavior | ❌ Not built | No auto-update toggle in current code. T145 added. |
| D_PCE_0804_06: Show excluded Prism faculty (auto-update OFF) | ❌ Not built | T145 added (same task, both states). |
| D_PCE_0804_07: Manual Prism refresh button | ❌ Not built | T146 added. |
| D_PCE_0804_08: Empty state for no-faculty person aspect | ❌ Not built | T147 added. |
| D_PCE_0804_09: Draft retrieval | — | Deferred by Monil. Backlog note only. |
| D_PCE_0804_10: Term card re-entry for draft | — | Deferred by Monil. Backlog note only. |
| D_PCE_0804_11: List view excluded-faculty notification | ❌ Not built | DESIGN-REVIEW — needs design direction. T148 added. |

**Pass 5 verdict:** No immediate code changes apply to existing screen files. All directives target the not-yet-built Step 2 of the T129 setup evaluations wizard. Current `surveys/push/page.tsx` is the legacy 3-step flow (pre-T129) — do not edit it for T129 requirements. Tasks T141–T148 added to backlog.

---

## Design tasks generated

| # | Task | Priority | Notes |
|---|---|---|---|
| T141 | Step 2 — Human vs. non-human aspect visual separation | P1 — DESIGN-REVIEW | Non-person aspects (Course Content, General) = one visual group: no further action needed beyond template selection. Person aspects (Instructor, Coordinator) = second visual group: show faculty assignment states. Romit design direction required. |
| T142 | Step 2 — Template switch prompt: Override vs. New Survey | P1 — DESIGN-REVIEW | When admin selects same course + different template in Step 2, surface a decision: "(A) Override existing survey — replace template, one survey" vs. "(B) Create new survey — keep existing, add new one." Must be explicit; cannot be a silent action. |
| T143 | Step 2 — Hard-blocked duplicate aspect: deselected state + message | P1 — DESIGN-REVIEW | Aspect already evaluated for the same course-term combination (even if in Scheduled state) is blocked in new-survey flow. Show blocked aspect as deselected/greyed with explanation: "Course Content is already being evaluated for this course. Deselect to proceed." |
| T144 | Step 2 — Blocked aspect deselection CTA | P1 — DESIGN-REVIEW | Admin can click to confirm deselection of a hard-blocked aspect and proceed with remaining aspects. Deselection chip/toggle affordance. Supplements T143. |
| T145 | Step 2 — Auto-update toggle ON/OFF states and excluded faculty display | P1 — DESIGN-REVIEW | Two states: (ON) label indicating roster will refresh from Prism at go-live; (OFF) show faculty in Prism who are excluded from survey as "not included in evaluation" — visible, clearly deselected. Design both toggle states and the excluded-faculty row/indicator. |
| T146 | Step 2 — Manual Prism data refresh button | P1 — carry-forward at T129 implementation | Button to pull latest faculty associations from Prism on demand. Demo: simulates Prism data pull and updates faculty rows. Supplements T134. |
| T147 | Step 2 — Empty state for person aspect with no Prism faculty | P1 — carry-forward at T129 implementation | When Instructor / Coordinator aspect selected but no faculty assigned in Prism: show "No person assigned" state with "Assign faculty" action (navigates to Prism). After assignment + refresh, named faculty appear. Both empty and populated states required. |
| T148 | Dashboard / list view — excluded Prism faculty notification | P1 — DESIGN-REVIEW | Surface a notification outside of Step 2 (dashboard or course list) when faculty exist in Prism for a course but are not part of the active evaluation. "It's a good idea to show somewhere outside also." Needs Romit design exploration before any code. |
