# 04 — Requirements Traceability (line-by-line)

Every ID in `source/requirements.extracted.txt`, with what the prototype actually did when clicked (2026-10-08, Playwright, 1440×900, scripts in `source/walkthrough-scripts/`).

**PROTO status key:** ✅ Shown · 🟡 Partial · ⚪ Not observed (could exist; I did not trigger it) · ❌ Not shown / absent · ⚠️ Contradicts REQ · ❓ Open decision
**Wave** is `[INFER]` build sequencing (see `build/01-build-plan.md`): W1 engine+library+config · W2 import+mapping · W3 student+evaluator · W4 review+revision · W5 reporting+export.

## SL — Skills library (§2)

| ID | Requirement (short) | PROTO | Wave | Note |
|---|---|---|---|---|
| SL-01 | Program-defined; no standard library | ✅ | W1 | Seed data is "Category A/Tag A… placeholder" |
| SL-02 | Name, description, active/inactive | ✅ | W1 | Step 1 of editor |
| SL-03 | Category optional, ≤1 per skill | ✅ | W1 | Select + "New" |
| SL-04 | Tags, any number, cross-category | ✅ | W1 | Chips + "New tag"; Tags tab shows "Where each tag reaches" |
| SL-05 | Create category/tag inline | ✅ | W1 | "New" / "New tag" in editor |
| SL-06 | Only active assignable; deactivated stays visible | ⚪ | W1 | Not triggered |
| SL-07 | Clinical settings list | ✅ | W1 | Tab shows evidence counts per setting |
| SL-08 | Lab instructors without Prism accounts (name+email) | ✅ | W1 | Tab text: "Nobody here can sign in, and no account is created" |
| SL-09 | Adopt student-named lab instructor | ✅ | W1 | "Named by students, not on the roster → Add to roster" |
| SL-10 | Search/filter by name, category, tag, status | 🟡 | W1 | Search + 3 selects (category incl. "No category", tag, status incl. "Needs configuration") |
| SL-11 | Deactivate withdraws but retains evidence | ⚪ | W1 | |

## IM — Import (§3)

| ID | Requirement | PROTO | Wave | Note |
|---|---|---|---|---|
| IM-01 | Bulk create from existing list | 🟡 | W2 | Paste worked; file path not exercised |
| IM-02 | Spreadsheet, document, PDF | ✅ | W2 | Built 2026-10-08: `/api/import/extract` reads .xlsx (exceljs), .docx (mammoth), text-layer .pdf (unpdf), .csv/.txt by code with no key; scanned PDF and legacy .xls/.doc report honestly. `tests/import-ai/routes.test.ts`, `tests/ui/import/ai.test.tsx`; real-browser upload of each type passed (`admin/.verify/typesafe/run.mjs`). Optional AI reading: TypeSafe, see `build/typesafe-import-design.md` |
| IM-03 | No template/column order | ✅ | W2 | Copy says so |
| IM-04 | Detect description, grouping, questions | 🟡 | W2 | Description + grouping built (rules, and the optional AI reading joins detail lines to the skill above, verbatim spans); evaluation questions are not proposed (OD-12 open) |
| IM-05 | Proposal only; edit/rename/merge/split/discard/add | 🟡 | W2 | Include checkbox, editable name/description; merge/split/add absent in view |
| IM-06 | Duplicate check vs library (skip/replace/keep both) | 🟡 | W2 | Counter "Possible duplicates 0"; resolution UI unseen. See OD-13 |
| IM-07 | Headings → categories | ✅ | W2 | "Create 3 new categories from the groupings" |
| IM-08 | Unreadable content reported with original text | ✅ | W2 | "Line 9: SECTION 2 — ADVANCED PROCEDURES — Looks like a section heading" |
| IM-09 | Created unconfigured; cannot map/submit | ✅ | W2 | Built: `lib/store/actions/mapping.ts` (only configured, active skills mappable), `lib/store/selectors/student.ts` (never offered to students). Browser-verified 2026-10-08 (production build, Playwright, contrast ON). Imported skills absent from mapping lists. |
| IM-10 | Visible count of unconfigured | ✅ | W2 | "8 skills… have not been configured" + Show them |
| IM-11 | Repeatable; know which import brought what | ⚪ | W2 | No import-batch label seen |
| IM-12 | Manual create remains | ✅ | W2 | Add skill |
| IM-13 | Explicit human confirmation always | ✅ | W2 | "Nothing is added until you confirm" |
| IM-14 | Copy / bulk-apply configuration | ✅ | W2 | Built 2026-10-08: store `copyConfigDraft`, `applyConfiguration` (per-target validation, confirmation for a different model or recorded evidence, dry run); S-09 "Copy configuration from another skill" and "Apply to selected skills"; S-04 bulk "Apply configuration". Tests: `tests/store/configure.test.ts`, `tests/ui/library/apply-config.test.tsx`, `tests/ui/configure/copy-config.test.tsx`. Prototype never showed it |
| IM-15 | Propose model/criteria? | ❓ | — | OD-12; PROTO proposes none |

