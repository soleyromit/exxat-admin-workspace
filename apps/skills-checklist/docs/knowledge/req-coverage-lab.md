# Requirements coverage of the design lab (REQ vs lab screens, field by field)

**Date:** 2026-10-27 · **Worktree:** `sc-scale`, branch `feat/skills-checklist-v2-scale` · **Machine-readable:** `req-coverage-lab.json` (same folder)
**Sources, in precedence:** REQ `docs/source/requirements.extracted.txt` > CALL `docs/knowledge/design/granola-2026-10-26-updates.md` > ledger `docs/knowledge/02-decisions-ledger.md`. `strategy/04-requirements-traceability.md` was not trusted: every verdict here was re-checked in code and in the browser. An `OD-*` is never treated as decided; it is judged SEAM (a seam exists or not). REQ section 14 is out of scope.

**Why this exists:** SL-03 to SL-06 and SL-10 (category, tags, inline create, library filters) were only partly built in Add a skill until 2026-10-27, because nothing compared each lab variant against each requirement. This audit does that comparison for all 38 screens and 93 variants.

## How it was checked
- Lead plus four parallel auditors (SL/IM, SC, CM/ST/RV/SH, EV/AR/RP/AE). Each read the components and lib code, then opened the screens on `next dev --port 3017` (webpack) with headless Playwright at 1440 x 900 and localStorage cleared. They clicked through sheets, menus, wizard steps, Send, Fix, Return/Approve and the reporting filters.
- **Runtime coverage:** all 38 registered screens were opened at runtime, in 98 distinct URLs (screen variants, flow steps and states). The lead also opened the 11 marquee steps in present mode. Verdicts that rest on code only are marked "code only" in the evidence. The main ones: ST-07, SL-06 across pages, SL-11 on Send (its list sits behind a step), AE-01 to AE-07, EV-02, EV-08, and the D-X25 export issue.
- **Screenshots:** `/tmp/sc-reqaudit/shots/<req>-<screen>-<variant>.png`, plus `/tmp/sc-reqaudit/shots/marquee/*.png` for the present-mode walk. Probe scripts are in `/tmp/sc-reqaudit/scripts/`. These files are temporary and not committed.
- **Lead spot checks, confirmed by grep:**
  - SH-07: no student lab component renders evaluator feedback.
  - SL-02: no Description field in any add path.
  - SC-13, SC-15, SC-07: `lib/lab/configure.ts:172,179,181` reads back scale 5, only "Date performed" and self-evaluation off.
  - IM-14 C: `admin-configure-skill-c.tsx:190-193` only sets local state.
  - EV-06: the lab grid has no feedback field.
  - SL-11: `openToLog` and `skillRowsFor` ignore `Skill.active`.
- **One auditor verdict was overruled.** The CM/ST auditor marked "inactive skills not selectable for submission" as MET, reading inactive as `published === false`. Deactivation sets `Skill.active = false` (`lib/v2/admin-actions.ts:193-200`), and `openToLog` (`lib/v2/student.ts:493`) never checks it. SL-11 therefore stays MISSING on the student pickers.

## Update 2026-10-30: Wave 1 (all P0 rows re-verified)
All 8 P0 gaps in section 2 are now **MET**. Most were already fixed by commits 20501f64 and d38054ea (Oct 27–28); Wave 1 closed what remained and added tests:
- **SL-02:** description in every add path; editable in the panel. Test: `tests/lab/library-sl02-sl06.test.tsx`.
- **SL-06:** one shared vocabulary; inactive entries are not offered, and assigned ones are marked "Inactive". Same test file.
- **SL-11:** inactive skills are out of course mapping A/B and out of the Log and Send pickers. Tests: `mapping-sl11-cm.test.ts`, `student-submission-p0.test.ts`.
- **ST-12:** student note on Log and Send; shown in full on the evaluator form (also EV-04).
- **ST-05/08/09:** lab and simulation route on Send with lab instructors; lab evidence carries no clinical setting.
- **ST-10:** detail fields come from the skill's configuration, and Send is blocked until mandatory ones are filled. Browser check: `tests/lab/e2e-student-submission-p0.mjs`, 14 of 14 pass.
- **SC-13, SC-15, SC-07:** saved and read back in A/B/C. Test: `configure-roundtrip.test.ts`.

Recount after Wave 1: 62 of 123 MET (50%). SC-15 on the student side is still **PARTIAL**: seeded skills without the flag fall back to "has levels", and the same fallback exists in configure.ts:200. The counts below are the Oct 27 baseline and have not been recounted.

## Update 2026-10-30: Wave 2 (P1 core)
These requirements are now **MET**:
- **IM-10, IM-14:** one shared save path for applying a configuration to several skills, with "N left to configure". Test: `configure-bulk-ae07.test.tsx`.
- **SC-05:** C's question subset.
- **AE-07:** check-off level remap on remove, move and preset.
- **AR-03, RP-07:** one read-only evaluation renderer, `components/lab/evaluation/evaluation-view.tsx`. Tests: `evaluation-renderer.test.tsx`. The attainment peek A and the director peek share the component but were not click-tested.
- **RP-01, RP-09, AE-04:** confirmed in all 19 reporting variants. Fixed: the director live region, the recount line on an impossible scope, and the director reports B columns. Tests: `reporting-wave2.test.tsx`.

Still **PARTIAL**:
- **SH-07:** the student record at 375 has no direct View link; it takes 2 taps via skill detail.
- **SC-06:** no paste or select-all for 50 to 100 questions.
- **SC-19:** rule impact A has no student or evaluator view.

Recount: 71 of 123 MET (58%), or 71 of 109 (65%) excluding SEAM and UNCHECKED. Integration: tsc clean; `vitest run tests` gives 170 files, 2533 tests; the DS and chrome gates pass. One queue reason moved from rule to disagree, for `sub-g-043`, because the student's self-rating now counts in the comparison (AR-02).

## 1. Summary counts

### Per requirement (worst status across its screens)

| Section | Reqs | MET | PARTIAL | MISSING | VARIANT-GAP | SEAM | Unchecked |
|---|---|---|---|---|---|---|---|
| REQ prose (1.4, 1.5, 1.6, 4.1) | 4 | 1 | 2 | 0 | 0 | 0 | 1 |
| SL library | 11 | 5 | 3 | 3 | 0 | 0 | 0 |
| IM import | 15 | 8 | 4 | 0 | 2 | 1 | 0 |
| SC configuration | 19 | 13 | 4 | 0 | 2 | 0 | 0 |
| CM course mapping | 8 | 4 | 1 | 0 | 2 | 1 | 0 |
| ST student submission | 14 | 3 | 9 | 1 | 0 | 1 | 0 |
| EV evaluator | 8 | 3 | 3 | 1 | 0 | 1 | 0 |
| AR review | 6 | 3 | 3 | 0 | 0 | 0 | 0 |
| RV revision | 6 | 3 | 1 | 1 | 0 | 1 | 0 |
| SH student history | 7 | 3 | 3 | 1 | 0 | 0 | 0 |
| RP reporting | 11 | 1 | 6 | 1 | 2 | 1 | 0 |
| AE engine | 8 | 5 | 1 | 0 | 1 | 1 | 0 |
| OD not tied to an ID above | 6 | 0 | 0 | 0 | 0 | 1 | 5 |
| **Total** | **123** | **52** | **40** | **8** | **9** | **8** | **6** |

So 52 of 123 requirement statements (42 percent) are fully met on every screen and variant that should carry them. Leaving out the 14 SEAM and unchecked statements, it is 52 of 109 (48 percent). 57 statements have at least one gap.

### Per requirement x screen row (one row = one requirement on one screen, possibly several variants)

| Section | MET | PARTIAL | MISSING | VARIANT-GAP | SEAM | N/A or unchecked |
|---|---|---|---|---|---|---|
| REQ prose | 3 | 2 | 0 | 0 | 0 | 1 |
| SL | 20 | 5 | 7 | 0 | 0 | 0 |
| IM | 21 | 6 | 0 | 2 | 1 | 0 |
| SC | 17 | 6 | 0 | 2 | 0 | 0 |
| CM | 8 | 1 | 0 | 2 | 1 | 0 |
| ST | 12 | 16 | 2 | 0 | 1 | 0 |
| EV | 7 | 3 | 1 | 0 | 1 | 1 |
| AR | 3 | 6 | 0 | 0 | 0 | 0 |
| RV | 8 | 2 | 1 | 0 | 1 | 0 |
| SH | 9 | 5 | 2 | 0 | 0 | 0 |
| RP | 8 | 7 | 2 | 2 | 1 | 0 |
| AE | 6 | 1 | 0 | 1 | 1 | 0 |
| OD | 0 | 0 | 0 | 0 | 1 | 5 |
| **Total** | **122** | **60** | **15** | **9** | **8** | **7** |

Gap rows by priority: **P0 14 · P1 37 · P2 36**.

### The size of the gap, in one paragraph
The tag/category miss was not an isolated case. The same pattern shows up in four places:
1. **A rule is enforced on the page that owns it, but not where the data is used.** Deactivating a skill is honoured by reports, but course mapping and the student pickers still offer it (SL-11). Deactivating a category or tag stays on the Settings page (SL-06).
2. **A setting is shown in the UI but lost on publish.** Student submission fields, self-evaluation and the scale top all revert after reload (SC-13, SC-15, SC-07). The bulk paths in Configure B and C report success but write nothing (IM-14).
3. **The student side drops whole required fields.** There is no student note (ST-12), no completed evaluation in full (SH-07), and no lab or simulation route to a lab instructor (ST-05, ST-08, ST-09). Send does not enforce mandatory details (ST-10).
4. **Reporting variants lack the "explain, don't go empty" and "what's applied is evident" rules.** RP-09 is met on the dashboards only. RP-01 hides the applied filters behind "Filters 2".

The hard stops hold:
- No default model.
- Unconfigured skills cannot be mapped or submitted.
- Lab or simulation never satisfies a clinical-setting minimum (engine and UI).
- Completed evaluations are immutable (no reopen anywhere).
- Evaluators have no login.
- Mapping is not eligibility.

## 2. Prioritized gap list

P0 means one of three things:
- a requirement MISSING on a marquee screen in its recommended variant (`lib/lab/present.ts` MARQUEE);
- an enforcement rule visibly broken at runtime;
- a configuration silently lost on publish.

P1 means PARTIAL on a marquee screen, or MISSING or VARIANT-GAP on a core requirement elsewhere. P2 covers minor gaps, Phase 2 items (import, starting points) and Later items.

### P0 (14 rows, 8 distinct gaps)

