# Build Plan (Tech-design hat) — pre-confirmation draft

> **Status: PROPOSAL, not approved.** Per `exxat-senior-ux` the next gate is a per-surface brief that Romit confirms. Per `exxat-module-brief` the module brief precedes it; this pack *is* that research layer, minus the Mobbin step (Mobbin MCP needs authentication in this session — not run; do not claim Mobbin references exist).

## 1. Product placement (to confirm)

`apps/skills-checklist/{admin,student}` per product CLAUDE.md (ports 3007 / 3008, not scaffolded). DESIGN.md §12 says modules are sellable independently and open from the Prism launcher in a new tab; §15 LMS-integration-first. **Open:** is Skills a standalone app or a section within existing Prism admin/student apps (REQ title: "Prism — Skills Tracking Module"; prototype breadcrumb: "Skills & Competencies / Nursing")? → `OD-P1`, ask Himanshu/Sankalp before scaffolding. The evaluator surface needs a third, **shell-free**, tokenised route (could live in either).

## 2. Information architecture (draft)

```
ADMIN (Prism admin)                          STUDENT (Prism student)             EVALUATOR (no login)
Skills                                       Course › Course activities          /e/{token}
 ├ Overview (attainment)                      └ Skills  (this course)             one page, per request
 ├ Library                                        ├ Mapped: mandatory / non-mand.   no shell, no nav
 │   ├ Skills (+Import, Add, Configure)           ├ Other skills (not mapped)
 │   ├ Categories · Tags                          ├ Send for review (dialog/sheet)
 │   └ Clinical settings · Lab instructors        └ History per skill
 ├ Course mapping                             My skills (all courses)  ← SH-06 cross-course
 └ Review & approve  (only if any skill needs approval)
```
- Admin nav delta: new top-level **Skills** with 4–5 children (Overview, Library, Course mapping, Review & approve). Nested secondary panel pattern if the product shell supports it (`exxat-primary-nav-secondary-panel`) `[INFER]`.
- Student: skills is a *section of a clinical course page* `[CALL 09-23: "course activities → forms, evaluations, patient logs, then skills"]` plus a cross-course "My skills" record `[SH-06]`.
- Command palette entries (per product): Skills overview · Skills library · Import skills · Course mapping · Review & approve · Clinical settings · Lab instructors · Export attainment.

## 3. Surface list → pattern → DS verdict

Verdicts below are **from `node tools/ds/source.mjs` against @exxatdesignux/ui@1.5.1 on 2026-10-08** (✓ exported / ✗ not exported). Final IMPORT/VENDOR/HAND-ROLL needs `ds-adoption-reviewer`.

| Surface | Pattern | DS candidates (✓ exported) | Gaps (✗) / notes |
|---|---|---|---|
| Overview | Route; KPI strip + tabbed DataTable + filter bar + drill Sheet | `KeyMetrics` ✓ (max 4, flat variant), `DataTable` ✓, `FilterBar` ✓, `Tabs` ✓, `Sheet`/`FloatingSheetPanel` ✓ | `Pagination` ✗ (check DataTable built-in), `ChartContainer` ✗ — any viz must come from vendored ChartCard/Plot per memory; attainment viz must not be only progress bars |
| Library › Skills | Route; DataTable + row actions | `DataTable` ✓, `Badge` ✓, `StatusBadge` ✓ (also has a semantic label/tone mode; see ux/10 — tone values unconfirmed), `Input`, `Select` ✓ | Status badge choice: see ux/10 |
| Import | Dialog → full-page review | `Dialog` ✓, `Textarea` ✓, `DataTable` ✓, `Checkbox` ✓ | `FileUpload`/`Dropzone` ✗ → **VENDOR/HAND-ROLL decision** (reviewer) |
| Skill configure | **Full page or Sheet with sections**, not a 3-step modal | `Field` ✓, `RadioGroup` ✓, `SelectionTileGrid` ✓ (model picker, interaction=radio), `Accordion` ✓, `ToggleSwitch` ✓, `Checkbox` ✓, `Select` ✓, `Input` ✓, `Textarea` ✓ | `Stepper` ✗ (wizard nav is custom). Lineage panel = custom composition. `MultiSelect`/`Combobox` ✗ → Popover+Command (known gap) for tags & subset picker |
| Categories/Tags/Settings/Lab instr. | Tabs + small DataTable + inline add | `Tabs`, `DataTable`, `Dialog` | — |
| Course mapping | Master-detail: offerings list + mapping panel | `FilterBar` ✓, `Command`/`Input` ✓, `Checkbox`, `ToggleGroup` ✓ (Mandatory/Non-mandatory) | — |
| Review & approve | List of cards or DataTable + Sheet | `DataTable` ✓ + `Sheet` ✓, `Textarea` | Side-by-side self vs evaluator = custom composition |
| Student skills (course) | List with sticky action bar | `Checkbox` ✓, `Badge`, `ProgressCell` ✓, `LocalBanner` ✓ | "Progress bars are last resort" memory — prefer numeric n/N + level breakdown |
| Send for review | Sheet/dialog | `Sheet` ✓/`Dialog` ✓, `ToggleGroup` ✓ (Clinical/Lab), `Select` ✓, `DatePickerField` ✓, `Textarea` ✓ | One filled primary only |
| History | Sheet | `Sheet` ✓, `Accordion` ✓ | — |
| Evaluator form | Standalone page | `Field`, `RadioGroup`/`ToggleGroup` (large targets), `Textarea`, `Button` | No app shell; mobile-first |
| Export | Menu | `DropdownMenu` (verify) | CSV adapter (OD-10) |

