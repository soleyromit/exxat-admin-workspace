# T1 Audit: Admin role in Skills Checklist v2

Read-only audit, 2026-10-26. Branch `feat/skills-checklist-v2`. Scope: `admin/components/v2/admin/*`, `components/v2/reports/*`, `role-home.tsx`, `lib/v2/{config,admin-actions,import,starter-libraries,rules,reports,coverage}.ts` (plus `home.ts`, `student.ts`, `review.ts`, `roles.ts` where needed), routes under `app/(v2)/v2/[role]/`.
All paths below are relative to `/Users/romitsoley/Work/apps/skills-checklist/admin/` unless stated. Tags: [REQ id] [OD-n] [CALL] [BUILD-PROMPT section/screen id] [INFER]. File:line is from the code as read today.

## Summary

1. v2 admin designs the happy path well: add skills (starter copy or file import with review), configure (7-step wizard, no model preselected), publish gate, map one course, cohort reports with a signed PDF. These are real, state-linked screens.
2. It does not design the lifecycle after that. No deactivate, delete, new list, change-impact, evaluator directory, settings, tags, multi-list/assignment, or evidence sources. Of the 20 build-prompt admin screens: 1 PRESENT (admimport), 7 PARTIAL, 11 MISSING, 1 intentionally out (eximigrate).
3. The riskiest scenario, "rule changed after evidence exists", is silent: publishing replaces the rule, every student's progress recalculates live (`lib/v2/student.ts:65`), and the admin sees no count of who flips. The confirm dialog says "Evaluations already completed are not changed" (`components/v2/admin/configure-wizard.tsx:221`), which is true of the records and misleading about achievement [REQ AE-02].
4. Several instructions on screen point to controls that do not exist: "Add any skill you need after you create the others" (`import-panel.tsx:217`), "add the evaluator's details to the program" (`lib/v2/rules.ts:156`), "the audit log records the change" (`review-queue-page.tsx:304`). Those are the clearest "dots not connected" cases.
5. Gaps against REQ that matter: no manual single-skill create [IM-12], no active/inactive [SL-02, SL-11], no tags [SL-04], no search [SL-10], no question/scored qualification rule [SC-05..07], no student submission fields [SC-13], no CSV/row-per-evaluation export [RP-10], no tag report [RP-04].
6. Simplicity: nav has 7 admin rows; the wizard has 3 steps that no REQ asks for (Simulation, Prerequisites, "If a student does not pass") plus a heuristic "Strength" card; explanatory sentences repeat 2-3 times per page (list in section 4).
7. Hard-stop deviations exist but are recorded only in `docs/v2/decisions-and-open-questions.md` D2: shipped starter libraries [SL-01], last-N "keeps the evidence current" rule (currency, REQ section 14), evaluator credential/years/training qualification, remediation in the admin nav (REQ section 14). Romit must decide whether v2 keeps those.
8. Not verified: any runtime behaviour (no browser). Statuses come from reading code plus the stage screenshots; some screenshots are stale (see Unverified).

## 1. Feature checklist (status in v2)

Status key: PRESENT, PARTIAL, MISSING, INTENTIONALLY-OUT (with reason). Evidence is file:line from code I read.

### 1a. REQ admin-owned IDs