## SC — Skill configuration (§4)

| ID | Requirement | PROTO | Wave | Note |
|---|---|---|---|---|
| SC-01 | Create ≠ configure | ✅ | W1 | |
| SC-02 | Exactly one model, explicit, no default | ✅ | W1 | Built: `lib/engine/validate.ts` (no model blocks save), `components/configure/model-picker.tsx` (nothing preselected). Browser-verified 2026-10-08 (production build, Playwright, contrast ON). |
| SC-03 | Binary: two labels, which qualifies, differ | 🟡 | W1 | "Unmet" label input; qualifying label shown as "Overall outcome is Met" |
| SC-04 | Program-defined question set (question/scored) | ✅ | W1 | Add question; Q1..Q3 |
| SC-05 | Question rule: all / ≥N of M / named subset | ✅ | W1 | Three radios; subset checkbox list |
| SC-06 | Rule satisfiable; subset non-empty; scalable | ⚪ | W1 | Validation not triggered; large-set UX untested |
| SC-07 | Scored: scale, average / min per question / total | 🟡 | W1 | "Average score is 3 or above" shown; other rules not enumerated |
| SC-08 | Ordered, program-defined levels | ✅ | W1 | "Ordered most-supervised first" |
| SC-09 | Changing model rebuilds criteria | 🟡 | W1 | Built: `lib/store/actions/configure.ts` `changeModelKind` with rebuild report and confirm dialog; unit and UI tested. Not exercised in the browser run. |
| SC-10 | Total demonstrations + min per level | ✅ | W1 | Step 3 |
| SC-11 | Minimum per named clinical setting | ✅ | W1 | "MINIMUMS BY CLINICAL SETTING — Choose settings…" |
| SC-12 | Lab never satisfies clinical setting | ⚪ | W1 | Engine rule; not visible |
| SC-13 | Student submission fields (5 types, mandatory) | ✅ | W1 | Label, Type select (date/short/long/number/choice), Required/Optional |
| SC-14 | Evaluator comment optional/mandatory per skill | ✅ | W1 | |
| SC-15 | Self-eval + admin approval toggles | ✅ | W1 | "Route: Student selects → Student self-evaluates → Evaluator completes → Administrator approves → Counts" |
| SC-16 | Allowed evaluator roles | ✅ | W1 | Preceptor / Clinical Faculty / Lab Instructor |
| SC-17 | Dependency visible | ✅ | W1 | "Configuration lineage" panel |
| SC-18 | Unsatisfiable configs unsavable | ⚪ | W1 | |
| SC-19 | Review everything student+evaluator will see | ✅ | W1 | "Form preview" |

## CM — Course mapping (§5)

| ID | Requirement | PROTO | Wave | Note |
|---|---|---|---|---|
| CM-01 | Offering = code, name, term, acad year, prof year, cohorts | ✅ | W2 | |
| CM-02 | Locate by search + cohort/term/year/prof year | ✅ | W2 | "14 of 42 offerings match", Clear |
| CM-03 | Mandatory / non-mandatory per offering | ✅ | W2 | Newly mapped defaults to Mandatory (observed) |
| CM-04 | Count mapped & mandatory | ✅ | W2 | "3/4" pills |
| CM-05 | Expectation not eligibility | ✅ | W2 | Banner copy + student "Other skills" |
| CM-06 | Requirement differs between offerings | ✅ | W2 | |
| CM-07 | One record per skill across courses | ✅ | W2 | "one student-level skill record is shared across courses" |
| CM-08 | Carry-forward between terms | ❓ | — | OD-01 |

## ST — Student submission (§6)

