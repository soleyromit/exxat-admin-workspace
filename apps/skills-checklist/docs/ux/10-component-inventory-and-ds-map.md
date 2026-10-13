# UX 10 — Component Inventory & DS Map

> **VERSION PIN WARNING.** This file was verified against `@exxatdesignux/ui@1.5.1` (workspace) while `apps/pce/admin` resolves **1.6.5**. Exports and props may differ. **TODO (blocking for any surface contract): re-run `node tools/ds/source.mjs <Component>` against the version this product will pin, and update this file.**

**Review outcome applied (ds-adoption-reviewer, 2026-10-08; proposals pending Romit).**
- **Version pin (proposed): `@exxatdesignux/ui@^1.6.5`**, matching PCE. Re-run `node tools/ds/source.mjs <Component>` after the pin lands (the workspace tool still reports 1.5.1). Exports used here exist in both versions; prop-level drift is not diffed.
- **DSQ-1 resolved as a proposal:** the student and evaluator surfaces also import `@exxatdesignux/ui`; studentUX is not this product's DS. The product `CLAUDE.md` section 4 is legacy text (not edited; flagged for Romit).
- **IMPORT, not vendor:** `DataTable`, `DataTablePaginated`, `KeyMetrics`, `FilterBar`, `FloatingSheetPanel`, `Sheet`, `StatusBadge`, `SelectionTileGrid`, `BadgeCount`, `ProgressCell`, `EmptyCell`, `InlineInputCell`. PCE's vendored `components/data-table` predates the package export: do not copy it. The registry rows in `docs/governance/ds-adoption.md` that say VENDOR for DataTable and KeyMetrics are stale (not edited).
- **VENDOR:** `EmptyState` (`apps/pce/admin/components/empty-state.tsx`); `ChartCard`/`ChartFigure` (`apps/pce/admin/components/charts-core.tsx`) only if charts are confirmed.
- **Corrections:** `LocalBanner` has no `emphasis`/`actionPosition`; bottom/top `Sheet` ignores `size`; single-choice = `RadioGroup`; `StatusBadge` tones are `success warning info danger neutral` and semantic `size` is `sm|md`.

**Status:** proposal for `ds-adoption-reviewer` (final IMPORT / VENDOR / HAND-ROLL verdicts are theirs). Written 2026-10-08.
**Method:** every component below was checked with `node tools/ds/source.mjs <Name>` from `/Users/romitsoley/Work` (reports `@exxatdesignux/ui@1.5.1` installed). Props listed are copied from the `.d.ts` output, not memory. `[INFER]` = my proposal.
**Version drift to resolve:** workspace `source.mjs` resolves **1.5.1**, but `apps/pce/admin` resolves **1.6.5** (`node_modules/.pnpm/@exxatdesignux+ui@1.6.5…`). Exports may differ between them; re-run `source.mjs` against the version this product will pin before any build. `[INFER]`
**Surface IDs:** S-01 Overview · S-02 Student drill-down · S-03 Evidence ledger + evaluation detail · S-04 Library Skills · S-05 Categories/Tags · S-06 Clinical settings · S-07 Lab instructors · S-08 Import · S-09 Skill configure · S-10 Course mapping · S-11 Review & approve · S-12 Student course skills · S-13 Student send for review · S-14 Student skill history · S-15 Student my skills · S-16 Evaluator form · S-17 Export · S-18 Evaluation-request email. See `07-screen-inventory-and-wireframes.md`.

## 1. Export check (2026-10-08, `@exxatdesignux/ui@1.5.1`)

| Exported ✓ | Not exported ✗ |
|---|---|
| Button, DataTable, DataTablePaginated, KeyMetrics, Sheet, FloatingSheetPanel, Dialog, Tabs, Badge (+BadgeCount, BadgeAi), StatusBadge, Accordion, SelectionTileGrid, Checkbox (+CheckboxLabel), Select, Field (+FieldSet/Legend/Group/Label/Description/Error), Command, Popover, ToggleGroup, ToggleSwitch, LocalBanner, Textarea, Input, InputGroup, DatePickerField, Tooltip, DropdownMenu, Card, Avatar, Collapsible, RadioGroup, FilterBar (+FilterBarAddButton, clear button), Skeleton, Breadcrumb, ViewSegmentedControl (+ButtonSegmentedControl), ProgressCell, EmptyCell | Stepper, Progress, Pagination (standalone; `DataTablePaginated` exists), MultiSelect, Combobox, FileUpload, Dropzone, ChartContainer, ChartCard, Banner (the banner is exported as **`LocalBanner`**), Drawer, EmptyState, ListHubStatusBadge, SegmentedControl (use `ViewSegmentedControl`) |

