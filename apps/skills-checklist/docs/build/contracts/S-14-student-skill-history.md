# Design Contract — S-14 Student: skill history

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Written 2026-10-08. Sources: `docs/ux/07` (S-14), `08` (P-10, P-11, P-13, P-18), `09` (S-14, §7 failed-rule generator), `10`, `11` (DEC-003, DEC-006), `docs/ux/05` SM-02, `docs/ux/04` F-09 and F-10, `docs/journeys/02-student-journey.md`, `docs/strategy/05, 06, 07`, REQ.

## 1. Surface and wave

**Surface.**
S-14 Student: skill history                                         Wave: W3 (actions land with W4 revision)

**Flows.**
F-09 (revise and resend), F-10 (further attempt), entry from S-12 / S-15

## 2. Persona and RBAC

P-S Student. RBAC: own submissions only; reviewer note is shown to the student because RV-02 requires the  
return reason to be retained [REQ RV-02; showing it is INFER]; no other students; no evaluator contact  
details beyond name and role [INFER].

## 3. Scope and data seen

All own attempts for one skill across courses (default) or one course; evaluator name and role; own  
answers; evaluator feedback; reviewer note; completed evaluation read-only.

## 4. Job to be done and why

**Job-to-be-done.**
"When a submission did not count or came back, I want to know exactly what happened and what to do next,  
so I can fix it without asking anyone."

**Why → So what.**
With no remediation workflow in scope [REQ §14], the clarity of the failed rule (SH-03) is the only  
remediation lever the product has. Students who cannot tell counted from waiting from returned stop trusting  
the record. Revise vs further attempt have different consequences for the record and must not be confusable.

## 5. Requirements and open decisions

**Requirements.**
SH-01 SH-02 SH-03 SH-04 SH-05 SH-06 SH-07 RV-01 RV-02 RV-03 RV-04 RV-05 ST-13 AE-02 AE-04 AR-04 AR-05