| ID | Requirement | PROTO | Wave | Note |
|---|---|---|---|---|
| ST-01 | See expected skills, mandatory, progress | ✅ | W3 | |
| ST-02 | Submit unmapped skill | ✅ | W3 | "Other skills" |
| ST-03 | Isolate already-submitted skills | ✅ | W3 | "Show only skills I have sent for review" |
| ST-04 | Submit several together | ✅ | W3 | |
| ST-05 | Clinical vs lab/sim recorded | ✅ | W3 | |
| ST-06 | Setting derived from placement; choose if several; location recorded | 🟡 | W3 | Choice list "Setting — Location"; single-option inference unseen |
| ST-07 | No placement → full settings list | ⚪ | W3 | |
| ST-08 | Evaluator role constrained; explain if none | 🟡 | W3 | Roles change by setting; "no valid combination" message unseen |
| ST-09 | Pick evaluator; or name lab instructor + email | 🟡 | W3 | Pick works; new-name path unseen |
| ST-10 | Enforce mandatory details | ✅ | W3 | Send disabled until valid |
| ST-11 | Self-eval against same criteria | ⚪ | W3 | Visible only in admin review ("STUDENT SELF-EVALUATION") |
| ST-12 | One student note, separate from evaluator comment | ✅ | W3 | "Student notes" |
| ST-13 | Confirmation: what/to whom/role/setting/location | 🟡 | W3 | Banner shows skills, person, role, mode; **setting & location absent** from banner; see DEFECT-01/02 |
| ST-14 | Setting/location once per submission vs per skill | ❓ | — | OD-07; PROTO = once per submission |

## EV — Evaluator (§7)

| ID | Requirement | PROTO | Wave | Note |
|---|---|---|---|---|
| EV-01 | No login; email link; no account | ✅ | W3 | Built: `app/(evaluator)/layout.tsx` (no shell, no login, noindex, no referrer). Browser-verified 2026-10-08 (production build, Playwright, contrast ON). Opened with a fresh context, no nav, no achievement words. |
| EV-02 | Preceptor / faculty / lab instructor | ✅ | W3 | |
| EV-03 | Cannot alter evaluation method | ✅ | W3 | |
| EV-04 | See student details + self-eval | 🟡 | W3 | Details yes; self-eval unseen on form |
| EV-05 | Several skills in one sitting | ✅ | W3 | |
| EV-06 | Mandatory feedback enforced | ✅ | W3 | Submit disabled until comment |
| EV-07 | Told if counts or held | ✅ | W3 | |
| EV-08 | Fixed vs program-defined roles | ❓ | — | OD-06 |

## AR — Admin review (§8)

| ID | Requirement | PROTO | Wave | Note |
|---|---|---|---|---|
| AR-01 | Queue with student, skill, course, setting, location, evaluator, role | ✅ | W4 | |
| AR-02 | Side-by-side self vs evaluator + agreement | ✅ | W4 | |
| AR-03 | Full responses | ✅ | W4 | |
| AR-04 | Review note retained | ✅ | W4 | |
| AR-05 | Approve counts / Return goes back for correction | ✅ | W4 | Built: label "Return for correction", neutral about who corrects (OD-16 open). `components/review/review-sheet.tsx`. Browser-verified 2026-10-08 (production build, Playwright, contrast ON). |
| AR-06 | Pending excluded from achievement | ✅ | W4 | Built: `lib/engine/achievement.ts` `isEligible` (complete AND approved when required). Browser-verified 2026-10-08 (production build, Playwright, contrast ON). Held evaluation not counted until approved. |

## RV — Revision (§9)

| ID | Requirement | PROTO | Wave | Note |
|---|---|---|---|---|
| RV-01 | Correct & resend returned/unassessed | ✅ | W4 | "Revise and resend" |
| RV-02 | Same record; revision count; reason retained | ✅ | W4 | "Revised and resent 1 time", reviewer note |
| RV-03 | Completed evaluation immutable; further attempt separate | ✅ | W4 | Built: `lib/store/actions/submissions.ts` (evaluations only appended). Browser-verified 2026-10-08 (production build, Playwright, contrast ON). Reopening a submitted link shows "already submitted", nothing editable. |
| RV-04 | Resubmit to different evaluator | ⚪ | W4 | |
| RV-05 | Counted/awaiting approval locked | 🟡 | W4 | Built: `isLocked` blocks edit and resend of counted or awaiting-approval submissions; unit and UI tested. Not exercised in the browser run. |
| RV-06 | Correction clears or retains answers | ❓ | — | OD-08 |

## SH — Student history (§10)

| ID | Requirement | PROTO | Wave | Note |
|---|---|---|---|---|
| SH-01 | Every submission, ordered, by attempt | ✅ | W3 | "Attempt 5…1" (newest first) |
| SH-02 | Outcome: counted / did not meet / returned / waiting+with whom | 🟡 | W3 | counted, returned, waiting seen; "did not meet" not |
| SH-03 | State the failed rule actionably | ⚪ | W3 | No failing example in seeded student |
| SH-04 | Counts of counted/outstanding/returned | ✅ | W3 | |
| SH-05 | Progress against each named setting | ✅ | W3 | Built: `components/student/skill-progress.tsx` per-setting progress. Browser-verified 2026-10-08 (production build, Playwright, contrast ON). Wound care 4 of 4 shows "You need 1 in Inpatient and have 0" (DEFECT-07). |
| SH-06 | All courses, narrowable | ✅ | W3 | "All courses (5) / NURS 350 only (1)" |
| SH-07 | Full completed evaluation | ✅ | W3 | View form |