| # | REQ (short quote) | Screen · variants | What is missing | Evidence | Fix (one line) |
|---|---|---|---|---|---|
| 1 | **SL-11** "Deactivating a skill withdraws it from course mapping, from student selection…" | admin/course-mapping A, B (marquee "Course mapping"); student/log-skill A, B (marquee "Log a skill"); student/request-signoff A, B (marquee "Send", code only) | The inactive skills "Stool" and "Urine: Sterile Urine" are listed and mapped Optional/Recommended in NUR 101, and offered in the Log picker ("Search 147" = 145 published + 2 inactive) | `lib/lab/mapping.ts:319-331` has no `active` filter; `lib/v2/student.ts:493` `openToLog` ignores `active`; shots `SL-11-course-mapping-A/B.png`, `SL-11-log-skill-A/B.png` | Add `active !== false` to `openToLog` and to `skillRowsFor` and the matrix rows; block `setLevel`; add a lab test |
| 2 | **SL-02** "A skill has a name, a description and an active/inactive status" | admin/add-skill A, B, C (marquee "Add a skill") | No Description field in any add path (sheet, inline row, add several) | `components/lab/library/skill-sheet.tsx:106-135`, `inline-add-row.tsx:245-266`, `add-several-sheet.tsx:357-381`; runtime `getByLabel(/Description/)` = 0; shot `SL-02-add-skill-A.png` | Optional Description textarea in sheet A and the edit sheet; show it in the skill panel |
| 3 | **SL-06** "Only active categories and tags are available… one since deactivated remains on the skill, identifiable as inactive" | admin/add-skill A, B, C; admin/skills-library A, B, C (both marquee) | The pickers have no active/inactive concept. The library shows category and tags as plain names with no inactive marker | `components/lab/library/category-tag-pickers.tsx:453-534`; options from `lib/lab/library.ts:511`; the only SL-06 test covers the legacy `SkillsMultiPick` (`tests/ui/components.test.tsx:98`) | Hide inactive entries from suggestions; show an assigned inactive one as a chip with the word "Inactive" and its remove button |
| 4 | **ST-12** "A student records at most one narrative note per submission, kept distinct from the evaluator's comment" | student/log-skill A, B; student/request-signoff A, B (marquee) | No note field. The only fields are Date performed, Unit and Case reference; a note exists only in Fix | runtime `getByLabel(/note/i)` = 0; shot `ST-12-student-log-skill-A.png` | Add one optional "Note for your evaluator" textarea to Log and Send; show it on the evaluator form as the student's note |
| 5 | **ST-05 / ST-08 / ST-09** (also EV-02) "Every submission records clinical or lab/simulation… evaluator role constrained by the setting… where a lab instructor is not yet recorded, the student may name them" | student/request-signoff A, B (marquee "Send for evaluation") | Send offers clinical settings only. Lab instructors are filtered out of the evaluator list, and lab/sim entries are "not sent for sign-off". A recorded lab instructor can never be picked, and the setting never decides the role | `lib/lab/student2.ts:195` (`evaluatorsFor` drops lab instructors); `lib/v2/student.ts:692`; shots `crawl-student-request-signoff-variant-A/B.png` | Add "Where: Clinical / Lab or simulation" to Send; in lab, list recorded lab instructors plus "Name someone new"; keep the "why no one fits" message |
| 6 | **ST-10** "mandatory ones enforced, before a submission can be sent" | student/request-signoff A, B (marquee) | At runtime Send succeeded with no date and no unit, because Send opens with the likely skills already picked | runtime click-test; shot `ST-13-student-request-signoff-A.png` | Run the same mandatory-field check as Log before Send is enabled, with the error on the field |
| 7 | **SC-13** "The program defines what the student must supply… label, data type… mandatory" | admin/configure-skill A, B, C (marquee "Configure a skill") | (a) Choice list has no way to enter its choices. (b) A field cannot be edited, only removed. (c) Fields are lost on publish: reload shows only "Date performed" | `lib/lab/configure.ts:179` (read-back hard-codes Date performed), `:868-900` (`toSkillConfig` writes no student fields), `components/lab/configure/fields.tsx:689-693`; shots `SC-13-configure-all-choicelist.png`, `SC-13-SC-15-configure-B-afterReload.png` | Persist `studentFields` in `toSkillConfig`/`fromV2`; add a choices editor and an Edit action |
| 8 | **SC-15** "whether the student self-evaluates… configurable per skill" | admin/configure-skill A, B, C (marquee) | The self-evaluation switch is on before reload and off after; the student side guesses it from whether the skill has levels | `lib/lab/configure.ts:181` (`selfEvaluation: false`), `lib/lab/student2.ts:74-80`; shot `SC-13-SC-15-configure-B-afterReload.png` | Store `selfEvaluation` on the skill configuration and read it in student and evaluator screens |

### P1 (37 rows; the distinct gaps)

| # | REQ (short quote) | Screen · variants | What is missing | Evidence | Fix |
|---|---|---|---|---|---|
| 1 | **SH-07** "see the completed evaluation, including the evaluator's responses and feedback in full" | student/skill-detail A, B; student/record A, B | No way to open a completed evaluation; attempts show only "Counted. Met." | Lead grep: 0 hits for feedback in `components/lab/student*`; `lib/v2/types.ts:255,261`; shots `SH-07-student-skill-detail-A/B.png` | Read-only evaluation sheet from each attempt and each record row |
| 2 | **RP-07** "Any recorded evaluation must be viewable in full… not only a summary" | reviewer/student-record A, B (every report drill ends here); director/verification-detail A, B; attainment evidence peek (P2) | Completed evaluations are not openable; only ones awaiting approval link out. The peek's "The full evaluation opens on the student record" is untrue | `components/lab/reviewer/record-frame.tsx:83-112`, `evidence-peek.tsx:9`, `director/verify.tsx:74-85`; shots `RP-07-*.png` | Same read-only evaluation sheet (answers, scores, level, feedback, student note), reused by student and staff |
| 3 | **IM-14** "copy the configuration of one skill to another or apply a configuration to several selected skills at once" | admin/configure-skill B (Apply to other skills), C (Publish n skills); A has Copy from only | B and C show success but write nothing; the target skills reopen "Not configured". C has no Copy from | `components/lab/configure/bulk-apply.tsx:117-125`, `admin-configure-skill-c.tsx:190-193`; shots `IM-14-configure-B-bulk-target.png`, `IM-14-configure-C-many-target.png` | Validate, then `publishLabRule` for each target; add apply-to-several to A and Copy from to C |
| 4 | **SC-05 / SC-06** "a named subset of questions… a named subset cannot be empty" | admin/configure-skill C | Choosing "named questions" in the sentence builder is a dead end: "Tick at least one question" with nothing to tick | `components/lab/configure/sentence-builder.tsx:68-87`; shot `SC-05-configure-C-subset.png` | Inline subset checkboxes in C |
| 5 | **SC-19** "review everything it will ask of the student and the evaluator, together" | admin/configure-skill C | When evidence is affected, the publish dialog shows only the impact, with no previews or change list | `impact.tsx:462`; shot `SC-19-configure-C-dialog.png` | Always show "What you changed" plus both previews |
| 6 | **SC-07** "response scale is program-configured" | admin/configure-skill A, B, C | The scale top reverts to 5 after publish (a scale of 7 with pass mark 6 becomes 5 with an invalid pass mark) | `lib/lab/configure.ts:172` | Persist `scaleMax` |
| 7 | **AE-07** "Removing a question or a level must remove it from any rule that referenced it" | admin/configure-skill A (fields.tsx), C | Removal filters by length without re-indexing: removing a middle level or question shifts later minimums or "must be Yes" picks onto the wrong one (static) | `components/lab/configure/fields.tsx:210,306,320` | Key rules by stable id, not index; add a test |
| 8 | **ST-01** "see the skills expected of them on a course, which are mandatory, and how far…" | student/home A, B, C (A is marquee) | A lists required skills only, with no course and no non-mandatory skills. B has no course dimension. C has counts per course but no skill list | shots `ST-01-student-home-A/B/C.png` | Course switch on My progress listing mandatory then other expected skills, each with its state |
| 9 | **ST-13** "confirmation of what was submitted, to whom, in what role, and in which setting and location" | student/request-signoff A, B (marquee) | The confirmation gives a name and "2 skills in one request", but no skill names, role, setting or location | shots `ST-13-student-request-signoff-A/B.png` | Confirmation lists the skills, then "Sent to {name}, {role} · {setting}, {location}" |
| 10 | **ST-07** "no placement… full list of settings" (location recorded) | student/log-skill, request-signoff A, B (code only) | Full list shown, but `askLocation` is never read, so no location is captured | code only | Render a location field when `askLocation` |
| 11 | **ST-10** (Fix path) | student/fix-returned A, B | The further attempt captures no details and its setting is hard-coded to Clinical | `lib/v2/student.ts:768` | Reuse the Send details step in Fix |
| 12 | **RV-01** "correct and resend a submission that was returned… or that has not yet been assessed" | student/fix-returned A, B; student/my-requests A, B | Fix has no setting, location, date or details field to correct (the return reason asks for the setting). A waiting request has no correct-and-resend action | `components/lab/student/fix.tsx` FixForm; `lib/lab/student.ts:727-751`; shots `RV-01-*.png` | Prefilled editable Where and details in Fix; "Change and resend" on rows not yet assessed |
| 13 | **SH-04** "how many counted, how many outstanding and how many returned" | student/record A, B | No Returned count; requests waiting with an evaluator are absent | shots `SH-04-student-record-A/B.png` | Add the Returned and Waiting figures to Record |
| 14 | **EV-04** "see the details the student supplied, and the self-evaluation" | evaluator/evaluation-form A, B, C (A marquee) | The student note is cut to 2 lines with no expand; date performed is not shown | `components/lab/evaluator/fields.tsx:70`; marquee shot `marquee/form.png` | Show every submission detail, and the note in full |
| 15 | **EV-06** "feedback mandatory… cannot be submitted without it" | lab-instructor/lab-batch-grid A, B | No feedback field at all; Save checks only that one result exists | `use-lab-grid.tsx`; lead grep 0 hits; shots `EV-06-lab-batch-grid-A/B.png` | Feedback per cell or row, required when the skill requires it |
| 16 | **AR-01** "every evaluation awaiting approval, with the student, skill, course, setting, location, evaluator and role" | reviewer/approvals A (marquee "Approvals") and admin/approvals A: no location; B: only in the side panel; C board: no course, setting, location or role | Location absent from the marquee queue (runtime: "NURS 350 · Clinical, Inpatient") | shots `AR-01-*.png`, `marquee/queue.png` | Add location to the course/setting cell in A; add the facts to B rows and C cards |
| 17 | **AR-03** "examine the full set of responses" | reviewer/review-item A, B, C | Level skills show only the level, with no Met/Unmet; scored skills have no per-question scores; the self-evaluation note is computed but not rendered | `lib/v2/queue.ts:476-513`, `components/lab/reviewer/review-parts.tsx:34-67`; shots `AR-03-*.png` | Render all response rows from the queue model |
| 18 | **RP-01** "What is currently applied must be evident, and each filter removable on its own" | all 19 reporting variants (dashboard A-F, drill, attainment, export, director) | All 7 filters exist and each can be removed, but with 2 or more applied the page shows only "Filters 2"; the chips appear only inside the menu | `components/lab/.../scope-bar.tsx:135-168`; shots `RP-01-*.png` | Show the applied chips on the bar itself, each with its remove button |
| 19 | **RP-09** "a filter combination that cannot produce evidence must be explained" | 13 variants: drill A, B; attainment A, B; export A, B; director dashboard A, B, C; reports A, B; director attainment A, B (VARIANT-GAP; dashboards A-F meet it) | Silent zeros ("0 of 5 · Behind", "0 rows") | The explanation is called only from `lib/lab/dashboard.ts:575`; shots `RP-09-*.png` | Call the same explanation in every reporting screen |
| 20 | **AE-04** four states distinguished (and OD-03) | director/reports A, B (VARIANT-GAP) | The "Unmet" column merges no evidence with evidence that does not qualify, which quietly decides OD-03 on one screen | `components/lab/director/reports.tsx:43,54,65`; shot `AE-04-director-reports-B.png` | Use the four engine states with their labels |
| 21 | **CM-02 / CM-04** search by cohort, term, year; mapped and mandatory counts per offering | admin/course-mapping B (VARIANT-GAP; A meets both) | B's offering list cannot be searched or filtered by cohort, academic year or professional year, and has no per-offering counts | shot `CM-02-admin-course-mapping-B.png` | Reuse A's offering filters and counts in B's skill panel |
| 22 | **IM-10** "see how many skills still require configuration and work through them" | admin/configure-skill A, B | The library shows the count, but Configure has no "n left" or "Configure next" after Publish | `admin-configure-skill-a.tsx:109-120`; shots `IM-10-configure-skill-A/B.png` | After Publish: "{n} left to configure" with a Configure next button |
| 23 | **SL-06 / SL-03** program list of categories and tags | admin/settings A, B | Deactivating in Settings is page-local, and a category created in Settings is never offered in Add a skill (two vocabularies) | `lib/lab/settings.ts:87-93` | One shared category/tag list with an active flag, read by Settings, pickers, library and reports |
| 24 | **SL-02** (display) | admin/skills-library A, B, C | Description is not shown in the skill panel and not editable | `components/lab/library/skill-panel.tsx:74-98` | Add a Description fact and an edit field |