Correction to the earlier build-plan note: **`StatusBadge` is not Beta/New only.** Its `.d.ts` documents a semantic mode `<StatusBadge label tone icon size>` ("Published, In review, Draft anywhere in the app"), `size` `"xs" | "sm" | "md"`. Use it for skill/evaluation status rather than hand-rolled pills. `[verified in source.mjs output]` Tone values `success | warning | info | danger | neutral` are confirmed by ds-adoption-reviewer from `dist/lib/status-badge-tints.d.ts` (1.6.5). Skill-status mapping: No evidence yet = `neutral`, Evidence does not qualify = `warning` (no red), In progress = `info`, Achieved = `success`.

## 2. Real prop APIs (key components)

| Component | API as published (1.5.1) |
|---|---|
| **Button** | `variant`: `link default outline secondary ghost destructive destructive-solid destructive-outline destructive-ghost destructive-link`; `size`: `default xs sm lg icon icon-xs icon-sm icon-lg`; `asChild`. Workspace rule: always pass explicit `variant` + `size`. |
| **Badge** | `variant`: `link default outline secondary ghost destructive prompt count`; `BadgeCount({count, max=99})` is a **red** count chip (bulk bar tallies); `BadgeAi` is a Leo affordance (not used here). |
| **StatusBadge** | Product mode `status="beta"` (product chrome): `size` `xs/sm/md`. Semantic mode `label` + `tone` + `icon`: `size` `sm/md` ONLY (`xs` is not valid; verified: `semanticStatusBadgeVariants size?: "sm" \| "md"`, `productStatusBadgeVariants size?: "xs" \| "sm" \| "md"`). Tone values confirmed: `success warning info danger neutral`. |
| **Checkbox** | `variant` `default outline secondary destructive success warning muted`; `size` `default sm lg`; `motion` `pop none glow pop-glow`; `CheckboxLabel` pairs for larger tap target. |
| **RadioGroup** | `itemVariant`, `itemSize`, `itemMotion` (same value sets as Checkbox). |
| **Select** | Radix composition: `Select`, `SelectTrigger size="sm"\|"default"`, `SelectContent position?`, `SelectItem`, `SelectGroup/Label/Separator`. |
| **Field** | `Field orientation="vertical"\|"horizontal"\|"responsive"`, `FieldLabel`, `FieldDescription`, `FieldError errors=[{message}]`, `FieldSet`, `FieldLegend variant="legend"\|"label"`, `FieldGroup`, `FieldSeparator`. Validation pattern: `aria-invalid` on control + `FieldError`. |
| **ToggleGroup** | **Use for genuinely multi-select or segmented views only; single-choice answers (S-13 Clinical/Lab, S-16 Yes/No and levels) use `RadioGroup` for correct radio semantics `[INFER]`.** `ToggleGroup` (Radix root + `variant`/`size` from `toggleVariants`, `spacing`, `orientation`), `ToggleGroupItem`. |
| **ToggleSwitch** | `{checked, onChange(value), id?, disabled?, aria-label?, aria-labelledby?}` — controlled only. |
| **Tabs** | `Tabs {value, defaultValue, onValueChange, rememberScroll?}`, list `variant` `line\|default`; overflow props `overflow`, `ariaLabel`, `collapseLabels`, `overflowMenu`. |
| **Sheet** | `SheetContent {side top/right/bottom/left, size sm(20rem) md(24rem) lg(32rem) xl(40rem) full, showCloseButton, showOverlay, dismissOnOutsideClick, resizable, resizeStorageKey, minWidth, maxWidth}`. Resize range 280–960px; "past xl, prefer a route". |
| **FloatingSheetPanel** | Non-modal rail (no focus trap, no scroll lock), single rail, `exclusive` prop; `railTriggerProps` marks controls that feed the rail. Fits the S-02/S-03 inspector (hub stays clickable). `[INFER]` |
| **Dialog** | `DialogContent {showCloseButton, overlayClassName}`, `DialogHeader/Title/Description/Footer {showCloseButton}`. |
| **LocalBanner** | `variant` `error success warning info promo`; `title?`, `dismissible?`, `onDismiss?`, `action?: {label, href?, onClick?}`, `retry?: {label?, onClick}`, `icon?`, children. **No `emphasis` / `actionPosition`** (SystemBanner only; ds-adoption-reviewer). Workspace rule: product feedback uses this, **never toast**. |
| **KeyMetrics** | `MetricItem {id, label, value, trend?, description?…}` with `MetricTrendPolarity` `higher_is_better lower_is_better informational`; sizes `sm md lg`; workspace memory: max 4, `variant="compact"` / flat band. Pass empty delta to hide trend chip. |
| **DataTable** | Props include `toolbarSlot`, `toolbarActions`, `searchable`, `emptyState`, `lazyLoading`, `paginationOverride`; `DataTablePaginated` drives paging; built on `useTableState`. Cells: `ProgressCell`, `EmptyCell`, `InlineInputCell`. Never raw `<table>`. **IMPORT from the DS; do not vendor PCE's local copy** (ds-adoption-reviewer). |
| **FilterBar** | Chip rail container (`aria-label` names the active-filter group) + `FilterBarAddButton` ("Add filter") + clear button. Wraps `FilterPill` chips. |
| **SelectionTileGrid** | `SelectionTileOption {value,label,icon?(FA fragment),leading?,description?}`; uniform square tiles. **IMPORT for the evaluation-model picker (4 options, C-2) with `interaction="radio"`** (wraps RadioGroup semantics; `columns` 2 to 7). Also used for the S-17 export format. |
| **DatePickerField** | `{value: Date\|undefined, onChange, id?, disabled?, fromYear?, toYear?, popoverAlign?}` (button trigger, not raw text input). |
| **Accordion** | Radix `Accordion/Item/Trigger/Content`. Collapsible: `Collapsible/Trigger/Content`. |
| **Avatar** | `size` `default sm lg`; `shape`; `variant`. Workspace memory: 24px min initials disc. |
| **Breadcrumb** | `Breadcrumb/List/Item/Link/Page/Separator/Ellipsis`. |
| **ViewSegmentedControl** | `{value, onValueChange, options:[{value,label,icon?}], "aria-label"}` (names the radiogroup). Use for By student / By skill / By tag if Tabs not chosen. |
| **Command / Popover** | `Command`, `CommandInput`, `CommandEmpty…`; `Popover/Trigger/Content`. Composition = the sanctioned "multi-select" (see gaps). |
| **Textarea / Input / InputGroup** | Plain props; `InputGroup` + `InputGroupAddon align=…`/`InputGroupInput`/`InputGroupButton size xs sm icon-xs icon-sm`. |

