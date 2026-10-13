# Design Contract: S-03 Evidence ledger and evaluation detail

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Tags: `[REQ id]` · `[OD-n]` · `[PROTO]` (illustration only) · `[CALL 09-23]` · `[CALL 03-05]` · `[INFER]`. Precedence REQ > CALL > PROTO > INFER.

Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08


## 1. Surface and wave

**Surface.**
S-03 Evidence ledger (rail level 3) and evaluation detail (rail level 4); read-only   Wave: W5 (ledger and detail); the student-side link target is delivered with W3 (S-14 "View evaluation")

## 2. Persona and RBAC

P-A Program administrator and P-R reviewer (same admin role) read any in-scope evaluation. P-S Student reads only their own evaluations through S-14, reusing this detail component [REQ SH-07]. RBAC: Super Program Admin, own program only; Student, "own compliance items, own placements ... zero peer visibility" [exxat-domain-context RBAC table].

## 3. Scope and data seen

Admin: every evaluation recorded for the student/skill in scope: date, clinical vs lab, clinical setting, location, evaluator and role, recorded outcome, result, student-supplied fields, every question and response, score per question, evaluator comment, student note, self-evaluation (if any), review note (if any) [REQ RP-07, AR-04].  
Student: own evaluations only; the review note is shown only where it is the reason a submission was returned [REQ RV-02], decided in S-14 contract, not here.  
Must NOT show: any other student's evaluation; evaluator contact details (email) to students; achievement status of other skills.

## 4. Job to be done and why

**Job-to-be-done.**
When I need to defend or question a number, I want to read the actual evaluation (every response, comment and detail), so I can trust the record rather than a summary like "9 of 12 answered Yes".

**Why → So what.**
Why: "Evidence of outcomes — retaining the evaluations that support an achievement, not only the final status" [REQ §1.2]; RP-07 forbids summary-only. So what: an accreditor, a student or a reviewer can read what the preceptor actually recorded and why it did or did not count [journeys/01 moment of truth 4; journeys/02 stage 7].

## 5. Requirements and open decisions

