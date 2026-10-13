# Design Contract: S-10 Course mapping

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: `[INFER]` items are accepted proposals and every `OD-*` stays OPEN, built as its named seam.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Tags: `[REQ id]` · `[OD-n]` · `[PROTO]` (illustration only) · `[CALL 09-23]` · `[CALL 03-05]` · `[INFER]`. Precedence REQ > CALL > PROTO > INFER.

Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08


## 1. Surface and wave

**Surface.**
S-10 Course mapping (master-detail: clinical course offerings | skills mapped to the selected offering)   Wave: W2

## 2. Persona and RBAC

P-A Program administrator. [REQ §5]. RBAC row: Administrator (program scope; the exxat-domain-context 'Super Program Admin' row), own program, "no institutional config; no cross-program data" [exxat-domain-context RBAC table]. Students see the OUTPUT of this surface in S-12, never the surface.

## 3. Scope and data seen

Clinical course offerings of the admin's program and their cohorts; configured, active skills only. Must NOT show: unconfigured skills [REQ IM-09] or inactive skills [REQ SL-11] as mappable; any student-level data.

## 4. Job to be done and why

**Job-to-be-done.**
When a term's offerings are set up, I want to say which skills each offering expects and which are mandatory, so students know what the rotation requires.

**Why → So what.**
Why: "students know what is expected of them on a given rotation" [REQ §5; journeys/01 stage C]. So what: students open S-12 and see mandatory vs non-mandatory skills per course without asking. Mapping is a recommendation, not a gate [REQ CM-05; CALL 09-23: "it's more like a recommendation ... students are free to apply for other skills"].

## 5. Requirements and open decisions

**Requirements.**
CM-01, CM-02, CM-03, CM-04, CM-05, CM-06, CM-07, IM-09, SL-11, SC-01 (only configured skills mappable). CM-08 and the OD-01 seam below.

**Open decisions hit.**
OD-01 (carry-forward between terms, or catalogue-level default with per-offering override): seam = mapping is stored per offering (`OfferingSkillMap`), with an OPTIONAL nullable `catalogueCourseId` default layer. NO carry-forward UI, no "copy to next term" shortcut, no copy that implies carrying over [docs/ux/09 S-10 row "Carry-forward OD-01: do not show any copy about carrying mappings between terms"].  
Contradiction to resolve (not an OD): vault research note defines course offering as a 4-tuple course x term x cohort x faculty at platform level [Research/exam-management/research/meetings/2026-05-08-aarti-curriculum-mapping.md, D3] while REQ CM-01 lists code, name, term, academic year, professional year and cohorts (no faculty). The mapping key must be confirmed against the Prism offering entity before build; keyed here by offering id, not by the tuple.  
OD-02 (competency link): none built. Bulk map (apply a skill set to many offerings) is [INFER], deferred until OD-01 is answered.

## 6. Prototype reference (keep / do not copy)

docs/source/screens/17 (mapping), 08 (library "Courses" count, link back).  
KEEP [PROTO 17]: master-detail layout; mandatory/total pill per offering; "Also mapped in …" cross-reference line per skill; filter row with Clear; the banner that mapping does not restrict submission.  
DO NOT COPY: defaulting a newly ticked skill to Mandatory (REQ CM-03 says "marked either mandatory or non-mandatory", silent on default); 42 flat offerings with no grouping; "0/0" shown for offerings with no cohort without explanation.

## 7. Pattern and reference hub

Route with master-detail. Left: searchable, filterable offerings list (DataTable or listbox). Right: skills panel for the selected offering. Changes save per row (no global Save), with an inline "Saved" confirmation. Reference hubs in repo (read): apps/pce/admin/app/(app)/admin/offerings/[code]/page.tsx (offering detail by code); apps/pce/admin/app/(app)/admin/courses/page.tsx (course list with KeyMetrics and DataTablePaginated); apps/pce/admin/components/pce/course-offering-list.tsx (offering list component); apps/pce/admin/app/(app)/course-evaluation/term-setup/page.tsx (term setup with a DataTable). PCE uses its local vendored DataTable; DS DataTable is the workspace rule — verdict pending ds-adoption-reviewer.

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** `DataTable`, `FilterBar` IMPORT. Master-detail layout is plain composition. `ToggleGroup` for Mandatory / Non-mandatory only if `type="single"` is confirmed on the pinned version, else `RadioGroup`. EmptyState = VENDOR.


