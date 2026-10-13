# Design Contract — S-15 Student: my skills (all courses)

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Written 2026-10-08. Sources: `docs/ux/07` (S-15), `09` (S-15, §4), `10`, `11` (DEC-002, DEC-003), `docs/ux/03` (student sitemap), `docs/journeys/02-student-journey.md`, `docs/strategy/05, 06, 07`, REQ.

> **Requirement flag.** REQ does not ask for a separate cross-course page. It requires that a student's record for a skill cover every course with the ability to narrow to one (SH-06), that a student holds one record per skill (CM-07, AE-05) and that earlier submissions stay findable (ST-03). The prototype has only the per-course view plus an "All courses" toggle inside history (docs/source/screens/20). S-15 is therefore `[INFER]` from SH-06 and CM-07. **Confirm with Sankalp that REQ wants a cross-course overview before building;** if not, S-15 collapses into S-12 with an "All my skills" scope toggle and this contract is withdrawn.

## 1. Surface and wave

**Surface.**
S-15 Student: my skills (all courses)                               Wave: W3 [INFER; conditional on confirmation]

**Flows.**
F-11-like read path for the student; entry from S-12 and primary student nav; exit to S-14

## 2. Persona and RBAC

P-S Student. RBAC: own record only; no peers; no evaluator contact details [INFER].

## 3. Scope and data seen

One row per skill the student has evidence for or that is mapped to any of their courses; status, progress,  
courses where evidence was gathered. Never: other students, population attainment, admin notes.

## 4. Job to be done and why

**Job-to-be-done.**
"When I plan my last months or advising meeting, I want one view of every skill across all my courses, so I  
know what I have achieved and what is left."

**Why → So what.**
Evidence counts across courses, so the course view alone hides the real state of the record. Graduation  
readiness is a program-level question [CALL 03-05: "Will this student graduate from this program?"].

## 5. Requirements and open decisions

**Requirements.**
SH-04 SH-05 SH-06 CM-05 CM-07 AE-04 AE-05 ST-03 SL-11

**Open decisions hit.**
OD-03 (status rendering flag; show both renderings as OPEN, neither final; storage keeps 4 states),  
OD-01 (carry-forward of mappings changes which skills show as "expected"; do not infer expectations from  
past terms), OD-24 (inactive skills with evidence: see Behaviour), OD-14 (conditional drafts: none on this page).

## 6. Prototype reference (keep / do not copy)

None as a page. Related: docs/source/screens/19-student-view.png (per-course list) and 20-student-history.png  
(All courses toggle). KEEP: status chips, n of N lines. DO NOT COPY: the admin "view as student" selector;  
three-state status.

## 7. Pattern and reference hub

**Pattern.**
Route (student nav item "My skills"), table-like list with filters; no Sheet. History opens S-14.

**Reference hub (repo).**
No existing cross-course student record page. Closest: apps/pce/student/app/surveys/page.tsx (list with status  
badges) and apps/pce/student/app/page.tsx (entry). Layout reference only; both use inline styles to avoid.

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** `DataTable`, `FilterBar`, `StatusBadge` IMPORT; same status-tone mapping as S-01; EmptyState = VENDOR.


Verified @exxatdesignux/ui@1.5.1 on 2026-10-08; re-verify on the pinned version (PCE = 1.6.5); DSQ-1 open.  
list/table .......... DataTable ✓ for desktop (searchable, toolbarSlot); on mobile cards (CSS class responsive,  
                      not JS) [INFER]; or a plain list if <= ~50 rows
filters ............. FilterBar ✓ (chip rail, add/clear) or Select ✓ x2 (Course, Status) + Input search  
status .............. StatusBadge ✓ semantic (size sm/md only); text always  
progress ............ text "x of y" plus level and setting strips; ProgressCell ✓ only as a secondary cue  
summary line ........ plain text; KeyMetrics ✓ (max 4, variant flat) acceptable for the 3-4 counts if the  
                      reviewer prefers [INFER]
empty ............... EmptyState ✗ not exported (vendor candidate apps/pce/admin/components/empty-state.tsx)

## 9. Layout, content and behaviour

**Mobile-first [INFER].**
summary counts at top; each skill a card with status, progress, courses; "History" as a text action; filters in  
a bottom sheet; targets >= 44px.

**Content and behaviour.**
- **Summary (OD-03 flag, both renderings shown in the spec, neither committed):** A) Achieved x of N · In progress y · Evidence does not qualify z · No evidence yet w. B) Achieved x of N · In progress y · Not met (merges the last two). The component renders from the 4-state enum; the flag chooses the label set only.
- **Row:** skill name, status, progress line (`x of y demonstrations` or `x of y qualifying evaluations`), level strip for demonstration skills, per-setting progress (SH-05), "Courses with evidence" (e.g. NURS 350, NURS 410) and a History action (to S-14). Primary action: none filled; navigation only.
- **Filters (SH-06):** Course (All courses default, narrow to one), Category, Status. Narrowing recomputes nothing about the record: counts shown are the record's; the Course filter limits which rows appear and, on S-14, which attempts [INFER]. Search by skill name.
- **Unmapped skill with evidence** still appears (CM-05, ST-03). **Mapped but no evidence** appears as "No evidence yet".
- **Inactive skill with evidence (SL-11):** REQ withdraws the skill from selection and reporting scope but retains evidence. Proposal [INFER]: show it in a collapsed "Inactive skills" group, excluded from totals, History available; requires confirmation (OD-24 adjacent).
- **No mandatory flag on this page** because requirement level is per offering (CM-06); show "Mandatory in {n} of your courses" only when at least one course marks it mandatory [INFER].
- **Read-only:** no edit or send action here. A "Send for review" text link per row returns to S-12 for the relevant course [INFER]; choose the course if several.