**Requirements.**
RP-06, RP-07, RP-08, AR-03, AR-04 (note retained and visible), AR-06 (pending is listed but not counted), SH-07, RV-03 (completed evaluations immutable, no edit control exists), RV-05 (counted or awaiting approval: no edit or resend), AE-02 (result column reads the skill's CURRENT rule), AE-06 (labels and question text are presentation, read live), SC-12 (lab shown separately), SH-03 (failed-rule sentence for evaluations that did not qualify, same generator as S-14).

**Open decisions hit.**
OD-17 (does an evaluator see the student's achievement status) is NOT decided here; it concerns S-16. OD-11: the ledger has Evaluator and Location columns because they are evidence attributes the REQ requires AR-01 to show for approvals; it builds no evaluator-level or site-level aggregate. OD-08 (corrected submission: previous answers prefilled?): the detail shows the stored evaluation snapshot only; revisions are separate snapshots. OD-16: when an evaluation was returned, the detail states "Returned for correction" without saying who corrects.

## 6. Prototype reference (keep / do not copy)

docs/source/screens/06 (ledger), 07 (evaluation detail), 20 (student history card, for the S-14 link).  
KEEP [PROTO 06, 07]: ledger columns (date, setting, location, evaluator + role, recorded, result), per-level strip above the ledger, "Supplied by the student" block, responses with the scale rendered, comment.  
DO NOT COPY: "View form" opening a dialog over the rail (stack it as the next level instead); location printed under the setting in one cell (separate sortable column); "Counted" as the only result vocabulary (decision N-3: same word as SH-02; the prototype's "Counts as evidence" is not carried over) (also needs "Did not meet criteria", "Waiting for approval", "Returned").

## 7. Pattern and reference hub

Two stacked levels inside the S-02 rail: ledger as a DataTable, evaluation detail as a read-only definition list; breadcrumb in the rail `Student › Skill › Evaluation {date}` (docs/ux/08 P-07). Deep-linkable evaluation URL [INFER]. Read-only record pattern (P-11).  
Reference hubs in repo (read): apps/pce/admin/components/pce/evaluation-card-sheet.tsx (evaluation inspector in a sheet); apps/pce/admin/app/(app)/results/[id]/page.tsx (FloatingSheetPanel for "View all responses"); apps/pce/admin/app/(app)/admin/students/[id]/page.tsx (DataTable inside a student record). PCE uses a local vendored DataTable; workspace rule says import the DS DataTable — verdict pending ds-adoption-reviewer.

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** C-14 evidence ledger is a `DataTable` column configuration (IMPORT), not a component file. C-15 is one `LocalBanner variant="warning"` use. C-13 per-level strip is HAND-ROLL. `FloatingSheetPanel` IMPORT.


Verified with `node tools/ds/source.mjs` 1.5.1 (name-diffed to PCE 1.6.5; prop drift not diffed).  
FloatingSheetPanel ✓ / FloatingSheetPanelBody (IMPORT) · DataTable ✓ (ledger; IMPORT, never raw table) · Breadcrumb ✓ · StatusBadge ✓ semantic (result; size sm|md) · Badge ✓ (per-level strip, role chips) · Accordion ✓ / Collapsible ✓ (per-question responses when there are many) · LocalBanner ✓ (failed-rule sentence, variant warning) · Field ✓ or plain definition list for read-only label/value pairs · Textarea NOT used (read-only text) · Skeleton ✓ · Button ✓ (ghost "Show all evidence", Close) · Tooltip ✓.  
Custom: C-13 per-level strip (HAND-ROLL, one file). C-14 evidence ledger is a DataTable column config and C-15 is one LocalBanner use: neither is a component file (ds-adoption-reviewer).

## 9. Layout, content and behaviour

See the wireframe for S-03 in docs/ux/07 and the sections around this one; no additional layout rules were drafted.

## 10. States (L E Er V S Su D P Bl)

L   Ledger skeleton rows under the skill header; detail level shows labelled skeleton lines, never a spinner only.  
E   Skill has no evidence: "No evidence has been recorded for this skill yet." Filter-caused empty: "No evidence matches the location or setting filter. Show all evidence." with a control (RP-08). These two are distinct messages (docs/strategy/06 edge case RP-09 logic).  
Er  Error loading ledger or one evaluation: LocalBanner error with Try again inside the rail; the previous level stays reachable (P-17).  
V   n/a (read-only).  
S   n/a (no writes; student-side reuse is also read-only).  
Su  n/a.  
D   No controls that change data exist at all (RV-03). "Show all evidence" disabled when no filter is active.  
P   Result column shows "Waiting for approval" for held evidence and excludes it from the header count (AR-06). Returned items show "Returned". A rule change in progress shows "Recalculating" on the result.  
Bl  An evaluation that no longer qualifies under the current rule is still shown with the reason in plain language (AE-02); the reason text comes from the live rule, not from stored text.

## 11. Edge cases

EC-5 (lab vs clinical setting shown distinctly), EC-6 (rule edited: result column updates), EC-7 (renamed question: old answers stay under the new text), EC-8 (removed level: response is retained and displayed with the label it had, marked "level removed" [INFER]), EC-18 (completed but did not meet: further attempt is a separate record), EC-19 and EC-20 (returned / awaiting approval: listed, not counted), EC-23 (location/setting filter: ledger says so and offers "Show all evidence").

## 12. Copy and interactions

**Copy.**
docs/ux/09 §5 S-03 (ledger heading, level breakdown, columns, result values, detail sections, "No comment was recorded"), §6 (held vs counts-now wording), §7 (failed-rule generator: evaluation-level 7.1 and skill-level 7.2). Never show the word "failed"; never colour text red.

**Interactions.**
docs/ux/08 P-07 (stacked levels, URL state, Show all evidence), P-11 (locked states, immutability), P-12 (compare layout reused on S-11), P-18 (explaining outcomes), P-14, P-17.

## 13. Accessibility (WCAG 2.1 AA)

Table caption "Evidence for {skill}"; columns sortable with `aria-sort`; each "View evaluation" link has an accessible name including date and evaluator; detail is a `<dl>` pairing each question with its response, text not colour; Yes/No and level responses shown as text ("Independent"), not as disabled radio controls with colour only (the prototype shows disabled radios; text is clearer for screen readers) [INFER]. Rail focus and Esc behaviour as S-02 (one level per Esc). Axe on ledger, detail, empty and filtered-empty states.

## 14. Out of scope

Editing, correcting or deleting an evaluation (RV-03 forbids editing; deletion is not specified by REQ and is not designed [INFER]); downloading a single evaluation as PDF (RP-10 defines only the two exports); comparing evaluators; evaluator-consistency or site-quality analytics (OD-11, CALL 09-23 phase 2); notifications or reminders; remediation; patient-encounter linkage; Evaluations module migration (all REQ §14).

## 15. Acceptance tests (Given / When / Then)

RP-06   Given a skill row in S-02, When I open its evidence, Then I see the ledger in the same rail without a new search and the S-01 table is untouched.  
RP-07   Given an evaluation of a Question-Level skill with 12 questions, When I open it, Then every question and its Yes/No answer is visible, not only "9 of 12 answered Yes"; for a scored skill every score is visible; the evaluator comment and the student-supplied fields (date, unit, note) are visible.  
RP-08   Given Overview has Setting = Inpatient, When I open the ledger, Then only Inpatient rows are listed, the header says counts reflect that filter, and "Show all evidence" lists all rows without changing the table behind.  
AR-03   Given an evaluation held for approval, When I open it, Then the full set of responses is visible (not a summary).  
AR-04   Given a review note exists, When I open the evaluation, Then the note is shown with the evaluation.  
AR-06   Given 2 evaluations awaiting approval, When I view the header, Then they are listed as "Waiting for approval" and are not included in the achieved count.  
RV-03   Given a completed evaluation, When I inspect the detail, Then there is no edit, resend or delete control anywhere on it.  
RV-05   Given an evaluation that counted, When I view it, Then no edit or resend control exists.  
SH-07   Given I am the student, When I follow View evaluation from S-14, Then I see my evaluator's responses and feedback in full and no other student's data.  
AE-02   Given a skill's rule is changed so an old evaluation no longer qualifies, When I open the ledger, Then its result changes to "Did not meet criteria" with a plain-language reason built from the current rule, and the stored responses are unchanged.  
AE-06   Given a question is renamed, When I open an old evaluation, Then the new text appears against the original answer and the result is unchanged.  
SH-03   Given an evaluation that did not meet a question-level rule "at least 9 of 12 Yes" with 7 Yes, When I open it, Then the page says "7 of 12 questions were answered Yes. At least 9 were needed." (docs/ux/09 §7.1).  
SC-12   Given a lab evaluation in the ledger, When I view its Setting, Then it reads "Lab or simulation" and is not attributed to a clinical setting.
AR-01   Given an evaluation that has passed administrator review, When I open its detail, Then it shows student, skill, course, setting, location, evaluator, role and review state (the queue itself is tested in S-11).

## 16. Risks and unknowns (max 3)

(1) Stacked rail levels plus URL state is intricate to build and test; mistakes will lose context (the thing RP-05/06 exist to prevent). (2) The display of a response after a level is removed or a question renamed (AE-06/AE-07 cascade) is partly [INFER]; REQ states only that references are removed from rules, not how old answers are labelled. (3) Student-side reuse (SH-07) could leak the review note or evaluator email if the component is shared without a role prop; role-scoped fields must be enforced server-side, not by hiding.

## 17. Vault notes consulted

Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md (raw; "the system captures the final: preceptor has rated"; admin may review before the score counts); Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md (student maintains ownership and visibility of their complete portfolio; evaluations sent to whoever worked with the student); _Insights.md (searched; no further note specific to evidence detail).

## 18. Open questions for Romit

should the admin see the student's own self-evaluation text in the detail by default or only on request ("See self-evaluation")? REQ AR-02 requires side-by-side only in the approval view. Proposal [INFER]: show it in the detail, labelled, because the evaluator is shown it too (EV-04).

## 19. Contradictions found / review log

None recorded in this draft beyond the fix-pass report.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** The evidence ledger sits inside the skill view of the drill-down dialog (levels breakdown, then a table: Date, Setting, Evaluator, Recorded, Result). 'View form' opens the evaluation as a 1024px dialog with the supplied details, responses, comment and review note. The title keeps the prototype string with its em-dash (`IV Insertion — Noah Zeller`). Result wording is the prototype's `Counts as evidence` (this contract and `docs/ux/09` said `Counted`). Evaluator comments render under the Recorded cell because the DS table cannot render a full-width row.

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-02, P-03 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** RP-06, RP-07 (full responses, not a summary), RV-03/RV-05 immutability (read-only), AR-03/AR-04, OD-11 (no evaluator analytics), no evaluator contact details.

**Weakened or traded away (honest list):** Ledger column order differs from the contract's (date is the control that opens the evaluation); the result label `Counts as evidence` vs the submission outcome `Counted` is now a deliberate prototype wording split; comment placement is a layout compromise, not a requirement.