### P2 (36 rows, short)
- **SL-01 / REQ 1.6:** starting points A and B offer 5 example lists, which conflicts with "Prism does not supply a standard skills library". This is Phase 2 and hidden in present mode; ledger D-X5 marks it PENDING-ROMIT.
- **SL-09:** a name typed on Send never reaches the directory, because it is lab-local (`request-parts.tsx:5`).
- **Import (Phase 2):**
  - IM-04: no descriptions or criteria read from the file.
  - IM-05: no split, no merge of two arbitrary rows, no adding a new entry.
  - IM-11: import C has no import-name field (VARIANT-GAP with A and B).
  - IM-15 / OD-12: no seam at all.
  - SL-06: the import pickers ignore inactive.
- **Add several C:**
  - IM-05: no per-line edit.
  - IM-06: names already in the library are only skipped, with no keep-both or replace.
- **REQ 4.1 / SC-07:** Scored carries "Proposed: not part of the agreed criteria types", but it is required by REQ. The model list is a closed union.
- **SC-06:** nothing helps with a 50 to 100 question set (paste, sections).
- **SC-19:** rule impact A has no student or evaluator view.
- **CM-01:** course mapping B has no academic year.
- **Student submission and history:**
  - ST-03: the Log and Send pickers cannot isolate skills already submitted.
  - ST-11: Send never asks for a self-rating but says "with your self-rating".
  - ST-12: the offline "Keep both" note conflict gives two notes.
  - ST-13: the Log A confirmation is a count only.
  - RV-04: Fix offers past evaluators only (no lab instructor, no new name), and the further attempt still lists the original evaluator.
  - SH-01: Record has no attempt numbers and no open or returned entries.
  - SH-04: home and my-requests B never show counted.
  - SH-06: skill detail cannot narrow to one course.
- **Evaluator and lab grid:**
  - EV-04: the lab grid has no details, so it is N/A.
  - EV-05: outcome only.
  - EV-07: "Session saved" does not say whether results count now or wait, and the Submitted step reuses the preceptor receipt.
  - EV-08 / OD-06: the seam is a fixed union.
- **AR-04:** Approve has no note field.
- **Reporting:**
  - Admin approvals B has no per-evaluation rows.
  - RP-02 / RP-03 (director reports): states merged, no mandatory marker.
  - RP-04: director reports has no By tag view (admin attainment does disclose the overlap: "Tags overlap: 43 records count under more than one tag").
  - RP-06: drill and director links leave the report.
  - RP-08: no "Counting evidence from X only" line outside the dashboards and attainment.
  - RP-10: detail rows cover required records only (`lib/lab/attainment.ts:386-389`).

## 3. Contradictions with the Oct 26 call and the ledger
| Item | Screen · variants | What contradicts | Evidence |
|---|---|---|---|
| D-X27 (rule write-back) | configure B, C | The bulk publish paths report success and write nothing. Publish also drops student fields, self-evaluation and the scale top | see P0 7, 8 and P1 3, 6 |
| D-X25 (assign elsewhere is a handoff, not a return) | export (static) | The reviewer's "Assign to someone else" stores status and decision "returned" (`lib/lab/reviewer.ts:206`), so the export reads it as Returned | code only |
| Call #4 ("5 attempts, 3 count") Thursday | configure A, B, C live Preview; rule impact A | The counting line appears only on Check, in the C dialog and on rule impact B | SC auditor runtime |
| Call #9 (Mandatory / Recommended / Optional is PROPOSED vs CM-03) | course-mapping A, B; skill detail "Recommended this term" | Presented as settled, with no Proposed tag | `lib/v2/labels.ts:104` |
| Call #13 (Assign as an action when the evaluator is not assigned) | admin/approvals B | "Evaluator not assigned 19" is plain text with no Assign | EV/AR auditor runtime |
| Call #2 vs REQ | configure A, B, C | Scored marked "Proposed: not part of the agreed criteria types", but REQ 4.1 and SC-07 require it | `lib/lab/configure.ts:94` |
| D-X12 (name the two "required" sets apart) | student/home A, B, C | "Required skills achieved" does not say which set (skill detail says "Required this term") | `components/lab/student/progress.tsx:33,182,433` |
| RV-05 vs D-X1 (PENDING-ROMIT) | reviewer/student-record A, B | Offers "Request a correction" on counted evaluations ("keeps counting until the correction comes back"). This is the delegated default D-X1, not an edit, but RV-05 says counted evidence "cannot be edited or resent" | Romit to confirm D-X1 |

**Checked and consistent:**
- Call items 1, 2, 3, 5, 8, 10, 11, 12, 14 and 20.
- D-L1: "In progress (n of m)"; "Not yet met" appears 0 times in the lab.
- D-L2: one link per request.
- D-L3: the Approvals row is always shown.
- D-L4: "My progress".
- D-L5 / D-X30: full width at 1440 with no overflow.
- D-X1: no reopen anywhere; D-X3; D-X6; D-X13 (apart from the RP-10 scope); D-X14.
- Call items 17 and 18: no heat map, no remediation wording.

## 4. What I am unsure about
- **Engine tests:** `tests/engine/*` test `lib/engine`, but the lab runs `lib/v2/rules.ts` `runRule`. The AE-03, AE-06 and AE-07 engine tests therefore do not cover the code the lab actually runs, and AE verdicts rest on reading `lib/v2`.
- **Code-only verdicts:**
  - SL-06 across pages (the Settings overlay is page-local by design of the lab).
  - SL-11 on Send.
  - ST-07.
  - AE-01 to AE-07.
  - AR-06 end to end.
  - D-X25 in the export.
- **Import is simulated:** it never writes the store (`use-import-session.ts:5`), so IM-09 to IM-11 provenance is shown only for seeded batches.
- **IM-06 and IM-08:** Replace appears only for an unconfigured twin, and a fully unreadable line shows "Text could not be read" rather than the raw glyphs. Both are marked MET as deliberate guards; worth a PM look.
- **Attainment crash:** one client-side error on `/lab/admin/attainment?variant=A&view=tags`. It did not reproduce on two retries, probably hot reload from concurrent edits.
- **Unaudited statements:** REQ 1.4 and OD-02, OD-04, OD-05, OD-09 and OD-13 were not audited for a seam (marked UNCHECKED, not MISSING).
- **Missing screenshots:** some findings have no dedicated screenshot: SL-06, ST-05/08/09 (the crawl shot covers Send), ST-10 (the ST-13 shot shows the sent state) and AR-03 B. Their evidence is file:line plus the auditor's runtime observation.

## 5. Full matrix
One line per requirement x screen row. Status key:
- MET
- PARTIAL
- MISSING
- VARIANT-GAP (some variants lack it)
- SEAM (OD seam present or absent)
- UNCHECKED

Each row ends with its priority, P0 to P2.