**Open decisions hit.**
OD-08 (evaluator's earlier answers cleared or retained on correction: no copy promises either way),  
OD-16 (where an admin return goes: banner and card text stay neutral about who corrects; the primary action  
appears for the student because RV-01 says "returned to them"; this is the REQ-consistent default, still open),  
OD-14 (conditional "Draft" attempt card and Continue self-evaluation; absent by default),  
OD-03 (skill header status renders from the 4-state enum behind the one flag),  
OD-24 (skill deactivated: history stays reachable read-only),  
OD-17 (not applicable: student sees own data).

## 6. Prototype reference (keep / do not copy)

docs/source/screens/20-student-history.png (+ 07-evaluation-detail.png for View evaluation).  
KEEP: three counters; scope toggle (All courses / one course); attempt cards with outcome pill, evaluator +  
role + outcome, "You rated yourself", feedback, reviewer note, "Revised and resent n times", View form;  
Revise and resend on the returned attempt only.  
DO NOT COPY: outcomes with no failed rule (SH-03); a third counter named "Waiting" in the wireframe (use  
"In progress", SH-04 "outstanding", DEC-006); newest-first with no way to read chronologically [INFER];  
seed data whose completion dates disagree with submission dates (DEFECT-08); the admin text "Return to  
preceptor" (DEFECT-03).

## 7. Pattern and reference hub

**Pattern.**
Sheet (right, size lg); mobile [INFER]: full-screen route with a back affordance (the DS Sheet resizes 280-960  
px; past xl the .d.ts advises a route). Opens from S-12 / S-15; scope toggle persists in the URL.

**Reference hub (repo).**
No history/timeline sheet exists in the student apps (apps/pce/student has only list pages). Closest pattern  
in the workspace: PCE admin drill Sheets (apps/pce/admin; pick the exact file at build time). Layout  
reference only.

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** Failed-rule explainer (C-15) = one `LocalBanner variant="warning"` use. Scope toggle (All courses / one course) = `RadioGroup` or `Tabs`; not `ToggleGroup`. No exported Pagination: collapse older attempts or use `DataTablePaginated`.


Verified @exxatdesignux/ui@1.5.1 on 2026-10-08; re-verify against the pinned version (PCE = 1.6.5); DSQ-1 open.  
container ........... Sheet ✓ (side right, size lg, showCloseButton)  
scope toggle ........ RadioGroup ✓ (reviewer: ToggleGroup is for filter/view toggles, not single-choice) or  
                      styled as segments (DEC-007), or Tabs ✓ (value/onValueChange). Decision for
                      reviewer [INFER]
counters ............ plain text numbers in a row (not KeyMetrics, which targets dashboards, max 4 flat)  
attempt card ........ Card is not in the verified list for this DS; compose with a bordered div + tokens, or  
                      Accordion ✓ items per attempt [INFER]
outcome ............. StatusBadge ✓ semantic (label + tone + icon, size sm/md only); outcome is always text  
failed-rule text .... LocalBanner ✓ variant warning (no `emphasis` prop; see S-12 contract note)  
actions ............. Button ✓ text only, no icons on action buttons; one filled primary per sheet  
loading ............. Skeleton ✓  
read-only form ...... values rendered as text (P-11), not disabled inputs

## 9. Layout, content and behaviour

**Mobile-first [INFER].**
attempt cards stack; counters wrap to two lines; actions full width at the card bottom; scope toggle sticky  
under the header; targets >= 44px.

**Content and behaviour.**
- **Header:** skill name, criteria summary, counters **Counted · In progress · Returned** (SH-04; third label is "In progress", meaning outstanding, DEC-006), scope toggle All courses (n) / {Course} only (n) (SH-06), progress line including **per-setting progress** (SH-05, P-18) and a note that evidence counts wherever it was gathered.
- **Skill record status** (separate from per-submission outcome): shown once in the header from the 4-state enum behind the OD-03 flag; label for state 2 is "Evidence does not qualify" (DEC-003). Never reuse "Did not meet criteria" for the skill.
- **Attempt cards** newest first with attempt numbers (SH-01); offer an oldest-first toggle [INFER]. Each card: attempt number, date, context (setting, location, course), evaluator and role, **outcome in four terms** (SH-02): **Counted · Did not meet criteria · Returned · Waiting with {name} ({role})**, plus "Waiting for approval" while an admin check is pending. Also: what the student recorded, "You rated yourself", evaluator answer and feedback (SH-07 via View evaluation, read-only), reviewer note, "Revised and resent n time(s)" with the reason retained (RV-02), and the student's own submission details (ST-13 context).
- **Failed rule (SH-03):** for **Did not meet criteria**, a LocalBanner warning inside the card states the rule in the student's terms and what was missed, generated per model from `09` §7.1 (question subset, at least N of M, average, minimum per question, binary), followed by "You can make a further attempt." For demonstration skills a single evaluation never fails (every completed demonstration is evidence, [INFER]); the explanation is on criteria progress via `09` §7.2.
- **Actions (one per card, state-appropriate, never both, P-10, P-11):**
  - **If OD-16 resolves to the evaluator-redoes branch, the student's "Revise and resend" action disappears from S-13/S-14 (only the banner copy is neutral today; the action already commits to the student-corrects branch, which is RV-01-backed).**
  - Returned or not yet assessed: **Revise and resend** (RV-01). Opens S-13 in Revise mode; same record; revision count +1; evaluator changeable (RV-04).
  - Completed and did not meet criteria: **Make a further attempt** on the skill header, only when no attempt is pending or returned (RV-03). New record; original intact.
  - Counted: no action; text "This evaluation counted and can no longer be changed" (RV-05).
  - Awaiting approval: no action; text "Waiting for administrator approval" (RV-05).
- **View evaluation** opens S-03-style read-only detail (rendered text values; SH-07). A completed evaluation is never editable (RV-03).
- **AE-02:** because qualification is evaluated against the skill's current rule, a card's outcome and the header counts may change after an admin edits the rule. The card shows the current result; whether to annotate "the rule changed" is an open question for Sankalp, not decided here [INFER, flagged].

## 10. States (L E Er V S Su D P Bl)

| State | Behaviour |
|---|---|
| L | Skeleton for header and 3 cards; header text first |
| E | "You have not sent this skill for review yet." with a "Send for review" text link back to S-12 |
| Er | LocalBanner error with retry: history could not be loaded |
| V | n/a on this surface; validation happens in S-13 |
| S | Revise or Further attempt opens S-13; no state here besides the card's "Waiting" after resend; non-optimistic (P-14): the card changes only after the server confirms |
| Su | After resend or further attempt, focus returns to the card / header and an info LocalBanner reads "Your request was sent to {name}, {role}." [INFER] |
| D | No disabled controls; actions are removed (not greyed) when locked, with plain-text reason (P-11) |
| P | In progress counter; Waiting card shows who it is with; conditional Draft card only if OD-14 |
| Bl | Further attempt hidden while any attempt is pending or returned, with a one-line reason "Finish your open submission first" [INFER] |

## 11. Edge cases

EC-17 evaluator unavailable (Revise with a different evaluator). EC-18 further attempt after failure. EC-19 admin returned an evaluation (card Returned, banner neutral on who corrects). EC-20 locked states (counted, awaiting approval). EC-11 evidence from a course the student is not mapped to appears under All courses. EC-25 skill already achieved: History still lists every attempt. Also: attempt with no evaluator comment (show "No comment recorded."); a revision that changed evaluator (show both evaluators? show current, mention "Evaluator changed" [INFER]).

## 12. Copy and interactions

Copy: `docs/ux/09` §5 "S-14", §6 (counts-now vs held), §7 (failed-rule generator), §9 (copy that must not ship, includes "Return to preceptor"). Interactions: `docs/ux/08` P-10, P-11, P-13, P-18.

## 13. Accessibility (WCAG 2.1 AA)

- Sheet focus: title on open; Esc closes; focus returns to the History trigger. Cards are a list with headings per attempt (`h3`); outcome text is read before action buttons.
- Outcome is text plus tone; failed-rule banner has `role="status"`; revision count is text.
- Scope toggle is a labelled group with a visible selected state not dependent on colour.
- Targets >= 44px; read-only form values keep programmatic labels (definition list).

## 14. Out of scope

Remediation plans, reminders, escalation, notifications [REQ §14]; editing a completed evaluation; showing other students' attempts; showing evaluator contact details; letting the student delete an attempt; an audit trail UI beyond revision count and reason.

## 15. Acceptance tests (Given / When / Then)

1. **SH-01** Given 5 attempts for IV Insertion, When the sheet opens, Then every attempt is listed in order and identified by attempt number.
2. **SH-02** Given one counted, one returned, one waiting with a named preceptor and one that did not meet criteria, When listed, Then each carries exactly one of the four outcomes and the waiting one names who it is with.
3. **SH-03** Given an evaluation answered No to a required question in a named-subset rule, When the card renders, Then the warning states which required questions were not answered Yes and that a further attempt is possible.
4. **SH-04** Given 4 counted, 1 outstanding, 1 returned, When the header renders, Then it shows Counted 4, In progress 1, Returned 1.
5. **SH-05** Given the skill has per-setting minimums, When the header renders, Then each named setting shows progress, and lab evidence is shown as not counted toward settings.
6. **SH-06** Given evidence from NURS 350 and NURS 410, When the sheet opens, Then All courses is the default and the toggle narrows to one course.
7. **SH-07** Given a completed evaluation, When the student activates View evaluation, Then they see the evaluator's responses and feedback in full, read-only.
8. **RV-01, RV-02** Given a returned attempt, When the student chooses Revise and resend, Then S-13 opens pre-filled, the reviewer's reason is shown, and on Resend the same attempt number continues with revisions +1 and the reason retained.
9. **RV-03** Given a completed attempt that did not meet criteria and nothing pending, When the student chooses Make a further attempt, Then a new attempt is created and the original attempt is unchanged.
10. **RV-04** Given either path, When the student picks a different evaluator, Then the send is valid only under P-09 constraints.
11. **RV-05** Given a counted attempt and an attempt awaiting approval, When the cards render, Then neither shows Revise or Further attempt and each states why.
12. **ST-13** Given a submitted attempt, When expanded, Then it shows what was sent, to whom, in what role and in which setting and location.
13. **AE-04, DEC-003** Given a skill with evidence that none qualifies, When the header status renders, Then it reads "Evidence does not qualify" and not "Did not meet criteria".
14. **AR-04, AR-05, OD-16 neutral** Given an admin returned an attempt with a note, When the card renders, Then the note is shown and no text states whether the student or the evaluator must correct beyond the available action.
15. **P-10** Given the latest attempt is pending, When the header renders, Then Make a further attempt is not shown.
16. **AE-02** Given an admin changes the qualification rule, When the student reopens history, Then outcomes and counts reflect the current rule.

## 16. Risks and unknowns (max 3)

1. The prototype has no failing-evaluation example, so the SH-03 copy is untested against real evaluators; validate with `docs/ux/12` tests.
2. OD-16 and OD-08 unresolved: the action on a Returned attempt may change owner.
3. A long history (20+ attempts) needs pagination or collapse; the DS has no exported Pagination in 1.5.1 [verify in pinned version].

## 17. Vault notes consulted

`Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw: admins may return a score to be re-rated; remediation left open: "Do we need to do it in phase 1?"); `Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md` (students lack visibility of progress); `_Insights.md` skim; `Products/skills-checklist/personas.md` (empty placeholder).

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

None recorded in this draft beyond the fix-pass report.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Mobbin references (added 2026-10-08)

See `docs/research/meetings/2026-10-08-mobbin-remaining-surfaces.md` §M-7. Weak: only activity logs were returned (actor, event, time, status chip). No external precedent for attempts with failed-rule reasons and a next-step action (SH-02, SH-03).

## Build note (2026-10-08, fix pass). SUPERSEDED by R5 (prototype parity, C-10): the counter is "In progress" / "Sent but not finished" again, as in the prototype; DEC-012 is superseded in docs/ux/11

## Original build note (2026-10-08, fix pass)

The header counter that counts submissions sent but not yet assessed is labelled **"Awaiting evaluation"** (helper "Sent, not yet assessed") instead of "In progress", so it no longer shares a word with the AE-04 derived skill status "In progress" shown on the same screen. Proposal `[INFER]` after the UX critic review of the build; see DEC-012 in `docs/ux/11`. The data field is still `outstanding` (SH-04) and no count changed.

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** History is a 1024px DS Dialog (`?history=<skillId>`), not a full page: counters Counted so far / In progress / Returned (the counter is back to the prototype's 'In progress' with 'Sent but not finished'; DEC-012 superseded, see the existing build note below), the 'All courses (n)' / '<code> only (n)' toggle, attempt cards, View form, and Revise and resend. Revise and Further attempt open the Send dialog.

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-11 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** SH-01..SH-07, RV-01..RV-05, SH-03 failed-rule text, locked states, OD-16 neutral wording (Revise and resend disappears if the evaluator-redoes branch is chosen), OD-08.

**Weakened or traded away (honest list):** The counter 'In progress' again sits beside a skill status that can also read 'In progress' (the prototype has the same clash; recommended fix, not applied: rename the counter 'Awaiting evaluation'). The scope toggle is in the dialog, not in the URL path.
