# V2-04b Director verification of a student's record (scenario step 11)

**Status:** Stage 4 contract. Narrows `00-cross-cutting.md`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              (1) Verification list: every student with their status. Route /v2/director/director-verification.
                      (2) One student's record to verify, with the verification history. Route
                      /v2/<director|admin|reviewer>/verification/<student id> (only the director acts).
                      (3) The result on the student's record (/v2/student/history) and as report data (selector
                      verificationRows, read by the Stage 5 reports).                                  Wave: V2 Stage 4
Persona(s) & role:    Dr. K. Brennan (program director) verifies. A. Ross and L. Haddad read. Maya Ferreira sees her own
                      status. No other student record is visible to her.
Scope / data seen:    A student's counted evaluations by skill, the mandatory skills achieved against the course, anything
                      still pending (awaiting approval, reopened, returned, open requests). Confidential concerns are never
                      part of a verification or shown to the student.
Job-to-be-done:       Put a name and a date on "this student's record is complete and correct" before it leaves the program,
                      knowing exactly which evidence it rests on.
Why -> So what:       A shared record is only as good as the last person who checked it. If a verified record can be edited
                      silently, the signature means nothing. Immutable versions make the signature a fact.
Requirements:         AE-01 (only completed evidence counts), AE-02 (the current rule decides what qualifies), AE-03 (a skill
                      is achieved only when every criterion is met), RP-07 (each evaluation is viewable in full from the
                      record), RV-03 (a completed evaluation is never edited; a later change is a new version through the
                      reopen flow), SH-02 (explicit status)
Open decisions hit:   None decided. Whether a record with unmet mandatory skills may be verified at all is NOT a requirement:
                      the prototype allows it and states the gap in the confirmation. Raised as an open question.
[PROPOSED]:           Program director verification (REQ section 14 is out of scope for production, D2 allows it here);
                      verification as immutable numbered versions; "changed since verified" when a verified evaluation is
                      reopened; verification columns in report data; status on the student record.
Prototype reference:  None for v2.
Pattern:              List: DS DataTable with a status badge column. Record: facts card, skill rows with their evidence, a
                      blocker banner or a confirm form, then the version history as an ordered list.
DS mapping:           PageFrame/PageSection, DataTable via V2Grid, Card, StatusBadge, Checkbox, Textarea, Field, Button,
                      LocalBanner, Dialog (confirm) -> IMPORT. Composition: verification history list (new-components-needed.md).
States:               L  Seed first. E  No students: "No students are enrolled in this course." No verification yet: "Not
                      verified yet." Er Blocked verification as LocalBanner with each reason and the fix. V  Confirmation
                      checkbox and note limit. S  "Verified" announced politely. Su Banner "Maya Ferreira's record is
                      verified, version 1." D  Verify disabled with the reason visible. P  A record with gaps can be verified;
                      the dialog lists the unmet mandatory skills. Bl Only the director can verify: other roles see the
                      status and a line that says so.
Edge cases:           Verify is refused while the student has an evaluation awaiting approval, reopened or returned, or an
                      open request. Verify is refused when nothing counted exists. Verifying an unchanged, already verified
                      record is refused ("Already verified as version 1, nothing has changed"). Reopening a verified
                      evaluation never edits the verification; it marks the record "Changed since verified" and the next
                      verification is version n+1. Older versions stay listed, read-only. New evidence added after a
                      verification is counted and shown ("2 evaluations are not part of version 1") without changing the status.
Copy:                 Statuses "Not verified", "Verified, version 2", "Changed since verified". Button "Verify Maya Ferreira's
                      record". Checkbox "I reviewed this student's evidence and the gaps listed above." Student: "Verified by
                      Dr. K. Brennan on Oct 20, version 1."
A11y:                 Status is text plus icon; the form errors link to fields; the history is an ordered list; the confirm
                      dialog traps focus.
Out of scope:         Signed PDF, CLR 2.0 export and student sharing (Stage 5), revoking a verification, multiple directors,
                      verification of a single skill, comments on a verification.
Acceptance tests:     tests/v2/verification.test.ts: only the director can verify; blockers refuse with reasons; confirmation
                      required; version 1 stores who, when, note and the evidence versions; a second verify of an unchanged
                      record is refused; reopening a verified evaluation marks changed and a new verification is version 2
                      with version 1 untouched; rows for reports. Browser: docs/v2/verify/stage4.e2e.mjs.
Risks / unknowns:     "Completed record" is read as "nothing pending", not "every mandatory skill achieved" [INFER].
Vault notes consulted:Same as V2-02a.
```
