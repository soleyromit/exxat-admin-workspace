# Design contract: S-09 Skill configure

**Status: CONFIRMED by Romit, 2026-10-08; updated to build alignment 2026-10-08.** Confirmation covers this contract as written: items tagged `[INFER]` are accepted proposals, and every `OD-*` stays OPEN and is built as the named seam. Renamed from `_draft-S-09-skill-configure.md`.

> **Build alignment (2026-10-08):** the app was rebuilt to Sankalp's prototype inside the DS base shell on Romit's instruction (`docs/build/prototype-parity.md`). Where sections 7 and 9 below describe a rail, sheet or full page, the final section **Build alignment (2026-10-08)** wins. Requirement IDs, open decisions and acceptance tests are unchanged.
Written 2026-10-08. Tags: `[REQ id]` `[OD-n]` `[PROTO]` `[CALL 09-23]` `[CALL 03-05]` `[INFER]`. Precedence REQ > CALL > PROTO > INFER.
This is the product's core surface: the model → evidence → qualification rule → criteria dependency (REQ §1.5) lives here. **Two decisions are proposed for you to confirm explicitly:** (a) full page instead of the prototype's modal, (b) model-change effect on the skill's configured state (see §1, seam).

## 1. Surface and wave

**Surface.**
S-09 Skill configure (create and edit): route {base}/library/skills/{id}/configure and /library/skills/new   Wave: W1  
(Copy configuration / Apply to selected = IM-14 = W2)

## 2. Persona and RBAC

P-A Program administrator (W). P-R/others: no access. RBAC row: Administrator (program scope).

## 3. Scope and data seen

The skill's definition and configuration; counts of existing evaluations (aggregate) to power the impact notice;  
NO per-student data. The preview shows a student's and an evaluator's view of the FORM with sample values only.

## 4. Job to be done and why

**Job-to-be-done.**
When a skill exists but is not configured (or must change), I want to define how it is evaluated and what  
achievement requires and see everything it will ask of the student and evaluator, so the skill is achievable  
and unambiguous before anyone uses it.

**Why → So what.**
The admin alone decides what "skilled" means. If configuration is slow, contradictory or unsatisfiable, every  
student, preceptor and report inherits the damage (journeys/01 §B). So-what: a configuration that can never be  
satisfied cannot be saved [REQ SC-18], and the dependency from model to criteria is apparent while editing  
[REQ SC-17]; 200 imported skills become a worklist, not 200 returns to the list.

## 5. Requirements and open decisions

| Group | IDs (all resolve) |
|---|---|
| Definition | SL-02, SL-03, SL-04, SL-05, SL-06 |
| Configuration | SC-01, SC-02, SC-03, SC-04, SC-05, SC-06, SC-07, SC-08, SC-09, SC-10, SC-11, SC-12, SC-13, SC-14, SC-15, SC-16, SC-17, SC-18, SC-19 |
| Engine consequences | AE-02, AE-06, AE-07 (plus AE-01, AE-03, AE-05 as engine hooks, §11b) |
| Bulk | IM-14 (W2) |

Open decisions and seams (none decided here):

| OD | Seam to keep flexible |
|---|---|
| **OD-04** submission fields per skill vs program default | Skill references a `SubmissionFieldSet` (own set today). UI copy never says "applies to all skills". A program-default set can later pre-fill; per-skill additions remain. |
| **OD-06** evaluator roles fixed or program-defined | Roles are rows (3 seeded: Preceptor, Clinical faculty, Lab instructor), the picker renders from rows. No enum in UI code. |
| **OD-09** self-evaluation form identical or different | One form schema, two respondents; the "Student self-evaluates first" toggle only turns the second respondent on. |
| **OD-12** import proposes model/criteria | S-09 accepts optional pre-filled questions from import as editable draft; never auto-selects a model. |
| **OD-15** activation distinct from configured+active | Status derives from two flags; no Activate action. |
| **OD-03** four states vs merged | The lineage panel's last row shows the four-state enum (AE-04) with a display flag; not decided here. |
| **SC-09 gap (new, `[INFER]`)** | REQ says criteria are rebuilt on model change but not whether the skill reverts to unconfigured or stays configured-but-flagged (docs/ux/05 SM-01 note). Seam: `configurationValid` derived from the saved config; on model change set `needsReview=true` and keep prior evidence; the UI wording "Review required" is placeholder until confirmed. Build neither reading as final. |
| OD-24 (proposed) deactivating while submissions in flight | Not decided; Status control in step 1 follows S-04's deactivate dialog wording only. |