Verified with `node tools/ds/source.mjs` 1.5.1 (name-diffed to PCE 1.6.5; prop drift not diffed).  
PageHeader ✓ · DataTable ✓ / DataTablePaginated ✓ (offerings list; 42+ rows; IMPORT) · FilterBar ✓ + AddButton + ClearButton (cohort, academic year, term, professional year chips; IMPORT) · Input ✓ / InputGroup ✓ (search) · Select ✓ (filter values) · Checkbox ✓ (map toggle; CheckboxLabel for a larger target) · ToggleGroup ✓ for Mandatory / Non-mandatory (Radix Root; single-select is a root prop NOT shown in the .d.ts excerpt — VERIFY; fallback RadioGroup ✓ with itemVariant/itemSize) · StatusBadge ✓ / Badge ✓ (mandatory/total pill; configured model badge) · LocalBanner ✓ (rule note, saved, error) · Skeleton ✓ · Tooltip ✓ · Button ✓ (explicit variant+size).  
Not exported: Pagination (use DataTablePaginated), EmptyState (VENDOR candidate apps/pce/admin/components/empty-state.tsx), MultiSelect, Combobox. Layout (master-detail) is plain composition, no new shared primitive. Verdicts: IMPORT ✓ rows; VENDOR EmptyState; HAND-ROLL master-detail layout only — pending ds-adoption-reviewer.

## 9. Layout, content and behaviour

See the wireframe for S-10 in docs/ux/07 and the sections around this one; no additional layout rules were drafted.

**Entry mode from S-04 (IS-2).** `…/course-mapping?skill={skillId}` opens S-10 with the offerings list filtered to those where that skill is mapped; header "Offerings where {skill} is mapped ({n})"; each row shows the skill's requirement (Mandatory / Non-mandatory) for that offering; Clear returns to all offerings; the right panel behaves as normal. This is the target of the S-04 "Courses" count link (CM-04, CM-07). Counting rule: offerings mapped today only; no claim about carry-forward (OD-01).

## 10. States (L E Er V S Su D P Bl)

L   Offerings list skeleton rows; detail panel skeleton on selection change; nothing is optimistic that affects what students see (mapping is not achievement-critical but IS student-facing; save waits for the server, button/row marked "Saving" with `aria-busy`) [INFER, docs/ux/08 P-14].  
E   No offering matches filters: "No course offerings match these filters." + Clear. No configured skills: "No configured skills are available to map. Configure skills in the library first." with link to S-04 (IM-09). Offering with no cohort: "No cohort is enrolled in this offering yet. You can still map skills." (the prototype showed only 0/0).  
Er  Save failure on a row: that row reverts to its previous state and shows an inline error "This change was not saved. Try again." plus a LocalBanner if several fail; list failure: LocalBanner error with Try again.  
V   A skill cannot be saved as mapped without a requirement chosen: ticking the checkbox reveals the Mandatory / Non-mandatory control with nothing selected and the row stays "not yet saved" with helper "Choose mandatory or non-mandatory" [INFER, flagged for Romit; REQ CM-03]. Skills only mappable if configured and active.  
S   Per-row "Saving" then "Saved" (inline text, polite live region).  
Su  Counts in the offering row update immediately after a saved change (CM-04).  
D   Skills unconfigured or inactive are not listed. The search box and filters are never disabled.  
P   Offering with some skills mapped: pill "3 of 4 mandatory" style shows mandatory out of total mapped (CM-04). A row mid-change shows "Saving".  
Bl  Attempting to unmap a skill that students already have in-flight submissions against: NO block (mapping is expectation, not eligibility, CM-05; evidence still counts, CM-07). The row states "Evidence already recorded for this skill is kept."

## 11. Edge cases

EC-11 (unmapped skill still submittable), EC-28 and EC-9/EC-10 (unconfigured and deactivated skills are not mappable), EC-6 (rule change does not alter mapping), same course across many terms (REQ CM-02, "volume of offerings is significant"): grouping and search must make a 42-row list workable. CM-06 (same skill can be mandatory in one offering and non-mandatory in another): the "Also mapped in …" line shows the other offerings AND their requirement [INFER; PROTO shows names only].

## 12. Copy and interactions

**Copy.**
docs/ux/09 §5 S-10 (title, subtitle, rule note, offerings header, filters, panel title, row, empties); the rule note is mandatory on the page. Terms: "Mandatory" and "Non-mandatory" exactly as REQ CM-03 (the call also says "recommended"; REQ governs, conflict C-3 in docs/strategy/07). No carry-forward copy.

**Interactions.**
docs/ux/08 P-06 (filter chips and Clear), P-14 (loading, no optimistic student-facing change), P-13, P-17.

## 13. Accessibility (WCAG 2.1 AA)

Master list is a labelled region with a result count live region ("14 of 42 offerings match"); offering row is a button with name "NURS 301, Fall 2026, Year 1, 3 mandatory of 4". Map checkbox accessible name "Map {skill}"; the requirement control is a labelled group "Requirement for {skill}". Keyboard: arrows move across offerings, Tab enters the detail panel, Space toggles map, arrows change requirement. Status not colour only. Axe on default, filtered, empty and row-saving states.

## 14. Out of scope

Carry-forward or copy-to-next-term (OD-01); bulk map across offerings (deferred [INFER]); eligibility gating of submissions (CM-05 forbids); student-level views; competency linkage (OD-02); notifications to students when a mapping changes (REQ §14); migration of existing Evaluations data (REQ §14); the 4-tuple/faculty dimension (confirm against the Prism offering entity first).