| REQ | Class | Screen | Variants | Status | P | Evidence / what is missing |
|---|---|---|---|---|---|---|
| REQ 1.4 | open-decision | not audited |  | UNCHECKED |  | No auditor checked whether a seam exists; Lists A carries 'Standards are managed in Program details.' (call #12) which touches OD-02. |
| REQ 1.5 | engine | admin/configure-skill | A, B, C | MET |  | apps/skills-checklist/admin/lib/lab/configure.ts:194-205 withModel clears levelMinimums/questionRule/scoredRule and model-specific lists; configure.ts:498-513 engineRuleOfLab nulls questionRule/scoredRule outside their model; components/lab/configure/fields.t… |
| REQ 1.5 | engine | admin/rule-change-impact | A, B | MET |  | Reads the same LabRule and engine (admin-rule-impact-a.tsx:28 useConfigure); no independent criteria editing; edit link goes to configure step=rule. |
| REQ 1.6 | ui | admin/skills-library | A, B, C | MET |  | Library rows come from program data badged 'Sample data'; category/tag vocab derived from the program's own library (lib/lab/library.ts:511 pickerOptions, components/lab/library/category-tag-pickers.tsx:7). Naming section lets the program rename 'skills' (lib… |
| REQ 1.6 | ui | admin/starter-library | A, B | PARTIAL | P2 | REQ says Prism supplies no library/taxonomy; screen ships example lists (unresolved REQ vs D-X5 conflict) · Starting points screen offers 5 example lists by discipline (runtime: 'Example lists to copy and edit. Your program owns the copy.'); flagged PENDING-R… |
| REQ 4.1 | engine | admin/configure-skill | A, B, C | PARTIAL | P2 | Scored labelled Proposed although REQ 4.1 requires it; adding a model is a code change (closed union), not a registry entry. · apps/skills-checklist/admin/lib/lab/configure.ts:83-94 LAB_MODELS binary/question/demonstration/scored all offered; runtime: four ra… |
| SL-01 | ui | admin/skills-library | A, B, C | MET |  | No shipped list; empty state offers add / add several / import (components/lab/library/library-chrome.tsx:208-226); data badged Sample data |
| SL-01 | ui | admin/starter-library | A, B | PARTIAL | P2 | Conflicts with SL-01 wording; D-X5 is a ledger decision, not REQ · Example starter lists by discipline (admin-starter-library-a.tsx:8 PENDING-ROMIT note; D-X5). runtime opened A,B. shot /tmp/sc-reqaudit/shots/SL-01-starter-library-A.png |
| SL-02 | ui | admin/add-skill | A, B, C | MISSING | P0 | No Description field in any add path (Skill type already has description?: lib/v2/types.ts:221) · Sheet A fields only Name/Category/Tags/Required (components/lab/library/skill-sheet.tsx:106-135); inline row B Name/Category/Tags (inline-add-row.tsx:245-266); a… |
| SL-02 | ui | admin/skills-library | A, B, C | PARTIAL | P1 | Description absent from detail panel and edit sheet · Status: 4 states incl. Inactive (lib/lab/library.ts:29-39), tabs/board show it (runtime tabs 'Inactive 2'). Description: not shown in SkillPanel facts (components/lab/library/skill-panel.tsx:74-98) nor edi… |
| SL-02 | ui | admin/retire-deactivate | A, B | MET |  | Deactivate/reactivate flows (components/lab/admin-b/retire-flow.tsx:4, lib/lab/retire.ts:9-13, lib/v2/admin-actions.ts:193 setSkillsActive). runtime opened A,B |
| SL-03 | ui | admin/add-skill | A, B, C | MET |  | Single-choice CategoryPicker with 'None' (category-tag-pickers.tsx:464-523) in sheet A (skill-sheet.tsx:122), inline row B (inline-add-row.tsx:261), add-several C (add-several-sheet.tsx:375). runtime: [data-category-picker]=1 in A,B,C and flow set-up-skills/a… |
| SL-03 | ui | admin/import-ai-review | A, B, C | MET |  | Per-row CategoryPicker in review (import-parts.tsx:281); runtime: 23 pickers after expanding one category in A and C |
| SL-03 | ui | admin/categories-tags (was admin/settings, D-L21) | A, B | PARTIAL | P1 | A category created in Settings is never offered in Add a skill, and one created in Add a skill only appears in Settings via the skill · Categories tab with counts, inline create, deactivate, delete-only-unused (lib/lab/settings.ts:113-118; admin-b/settings-pa… |
| SL-04 | ui | admin/add-skill | A, B, C | MET |  | TagsPicker chip input, any number (category-tag-pickers.tsx:546-684) in A (skill-sheet.tsx:126), B (inline-add-row.tsx:265), C (add-several-sheet.tsx:379). runtime [data-tags-picker]=1 each |
| SL-04 | ui | admin/skills-library | A, B, C | MET |  | Tags under name (library-table.tsx:62-64; admin-skills-library-b.tsx:68), Tags column (library-table.tsx:84-88), panel Tags fact (skill-panel.tsx:78-80) |
| SL-04 | ui | admin/import-ai-review | A, B, C | MET |  | Per-row TagsPicker (import-parts.tsx:285) |
| SL-04 | ui | admin/categories-tags (was admin/settings, D-L21) | A, B | MET |  | Tags tab with skills + categories spanned (lib/lab/settings.ts:120-129); runtime 'Tags 3' |
| SL-05 | ui | admin/add-skill | A, B, C | MET |  | Create "{typed}" item in CategoryPicker (category-tag-pickers.tsx:508-516) and TagsPicker (:558-561). runtime: typing 'Zeta audit cat'/'Zeta audit tag' shows [data-create-category] and [data-create-tag] in A, B and C (shots SL-05-add-skill-A/B/C.png) |
| SL-05 | ui | admin/skills-library | A, B, C | MET |  | Edit sheet uses the same pickers (skill-sheet.tsx:122-126, mode=edit) |
| SL-05 | ui | admin/import-ai-review | A, B, C | MET |  | Same pickers per row (import-parts.tsx:281-285) |
| SL-06 | ui | admin/categories-tags (was admin/settings, D-L21) | A, B | PARTIAL | P1 | The banner's promise is not kept anywhere else · Deactivate marks the entry Inactive with StatusBadge and a banner 'stays where it is used, marked inactive, and is no longer offered' (admin-b/settings-page.tsx:97-98,332; admin-settings-b.tsx:100-101,249). The… |
| SL-06 | ui | admin/add-skill | A, B, C | MISSING | P0 | Inactive categories/tags still offered; no exclusion · CategoryPicker/TagsPicker have no active/inactive concept (props category-tag-pickers.tsx:453-462, 525-534); options = pickerOptions(rows) from library rows (lib/lab/library.ts:511-520). The only SL-06 te… |
| SL-06 | ui | admin/skills-library | A, B, C | MISSING | P0 | An assigned-but-deactivated category/tag is not identifiable as inactive on the skill · Skill panel Category/Tags (skill-panel.tsx:77-80), table Tags column (library-table.tsx:84-88), tree row tags (admin-skills-library-b.tsx:68) and edit sheet render plain n… |
| SL-06 | ui | admin/import-ai-review | A, B, C | MISSING | P2 | Same gap · Import review pickers use file headings + session tags only (import-parts.tsx:247-248); a tag deactivated in Settings is not excluded |
| SL-07 | ui | admin/settings | A, B | MET |  | Clinical settings tab with sites, evidence, rules, courses using each (lib/lab/settings.ts:131-145), inline create/deactivate. runtime: 'Clinical settings 3' in A and B (?tab=settings opened) |
| SL-08 | ui | admin/settings | A, B | MET |  | Lab instructors tab, inline create with Name + Email (admin-b/settings-page.tsx:275-310; admin-settings-b.tsx:182-205). runtime: 'Email' field present on ?tab=instructors in A (after 'Add a lab instructor') and B |
| SL-08 | ui | admin/evaluator-directory | A, B | MET |  | 'Add an evaluator' opens AddEvaluatorDialog name + email + role (admin-a/evaluator-parts.tsx:274-280, evaluator-frame.tsx:69). runtime: button present in A and B |
| SL-08 | ui | student/request-signoff | A, B | MET |  | Student can enter a new evaluator by name and email (student2/request-parts.tsx:62-80 NewEvaluator, newEvaluatorErrors). Code-only for the field (behind a step) |
| SL-09 | ui | admin/evaluator-directory | A, B | MET |  | Unverified names first with 'Adopt or merge' + suggested matches (admin-a/evaluator-parts.tsx:99,154,198-215; lib/lab/evaluators.ts:4-6,136-139). runtime A: 14 'Adopt or merge' buttons, '14 unverified names'; B (site first) shows '14 unverified names' and an … |
| SL-09 | ui | student/request-signoff | A, B | PARTIAL | P2 | End-to-end hand-off (typed name -> directory unverified row) not wired in the lab · Student enters a new name+email (request-parts.tsx:62), but sending is lab-local (request-parts.tsx:5 'the shared store stays read only'), so a name typed here never reaches t… |
| SL-10 | ui | admin/skills-library | A, B, C | MET |  | Name: searchbox (library-table.tsx:218; admin-skills-library-b.tsx:142; -c.tsx:167). Category + tag: LibraryFilterMenu (library-filter.tsx:52-96) in A (via LibraryTable), B (:143), C (:168). Status: tabs in A/B (runtime 'All 178 / Not configured 16 / Configur… |
| SL-11 | engine | admin/skills-library | A, B, C | MET |  | Deactivate writes the store (use-library.tsx:103-120 -> lib/v2/admin-actions.ts:193 setSkillsActive), banner 'Evidence is kept. It no longer appears in mapping, student selection or reports'; panel 'Withdrawn from mapping' (skill-panel.tsx:86-87). runtime: In… |
| SL-11 | engine | admin/retire-deactivate | A, B | MET |  | Impact-first deactivate/retire/delete flows (lib/lab/retire.ts:9-13; admin-b/retire-flow.tsx). runtime A,B opened |
| SL-11 | engine | reporting (dashboard/attainment) | * | MET |  | isReportable excludes active===false (lib/v2/population.ts:134-137); decision D-X14; facts.skillsInactive (lib/v2/facts.ts:55); tests/lab/library.test.ts:116-120. Code-only in this audit |
| SL-11 | engine | admin/course-mapping | A, B | MISSING | P0 | Deactivated skills still offered and still mapped, with no inactive cue · runtime: inactive 'Stool' listed and mapped Optional, 'Urine: Sterile Urine' mapped Recommended in NUR 101 (A); both listed in B. Code: skillRowsFor maps every s.skills with no active f… |
| SL-11 | engine | student/log-skill | A, B | MISSING | P0 | Deactivated skills selectable by students · runtime A: 'Stool' (Achieved) and 'Urine: Sterile Urine' offered as 'Not selected' in the picker; B: 'Search 147 skills' = 145 published + 2 inactive. Code: pickRows uses openToLog (lib/lab/student2.ts:108-112), whi… |
| SL-11 | engine | student/request-signoff | A, B | MISSING | P0 | Same as log-skill · Code-only: the request picker uses the same pickRows (components/lab/student2/request-parts.tsx:31,51), so inactive skills are offered; the skill list sits behind a step the probe did not reach (shots SL-11-request-signoff-A/B.png show the… |
| IM-01 | ui | admin/add-skill | C | MET |  | Add several by name (phase 1 bulk path, CALL 10-26) add-several-sheet.tsx:289-424; runtime: textarea #several-names, '2 skills will be added' |
| IM-01 | ui | admin/import-ai-review | A, B, C | MET |  | File/paste import (Phase 2, 'Later' badge at runtime in A,B,C); runtime 'Create 153 skills' (A confirm), 'Create 142 skills' (B,C) |
| IM-01 | ui | admin/skills-library | A, B, C | MET |  | More menu: 'Add several by name (bulk add)', 'Start a new list', 'Import a file Later', 'Copy from a starter library Later' (library-chrome.tsx:62-90); runtime confirmed in A,B,C |
| IM-02 | ui | admin/import-ai-review | A, B, C | MET |  | ACCEPT='.pdf,.docx,.doc,.xlsx,.xls,.csv,.txt' (import-parts.tsx:59), hint 'PDF, Word or Excel. Any layout, no template.' (:102); C paste + drop several files (admin-import-c.tsx:151-156). Phase 2 (Later). The lab parses a simulated sample text, not real binar… |
| IM-03 | engine | admin/import-ai-review | A, B, C | MET |  | readChecklist reads plain/numbered/bulleted lines, headings, marks (lib/lab/import.ts:189-193); tests/lab/import.test.ts:46 'reads plain lines with no number or dash as skills', :245 pasted flat list |
| IM-03 | engine | admin/add-skill | C | MET |  | parseSeveral: plain names or Name/Category/Tags columns, no mapping step (lib/lab/library.ts:452-475) |
| IM-04 | engine | admin/import-ai-review | A, B, C | PARTIAL | P2 | Description and evaluation questions/criteria already in the source are not identified or shown for review (legacy lib/v2/import.ts:42 did propose a description) · Skills + headings as categories + group headings as tags + the file's mark are read (lib/lab/im… |
| IM-05 | ui | admin/import-ai-review | A, B, C | PARTIAL | P2 | Split, add a new entry, general merge · Present: rename (InlineInputEdit per row, import-parts.tsx:275; runtime 23 'Name for line' edits after expanding one category in A and C), category/tags edit (:281-285), discard ('Leave out', import.ts:460; bulkLeaveOut… |
| IM-05 | ui | admin/add-skill | C | PARTIAL | P2 | No per-line review controls (acceptable for the phase-1 paste path if textarea editing counts as edit) · Add several shows a live preview and skipped lines (add-several-sheet.tsx:382-400) but no per-line edit/merge/split; editing means editing the textarea |
| IM-06 | ui | admin/import-ai-review | A, B, C | MET |  | findDuplicates by similarity (lib/lab/import.ts:315-357); options Skip / Keep both, Replace offered only when the library skill is not configured (import.ts:466-467); runtime B and C: ['Keep both','Skip, keep the library one'] (the sample's library twins are … |
| IM-06 | ui | admin/add-skill | C | PARTIAL | P2 | Skip is the only outcome for a duplicate in the bulk-add path · Add several silently skips names already in the library (lib/lab/library.ts:454 parseSeveral kind 'in-library'; SKIP_REASON add-several-sheet.tsx:313-317). runtime: a repeated name -> '1 skipped'… |
| IM-07 | ui | admin/import-ai-review | A, B, C | MET |  | Heading -> category, section carried, 'section' fix group (import.ts:367,473); review grouped by file categories with a per-row CategoryPicker (import-parts.tsx:244-296); runtime: '156 skills read in 10 categories', pickers per row in A and C; C: 'A line endi… |
| IM-08 | ui | admin/import-ai-review | A, B, C | MET |  | 'Text could not be read' fix group with line number + best reading (import-parts.tsx:62,230-233; import.ts:691-697); furniture lines listed with original text (import-parts.tsx:297-316); NotCreatedList with reasons (:502-532; A confirm 'Not created: 3 left ou… |
| IM-09 | engine | admin/skills-library | A, B, C | MET |  | Status 'Not configured' badge/tab/column (lib/lab/library.ts:29-39); banner 'Skills that are not configured cannot be sent or mapped' (library-chrome.tsx:184-185) runtime A,B,C; add paths save not configured (use-library.tsx:62,78) |
| IM-09 | engine | admin/course-mapping | A, B | MET |  | setLevel blocks unconfigured (lib/lab/mapping.ts:335-342); rows show 'Not configured' (admin-a/mapping-parts.tsx:207-213,257) |
| IM-09 | engine | student/log-skill | A, B | MET |  | openToLog requires configured && published (lib/v2/student.ts:492-495); submit guard :513 |
| IM-09 | engine | admin/import-ai-review | A, B, C | MET |  | Confirm: 'Each starts not configured, so students cannot send it' (import-parts.tsx:542); done banner (:561-562); runtime A confirm and done |
| IM-10 | ui | admin/skills-library | A, B, C | MET |  | A/B tab 'Not configured 16' + banner action 'Configure 16 next' (library-chrome.tsx:184); B per-category rollup (library.ts:276-279, admin-skills-library-b.tsx:43); C 'Not configured' board column with 'Configure {n} together' (admin-skills-library-c.tsx:67).… |
| IM-10 | ui | admin/configure-skill | A, B | PARTIAL | P1 | Working through the queue means returning to the library after each skill · No remaining count and no 'next not configured' step after Publish (admin-configure-skill-a.tsx:109-120; configure/use-configure.tsx:102-124). runtime: no 'N left/still to configure' … |
| IM-10 | ui | admin/configure-skill | C | MET |  | Configures one or several (?skills=a,b,c from 'Configure together') (admin-configure-skill-c.tsx:6) |
| IM-11 | ui | admin/skills-library | A, B, C | MET |  | 'Came from' = batch label / 'Program list' / 'Added by hand' (lib/lab/library.ts:151,178,206); shown in SkillPanel in every variant (skill-panel.tsx:97) and as a table column in A (library-table.tsx:90, hidden in the default saved views library.ts:332-333) |
| IM-11 | ui | admin/import-ai-review | A, B | MET |  | Import name: A confirm field 'Import name ... so you can tell which skills came from this file' (import-parts.tsx:481-488; runtime A), B footer 'Name this import' popover (admin-import-b.tsx:130-145); plan 'Nothing else in your library changes' (import.ts:680… |
| IM-11 | ui | admin/import-ai-review | C | VARIANT-GAP | P2 | C cannot name the import; provenance falls back to the default file stem · No import-name field in C (no batchName in admin-import-c.tsx; runtime getByLabel(/Import name/) = 0). shot /tmp/sc-reqaudit/shots/IM-11-import-C-clear.png |
| IM-12 | ui | admin/add-skill | A, B, C | MET |  | Sheet A 'Save and configure' (skill-sheet.tsx:139-143), inline row B (inline-add-row.tsx:267), C also renders the single SkillSheet (admin-skills-library-c.tsx:136); primary 'Add a skill' on every library variant |
| IM-13 | ui | admin/import-ai-review | A, B, C | MET |  | Behaviour, not copy (repeated helper removed 2026-10-27): nothing is written before Create on Confirm (session.confirm only; A Fix Next disabled until no line is open, admin-import-a.tsx footer; Accept all suggestions has Undo, import-parts.tsx FixIntro; tests/lab/import.test.ts 'Accept all fills every open line'); Create disabled with a reason until every line is decided (admin-import-a.tsx:135; tests/lab/import.test.ts:118); A has a separate Confirm step; Disc… |
| IM-14 | ui | admin/skills-library | A, B, C | MET |  | Copy settings dialog from the bulk selection/row (components/lab/library/row-actions.tsx:142-197; use-library.tsx:130-135); 'Configure together' (configure-many.ts) |
| IM-14 | ui | admin/configure-skill | A, B, C | MET |  | A 'Copy from another skill' (admin-configure-skill-a.tsx:164); B copy + 'Apply to other skills' (admin-configure-skill-b.tsx:152-153, configure/bulk-apply.tsx); C several at once (admin-configure-skill-c.tsx:6) |
| IM-14 | ui | admin/configure-skill | A, B | PARTIAL | P1 | Apply to several is a no-op with a success message; A has no apply to several. · Copy from another skill works in A and B (bulk-apply.tsx:20-53, replaces the draft via fromV2). Apply to several: A has none; B 'Apply to other skills' sheet (bulk-apply.tsx:55-1… |
| IM-14 | ui | admin/configure-skill | C | VARIANT-GAP | P1 | False success: many-skill publish writes nothing; no copy-from in C. · Many mode (?skills=...) PublishManyDialog onPublish only sets manyDone (admin-configure-skill-c.tsx:190-193); the chosen evidence mode is ignored and no rule is written. Runtime: 4 skills,… |
| IM-15 | open-decision | admin/import-ai-review | A, B, C | SEAM | P2 | No seam or placeholder for the OD-12 option 'propose a model' · No seam: interpretation hard-codes the 'leave it to the program' branch (lib/lab/import.ts:11 'never an evaluation model or criteria (OD-12 open)'; confirmSentence 'Nothing about a model' import.… |
| SC-01 | ui | admin/configure-skill | A, B, C | MET |  | Runtime: ?skill=sk-pressure-injury opens 'Not configured' with an empty rule in A/B/C; banner 'Students cannot send this skill and it cannot be mapped until it is published' (admin-configure-skill-a.tsx:189-191, -b.tsx:170). |
| SC-02 | ui | admin/configure-skill | A, B, C | MET |  | configure.ts:135-137 emptyRule model:null; configure.ts:382-385 'Choose an evaluation model. Nothing is chosen for you.'; configure.ts:904 ruleSnapshot throws without model; lib/lab/mapping.ts:335 unconfigured cannot be mapped. Runtime: all four cfg-model-* d… |
| SC-03 | ui | admin/configure-skill | A, B, C | MET |  | fields.tsx:258-299 two label inputs + 'Which outcome qualifies?' radio (qualifyingLabel null by default, configure.ts:139); validateRule configure.ts:387-393 blank/same/missing; C picks the qualifying label in the sentence (sentence-builder.tsx:56-66) with la… |
| SC-04 | ui | admin/configure-skill | A, B, C | MET |  | fields.tsx:310-322 ListEditor add/edit/remove; runtime cfg-question-* and cfg-add-question in A,B,C (C inline until the first question has text, then in the fold). |
| SC-05 | ui | admin/configure-skill | A, B | MET |  | fields.tsx:422-465 radios all/atLeast/subset with a checkbox list (cfg-qsub-*); runtime A question step: 2 subset checkboxes for 2 questions; engine rules.ts:323-329; tests configure.test.ts:278, rule-writeback.test.ts:136. |
| SC-05 | ui | admin/configure-skill | C | VARIANT-GAP | P1 | C cannot configure the named-subset rule; choosing it makes the skill unpublishable. · sentence-builder.tsx:68-87 offers 'named questions' but has no control to pick which questions (QuestionRuleField lives only in RuleSection, which C never renders). Runtime… |
| SC-06 | ui | admin/configure-skill | A, B | PARTIAL | P1 | No bulk entry or grouping for large question sets; usability at 50-100 questions unverified. · Empty subset blocked configure.ts:408; atLeast range 1..M configure.ts:407; subset list scrolls max-h-56 fields.tsx:453. No affordance for a 50-100 question set (ca… |
| SC-06 | ui | admin/configure-skill | C | VARIANT-GAP | P1 | Same as SC-05 C. · Subset picker missing in C (see SC-05), so an empty subset is the only reachable subset state. |
| SC-07 | ui | admin/configure-skill | A, B, C | PARTIAL | P1 | Configured scale top is lost on publish; the reopened rule reverts to 1-5 and becomes invalid. · UI: cfg-scale 'Scale from 1 to' (fields.tsx:323-329, validated 2..10 configure.ts:412) and cfg-srule average/minEach/total in A/B (fields.tsx:467-488) and C (sent… |
| SC-08 | ui | admin/configure-skill | A, B, C | MET |  | fields.tsx:301-308 'Levels, lowest first' ListEditor with move up/down, at least two levels (configure.ts:422); preset only fills labels and stays editable (fields.tsx:233-253). Runtime cfg-level-*, cfg-add-level, cfg-preset-independence in A,B,C. |
| SC-09 | engine | admin/configure-skill | A, B, C | MET |  | configure.ts:194-205 withModel; fields.tsx:149-171 AlertDialog 'Change the model? The rule is rebuilt for the new model...'; C uses the same ModelSection (admin-configure-skill-c.tsx:141). |
| SC-10 | ui | admin/configure-skill | A, B, C | MET |  | Total cfg-need (fields.tsx:364; sentence-builder.tsx:53); LevelMinimums fields.tsx:490-525; C sentence-builder.tsx:105-120,151; lmin<=need configure.ts:431-435; engine rules.ts:414. Runtime A demonstration: 'Add a level minimum' added cfg-lmin-0. |
| SC-11 | ui | admin/configure-skill | A, B, C | MET |  | SettingMinimums fields.tsx:528-563 (A/B), sentence-builder.tsx:133-153 (C); blank/duplicate/sum>need blocked configure.ts:439-446; engine per setting rules.ts:412; test achievement.test.ts:134. Runtime: 'Add a setting minimum' in A,B,C; flow publish set=3 sen… |
| SC-12 | engine | admin/configure-skill | A, B, C | MET |  | Engine rules.ts:411-412 counts only setting==='clinical' with a matching clinicalSetting; tests configure.test.ts:116 'lab never satisfies a setting', configure.test.ts:239, achievement.test.ts:113,124. UI says it: fields.tsx:560 (A/B), admin-configure-skill-… |
| SC-13 | ui | admin/configure-skill | A, B, C | PARTIAL | P0 | Choice options; editing an existing field; write-back on publish. · AddFieldDialog fields.tsx:584-656: label + 5 types (configure.ts:77) + Required; present in A Who signs, B section, C fold. Gaps: (1) Choice list has no way to enter the choices (runtime: one… |
| SC-14 | ui | admin/configure-skill | A, B, C | MET |  | cfg-feedback toggle fields.tsx:709; persisted (configure.ts:893; runtime B reload kept it on); evaluator preview shows Feedback (required/optional) live-panel.tsx:93-96. |
| SC-15 | ui | admin/configure-skill | A, B, C | PARTIAL | P0 | Self-evaluation setting does not persist or drive the student flow. · Toggles cfg-self and cfg-approval in A,B,C (fields.tsx:710-711). Approval persists (configure.ts:894). Self-evaluation is not written back: SkillConfig has no flag (lib/v2/types.ts:140-181)… |
| SC-16 | ui | admin/configure-skill | A, B, C | MET |  | Role checkboxes preceptor/faculty/lab-instructor fields.tsx:665-679 (configure.ts:75-76); at least one required configure.ts:454; persisted evaluatorRoles configure.ts:892. Runtime cfg-role-* in A,B,C. |
| SC-17 | ui | admin/configure-skill | A, B, C | MET |  | Model options carry a consequence line (configure.ts:97-102; C via tooltip); 'Choose how it's judged first. The criteria depend on it.' (fields.tsx:257,355); live rule sentence in the preview panel and footer (live-panel.tsx:140-234); C 'The sentence then sho… |
| SC-17 | ui | admin/rule-change-impact | A, B | MET |  | RuleDiff now/after (admin-rule-impact-a.tsx:16-25); runtime both show 'How many times Now ... After ...'. |
| SC-18 | engine | admin/configure-skill | A, B, C | MET |  | validateRule configure.ts:378-459; publishLabRule refuses (configure.ts:934-935); use-configure.tsx:106 guard. Runtime B: duplicate levels + setting minimum 5 > need 2 + lab-only signer: 'Fix 4 problems to publish', not published (shots/SC-18-configure-B.png)… |
| SC-19 | ui | admin/configure-skill | A | MET |  | Check step CheckPanel (impact.tsx:330-400): 'What you changed' (configDiff incl. roles, student fields, feedback, self-evaluation, approval), impact, Student sees + Evaluator sees side by side at 1440. Runtime shots A-<model>-check.png. |
| SC-19 | ui | admin/configure-skill | B | MET |  | Check and publish section with CheckPanel previewColumn=false (admin-configure-skill-b.tsx:182-185) plus the preview panel with both views (runtime: panel 375px wide at 1440). |
| SC-19 | ui | admin/configure-skill | C | PARTIAL | P1 | C's final review omits what the student and evaluator will be asked, and the change list, whenever existing evidence changes. · PublishDialog (impact.tsx:435-487): when the change affects evidence the dialog shows impact only; Student/Evaluator previews rende… |
| SC-19 | ui | admin/rule-change-impact | A | PARTIAL | P2 | No preview of what the student/evaluator see in A (lower need: the configure Check covers it). · Rule impact A shows rule diff + impact only; no student/evaluator view (admin-rule-impact-a.tsx). B has 'What each role sees after publish' (admin-rule-impact-b.t… |
| CM-01 | ui | admin/course-mapping | A | MET |  | mapping-parts.tsx OfferingsTable row code+cohort+Year n+name; OfferingPanel meta `${term} · ${academicYear} · Year ${py} · ${cohort}`; runtime A 'NUR 101 BSN 2028 · Year 2 Fundamentals of Nursing'; tests/lab/mapping.test.ts:35 |
| CM-01 | ui | admin/course-mapping | B | PARTIAL | P2 | academic year on each offering row · mapping-parts.tsx SkillPanel offering cell shows code name + cohort · Year n only; no academic year, term only implicit from the toolbar |
| CM-02 | ui | admin/course-mapping | A | MET |  | admin-course-mapping-a.tsx toolbar: SearchField oq, Term (grouped by academic year, mapping-frame.tsx:53), Cohort, Professional year; filterOfferings haystack includes academic year (mapping.ts:70); runtime toolbar 'Fall 2026 / All cohorts / All years'; tests… |
| CM-02 | ui | admin/course-mapping | B | VARIANT-GAP | P1 | search and cohort / academic year / professional year filters for offerings · admin-course-mapping-b.tsx toolbar has skill search, Term, Show only; SkillPanel offerings table searchable={false}, no cohort/year/professional-year filter; runtime B toolbar 'Fall… |
| CM-03 | ui | admin/course-mapping | A, B | MET |  | LevelSelect per offering (mapping-parts.tsx OfferingPanel/SkillPanel); mandatory is a distinct level; non-mandatory split into Recommended/Optional per CALL 10-26 #9 (see callContradictions: not marked Proposed); tests/lab/mapping.test.ts:68 |
| CM-04 | ui | admin/course-mapping | A | MET |  | OfferingsTable columns Mapped, Mandatory; panel data-level-totals; runtime 'NUR 101 ... 142 25'; tests/lab/mapping.test.ts:63 |
| CM-04 | ui | admin/course-mapping | B | VARIANT-GAP | P1 | per-offering mapped and mandatory counts · SkillPanel shows per-skill carriers ('n of m courses, k mandatory'); no per-offering mapped/mandatory count anywhere in B |
| CM-05 | engine | student/log-skill | A, B | MET |  | lib/lab/student2.ts:106-115 pickRows includes every openToLog skill regardless of mapping; runtime picker 'Search 147 skills' |
| CM-05 | engine | student/request-signoff | A, B | MET |  | SkillsField uses the same pickRows (request-parts.tsx useRequestDraft) |
| CM-06 | engine | admin/course-mapping | A, B | MET |  | setLevel(state, overlay, offeringId, skillId, level) per offering; B SkillPanel edits each offering's level; tests/lab/mapping.test.ts:97 'lets the same skill differ between offerings' |
| CM-07 | engine | student/record | A, B | MET |  | recordRows groups by skill across courses (student2.ts:286) with skillProgress per student+skill; course filter 'All courses'; skill detail 'Counts across: All your courses' |
| CM-08 | open-decision | admin/course-mapping | A, B | SEAM |  | lib/lab/mapping.ts:8 'Carry-forward between terms is open (OD-01): an edit applies to one offering only'; bulk banner 'Applies to <code>, <term> only' |
| ST-01 | ui | student/home | A | PARTIAL | P1 | course context and the non-mandatory expected skills · progress.tsx RequiredList: required skills with state + parts; runtime 'Required skills 5'. No course grouping, non-mandatory expected skills absent |
| ST-01 | ui | student/home | B | PARTIAL | P1 | which course expects each skill · Mosaic of whole list / required, by section; no course dimension |
| ST-01 | ui | student/home | C | PARTIAL | P1 | the skills per course with progress on each · progress.tsx:427 CourseTable shows per course counts only (Required achieved n of m); no per-skill list |
| ST-02 | ui | student/log-skill | A, B | MET |  | pickRows never restricts by mapping (student2.ts:90 comment, :106); runtime 147 skills |
| ST-02 | ui | student/request-signoff | A, B | MET |  | same SkillPicker rows |
| ST-03 | ui | student/record | A, B | MET |  | Record lists only submitted evidence, grouped by skill (A) or month (B), with search + result/setting/course filters (record-parts.tsx RecordFilters) |
| ST-03 | ui | student/log-skill | A, B | PARTIAL | P2 | a way to isolate submitted skills in the picker · SkillPicker (log-parts.tsx) shows a state word per row but has no 'Already submitted' filter/group; only 'Likely here' + sections |
| ST-03 | ui | student/request-signoff | A, B | PARTIAL | P2 | same · same SkillPicker |
| ST-04 | ui | student/log-skill | A, B | MET |  | A multi-select picker; B 'Send N skills for evaluation' with ready rows |
| ST-04 | ui | student/request-signoff | A, B | MET |  | runtime result '2 skills in one request.' |
| ST-05 | ui | student/log-skill | A, B | MET |  | WhereField radio / Where select include placements + Lab + Simulation (lib/v2/student.ts:685-695); runtime A 'Lab Practice Simulation Practice' |
| ST-05 | ui | student/request-signoff | A, B | PARTIAL | P0 | lab/sim evidence routed to a lab instructor (REQ EV-02) · request-parts.tsx useRequestDraft filters whereChoices to setting==='clinical'; Lab/Simulation cannot be sent for evaluation at all ('not sent for sign-off', lib/v2/student.ts:692) |
| ST-06 | ui | student/log-skill | A, B | MET |  | whereChoices from placements (location as label, clinicalSetting as sub-line), first preselected; runtime 3 placements listed |
| ST-06 | ui | student/request-signoff | A, B | MET |  | PlacementSelect hidden when one placement (request-parts.tsx 'Hidden when there is one placement (inferred, REQ ST-06)'); runtime 'At' select with 3 |
| ST-07 | ui | student/log-skill | A, B | PARTIAL | P1 | location input when no placement · lib/v2/student.ts:689 falls back to program.clinicalSettings with askLocation:true, but askLocation is never read in components/lab (grep: 0 hits) so no location is captured; code-only (no no-placement student opened) |
| ST-07 | ui | student/request-signoff | A, B | PARTIAL | P1 | location · same fallback list (clinical filter keeps program settings); evaluatorsFor(location null); no location captured |
| ST-08 | ui | student/request-signoff | A, B | PARTIAL | P0 | setting-driven role (lab/sim -> lab instructor) · Skill-role axis MET: evaluatorsFor uses evaluatorChoices eligible+reason, disabled radio shows reason, 'Nobody on record can sign off every skill you picked...' (log-parts.tsx EvaluatorPicker). Setting axis mi… |
| ST-09 | ui | student/request-signoff | A, B | PARTIAL | P0 | recorded lab instructors in the list · Recorded preceptors/faculty selectable; 'Someone not listed' takes Full name + Email with validation + 'Not yet recorded' (log-parts.tsx EvaluatorPicker, student2.ts:209). Recorded lab instructors are excluded (student2.… |
| ST-10 | ui | student/log-skill | A | MET |  | detailErrors (student2.ts:63); runtime Save with Unit cleared -> 'Enter the unit.' |
| ST-10 | ui | student/log-skill | B | MET |  | missing() blocks 'Ready'; RowStatus 'Add date, unit' |
| ST-10 | ui | student/request-signoff | A, B | PARTIAL | P0 | details enforced when Send is used without Log · Send opens with likely skills preselected and sends with no date/unit; runtime: Send succeeded after picking only an evaluator |
| ST-10 | ui | student/fix-returned | A, B | PARTIAL | P1 | details and setting on a further attempt · Further attempt is a new submission but captures no date/unit/setting (fix.tsx FixForm: Send to + note only; setting hard-coded 'Clinical' student.ts:768) |
| ST-11 | ui | student/log-skill | A, B | MET |  | SelfEvalFields only for selfEvalEnabled skills (log A region 'self'; log B per entry); flag is an INFER stand-in (student2.ts:74-80) |
| ST-11 | ui | student/request-signoff | A, B | PARTIAL | P2 | self-rating capture when sending without a log entry · No self-rating on Send; scopeSentence still says 'with your self-rating' for self-eval skills even when none was given (request-parts.tsx scopeSentence) |
| ST-12 | ui | student/log-skill | A, B | MISSING | P0 | student note field · No note field (runtime getByLabel(/note/i) count 0; fields are Date performed, Unit, Case reference) |
| ST-12 | ui | student/request-signoff | A, B | MISSING | P0 | student note · request-parts.tsx has no note field |
| ST-12 | ui | student/fix-returned | A, B | MET |  | fix.tsx 'Note for the evaluator (optional)' + 'Kept apart from the evaluator's own comment.' |
| ST-12 | ui | student/offline-sync | A, B | PARTIAL | P2 | conflictChoices offers 'Keep both' for a note (student2.ts:581-587) -> two notes on one submission |
| ST-13 | ui | student/request-signoff | A, B | PARTIAL | P1 | skill names, evaluator role, setting and location · RequestResult (request-parts.tsx): title 'Sent to <name>', '2 skills in one request.', next sentence. Runtime A 'Ready for Aaliyah Ashworth, RN to scan / 2 skills in one request.'; B 'Sent to Aaliyah Ashwort… |
| ST-13 | ui | student/log-skill | A | PARTIAL | P2 | skill names · Saved banner 'N skills synced to your record' with sidebar Where/Date (no role: not yet sent) - acceptable as a pre-send save |
| ST-14 | open-decision | student/log-skill | A, B | SEAM |  | A captures Where once per sitting; B per entry (per skill); lib/store/actions/submissions.ts:85 'OD-07 is OPEN: copied onto each submission' |
| EV-01 | ui | evaluator/evaluation-form, submitted, expired, invitation-email; lab-instructor/lab-batch-grid | A, B, C | MET |  | components/lab/evaluator/frame.tsx:20-36 (light header, 'No account needed', no sidebar); light-frame.tsx:13-22 (no app chrome); runtime: every evaluator/lab text starts 'Harbor University BSN / No account needed', no sign-in text; email 'No account is needed… |
| EV-02 | engine | engine lib/v2 + evaluator/lab screens | all | MET |  | lib/v2/types.ts:138 EvaluatorRole preceptor/faculty/lab-instructor; lib/v2/student.ts:413-419 lab instructor ineligible for clinical; lib/v2/rules.ts:133-134 clinical minimum needs preceptor or faculty; lab grid header 'Lab evidence. Never counts toward a cli… |
| EV-03 | ui | evaluator/evaluation-form | A, B, C | MET |  | components/lab/evaluator/fields.tsx:76-145 renders only skill.choices/levels/questions/feedbackRequired from config (lib/lab/evaluator.ts:220-227); no rule or model control on any form; lab Options menu is lab chrome only. |
| EV-03 | ui | lab-instructor/lab-batch-grid | A, B | MET |  | use-lab-grid.tsx:34-38 labels from config; no config controls. |
| EV-04 | ui | evaluator/evaluation-form | A, B, C | PARTIAL | P1 | full student note (truncated to 2 lines, no expand); date performed · RequestSummary (fields.tsx:205-212) shows student, course, location, setting in all three; SelfNote (fields.tsx:58-73) self-rating + note in A card, B step, C row subline ('Maya rated With … |
| EV-04 | ui | lab-instructor/lab-batch-grid | A, B | N/A |  | Instructor-initiated session; no student submission or self-evaluation exists. |
| EV-05 | ui | evaluator/evaluation-form | A, B, C | MET |  | A one card per skill with Outcome + Feedback (evaluator-form-a.tsx:43-71); B one wizard step per skill + review (evaluator-form-b.tsx:93-103); C table row outcome + per-row sheet with feedback (evaluator-form-c.tsx:79-133). Runtime A: two skills each with Out… |
| EV-05 | ui | lab-instructor/lab-batch-grid | A, B | PARTIAL | P2 | per-result feedback · Outcome per student x skill only; no feedback field anywhere (runtime: 0 textareas on A and B; use-lab-grid.tsx cells hold LabMark only). |
| EV-06 | ui | evaluator/evaluation-form | A, B, C | MET |  | lib/lab/evaluator.ts:301 validate; tests/lab/evaluator.test.ts:111-114; runtime ?fb=1: A and C submit blocked with '3 answers missing ... Write feedback. The program requires it.'; B Next blocked on step 1 with the same message. Shots /tmp/sc-reqaudit/ev/craw… |
| EV-06 | ui | lab-instructor/lab-batch-grid | A, B | MISSING | P1 | feedback field and the required-feedback block for lab skills · No feedback capture, so a skill configured feedbackRequired is saved without feedback: use-lab-grid.tsx save() only checks tally.results>0; runtime 0 textareas. Shots /tmp/sc-reqaudit/shots/EV-06… |
| EV-07 | ui | evaluator/submitted | A, B, C | MET |  | lib/lab/evaluator.ts:325-333 receipt status; runtime hold=1: A 'Waits for program approval ... Counts after program approval'; B 'Signed off. They wait for approval / Next: Awaits program approval'; C 'What Maya sees: Awaiting approval'; default/mixed: 'Count… |
| EV-07 | ui | lab-instructor/lab-batch-grid (+ flow record-lab-session/submitted) | A, B | PARTIAL | P2 | counts-now vs waits-for-approval per lab result; a lab-session receipt · Saving shows only 'Session saved. N results recorded. Saved sessions are not edited.' (lab-grid-parts.tsx:78-85); the flow's Submitted step reuses the preceptor receipt for Maya Ferreira… |
| EV-08 | open-decision | engine lib/v2 | all | SEAM | P2 | data-driven role list seam · Seam weak: roles are a fixed TypeScript union (lib/v2/types.ts:138) with fixed maps ROLE_KINDS (rules.ts:43-47) and ROLE_NAME (student.ts:410); no data-driven role list. Not decided in UI (no copy claims either way). |
| AR-01 | ui | reviewer/approvals + admin/approvals | A | PARTIAL | P1 | location · Columns Student, Skill (subline course · setting), Waiting, Why held, Evaluator (+ role) (reviewer-approvals-a.tsx:80-118); admin A renders ReviewerApprovalsA (admin-approvals-a.tsx:14-19). No location anywhere in the row; multi-skill rows show onl… |
| AR-01 | ui | reviewer/approvals | B | PARTIAL | P1 | course, setting, location, evaluator, role in the queue list · Queue columns only 'Student and skill', 'Why held', 'Waiting' (reviewer-approvals-b.tsx:46-66); course, setting, location, evaluator, role appear only in the side panel Facts after opening a row (… |
| AR-01 | ui | reviewer/approvals | C | PARTIAL | P1 | course, setting, location, role; evaluator outside one column · Board cards show student, first skill, age; evaluator name only in the 'Evaluator not assigned' column and never the role; no course, setting, location (reviewer-approvals-c.tsx:66-83). Shot AR-0… |
| AR-01 | ui | admin/approvals | B | PARTIAL | P2 | per-evaluation rows (relies on navigating to A) · Aggregate rules table (Skill, Approval, Holds now, Students, Oldest, Change rule) and a sentence for other reasons; no per-evaluation list with the seven fields on this page (admin-approvals-b.tsx:24-46; runti… |
| AR-02 | ui | reviewer/review-item | A, B, C | MET |  | CompareTable Asked / Student / Evaluator / Agreement (review-parts.tsx:34-67); runtime disagree item sub-02: A and B 'Overall Unmet Met Differs'; C 'Self and evaluator: Differs' and Answers section open by default when they differ (reviewer-review-item-c.tsx:… |
| AR-03 | ui | reviewer/review-item (and approvals B panel) | A, B, C | PARTIAL | P1 | evaluator outcome on level-rated skills; per-question scores (scored model); the student's self-evaluation note · Compare rows come from lib/v2/queue.ts:476-491: for level-rated skills only the level row is shown, so the evaluator's Met/Unmet outcome is absen… |
| AR-04 | ui | reviewer/review-item, reviewer/approvals, admin/approvals | all | PARTIAL | P2 | optional note on Approve · Return requires a note (decisions.tsx:181-225; runtime Return dialog 'Note to the student'); note retained (reviewer.ts:98, export reviewNote column attainment.ts:424). Approve has no note field in any variant: ui.approve([row]) (re… |
| AR-05 | ui | reviewer/review-item, approvals | all | MET |  | decisions.tsx:68 'It counts now. The student sees it on their progress page.'; :207 'It goes back to the student and does not count.' with correction / different evaluator / new attempt paths; runtime: Return dialog text as quoted; Approve on review-item A pr… |
| AR-06 | engine | engine + reviewer screens | all | MET |  | lib/v2/rules.ts:374 only status 'counted' enters runRule; lib/v2/approvals.ts:13-15 unverified-evaluator evidence read as held; runtime review-item A: 'If you approve Sputum becomes achieved: 1 of 1'; student record 'Mason Whitaker 44 skills achieved, 1 in pr… |
| RV-01 | ui | student/fix-returned | A, B | PARTIAL | P1 | editable submission fields (setting, location, date, details) in the correction · Runtime (stu-g-067): reason 'Choose the setting where you did this skill, then send it again.' but the form has only a checkbox 'Correct the setting or location', Send to, and '… |
| RV-01 | ui | student/my-requests | A, B | MISSING | P1 | correct-and-resend for an unassessed request · RequestLine / StatusTable render an action only when status==='returned'; a waiting (not yet assessed) request has no Edit/Correct-and-resend; fixModel only handles returned or dnq (student.ts:727-751). Runtime A… |
| RV-02 | ui | student/fix-returned | A, B | MET |  | PathLine 'Correction: revision 1 of this submission.'; ReasonBlock 'Returned by Lucia Ochoa, Sep 17' + reason; fixModel keeps submissionId, nextNumber=revisions+1 (student.ts:742) |
| RV-02 | ui | student/my-requests | A, B | MET |  | linkLine shows 'Revision n'; Reason quoted (requests.tsx RequestLine); runtime 'Reason: The signed form is missing the date...' |
| RV-03 | engine | student/fix-returned | A, B | MET |  | Runtime attempt path: 'Further attempt 3, a new submission. Attempt 2 stays.' (fix.tsx PathLine); no edit control on completed evaluations in skill detail / record |
| RV-03 | engine | student/skill-detail | A, B | MET |  | skillPrimary: dnq -> 'Make a further attempt'; no edit on counted attempts |
| RV-04 | ui | student/fix-returned | A, B | PARTIAL | P2 | any recorded evaluator / new name+email; exclude the original · 'Someone else you have worked with' select (fix.tsx); limited to past evaluators, lab instructors excluded (student.ts:724), no 'Someone not listed' name+email; attempt path list still includes t… |
| RV-05 | engine | student/my-requests | A, B | MET |  | Awaiting approval rows: 'Link closed, evaluation complete', no action (requests.tsx action only for returned); runtime A 'Point-of-care blood glucose Awaiting approval, 6 days' no button |
| RV-05 | engine | student/skill-detail | A, B | MET |  | skillPrimary waiting -> 'View request' only; achieved -> no action |
| RV-05 | engine | student/record | A, B | MET |  | read-only table; no edit/resend/reopen (grep 'reopen' in student/reviewer texts: 0) |
| RV-05 | engine | student/log-skill | B | MET |  | rows with requestTo ('Sent to J. Delgado') are excluded from Ready and cannot be resent |
| RV-06 | open-decision | student/fix-returned | A, B | SEAM |  | lib/lab/evaluator.ts:7,60 prefill earlier answers is a lab option, off by default, OD-08 open |
| SH-01 | ui | student/skill-detail | A, B | MET |  | AttemptTimeline 'Attempt 3/2/1' (A), AttemptLedger '#' column (B); student.ts:630 attempts(); runtime 'Attempt 3 Oct 26 ... Attempt 1 Oct 5'. Note: open submissions are appended after evaluations, not merged by date, and show setting 'Clinical' only (student.… |
| SH-01 | ui | student/record | A, B | PARTIAL | P2 | unanswered/returned submissions and attempt numbers · recordRows (student2.ts:286) lists evaluations only: open/returned submissions with no evaluation are absent; no attempt numbers |
| SH-02 | ui | student/skill-detail | A, B | MET |  | MARK words Counted / Did not count / Waiting / Returned / Sent; each attempt names the evaluator; awaiting approval says 'It counts once approved' |
| SH-02 | ui | student/record | A, B | MET |  | ResultLabel + Evaluator column; awaiting approval 'Completed. It counts once a reviewer approves it.' |
| SH-02 | ui | student/my-requests | A, B | MET |  | grouped by evaluator (A) / evaluator column (B) with status |
| SH-03 | ui | student/skill-detail | A, B | MET |  | WhyNotCounted failed.rule + failed.next; attempt why from p.leftOut |
| SH-03 | ui | student/record | A, B | MET |  | runtime 'The evaluator answered Unmet. Needs 3 Met evaluations; you have 0.' |
| SH-03 | ui | student/home | A | MET |  | Do this next 'Sterile dressing change did not count - Unmet, Oct 23. Needs 3 Met evaluations; you have 0.' |
| SH-04 | ui | student/record | A, B | PARTIAL | P1 | Returned and Outstanding (waiting with evaluator + awaiting approval) counts · RecordFigures = Counted 56 / Did not count 2 / Awaiting approval 1 (record-parts.tsx); no Returned figure and requests waiting with an evaluator are not counted (recordRows evaluat… |
| SH-04 | ui | student/home | A, B, C | PARTIAL | P2 | counted submissions · waiting + returned counts present; counted submissions not shown (hero counts achieved skills) |
| SH-04 | ui | student/my-requests | B | PARTIAL | P2 | counted · tabs Waiting / Returned / Done counts; Done is not 'counted' |
| SH-05 | ui | student/skill-detail | A, B | MET |  | partsOf adds one part per named setting (student.ts:137-140) rendered by Parts; runtime home 'Inpatient 1 of 1' |
| SH-06 | ui | student/record | A, B | MET |  | RecordFilters Course select 'All courses' + recordCourses (student2.ts:367) |
| SH-06 | ui | student/skill-detail | A, B | PARTIAL | P2 | course per attempt + narrow to one · WhereItCounts says 'Counts across: All your courses'; attempts show no course and cannot be narrowed to one course |
| SH-07 | ui | student/skill-detail | A, B | MISSING | P1 | full evaluation view (per-question responses, evaluator feedback) · Attempts show only the outcome word ('Counted. Met.'); Evaluation.feedback and answers (lib/v2/types.ts:255,261) are never rendered: grep feedback/answers in components/lab/student*, screens/… |
| SH-07 | ui | student/record | A, B | MISSING | P1 | same · rows show result + why; no link to the evaluation |
| RP-01 | reporting | admin/dashboard, admin/dashboard-drill, admin/attainment, admin/export, director/dashboard, director/reports, director/attainment (+ reviewer/students) | dashboard A-F, drill A,B, attainment A,B, export A,B, director dashboard A,B,C, reports A,B, director attainment A,B | PARTIAL | P1 | applied filters not evident by name when 2+ are applied (count only) · All seven filters present on every screen: Cohort select + Course select ('Clinical only') or Course inside Filters; Filters popover labels Group, Category, Tag, Location, Setting (runtime… |
| RP-02 | reporting | admin/attainment | A, B | MET |  | A matrix 'Achieved n of N' + per-section cells; B Students tab table with state counts (attainment-tables.tsx:88+); runtime. |
| RP-02 | reporting | director/reports | A, B | PARTIAL | P2 | four-state split · By student: Achieved / In progress / Unmet / Attainment (reports.tsx:40-44); 'Unmet' merges no-evidence and does-not-qualify (see AE-04). |
| RP-02 | reporting | director/attainment | A, B | MET |  | Shared StudentMatrix / SkillsTable (rbac/director-attainment.tsx:87); runtime B four state columns. |
| RP-03 | reporting | admin/attainment | A, B | MET |  | Skills tab: 'Required for', four state columns, required-only by default with 'Show all skills' adding 'Not required this term' rows (attainment-page.tsx:186-197; attainment-tables.tsx:57-68); runtime B. |
| RP-03 | reporting | director/reports | A, B | PARTIAL | P2 | mandatory indicator under a course scope; four-state split · By skill: Skill, Section, Achieved, In progress, Unmet (reports.tsx:49-55); no mandatory/recommended/optional indicator when a course filter is applied. Code-only. |
| RP-04 | reporting | admin/attainment | A, B | MET |  | attainment-page.tsx:203; runtime ?tab=tags A and B: 'Tags overlap: 43 records count under more than one tag, so rows do not add up. 1,249 records have no tag.'; tests/lab/attainment.test.ts:34. |
| RP-04 | reporting | director/reports | A, B | VARIANT-GAP | P2 | By tag view with overlap line · Views By student / By skill / By section only (reports.tsx:25-30; runtime). Shot RP-04-director-reports-A.png |
| RP-05 | reporting | admin/dashboard A-F, drill, attainment, director dashboard/reports/attainment | all | MET |  | Dashboard figures link to drill lists (drillHref in dashboard/cards.tsx, status-tiles.tsx, exceptions.tsx, ops-sites.tsx); attainment counts open the evidence peek with that many records (attainment-tables.tsx:68,78; evidence-peek.tsx:3-11); director reports … |
| RP-06 | reporting | admin/attainment, director/attainment | A, B | MET |  | Non-modal EvidencePeek beside the report, URL-addressed (evidence-peek.tsx:3-11, 24-36). |
| RP-06 | reporting | director/reports, admin/dashboard-drill | A, B | PARTIAL | P2 | in-report evidence · Student counts navigate away (director reports -> verification detail, reports.tsx:40-43; drill -> reviewer/student-record, dashboard.ts:565); scope carried, no search, but the evidence shown there is a summary (see RP-07). |
| RP-07 | reporting | reviewer/student-record (target of every report drill) | A, B | MISSING | P1 | a full view of any completed evaluation (per-question Yes/No, scores, level, feedback, student-supplied details, self-evaluation) · Evaluations table rows show skill, date, status, evaluator, setting only; counted/Unmet rows offer just 'Request a correction';… |
| RP-07 | reporting | director/verification-detail | A, B | MISSING | P1 | full evaluation view · Evidence column is a count ('1 evaluation, 1 Unmet'), no way to open the evaluation (director/verify.tsx:74-85; runtime). Shots RP-07-director-verification-detail-A.png, -B.png |
| RP-07 | reporting | admin/attainment, director/attainment evidence peek | A, B | PARTIAL | P2 | full evaluation · Peek lists each evaluation's date, evaluator, setting, outcome (evidence-peek.tsx:79) then 'Open the full record' -> reviewer/student-record (summary only). |
| RP-08 | reporting | admin/dashboard A-F, admin/attainment A,B | all | MET |  | Recount in selectors (lib/lab/attainment.ts:18-19; dashboard recount line); runtime loc=Harbor Outpatient Clinic: 'Counting evidence from Harbor Outpatient Clinic only.' on dashboard A and attainment A; tests/lab/dashboard.test.ts:109. |
| RP-08 | reporting | admin/dashboard-drill, admin/export, director/dashboard, director/reports, director/attainment | all | PARTIAL | P2 | recount statement · Figures do recount (runtime director dashboard A: '1 of 52' per student under loc filter; drill 'Evaluations counted 0 of 3' under impossible combo), but no 'Counting evidence from X only' line, so the reader is not told the numbers are lo… |
| RP-09 | reporting | admin/dashboard | A, B, C, D, E, F | MET |  | dashboard/frame.tsx:92, ops-frame.tsx:76, lib/lab/dashboard.ts:574-580; runtime loc=Skills lab 2&setting=clinical: 'Skills lab 2 does not offer clinical evidence, so none could have been gathered there in that setting. Clear one of the two filters.' on all si… |
| RP-09 | reporting | admin/dashboard-drill, admin/attainment, admin/export, director/dashboard, director/reports, director/attainment | drill A,B, attainment A,B, export A,B, director dashboard A,B,C, reports A,B, director attainment A,B | VARIANT-GAP | P1 | explanation + one-click remove for the offending filter · Same URL renders silent zeros with no explanation: attainment A every student '0 of 5' + 'Behind' under 'Counting evidence from Skills lab 2, Clinical settings only.'; drill 'Evaluations counted 0 of 3… |
| RP-10 | reporting | admin/export, admin/attainment export panel, director/attainment export | A, B | PARTIAL | P2 | evaluations on non-required skills within the filtered scope · Signed PDF summary + CSV/Excel detail with columns incl. Feedback, Setting, Location, Self-rating, Self-evaluation note, Review decision, Review note (lib/lab/attainment.ts:349,386-428); filters w… |
| RP-11 | open-decision | admin/export, export panel | A, B | SEAM |  | Seam exists: both formats offered with 'Decision pending' (attainment.ts:355-362 FORMAT_DECISION_PENDING; export-b.tsx:114; runtime 'Signed PDF CSV Excel Decision pending CSV or Excel'). |
| AE-01 | engine | lib/v2/rules.ts runRule (the lab's engine) | all | MET |  | rules.ts:374 counted = status 'counted'; approvals.ts:13-15 unverified held; tests/lab/rule-writeback.test.ts:44-60 'one engine'. Note: tests/engine/* test lib/engine, which the lab does not import (no '@/lib/engine' import in lib/lab, lib/v2, components/lab). |
| AE-02 | engine | lib/v2/rules.ts | all | MET |  | engineRuleOf reads the published skill.config every run (rules.ts:350-368); tests/lab/rule-writeback.test.ts:110-160 (stricter/looser rule changes student screens and dashboard after publish). |
| AE-03 | engine | lib/v2/rules.ts | all | MET |  | rules.ts:398-403 achieved = have>=need && distinct && settings.every && levels.every; settings count only setting==='clinical' with that clinicalSetting (line 399), so lab/simulation never satisfy a clinical minimum (SC-12). Lab-specific unit tests for settin… |
| AE-04 | engine | admin/attainment, director/attainment, reviewer/student-record, director/verification-detail, dashboards | all | MET |  | lib/v2/labels.ts:7-15; runtime texts: 'In progress' 28 files, 'Evidence does not qualify' 21, 'No evidence yet' 79; 'Not yet met' 0. |
| AE-04 | engine | director/reports | A, B | VARIANT-GAP | P1 | 'Evidence does not qualify' and 'No evidence yet' columns · Columns Achieved / In progress / Unmet (reports.tsx:43,54,65) merge two states under an outcome word. Shot AE-04-director-reports-B.png |
| AE-05 | engine | lib/v2/evidence-index.ts | all | MET |  | evalsOfStudentSkill keyed `${studentId}/${skillId}` with no course (evidence-index.ts:45); runRule consumes it. |
| AE-06 | engine | lib/v2/rules.ts + configure | all | MET |  | qualifiesOn uses e.outcome ('met'), answer arrays and levelIndex, never label text (rules.ts:326-345); evaluator receipt labels from config only. Doubt: reordering levels with the Move up/down buttons (configure/fields.tsx:180-186, 202-207) changes which labe… |
| AE-07 | engine | admin/configure-skill (rule editor) -> lib/v2 rule | A (fields.tsx), C (sentence-builder) | PARTIAL | P1 | index remap on removal/reorder · Removal filters by length only, without re-indexing: levels onChange keeps levelMinimums with levelIndex < levels.length (configure/fields.tsx:306); questions onChange keeps subset indices < questions.length (fields.tsx:320). … |
| AE-08 | open-decision | engine + reporting | all | SEAM | P2 | Seam exists: four separate keys in one label map (labels.ts:7-15; dashboard.ts:832 notes OD-03 open). Inconsistent use: director reports merge them into 'Unmet' (see AE-04), effectively deciding OD-03 on that screen. |
| OD-02 | open-decision | not audited |  | UNCHECKED |  | No auditor checked whether a seam exists; Lists A carries 'Standards are managed in Program details.' (call #12) which touches OD-02. |
| OD-04 | open-decision | not audited |  | UNCHECKED |  | No auditor checked whether a seam exists; Lists A carries 'Standards are managed in Program details.' (call #12) which touches OD-02. |
| OD-05 | open-decision | not audited |  | UNCHECKED |  | No auditor checked whether a seam exists; Lists A carries 'Standards are managed in Program details.' (call #12) which touches OD-02. |
| OD-09 | open-decision | not audited |  | UNCHECKED |  | No auditor checked whether a seam exists; Lists A carries 'Standards are managed in Program details.' (call #12) which touches OD-02. |
| OD-11 | open-decision | admin/dashboard E, evaluator directory, filters | E | SEAM |  | Seam exists: evaluations store evaluatorId and location (attainment.ts:299-318 detail rows carry evaluator and location; export columns); Location is a report filter; Dashboard E is an operational sites/evaluators view (stuck requests), not site-quality or ev… |
| OD-13 | open-decision | not audited |  | UNCHECKED |  | No auditor checked whether a seam exists; Lists A carries 'Standards are managed in Program details.' (call #12) which touches OD-02. |

Full evidence, selector hints for a later Playwright gate, and the one-line fix per row are in `req-coverage-lab.json`.