## 3. Surface × component matrix

`●` = primary use · `○` = secondary · all Button usage needs explicit `variant`+`size` · every surface also uses `Skeleton` (loading) and `LocalBanner` (feedback) per `docs/strategy/06`.

| Surface | DataTable | KeyMetrics | Tabs / ViewSeg | FilterBar | Sheet / Floating | Dialog | Field+inputs | Select | Checkbox | ToggleGroup | ToggleSwitch | Select-tile / Radio | Accordion | StatusBadge / Badge | LocalBanner | Command+Popover | DatePicker | Breadcrumb | Other |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S-01 Overview | ● | ● | ● | ● | ○ drill | | | ○ sort | | | | | | ○ | ○ | | | | ProgressCell; viz per §6 |
| S-02 Student drill-down | ○ | | | ○ | ● Floating | | | | | ○ "show these only" | | | ○ | ● | | | | ○ | ProgressCell |
| S-03 Evidence ledger/detail | ● | | | | ● Floating | | | | | | | | ○ | ● | | | | ○ | Custom: evidence ledger, per-level strip |
| S-04 Library Skills | ● | | ● | ● | | ○ | | ○ | ○ bulk | | | | | ● | ● unconfigured count | | | | |
| S-05a Categories / S-05b Tags (two library tabs, one filled primary each) | ● | | ● | | | ● add/edit | ● | | | | ○ active | | | ● | ○ | | | | Custom: tag-reach cards |
| S-06 Clinical settings | ● | | | | | ● | ● | | | | ○ | | | ● | ○ | | | | |
| S-07 Lab instructors | ● | | | | | ● | ● | | | | | | | ● | ○ | | | | Adopt list |
| S-08 Import | ● review | ○ counters | | | | ● input | ● | ○ | ● include | | | | | ● | ● | | | | **Upload gap**; custom review table |
| S-09 Skill configure | | | ○ | | ○ alt | ○ confirm | ● | ● | ● | ● | ● | ● tiles | ● | ● | ● | ● subset | | ○ | **Lineage panel, level/setting-min editors, rule editor** |
| S-10 Course mapping | ● offerings | | | ● | | | ● search | ○ | ● | ● mandatory | | | | ● | ○ | | | | Master-detail layout |
| S-11 Review & approve (DataTable queue, rows have no filled buttons; Approve is the single filled primary inside the detail Sheet) | ● | | | | ● detail Sheet | ○ return | ● note | | | | | | ● responses | ● | ● | | | | **Agreement compare card** |
| S-12 Student course skills | ○ list | | | | | | | | ● | | | | ○ | ● | ● | | | | ProgressCell; sticky bar |
| S-13 Student send | | | | | ● Sheet | ○ | ● | ● | ○ | ● RadioGroup clinical/lab | | | | ○ | ● | ○ | ● | | |
| S-14 Student history | | ○ | ● scope | | ● Sheet | | | | | ● all/one course | | | ● attempts | ● | ● | | | | |
| S-15 My skills | ● | ○ | | ● | ○ | | | | | | | | | ● | ○ | | | | |
| S-16 Evaluator form | | | | | | | ● | | | | | ● RadioGroup Yes/No and levels | | ○ | ● | | | | **No shell** |
| S-17 Export | | | | | | | | | | | | ● format tiles `[INFER]` | | | ● | | | | DropdownMenu or Sheet |
| S-18 Email | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | Email template (not DS) |

