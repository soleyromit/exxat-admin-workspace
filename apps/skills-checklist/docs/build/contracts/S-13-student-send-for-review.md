# Design Contract — S-13 Student: send for review

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Written 2026-10-08. Sources: `docs/ux/07` (S-13), `08` (P-08, P-09, P-10, P-14, P-17), `09` (S-13), `10`, `11` (DEC-001, DEC-007), `docs/ux/04` F-06, `05` SM-02, `docs/journeys/02-student-journey.md`, `docs/strategy/05, 06, 07`, REQ.

## 1. Surface and wave

**Surface.**
S-13 Student: send for review (also hosts "Revise and resend" and "Make a further attempt")   Wave: W3

**Flows.**
F-06 (primary), F-09 and F-10 (reuse the same sheet pre-filled), F-13 (student side of unlisted lab instructor)

## 2. Persona and RBAC

P-S Student. RBAC: sees only own placements and the evaluators recorded for roles valid for the chosen  
setting; no peer data; no evaluator contact details beyond name and role [INFER]. The request leaves the  
student session as a tokenised link to S-16 (no account created) [REQ EV-01].

## 3. Scope and data seen

Own skills selected from S-12; own placements for the course; program lists (clinical settings, lab  
instructor roster, allowed roles per skill, submission fields per skill).

## 4. Job to be done and why

**Job-to-be-done.**
"When I have performed one or more skills, I want to send them to whoever watched me, with the right  
context, so my evidence can be assessed."

**Why → So what.**
This is the moment evidence enters the record with the context that makes reports meaningful (setting,  
location, role). Fewer, derived decisions (not free choices) means fewer returned submissions. A wrong  
role/person combination (DEFECT-01) corrupts the record and wastes an evaluator's time.

## 5. Requirements and open decisions

**Requirements.**
ST-05 ST-06 ST-07 ST-08 ST-09 ST-10 ST-11 ST-12 ST-13 SC-13 SC-15 SC-16 EV-02 EV-04 SL-08 SL-09  
RV-01 RV-02 RV-03 RV-04 (revise / further-attempt modes)