**OD-25 (proposed; role → evidence-type validity map).** Seam: seeded data table (role × clinical/lab), read by the S-09 satisfiability validator and S-13's resolver; not decided here. **OD-26 (proposed):** see S-06.

## 6. Prototype reference (keep / do not copy)

`docs/source/screens/14-config-step2-demonstration.png`, `15-config-step2-question.png`, `16-config-step3-criteria.png` (3-step modal; step 2 holds model, levels/questions, qualification, submission fields, comment, workflow, roles and a preview; step 3 holds criteria).
**Keep:** lineage panel ("Configuration lineage"); form preview with both views; evaluator-roles checklist; the route sentence "Student selects → Student self-evaluates → Evaluator completes → Administrator approves → Counts as evidence"; "Removing a level does not delete evidence already recorded…".
**Do NOT copy:** three modal steps (hides step 2 while editing step 3, against SC-17); a very long scrolling step 2 without anchors; uppercase tracking labels; blue Continue/Save buttons mixed; placeholder "Q1/Q2/Q3".
**Not exercised in the prototype:** validation errors on Save, removing a level/question, model change rebuild, copy/apply configuration, SC-12 enforcement, large question sets.

## 7. Pattern and reference hub

- **Proposed pattern (confirm):** **full page**, in-page section navigation, persistent **lineage panel** and live **preview** (docs/ux/07 §S-09, justification (1)–(4)): configuration is the heaviest repeated task; SC-17 needs the dependency visible; deep links and Back matter for the worklist; DS `Sheet` guidance prefers a route past `xl` (40rem). Cost: more navigation than a modal; mitigated by returning to the same S-04 scroll position and "Configure next".
- **Alternative A:** modal stepper in a `Dialog` (acceptable for *create* only; lineage on every step; one filled primary at a time). **Alternative B:** `Sheet size="xl"` with anchors (light edits from S-04).
- **Reference hub (read in repo):** `apps/pce/admin/components/pce/template-editor.tsx` (2,760 lines: heavy admin editor with `Tabs variant="line"` at the wizard level, `Collapsible` sections, `Select`, `Input`, `Textarea`, `DropdownMenu`, `LocalBanner`) and routes under `apps/pce/admin/app/(app)/templates/[id]/` (several layout variants of one editor: tabs, guided, document, minimal, focus, canvas, columns). Precedent that a long configuration form lives on its own route with sections, not in a modal. Validation shape: `apps/pce/admin/app/(app)/admin/competencies/page.tsx` (`aria-invalid` + `FieldError` + error `LocalBanner` summary).
- **Interactions:** docs/ux/08 P-01 (lineage + model change), P-02 (validation), P-03 (rule-change impact `[INFER]`), P-05 (copy/apply), P-13, P-15, P-17 (unsaved changes, save conflict), P-16 (motion).
- **Flows/state:** F-03, F-04 (docs/ux/04); SM-01 (docs/ux/05).

## 8. DS mapping (proposal; final verdict: ds-adoption-reviewer)