## 10. States (L E Er V S Su D P Bl)

| State | Behaviour |
|---|---|
| L | Skeleton rows; counts skeleton |
| E | "You have no skills to show yet. Skills appear here once your program maps them to your courses, or you send one for review." |
| E (filtered) | "No skills match these filters." + Clear |
| Er | LocalBanner error with retry |
| V | n/a (search only) |
| S | Filtering is client-side for loaded rows; server search if the list is paged [INFER] |
| Su | n/a (read-only) |
| D | none |
| P | In progress rows with partial counts |
| Bl | Student with no placement or course mapping: still shows evidence rows; explanation line "Your program has not mapped skills to your courses yet." [INFER] |

## 11. Edge cases

EC-11 (unmapped evidence appears). EC-10 (deactivated skill: see Behaviour). EC-26 (two students with the same name does not apply; own record only). A skill achieved in one course and mapped as mandatory in another: Achieved everywhere (one record, CM-07). Transfer or term change: past-term courses stay listed under Courses [INFER]. A student with 100+ skills: pagination or virtualised list; DS `Pagination` is not exported in 1.5.1, DataTable pagination to be verified.

## 12. Copy and interactions

Copy: `docs/ux/09` §5 "S-15" and §4 (four-state labels, flag). Interactions: `docs/ux/08` P-18 (per-setting progress), P-13 (table keyboard), P-14 (loading). Do not write strings in code before they are added to `09`.

## 13. Accessibility (WCAG 2.1 AA)

- Table (or list) with row headers; sortable columns announce sort state; filters are labelled; result count in a live region ("12 skills shown").
- Status as text and tone; contrast verified in both themes before sign-off (not yet run).
- Targets >= 44px on mobile; focus ring visible; no hover-only actions.

## 14. Out of scope

Anything that sends, edits or revises (S-13/S-14); peer comparisons; population percentiles; remediation, notifications, expiry, patient-encounter linkage [REQ §14]; printing or PDF export ("print/save-friendly view for advising" is an `[INFER]` idea in `07`, not part of this contract).

## 15. Acceptance tests (Given / When / Then)

1. **SH-06, CM-07** Given a skill with evidence in two courses, When My skills loads, Then one row shows the combined progress and lists both courses.
2. **SH-06** Given the Course filter is set to NURS 350, When applied, Then only skills with evidence or mapping in NURS 350 remain and the record's counts are unchanged.
3. **CM-05, ST-03** Given a skill with evidence that is not mapped to any current course, When the page loads, Then the row appears.
4. **SH-04** Given a row, When the student activates History, Then S-14 opens for that skill with Counted / In progress / Returned counts.
5. **SH-05** Given the skill has setting minimums, When the row renders, Then each setting's progress is shown.
6. **AE-04, OD-03 flag** Given one skill with no evidence and one with non-qualifying evidence, When the flag is A, Then the summary counts them separately with the DEC-003 labels; When the flag is B, Then both fall under "Not met"; in both cases stored status is unchanged.
7. **AE-05** Given the same skill is mapped in two courses, When rows render, Then there is exactly one row for that skill.
8. **SL-11** Given a skill was deactivated after the student gathered evidence, When the page loads, Then it does not appear in the main list or totals and its evidence remains reachable (per the proposal).
9. **Empty state** Given a new student with no mappings and no evidence, When the page loads, Then the empty message is shown and no error.

## 16. Risks and unknowns (max 3)

1. S-15 may not be required by REQ (see the flag at the top); building it before confirmation risks wasted work.
2. The Course filter semantics (which rows, which attempts) is my interpretation of SH-06.
3. OD-03 and OD-24 are unresolved; labels and the inactive-skill group may change.

## 17. Vault notes consulted

`Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md` (program-level record, student ownership of the portfolio); `Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw: skills tracked across rotations and courses); `_Insights.md` skim; `Products/skills-checklist/personas.md` (empty placeholder).

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

None recorded in this draft beyond the fix-pass report.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** My skills is NOT part of the prototype. It stays reachable at `/my-skills` and `/my-skills/[skillId]` (by URL and the command menu entry 'My skills'), with a 'Back to Student View' strip on the page, and is not in the left nav. It can be removed without touching other surfaces.

**Why:** Romit: build the exact mockup; the prototype has one Student View page. This page exists only because SH-06 and CM-07 imply a cross-course record. Parity card P-11 (no equivalent).

**Unchanged:** SH-06, CM-07, AE-05, inactive-skills group, the OD-03 flag behaviour.

**Weakened or traded away (honest list):** Discoverability: a student reaches it only by URL or the command menu. Whether it is required stays an open question for Romit and Sankalp (listed in section 18).
