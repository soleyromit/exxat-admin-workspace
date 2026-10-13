# Design Contract: S-11 Review and approve

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Tags: `[REQ id]` · `[OD-n]` · `[PROTO]` (illustration only) · `[CALL 09-23]` · `[CALL 03-05]` · `[INFER]`. Precedence REQ > CALL > PROTO > INFER.

Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08


## 1. Surface and wave

**Surface.**
S-11 Review and approve (queue + detail sheet)   Wave: W4

## 2. Persona and RBAC

P-R Admin reviewer (the P-A admin wearing the approval hat; REQ says only "administrator", sub-roles undefined: gap G-8 in docs/strategy/07). RBAC row: Administrator (program scope; the exxat-domain-context 'Super Program Admin' row), own program only [exxat-domain-context RBAC table].

## 3. Scope and data seen

Evaluations awaiting approval for skills configured with administrator review ON [REQ SC-15, AR-01]: student, skill, course, setting, location, evaluator, role, self-evaluation, evaluator responses, comment, student-supplied fields, own review note.  
Must NOT show: evaluations for skills where approval is off (they count immediately); other programs; evaluator emails; the student's achievement of unrelated skills.

## 4. Job to be done and why

**Job-to-be-done.**
When a skill requires a check before evidence counts, I want to see what the student and the evaluator recorded and decide approve or return, so only sound evidence counts.

**Why → So what.**
Why: "Some programs want an internal check before an evaluation counts" [REQ §8; CALL 09-23: "admins would want to first see what the preceptor has scored ... if the student's score is wrong or the preceptor's score is wrong, they might return it"]. So what: the reviewer decides on one screen without opening five tabs [journeys/01 moment of truth 3], and the student's record stays trustworthy.

## 5. Requirements and open decisions

