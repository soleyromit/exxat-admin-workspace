# Components v2 needs that the DS does not ship

Rule: do not style ad hoc. Each item below is composed from DS primitives in a product file, registered here, and offered to the DS team as a candidate. DS version checked: `@exxatdesignux/ui` 1.6.5 (via `node tools/ds/source.mjs <Component>`; the CLI reports 1.5.1 types, the installed package is 1.6.5, see `decisions-and-open-questions.md`).
Verdicts (IMPORT, VENDOR, HAND-ROLL) are for `ds-adoption-reviewer` before each component file is written. Rows 3 to 7 were built in Stage 2 (see the Stage 2 table).

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

## Registered in Stage 2 (composed from DS primitives, no ad hoc styling)

`ds-adoption-reviewer` verdicts, 2026-10-19: items 19 to 22 and 24 to 28 IMPORT, item 23 HAND-ROLL (generator) plus IMPORT (Dialog). One reviewer suggestion was not followed: the conflict chip uses the warning tone, not danger, because status visuals avoid red.

| # | Component | File | Composes from | Notes |
|---|---|---|---|---|
| 19 | **Mobile bottom navigation** (was 4) | `components/v2/student/student-frame.tsx` `StudentNav` | `Button asChild variant ghost or secondary` with `Link`, `nav` landmark, `aria-current` | Four destinations, 44 px, safe-area padding, sticky bottom below 768 px and above the column on desktop. |
| 20 | **Mobile skill card** (was 5) | `student/skill-card.tsx` | `Card size sm`, `StatusBadge`, `Button`, progress dots (FA icons, aria-hidden) | One skill, status in words, what is left, rule, request line, prerequisite checklist, one primary action. |
| 21 | **Offline sync chip** (was 6) | `student/sync-chip.tsx` | `StatusBadge` tone info, success, warning with an icon | Queued, Synced, Failed, Conflict. Text plus icon. Conflict and Failed are amber, not red. |
| 22 | **Conflict resolution panel** (was 7) | `student/sync-page.tsx` `ConflictScreen` | `Card`, `RadioGroup`, `Button` | Two versions side by side from 768 px, stacked below; each choice states its consequence; Keep both disabled with the reason for a rating. |
| 23 | **QR code display** (was 3) | `student/qr-code.tsx`, generator `lib/v2/qr.ts` | Inline SVG, `Dialog`, `Input`, `Button` | HAND-ROLL for the generator (no DS equivalent, no dependency, about 270 lines, tested). The link is shown as text and can be copied. |
| 24 | **Handover mode** | `student/request-signoff.tsx` `HandoverSheet` | `Sheet side right size full`, `Button` | Three phases; controls at least 56 px high; close button kept. |
| 25 | **Four-way method chooser** | `request-signoff.tsx` | `SelectionTileGrid interaction radio` | |
| 26 | **Evaluator picker row** with the disabled reason | `request-signoff.tsx` `EvaluatorPicker` | `RadioGroup` or `Checkbox`, `Label`, text linked by `aria-describedby` | Qualified or the reason in words. |
| 27 | **Sticky device banners** | `student-frame.tsx` `DeviceBanners` | `LocalBanner`, `Button` | Offline, signed out, update pending. None blocks anything. |
| 28 | **Demo controls card** | `student/demo-controls.tsx`, `scenario-menu.tsx` | `Card`, `Button`, `DropdownMenuCheckboxItem` | Labelled as not part of the product. |

## Registered in Stage 3 (composed from DS primitives, no ad hoc styling)

`ds-adoption-reviewer` verdicts, 2026-10-20: forms and timeline are product composition of DS primitives; dialogs, Tabs, Select and the staff table are IMPORT (the table through `V2Grid`).

