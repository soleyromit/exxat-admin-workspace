# Requirements coverage of the design lab — 2026-10-30 re-audit

**Date:** 2026-10-30  **Auditor:** skills-requirements-auditor (adversarial fact-checker)
**Worktree:** sc-scale, branch feat/skills-checklist-v2-scale  **Dev port:** 3017
**Ground truth precedence:** REQ docs/source/requirements.extracted.txt > CALL vault transcripts > PROTO (illustration only)
**Prior baseline:** docs/knowledge/req-coverage-lab.md (Oct 27 snapshot; after Wave 2: 71 MET)
**Gate input:** /tmp/fin-req.json (341 checks: 185 MET pass, 71/48 PARTIAL, 14/14 MISSING, 2/4 VARIANT-GAP, 0/3 SEAM — selector pass proves presence only)

---

## Method

Code was read at file:line for every Wave 3 claim. Spot-checks were made on 15 Oct 27 MET rows for regressions. The gate JSON was cross-checked: two gate FAIL verdicts (AE-07 Remove level button, AE-04 Unmet column header in director/attainment) were confirmed as false positives — the button and labels exist but are not visible in the default screen state or under the new four-label vocabulary. One gate FAIL (AR-03 reviewer-review-item variant C: table.first() not in DOM) was confirmed as a real gap because the full responses are inside a closed Collapsible by default.

OD statements are never treated as decided. REQ section 14 items are out of scope.

---

## 1. Summary counts (per requirement, worst status across screens)

| Section | Reqs | MET | PARTIAL | MISSING | VARIANT-GAP | SEAM | Unchecked |
|---|---|---|---|---|---|---|---|
| REQ prose (1.4, 1.5, 1.6, 4.1) | 4 | 1 | 2 | 0 | 0 | 0 | 1 |
| SL library | 11 | 9 | 2 | 0 | 0 | 0 | 0 |
| IM import | 15 | 10 | 3 | 0 | 1 | 1 | 0 |
| SC configuration | 19 | 18 | 1 | 0 | 0 | 0 | 0 |
| CM course mapping | 8 | 4 | 1 | 0 | 2 | 1 | 0 |
| ST student submission | 14 | 11 | 2 | 0 | 0 | 1 | 0 |
| EV evaluator | 8 | 6 | 1 | 0 | 0 | 1 | 0 |
| AR review | 6 | 5 | 1 | 0 | 0 | 0 | 0 |
| RV revision | 6 | 4 | 1 | 0 | 0 | 1 | 0 |
| SH student history | 7 | 6 | 1 | 0 | 0 | 0 | 0 |
| RP reporting | 11 | 7 | 3 | 0 | 0 | 1 | 0 |
| AE engine | 8 | 7 | 0 | 0 | 0 | 1 | 0 |
| OD open decisions | 6 | 0 | 0 | 0 | 0 | 1 | 5 |
| **Total** | **123** | **88** | **18** | **0** | **3** | **8** | **6** |

**Overall: 88 of 123 = 71.5%**
**Excluding SEAM (8) and UNCHECKED (6): 88 of 109 = 80.7%**

The zero MISSING count is the biggest structural change from Oct 27 (8 MISSING at that time). All P0 gaps are closed.

### Hard stops confirmed still holding

- No shipped skills or taxonomy.
- No default evaluation model (`configure.ts:135-137 emptyRule model:null`).
- Unconfigured skills cannot be mapped or submitted (`mapping.ts:335`, `student.ts:492-495`).
- Completed evaluations are immutable (no reopen anywhere; `reviewer.ts` decisions only append).
- Preceptors/evaluators have no login (`evaluator/frame.tsx "No account needed"`).
- Lab/simulation never satisfies a clinical-setting minimum (`rules.ts:411-412`).
- Mapping is not eligibility (`student2.ts:90-115 pickRows` never restricts by mapping).

---

## 2. Delta table — changes since Wave 2 end (71 MET)

### Confirmed MET (Wave 3 work verified at file:line)