**Requirements.**
AR-01, AR-02, AR-03, AR-04, AR-05, AR-06, SC-15, EV-07 (the evaluator was told "held for approval"), ST-11 and ST-12 (self-evaluation and student note appear distinct from the evaluator's comment), RP-07 (full responses), RV-03 and RV-05 (an approved or awaiting evaluation cannot be edited or resent), AE-01.

**Open decisions hit.**
OD-16 (proposed; who an administrator-returned evaluation goes back to): seam = "return target" is a field on the return event; copy stays neutral ("returned for correction"); REQ AR-05 says it "goes back for correction" and RV-01 says the student may "correct and resend a submission that was returned to them" — lean toward the student, recorded as [INFER] only. The recipient is not named in any button, banner or note prompt.  
OD-09 (self-evaluation form identical to the evaluator's?): the compare view assumes the same questions on both sides; if they ever differ the seam is a per-question mapping, not a new surface.  
OD-08 (corrected answers prefilled?): not relevant to the queue; it concerns re-evaluation (S-14/S-16).  
OD-15 (activation) and OD-03: not touched.

## 6. Prototype reference (keep / do not copy)

docs/source/screens/18 (review & approve).  
KEEP [PROTO 18]: the agreement sentence ("recorded the same / different outcomes"); "See the full responses"; optional review note; the two decisions on one card; queue shown only for skills with approval on.  
DO NOT COPY: the button label "Return to preceptor" and the banner "Returned … to the preceptor" (contradicts REQ RV-01 and the student's own history; DEFECT-03); a stacked card list with a filled Approve on every card (violates one filled primary per surface); unlabelled colour pills.

## 7. Pattern and reference hub

Route (queue) + right `Sheet` detail from a row. The queue is a DataTable whose rows carry NO filled buttons, only a text/ghost "Review"; the single filled primary "Approve" lives inside the Sheet (docs/ux/08 P-12, docs/ux/07 S-11). Reference hubs in repo (read): apps/pce/admin/app/(app)/moderation/page.tsx (a moderation list with a confirmation Dialog and LocalBanner; it moderates sharing results with faculty, not evaluations, so it is a layout analogue only); apps/pce/admin/components/pce/moderation-sheet.tsx (a detail Sheet using SheetContent); apps/pce/admin/components/pce/evaluation-card-sheet.tsx. PCE moderation hand-rolls its list with the sidebar menu primitives; do not copy that — use DS DataTable.

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** C-11 agreement compare card = HAND-ROLL on two `Card` columns + `StatusBadge` (`success` when they agree, `warning` when they differ; never `danger`). Queue = `DataTable`; detail = `Sheet`/`FloatingSheetPanel` IMPORT. EmptyState = VENDOR.


Verified with `node tools/ds/source.mjs` 1.5.1 (name-diffed to PCE 1.6.5; prop drift not diffed).  
PageHeader ✓ · DataTable ✓ (queue; IMPORT; never raw table) · Sheet ✓ (SheetContent side="right", size lg; modal; focus trap; IMPORT) · Dialog ✓ (Return with note) · Textarea ✓ + Field ✓ (FieldLabel, FieldDescription) (review note) · Accordion ✓ / Collapsible ✓ ("See the full responses") · StatusBadge ✓ semantic (Same / Differs; size sm|md; text label required) · Badge ✓ · LocalBanner ✓ (success, info; never toast) · Skeleton ✓ · Button ✓ (Approve default variant size default; Return for correction outline; text only, no icons) · Tooltip ✓.  
Custom: C-11 agreement compare card (two columns + StatusBadge) — HAND-ROLL on Card and primitives; EmptyState VENDOR candidate (apps/pce/admin/components/empty-state.tsx). Not exported: EmptyState, Pagination. Verdicts pending ds-adoption-reviewer.

## 9. Layout, content and behaviour

See the wireframe for S-11 in docs/ux/07 and the sections around this one; no additional layout rules were drafted.

## 10. States (L E Er V S Su D P Bl)

L   Queue skeleton rows; Sheet skeleton for compare columns when a row opens.  
E   "Nothing is waiting for approval." with one line explaining the queue only fills for skills where administrator review is turned on, and a link to S-09 settings is NOT offered here (config lives in the library).  
Er  Queue fetch error: LocalBanner error "The review queue could not be loaded. Try again." Decision submit error: Sheet stays open, note kept, banner "Your decision was not saved. Try again." (never lose the note) (P-17).  
V   Return: note is OPTIONAL per REQ AR-04. Proposal [INFER]: recommend requiring a reason on Return because RV-02 retains "the reason it was returned"; this is an open question (below), not decided; until confirmed the note is optional. Approve needs no note.  
S   Approve/Return button shows "Approving" / "Returning" with `aria-busy`, disabled; NOT optimistic because the decision changes achievement [P-14].  
Su  After a decision: item leaves the queue; LocalBanner success "{Skill} for {student} approved. It now counts toward their record." or neutral "{Skill} for {student} returned for correction. It does not count until the correction is complete."; focus moves to the next item header [P-12].  
D   While saving, both decision buttons are disabled. No undo is offered (approval changes achievement, AR-06); an approved evaluation stays reviewable in S-03.  
P   Queue header states "{n} waiting. Waiting evaluations do not count yet." (AR-06). Evaluations with a self-evaluation show an Agreement column; those without show "No self-evaluation".  
Bl  Evaluation was already decided by another admin: Sheet shows LocalBanner info "This evaluation was already {approved/returned} by {admin}." and disables decisions (concurrent review) [INFER; REQ silent].

## 11. Edge cases

EC-19 (admin returns: does not count; correction follows), EC-20 (awaiting approval: cannot edit or resend, not counted), EC-17 (evaluator unavailable: student resends to another), EC-18 (completed and did not meet criteria: not an approval matter, it is a further attempt), EC-6 (rule changed while pending: compare view reads the current rule), no self-evaluation configured (SC-15 off): single column, no agreement marker.

## 12. Copy and interactions

**Copy.**
docs/ux/09 §5 S-11 (all rows incl. the neutral return banner and return prompt), §6 (held vs counts now), §9 (do not ship). Button labels text only: "Approve", "Return for correction". The prompt "Your note is kept with the evaluation." is neutral about the recipient.

**Interactions.**
docs/ux/08 P-12 (approval compare view), P-15 (approve has no dialog because it is the decision; return has a Dialog with a note), P-14 (not optimistic), P-13, P-17.

## 13. Accessibility (WCAG 2.1 AA)

Queue is a DS grid; "Review" link name includes student and skill; Sheet traps focus, first focus on the title (not on Approve, to avoid accidental approval), Esc closes with unsaved-note prompt (P-13, P-17). Compare columns are a `<dl>` per question with "Same" / "Differs" as text; keyboard J/K for next/previous item [INFER]; NO single-key approve shortcut (P-12). Return opens a Dialog with default focus on the note field. Axe on queue, Sheet open, Dialog open and success-banner states.

## 14. Out of scope

Reminders or escalation when evaluations stay unreviewed (REQ §14: notifications, reminders and escalation); editing an evaluation (RV-03); bulk approve (not in REQ [INFER]); approving without opening (no bulk); reviewer analytics or evaluator-consistency reports (OD-11, CALL 09-23 phase 2); delegating review; routing to different reviewers by skill (REQ names only "administrator", gap G-8); remediation (REQ §14).

## 15. Acceptance tests (Given / When / Then)

AR-01   Given 2 evaluations awaiting approval, When I open the queue, Then each row shows student, skill, course, setting, location, evaluator and role.  
AR-02   Given a student self-evaluated "With assistance" and the preceptor recorded "Independent", When I open the item, Then both appear side by side and the page says they differ; Given identical outcomes, Then it says they are the same.  
AR-03   Given an item, When I choose "See the full responses", Then every question or level and its recorded answer is shown, not a summary.  
AR-04   Given I type a review note and approve, When I reopen the evaluation in S-03, Then the note is retained with it.  
AR-05   Given I choose Approve, When the server confirms, Then the evaluation counts and the item leaves the queue; Given I choose Return for correction, Then it does not count and a banner says so without naming who corrects.  
AR-06   Given 2 pending items for a skill, When I view S-01 or S-02, Then the skill's achieved count excludes them; after I approve one the count includes it.  
SC-15   Given a skill with approval OFF, When an evaluator submits, Then it never appears in this queue and counts immediately.  
EV-07   Given an evaluation submitted for an approval-on skill, When the evaluator finishes, Then they were told "held for administrator approval" (verified in S-16) and the item appears here.  
RV-05   Given an evaluation awaiting approval, When the student opens S-14, Then no edit or resend control is available for it.  
RV-03   Given an evaluation I approved, When I view it again, Then no edit control exists on it.  
EV-07b  Given an evaluation for a skill requiring approval, When the reviewer approves, Then the student's S-14 shows "Counted" with the reviewer's approval, not "Waiting for approval".  
OD-16 (seam)   Given a Return, When I read the stored event, Then it has a return-target field and the copy never states the recipient.
ST-11   Given an evaluation with a student self-evaluation, When I open it in the detail sheet, Then the student's and the evaluator's responses appear side by side, each labelled.
ST-12   Given an evaluation with a student note and an evaluator comment, When I open the detail, Then they appear in visually and programmatically distinct sections.
AE-01   Given an evaluation awaiting approval, When achievement is computed for that skill, Then it does not contribute until approved.
RP-07   Given any item, When I choose See the full responses, Then every question or level and its recorded answer is shown (same view as S-03).
RV-01   Given I return an item, When the student opens S-14, Then the item is returned to them and, if OD-16 resolves to the student-corrects branch, Revise and resend is offered (tested in S-13 and S-14).

## 16. Risks and unknowns (max 3)

(1) OD-16: if Sankalp decides "back to the evaluator", the student's Revise-and-resend path (RV-01) and S-14 states change; keep the target on the event, not hard-coded in UI. (2) Admin sub-roles are undefined (G-8): a reviewer may need to be a subset of admins; today any admin can approve. (3) A concurrent-review state is my [INFER]; REQ is silent on two reviewers acting on one item.

## 17. Vault notes consulted

Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md (raw; "the admins of the facility would want to first see what the preceptor has scored ... return it back to them ... rescore"; the system captures the final score); Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md (combination approaches: student self-assessment plus preceptor validation); _Insights.md (searched; no separate reviewer-workflow note found).

## 18. Open questions for Romit

require a reason when returning (my [INFER] from RV-02) or keep the note optional as AR-04 states? Needs Sankalp's view; I will not decide it.

## 19. Contradictions found / review log

None recorded in this draft beyond the fix-pass report.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Mobbin references (added 2026-10-08)

See `docs/research/meetings/2026-10-08-mobbin-remaining-surfaces.md` §M-5. Two outcomes with stated consequence (ClassDojo), note field beside the decision (Hex), two-column compare (Semrush). Hex's no-decision 'Comment' option is NOT adopted (AR-05 has approve or return only).

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** Review and Approve is the prototype's CARD LIST (no table, sheet or dialog): each card shows 'Student — Skill', meta, Qualifies badge, supplied-fields strip, evaluator block beside the student self-evaluation, the agreement sentence, 'See the full responses', a per-card Review note, and BOTH buttons on every card. Approve is the filled button, Return is outline and reads 'Return for correction' with a neutral banner (parity C-2: the prototype's 'Return to preceptor' would pre-decide OD-16). `/review/[submissionId]` deep links mark that card current. The result banner states the new qualifying count after Approve (AE-01).

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-10 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** AR-01..AR-06, SC-15, EV-07, ST-11/ST-12 (self-evaluation and student note distinct), RP-07, RV-03/RV-05, AE-01, double-decision guard, focus to the next card, OD-16 open.

**Weakened or traded away (honest list):** The one-filled-primary rule is knowingly broken: N cards means N filled Approve buttons (parity C-5, documented exception). The detail Sheet is gone. 'See the full responses' opens a Student / Evaluator text list instead of the prototype's disabled chips (fuller RP-07 view).