| # | Component | File | Composes from | Notes |
|---|---|---|---|---|
| 29 | **Preceptor evaluation form** (skill assessment card, error summary with field links) | `components/v2/preceptor/evaluation-form.tsx`, `choice-group.tsx` | `Card`, `RadioGroup`, `Textarea`, `Collapsible`, `Checkbox`, `Field`, `FieldError`, `LocalBanner`, `Select` (demo control) | No DS evaluation form exists. The error summary is a `role="alert"` wrapper around `LocalBanner` with link-style `Button`s that move focus. |
| 8 | **Version-history timeline** (built) | `components/v2/outcomes/version-timeline.tsx` | `Collapsible`, `StatusBadge`, `Button`, semantic `ol` | Newest first, who, when, why, what each version recorded. Read-only. |
| 30 | **Remediation plan steps list** | `components/v2/outcomes/remediation-page.tsx` `StepList` | `Checkbox` (staff), FA status icon (student), `Dialog` for closing | Student view has no controls. |
| 31 | **Reopen dialog** | `components/v2/outcomes/evaluation-page.tsx` `ReopenDialog` | `Dialog`, `RadioGroup`, `Textarea`, `Field`, `FieldError` | |
| 32 | **Staff outcomes screen** | `components/v2/outcomes/outcomes-page.tsx` | `Tabs`, `V2Grid` (DS `DataTable`), `Card`, `StatusBadge` | |

DS registry note from the reviewer: the registry row that marks `DataTable` as VENDOR is stale at 1.6.5; v2 imports it from the package.

## Registered in Stage 4 (composed from DS primitives, no ad hoc styling)

`ds-adoption-reviewer` verdicts: the queue table is IMPORT (`DataTable` through `V2Grid`), dialogs, Tabs, Checkbox, RadioGroup, Textarea, Field and LocalBanner are IMPORT; the compare pair, photo placeholder and verification history are composition. Item 10 (side-by-side compare) is built as item 33.

| # | Component | File | Composes from | Notes |
|---|---|---|---|---|
| 33 | **Side-by-side compare** (built, was 10) | `components/v2/review/review-item-page.tsx` `CompareBlock` | `Card` pair in a two-column grid that stacks on a phone, `StatusBadge` for the outcome and the agreement, `dl` per side, `Collapsible` for earlier attempts | Agreement is a word plus an icon, never colour alone. Shows every response and the feedback (AR-03). |
| 34 | **Queue selection bar** | `components/v2/review/review-queue-page.tsx` | `Checkbox` (select all, indeterminate), `Button`, live region | Candidate DS fix: the DataTable row checkboxes show only on hover or focus and its bar is a dark slab with placeholder actions. A visible, touch-sized selection bar with a named count (`Approve 3 submissions`) is what the reviewer needs. |
| 35 | **Photo placeholder** | `review-item-page.tsx` `PhotoPlaceholder` | `Card`, FA icon, `role="img"` with a text alternative | The prototype stores the file name and size only. A real build needs an image viewer with zoom and rotate. |
| 36 | **Return dialog and reassign dialog** | `review-item-page.tsx` `ReturnDialog`, `review-queue-page.tsx` `ReassignDialog` | `Dialog`, `Field`, `Textarea`, `RadioGroup` (disabled options keep the reason as text) | |
| 37 | **Returned-request panel (student)** | `components/v2/student/returned-panel.tsx` | `LocalBanner`, `Textarea`, `Button`, hidden file input behind a DS `Button` | Reason in the reviewer's words, a derived next step, send again. 44 px targets. |
| 38 | **Verification pages** | `components/v2/director/verification-pages.tsx` | `V2Grid` (DS `DataTable`), `Card`, `StatusBadge`, `Checkbox`, `Textarea`, `LocalBanner`, semantic `ol` for the version history | The history list is a candidate for the same pattern as the version-history timeline (item 8). |

## Already covered by the DS (do not rebuild)

`DataTable`, `Dialog`, `Sheet`, `Popover`, `Command`, `LocalBanner`, `Badge`, `Button`, `Card`, `Tabs`, `RadioGroup`, `SelectionTileGrid`, `Checkbox`, `Skeleton`, `Tooltip`, `PageHeader`, `KeyMetrics`, `AppSidebar`.

## Registered hand-rolls

Stage 0: none. Stage 1: the file chooser (existing v1 file, item 18). Stage 3 and Stage 4: none. Stage 2: the QR matrix generator (`lib/v2/qr.ts`, item 23) and a native file input behind a DS Button for the photo (item 18 again). Everything else above is composition of DS primitives.