## 4. Gaps and proposals (final verdict = ds-adoption-reviewer)

| Need | DS status | Proposal `[INFER]` | Reasoning |
|---|---|---|---|
| Wizard / step navigation (S-09, S-08) | `Stepper` ✗ | **Avoid**: use anchored sections on a full page (`Accordion` or in-page nav) instead of a stepper. If a stepper is demanded, HAND-ROLL as thin wrapper over `Tabs variant="line"` | Prototype's 3-step modal fights the lineage requirement (SC-17); sections allow all steps visible |
| Multi-select (tags S-09, named-subset questions SC-05, settings picker SC-11) | `MultiSelect` ✗, `Combobox` ✗ | HAND-ROLL **composition**: `Popover` + `Command` + `Checkbox` (documented gap in workspace memory) | Sanctioned pattern; build once as `SkillsMultiPick` |
| File upload (S-08) | `FileUpload`/`Dropzone` ✗ (none in PCE either; only inline `<input type="file">` in `template-import-dialog.tsx:105` and `template-editor.tsx:194`) | **HAND-ROLL one file `SkillsFileUpload`**: hidden input + `Button variant="outline"` trigger inside `Field` (ds-adoption-reviewer) | Keyboard-accessible; accepts spreadsheets/docs/PDF (IM-02); drag area optional |
| Standalone pagination | ✗ | IMPORT `DataTablePaginated` | Exported |
| Progress bar | `Progress` ✗; `ProgressCell` ✓ | IMPORT `ProgressCell` for table cells only; **do not make bars the sole viz** | Workspace memory: progress bars last resort |
| Charts (only if confirmed) | `ChartContainer` ✗, `ChartCard` ✗ in DS | VENDOR `ChartCard`/`ChartFigure` from `apps/pce/admin/components/charts-core.tsx` (exports `ChartCard`, `ChartFigure`; line 52/105/350) — verify before reuse | Workspace rule: all charts use vendored ChartCard/ChartFigure |
| Empty state | `EmptyState` ✗; `EmptyCell` ✓ | VENDOR `apps/pce/admin/components/empty-state.tsx` (props `icon,title,description,steps?,footer?,align?`) | Built on DS `Card`; consistent across products |
| Skill status chips | ✓ via `StatusBadge` semantic | IMPORT; shared `SkillStatusBadge` wrapper reads `skillStatusDisplay` (OD-03) | Wrapper wraps IMPORT, it is not a new primitive |
| DataTable / KeyMetrics | ✓ exported (registry rows stale) | **IMPORT** | Not a gap: do not vendor PCE's local data-table |
| Banner | `LocalBanner` ✓ | IMPORT | `Banner` name not exported |
| Drawer | ✗ | Use `Sheet` / `FloatingSheetPanel` | Workspace: no Vaul |
| Heatmap (OD-11 deferred) | n/a | Do not build in v1 | Out of REQ; raised on call only `[CALL 09-23]` |

## 5. Custom compositions required (HAND-ROLL on DS primitives; one file each)

