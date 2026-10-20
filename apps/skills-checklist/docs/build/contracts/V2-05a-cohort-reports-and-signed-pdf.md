# V2-05a Cohort reports and signed PDF (scenario step 12)

**Status:** Stage 5 contract. Narrows `00-cross-cutting.md`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              Reports. Route /v2/admin/reports (scenario step 12) and /v2/director/reports (same screen, director's
                      home). Five views in tabs from 768 px (a Select named Report view below that,
                      because five tabs do not fit a phone): Heatmap, Behind pace, Skills and raters, Rater comparison, Student table.
                      Beside them: applied filters, a signed-document panel (download a PDF for one student or for the
                      cohort) and a document checker (choose a PDF, the page says whether it is unchanged).   Wave: V2 Stage 5
Persona(s) & role:    A. Ross (program administrator) and Dr. K. Brennan (program director). L. Haddad (reviewer) may read.
                      Students never see this screen. Preceptors and lab instructors never see it.
Scope / data seen:    Counted evaluations of the course cohort, by skill and student. Evaluations awaiting approval are
                      excluded (AR-06). Confidential concerns are never read by any report or PDF.
Job-to-be-done:       See at a glance which students are behind, which skills rest on one person's judgement, and where
                      simulation carries too much of the evidence, then open the evidence behind any number.
Why -> So what:       A cohort figure that cannot be traced to evidence is a claim, not a record. A skill signed off by one
                      evaluator, or mostly in simulation, is a weaker claim than its count says. The report makes that
                      visible before accreditation or a student's progression decision relies on it.
Requirements:         RP-01 (filters: course, category, setting, named clinical setting; applied filters shown and removable
                      one by one; cohort and group are one value in v2; tag and location are not built), RP-02 (per
                      student: achieved, in progress, not met), RP-03 (per skill, with mandatory shown), RP-05 (every
                      aggregate links to the individuals), RP-06 (a student or skill reaches its evidence without a new
                      search), RP-07 (an evaluation opens in full), RP-08 (a setting filter counts only the evidence from
                      there and progress is recalculated), RP-09 (a filter pair that cannot produce evidence is
                      explained), RP-10 (the PDF records the filters that produced it; CSV or Excel is OD-10, not built),
                      AE-01 (counted evidence only), AE-03 (achievement per skill rule), AR-06, SC-12
Open decisions hit:   OD-10 (export format) is not decided: the PDF is a document, not the exportable detail RP-10 asks for.
                      "Expected pace" is NOT a requirement: see [PROPOSED].
[PROPOSED]:           Cohort heatmap with a sequential scale and a text symbol in every cell; "behind pace" against a term
                      clock (term Aug 24 to Dec 11, 2026 [INFER], expected = floor(mandatory skills x share of term gone));
                      single-rater flag (a skill whose counted evidence has one evaluator); rater comparison (volume and
                      met rate per rater, with a caution under 5 evaluations); simulation share per skill; tamper-evident
                      PDF per student and per cohort; a document checker.
Prototype reference:  None for v2 (the Prism prototype has no reports).
Pattern:              Header with applied filters and summary figures, then tabs. Heatmap is a DS Table (real table, row and
                      column headers); every other list is the DS DataTable (V2Grid). The Student table tab is the
                      accessible alternative to the heatmap: one row per student and skill, in words.
DS mapping:           PageFrame/PageSection, Tabs, Select, Checkbox, Card, StatusBadge, Button, LocalBanner, Table
                      (heatmap, static matrix) and DataTable via V2Grid, Field/Label -> IMPORT. Composition: heatmap
                      cell, filter chip row (new-components-needed.md). PDF writer and hash: lib/v2/pdf.ts (no library).
States:               L  Seed first, "Opening the reports" before hydration. E  No student matches: "No student has evidence
                      for these filters." Er  Document checker: not a signed PDF / changed / valid, each as LocalBanner.
                      V  Select values only from lists. S  Download announces "Cohort report downloaded, N pages" politely.
                      D  Download disabled with the reason when the cohort is empty. P  Filters narrow every view and the
                      PDF. Bl  Student role is redirected to its home by the role switcher; the page states who may read it.
Edge cases:           Setting filter lab or simulation with a named clinical setting filter -> RP-09 banner that says no
                      lab or simulation evidence can carry a clinical setting (SC-12), with a button "Clear the setting
                      filter". Filters that match no evidence show a count of zero and the empty text, not a blank grid. A
                      student with no mandatory skills open: pace "Not applicable". A rater with fewer than 5 evaluations is
                      shown with "Small numbers, read with care" in the comparison. Verification columns come from
                      verificationRows, so a record "Changed since verified" reads that way in the table and the PDF.
Copy:                 Sequential scale legend "Not started, some, half or more, achieved". Cell text: "Achieved", "2 of 4",
                      "Not started", "Not met" (a skill with only unmet attempts). Single-rater: "One evaluator". Buttons:
                      "Download cohort PDF", "Download PDF for Maya Ferreira", "Check a PDF", "Clear filters", "Remove filter
                      Category: Assessment". Signature text: "What the signature proves: this file has not changed since
                      it was made here. It does not prove who made it. This prototype signs with a demo key that ships with
                      the page, so anyone can recompute it; a real deployment signs with the program's private key."
A11y:                 The heatmap is a table with scoped headers; colour is never the only carrier (symbol + words in every
                      cell); no red; focus ring on every link; tabs by arrow keys; tables scroll in a labelled keyboard-
                      reachable region (DS Table scrollLabel); at 390 px the tables scroll horizontally inside their region
                      and nothing else scrolls sideways.
Out of scope:         Tag and location filters, attainment by tag (RP-04), CSV or Excel (RP-11, OD-10), scheduled or emailed
                      reports, a real private-key signature, trend over time.
Acceptance tests:     tests/v2/reports.test.ts (heatmap cell states, filters, RP-09, pace, single-rater, simulation share,
                      rater rows, exclusions of awaiting approval), tests/v2/pdf.test.ts (round trip passes, a one-byte
                      change in text, payload or signature fails, determinism). Browser: docs/v2/verify/stage5.e2e.mjs.
Risks / unknowns:     Pace clock and its floor are my inference. Rater comparison at 12 students is thin; shown with a caution
                      rather than hidden. A "not met" cell is a skill whose only attempts failed, which a program may want
                      to call something else (OD: wording).
Vault notes consulted:Same as V2-02a.
```