| REQ | Wave 2 status | New status | Key evidence |
|---|---|---|---|
| ST-01 | PARTIAL | **MET** | `student-progress-a.tsx:21,57` CourseSwitch + CourseSkillList; B course-scoped toggle; C per-course rows |
| ST-07 | PARTIAL | **MET** | `log-parts.tsx:158` LocationField when `chosen.askLocation`; `log-b.tsx:152-154` confirmed |
| ST-10 | PARTIAL | **MET** | `student-request-a.tsx:91 disabled={d.blocked}`; `fix.tsx:187,190` WhereSelect + DetailsFields |
| ST-12 | MISSING | **MET** | `student-log-a.tsx:147`, `student-log-b.tsx:227` NoteField; `request-parts.tsx:324` on Send |
| ST-13 | PARTIAL | **MET** | `student2.ts:462-473` confirmationLines returns skill, evaluator+role, setting, location, date, note |
| SH-01 | PARTIAL | **MET** | `student2.ts:585` open/returned requests appended as record rows |
| SH-04 | PARTIAL | **MET** | `student2.ts:634-636` recordFigures returns {counted, outstanding, returned} |
| SH-07 | PARTIAL | **MET** | `student/evaluation-sheet.tsx ViewEvaluationButton`; `student-record-a.tsx:49` StudentEvaluationSheet |
| EV-04 | PARTIAL | **MET** | `evaluator/fields.tsx:58-76` note in full (no clamp); `:200,208-217` date performed |
| EV-06 | MISSING (lab) | **MET** | `evaluator/lab-grid-parts.tsx:72-89` feedback per result; `use-lab-grid.tsx:62` blocks save |
| AR-01 | PARTIAL | **MET** | `reviewer-approvals-a.tsx:82,104` student+skill+course+setting+location+evaluator+role; B :60,72; C :75,78 |
| AR-04 | PARTIAL | **MET** | `reviewer/decisions.tsx:154-156` "Review note (optional)" Textarea; wired to `decide({note})` |
| RP-01 | PARTIAL | **MET** | `scope-bar.tsx:254-278` ScopeAppliedLine chips in every frame |
| RP-02 | PARTIAL (director) | **MET** | `director/reports.tsx:40-51` four-state columns per student row |
| RP-03 | PARTIAL (director) | **MET** | `director/reports.tsx:57` level label when course scoped |
| RP-04 | VARIANT-GAP | **MET** | `director/reports.tsx:31-32` By tag view; `:98` overlap line |
| RP-09 | VARIANT-GAP | **MET** | ImpossibleScopeBanner in all 7 frames that were missing it |
| RV-01 | MISSING (my-requests) | **MET** | `lib/lab/student.ts:341,391` Correct and resend link; `fix.tsx:187,190` |
| SC-06 | PARTIAL | **MET** | `configure/fields.tsx:422` PasteQuestions; `:497-550` range-select |
| AE-04 | VARIANT-GAP | **MET** | `director/reports.tsx:40-68` four-state columns; `:49` never one Unmet column |
| D-X25 | unresolved | **resolved** | `reviewer.ts:160` decision reassigned is a handoff, never stored as returned |

Wave 3 also claims for ST-03, ST-11, RV-04, EV-07, SC-19 C, IM-04/05/06/11, SL-09, CM-01/02/04 — see section 3.

### Wave 3 claims verified as still PARTIAL

