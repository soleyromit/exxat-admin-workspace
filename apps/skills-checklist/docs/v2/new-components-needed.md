# Components v2 needs that the DS does not ship

Rule: do not style ad hoc. Each item below is composed from DS primitives in a product file, registered here, and offered to the DS team as a candidate. DS version checked: `@exxatdesignux/ui` 1.6.5 (via `node tools/ds/source.mjs <Component>`; the CLI reports 1.5.1 types, the installed package is 1.6.5, see `decisions-and-open-questions.md`).
Verdicts (IMPORT, VENDOR, HAND-ROLL) are for `ds-adoption-reviewer` before each component file is written. Nothing below is built in Stage 0.

| # | Component | Needed by (steps) | Composes from DS primitives | Notes and constraints |
|---|---|---|---|---|
| 1 | **Cohort heatmap** (students by skills) | 12 | `DataTable` or a semantic grid (the pre-commit audit blocks raw `Table` in product code; ds-adoption-reviewer to rule), `Tooltip`, `Badge`, `Popover` for the cell detail, `ScrollArea` | Colour from a sequential scale built from the Prism hue (342) by varying lightness and chroma only, defined as CSS custom properties on `:root`, never red. Every cell also carries text (a number or a symbol), so colour is never the only signal. Keyboard: arrow keys move between cells, Enter opens detail. |
| 2 | **Sequential colour scale tokens** | 12, 14 | CSS custom properties in the product stylesheet (`--scale-1` to `--scale-6`) | Derived from `--brand-color` with `color-mix` in OKLCH steps. Must pass 3:1 against the cell background and 4.5:1 for cell text. Candidate for the DS token set. |
| 3 | **QR code display** | 6 | `Card`, `Dialog` (or `Sheet` on phone), `Button`, `LocalBanner` | A QR image library is a new dependency, so the code is rendered from a small SVG generator behind one component. Shows what the code opens, a text link beside it, an expiry sentence `[PROPOSED]`, and a copy-link button for people who cannot scan. |
| 4 | **Mobile bottom navigation** | 5, 6, 7, 13 | `Button` (ghost, icon plus label), `Badge` for counts, `nav` landmark | Four destinations at most. Targets at least 44 px. Respects the safe-area inset. Shown below 768 px for the Student role only. The DS sidebar sheet stays for everything else. |
| 5 | **Mobile skill card** | 5, 6 | `Card`, `Badge`, `Checkbox` or `Toggle`, `Button` | One card per skill with status, what is left and one primary action. Replaces a table on a phone. |
| 6 | **Offline sync chip** | 7 | `Badge` (outline or secondary), `Tooltip`, `Popover` | Three states with text and icon: Queued, Synced, Conflict. Conflict is amber, not red. Polite live region announces changes. |
| 7 | **Conflict resolution panel** | 7 | `Card`, `RadioGroup` or `SelectionTileGrid`, `Button`, `LocalBanner` | Two versions side by side, pick one, confirm. Never silently overwrites. |
| 8 | **Version-history timeline** | 9, 11 | `Collapsible`, `Separator`, `Badge`, semantic `ol` | Newest first. Each entry: version number, who, when, outcome, reason for change. Earlier versions are read-only. Used for reopened evaluations (immutability: reopen adds a version, never edits one). |
| 9 | **Lab batch grid cell** | 14 | `DataTable` or semantic grid, `Button` (ghost) per cell, `Tooltip` | Cell cycles Met, Not met, Not yet on click or Space. Each cell has an accessible name that includes student, skill and current value. Absent students show a distinct text state and a row-level toggle. No red for Not met (neutral or amber with text). |
| 10 | **Side-by-side compare** | 10 | `Card` pair, `DataTable`, `Badge` for agree or differ | Student self-rating next to evaluator outcome with an agreement badge `[REQ AR-02]`. Likely composes into the existing `AgreementCompareCard` hand-roll. |
| 11 | **Signed report preview** | 12, 13 | `Dialog`, `Card`, `Button`, `LocalBanner` | A read-only preview of the PDF contents plus a fingerprint line. The tamper-evident claim is a `[PROPOSED]` design, not an implemented signature, in the prototype. |

## Registered in Stage 1 (composed from DS primitives, no ad hoc styling)

| # | Component | File | Composes from | Notes |
|---|---|---|---|---|
| 12 | **Editable ordered list** (levels, questions, events) | `components/v2/admin/wizard-fields.tsx` `ListEditor` | `Input`, `Button` (ghost, icon-sm), `fieldset` | Add, remove, optional up and down. The DS has no list editor. Drag reordering is not built. |
| 13 | **Checkbox group with a focusable fieldset** | `wizard-fields.tsx` `CheckGroup` | `Checkbox`, `Label`, `FieldSet`, `FieldLegend` | Fieldset has `tabIndex=-1` so an issue link can focus the group. |
| 14 | **Number field** (empty is null, never 0) | `wizard-fields.tsx` `NumberField` | `Field`, `FieldLabel`, `Input` | Validation sees exactly what would be saved. |
| 15 | **Rule hint card** (live region with a strength badge) | `wizard-steps.tsx` `Hint` | `Card`, `Badge` | Used for the achievement strength, simulation share and qualified evaluators. |
| 16 | **Proposal beside source line** | `import-panel.tsx` | `DataTable` via `V2Grid`, `ToggleGroup`, `Badge`, `q` | Decision, proposal, source line and edit in one row. |
| 17 | **Skill edit dialog** | `edit-skill-dialog.tsx` | `Dialog`, `Field`, `Input`, `Textarea` | Used for library skills and proposed skills. |
| 18 | **File chooser** | `components/skills/skills-file-upload.tsx` (existing v1 hand-roll) | native input behind a DS `Button` | The DS has no file upload. |

## Already covered by the DS (do not rebuild)

`DataTable`, `Dialog`, `Sheet`, `Popover`, `Command`, `LocalBanner`, `Badge`, `Button`, `Card`, `Tabs`, `RadioGroup`, `SelectionTileGrid`, `Checkbox`, `Skeleton`, `Tooltip`, `PageHeader`, `KeyMetrics`, `AppSidebar`.

## Registered hand-rolls

Stage 0: none. Stage 1: the file chooser (existing v1 file, item 18). Everything else above is composition of DS primitives.
