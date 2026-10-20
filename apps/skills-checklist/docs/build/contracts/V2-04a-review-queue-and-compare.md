# V2-04a Review queue, compare view, return, paper form, reassign (scenario step 10)

**Status:** Stage 4 contract. Narrows `00-cross-cutting.md`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              (1) Review queue: three tabs (Awaiting review, Stalled, Returned to students) over the DS DataTable with
                      row selection and a bulk bar. Routes /v2/reviewer/review-queue (scenario step 10) and
                      /v2/admin/review-queue.
                      (2) Review item: compare view, paper-form outcome entry, approve, return. Route
                      /v2/<admin|reviewer>/review-queue/<submission id or evaluation id>.
                      (3) Student side of a return: the reason, what to fix, and a way to send it again, on the existing
                      /v2/student, /v2/student/request-signoff and /v2/student/history screens.        Wave: V2 Stage 4
Persona(s) & role:    A. Ross (administrator) and L. Haddad (clinical coordinator, reviewer) act on the queue. Maya Ferreira
                      (student) sees the result of a return. Evaluators have no screen here (EV-01, no account).
Scope / data seen:    Staff: every item awaiting review for NURS 350. The student sees only her own returned items and the
                      reason. Confidential concerns stay on the staff evaluation page and are never shown in the queue,
                      the compare view or any student screen.
Job-to-be-done:       Clear what is waiting without opening every item twice: approve what is fine in one confirmed action,
                      look closely at what is not, send back with a reason the student can act on, and un-stick a request
                      whose evaluator has gone quiet.
Why -> So what:       Evidence awaiting approval does not count (AR-06). Every day an item sits is a day a student's progress
                      is understated and a clinical placement may end without the sign-off. A return with no reason is the
                      commonest source of repeat work; a required reason that names the fix removes it.
Requirements:         AR-01 (every item awaiting approval with student, skill, course, setting, location, evaluator and role),
                      AR-02 (self-rating and evaluator side by side, whether they agreed), AR-03 (full responses, not a
                      summary), AR-04 (a reviewer note kept with the evaluation), AR-05 (approve = counts; return = goes back
                      and does not count), AR-06 (excluded from progress until approved), RV-01 (student can correct and
                      resend a returned submission), RV-02 (the correction continues the same record; revision count and
                      return reason kept), RV-03 (a completed evaluation is never edited; a returned one is a new pass, the
                      original stays), RV-04 (a stalled request can go to a different evaluator), RV-05 (an item awaiting
                      approval or counted cannot be edited or resent), SH-02 (explicit outcome and who it is with), EV-02
                      (evaluator role is shown), SC-12 (lab and simulation evidence never satisfies a clinical setting; the
                      compare view states the setting)