> **Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).** Proposed pin `@exxatdesignux/ui@^1.6.5` (matches PCE). All surfaces, including student and evaluator, import from `@exxatdesignux/ui`, not studentUX: DSQ-1 is **resolved as a proposal**. The product `CLAUDE.md` section 4 (studentUX) is legacy text and was NOT edited: flagged for Romit. DataTable and KeyMetrics are IMPORT (never copy PCE's vendored `components/data-table`). `LocalBanner` props are `variant, title, children, dismissible, onDismiss, action, retry, icon`; there is no `emphasis` or `actionPosition` (those are `SystemBanner`). `StatusBadge` semantic mode: tones `success | warning | info | danger | neutral`, `size` `sm | md` only. Single-choice controls use `RadioGroup`, not `ToggleGroup`.

**Surface verdicts.** C-2 model picker = `SelectionTileGrid interaction="radio"` (IMPORT; 2 or 3 columns; wraps RadioGroup semantics; no default selected per SC-02). HAND-ROLL (one file each, to register): C-1 `ModelCriteriaLineage`, C-3 `QualificationRuleEditor`, C-4 `LevelEditor` (reorder with exported `DragHandleGrip`), C-5 `LevelMinimumEditor`, C-6 `SettingMinimumEditor` (Popover + Command + Checkbox), C-7 `SubmissionFieldEditor`, C-8 `FormPreview`, plus `SkillsMultiPick` for tags and named-subset. No Stepper: use anchored sections or Accordion on a full page.


Verified 2026-10-08 (`source.mjs` 1.5.1; `index.d.ts` 1.6.5; exports identical for the list below).

| Need | Component | Verdict |
|---|---|---|
| Section blocks / long sections | `Accordion` or `Collapsible` (or plain `Card`s with in-page anchor nav) | IMPORT |
| Model picker (4 options, no default) | `SelectionTileGrid interaction="radio"` (value/label/icon/description) | IMPORT (C-2 is not a hand-roll) |
| Field layout, labels, help, errors | `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSet`, `FieldLegend`, `FieldGroup` | IMPORT |
| Text/number inputs | `Input`, `Textarea`, `InputGroup` | IMPORT |
| Category select, field type select | `Select` (`SelectTrigger size="sm"|"default"`) | IMPORT |
| Single-choice rules (all / at least N of M / subset; average / min / total; comment optional/required) | `RadioGroup` | IMPORT |
| Toggles (self-evaluation, approval) | `ToggleSwitch` (controlled, `aria-label`) | IMPORT |
| Role checklist | `Checkbox` with `CheckboxLabel` | IMPORT |
| Tags, setting picker, named-subset question picker | `Popover` + `Command` + `Checkbox` composition (no `MultiSelect`/`Combobox` in the DS) | HAND-ROLL (docs/ux/10 §4; build once as one shared picker) |
| Status/validity chips | `StatusBadge` semantic, `Badge` | IMPORT |
| Confirm model change, impact preview, unsaved changes, bulk apply | `Dialog` | IMPORT |
| Errors, info after model change | `LocalBanner` | IMPORT |
| Buttons | `Button` explicit `variant`+`size`; `Save skill` filled; others `outline`/`ghost`; level reorder as icon buttons with `aria-label` and `Tooltip` | IMPORT |
| Wizard navigation | `Stepper` not exported in either version | Avoid: anchored sections instead; if a stepper is demanded, thin wrapper on `Tabs variant="line"` |
| Loading | `Skeleton` | IMPORT |
| Custom compositions (docs/ux/10 §5) | C-1 lineage panel · C-3 qualification-rule editor · C-4 ordered level editor · C-5 level-minimum editor · C-6 setting-minimum editor · C-7 submission-field editor · C-8 form preview | HAND-ROLL on DS primitives, one file each; `ds-adoption-reviewer` to confirm |

Banned: raw `<button>`, raw `<table>`, hex/rgb, toast, icons on action buttons, uppercase tracking-wide, `color-mix(in oklch`.

## 9. Layout, content and behaviour

Wireframe: docs/ux/07 §S-09. Regions: page header (breadcrumb, title, Cancel, **Save skill**) · section nav (1 Skill, 2 Model, 3 Rule, 4 Criteria, 5 Student details, 6 Evaluator, 7 Workflow, 8 Preview) · form column · sticky right column (lineage panel above preview tabs).
- **Exactly one filled primary:** `Save skill`. Secondary: `Cancel`; `Copy configuration from another skill` and `Apply to selected skills` (outline, W2); `Configure next` (link/outline).
- **Gating:** until a model is chosen, sections 3 and 4 are disabled with reason text "Choose how this skill is evaluated to continue." `[REQ SC-02]`. Section 5–7 remain available (independent of model, `[REQ SC-13..16]`).
- **Per model:**
  - Binary: two labels, which one qualifies recorded, labels differ `[SC-03]`.
  - Question: question list; rule All / At least N of M / Named subset (non-empty) `[SC-04..06]`.
  - Scored: scale (min, max, optional labels) and question list; rule Average / Minimum on every question / Total `[SC-07]`.
  - Demonstration: ordered levels (reorder, remove) `[SC-08]`; criteria total + minimum per level `[SC-10]`.
  - All models: optional minimum per named clinical setting, counted per setting; lab never counts `[SC-11, SC-12]`.
- **Student details (SC-13):** label, type (date, short text, long text, number, choice list), required/optional; setting and location come from the placement and are not entered here.
- **Evaluator (SC-14, SC-16):** comment optional/required; allowed roles (at least one; blocked otherwise `[INFER]`).
- **Satisfiability validator (save-blocking, SC-18; BL-1):** if the criteria carry a minimum for any clinical setting (SC-11), the allowed evaluator roles must include **at least one role valid for clinical evidence** (SC-12, SC-16). Otherwise Save is blocked with: "This skill requires clinical evidence but none of its allowed evaluator roles can sign off clinical evidence. Allow at least one of: {roles valid for clinical}." The role-to-evidence-type map is **data** (seeded config) owned under proposed **OD-25**, shared with S-13 and S-06; it is not hard-coded.
- **Workflow (SC-15):** student self-evaluates first (toggle); administrator approval before counting (toggle); a "Route" sentence updates live.
- **Lineage panel (SC-17):** five rows live-updating: Model · Evidence per evaluation · An evaluation counts when · Achievement requires · Skill status (four states, display flag per OD-03). Row changes announced politely.
- **Preview (SC-19):** tabs Student / Evaluator showing exactly the fields, questions, levels and comment the program configured, with sample values.
- **Rename safety:** next to labels and question text: "Renaming does not change what was recorded or whether existing evaluations count." `[AE-06]`. Removal shows "Removed from {n} rules." `[AE-07]`.
- **Sum check:** live "5 ≥ 1 + 1 + 3" on criteria `[INFER]`.

## 10. States (L E Er V S Su D P Bl)

| State | Behaviour |
|---|---|
| **L**oading | Skeleton of the section layout; lineage panel skeleton; Save disabled until loaded; on `/new` no skeleton (blank form) |
| **E**mpty | New skill: model tiles unselected, rest disabled with reason (SC-02). Question/level lists empty until added: inline "Add the first question." |
| **Er**ror | Load failure: banner with retry, no partial form; save failure (network): form kept, banner "This skill was not saved. Try again."; **save conflict** (another admin changed it): banner "This skill was changed by someone else at {time}." + `Review their changes` / `Keep mine` `[INFER, P-17]` |
| **V**alidation | P-02: E-LBL, E-DUP, E-SUB, E-NM, E-MIN, E-SET, E-QSET, E-SCALE (+ "no model", "no evaluator role"). Validate on blur and (debounced 300 ms) for cross-field sums; fully on Save. **Save stays enabled**; on press: summary `LocalBanner error` "{n} things to fix" with links, focus first invalid, `aria-invalid`, one assertive announcement. No warn-and-save path for unsatisfiable rules |
| **S**aving | `Save skill` busy+disabled; **not optimistic** (affects achievement when evidence exists); rule re-application on the server |
| **Su**ccess | `LocalBanner success` "{Skill} saved and ready to be mapped." with `Configure next unconfigured` action; stays on page or returns to S-04 at the same scroll `[INFER]` |
| **D**isabled | Sections 3–4 until model chosen; "Copy configuration" disabled when no configured source exists; Save disabled only while loading/saving |
| **P**artial | Section completion ticks; dirty-section indicator; "Unsaved changes" marker; leaving prompts Discard? dialog (Cancel default focus) |
| **Bl**ocked | Save blocked with named broken rule (EC-1…EC-4); model change blocked behind confirm dialog; **rule change on a skill with evidence** triggers impact preview (P-03 `[INFER]`) which blocks Save until reviewed; error computing impact blocks save and offers retry (P-03) |

## 11. Edge cases

EC-1 (200 questions: searchable checklist, virtualised beyond ~100) · EC-2 (duplicate level labels) · EC-3 (binary labels identical) · EC-4 (level minimums exceed total) · EC-5 (lab-only evidence vs setting minimum: stated in helper copy) · EC-6 (rule edited after evidence: impact preview + re-qualification) · EC-7 (question rename: no change) · EC-8 (level deleted: removed from rules, evidence retained but no longer counts toward that level `[PROTO text]`) · EC-9 (inactive category/tag on the skill remains and is removable) · EC-10 (deactivate while mapped: F-14) · skill with evidence and model change (evidence kept, behaviour for incompatible evidence undefined in REQ: seam above) · question set copied from another skill (independent copy).

## 12. Copy and interactions

Owned by `docs/ux/09` §5 **S-09** (all strings including the validation table), §3.1/§3.3, §4 status labels, §7 failed-rule generator (the engine feeds S-14, not this surface). Missing or inconsistent in 09 (flag): "Review required after a model change" wording (new, OD-gap), "no evaluator role chosen" is `[INFER]`, Back/Continue buttons in 09 belong only to Alternative A, the unsaved-changes dialog text, the save-conflict banner text.

## 13. Accessibility (WCAG 2.1 AA)

- **Keyboard path:** header → section nav → each section in DOM order → lineage panel (non-modal, `<ol aria-label="How this skill is evaluated">`) → preview tabs → footer actions. Model tiles are a radio group (arrows move, Space selects). Subset/tag/setting pickers are `Command` listboxes. Level reorder via Move up/Move down buttons (no drag-only).
- **Focus:** model-change dialog default focus on the **safe** action ("Keep current model"); on confirm, focus moves to the first required field of the new model; save errors focus the first invalid control; dialogs trap focus and return it to the trigger.
- **Live regions:** lineage updates polite; "Removed from n rules" polite; save-error count assertive once.
- **Status not colour-only:** validity and statuses carry text; the inline sum check shows a text "✓" word alternative ("Within total").
- **Targets** ≥24×24 CSS px; spacing between tile options; `prefers-reduced-motion` honoured (lineage highlight becomes a static marker, P-16).
- Page has one H1; sections are H2; unsaved-changes marker is text.

## 14. Out of scope

REQ §14 (remediation, notifications, expiry, encounter linkage, accreditation outputs beyond exports, Evaluations migration). Also: shipping any skill, category or taxonomy `[REQ SL-01]`; a default evaluation model `[SC-02]`; a fifth model (the design allows models to be added, but only four are built `[REQ §4.1]`); hierarchical sub-activities (OD-20); frequency scoped by rotation/year (OD-22); regional/licensure checklists (OD-21); learning-contract linkage (OD-23); heatmaps; QR codes; scoring shown by default; editing a completed evaluation `[RV-03]`.

## 15. Acceptance tests (Given / When / Then)

### 15a. Given / When / Then

| # | Test | REQ |
|---|---|---|
| T1 | Given a created skill, When I leave without configuring, Then it remains in the library as unconfigured and configuration can be completed later | SC-01 |
| T2 | Given a new skill, When I open S-09, Then no model is preselected and sections 3–4 are disabled with reason text; a skill without a model cannot be saved as configured | SC-02 |
| T3 | Given the binary model, When both labels are equal or one is empty, Then Save is blocked with a message; when different and one is marked qualifying, Save succeeds; labels default to Met/Unmet only as label suggestions (model not defaulted) | SC-03 |
| T4 | Given the question model, When I define questions, Then I can choose All Yes, At least N of M, or a Named subset | SC-04, SC-05 |
| T5 | Given a Named subset with nothing ticked, When I save, Then it is blocked; and with 200 questions the picker remains searchable and usable | SC-05, SC-06 |
| T6 | Given the scored model, When I set a scale and rule, Then I can choose average, minimum on every question, or total | SC-07 |
| T7 | Given the demonstration model, When I define levels, Then they are ordered, program-defined, and not limited to three | SC-08 |
| T8 | Given a configured skill, When I change the model, Then a dialog lists what will be rebuilt, default focus is the safe option, and on confirm the criteria rebuild and a banner states what was reset; evidence is kept | SC-09 |
| T9 | Given the demonstration model, When I set total 5 and minimums 1/1/3, Then Save succeeds; when minimums sum above the total, Save is blocked naming the rule | SC-10, SC-18 |
| T10 | Given any model, When I add minimums for Inpatient (1) and Emergency (1), Then each is saved per setting and counted per setting, never as one clinical total | SC-11 |
| T11 | Given lab evidence only, When the engine counts a setting minimum, Then it is not satisfied (engine test, copy visible in helper) | SC-12 |
| T12 | Given student details, When I add a Choice list field marked mandatory, Then label, type and mandatory flag are saved independent of the model and of evaluator responses | SC-13 |
| T13 | Given evaluator comment set to Required, Then S-16 cannot submit without a comment (cross-surface test) and the setting is per skill | SC-14 |
| T14 | Given the workflow toggles, When I turn on self-evaluation and approval, Then they apply to this skill only and the Route sentence updates | SC-15 |
| T15 | Given allowed roles Preceptor only, Then S-13 offers only that role for this skill (cross-surface) | SC-16 |
| T16 | Given I edit any section, Then the lineage panel updates live and each step is visibly determined by the one above | SC-17 |
| T17 | Given unlabelled/duplicate questions or levels, an empty subset, or minimums above the total, When I press Save, Then it is not saved, a summary banner lists the issues with links, and focus moves to the first | SC-06, SC-18 |
| T18 | Given a complete configuration, When I open Preview, Then I see together what the student supplies, the student self-evaluation if enabled, and the evaluator form | SC-19 |
| T19 | Given a new skill, When I assign one category and several tags and create one inline, Then the inline entries exist immediately; inactive entries already on the skill remain flagged inactive and removable | SL-02..SL-06 |
| T20 | Given a skill with evidence, When I change a rule, Then an impact preview shows counts before/after per state before Save (proposal) and after Save evidence is re-qualified under the new rule | AE-02 |
| T21 | Given I rename a question or level, Then no recorded response or counted evaluation changes | AE-06 |
| T22 | Given I remove a question or level referenced by a rule, Then it disappears from every rule and the UI states "Removed from n rules"; evidence is retained | AE-07 |
| T23 | Given two configured skills, When I copy configuration from one to another, Then the target carries independent copies, remains editable, and invalid targets are listed (W2) | IM-14 |
| T24 | Given the page, Then exactly one filled primary (`Save skill`), no icons on text action buttons, and every status has text | global |
| T25 | Given criteria with a minimum of 1 in Emergency, When I restrict the allowed evaluator roles to Lab instructor only (valid for lab evidence only), Then Save is blocked with the satisfiability message naming the roles that can sign off clinical evidence, focus moves to the allowed-roles control, and nothing is saved | SC-11, SC-12, SC-16, SC-18 |
| T26 | Given the same skill with Preceptor also allowed, When I Save, Then it saves, and S-13 offers Preceptor for clinical evidence (cross-surface) | SC-16, ST-08 |

### 15b. Engine unit-test hooks (write before UI; docs/strategy/02 §6)

| Hook | Invariant | REQ |
|---|---|---|
| ENG-1 | `count(skill)` counts only evidence that is complete, approved when approval is required, and qualifies under the **current** rule | AE-01, AE-02 |
| ENG-2 | `achieved ⇔ count ≥ N ∧ every per-level minimum met ∧ every setting minimum met`; worked example IV Insertion 7 demonstrations (Obs 2/1, Assist 1/1, Ind 4/3) → achieved; removing the Assist one → not achieved though total 6 ≥ 5 | AE-03, SC-10 |
| ENG-3 | Editing a rule changes `qualifies` for held evidence and never stored responses; renaming labels/questions changes nothing | AE-02, AE-06 |
| ENG-4 | Deleting a level/question cascades into rules; evidence is retained | AE-07 |
| ENG-5 | Lab evidence never contributes to a clinical setting's count; settings counted per setting | SC-11, SC-12 |
| ENG-6 | Same student + same skill across courses = one record | AE-05 |
| ENG-7 | Four-state function returns exactly one of: no evidence yet / evidence none qualifies / some qualifying, criteria unmet / achieved | AE-04 |
| ENG-8 | Validators reject: unlabelled/duplicate question or level, binary labels equal, empty subset, N>M or N<1, minimums > total, setting minimum > total, 0 questions/levels, bad scale | SC-03, SC-05, SC-06, SC-18 |
| ENG-9 | Changing the model rebuilds the criteria to the new model's empty state and never leaves contradictory settings | SC-09 |
| ENG-11 | Validator rejects a configuration with any clinical-setting minimum whose allowed roles ∩ roles valid for clinical evidence is empty (map from the OD-25 seeded data) | SC-11, SC-12, SC-16, SC-18 |
| ENG-10 | `previewImpact(skillId, draft)` is read-only and returns counts per state (proposal) | AE-02 `[INFER]` |
| T27 | Given the definition section, When I choose a category (one at most), add several tags and create a new category and a new tag inline, Then at most one category and any number of tags are stored and the new ones appear in S-05a and S-05b without a separate setup exercise. | SL-03, SL-04, SL-05 |

## 16. Risks and unknowns (max 3)

1. **Confirmation needed on page vs modal** and on the SC-09 model-change state; both are proposals.
2. **Rule-change impact preview** is `[INFER]`; REQ asks for re-application, not a notice. If Sankalp rejects it, remove P-03 without changing the engine.
3. **Question sets of 100+ and 200 skills:** performance of the subset picker and of server recomputation after rule changes.

## 17. Vault notes consulted

`Transcripts/exxat/2026-09-23-skills-checklist-with-sankalp.md` (raw: four ways to define completion; the form must be generated from configuration; skill-level configuration does not vary by course; self-evaluation as part of the skill's workflow; setting-specific minimum thresholds) · `Meetings/exam-management/2026-03-05-day-4-marriott-meeting-skills-checklist-and-learning-contract.md` (multiple evaluation approaches; hierarchical skills → OD-20) · `_Insights.md` scanned (skills, configur, competenc): `Meetings/post-course-survey-cadence/2026-07-31-exact-prism-evaluation-setup-ux-feedback.md` (states Not configured / In progress / Distributed and "Set Up" as the action; analogy for the worklist, a different product) and `Decisions/pce/2026-06-30-course-eval-faculty-roles-from-prism-settings` (title and summary only: evaluator roles can come from tenant config; informs OD-06 seam, not decided).

## 18. Open questions for Romit

None.

## 19. Contradictions found / review log

- 09 §5 S-09 buttons list `Back`/`Continue` (stepper) while 07 recommends a full page with `Save skill` only; 09 should mark Back/Continue as Alternative A only.
- 07 §S-09 "Sections 1–8" vs 09 "Section: definition / model" vs 04 F-03 "Step 1/2/3": section numbering differs across the three; this contract uses 07's.
- 05 SM-01 shows `Active → Unconfigured` on model change (`[INFER]`); 04 F-03 says "criteria rebuilt, skill stays editable"; REQ SC-09 is silent. This contract keeps both open (seam in §1).
- 08 P-01 step 2 says setting minimums survive a model change (`[INFER]`); 09's model-change confirm text lists "questions, levels and achievement criteria" being rebuilt, which would include setting minimums if they are part of "criteria". Needs one answer before build.
- 10 §3 matrix marks `Tabs` only "○" for S-09, 07 uses preview tabs (Student/Evaluator) inside S-09: compatible but undeclared in 10.

## 20. What was not verified

Static document review only: no runtime render, no axe, no visual-diff, no live DS catalog check. DS props were verified against @exxatdesignux/ui 1.5.1 and PCE type defs only; the final pin and verdicts belong to `ds-adoption-reviewer`.


## Mobbin references (added 2026-10-08)

See `docs/research/meetings/2026-10-08-mobbin-s09-configure-patterns.md`. Summary: side-by-side preview with an unsaved-changes bar (Chatbase, Featurebase), four described tiles for the model picker (User Interviews, HubSpot), rule as a sentence plus a plain-language restatement (Vercel, Typeform), inline reorderable level list (Juicebox), validation summary grouped by section (Deel). No external precedent for the lineage panel or the minimum editors. Analogues only; none is a skills or clinical tool.

## Build alignment (2026-10-08)

**What changed vs the confirmed text:** The full-page design (anchored sections, sticky lineage panel, preview toggle, unsaved-changes bar) is REPLACED by the prototype's flow: Add skill is a 672px dialog (`?dialog=add`; 'Add and configure' continues into the wizard at step 1); Edit and Configure open a 1024px DS `Wizard` dialog (`?dialog=configure&skill=<id>`) with three steps: Skill definition, Evaluation configuration, Achievement criteria. Step 2 holds the model picker (nothing preselected), the model-specific editors, student submission fields, evaluator comment, review workflow toggles, allowed roles, the pinned 'Configuration lineage' panel and the form preview. A model change swaps the configuration and shows the rebuild report as an inline banner in the step (parity C-15). The footer shows 'Step n of 3 — <name>' with Cancel / Back / Continue (Save on step 3). Copy configuration and Apply to selected skills (IM-14) are small secondary controls inside the wizard. The URL ?dialog=add|configure|import contract is shared with S-04.

**Why:** Romit, 2026-10-08: build the exact Sankalp mockup with DS components inside the DS base shell (left nav with brand, utility bar, page header). Parity card P-07, P-08 in `docs/build/prototype-parity.md`; precedence for layout/IA/copy structure is the prototype, for behaviour the requirements. Recorded as DEC-016 in `docs/ux/11`.

**Unchanged:** SC-01..SC-19, SC-02 (no default model), SC-09, SC-17 (lineage visible while configuring), SC-18 and the lab-only-with-clinical-minimum block (BL-1), AE-02 impact review, OD-25 roles as data, engine unit-test hooks ENG-1..ENG-11.

**Weakened or traded away (honest list):** (1) Step gating (Continue disabled with the reason, as in the prototype) replaces the contract's 'Save always enabled with a grouped summary' on steps 1 and 2; the grouped summary still appears at Save. (2) A dialog has less room than a page: long question sets scroll inside it. (3) The section anchor nav and the unsaved-changes bar are replaced by the dialog's unsaved-changes guard. (4) The Wizard's step markers sit above their labels (DS layout). (5) The model picker keeps the local workaround for the DS SelectionTileGrid radio defect (docs/ux/10).