| # | Composition | Built from | REQ / pattern | Used in |
|---|---|---|---|---|
| C-1 | **Lineage panel** (model → evidence → qualifies when → criteria → status) | `Card`, `Badge`, `Collapsible` | SC-17, SC-09 · `08` P-01 | S-09 |
| C-2 | **Model picker** (IMPORT, not a hand-roll) | `SelectionTileGrid interaction="radio"` | SC-02 | S-09 |
| C-3 | **Qualification-rule editor** (all / at least N of M / named subset; average / min per question / total) | `RadioGroup`, `Input type=number`, `Checkbox`, `FieldError` | SC-05..07 · P-02 | S-09 |
| C-4 | **Ordered level editor** (labels, reorder, remove with cascade note) | `Input`, `Button variant=ghost size=icon-sm`, `Field` | SC-08, AE-07 | S-09 |
| C-5 | **Level-minimum editor** (total + per-level minimums, live sum check) | `Input type=number`, `FieldError` | SC-10, SC-18 | S-09 |
| C-6 | **Setting-minimum editor** | `Popover+Command` picker + per-row number `Input` | SC-11, SC-12 | S-09 |
| C-7 | **Submission-field editor** (label, type, mandatory) | `Input`, `Select`, `Checkbox` | SC-13 · OD-04 seam | S-09 |
| C-8 | **Form preview** (student + evaluator views) | read-only render of S-12/S-16 fields in `Card`s | SC-19 | S-09 |
| C-9 | **Import review table** (a `DataTable` column config, not a component file) | `DataTable` with editable cells (`InlineInputCell`), `Checkbox`, `Select` | IM-05..08 · P-04 | S-08 |
| C-10 | **Duplicate resolver row** (skip / replace / keep both; single choice) | `RadioGroup` only (ToggleGroup is not used for single-choice: screen readers announce toggle buttons, not radios) | IM-06 · OD-13 seam | S-08 |
| C-11 | **Agreement compare card** | two `Card` columns + `StatusBadge` agree/differ | AR-02 | S-11 |
| C-12 | **Progress-by-setting** (n/N per named setting, lab shown separately) | numeric rows + `ProgressCell` optional | SH-05, SC-11/12 · P-18 | S-12, S-14, S-02 |
| C-13 | **Per-level strip** ("Observed 2/1 · With assistance 1/1 · Independent 4/3") | text rows + `Badge` | SC-10, RP-07 | S-02, S-03, S-12 |
| C-14 | **Evidence ledger** (a `DataTable` column config, not a component file) | `DataTable` (date, setting, location, evaluator+role, recorded, result, View) | RP-06, RP-07 | S-03 |
| C-15 | **Failed-rule explainer** | one `LocalBanner variant="warning"` use (no component file; no `emphasis` prop) | SH-03 · P-18 | S-14 |
| C-16 | **Impossible-filter explainer** (a single `LocalBanner` use, not a component file) | `LocalBanner variant="info"` in table region | RP-09 · P-06 | S-01 |
| C-17 | **Sticky selection bar** | `BadgeCount`, `Button` | ST-04 · P-08 | S-12 |
| C-18 | **Role × setting resolver** (pure function + UI states) | `RadioGroup` (role), `Select`, `LocalBanner` | ST-06, ST-08 · P-09 | S-13 |

## 6. Visualization guidance

- **Numbers first.** n/N with unit ("4 of 5 demonstrations") plus a breakdown line; per-level and per-setting strips (C-12/13) carry the meaning. A single progress bar adds nothing the numbers do not.
- **Allowed:** `ProgressCell` in table rows; a distribution view for S-01 By skill if a chart is wanted (stacked achieved / in progress / not started) via vendored `ChartCard`. Charts are optional; REQ asks for tables and drill-down (RP-02..04). `[INFER]`
- **No red** in score/rating/attainment viz (memory: Aarti dislikes red); use neutral/amber/brand. Red remains only for destructive actions and true errors. Note `BadgeCount` is red by design: do not use it as a score marker, only for selection tallies.
- **No colour-only status:** every `StatusBadge` carries text; WCAG 1.4.1.
- **Tag report overlap** is stated in text (RP-04), never implied by a stacked or donut chart.
- **No heatmap, preceptor-consistency or site-quality viz in v1** (OD-11 defers exposure; raised on call as possibly phase 2 `[CALL 09-23]`).

## 7. Tokens (from `@exxatdesignux/ui/src/globals.css`, resolved under apps/pce 1.6.5)

