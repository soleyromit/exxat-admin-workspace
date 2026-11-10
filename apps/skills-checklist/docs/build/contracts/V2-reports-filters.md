# V2-reports-filters Reports filters: cohort, group, course, category, tag, location, setting

**Status:** Stage 5 amendment. Narrows and supersedes the "Out of scope: Tag and location filters" line and the "cohort and group are one value in v2" note of `V2-05a-cohort-reports-and-signed-pdf.md`. Follows `V2-CONSISTENCY-cross-page-patterns.md` section 4 (one `V2FilterBar`). Tags: `[REQ]`, `[OD-n]`, `[PROTO]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              Reports filter row. Routes /v2/admin/reports and /v2/director/reports. One V2FilterBar above the Tabs
                      (it scopes every tab), unchanged position.                                   Wave: V2 Stage 5 (amendment)
Persona(s) & role:    A. Ross (administrator), Dr. K. Brennan (director). Same screen as V2-05a.
Scope / data seen:    Counted evaluations only (AE-01, AR-06). Confidential concerns never read.
Job-to-be-done:       Narrow the population and the evidence to one cohort, group, course, category, tag, location or setting
                      and read the recalculated attainment, then remove one filter at a time.
Why -> So what:       A program answers site and cohort questions ("how is Group B doing at the outpatient clinic?") only if
                      the figures are recomputed from the evidence gathered there, not just hidden rows. [REQ RP-08]
Requirements:         RP-01 (filter by cohort, group, clinical course, category, tag, location, setting; applied filters
                      evident; each removable on its own), RP-08 (location or setting count only the evidence gathered there;
                      progress recalculated from what is left), RP-09 (a combination that cannot produce evidence is
                      explained, not returned empty), RP-02 and RP-03 (figures per student and per skill follow the
                      filters), SL-07 (tags are program-defined; none ships), SC-11 (named clinical settings), SC-12 (lab
                      and simulation never carry a named clinical setting)
Open decisions hit:   None decided here. OD-10 (export format) untouched. OD-29 (report as launch page) not touched.
                      Attainment by tag (RP-04) and the student evidence ledger (RP-05, RP-06) are separate tasks.
[PROPOSED]:           Group depends on cohort: the Group field is disabled with the hint "Choose a cohort first" until a
                      cohort is applied, offers only that cohort's groups, and is cleared whenever the cohort is removed or
                      changed (so a group can never name a group of another cohort).                        [PROTO P-01]
                      Clinical course filter scopes evidence by the course it was gathered in; skills stay those the report
                      course maps. Tag filter keeps skills carrying the tag; a skill with two tags appears under both, so tag
                      views overlap by design. [REQ RP-04 wording; the By tag tab itself is not built here]
                      Population filters (cohort, group) re-scope who is counted: students in view, behind pace, attainment.
Prototype reference:  P-01 (prototype-parity.md): 7 labelled selects COHORT, GROUP, CLINICAL COURSE, CATEGORY, TAG,
                      LOCATION, SETTING, chips, Clear all, Group disabled until a cohort is chosen, hint "Cuts across
                      categories" on Tag and "Filters the evidence" on Setting. KEEP: the seven dimensions, the
                      dependency, the impossible-combination explanation. NOT COPIED: the Filters panel; v2 keeps the
                      DS-composed V2FilterBar (Add filter + chips) so every v2 page filters one way.
Pattern:              Inline filter row (no route, no sheet). Reference: components/v2/v2-filter-bar.tsx.
DS mapping:           V2FilterBar (HAND-ROLL composition of DS FilterBar, FilterBarAddButton, FilterBarClearButton, Popover,
                      Button; documented hand-roll) extended with per-field `disabled` and `hint`. Chips and field pickers:
                      Button variant outline/ghost size sm. Conflict: LocalBanner variant warning + Button outline lg.
                      Result count: polite status text inside V2FilterBar. No new component.
States:               L  "Opening the reports" before hydration (unchanged). E  No counted evidence for these filters:
                      info LocalBanner, count 0 students or "0 evaluations" (unchanged). Er  Impossible combination: warning
                      LocalBanner with the reason and one clearing button. V  Values only from lists built from data
                      (cohorts of students in the course, groups of the chosen cohort, locations the program defines,
                      courses with evidence, tags on in-scope skills). S  Result count announced politely. D  Group disabled
                      without a cohort, with visible hint text. P  Every KPI, grid, skills and evaluators tab, and the PDF
                      follow the same filters. Bl  Students never reach this page.
Edge cases:           Remove the cohort chip: the group chip goes too. Change cohort: group cleared. Location + a setting it
                      does not offer (Harbor Outpatient Clinic + Inpatient): banner "does not offer", button clears the
                      location. Course that places no clinical students + clinical setting: banner. Lab or simulation with a
                      named clinical setting: banner (unchanged). Tag filter on a category with no such skill: zero skills,
                      "No counted evidence" banner, no crash.
Copy:                 Field labels: Cohort, Group, Clinical course, Category, Tag, Location, Setting, Clinical setting,
                      Mandatory skills only. Hints: "Choose a cohort first" (Group), "Cuts across categories" (Tag),
                      "Filters the evidence" (Setting, Location). Chip: "Cohort: BSN 2027". Banner title "These filters
                      cannot match any evidence". Reason: "Harbor Outpatient Clinic does not offer Inpatient care, so no
                      evidence could have been gathered there in that setting." Sentence case, no em dashes.
A11y:                 Bar is role=group "Filters"; chips are buttons "Remove filter {field}: {value}"; disabled Group is a
                      real disabled button with its hint in text (not colour or tooltip only); count in role=status polite;
                      all targets from DS Button; 12px minimum; the banner is reachable and its button has a visible label.
Out of scope:         The By tag tab (RP-04), the student drill-down ledger (RP-05..RP-07), CSV or Excel (RP-11, OD-10),
                      REQ section 14, components/v2/viz/*, admin-home, wizard files.
Acceptance tests:     (1) RP-01: ReportFilters carries cohort, group, course, category, tag, location, setting; each is listed
                      by appliedFilters and removable alone (unit, tests/v2/reports.test.ts). (2) RP-01: groupsOf(cohort)
                      returns only that cohort's groups; withCohort clears a group of another cohort; removing the cohort
                      removes the group (unit). (3) RP-08: each of cohort, group, course, location, setting changes the
                      KPI figures (students in view or observations) and progress is recalculated from the remaining
                      evidence (unit). (4) RP-01: tag keeps only skills carrying the tag and overlapping tags both list a
                      shared skill (unit). (5) RP-09: location + a setting it does not offer returns an explanation and
                      names the clearing action (unit). (6) RP-01: Clear all returns NO_FILTERS and restores the original
                      figures (unit). (7) Browser: Group is disabled with the hint until a cohort is chosen; choosing a
                      cohort enables it; axe 0 on /v2/admin/reports (e2e, shoot.mjs --no-states).
Risks / unknowns:     Seed has no real groups, tags or locations; they are added as seed data and labelled as such [INFER].
                      A second clinical course exists only as the home of lab and simulation evidence [INFER]. Pace and
                      "behind" follow the population filters but not the evidence filters (the pace clock is [PROPOSED]).
Vault notes consulted:Same as V2-05a.
```