| ID | Requirement (short) | Status | Evidence |
|---|---|---|---|
| SL-01 | Library is program-defined, Prism ships none | PARTIAL (conflict) | `lib/v2/starter-libraries.ts:16-79` ships 4 sample libraries; copy UI `components/v2/admin/starter-libraries-panel.tsx:17-50`. Recorded as v2-only scope change D2 in `docs/v2/decisions-and-open-questions.md`. Hard stop "no shipped skills" is not honoured. |
| SL-02 | Skill has name, description, active/inactive | PARTIAL | `lib/v2/types.ts:108-121`: name, description, no `active` field. Edit dialog `components/v2/admin/edit-skill-dialog.tsx:44-66` edits name, category, description only. |
| SL-03 | Categories program-defined, at most one per skill, optional | PARTIAL | Category is a free-text string on the skill (`types.ts:112`), sentinel "No category" (`admin-actions.ts:26`). No category list/entity, so a typo makes a new category. |
| SL-04 | Tags, cross-cutting | MISSING | `grep tag` in `components/v2` and `lib/v2/types.ts` only hits filter icons (`library-table.tsx:38`, `reports-page.tsx:124`). Acknowledged in `docs/v2/traceability.md:41`. |
| SL-05 | Create category/tag at point of need | PARTIAL | Typing a new category in the edit dialog creates it implicitly (`edit-skill-dialog.tsx:60`). No tags. |
| SL-06 | Only active categories/tags assignable; deactivated one stays visible | MISSING | No category/tag entity, so no active flag. |
| SL-07 | Clinical settings program-defined list | PARTIAL | Data only: `Program.clinicalSettings` (`types.ts:35`), consumed by wizard (`wizard-steps.tsx:177`) and reports (`reports-page.tsx:117`). No admin screen to add/rename/deactivate. `GET /v2/admin/settings` returns 404 (curl). |
| SL-08 | Lab instructors recordable without Prism login (name + email) | MISSING | No admin UI; people exist only in seed (`lib/v2/seed.ts`). |
| SL-09 | See and adopt student-typed lab instructor names | MISSING | No evaluator directory. `ST-09` "naming an unrecorded lab instructor is not built" per `docs/v2/traceability.md:74`. [BUILD-PROMPT admevals] |
| SL-10 | Library searchable/filterable by name, category, tag, status | PARTIAL | Filters: status, library, category, source (`library-table.tsx:32-40`). No name search: `components/v2/v2-grid.tsx:25` `searchable={false}`. No tag filter. |
| SL-11 | Deactivate withdraws skill from mapping/selection/reporting, keeps evidence | MISSING | No deactivate or unpublish action anywhere in `lib/v2/admin-actions.ts:1-140`. [CALL follow-up 10-09: "inactivate = I made a mistake ... don't show it in the report, don't delete the data"] |
| IM-01 | Bulk create from existing list | PRESENT | `import-panel.tsx:36-111`, `lib/v2/import.ts:44`. |
| IM-02 | Spreadsheets, Word, PDF accepted | PARTIAL | `ACCEPT = ".pdf,.txt,.md,.csv,.docx,.xlsx"` (`import-panel.tsx:20`); only PDF/text driven in demo per `docs/v2/traceability.md:58`. Label says "Choose a PDF or text file" (`import-panel.tsx:122`). |
| IM-03 | No prescribed template or column order | PARTIAL | Parser only reads lines starting with a number or dash (`import.ts:29` `MARKER`). A plain one-skill-per-row column returns the error "Add a number or a dash in front of each skill" (`import-panel.tsx:71`), which asks the client to reformat. |
| IM-04 | Propose description, category, accompanying questions | PARTIAL | Name, description ("Name - description"), category from heading (`import.ts:33-36, 85-89`). Questions/criteria not proposed (OD-12 open). |
| IM-05 | Review: edit, rename, merge, split, discard, add | PARTIAL | Accept/Reject toggle and Edit per row (`import-panel.tsx:169-210`). No merge, split or add. |
| IM-06 | Duplicate check; skip, replace or keep both | PARTIAL | Badge "Repeats X" (`import-panel.tsx:196`, `import.ts:78`). Only decision is accept/reject; create checks duplicates inside the batch only (`admin-actions.ts:57-58`), so accepting a repeat silently creates a second skill. No "replace" (D9, OD-13 open). |
| IM-07 | Headings proposed as categories | PRESENT | `import.ts:85-89`. |
| IM-08 | Unreadable text reported with original | PRESENT | "Not picked up" card with line numbers (`import-panel.tsx:213-230`). |
| IM-09 | Imported skills unconfigured; cannot be mapped or submitted against | PRESENT (admin side) | `admin-actions.ts:28-30`; mapping blocked `coverage.ts:12-17`, `admin-actions.ts:135-136`; UI `map-courses-page.tsx:130-157`. |
| IM-10 | See how many need configuration and work through them | PRESENT | Meter `library-table.tsx:58-64`; Home row "N skills need configuration" with "Configure next skill" (`admin-home.tsx:67-73`). No bulk or suggested configuration. |
| IM-11 | Import repeatable, additive, trace skill to import | PRESENT | `addBatch` (`admin-actions.ts:19-38`), "Came from" column (`library-table.tsx:83`) and filter. Bug: file imports are always stamped specialty `bsn-med-surg` (`admin-actions.ts:59`). |
| IM-12 | Create and configure a single skill by hand | MISSING | No "Add skill" control exists (`grep "add skill\|new skill"` in `components/v2` finds only copy text). Traceability claims it only for the "copy path". |
| IM-13 | Nothing created without explicit confirm | PRESENT | Sheet "Nothing is added until you copy" (`starter-libraries-panel.tsx:81`); import "Create N skills" (`import-panel.tsx:244`). |
| IM-14 | Copy config to another skill / apply to several | PARTIAL | Copy from one skill into the draft (`wizard-steps.tsx:80-102`, `admin-actions.ts:91-100`). Library is `selectable={false}` (`library-table.tsx:68`): no multi-select apply. |
| IM-15 / OD-12 | AI proposes model and criteria? | INTENTIONALLY-OUT | OD undecided; rule-based stand-in, never proposes model (`import.ts:41-43`, D10). |
| SC-01 | Create and configure are separate | PRESENT | `admin-actions.ts:28-31`. |
| SC-02 | Exactly one model, chosen explicitly, no default | PRESENT | `config.ts:24-27`, `wizard-steps.tsx:104-123`, block `configure-wizard.tsx:91-97`, `rules.ts:84`. |
| SC-03 | Binary: two labels, which qualifies, must differ | PRESENT | `wizard-steps.tsx:125-130`, `rules.ts:86-91` (first label qualifies). |
| SC-04 | Program defines question set | PRESENT | `ListEditor` `wizard-steps.tsx:132-144`. |
| SC-05 | Question model qualification rule (all Yes, N of M, named subset) | MISSING | `SkillConfig` (`types.ts:59-88`) has no such field. Evaluator form shows "Met is still your call" (`lib/v2/preceptor.ts:187-196`). Acknowledged `docs/v2/traceability.md:41`. |
| SC-06 | Rule must be satisfiable, subset not empty | MISSING | Follows SC-05. |
| SC-07 | Scored: response scale and qualification (average, min per question, total) | MISSING | No scale field in `SkillConfig`; "scored" has only a question list. |
| SC-08 | Demonstration levels program-defined and ordered | PRESENT | `wizard-steps.tsx:150-163` with reorder. |
| SC-09 | Changing model rebuilds criteria | PRESENT | `config.ts:49-54`, `admin-actions.ts:87-89`. No guard when the skill already has evidence (see section 2). |
| SC-10 | Total demonstrations and a minimum at each level | PARTIAL | Total `need` plus one "Lowest level that counts" (`wizard-steps.tsx:204-222`, `types.ts:73`). No "at least 2 at Independent" per-level minimum. [BUILD-PROMPT Rule `level: count, atLevel`] |
| SC-11 | Minimum per named clinical setting | PRESENT | `wizard-steps.tsx:226-267`, `rules.ts:124-132`. |
| SC-12 | Lab/simulation never satisfies a clinical setting | PRESENT | `lib/v2/student.ts:111-118`, copy `wizard-steps.tsx:228`. |
| SC-13 | Program defines student submission fields | MISSING | No field in `SkillConfig`; no wizard step. [OD-04] |
| SC-14 | Narrative feedback capturable; mandatory per skill | PRESENT | Toggle `wizard-steps.tsx:370`. |
| SC-15 | Optional self-evaluation step; optional admin approval | PARTIAL | Approval toggle present (`wizard-steps.tsx:371`). Self-evaluation toggle missing (`docs/v2/traceability.md:60`). |
| SC-16 | Which evaluator roles may sign off | PRESENT | `wizard-steps.tsx:364`, `rules.ts:152`. |
| SC-17 | Dependency model to rule must be apparent | PARTIAL | Step 1 then step 2 order, minimum level only when levels exist (`wizard-steps.tsx:223-225`), live sentence card (`wizard-steps.tsx:269-274`). The card also grades "Strength: strong" (`rules.ts:183-214`), a v2 heuristic [INFER]. |
| SC-18 | Unsatisfiable config cannot be saved | PRESENT | `rules.ts:79-165`, publish blocked `admin-actions.ts:113-116`. Note: drafts save freely; only publish is gated. |
| SC-19 | Review everything asked of student and evaluator together | PARTIAL | Review cards `configure-wizard.tsx:272-293`, `lib/v2/review.ts:30-70`. Text only: no "preview as student / as evaluator" [BUILD-PROMPT admpreview]; student side omits submission fields (SC-13 missing). |
| CM-01 | Offering = code, name, term, academic year, professional year, cohorts | PARTIAL | One fixed course `state.course` (`types.ts:40-48`): code, name, term, cohort. No academic/professional year; cannot pick another offering. |
| CM-02 | Offerings locatable by search, cohort, term, year | MISSING | No offering list or search; page is single-course (`map-courses-page.tsx:38,69`). |
| CM-03 | Mapped skill is mandatory or non-mandatory | PRESENT | `map-courses-page.tsx:129-144`, `admin-actions.ts:127-140`. Adds a third value "Not expected" beyond REQ. |
| CM-04 | See how many mapped / mandatory per offering | PRESENT (one offering) | Coverage bar `map-courses-page.tsx:71-82`; `lib/v2/coverage.ts:63-66`. |
| CM-05 | Mapping is expectation, not eligibility | PRESENT (admin copy) | "Warnings do not block students" `map-courses-page.tsx:84`. Student-side not in my scope. |
| CM-06 | Level may differ per offering | PARTIAL | Stored per `courseId` (`admin-actions.ts:131-138`) but only one course exists, so never demonstrable. |
| CM-08 / OD-01 | Carry-forward between terms | INTENTIONALLY-OUT | OD open; no copy-forward or catalogue-level mapping. Also no bulk map. |
| RP-01 | Filter by cohort, group, course, category, tag, location, setting; chips removable | PARTIAL | Category, setting, clinical setting, mandatory-only (`reports-page.tsx:123-128`), removable chips via `V2FilterBar`. Cohort/group/course/tag/location absent (D34). |
| RP-02 | Attainment by student | PRESENT | Heatmap rows with "N of M met" (`reports-page.tsx:146-155`); words table `reports-page.tsx:377-406`. |
| RP-03 | Attainment by skill, mandatory flag | PRESENT | Skills tab `reports-page.tsx:253-270`, column sublabels `:144`. |
| RP-04 | Attainment by tag, say overlap | MISSING | Not built (`docs/v2/traceability.md:36`). [BUILD-PROMPT admtags] |
| RP-05 | Aggregate to individuals | PRESENT | Name links `reports-page.tsx:130-134`, "Show students" `:369`. |
| RP-06 | Student/skill to evidence without leaving the report | PARTIAL | Cell opens a sheet with only "N of M counted" and a link to the student's record page (`reports-page.tsx:299-310`); evidence is a navigation away. |
| RP-07 | Any evaluation viewable in full | PARTIAL | Via record/evaluation pages (other worker's scope); not from the report. |
| RP-08 | Setting/location filter recalculates | PARTIAL | Setting and clinical setting: yes (`lib/v2/reports.ts:73-75`). Location: no. |
| RP-09 | Impossible filter combination explained | PRESENT | `explainFilters` `reports.ts:43`, banner `reports-page.tsx:176-180`. Only lab/simulation + named clinical setting is explained; other empty results get a generic info banner (`:181-185`). |
| RP-10 | Export aggregate and row-per-evaluation, full filtered scope, filters recorded | PARTIAL | Signed PDF only (`export-sheet.tsx:92-109`), filters recorded. No CSV/Excel, no row-per-evaluation. The PDF deliberately excludes feedback, self-ratings and notes (`export-sheet.tsx:111`, `lib/v2/report-docs.ts:17`, D36), which RP-10 says the detail export must carry. |
| RP-11 / OD-10 | CSV vs Excel | INTENTIONALLY-OUT | OD open; neither built. |
| AE-02 | Rule change re-applies to existing evidence | PARTIAL | Progress is computed live from the current rule (`student.ts:65-120`), so counts, window, level, setting minimums re-apply. The Met/Not met outcome of an evaluation is fixed when recorded; no preview of impact for the admin. |
| AE-03 | Achieved only when every criterion met | PRESENT | `student.ts:128` (`have`, distinct evaluators, settings). |
| AE-04 | Four states distinguished | PRESENT in reports | Cell states none / attempted / some / half / achieved (`reports.ts:85`, legend `reports-page.tsx:85-90`). This implicitly answers OD-03 (separate reporting), which is undecided [OD-03]. |
| AE-06 / AE-07 | Renaming is presentation only; removing a question/level cleans rules | PARTIAL | Min-level index is repaired when a level is removed (`wizard-steps.tsx:72-77`). Stored evaluations keep `levelIndex` and answers by position (`types.ts:140,171`), nothing remaps them if levels are reordered or removed [INFER, not exercised]. |

### 1b. Build-prompt admin screens

| Screen id | What it is | Status | Evidence |
|---|---|---|---|
| admlib | Checklist library and config progress | PARTIAL | Library table + "Configured 27 of 31" meter (`library-table.tsx:55-114`). Single flat list; no multiple lists, no `itemNoun`, no assigned groups [CALL follow-up: multiple lists, default list]. |
| admcreate | Create list: blank, from file, from starter | PARTIAL | Starter + file only; no blank, no "new list" (`starter-library-page.tsx:30-42`). Starter content is invented specialty samples, not the build-prompt's AACN/ARRT/AACP/ACEND templates. |
| admimport | Import review: sections, groups, unread; states review/upload/reading/failed | PRESENT | All four states: `import-panel.tsx:115-139` (upload, reading, error with retry), review `:140-262`. Groups/[R] markers not applicable to REQ. |
| admbacklog | Configuration backlog with suggestions, bulk apply | PARTIAL | Home row + library "Not configured" filter. No suggestions, no bulk apply. [N-12] |
| admtree | Items tree (sections, groups, items) and item detail | MISSING | Flat table with one category string. [CALL follow-up: "tree structure ... two levels or three"; hierarchical] |
| admconfig | Configure item, evidence sources, rule, live effect on a real group | PARTIAL | Wizard present. No evidence-sources step, no live effect on a real cohort (the strength card is generic, `wizard-steps.tsx:269`). |
| admsources | Evidence from existing Prism data (questions, grades, assessments, logs) | MISSING | Zero hits for "evidence source" in code or v2 docs. [CALL 10-08: evidence from eval question, assessment, course grade, FAST form; OD-31, OD-33, OD-37 open, REQ governs v1] |
| admpreview | Preview as student and as evaluator | MISSING | Review step is a text summary (`review.ts`). |
| admimpact | Change impact before/after a rule change | MISSING | Zero hits for impact/re-evaluate in admin code. [AE-02] |
| admassign | Lists, student groups, completion rule, default list | MISSING | One implicit list for one cohort. [CALL follow-up: attach lists to cohorts or groups, default list, tracks not only cohorts; OD-30 program requirements] |
| admchange | Deactivate (mistake) vs new list (new standard); delete only while no evidence | MISSING | See SL-11. [CALL follow-up 10-09] |
| admcourse | Offering: terms, likely items, coverage matrix, no-likely-course nudge | PARTIAL | Single-course mapping + coverage bar + warnings; Home row "N skills in use, not in NURS 350" (`admin-home.tsx:81-87`). No terms, no required items x courses matrix. |
| admevals | Evaluator directory, adopt/merge pending names | MISSING | `GET /v2/admin/evaluators` 404. [SL-08, SL-09] |
| admsettings | Clinical settings with counts, access per list | MISSING | `GET /v2/admin/settings` 404. [SL-07] |
| admreports | Reports by item, scatter, least achieved, export | PARTIAL | Skills tab sorted weakest first (`reports-page.tsx:254`); no attempted-vs-achieved scatter; PDF only. |
| admtags | Reports by section and by student | MISSING | Category is only a filter; no by-category roll-up. [RP-04] |
| admconsistency | Return / not-qualifying rate by evaluator vs average | PARTIAL | Evaluators tab: Met rate and gap to all, small-numbers mark (`reports-page.tsx:272-293`). No returned or not-qualifying rate, no link to evaluator. [OD-11] |
| admrules | Rule tester on a real record | MISSING | Generic strength card only. |
| admnudges | Nudges with "would fire today" counts | MISSING | Home "Needs attention" rows are the nearest (stalled, waiting approval). REQ section 14 puts notifications out of scope; build-prompt lists them as Recommendation. |
| eximigrate | Migrate Evaluations-based setup | INTENTIONALLY-OUT | REQ section 14 ("migration ... inputs outstanding"). |
| (v2 extra) Admin Home | Work queue: set up, needs attention, weakest | PRESENT | `admin-home.tsx:48-196`. Not in build-prompt list. |

## 2. Scenario and edge-case coverage

| Scenario | What v2 does | Verdict |
|---|---|---|
| Rule changed after evidence exists | Admin edits a draft (`admin-actions.ts:74-85`); the live skill is untouched until Publish (good). Publish swaps config (`admin-actions.ts:118`). Student progress is recomputed from the new rule on next read (`student.ts:65`). No count of students whose state changes, no "this affects 12 students, 3 would lose Achieved", no versioned rule, no audit view. Dialog copy "Evaluations already completed are not changed" (`configure-wizard.tsx:221`) hides that achievement can change. | Gap. P0. [AE-02, BUILD-PROMPT admimpact] |
| Model changed on a published skill with evidence | `chooseModel` clears questions, no guard on existing evaluations (`admin-actions.ts:87-89`, `config.ts:49-54`). | Gap. P1. [SC-09, AE-06/07] |
| Deactivate vs delete | Neither exists. No unpublish either. | Gap. P0. [SL-11; CALL: deactivate = mistake, hide from reports; delete only before any evidence; new standard = new list] |
| New standard for new cohort | No new list, no clone, no assign list to cohort. | Gap. P1. [CALL follow-up; BUILD-PROMPT admchange, admassign] |
| Unconfigured skill | Status pill, Home row, library filter, mapping select disabled with reason and link (`map-courses-page.tsx:130-157`, `coverage.ts:12-17`), server-side refusal (`admin-actions.ts:135`), coverage warning if mapped anyway (`coverage.ts:38-40`). Reports show only published skills ("No published skill matches", `reports-page.tsx:203`). | Good. |
| Mapping without eligibility | Warnings are advisory ("do not block students", `map-courses-page.tsx:84`); mandatory-but-unpublished warning (`coverage.ts:43`). | Good for admin side. |
| Mandatory skill whose named setting the course lacks / no qualified evaluator | Coverage warnings `coverage.ts:46-58`. The no-evaluator fix text "add an evaluator" (`coverage.ts:57`) has no screen to do it. | Dead end. P1. |
| Import: unreadable, too large, wrong type, empty, reader down | Five specific messages + "Read the file again" (`import-panel.tsx:22-28, 133`). | Good. |
| Import: no numbered/bulleted lines | Error asks client to add numbers or dashes (`import-panel.tsx:71`). | Conflicts with IM-03; P1. |
| Import: partially readable | "Not picked up (N lines)" with original text (`import-panel.tsx:213-230`); tells user to "Add any skill you need after you create the others" but there is no add control (IM-12 missing). | Dead end. P1. |
| Import: duplicates vs existing library | Badge only; accepting creates a second skill; later Edit of either one fails with "Another skill is already called X" even when the name is unchanged (`admin-actions.ts:41-44,68`). Starter copy does not dedupe at all (`admin-actions.ts:46-52`; sheet says "Tick it to add a second copy", `starter-libraries-panel.tsx:92`). | Gap. P2. [IM-06, OD-13] |
| Import into a non-nursing specialty | Always stamped `bsn-med-surg` (`admin-actions.ts:59`), so a radiography file import appears under BSN in Library and in the default Courses filter (`map-courses-page.tsx:33`). | Bug. P2. |
| Empty library | `emptyText` "No skills yet. Add a starter library or import a PDF." (`library-table.tsx:71`). | OK. |
| Empty / no-evidence reports | Info banner "No counted evidence for these filters" (`reports-page.tsx:181`), grid empty text. | OK. |
| Unknown skill id in wizard URL | Error page "Skill not found" (`configure-wizard.tsx:76-89`). Default skill is the IV catheter when no `?skill=` (`:32`), so the nav-less route silently opens a specific skill. | OK, minor. |
| Admin home with nothing to do | "Every skill is configured, in use and in NURS 350." and "Nothing is waiting." (`admin-home.tsx:109,123`). | OK. |
| Hard stops | No default model: held. Unconfigured not mappable: held. Completed evaluations immutable: no admin edit path exists (held). Lab never satisfies clinical minimum: held (`student.ts:111-118`). Mapping is not eligibility: held. Preceptors no login: held (qualification attestation in other scope). Shipped skills: broken by D2. REQ section 14: broken by last-N currency rule (`wizard-steps.tsx:187`), credential/years/training qualification (`wizard-steps.tsx:365-367`), and remediation nav row (`lib/v2/roles.ts:54`), all recorded as v2-only scope changes in D2 and in `docs/v2/traceability.md:133`. | Needs Romit's call. |

Cross-role connections (admin out-links), what exists and what is cut:

- Connected: Home rows deep-link to configure, publish, courses, review, reports, outcomes, records (`lib/v2/home.ts:13-25`); report names open the student's record (`reports-page.tsx:130-134`); coverage warnings open the skill (`map-courses-page.tsx:97`); published banner links to mapping (`configure-wizard.tsx:165`).
- Cut: Home "stalled request" rows are plain text with no link (`admin-home.tsx:141-143`). Publish does not say who sees it: no count of mapped courses, students, preceptors, no "view as student". The publish success text and button are hard-coded to NURS 350 (`configure-wizard.tsx:138,165`). Library rows show no evidence, student or course counts. Report skill rows have no link to the skill's rule (J8: admreports to admconfig); Evaluators tab names link nowhere (J7). "Who qualifies now" lists people but cannot add or open one (`wizard-steps.tsx:380-387`). No audit-log screen even though every admin action writes one (`admin-actions.ts:51,60,70,99,105,121,139`) and UI copy promises it.

## 3. Gaps ranked

P0 (a designer cannot call the admin scenario complete without these)
1. Change-impact and rule versioning on publish for a skill with evidence: show who changes state, require a decision, fix the misleading "not changed" copy. [AE-02, BUILD-PROMPT admimpact, admchange]
2. Deactivate vs delete vs new list lifecycle (library row action, "delete only while no evidence", "new standard = new list"). [SL-11, SL-02, CALL follow-up]
3. Manual single-skill create and the "add after import" path that the import screen already promises. [IM-12]

P1
4. Evaluator and lab-instructor directory with adopt/merge, plus add-evaluator entry from the two dead-end warnings. [SL-08, SL-09, BUILD-PROMPT admevals]
5. Question-model and scored-model qualification rules (all Yes, N of M, named subset; scale; average/min/total). Without them the "evaluation model determines the rule" principle (REQ 1.5) is only half drawn. [SC-05..07, SC-17]
6. Per-level minimum ("3 demonstrations, at least 2 at Independent"). [SC-10, BUILD-PROMPT Rule `level`]
7. Student submission fields and self-evaluation toggle in the wizard. [SC-13, SC-15, OD-04]
8. Export: CSV or xlsx aggregate and a row-per-evaluation detail; resolve the D36 conflict with RP-10 (detail must carry feedback, self-evaluations, review notes). [RP-10, OD-10 open]
9. Settings home: clinical settings, categories, tags, lab instructors, with active/inactive. [SL-03..07]
10. Multi-list and assignment: list attached to cohorts or custom groups, default list, completion rule. [CALL follow-up; OD-28, OD-30; BUILD-PROMPT admassign]
11. Import must not require reformatting: parse plain rows and spreadsheet cells; give the user a way to pick the library. [IM-03, `import-panel.tsx:71`, `admin-actions.ts:59`]
12. Hard-stop deviations (starter libraries, last-N currency, credential qualification, remediation) need an explicit Romit decision recorded outside D2. [SL-01, REQ section 14]

P2
13. Offering model: more than one course/term, academic/professional year, offering search, per-offering levels visible. [CM-01, CM-02, CM-06, OD-01]
14. Reports: tag report, location/course/group filters, evidence reachable from the cell sheet, link from skill row to its rule, evaluator links. [RP-01, RP-04, RP-06, RP-08, BUILD-PROMPT J7, J8]
15. Library name search; multi-select bulk apply of a configuration. [SL-10, IM-14]
16. Duplicate handling on import/starter copy (skip, replace, keep both) and the edit clash that blocks unchanged names. [IM-06, OD-13]
17. Evidence sources (assessment question, grade, FAST) as a seam in configure. [CALL 10-08; OD-31, OD-33, OD-37 open, so a labelled placeholder only]
18. Admin-visible audit log. [INFER]

P3
19. Admin preview "as student / as evaluator". [SC-19, BUILD-PROMPT admpreview]
20. Rule tester and nudge settings. [BUILD-PROMPT admrules, admnudges; Recommendation tier]
21. Level reorder after evidence exists remaps stored `levelIndex`. [INFER]

## 4. Simplicity: text and clutter cuts

Navigation (`lib/v2/roles.ts:48-57`)
- Seven admin rows: Home, Skills library, Courses, Review and approve, Outcomes, Records, Reports. The route for "Skills library" is `/v2/admin/starter-library` (name mismatch). Propose four: Home (work queue), Skills (tabs: Library, Courses, Settings), Review (tabs: Approvals, Outcomes, Records), Reports. New admin screens (evaluators, tags, settings, lists) go under Skills > Settings, not new rows. Review/Outcomes/Records are cross-role work; they do not need three admin rows.

Admin Home (`components/v2/admin/admin-home.tsx`)
- Section "Cohort" with "Weakest mandatory skills" and "Students by state on each skill, weakest first." (`:167-169`): duplicates Reports. Cut or reduce to a link in "Needs attention".
- "Needs attention" repeats the nav badge (`9` on Review and approve, and "9 waiting for approval" `:130`). Keep the row; drop the badge or the 3 inline names plus "and 6 more" (`:133-143`).
- Four Set-up rows each list "A, B, C and N more" (`:71,78,85,92`). Keep headline and action, cut the name lists.

Skills library (`starter-library-page.tsx`, `starter-libraries-panel.tsx`, `import-panel.tsx`, `library-table.tsx`)
- Primary object is below four large starter cards. Replace with the library table first and one "Add skills" menu (From a starter library, From a file, One skill).
- `starter-library-page.tsx:30` "Added skills need configuring before students can use them." Repeated in the success banner `starter-libraries-panel.tsx:73` ("Configure them before mapping.") and `import-panel.tsx:107` ("They are not configured yet, so they cannot be mapped to a course until you configure them."). Keep one: the status pill already says "Not configured".
- `import-panel.tsx:118` "Use the list you already have. No template or column order is needed. Skills are proposed for your review, and nothing is created until you confirm." Cut to the first sentence.
- `import-panel.tsx:147` "Categories come from the headings above each skill."; `:217` "These lines were not read as skills. They are shown as written so nothing disappears quietly. Add any skill you need after you create the others."; `:237-243` reason text duplicates the disabled button state and "You configure each one next." Cut all three; replace `:217` with an "Add as skill" action per unread line.
- `starter-libraries-panel.tsx:81` "Nothing is added until you copy."; `:92` "Already in your library. Tick it to add a second copy."; `:112-116` "Tick at least one skill to copy." (disabled button already says it).
- Card button labels repeat the library name: "Review BSN medical-surgical skills" (`:40`); use "Review".
- Library table: six columns plus two buttons per row (Configure, Edit) (`library-table.tsx:73-96`). Make the row open Configure; move Edit into it; drop "Library" and "Came from" to filters; the description under every skill name (`:77`) can be a tooltip.
- `library-table.tsx:103` dialog description "Evaluation settings are on Configure skill." Cut.
- Two progress meters with different meanings on two pages ("In use 12 of 31" on Home, "Configured 27 of 31, 12 in use" in Library). Pick one.

Configure wizard (`configure-wizard.tsx`, `wizard-steps.tsx`, `lib/v2/rules.ts`, `review.ts`)
- Step count: 7. Steps 3 Simulation, 4 Prerequisites, 6 "If a student does not pass" are not in REQ (`docs/v2/traceability.md:133`); candidates to fold into an "Advanced" disclosure or remove for the reference: keep 1 Model, 2 Achievement (+ minimums), 3 Evaluators and sign-off, 4 Review and publish.
- Step position stated three times: stepper header, `<h2>` "2. Achievement rules" (`configure-wizard.tsx:177`), footer "Step 2 of 7: Achievement rules" (`:197`). Cut the footer text.
- Two forward buttons: "Review and publish" outline and "Next: Simulation" primary (`:203-211`). Keep one primary.
- Status pill under the title (`:156`) repeated on Library.
- "Start from another skill ... This replaces the settings below." (`wizard-steps.tsx:84`) sits above the model choice. Move into a menu on the step header.
- Hints: `wizard-steps.tsx:156` (levels), `:187` "Keeps the evidence current.", `:224` "A minimum level is available when the skill uses levels of supervision.", `:228` and `:321` both say lab/simulation never count toward a named setting, `:337` "These must be done before a clinical attempt opens for the student.", `:402` "What happens when an evaluation does not meet the standard.", `:408` "A retake score cap applies to scored skills only, so it is not shown for this model." (explaining a control that is not shown). Cut `:224`, `:408`, one of `:228`/`:321`, `:337`, `:402`.
- "What this rule asks" card with "Strength: strong ... This is a strong rule. It asks for repeat evidence from several people." (`:270-273`, `rules.ts:208-214`). The sentence is useful (SC-17); the Strength grade is a v2 heuristic and a judgement. Keep the sentence, cut the grade.
- Review step: banner "No problems found. ... Read through what it will ask..." (`configure-wizard.tsx:269`), then cards with "Step N" descriptions (`:277`) and Edit buttons, then a repeated blocked reason (`:299-301`) after the error banner already lists problems (`:256`). Then a confirm dialog "Publish X?" repeating the button name (`:220-229`). Cut the success banner sentence, the "Step N" captions and the blocked reason; the dialog should show impact instead (P0 gap 1).

Courses (`map-courses-page.tsx`)
- Per-row "Note" column says "No gaps found." on every clean row and "See the coverage warnings above." otherwise (`:159`). Cut the column; show a warning icon only on rows with a warning.
- `:71` "What the course expects from the library." and `:84` "Warnings do not block students." Keep the second only.
- Default filter pins "Library: BSN medical-surgical" (`:33`), which hides the 4 other libraries until the filter is cleared.

Reports (`reports-page.tsx`, `export-sheet.tsx`)
- Students tab stacks three blocks: heatmap, Pace dot strip, behind-pace table (`:193-251`), plus "Show as table" toggle. "Pace" is a v2 assumption (D31); candidate to move behind the Skills/Students distinction or cut.
- Chart descriptions: `:194` "Weakest skills and students furthest behind come first.", `:222` "Evaluations collected against the expected pace.", `:254` "Students achieved, in progress or not started, weakest skill first.", `:273` "Gaps are not judgements: evaluators see different students." Keep `:273`, cut the others (the sort order is visible).
- Skills tab repeats the grid's column sublabels (`:144`) and the "One evaluator" flag; Method sheet has 5 definitions (`:312-324`); the cell sheet shows only "N of M counted" plus a link (`:299-310`) and should show the evidence list or be removed.
- Export sheet: "Check a PDF" section (`export-sheet.tsx:115-138`) is a document-verification utility, not an admin export need; the signature disclaimer (`:110-112`) is two sentences. Replace with Export > CSV / PDF and keep the checker out of the admin flow.
- Four KPI cards (`:136-141`) include "Evidence from simulation 2%" and "Skills with one evaluator" which are v2 additions [INFER]; keep the first two.

## 5. Visual and unverified

How visual was assessed: existing screenshots `docs/v2/screenshots/a3-viz-home.png`, `a3-viz-library.png`, `a3-viz-courses.png`, `a3-viz-reports.png` (generated 2026-10-26 03:13, match current code) and `v2-admin-configure-skill--step2-achievement-desktop.png`. I did not open a browser.

What the current screenshots show
- Home: 7-row nav, Set up meter and four action rows, then Needs attention, then Cohort chart. Good hierarchy, one filled button. Long vertical page; Cohort chart pushes below the fold.
- Library: four starter cards fill the first screen; the real library starts at about y=630 at 1440x900. Each library row carries two buttons.
- Courses: coverage bar, one warning banner, table with a "Note" column of repeated "No gaps found."; pre-filtered to one library.
- Reports: four KPI cards, filter bar, tabs, large heatmap (symbols and words in cells, no red), good accessible encoding.
- Wizard step 2: stale screenshot (see below).

Unverified (could not or did not check)
- Any runtime behaviour, a11y, focus order, responsive layout, and whether state really persists. Static HTTP only: `curl` status for `/v2/admin`, `/starter-library`, `/configure-skill`, `/map-courses`, `/reports` all 200; `/settings`, `/evaluators`, `/tags`, `/impact` 404.
- Stale screenshots: `v2-admin-configure-skill--step2-achievement-desktop.png` (2026-10-25 17:02) shows an old shell ("Scenario overview" nav, "Re-validation" step, "Step 2 of 8"); `v2-admin-configure-skill--step7-revalidation-desktop.png` is named for a step removed in code (`lib/v2/rules.ts:5-13` now has 7). Wizard visuals should be re-shot.
- Word and Excel import: code path exists, never exercised by the demo script per traceability; I did not run it.
- Level reorder after evidence (AE-06/07 gap) is code-reading only [INFER].
- Admin-facing parts of Review queue, Outcomes, Records, director verification are other workers' scope and not audited here.
- Whether Sankalp's prototype wants the Strength card or last-N rule: not checked against `docs/source/prism-skills-prototype.html`.

Commands used: `ls`, `cat -n`/Read on every file in scope, `grep -rn` for deactivate/tag/impact/audit/add skill/evidence source, `curl -s -o /dev/null -w "%{http_code}"` against localhost:3007 routes, `stat` for screenshot vs source mtimes, Read of screenshots.
