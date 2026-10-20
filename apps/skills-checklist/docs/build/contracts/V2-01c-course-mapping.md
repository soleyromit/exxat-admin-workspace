# V2-01c Course mapping and coverage (scenario step 4)

**Status:** Stage 1 contract for the connected prototype v2. Narrows `00-cross-cutting.md` and `V2-00-foundation.md`. Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              Map program skills to NURS 350 Clinical Practicum as mandatory, optional or not expected, with
                      coverage warnings. Route /v2/admin/map-courses.                              Wave: V2 Stage 1
Persona(s) & role:    Program administrator (A. Ross). RBAC: 00-cross-cutting.md section 7. Sample data only.
Scope / data seen:    The course (store.course), all program skills, their configuration and publish state, the people on
                      record (for qualified-evaluator coverage).
Job-to-be-done:       Tell students what the course expects and catch gaps before the term starts.
Why -> So what:       Mapping drives what a student sees as expected (ST-01) and what the cohort is measured against.
                      A mandatory skill nobody can sign off, or a course with no mandatory skills, is found now, not in
                      week ten.                                                       (journeys/01)
Requirements:         CM-01, CM-03, CM-04, CM-05, CM-06, IM-09 (unconfigured skills cannot be mapped), SC-12
Open decisions hit:   OD-01 / CM-08 (do mappings carry forward): not decided, the screen maps one offering only and says so.
                      Coverage warnings are [PROPOSED]. Mapping is not eligibility (CM-05): the page says a student can
                      still submit a skill that is not mapped.
Prototype reference:  None for v2. v1 S-10 (components/mapping) read for patterns only; v1 routes untouched.
Pattern:              Page with a filter, a summary, a warnings list and a DataTable grid.
                      Reference: components/mapping/mapping-workspace.tsx
DS mapping:           PageFrame/PageSection  -> IMPORT   Select (requirement level, library filter)  -> IMPORT
                      DataTable via components/v2/v2-grid.tsx  -> IMPORT   Badge, Button, Card, LocalBanner, Tooltip -> IMPORT
                      Warning rows: Card + icon + text, composed (new-components-needed.md).
States:               L  Seed first, saved state after mount.
                      E  A library filter with no skills says so. A course with zero mapped skills shows a warning.
                      Er A write that the store refuses (unconfigured skill) shows a LocalBanner error with the reason.
                      V  Unconfigured skills have the control disabled and show the reason "Configure this skill first"
                         with a link; the store also refuses (IM-09).
                      S  Choosing a level updates the row, the summary (mapped, mandatory) and the warnings at once and
                         writes an audit entry.
                      Su Polite status line "Mapped IV catheter insertion as mandatory."
                      D  Disabled rows show a reason, never a bare grey control.   P  n/a.   Bl  See V.
Edge cases:           Skill deactivated later (SL-11) is out of scope. Same skill, different level per offering (CM-06):
                      one offering exists in v2, so the level is stored per course id. Library filter hides other
                      specialties but their mapped rows still count in the summary.
Copy:                 Levels: "Mandatory", "Optional", "Not expected", "Not mapped". Warnings: "IV catheter insertion is
                      mandatory but requires 1 evaluation in Emergency, and NURS 350 has no Emergency placements."
                      "NURS 350 has no mandatory skills." "IV catheter insertion is mandatory but not in use yet, so
                      students cannot see it." "No evaluator on record is qualified to sign off Central line dressing change."
A11y:                 Each Select labelled "Requirement for <skill>". Status badges carry text. The warnings list is a
                      labelled list with a count in its heading. Disabled-reason text is associated by aria-describedby.
Out of scope:         Offering search and cohort filters (CM-02), carry-forward (CM-08), bulk mapping, section 14.
Acceptance tests:     1. setMapping adds, changes and removes a row, writes audit, and refuses an unconfigured skill with
                      a reason (CM-03, CM-06, IM-09).  tests/v2/admin-actions.test.ts
                      2. coverageWarnings reports: zero mandatory skills, mandatory skill not published, mandatory
                      skill needing a clinical setting the course lacks, mandatory skill with no qualified evaluator,
                      and nothing for a healthy course.  tests/v2/coverage.test.ts
                      3. Summary counts equal selectors mapped and mandatory (CM-04).
                      4. Browser: publish IV catheter insertion, then the unpublished warning disappears; mapping an
                      unconfigured skill is blocked; mapping persists across reload.
Risks / unknowns:     (1) "No setting can satisfy" is derived from the course's clinical settings and the skill's
                      setting minimums, an [INFER] reading. (2) One offering only.
Vault notes consulted:Not consulted in this run (no Obsidian vault access). Source docs read: requirements.extracted.txt
                      section 5, S-10-course-mapping.md, V2-00-foundation.md, docs/v2/*.
```