## RP — Reporting (§11)

| ID | Requirement | PROTO | Wave | Note |
|---|---|---|---|---|
| RP-01 | Filters: cohort, group, course, category, tag, location, setting; each removable; applied evident | 🟡 | W5 | Seven filters present; per-filter removal unseen; Group disabled until cohort ("Select a cohort first") |
| RP-02 | By student: achieved/in progress/not met/attainment | ✅ | W5 | |
| RP-03 | By skill; mandatory when course-scoped | 🟡 | W5 | Table seen; mandatory column when scoped unseen |
| RP-04 | By tag, say overlap | ✅ | W5 | Footnote |
| RP-05 | Aggregate → individuals | 🟡 | W5 | Student→skills yes; skill→students not seen |
| RP-06 | To evidence without re-searching | ✅ | W5 | |
| RP-07 | Full evaluation viewable | ✅ | W5 | |
| RP-08 | Location/setting filter recalculates | ⚪ | W5 | |
| RP-09 | Impossible combo explained | ✅ | W5 | Built: `filterIssue` + `ImpossibleBanner` (`components/reporting/overview-view.tsx`). Browser-verified 2026-10-08 (production build, Playwright, contrast ON). "Mercy Home Health does not offer Emergency". |
| RP-10 | Export aggregate + row-per-evaluation; full filtered scope; filters recorded | 🟡 | W5 | Menu: "By student — this table" / "Evidence detail"; "current filters are written into the file header". Download not executed |
| RP-11 | CSV vs Excel | ❓ | — | OD-10; PROTO says "CSV, opens in Excel" |

## AE — Achievement engine (§12)

| ID | Requirement | PROTO | Wave | Note |
|---|---|---|---|---|
| AE-01 | Only completed evidence counts | ✅ | W1 | Built: only complete evidence counts (`lib/engine/achievement.ts`). Browser-verified 2026-10-08 (production build, Playwright, contrast ON). |
| AE-02 | Current rule re-applies to held evidence | 🟡 | W1 | Built: everything recomputed from the current rule (`previewImpact`, `previewDraftImpact`); unit tested. Not exercised in the browser run. |
| AE-03 | Achieved = every criterion | ✅ | W1 | Per-level + total shown |
| AE-04 | Four states | ✅ | W1 | Built: four states in `lib/engine/types.ts`; OD-03 display flag `skillStatusDisplay`. Browser-verified 2026-10-08 (production build, Playwright, contrast ON). Overview shows four columns. |
| AE-05 | One record per skill | ✅ | W1 | |
| AE-06 | Labels presentation-only | 🟡 | W1 | Built: outcomes keyed by stable ids, labels display-only; unit and property tested (rename invariance). Not exercised in the browser run. |
| AE-07 | Removal cascades | ⚪ | W1 | |
| AE-08 | Report no-evidence vs no-qualify separately | ❓ | — | OD-03; PROTO merges ("Not met includes skills with no qualifying evidence yet") |

## OD — Open decisions → see `05-open-decisions.md`

OD-01..OD-13 as listed in REQ §13; PROTO's implicit answers recorded there.

## Coverage summary (verified by `node .claude/hooks/check-req-ids.mjs --count`, 2026-10-08, after the fix pass)

113 requirement IDs in source · 113 rows here · none missing.
✅ 73 · 🟡 21 · ⚪ 12 · ❌ 0 · ⚠️ 0 · ❓ 7 (IM-15, CM-08, ST-14, EV-08, RV-06, RP-11, AE-08).
Ten rows were moved to ✅ because the code and the real-browser run (production build, Playwright, contrast on) agree: IM-09, SC-02, EV-01, AR-05, AR-06, RV-03, SH-05, RP-09, AE-01, AE-04. Four more (SC-09, RV-05, AE-02, AE-06) are built and unit tested but were not exercised in the browser, so they are 🟡. The earlier IM-14 move to ✅ stands. IM-02 moved to ✅ on 2026-10-08 (file extraction built and exercised in a real browser). Rows not listed here still carry PROTOTYPE-era statuses that have not been re-derived against the build. OD-01..13 are not counted (see `05-open-decisions.md`). Re-run the command after any edit; do not hand-edit these counts.