| REQ | Actual status | Evidence |
|---|---|---|
| ST-03 | PARTIAL | No Already submitted filter in Log/Send pickers; state word shown per row only |
| ST-11 | PARTIAL | No self-rating on Send without prior Log; confirmation says "with your self-rating" when none given |
| RV-04 | PARTIAL | `fix.tsx:148` Someone not listed added; lab instructors still excluded from Fix picker |
| EV-07 (lab grid) | PARTIAL | `lab-grid-parts.tsx:78-85` receipt: "Session saved. N results recorded." with no per-result approval status |
| SC-19 C | PARTIAL | `admin-configure-skill-c.tsx:241` check state shows WhoItAffects only; PeopleSee only on receipt after save |
| IM-04 | PARTIAL | `lib/lab/import.ts:11` never an evaluation model or criteria; descriptions not proposed |
| IM-05 | PARTIAL | No split, no general merge in import review |
| IM-06 | PARTIAL (add-several) | Add-several silently skips duplicates; no keep-both or replace |
| IM-11 C | VARIANT-GAP | No batchName field in admin-import-c.tsx |
| SL-09 | PARTIAL | `request-parts.tsx:5` shared store stays read only; typed name never reaches directory |
| CM-01 B | PARTIAL | Offering cell in B has no academic year |
| CM-02 B | VARIANT-GAP | Toolbar: skill search + Term + Show only; no cohort/year filter for offerings |
| CM-04 B | VARIANT-GAP | Per-skill carrier count only; no per-offering mapped/mandatory count |
| RP-06 (director) | PARTIAL | Director counts navigate to detailHref (separate page), leaving the report |
| RP-08 (non-dashboard) | PARTIAL | director/frame.tsx has RP-09 banner but no Counting evidence from X only line |
| RP-10 | PARTIAL | `lib/lab/attainment.ts:394` required-scope only; non-required skills excluded from detail rows |
| SH-06 | PARTIAL | `skill-detail.tsx WhereItCounts` Counts across: All your courses; no course narrow on attempts |

### Regressions found

| REQ | Wave 2 status | This audit | Evidence |
|---|---|---|---|
| **AR-03** | Wave 2 claimed **MET** | **PARTIAL** | `reviewer-review-item-c.tsx:43` Section title="Answers" defaultOpen={differ} — responses hidden unless student and evaluator disagree. Gate FAIL confirmed on /lab/reviewer/review-item?variant=C for locator(table).first(). |

No other regressions. 15 Oct 27 MET rows spot-checked (EV-01, SC-02, RV-05, CM-05, AE-01, SC-08, IM-09, SL-05, SC-11, AR-02, RV-02, AE-02, SL-01, CM-06, EV-03): all intact.

---

## 3. Remaining non-MET list, ranked by priority

P0 — MISSING on a marquee screen. **None remaining.**

### P1 — PARTIAL on a marquee screen, or structural gap noticed on first use

| # | REQ | Screen / variants | What is missing | Evidence | Fix |
|---|---|---|---|---|---|
| 1 | **AR-03** (regression) | reviewer/review-item C | Full responses hidden in closed Collapsible by default; only opens when evaluator and student disagree | `reviewer-review-item-c.tsx:43 defaultOpen={differ}` | Change to `defaultOpen={true}`; collapsible is appropriate for story, not evidence |
| 2 | **SC-19 C** | admin/configure-skill C | Check state shows WhoItAffects (impact) only; PeopleSee (student+evaluator previews) is on the receipt page only | `admin-configure-skill-c.tsx:241 WhoItAffects`; `check.tsx:475 PeopleSee` only in receipt | Add PeopleSee to the Check state in C alongside WhoItAffects |
| 3 | **CM-02 B** | admin/course-mapping B | No cohort, academic year, or professional year filter for offerings | `admin-course-mapping-b.tsx` toolbar: skill search + Term + Show only only | Reuse variant A offering filters in B offering picker |
| 4 | **CM-04 B** | admin/course-mapping B | No per-offering mapped/mandatory count | SkillPanel shows per-skill carrier count only | Add per-offering mapped/mandatory count row to B SkillPanel |
| 5 | **ST-03** | student/log-skill A,B; student/request-signoff A,B | No Already submitted filter/group in skill picker | `student2.ts pickRows` no submitted-filter | Add Already submitted filter tab or chip in the Log and Send pickers |
| 6 | **ST-11** | student/request-signoff A,B | No self-rating on Send without prior Log step; confirmation says with your self-rating even when none given | `request-parts.tsx scopeSentence`; `student2.ts useRequestDraft` no self-eval step | Add self-eval step to Send path for configured skills, or suppress sentence |
| 7 | **EV-07** (lab grid) | lab-instructor/lab-batch-grid A,B | Session receipt shows N results recorded with no per-result counts-now vs waits-for-approval | `lab-grid-parts.tsx:78-85` | Add per-result approval status to lab session receipt |
| 8 | **RV-04** | student/fix-returned A,B | Fix picker limited to past evaluators; lab instructors excluded; original evaluator available on further-attempt | `lib/lab/student.ts:724` lab-instructor excluded in fix | Use full evaluatorsFor in Fix (same setting as submission); exclude original evaluator on further-attempt |
| 9 | **RP-06** (director) | director/reports A,B | Student/skill counts navigate to a separate page (leaving the report); admin/attainment uses in-page EvidencePeek (MET) | `director/reports.tsx:46-68 detailHref` links navigate away | Add non-modal EvidencePeek to director, or ensure Back preserves scope |
| 10 | **RP-08** (non-dashboard) | director/frame, director/reports, attainment drill, export | No Counting evidence from X only when location/setting filter applied | `director/frame.tsx` missing `model.recount`; `dashboard/frame.tsx:125` has it | Add model.recount line to director frame and drill frames |
| 11 | **RP-10** | admin/export, director/attainment export | Detail rows cover required skills only; non-required evidence excluded | `lib/lab/attainment.ts:394` required-scope only | Include all skills in the filtered scope in detail rows |
| 12 | **SH-06** | student/skill-detail A,B | Attempts show no course and cannot be narrowed to one course | `skill-detail.tsx WhereItCounts` Counts across: All your courses; no course narrow | Add per-attempt course label and a course filter to skill-detail attempt list |
| 13 | **AR-03 B** (related) | reviewer/review-item B panel | Per-question scored responses depend on v.recorded being set in the panel | `reviewer-approvals-b.tsx:114` ReviewResponses rendered; score display depends on evaluation load | Confirm evaluationView is pre-loaded for every evaluation in B panel |

