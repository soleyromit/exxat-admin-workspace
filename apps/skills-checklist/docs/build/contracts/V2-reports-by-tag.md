# V2-reports-by-tag Reports: Tags tab (attainment by tag) and tag detail sheet

**Status:** Stage 5 amendment. Adds the By tag view that `V2-reports-filters.md` listed as out of scope. Follows `V2-CONSISTENCY-cross-page-patterns.md`. Tags: `[REQ]`, `[OD-n]`, `[PROTO]`, `[PROPOSED]`, `[INFER]`.

```
Surface:              Reports, new tab "Tags" between Skills and Evaluators. Routes /v2/admin/reports and /v2/director/reports.
                      Tab order becomes Students, Skills, Tags, Evaluators.                         Wave: V2 Stage 5 (amendment)
Persona(s) & role:    A. Ross (administrator), Dr. K. Brennan (director). Same screen as V2-05a.
Scope / data seen:    Counted evaluations only (AE-01, AR-06). Confidential concerns never read.
Job-to-be-done:       Answer a question that cuts across the category structure ("how are we doing on everything about infection
                      prevention?") and see which skills sit behind that figure.
Why -> So what:       Categories are a tree; tags are not. A program that reads one row per tag would add the rows up and
                      double count every skill that carries two tags. The tab must therefore show the overlap in the same
                      place as the figures, once, so no one reads the rows as a partition. [REQ RP-04]
Requirements:         RP-04 (attainment by tag; figures overlap and the report says so), RP-01 (every filter applies, each
                      removable), RP-08 (location, setting, course recalculate), RP-02 and RP-03 (same counts as the Students
                      and Skills tabs), RP-05 and RP-06 (from a figure reach the students and evidence), RP-09 (explain, do not
                      return empty), SL-07 (tags are program-defined, none ships)
Open decisions hit:   None decided. OD-10 (export) untouched. OD-29 untouched.
Prototype reference:  P-01b By tag [PROTO]. KEEP: a tag table (tag, skills, achieved, in progress, not met, percent of
                      student-to-skill records achieved), one footnote about overlap, a detail view per tag listing its skills.
                      NOT COPIED: the "Categories spanned" and "Students achieving all" columns (not in RP-04; the second is
                      a per-student figure that would need its own definition) [INFER]; the centered modal (v2 drills in with a
                      right Sheet, as the Students tab cell drill-down does).
[PROPOSED]:           Unit of count is the student-to-skill record: one student against one skill in view. A tag's figures are
                      the sum of those records over the skills carrying it. The four states are the Skills tab's: Achieved,
                      In progress, Did not meet, Not started, taken from the same selector (skillAttainment), so a skill
                      shows the same four numbers on the Skills tab, the Tags tab and in the tag sheet.
                      Overlap disclosure per tag: how many of its skills also carry another tag, and which tags. Across the
                      view: distinct skills in view, tag-skill pairs, skills with no tag. The tab never shows a grand total
                      across tags.
                      With a Tag filter applied the tab shows that tag only. Other tags are not listed, because their rows
                      would count only the skills that also carry the filtered tag, which reads as a smaller tag.
Pattern:              Tab with a list of tags, each row a stacked bar; row button opens a right Sheet. Reference: the Skills
                      tab (ChartCard + StackedBar list) and the Students tab cell Sheet (data-cell-sheet).
DS mapping:           Tabs, TabsContent (existing). ChartCard (vendored, as the other tabs). StackedBar (v2 viz on DS chart,
                      Recharts via DS ChartContainer). Table fallback: V2Grid (DS DataTable) toggled by the same
                      "Show as table" button pattern as the Students tab. Detail: Sheet, SheetContent size lg, SheetHeader,
                      SheetTitle, SheetDescription. Skill list in the sheet: V2Grid. Buttons: DS Button variant link /
                      outline size sm. LocalBanner info for "no skills carry this tag". StatusBadge for the overlap marker.
                      No new component beyond a composition file tag-attainment.tsx.
States:               L  Hydration loading unchanged (page level). E  No tag defined on any skill in view: info LocalBanner
                      "No skill in view carries a tag" with what to do (tags are set when defining a skill); a tag chosen in
                      the filter that no skill in scope carries: the same banner naming the tag. Er  Impossible combination:
                      the page banner already explains it; the tab shows zero records, not a crash. V  Rows only for tags on
                      skills in scope. S  The detail Sheet opens on the row button and returns focus to it on close. D  none.
                      P  All nine filters apply. Bl  Students never reach this page.
Edge cases:           A skill with two tags is counted under both rows: row totals exceed distinct totals, and the footnote
                      and the pair counts say so. A tag whose every skill has no students in view: zero records, percent
                      shown as "No students in view", not 0 percent. Tag filter on a tag with no skills: banner, no row.
Copy:                 Tab "Tags". Card title "Attainment by tag". Description "Student-to-skill records achieved, in progress,
                      did not meet and not started, for the skills that carry each tag." Footnote (once, under the list):
                      "A skill can carry several tags and is counted under each of them, so these rows overlap. Do not add them
                      up. They count student-to-skill records, not students." Row: tag name; "{n} skills"; "{n} of {m}
                      records achieved"; marker "{n} also in another tag". Sheet title: tag name. Sheet description: "{n}
                      skills, {x} of {m} records achieved". Sheet note when overlap: "{n} of these skills also carry another
                      tag: {list}". Skill rows: Skill, Level, Other tags, Achieved, In progress, Did not meet, Not started.
                      Sentence case. No em dashes. Never the word "items".
A11y:                 Each bar is role=img with a text summary (StackedBar). Table fallback via "Show as table" (aria-pressed).
                      Glyph plus label, never colour alone: segments carry labels in the summary and counts in text beside
                      the bar; Not started is hatched. No red in score encodings. Row button has an accessible name
                      "Open the skills for {tag}". Sheet is a dialog with a title and description, Esc closes, focus returns.
                      Skill names are buttons named "Show the students for {skill}". 12px minimum. Targets from DS Button.
Out of scope:         Export of the tag view (RP-10 is a separate task), REQ section 14, components/v2/viz/*, admin-home,
                      wizard files, seed.ts (tags already exist).
Acceptance tests:     (1) RP-04: tagAttainment lists one row per tag on skills in scope with records that sum, per skill, to
                      the Skills tab (unit). (2) Consistency: for the same filters the distinct-skill achieved total equals the
                      Skills tab total, and a skill carrying two tags is counted in both tag rows so the row sum exceeds it
                      (unit). (3) Overlap: shared-skill counts and pair totals are correct and no grand total is offered
                      (unit). (4) RP-01 and RP-08: tag, cohort, setting and location filters change the rows (unit). (5) A tag
                      with no skills in scope is explained (unit). (6) Browser: tabs read Students, Skills, Tags, Evaluators;
                      Tags shows one footnote once; a row opens the Sheet; axe 0 on the tab and the sheet; 1280 and 390 clean
                      (e2e, shoot.mjs --no-states).
Risks / unknowns:     "Skill name linking to its record": there is no per-skill page in v2. The link opens the Students tab as
                      a table narrowed to that skill (RP-06 path), the same as Show students on the Skills tab [INFER].
Vault notes consulted:Same as V2-05a.
```
