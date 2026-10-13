# Design Contract — S-12 Student: course skills

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Written 2026-10-08. Sources: `docs/ux/07` (S-12), `08` (P-08, P-18), `09` (S-12 copy), `10`, `11` (DEC-001, 002, 003), `docs/journeys/02-student-journey.md`, `docs/strategy/05, 06, 07`, REQ in `docs/source/requirements.extracted.txt`.

## 1. Surface and wave

**Surface.**
S-12 Student: course skills                         Wave: W3

**Flows.**
F-06 (entry), F-09, F-10 (via S-14), F-11 n/a

## 2. Persona and RBAC

P-S Student (own login). RBAC: sees ONLY own record and own placements;  
no peer data; no evaluator contact details beyond name and role [INFER, workspace RBAC row "Student User:  
zero peer visibility; no preceptor contact info"; REQ silent].

## 3. Scope and data seen

Own course enrolment; skills mapped to that course (mandatory / non-mandatory) and "Other skills";  
own status, progress and waiting requests. Never: other students, unconfigured or inactive skills  
[REQ IM-09, SL-11], admin review notes of other students, how many students achieved.

## 4. Job to be done and why

**Job-to-be-done.**
"When I start or continue a rotation, I want to see what my course expects and how far along I am,  
so I can choose what to ask my evaluator to sign off today."

**Why → So what.**
The student is the trigger and owner of the record [CALL 03-05]. If this screen cannot answer  
"what do I still need" in two seconds, students skip sending evidence and the program cannot prove  
readiness. DEFECT-07 (4 of 4 but not achieved, no reason) is the failure to avoid.

## 5. Requirements and open decisions

**Requirements.**
ST-01 ST-02 ST-03 ST-04 SH-02 SH-04 SH-05 SH-06 CM-03 CM-05 CM-07 IM-09 SL-11 SC-11 SC-12 AE-04 AE-05

**Open decisions hit.**
OD-03 (status rendering flag, seam: store 4 states, render by one flag; show neither rendering as final),  
OD-14 (conditional "Continue self-evaluation" draft row; absent by default),  
OD-07 (n/a here; passed to S-13), OD-24 (skill deactivated while a request is in flight: leave the  
waiting row as it is, no new state; seam only), OD-P1 (placement of the module; routes use {base}).

## 6. Prototype reference (keep / do not copy)

docs/source/screens/19-student-view.png (+ 21 for the bar -> dialog hand-off).  
KEEP: waiting strip; mandatory / non-mandatory chips; history link per skill; collapsed "Other skills"  
row with count; sticky action bar; "Show only skills I have sent for review".  
DO NOT COPY: progress bar as the only progress cue; "In Progress" with no reason when a setting minimum  
is missing (DEFECT-07); two stacked blue primaries (bar + dialog); admin "view as student" switcher  
(demo device); three-state status labels (DEFECT-04).

## 7. Pattern and reference hub

**Pattern.**
Route: a "Skills" section on the clinical course page (student) [CALL 09-23: course activities ->  
forms, evaluations, patient logs, then skills]; plus S-15 for the cross-course view. Sticky bar (P-08)  
opens S-13 as a Sheet.

**Reference hub (repo).**
Closest existing student-app list surfaces: apps/pce/student/app/surveys/page.tsx (193 lines, card list  
with status badges and per-item action) and apps/pce/student/app/activities/page.tsx (236 lines, header  
+ greeting + open/completed sections + expired-link state). Layout reference only: both use inline styles  
and `py-20 text-center` (banned in docs/governance/design-anti-patterns.md); do not copy those.  
No student hub with multi-select + sticky bar exists in the repo; this is net-new.

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** C-17 sticky selection bar = HAND-ROLL on `BadgeCount` + `Button` (S-12 is a custom list, not a hub DataTable). C-12 progress-by-setting = HAND-ROLL numeric rows. EmptyState = VENDOR.


Verified with `node tools/ds/source.mjs` against @exxatdesignux/ui@1.5.1 on 2026-10-08.  
Caveat: PCE resolves 1.6.5; re-verify against the pinned version before build (docs/ux/10 blocking TODO).  
DSQ-1 (resolved as a proposal by ds-adoption-reviewer, pending Romit; the product CLAUDE.md still lists studentUX and was not edited): the repo's student apps import `@exxat/student/components/ui/*`  
(studentUX); this product's CLAUDE.md says Student uses studentUX while workspace says @exxatdesignux/ui is  
canonical for all products. Mapping below uses @exxatdesignux/ui; the studentUX equivalents exist for  
checkbox, sheet, radio-group, collapsible, skeleton, progress, textarea, empty, floating-action-bar.  
  row list ............ list of rows (not DataTable: a skills list is <= ~50 mixed-content rows) [INFER]; DataTable only if the  
                        reviewer prefers one grid for "Other skills" search at library scale
  select checkbox ..... Checkbox ✓ (variant/size/motion props; aria-label per row)  
  mandatory/status .... Badge ✓ for Mandatory / Non-mandatory; StatusBadge ✓ semantic mode (label+tone+icon,  
                        size sm/md only) for skill status; status always text, never colour alone
  progress ............ text "x of y" first; ProgressCell ✓ (value, max, tone, label) optional secondary only;  
                        "progress bars are last resort" memory; no red [Aarti]
  banners ............. LocalBanner ✓ (variant error|success|warning|info|promo; NO `emphasis` prop on LocalBanner,  
                        it exists only on SystemBanner; this corrects docs/ux/08 P-18 wording)
  collapsed section ... Collapsible ✓ or Accordion ✓ for "Other skills"  
  search .............. Input ✓ / InputGroup ✓ inside "Other skills"; results list  
  action bar .......... custom sticky region (no DS component for a selection bar in @exxatdesignux/ui; studentUX has  
                        floating-action-bar): VENDOR/HAND-ROLL proposal pending reviewer
  loading ............. Skeleton ✓  
  empty ............... EmptyState ✗ not exported (vendor candidate apps/pce/admin/components/empty-state.tsx)

## 9. Layout, content and behaviour

**Mobile-first [INFER].**
single column; header collapses to course select + "Waiting (n)" disclosure; row = checkbox, name,  
badges, one summary line, "History (n)"; sticky bar above the safe-area inset; targets >= 44px;  
"Other skills" opens as a full-screen list on small viewports.

**Layout and content.**
Follow the wireframe in `docs/ux/07` §S-12 exactly for region order: course header, Waiting strip, filter toggle, **Expected on this course** (mandatory first, then non-mandatory, each by name), **Other skills** (collapsed, searchable), sticky selection bar.
- Per-skill row: name, requirement badge, status (four-state enum, label per `09` §4 behind the OD-03 flag), one progress line (`x of y demonstrations` or `x of y qualifying evaluations`), per-level strip for demonstration skills, **per-setting progress line** (P-18) when the criteria include setting minimums, and `View history (n)`.
- When the status is In progress but only a missing part remains, say what remains ("Still needed: 1 in Emergency") [REQ SH-05, SH-03 spirit; DEFECT-07].
- Lab evidence is shown separately ("Lab: 2 recorded, not counted toward clinical settings") so SC-12 is never a surprise.
- Achieved skills stay selectable with the note "You can still request another evaluation if your program wants more evidence" (prototype copy; REQ silent) [INFER].
- Waiting strip lists each request with skill, evaluator and role [REQ SH-02]. After OD-24, a deactivated skill's waiting row stays unchanged.
- Primary action: **Send for review** in the sticky bar (only filled primary); it becomes `outline` once S-13 is open (P-08).

## 10. States (L E Er V S Su D P Bl)

| State | Behaviour | Source |
|---|---|---|
| L | Skeleton rows matching the list shape; header text renders first | strategy/06 |
| E (no mapped skills) | "No skills are mapped to this course yet. You can still send other skills for review." Other skills section stays available | `09` S-12; CM-05 |
| E (filtered to zero) | "No skills match." plus a Clear control for the sent-only filter | [INFER] |
| Er | LocalBanner error with retry: "Your skills could not be loaded. Try again." | `09` S-12 |
| V | n/a (no free input here except search) | |
| S | Selecting rows is instant and local; no network on selection | P-14 |
| Su | After S-13 sends: LocalBanner success naming skills, evaluator, role, setting, location; waiting strip updates; selection cleared; focus returns to the first waiting row [INFER] | ST-13 |
| D | Skill rows that cannot be selected (unconfigured, inactive) are not shown at all, never greyed [IM-09, SL-11] | |
| P | Per-skill status In progress with partial counts; conditional draft row only if OD-14 is accepted | AE-04 |
| Bl | A skill with no valid evaluator role for any setting cannot be sent: row stays selectable but S-13 explains (ST-08); S-12 does not block selection | ST-08 |

## 11. Edge cases

EC-11 submits unmapped skill (Other skills works, counts toward record). EC-25 asks again after achieved (allowed). EC-12 / EC-13 / EC-14 resolved inside S-13. EC-10 (skill deactivated mid-term): row disappears from selection; evidence retained and visible on S-14/S-15 [SL-11].
Also: student is in two courses (course select); same skill mapped in both: progress is the same record in both views [CM-07, AE-05].

## 12. Copy and interactions

Copy: `docs/ux/09-content-and-microcopy.md` §5 "S-12", §4 (status labels), §7 (failed-rule and setting text). Do not write new strings in code; add them to `09` first. Interactions: `docs/ux/08` P-08 (sticky bar), P-18 (progress by setting), P-13 (focus), P-14 (loading), P-17 (error recovery).

## 13. Accessibility (WCAG 2.1 AA)

- Row checkbox has `aria-label="Select {skill}"`; selection count in a polite live region; bar is `role="region" aria-label="Selection actions"`; skip link "Go to selection actions".
- Status and requirement are text + shape, never colour alone; contrast checked on both themes before sign-off (not yet run).
- Targets >= 44px on student surfaces [INFER; WCAG minimum is 24px]; focus ring visible; the sticky bar must not cover the focused row (scroll-padding).
- Closing S-13 returns focus to the Send for review button; after a successful send focus goes to the success banner then the waiting strip.

## 14. Out of scope

Notifications, reminders, escalation; remediation; skill expiry; patient-encounter linkage; Evaluations migration [REQ §14]. QR codes, heat maps, learning-contract linkage, batch grids. Showing peer data. Any default evaluation model. Student editing mapping or requirement levels.

## 15. Acceptance tests (Given / When / Then)

1. **ST-01** Given a student enrolled in NURS 350 with 5 mapped skills (3 mandatory), When they open the course Skills section, Then each skill shows its Mandatory or Non-mandatory badge and a progress line, mandatory skills first.
2. **ST-02, CM-05** Given a skill not mapped to NURS 350, When the student opens Other skills and selects it, Then it can be sent and the row says evidence still counts toward their record.
3. **ST-03** Given the student has sent 3 of 9 skills, When they switch on "Show only skills I have sent for review", Then only those 3 appear.
4. **ST-04** Given the student ticks 2 skills, When the bar appears, Then it shows "2 skills selected", Clear, and one filled Send for review; activating it opens S-13 with both skills.
5. **SH-02** Given a request is outstanding with a preceptor, When the page loads, Then the Waiting strip names the skill, person and role.
6. **SH-04** Given 4 counted, 1 outstanding, 1 returned submissions for a skill, When the student follows History, Then the three counts are shown (verified on S-14; S-12 links there).
7. **SH-05, SC-11, SC-12** Given Wound Care needs 1 in Inpatient and 1 in Emergency and the student has Inpatient 1 and a lab demonstration, When the card renders, Then it shows "Inpatient 1 of 1" and "Emergency 0 of 1", says what is still needed, and shows the lab evidence as not counted toward settings.
8. **SH-06, CM-07, AE-05** Given evidence for IV Insertion exists from NURS 410, When the student views NURS 350, Then progress includes that evidence (one record per skill).
9. **CM-03** Given IV Insertion is mandatory in NURS 350 and non-mandatory in NURS 410, When the student switches course, Then the badge changes and progress does not.
10. **IM-09, SL-11** Given one skill is unconfigured and one is inactive, When the list loads, Then neither appears in Expected or Other skills.
11. **AE-04** Given a skill has evidence but none qualifies, When status renders, Then it reads "Evidence does not qualify" (or the merged label under OD-03 flag B), never "No evidence yet".
12. **P-08** Given S-13 is open, When the student looks at the page, Then only S-13's Send request is filled; the bar's button is outline.
13. **Mobile [INFER]** Given a 390px viewport, When the list is shown, Then the bar sits above the safe-area inset and every target is at least 44px.

## 16. Risks and unknowns (max 3)

1. DS source for the student app is unresolved (DSQ-1); the component mapping may change.
2. Per-setting and per-level progress text may become long for skills with many minimums; test with 3+ settings.
3. "Other skills" search over a large library is unverified in the prototype and unspecified in REQ; may need server-side search.

## 17. Vault notes consulted

`Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw: mandatory vs recommended sections, students may submit other skills, "course activities" placement); `Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md`; `_Insights.md` skim (no further student-skills notes); `Products/skills-checklist/personas.md` (empty placeholder, nothing to use).

Reject if: a state is "TBD", an OD is treated as decided, or the only reference is the prototype. None of these hold at drafting; reviewers verify.

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

None recorded in this draft beyond the fix-pass report.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Mobbin references (added 2026-10-08)

See `docs/research/meetings/2026-10-08-mobbin-remaining-surfaces.md` §M-6. Partial: bottom bar with selected count, Clear and one primary (Copilot Money, Magnific). No precedent for defaults derived in the next dialog (ST-06).

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** S-12, S-13 and S-14 are one prototype page, Student View (`/student`; `?course=`, `?send=1&skills=`, `?history=`): 'Viewing as student' and 'Clinical course' selects, cohort and placement text, the 'Awaiting preceptor evaluation' card, the 'Show only skills I have sent for review' row, 'Mapped to this course' rows (requirement pill, status, `n in progress` pill, ProgressCell bar, `n / N` text, View history), a collapsible 'Other skills', and the sticky 'n skills selected' bar. The old `/courses...` URLs redirect here. `/my-skills` is not in the left nav; it is reachable by URL and from the command menu, and its own page carries a 'Back to Student View' strip.

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-11 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** ST-01..ST-04, CM-05, CM-07, IM-09/SL-11 (unconfigured and inactive skills hidden), SH-05 per-setting progress, DEFECT-07 reason text, student sees only their own record.

**Weakened or traded away (honest list):** The student shell is the shared DS shell (not a separate mobile-first shell); the 'viewing as' switcher is demo-only. Mobile behaviour of the page itself was checked only for overflow and 44px dialog targets.
