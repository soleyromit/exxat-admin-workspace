# V2-03c Evaluation version history and reopen (scenario step 9)

**Status:** Stage 3 contract. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              One evaluation with its versions: a v1, v2 timeline (who, when, why), what each version recorded, and for
                      staff the actions Reopen to edit and Confirm version N. Routes /v2/<admin|reviewer|director>/evaluation/<id>
                      and /v2/student/evaluation/<id>.                                                    Wave: V2 Stage 3
Persona(s) & role:    L. Haddad / A. Ross act; Maya reads her own evaluations (read-only, no concern, no actions).
Scope / data seen:    One evaluation: outcome, level, answers, feedback, attestation, versions. Staff also see a concern raised
                      with it and the plan it opened. The student sees neither the concern nor staff notes.
Job-to-be-done:       Correct a signed-off evaluation without losing the original, and let anyone entitled to see it understand
                      exactly what changed, who changed it and why.
Why -> So what:       "Completed evaluations are immutable" is a hard stop. Here an edit adds a version and the original stays
                      readable forever, so the record is trustworthy and a correction is not a cover-up.
Requirements:         RV-03 (a completed evaluation is a record and cannot be edited; the prototype's scope change adds a version
                      instead, see D2 and D27), RV-05 (counted or awaiting evidence cannot be edited: it is reopened and does
                      not count until the new version is confirmed), AE-01, AE-02 (the rule re-applies when the status changes),
                      SH-02, SH-07 (the student sees the completed evaluation, responses and feedback in full), RP-07 (viewable
                      in full), AR-04 (the reason is retained), AR-06 (reopened evidence is excluded from achievement)
Open decisions hit:   None decided. [PROPOSED] reopen with required reason; versions with detail; confirm version N as final;
                      who may reopen (administrator, reviewer, director). The requirements say "cannot be edited"; the original
                      stays intact here, which is how the prototype keeps the hard stop.
Prototype reference:  None for v2.
Pattern:              Header with outcome and status, then the timeline (newest first, "Current" on the latest), each entry a
                      Collapsible. Staff actions sit in the header. Reference: new-components-needed #8.
DS mapping:           PageFrame/StudentPage, Card, Collapsible, Badge/StatusBadge, Separator, Button, Dialog, RadioGroup,
                      Textarea, Field, LocalBanner -> IMPORT. Composition: version-history timeline (item 8, now built).
States:               L  Seed first. E  Unknown id: "This evaluation does not exist." Er Reopen refused: banner with reason.
                      V  Reopen needs a reason ("Say why you are reopening this evaluation. The reason stays on the record.")
                         and a change ("Change the outcome or the feedback, or cancel.").
                      S  Saved. Su "Version 2 added. The evaluation is reopened and does not count until you confirm it."
                      D  A version is never editable: no controls on past versions. P n/a. Bl Student opening another student's
                      evaluation: "This evaluation belongs to another student."
Edge cases:           Reopen allowed on counted, awaiting approval, not yet and already-reopened evaluations (adds version 3).
                      Not allowed on a returned evaluation. Confirm sets the status back to counted (or awaiting approval if the
                      skill holds evidence), and only then can a fail open a plan. The original v1 is byte-for-byte unchanged
                      after any number of reopens (tested). Seed has one reopened evaluation (stu-03).
Copy:                 "Reopen to edit", dialog "Reopen this evaluation?", fields "New outcome", "Feedback (optional change)",
                      "Reason for the change", buttons "Reopen and add version 2", "Keep as it is". "Confirm version 2 as final".
                      Timeline: "Version 2, Oct 19, by L. Haddad. Reason: ...". Student note: "Earlier versions are kept as they
                      were."
A11y:                 Timeline is an ordered list; each version heading is an h3; Collapsible triggers have aria-expanded;
                      dialog focus management by the DS; outcome is text plus icon.
Out of scope:         Diff highlighting between versions, evaluator co-sign of a reopened version, notification to the student.
Acceptance tests:     tests/v2/outcomes.test.ts: reopen adds a version and keeps v1 deeply equal; requires reason and a change;
                      status reopened and excluded from progress; confirm restores counting; confirm of a fail opens a plan;
                      returned refused; audit entries who/when/why. Browser: staff reopen, student sees v2 in history and detail.
Risks / unknowns:     Who may reopen is an invention; confirm with Sankalp.
Vault notes consulted:Same as V2-02a.
```
