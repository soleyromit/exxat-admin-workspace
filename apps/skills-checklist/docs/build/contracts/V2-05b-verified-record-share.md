# V2-05b Maya's verified record: view, PDF and CLR 2.0 (scenario step 13)

**Status:** Stage 5 contract. Narrows `00-cross-cutting.md`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              The student's shareable record. Route /v2/student/verified-record, linked from Your record
                      (/v2/student/history). On a phone. Shows what is included and what is not, then two downloads: PDF
                      and CLR 2.0 JSON.                                                          Wave: V2 Stage 5
Persona(s) & role:    Maya Ferreira (student). Her own record only.
Scope / data seen:    The latest program verification (V2-04b) and the evaluations it rests on. Nothing else.
Job-to-be-done:       Hand a future employer or another program a record that the program stands behind, knowing exactly
                      what it says and what it leaves out.
Why -> So what:       A record Maya can share is only trusted if it cannot contain more than the program verified. Showing
                      the exclusions before she shares stops "I did not know that was in it" and stops unverified work
                      leaving the program under the program's name.
Requirements:         SH-01 (evaluations in order, by attempt), SH-06 (evidence across courses; every v2 evaluation is NURS
                      350), SH-07 (the completed evaluation in full is reachable from the record; the shared copy carries the
                      outcome, evaluator, date and setting, not the free-text feedback), RP-10 (a record export that states
                      what produced it), AE-01
Open decisions hit:   Whether feedback text may leave the program is not a requirement and not decided; v2 leaves it out and
                      says so (raised as an open question). OD-10 is not touched.
[PROPOSED]:           Student-shareable verified record; PDF with the same tamper-evident block as V2-05a; CLR 2.0 JSON
                      (1EdTech Comprehensive Learner Record v2.0 shape, unsigned); the "included / not included" panel;
                      sharing blocked unless the record is verified and unchanged.
Prototype reference:  None for v2.
Pattern:              One column: status card, "Included" list by skill, "Not included" list with a reason each, then the two
                      download buttons. Disabled downloads show their reason above them, not in a tooltip.
DS mapping:           StudentPage/Block, Card, StatusBadge, Button, LocalBanner -> IMPORT. Composition: included/excluded
                      list rows (new-components-needed.md).
States:               L  Seed first. E  Not verified: "Your program director has not verified your record yet. Nothing can be
                      shared until they do." with a link back to Your record. Er  Changed since verified: sharing is off and
                      the reason names the change. S  "Verified record downloaded" announced politely, with the file name and
                      the first 12 characters of the hash. D  Both downloads disabled with the reason visible.
                      P  A verified record with no achieved skill is shareable and says "No skill is achieved yet".
Edge cases:           Included = Met evaluations in the latest verification, still counted at the version verified, for skills
                      that were achieved when it was verified. Excluded,
                      each with a reason: skills not achieved at verification (partial progress is not shared); outcomes that were not Met or
                      Not yet (private history); Met evaluations of skills not achieved; evaluations counted after
                      the verification; evaluations changed since (reopened or a new version); evaluations waiting for
                      approval; skills not achieved at verification; your self-ratings and notes; evaluator feedback text;
                      anything a faculty member flagged in confidence (the existence of a flag is never stated). Excluded
                      concerns are not counted anywhere on this page.
Copy:                 "Share your verified record". "Download PDF". "Download CLR 2.0 file". "This record was verified by Dr.
                      K. Brennan on Oct 20, version 1." "CLR 2.0 file: unsigned. It lists what the program verified. A
                      receiving system will not treat it as a verifiable credential until the program signs it."
A11y:                 Lists are lists; status is text plus icon; 44 px targets; downloads are real buttons (not links to
                      data URLs without a name); phone width first.
Out of scope:         A public verification URL, sharing by email from the app, selecting which skills to share, expiry or
                      revocation, a signed CLR (proof block).
Acceptance tests:     tests/v2/record.test.ts (included/excluded rules, concerns never present, CLR shape, PDF verifies, JSON
                      has no feedback, no self-rating and no concern text). Browser: docs/v2/verify/stage5.e2e.mjs.
Risks / unknowns:     CLR is a minimal conformant shape; no external validator was run. Leaving out failed attempts is my
                      choice [INFER] and a program may want the opposite.
Vault notes consulted:Same as V2-02a.
```