Open decisions hit:   OD-08 (does a correction clear the evaluator's earlier answers?). NOT decided here: a resend keeps the
                      returned evaluation as history and asks for a new pass; nothing is edited in place.
[PROPOSED]:           Bulk approve with one confirm that names the count; per-item blocked reason while the rest go through;
                      paper-form outcome entry by the reviewer on the evaluator's behalf, source recorded as paper form;
                      reassign a stalled request with a reason and an audit entry; return reason split into why and what to
                      do next; Returned tab; student "Send again" on a returned request.
Prototype reference:  None for v2 (the Sankalp prototype has no queue).
Pattern:              Tabs over DS DataTable with the built-in selection and bulk bar (Linear/Gmail-style bulk with a named
                      count, reference: mobbin-evidence "bulk action confirm"). Detail: two columns on desktop, stacked on a
                      phone; the decision bar sits at the end of the page, not floating over content on a phone.
DS mapping:           PageFrame/PageSection, Tabs, DataTable (selectable, bulkActionsSlot) via a local wrapper, Card,
                      StatusBadge, Dialog, Field/FieldLabel/FieldError, Textarea, RadioGroup, Checkbox, LocalBanner, Button,
                      Collapsible -> IMPORT. Composition (new-components-needed.md): photo placeholder, compare pair.
States:               L  Seed first, no spinner (loading-free: the store is local). A "Opening the queue" status line shows
                      only before the saved state loads.
                      E  Awaiting review empty: "Nothing is waiting for review. New evaluations and photos of paper forms
                      appear here." Stalled empty: "No stalled requests." Returned empty: "Nothing is out with a student."
                      Er Store refusal and every blocked action as LocalBanner error with what to do. Unknown item id:
                      "This item is not in the queue" with a link back (it may already be approved).
                      V  Return needs a reason: "Say what is wrong and what to change. The student reads this." Paper-form
                      entry validates like the preceptor form (outcome, level, questions, required feedback).
                      S  Approve and return confirmed in a polite live region plus banner; counts on the queue update.
                      Su Bulk: "Approved 3 submissions (5 evaluations). They now count toward the students' records."
                      D  Approve disabled with the reason while an item still needs its outcome entered.
                      P  Partial failure: "Approved 2 of 3. 1 stays in the queue: Priya Raman, Point-of-care blood glucose:
                      enter the outcome from the paper form first." The confirm dialog names the blocked item BEFORE confirm.
                      Bl Not allowed: only staff act; a student or a preceptor has no route here.
Edge cases:           A photo item has no evaluation until the reviewer enters it, then the evaluations wait for approval
                      like any other. A paper item cannot be approved while any skill lacks an outcome or the signer is not
                      qualified for a skill. An evaluation without a request (older seed) is reviewed on its own. Approving
                      a not-met opens a remediation plan only when the skill's failure path says so and none is open.
                      Returning a submission returns every evaluation in it. Returning twice appends to the return history;
                      the revision count rises on each resend. Reassign: only a stalled request, only to someone qualified
                      for EVERY skill in it and not the current assignee, with an optional reason; the request goes back to
                      "with evaluator" and the student reads the new name. After a reassign the old link no longer opens for
                      the previous person (candidates are replaced).
Copy:                 Tabs "Awaiting review (3)", "Stalled (1)", "Returned to students (0)". Bulk bar button "Approve 3
                      submissions" opens "Approve 3 submissions?" with the buttons "Approve 3 submissions" and "Keep in
                      queue". Return dialog "Return to the student?" field "What is wrong, and what should the student
                      change?" buttons "Return to student" and "Keep in review". Reassign dialog "Reassign this request?"
                      buttons "Reassign to M. Castillo, RN" and "Keep with J. Delgado, RN". Paper-form button "Record outcome
                      from the paper form".
A11y:                 DataTable checkboxes have names ("Select Priya Raman, Oral medication administration"); the bulk bar is
                      a live region; dialogs trap and return focus; error text is linked with aria-describedby; compare
                      columns are a labelled description list per side; agreement is a word plus icon, never colour alone;
                      the photo placeholder has a text alternative; phone targets use the 44 px token.
Out of scope:         Real image storage or zoom (only file name and size are kept), reviewer assignment rules, escalation
                      and reminders, bulk return, editing an evaluator's answers, notifications.
Acceptance tests:     tests/v2/queue.test.ts: queue lists awaiting evaluations and photo requests, not stalled or done; approve
                      counts the evaluation, moves progress, closes the request and audits; bulk approve with one blocked
                      item approves the others and names the blocked one and why; return needs a reason, marks evaluations
                      returned, student reads reason and next step; resend of a photo needs a new photo and bumps the revision
                      count; paper outcome entry creates awaiting evaluations with source paper form and the typed-by person;
                      reassign changes assignee, resets waiting, audits, refuses non-stalled and unqualified;
                      compare reports agreed, differed and not comparable. Browser: docs/v2/verify/stage4.e2e.mjs.
Risks / unknowns:     Seeded evaluations hold only the outcome, so the compare view shows what is stored and says the rest
                      was not recorded. Course, location and role in AR-01 are derived from the placement and the person.
Vault notes consulted:Same as V2-02a.
```