Banned/avoid: raw `<table>`, raw `<button>`, hardcoded colours, toast for product feedback (use `LocalBanner`), icons on action buttons, uppercase tracking-wide labels (prototype uses them heavily — do not copy), `py-20 text-center` empties.

## 4. Build waves (acceptance tests are the gate, not looks)

| Wave | Scope | Depends on | Exit tests (must be automated before UI) |
|---|---|---|---|
| **W0 Contract** | Resolve OD-03, 04, 06; confirm placement OD-P1; Mobbin reference pass (authenticate); `exxat-design-contract` for W1 surfaces | this pack | Briefs confirmed by Romit |
| **W1 Engine + Library + Configure** | Data model, achievement engine, library CRUD, categories/tags/settings/instructors, configure experience, preview | W0 | Engine unit tests for every row of `02 §3` (all four models, per-level, per-setting, lab≠clinical, rule re-application, rename invariance, cascade removal); config validation tests (SC-06/18) |
| **W2 Import + Mapping** | Import pipeline with review, duplicate handling, unconfigured gating; offerings list, mapping, counts | W1; OD-01, 12, 13 | Import never creates without confirm; unconfigured skills absent from mapping/student lists; mapping counts |
| **W3 Student + Evaluator** | Student course skills, send flow, history; tokenised evaluator form | W1–2; OD-07, 09, 14, 17, 18 | Role×setting constraint test; no-placement path; link opens without auth; mandatory comment; counts-now vs held |
| **W4 Review + Revision** | Admin queue, approve/return, correction vs further attempt | W3; OD-08, 16 | RV-03/05 immutability; pending excluded from achievement |
| **W5 Reporting + Export** | Overview (student/skill/tag), filters, drill to evidence, exports | W1–4; OD-03, 10, 11 | RP-08 recompute; RP-09 explanation; export = full filtered scope + header filters |

## 5. Per-surface gate (what to run before any JSX)

`build/02-design-contract-template.md` — the contract. Then `ds-adoption-reviewer` → build → `ds-conformance-reviewer` (visual-diff against localhost:4000 + axe) → `state-review` against `strategy/06` → `verification-reviewer`. Claim only **GREENLIGHT (static)** until `visual-diff.mjs` has run.

## 6. Test data to build (so the states are exercisable)

- A student with: unmapped skill evidence; two placements; no placement; a returned submission; a completed-but-failed evaluation; a skill 4/4 demonstrations but missing setting minimum (DEFECT-07 case); an achieved skill.
- A skill per model; one with per-setting minimums; one with approval + self-eval; one with mandatory comment.
- An import file with: heading rows, duplicates of existing skills, a skill with evidence, an unreadable line.
- Two offerings with same course, different terms; one with no cohort.

## 7. Risks & dependencies (technical)

- FAST form generation from configuration is unproven `[CALL 09-23]` — choose between FAST runtime-generated forms and a native evaluator page; REQ doesn't name FAST.
- Cohort / group / term / course-offering / placement entities are other modules' data (BASE-ENTITIES) — confirm APIs.
- AI document interpretation (IM-02/04) is the riskiest dependency; REQ forbids acting on it without confirmation (IM-13).
- Re-applying rules (AE-02) means derived state; plan recomputation strategy and performance for 150+ students × 200 skills.
