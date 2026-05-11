# Forms & Inputs — Depth audit (2026-05-11)

> Covers: Input, Field, InputGroup, Calendar, DatePickerField. Batched because they compose every form surface — the single gap is form-pattern (no validation wiring, no date picker, suffix-affordance hand-rolls), not five separate atom gaps.

## Library reality

| Component | Source | Key features |
|---|---|---|
| Input | `input.tsx` (23 lines) | `h-8 rounded-md border-input`. Built-in `aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20`. No `size` variant, no `error` prop — relies on caller-supplied `aria-invalid`. |
| Field | `field.tsx` (239 lines) | 10 slots: `FieldSet`, `FieldLegend`, `FieldGroup`, `Field`, `FieldContent`, `FieldLabel`, `FieldTitle`, `FieldDescription`, `FieldSeparator`, `FieldError`. `Field` has `orientation: vertical \| horizontal \| responsive`. `FieldError` accepts `errors={[{message}]}` array, dedupes, renders with `role="alert"`. `data-invalid=true` cascades destructive tint. |
| InputGroup | `input-group.tsx` (157 lines) | Focus-within + has-aria-invalid handling. `InputGroupAddon align: inline-start \| inline-end \| block-start \| block-end`. `InputGroupButton size: xs \| sm \| icon-xs \| icon-sm`. Also `InputGroupText`, `InputGroupInput`, `InputGroupTextarea`. Auto-focuses input on addon click. |
| Calendar | `calendar.tsx` (220 lines) | Wraps `react-day-picker` v9. `mode: single \| multiple \| range`. `captionLayout: label \| dropdown`. Built-in range styling, focus management, RTL flips. Themed for Popover/Card nesting. |
| DatePickerField | `date-picker-field.tsx` (72 lines) | Popover + single-mode Calendar. `Button` trigger formatted via `formatDateUS`. WCAG-correct (label on button, no hidden text input). Props: `value`, `onChange`, `id`, `disabled`, `triggerClassName`, `fromYear` (2020), `toYear` (2032). Exported from DS index — **not in `/library` catalog**. |

## Adoption snapshot

| Component | PCE admin | exam-mgmt admin | Hand-roll / wrong-shape |
|---|---|---|---|
| Input | 10 files (~26 sites) | 10 files (~46 sites) | 0 imposters — but ~7 sites should be InputGroup or DatePickerField |
| Field slots | 9 files (all master-list dialogs) | 1 file (qb-modals.tsx — single Field) | 0 — but **`FieldError` is used 0× workspace-wide** |
| InputGroup | 1 (permissions search) | 8 (7 search + 1 numeric +/− at qb-modals.tsx:70) | 3 `relative + absolute` suffix hacks + 2 sibling `<span>` units |
| Calendar | 1 indirect (DataTable filter primitive) | 0 | n/a — internal use, no product adoption |
| DatePickerField | 0 | 0 | 6 raw `<Input type="date">` + 1 free-text deadline |

### Headline: validation depth = 0%

`aria-invalid`, `FieldError`, `aria-errormessage` each appear **0×** in product code. ~19 dialog/sheet/drawer files contain Inputs. None expose validation state to assistive tech, even when client-side validation runs (the typical pattern is `disabled={!draft.name.trim() || ...}` — silent disable, no message).

## Per-component findings

### Input

Used in 20 files. No one re-implements `<input>` — the component's built-in `aria-invalid:` chain is fine. The gap is *caller-side wiring*.

Representative: `apps/pce/admin/app/(app)/admin/terms/page.tsx:67-78` — submit disabled until name + year + start + end are all non-empty, with no `aria-invalid`, no `FieldError`, no focus to first invalid. Screen-reader users see a permanently disabled "Add" button with no explanation. Same shape in PCE `offerings/page.tsx`, `students/page.tsx`, `courses/page.tsx`, `competencies/page.tsx`, `content-areas/page.tsx`, `standards/page.tsx`, `permissions/page.tsx` (**8/8 PCE master-list dialogs**) and exam-mgmt `qb-modals.tsx`, `add-accommodation-modal.tsx`, `create-assessment-modal.tsx`, `assign-practice-dialog.tsx` (**4/4 exam-mgmt creation flows**).