Use `var(--token)` only. Present in the stylesheet: `--background --foreground --card --muted --muted-foreground --border --border-control-35 --brand-color --brand-tint --primary --destructive --ring --radius --control-height --chart-1…5 --status-badge-{danger,info,neutral,success,warning}-{fg,fill}`. Not found by grep (do not assume): `--success`, `--warning`, `--info` as bare tokens → use the `status-badge-*` pairs or `StatusBadge tone`. `[verified by grep, 2026-10-08]`

## 8. Banned patterns for this product

| Banned | Why | Instead |
|---|---|---|
| `text-xs font-semibold uppercase tracking-wide` labels (prototype uses it for every section label and column header) | Anti-pattern #1 in `docs/governance/design-anti-patterns.md`; max once per screen | `text-sm font-medium` labels; `text-xs text-muted-foreground` meta |
| Raw `<table>`, raw `<button>` | Hook-blocked | `DataTable`, `Button` with explicit variant+size |
| `toast()` | Workspace rule | `LocalBanner` |
| Icons on action/CTA buttons (prototype: send-plane, plus, check) | Memory: text-only action buttons | Text only; icons allowed in nav, status, tabs |
| `py-20 text-center` empties | Anti-pattern | `EmptyState` (vendored) with next step |
| Hard-coded hex/rgb/oklch (prototype's blue/navy/amber) | Hook-blocked | Tokens |
| Two filled primaries on one surface (prototype: sticky "Send for review" + dialog "Send request" both blue) | One-primary rule | Sticky bar primary hands off to Sheet where Send is the single filled primary |
| `color-mix(in oklch` | Governance grep | Tokens |
| Overriding DS Card/Button shape (rounded-none / shadow-none) | Memory | Use as shipped |
| Colour-only status | WCAG 1.4.1 | Text + icon |

## 9. Verification to run before any build

1. Re-run `node tools/ds/source.mjs` for every ✓ component against the **pinned** version (1.5.1 vs 1.6.5 drift).
2. `ds-adoption-reviewer` on §4 gaps and §5 compositions (one verdict each).
3. Open `localhost:4000/library/<id>` for each component used in the first contract (workspace hard precondition).
4. Not verified here: runtime rendering, axe, visual-diff. Static research only.

## 10. Net-new documented hand-rolls (to register in `docs/governance/ds-adoption.md`; Romit applies, not edited here)

`SkillsFileUpload` (S-08) · `SkillsMultiPick` (Popover + Command + Checkbox; S-09, S-10) · `SkillStatusBadge` (wraps StatusBadge; OD-03 flag) · `ModelCriteriaLineage` C-1 · `QualificationRuleEditor` C-3 · `LevelEditor` C-4 · `LevelMinimumEditor` C-5 · `SettingMinimumEditor` C-6 · `SubmissionFieldEditor` C-7 · `FormPreview` C-8 · `AgreementCompareCard` C-11 · `ProgressBySetting` C-12 · `PerLevelStrip` C-13 · `StickySelectionBar` C-17 · `RoleSettingResolver` C-18 · `EvaluatorAnswerGroup` (S-13 self-evaluation + S-16). No equivalent exists in PCE or exam-management for any of these (ds-adoption-reviewer).

## DS defect for the DS team: SelectionTileGrid radio mode (found 2026-10-08, @exxatdesignux/ui 1.6.5)

`SelectionTileGrid` (`dist/components/ui/selection-tile-grid.js`) renders each tile as `<Label htmlFor=id class="flex ... aspect-square ...">` containing `<RadioGroupItem class="sr-only">`. The `<Label>` is not `position: relative`, and `sr-only` is `position: absolute`, so the radio is positioned against the page, not the tile.

- **Repro:** render `<SelectionTileGrid interaction="radio" options={...} />` with no `relative` ancestor and measure `#idPrefix-<value>`: `position: absolute`, bottom of the page.
- **Effects:** the radio is detached from its tile; clicking the control itself is intercepted by `<html>`; focusing it scrolls the document by about 15px; every page that hosts the grid gets a 15px document overflow.
- **Local workaround (S-09):** wrap the grid in a container with `[&_label]:relative`, and add `[&_label:has([data-state=checked])]:ring-2` so the selected tile has a shape cue beyond colour. See `components/configure/model-picker.tsx` and DEC-014.
- **Ask:** make the tile `<Label>` `relative` in the DS and show a non-colour selected cue.