**Open decisions hit.**
OD-07 (setting and location once per submission vs per skill; seam: store on each submission item,  
default copied from the submission, UI captures once) [ST-14],  
OD-14 (Save draft + conditional pending self-evaluation; seam: Save draft absent by default),  
OD-04 (submission fields per skill vs program default; seam: field set referenced by skill; "Apply to  
all selected" is a UI helper, not a decision),  
OD-06 (roles as data, seeded Preceptor / Clinical faculty / Lab instructor), OD-25 (proposed: which roles may sign off clinical vs lab evidence; seam: seeded validity table),  
OD-08 (prefill of evaluator's earlier answers on revise: do not promise either in copy),  
OD-09 (self-evaluation form identical to evaluator's; one form schema, two respondents),  
OD-16 (who an admin-returned submission goes back to: banner stays neutral; the Revise mode exists  
because REQ RV-01 says "returned to them"),  
OD-24 (skill deactivated while open: sheet keeps the selection but flags the skill as unavailable).

## 6. Prototype reference (keep / do not copy)

docs/source/screens/21-student-send-dialog.png and 22-student-sent-confirmation.png.  
KEEP: Clinical / Lab toggle; placement helper text; per-skill "Incomplete" chips; evaluator explainer line;  
send disabled until valid.  
DO NOT COPY: stale evaluator after Clinical -> Lab (DEFECT-01); confirmation missing setting and location  
(DEFECT-02); one blue primary in the bar plus one in the dialog; a native date input hiding the label  
format; identical field repeated per skill with no grouping.

## 7. Pattern and reference hub

**Pattern.**
Sheet (right, size lg = 32rem on desktop). Mobile [INFER]: `side="bottom"` (the .d.ts says top/bottom  
sheets span the viewport width and ignore `size`; docs/ux/07 says bottom `size="full"`: contradiction,  
verify height behaviour on live /library/sheet). Single task, single outcome, references the list behind it.

**Reference hub (repo).**
No existing send-with-constrained-choices hub in the repo. Closest student form patterns:  
apps/pce/student/app/activities/page.tsx and surveys/page.tsx (tokenised student surfaces, list -> action).  
Sheet pattern doc: exxat-overlays / drawer-vs-dialog (workspace skills). Layout reference only; no code reuse.

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** `Sheet`: **`size` is ignored for `side="bottom"` and `top`** (height is content-driven), so the mobile form must be scroll-safe with a sticky footer; do not specify a bottom size. C-18 role × setting resolver = HAND-ROLL on `RadioGroup`, `Select`, `LocalBanner variant="warning"`. Clinical/Lab and self-evaluation Yes/No and levels = `RadioGroup`. `DatePickerField` has no label/error props: wrap in `Field`.


Verified with `node tools/ds/source.mjs` @exxatdesignux/ui@1.5.1 (2026-10-08); re-verify against the pinned  
version (PCE = 1.6.5). Open DSQ-1: student-app DS source (studentUX vs @exxatdesignux/ui) for the reviewer.  
  container ........... Sheet ✓ (side right|bottom; size sm|md|lg|xl|full for left/right; showCloseButton;  
                        dismissOnOutsideClick default true: set false while the form is dirty [INFER];
                        resizable optional, leave off)
  performed in ........ RadioGroup ✓ (single choice per DEC-007), NOT multi ToggleGroup  
  setting / role / person Select ✓ (Radix composition; SelectTrigger size sm|default); Field ✓ wrapper  
  date ................ DatePickerField ✓ ({value: Date|undefined, onChange, id?, disabled?, fromYear?, toYear?}).  
                        It has no label/required/error props: wrap in Field with a visible "required" marker and
                        FieldError. Mobile may prefer the native date input [INFER]
  notes / comments .... Textarea ✓  
  text fields ......... Input ✓ (short text, number); choice list -> Select or RadioGroup by option count  
  banners ............. LocalBanner ✓ (warning for ST-08 block; error for send failure; success after send).  
                        No `emphasis` prop on LocalBanner (SystemBanner only)
  self-evaluation ..... the same form components as S-16 (RadioGroup for Yes/No and levels, Input number or  
                        RadioGroup for scores): one shared evaluation-form composition [INFER]
  grouped skill cards . Accordion ✓ or plain Field groups; "Incomplete" / "Complete" via StatusBadge ✓ semantic  
                        (size sm/md only)

## 9. Layout, content and behaviour

**Mobile-first [INFER].**
bottom sheet, one column, sticky footer with Cancel and Send request above the safe-area inset;  
per-skill detail groups collapsed after completion; targets >= 44px; no horizontal scroll.

**Behaviour contract.**
Decision table P-09 (`docs/ux/08`) is normative for this surface:

| # | Performed in | Placements for course | Setting control | Role options | Evaluator list |
|---|---|---|---|---|---|
| 1 | Clinical | exactly one | inferred, read-only with source text | skill allowed roles ∩ valid for clinical | recorded evaluators for the role |
| 2 | Clinical | several | Select "Setting, Location"; location recorded with it | as 1 | as 1 |
| 3 | Clinical | none recorded | Select from the program's full setting list; location optional [INFER] | as 1 | as 1 |
| 4 | Lab / Simulation | n/a | hidden | skill allowed roles ∩ valid for lab | lab instructor roster plus "Name someone not listed" (name + email) |
| 5 | any | any | any | empty set | blocking explanation (below) |

- `validForClinical` / `validForLab` is **data**, seeded from the prototype (Clinical: Preceptor, Clinical faculty; Lab: Clinical faculty, Lab instructor) and confirmed with Sankalp under proposed **OD-25** (related: OD-06). It is not hard-coded, and S-09 reads the same table to refuse unsatisfiable skill configurations (BL-1).
- **Mirror check (BL-1):** even though S-09 blocks unsatisfiable skills at save time, S-13 still handles an empty role set (row 5): the blocking banner names which skill and which constraint caused it ("{Skill} can only be signed off by {roles}, who cannot sign off clinical evidence. Choose Lab / Simulation or ask your program administrator."), never a dead end with no explanation.
- **Reset rule (fixes DEFECT-01):** changing performed-in, setting or role clears the person and dependent fields and re-validates. The confirmation shows the chosen person's actual role.
- **Blocked with reason (ST-08):** LocalBanner warning above the controls with an action "Switch to Clinical" (or Lab); Send request is disabled and the reason is the banner. For a batch, role options are the intersection; if empty but each skill has options alone, offer "Send these separately".
- **Unlisted lab instructor (ST-09, SL-09):** Name and Email fields, email validated on blur; request can be sent; admin later adopts the name in S-07.
- **Per-skill details (ST-10, SC-13):** each skill card shows the program-defined fields (label, type, mandatory) and one optional student note (ST-12, separate from evaluator comment). Mandatory fields are enforced before Send.
- **Self-evaluation (ST-11, SC-15) is completed BEFORE send inside this sheet** for skills configured for it (DEC-001, proposed): same criteria and form schema as the evaluator's (OD-09 seam); Send is disabled with a stated reason until complete. There is no post-send "pending self-evaluation" state unless OD-14 is accepted.
- **Send (non-blocking spinner, non-optimistic, P-14):** on success close the sheet and show the confirmation (below). On failure keep every answer, LocalBanner error: "Your request was not sent. Your answers are kept. Try again."
- **Confirmation (ST-13, fixes DEFECT-02):** names what was sent, to whom, in what role, in which setting and location ("Clinical (Outpatient Clinic) at Harbor Family Practice" or "Lab or simulation"). Appears in S-12 as a success LocalBanner and in the Waiting strip.
- **If OD-16 resolves to the evaluator-redoes branch, the student's "Revise and resend" action disappears from S-13/S-14 (only the banner copy is neutral today; the action already commits to the student-corrects branch, which is RV-01-backed).**
- **Modes:** *Revise and resend* (returned or not-yet-assessed, RV-01, RV-02): pre-filled from the previous submission, reviewer note shown at top, edited fields marked, primary = "Resend", evaluator changeable with the same constraints (RV-04). *Further attempt* (completed, did not meet criteria, RV-03): pre-selected skill, context copied but editable, line "Your previous attempt is kept and still shown in your history." Do not state whether the evaluator will see earlier answers (OD-08).
- **Dismissal:** with unsaved changes, Esc or close asks "Discard this request?" with the safe action focused (P-13, P-17 draft) [INFER].

## 10. States (L E Er V S Su D P Bl)

| State | Behaviour |
|---|---|
| L | Sheet opens immediately; placement and evaluator lists show Skeleton rows until loaded; controls disabled with `disabled` prop, not opacity |
| E | No evaluators recorded for the chosen role: "No {role} is recorded for this setting." plus, for lab, the Name and Email path; for clinical, text asking the student to choose another role [INFER] |
| Er | Lists failed to load: LocalBanner error with retry; send failure keeps answers |
| V | Inline FieldError on blur for required fields and email; a summary LocalBanner on a failed Send attempt lists the count; `aria-invalid` set; focus moves to the first invalid field |
| S | Send shows a pending state, sheet stays open, controls disabled |
| Su | Sheet closes; success banner and Waiting strip as above; focus returns to the Waiting strip heading [INFER] |
| D | Send disabled only with a visible reason; Save draft absent unless OD-14 |
| P | Several skills selected: each card shows Incomplete or Complete |
| Bl | ST-08 no valid role; skill deactivated while the sheet is open (OD-24): that skill is flagged unavailable and removed from the request on Send after a confirm |

## 11. Edge cases

EC-11 unmapped skill (allowed). EC-12 several locations (choose one per submission, OD-07). EC-13 no placement (full list). EC-14 role not allowed for setting (explain). EC-15 lab instructor not on roster (name + email). EC-16 misspelt twice (admin adopts later; no student-side dedupe required). EC-17 evaluator unavailable (Revise mode lets the student pick another). EC-18 further attempt after failure. EC-25 achieved skill requested again (allowed). Also: a skill with no required fields (Send enabled immediately), two skills with different allowed roles (intersection logic), student changes performed-in after typing details (details kept, setting/role/person reset).

## 12. Copy and interactions

Copy: `docs/ux/09` §5 "S-13", §3 (buttons, banners, validation template). Interactions: `docs/ux/08` P-09 (normative), P-10, P-14, P-13, P-17. Do not hard-code strings; add to `09` first. Do not label setting/location "per submission" or "per skill" in copy (OD-07).

## 13. Accessibility (WCAG 2.1 AA)

- Sheet: focus moves to the first field on open; Tab order header -> body -> footer; Esc closes (with dirty prompt); focus returns to the Send for review button.
- RadioGroup arrow-key behaviour; each required field has a programmatic label and an `aria-describedby` for helper and error text; the ST-08 banner is announced (role status / assertive per severity) and linked to the disabled Send via `aria-describedby`.
- Status ("Incomplete") is text plus shape, not colour only; targets >= 44px; no hover-only affordances; reduced-motion respected (P-16).
- Date control reachable and operable by keyboard; label states the format.

## 14. Out of scope

Reminders, notifications, escalation, remediation, expiry, patient-encounter linkage [REQ §14]. QR codes. Letting the student choose how a skill is evaluated. Free-text evaluator roles. Editing a completed evaluation (RV-03). Sending to an email that is not on the roster except the lab-instructor path (ST-09). Showing evaluator contact details.

## 15. Acceptance tests (Given / When / Then)

1. **ST-05** Given the sheet is open, When the student chooses Clinical or Lab / Simulation, Then the choice is recorded and the dependent controls update.
2. **ST-06 (single)** Given the student has one placement setting for the course, When Clinical is chosen, Then the setting is shown read-only with its source and location recorded.
3. **ST-06 (several)** Given two placements, When Clinical is chosen, Then a Select lists "Setting, Location" options and the chosen location is stored with the submission.
4. **ST-07** Given no placement is recorded, When Clinical is chosen, Then the Select lists the program's full clinical setting list and sending is possible.
5. **ST-08** Given Foley Catheter Insertion allows only Preceptor and Clinical faculty, When the student selects Lab, Then a warning explains why and offers "Switch to Clinical", and Send request is disabled.
6. **DEFECT-01 regression** Given Preceptor A. Whitfield is selected under Clinical, When the student switches to Lab, Then the person is cleared and the confirmation can never show a preceptor as another role.
7. **ST-09, SL-09** Given Lab instructor is chosen, When the student enters a name and email not on the roster, Then Send is possible, and S-07 later lists the name under "Named by students".
8. **ST-10, SC-13** Given a skill requires Completion date and Unit, When either is empty, Then Send is disabled with a stated reason and the field shows an error on blur.
9. **ST-11, SC-15, EV-04** Given a skill is configured for self-evaluation, When the sheet is open, Then the self-evaluation block uses the same criteria as the evaluator's form, Send stays disabled until complete, and the evaluator later sees the answers.
10. **ST-12** Given the student enters a note, When sent, Then exactly one student note is stored per submission item, separate from the evaluator's comment.
11. **ST-13** Given a successful Send, When the confirmation shows, Then it names skills, evaluator, role, setting and location.
12. **SC-16, EV-02** Given Wound Care permits only Preceptor, When the role control renders, Then no other role is offered.
13. **SL-08** Given an evaluator is a lab instructor without a Prism account, When chosen, Then no account is created and the request is addressed to their email.
14. **RV-01, RV-02** Given a returned submission, When the student opens Revise and resend, Then fields are pre-filled, the reviewer's reason is shown, and Resend continues the same record with the revision count increased.
15. **RV-03** Given a completed evaluation that did not meet the criteria, When the student makes a further attempt, Then a new record is created and the original is unchanged.
16. **RV-04** Given the original evaluator is unavailable, When the student changes evaluator in either mode, Then P-09 constraints apply to the new choice.
17. **RV-05** Given a counted or awaiting-approval submission, When the student looks for a way to edit it, Then no edit or resend action exists.
18. **OD-07 seam** Given a submission item is stored, When data is read, Then setting and location exist on the item, defaulted from the submission.
19. **P-14** Given a send failure, When the error shows, Then all answers are still present.
20. **ST-14 (OD-07 open)** Given a batch of 3 skills, When I choose setting and location once, Then each submission item stores that default, no copy claims per-skill capture, and the seam allows a per-skill override later.

## 16. Risks and unknowns (max 3)

1. Role-validity data (`validForClinical/Lab`) comes only from the prototype; REQ and OD-06 leave it open.
2. The bottom-sheet size contradiction and long forms (many skills) may need a full route on mobile.
3. Pre-send self-evaluation adds length to the sheet; if evaluators rarely use it, consider collapsing by default [INFER].

## 17. Vault notes consulted

`Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw: "student will rate themselves" before it goes to the instructor, lab technician workaround, lab instructors identified by email); `Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md` (evaluations are sent to whoever worked with the student that day, who may not be the main preceptor); `_Insights.md` skim; `Products/skills-checklist/personas.md` (empty placeholder).

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

None recorded in this draft beyond the fix-pass report.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Mobbin references (added 2026-10-08)

See `docs/research/meetings/2026-10-08-mobbin-remaining-surfaces.md` §M-6 and §M-11. Blocked option with visible reason and an alternative action (Workable) maps to ST-08; amber warning, not red. Consequence-first confirmations (Fresha).

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** Send for review is a 1024px DS Dialog (`?send=1&skills=<ids>`), not a bottom Sheet: Clinical / Lab pills, setting select ('Outpatient clinic — Harbor Family Practice'), role and person side by side, lab person list 'Name — email' plus 'Someone not listed…', per-skill detail cards, 'Skills in this request', footer Cancel and filled 'Send request'. Switching Clinical to Lab resets role and person (DEFECT-01, parity C-8). The sent banner names skills, evaluator, role, setting and location (C-9). Prototype icons (paper plane) are kept with `aria-hidden` (C-16).

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-11 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** ST-05..ST-14, ST-08 blocked-with-reason, ST-09, ST-10 (Send disabled with stated reason), pre-send self-evaluation (DEC-001), OD-07 once per submission with the per-skill seam, OD-14 not built (seam kept), 44px targets.

**Weakened or traded away (honest list):** A centred dialog replaces the mobile bottom sheet, so the 'scroll-safe bottom sheet' rule no longer applies; the 390px pass found no overflow and no target under 44px, but a long form scrolls inside the dialog. The workspace 'text-only action buttons' rule is overridden by the prototype icons (C-16).