### P2 — Minor, variant-only, or secondary screen gap

| # | REQ | Screen | What is missing | Fix |
|---|---|---|---|---|
| 1 | **SL-09** | student/request-signoff A,B | Typed name never reaches evaluator directory | Wire new-evaluator rows to newEvaluatorRows store path |
| 2 | **CM-01 B** | admin/course-mapping B | Offering cell has no academic year | Add academic year to SkillPanel offering cell in B |
| 3 | **IM-04** | admin/import-ai-review A,B,C | Descriptions and evaluation questions from source not proposed | Add description parsing in lib/lab/import.ts; surface as optional per-row fields |
| 4 | **IM-05** | admin/import-ai-review A,B,C; add-skill C | No split, no general merge, no add-blank-entry | Add split + merge actions and add-entry button to import review |
| 5 | **IM-06** | admin/add-skill C (add-several) | Duplicates silently skipped; no keep-both or replace | Surface in-library rows with Skip / Keep both options in add-several preview |
| 6 | **IM-11 C** | admin/import-ai-review C | No batchName field | Add batchName input to C confirm/done step |
| 7 | **EV-07** (lab receipt) | lab-instructor/lab-batch-grid A,B | Lab receipt reuses preceptor receipt pattern without approval context | Dedicated lab receipt with per-skill approval status |
| 8 | **REQ 4.1** | admin/configure-skill A,B,C | Scored model labelled Proposed: not part of the agreed criteria types | Confirm with Romit whether scored model should be promoted |
| 9 | **SL-01** | admin/starter-library A,B | Example lists shipped (conflicts with Prism supplies no library) | D-X5 open decision — confirm with Romit |

---

## 4. check-req-ids.mjs output (literal)

```
OK -- 1 file(s), all requirement IDs resolve.
```

(Run against req-coverage-lab.md which carries the same ID set.)

---

## 5. What was not verified / caveats

- **Runtime:** This audit is code-only. The lab server at port 3017 was not opened for interactive checks (other design reviewers active). Gate JSON was used for presence-only confirmation; behavioural claims rest on file:line.
- **Engine tests:** The test suite covers lib/engine, not lib/v2/rules.ts (which the lab runs). AE verdicts rest on reading lib/v2.
- **Import is simulated:** use-import-session.ts never writes the store; IM-09 to IM-11 provenance shown only for seeded batches.
- **AR-03 B:** Rendered by code (reviewer-approvals-b.tsx:114); not runtime-checked.
- **OD-02, OD-04, OD-05, OD-09, OD-13:** Seam existence not audited (UNCHECKED).