**Recommended next 1 fix.** Wire `terms/page.tsx` as the validation reference (submit-attempt state, `aria-invalid` per Field, `FieldError` per Field, focus to first invalid). The diff is near-identical for the other 8 PCE dialogs and the 4 exam-mgmt creation flows. ~3h reference + ~6h propagation. Single largest a11y win in the workspace.

### Field

Adoption is **higher than the brief suspected** — 9 PCE master-list dialogs use Field slot composition correctly (`Field orientation="vertical" → FieldLabel + Input + FieldDescription`). PCE is the reference; nothing to migrate away from.

The gap is exam-mgmt's parallel pattern: `<div className="flex flex-col gap-1.5"><Label htmlFor> <Input/></div>` — same visual layout, hand-rolled. ~16 sites in `create-assessment-modal.tsx`, `add-accommodation-modal.tsx`, `assign-practice-dialog.tsx`, `question-editor.tsx`, `assessment-builder-client.tsx`, `access/page.tsx`. Brief hypothesis "everyone uses shadcn Form" is **refuted** — `FormField/FormItem/useForm` returns 0 hits workspace-wide. There is no Form pattern at all in exam-mgmt — just raw Label+Input+div.

**When to prefer Field over div+Label.** Whenever you want `FieldDescription`, `FieldError`, `orientation="horizontal"`/`"responsive"`, `FieldSet + FieldLegend` (WCAG-required for grouped radios/checkboxes), or `FieldGroup` (uniform spacing). The div+Label pattern can never give `FieldError` semantics — it lacks the `role="group"` wrapper and `data-invalid` cascade.

**Recommended next 1 fix.** Migrate `create-assessment-modal.tsx` (~10 Inputs across 3 steps, the highest-traffic exam-mgmt creation flow) to Field slot composition. Pair with the validation-wiring fix above so they ship together. Use it as the canonical exam-mgmt form template. ~2h.

### InputGroup

Search adoption is solid — 8/9 imports are search bars (`fa-magnifying-glass` inline-start + InputGroupInput). The 9th is `qb-modals.tsx:70-84` (numeric +/− buttons — good non-search example).

**Non-search opportunities (hand-rolled today):**

1. `apps/exam-management/admin/components/question-editor/question-editor.tsx:693-702` — rubric weight `%` suffix using `relative` wrapper + `<span className="absolute right-2 top-1/2 -translate-y-1/2">%</span>` overlaid on Input. Textbook `InputGroupAddon align="inline-end"` candidate. **Highest leverage.**
2. `question-editor.tsx:611-647` — numeric-question Answer/Tolerance/Units as three side-by-side Inputs. Units is conceptually a suffix to Answer (e.g. `[3.5][mg]`), not a peer column. Should be Answer wrapped in InputGroup + inline-end addon containing the unit selector.
3. `apps/exam-management/admin/components/create-assessment-modal.tsx:243-274` — Allotted-time / Question-count with sibling `<span className="text-sm text-muted-foreground">minutes</span>` / `questions`. Should be `InputGroupAddon align="inline-end"` with `InputGroupText`. ~15min each.
4. **Misuse**: `qb-table.tsx:204, 2458` and `qb-sidebar.tsx:988` override DS chrome via inline `style={{ borderColor: 'var(--brand-color)', boxShadow: '0 0 0 3px color-mix(...)' }}` — faking a permanent-focus state that fights the built-in focus ring. **Drop the inline override.**

PCE surveys/my-surveys/moderation lists don't have search bars yet — when they do, route through InputGroup.

**Recommended next 1 fix.** `question-editor.tsx:693-702` rubric `%` suffix (~5min). Cite as the canonical "Input + unit suffix" pattern; unblocks the create-assessment-modal and numeric-question migrations.

### Calendar / DatePickerField

**Workspace product adoption: 0.** Calendar shows up once via `apps/pce/admin/components/data-table/filter-date-calendar.tsx` — a private DataTable filter primitive (used only by `data-table/index.tsx:268`). No product page imports Calendar directly. DatePickerField has 0 imports anywhere.

**0 adoption is a gap, not "fine for now"**, because date entry is happening — in the wrong shape:

| Site | Current shape | Why a gap |
|---|---|---|
| `apps/pce/admin/components/pce/pce-modals.tsx:263-269` | `<Input type="text" placeholder="e.g. May 30, 2026">` for **survey response deadline** | Free-text date. No parsing, no validation, no calendar affordance. Survey scheduling is a Phase-1 differentiator (project_exam_aarti_may7). **Highest-impact target.** |
| `apps/pce/admin/app/(app)/admin/terms/page.tsx:229-246` | Two `<Input type="date">` for term start/end | Native picker — Chrome/Safari/Firefox inconsistency, no range linkage. |
| `apps/exam-management/admin/components/create-assessment-modal.tsx:333-359` | Four `<Input type="date">` + `<Input type="time">` for open-window | Most prominent exam-mgmt scheduling flow. DatePickerField fits date sides; TimePicker not in DS (log as DS request). |
| `apps/exam-management/admin/components/assign-practice-dialog.tsx:200-205` | `<Input type="date">` due-date | Single optional date — perfect DatePickerField fit. |
| `apps/exam-management/admin/components/add-accommodation-modal.tsx:391-394` | `<Input type="date">` expiry | Same. |

**Highest-impact candidate: PCE survey deadline (`pce-modals.tsx:263`).** Two reasons: (1) only one not even using `type="date"` — free-text. (2) Survey scheduling is a Phase-1 differentiator per Aarti's May 7 directives. Fix here defines the pattern for the entire PCE surface.

**Recommended next 1 fix.** Replace `pce-modals.tsx:263-269` deadline Input with `DatePickerField`. ~30min. Then propagate to the four `type="date"` sites in exam-mgmt as a follow-up batch. Also: **add DatePickerField to `/library` catalog** — its absence from the demo route is why product teams haven't discovered it.

## Combined: 3 highest-leverage form-pattern actions

1. **Wire validation in PCE terms dialog as the reference** (`apps/pce/admin/app/(app)/admin/terms/page.tsx`). Submit-attempt state, `aria-invalid` per Field, `FieldError` with concrete messages, focus to first invalid. Then propagate across the 8 PCE master-list dialogs and 4 exam-mgmt creation flows. **Impact:** validation depth 0% → >80% in one pass; WCAG 3.3.1 + 3.3.3. **Effort:** 3h + ~6h propagation.

2. **Adopt DatePickerField for PCE survey deadline + propagate**. `pce-modals.tsx:263` first; then 5 `type="date"` sites in exam-mgmt. Add DatePickerField to `/library` so it stops being invisible. **Impact:** removes browser-inconsistent native widgets from creation flows; gives Aarti-prioritized scheduling its first DS-native pattern. **Effort:** 30min PCE + 1h exam-mgmt + 30min library entry.

3. **Migrate exam-mgmt `create-assessment-modal.tsx` from div+Label to Field slots with InputGroup affordances**. Wrap 10 Inputs in `FieldGroup > Field > FieldLabel + Input/InputGroup + FieldDescription + FieldError`. Replace sibling `<span>minutes</span>` / `questions` with `InputGroupAddon align="inline-end"`. Then propagate to question-editor rubric `%`, numeric-question Units, assign-practice-dialog. **Impact:** lands one form-shape across exam-mgmt matching PCE master-list shape; eliminates 4 documented suffix hand-rolls. **Effort:** 2h reference + ~3h propagation.

## What audit can't see

- **Validation timing** — on-blur vs on-change vs on-submit is a design judgment; regex can't pick.
- **Native vs custom date picker trade-off**. `<input type="date">` gives free a11y on mobile (iOS/Android wheels). DatePickerField may regress touch UX. Recommendation here favors DatePickerField because cross-browser inconsistency + lack of theming hurt admin desktop more than native loss hurts mobile (admin is desktop-first). Decision should be revisited if the apps go responsive.
- **Input grouping vs spacing density**. Four side-by-side date+time Inputs in `create-assessment-modal.tsx:329-360` may genuinely want to be four discrete controls. Not a regex call.
- **Validation copy**. Wiring `FieldError` exposes that no one has written real error copy — "Term name is required" vs "Please enter a name" is product-voice judgment.
- **FieldSet/FieldLegend gap** for grouped checkboxes/radios (WCAG 1.3.1). Audit can't distinguish "grouped" from "stacked" by markup alone. Worth a per-page pass after validation work lands.
- **`Field orientation="responsive"`** is 0× adopted. Dense settings panels could benefit; judgment call per dialog.