## 15. Acceptance tests (Given / When / Then)

CM-01   Given an offering, When it is listed, Then it shows course code, name, term, academic year, professional year and its enrolled cohorts.  
CM-02   Given 42 offerings, When I search "NURS 350" and filter Cohort BSN 2026, Then the list narrows and the header reads "{n} of 42 offerings match"; Clear restores all.  
CM-03   Given a configured skill, When I map it, Then I must record Mandatory or Non-mandatory before it is saved, and the saved value is shown.  
CM-04   Given an offering with 4 mapped skills of which 3 are mandatory, When I view the list, Then it shows 3 mandatory of 4 and the detail panel header repeats it; changing one to non-mandatory updates both without reload.  
CM-05   Given a skill not mapped to NURS 350, When a student in NURS 350 sends it, Then the submission is allowed and the evidence counts (verified from S-12/S-13); the mapping page states this rule.  
CM-06   Given IV Insertion is mandatory in NURS 301 and non-mandatory in NURS 410, When I open either offering, Then each shows its own requirement and the cross-reference line names the other offering with its requirement.  
CM-07   Given a skill mapped in three offerings, When I view the cross-reference, Then it states that one student skill record is shared across courses.  
IM-09   Given an imported skill that is unconfigured, When I open the skills panel, Then it is not listed and the empty state or a count of unconfigured skills points to the library.  
SL-11   Given a skill is deactivated, When I open an offering that had it mapped, Then it is no longer offered for mapping and previously recorded evidence remains.  
OD-01 (seam)   Given a new term's offering with no mapping, When I open it, Then it starts empty and no control or copy mentions carrying mappings forward; the data model can later add a catalogue default without a migration of existing offering rows.
SC-01   Given a skill that exists in the library but is unconfigured, When I open an offering's skills panel, Then it does not appear in the available list and a count of unconfigured skills links to the library.
CM-08   Given OD-01 is open, When I open the next term's offering for a course I already mapped, Then it starts empty and the page makes no carry-forward claim (see the OD-01 seam test).
CM-04, CM-07 (entry from S-04)   Given IV Insertion is mapped in 3 of 42 offerings, When I follow its Courses count in S-04, Then S-10 opens at ?skill={skillId} listing only those 3 offerings, the header reads "Offerings where IV Insertion is mapped (3)", each row shows that skill's requirement, and Clear shows all 42.

## 16. Risks and unknowns (max 3)

(1) The offering entity: REQ CM-01 vs the platform 4-tuple including faculty (vault D3). Mapping keyed wrongly forces a data migration. (2) Volume: 42 offerings x many skills with one-by-one mapping is slow; the missing bulk path is the obvious gap and must be re-examined as soon as OD-01 is answered. (3) The "choose a requirement before saving" validation is my [INFER] against the prototype's frictionless default; it may feel slower and must be tested (docs/ux/12).

## 17. Vault notes consulted

Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md (raw; "skills have to be mapped to courses", mandatory vs recommended sections, mapping is a recommendation); Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md (skills live at student-program level, not tied to courses); Research/exam-management/research/meetings/2026-05-08-aarti-curriculum-mapping.md (course offering 4-tuple, D3; read via grep, not in full); _Insights.md (searched).

## 18. Open questions for Romit

keep the requirement control unselected after ticking (my proposal) or default to Mandatory as the prototype did? Not an OD; a UX trade-off between safety and speed. Proposal [INFER]: no default.

## 19. Contradictions found / review log

None recorded in this draft beyond the fix-pass report.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.

## Mobbin references (added 2026-10-08)

See `docs/research/meetings/2026-10-08-mobbin-remaining-surfaces.md` §M-4. Weak to partial: confirms list-left, detail-right only (Asana, Linear). No precedent for per-row Mandatory / Non-mandatory toggles with a mapped-count pill.

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** Course Mapping is the prototype's two-column cards: left 'Clinical course offerings' (N of M offerings match line, Clear, search, four labelled filters Cohort / Academic year / Term / Professional year) and right 'Skills mapped' for the selected offering (search the library, checkbox rows, segmented Mandatory / Non-mandatory, 'Also mapped in' lines). The first offering is preselected and the academic year starts on the latest. Ticking a skill maps it as Mandatory (parity C-3), replacing this contract's 'no silent default' proposal. `?skill=<id>` entry mode and `/course-mapping/[offeringId]` deep links are kept.

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-09 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements.

**Unchanged:** CM-01..CM-08, CM-05 expectation not eligibility, IM-09/SC-01 (unconfigured skills excluded, with an explanatory banner), SL-11, OD-01 seam (no carry-forward UI).

**Weakened or traded away (honest list):** The default Mandatory is a silent default (CM-03 is still satisfied because every mapping carries a level); filters are four selects, not FilterBar chips; an extra 'skills need configuration' banner exists that the prototype lacks (needed for IM-09).
