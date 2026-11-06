# Stakeholder review, 2026-11-04 (Aarti, Sankalp, Vishakha, Kunal, Yash, Romit)

Source: Granola raw transcript `205da2dd-a7b1-4b25-b547-031162c25b29`. Tier: CALL. The transcript's speaker labels are unreliable, so points are grouped by topic and paraphrased.
Next review: 2026-11-23, 9 AM ET, 90 minutes. Romit approved the plan below on 2026-11-04 ("go ahead").

## Agreed model
- A program has one or more skill lists. One is the default for new student groups.
- A whole list is assigned to a student group in one go. Programs do not sub-select skills per cohort.
- When skills change (by year, decade or accreditation version), create a new list and assign it to new groups going forward.
- More than one list on a student is possible but not typical, and should not be prevented.
- Assigning a list to students is required. Mapping to courses and to competencies is optional.
- Skills and competencies stay separate entities at program level. A skill can be mapped to a competency as evidence.
- Reports are driven by skill list. Two active lists means two tabs; do not merge them.

## Course mapping
- Map at the course offering level. Do not present per-term thinking (fall, spring, summer columns).
- A mapping is the default for future offerings through course cloning, and can be edited on an offering. The next clone carries the edited set.
- Course cloning must be accounted for from the first version. It lives in the cloning feature, not on the mapping page.
- Both views stay: by skill and by course.

## Configuration
- Set once at program level; skills inherit it. Times needed is the common per-skill difference. Per-skill changes are possible and rare.
- Levels are the program's own (ASCN direction: underdeveloped, developing, developed).
- Romit told the group "which levels count" becomes checkboxes because more than one can count. Open: linked threshold (built, engine unchanged) or independent levels (engine change).

## Student and evaluator
- Students usually start: self-reflection, then email the preceptor or show a QR code. Requests can repeat.
- Entry points: dashboard, and course or placement pages when the course has skills mapped.
- Faculty can also start, using a quick list of their students and skills (matrix).

## Reports and access
- Keep access simple: a course view and a student view, plus an admin overview.
- Views: each student's progress, each skill across a cohort, each course across a cohort. Worst-completed skills and bottom students are useful.

## Demo direction
- One happy path, no variant switching (Sankalp).
- The screens must look clean and easy to navigate (Aarti: they do not yet).

## Open, not decided here
- Patient logs as evidence: possibly needed by discipline. Aarti wants known discipline variations accounted for in the design; Yash and Vishakha question whether PA needs it in the first version. Do not design it as decided.
- Exposure counts versus assessed skills: both exist across disciplines.
- Rad tech and SMU use cases: client conversations pending.

## Changes this implies for the lab
1. Assign: choose a skill list, tick student groups, Save. Remove the individual skill picker and the mode toggle. Reverses D-X-level "individual skills" work and D-L40's assign choice.
2. Groups of skills page becomes skill lists: default, versions, assigned groups.
3. Course mapping: per offering, no term columns. Show that a mapping carries through cloning. Reverses the longitudinal direction in `2026-11-02-admin-flow-gap-and-placement.md` (slice 6).
4. Reports and student records follow the list.
5. Demo: one happy path, with variant controls off for the Nov 23 walkthrough.
6. Competency mapping: an optional mapping needs a place.

## For Sankalp, Nov 23 review (added 2026-11-05, D-L102)

1. **CM-05's reading.** "A student may submit a skill that is not mapped to their course, and that evidence counts toward their record." We read "record" as that skill's own record (CM-07), so evidence on a skill on none of the student's lists counts for that skill and toward no list total. Is that the reading? A student with no list sees a plain message and can still submit. Aarti: lists "will have to be mapped to students" (205da2dd ch 11).
2. **The two-list case.** Aarti: "you will see 2 tabs", no merged figure (205da2dd ch 11). We show two tabs on My progress, a list select on Reports, and the dashboard reads each student's first list unless one is chosen. Is the dashboard's reading right, or should the dashboard also open on one list?
3. **The mandatory-not-on-list edge case.** Sankalp called it an edge case to explore (655e2cbd ch 2). We show it on the course page as "Not on your list". Does a client ever want it?
4. **"Required this term" is now only a Reports view, Mandatory this term.** State it out loud. And pace against a list is a program clock [INFER], the same PENDING-ROMIT as all pace.

