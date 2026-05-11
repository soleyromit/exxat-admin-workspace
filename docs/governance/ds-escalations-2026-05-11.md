# DS gaps to escalate to Himanshu — 2026-05-11

> Workspace-level audit findings that require upstream DS changes.
> Compiled by aggregating depth audits + modal deep-study + state catalog
> + interaction-state sweeps. None of these are fixable in product code
> without vendoring or workarounds.

> Cross-references:
> - `docs/governance/modal-deep-study-2026-05-11.md` (DS gaps surfaced)
> - `docs/governance/component-state-catalog.md` §State-coverage gaps
> - `docs/governance/component-depth-audits/INDEX.md` (cross-cutting findings)
> - `docs/governance/interaction-sweep-2026-05-11.md`

---

## Library / catalog gaps

### L1 — 20 DS components exported but missing from `library-catalog.ts`
Source: `component-state-catalog.md:712`.

These are exported from `exxat-ds/packages/ui/src/index.ts` but have NO `/library/<id>` route and NO row in the catalog: **Avatar, Breadcrumb, Checkbox, Collapsible, DragHandleGripIcon, Drawer, Form, Label, Popover, RadioGroup, Select, SelectionTileGrid, Separator, Sonner, StatusBadge, Table (raw), Textarea, Toggle, ToggleGroup, ToggleSwitch**.

**Impact:** product engineers copy from arbitrary product code rather than from a canonical preview. The largest single state-coverage gap. Several of these (Popover, Checkbox, Select, ToggleSwitch) appear in nearly every page.

**Recommended action:** add catalog rows + preview routes for at least the top 6 most-used: Popover, Checkbox, Select, RadioGroup, Textarea, Label.

### L2 — `/library/dialog` route mislabel
Source: `component-state-catalog.md:505,722`; `modal-deep-study-2026-05-11.md:325`.

The case label in `exxat-ds/packages/ui/src/components/library/component-preview.tsx:965-966` routes `/library/dialog` to `FloatingSheetAllSidesPreview`, which is a Sheet preview — not a Dialog. The mislabel cascades: engineers don't see a canonical Dialog footer, which is why some adopt the deprecated `flex-1`/`flex-1` shadcn pattern.

**Recommended action:** fix the case label so `/library/dialog` previews a real Dialog with the canonical ghost-Cancel + default-primary footer.

### L3 — Sandbox-less / placeholder-only catalog entries
Source: `component-state-catalog.md:713-720`.

- `PrimaryPageTemplate` — used by every feature page, no catalog entry
- `Sidebar` — placeholder only, no interactive sandbox
- `CoachMark` — placeholder only
- `Field` — 9 exports, no sandbox
- `InputGroup` — only embedded inside Command demo
- `TablePropertiesDrawer` — placeholder
- `ListPageTemplate` — placeholder + tiny ViewsToolbar excerpt
- `DatePickerField` — in `index.ts`, missing from `Admin/apps/web/lib/library-catalog.ts` (depth-audits/INDEX.md:83)

### L4 — Variant-coverage gaps inside working sandboxes
Source: `component-state-catalog.md:724-730`.

- `Calendar`: only `mode="single"` demonstrated; no range/multiple/`captionLayout="dropdown"`/disabled-day exemplar
- `Input`: no focused / with-helper-text / with-error + `aria-describedby` association demos
- `Chart`: no empty / error / loading / multi-series demos
- `SectionCards`: no empty / loading / error demos
- `Command`: no loading state (async search) demo
- `Badge`: no `size="sm"` — every dense-row consumer overrides padding by hand

---

## API gaps

### A1 — No `loading` prop on Button
Source: `component-state-catalog.md:708-709`.

Pattern in use across both products: manual `disabled` + `<i className="fa-spinner-third fa-spin" />` content. Used in `ExportDrawer`. Every async submit re-implements this in product code.

**Recommended action:** add `loading?: boolean` prop on DS Button that handles disabled state + spinner + `aria-busy="true"`.

### A2 — No `loading` / `empty` / `error` variants on data-surface components
Source: `component-state-catalog.md:702-707`.

Affected: **Chart, DataTable, KeyMetrics, SectionCards, Calendar, DatePickerField**.

Today's workarounds:
- Loading: Skeleton wrapped in `aria-busy="true"` (per-product convention, not a DS prop)
- Error: LocalBanner with `retry={…}` next to the component (documented in `patterns/banners` but not co-located)
- Empty (vs filtered-empty): per-context `emptyState` copy on DataTable; nothing on the others

When real APIs replace mock data, every product will re-roll the same three patterns.

**Recommended action:** add canonical `slots={{ loading, empty, error }}` (or equivalent) on each of the six components, with documented defaults.

### A3 — ToggleSwitch missing aria-label forwarding
Source: `component-state-catalog.md:787`.

`ToggleSwitch` (`role="switch" aria-checked`) does not forward `aria-label` through to the inner Radix Switch. Products that need an unlabelled switch (e.g., icon-only theme toggles) must wrap it manually.

**Recommended action:** spread `...props` on the Radix Switch primitive so `aria-label` and `aria-labelledby` reach the actual interactive element.

### A4 — DS `Checkbox` can't safely render inside `role=option` rows
Source: `modal-deep-study-2026-05-11.md` DS gap #5; `apps/pce/admin/components/table-properties/drawer.tsx:632-642` rationale.

`TablePropertiesDrawer` had to hand-roll a checkbox-glyph because DS `Checkbox`'s internal click handling intercepts keyboard events meant for the wrapping `role=option` row. The hand-roll is documented in the vendor strip rationale.

**Recommended action:** add `data-prevent-click` or `aria-decorative` (or similar) prop on DS `Checkbox` so it can render visually inside a row without intercepting events.

### A5 — Floating-sheet inset math duplicated by every consumer
Source: `modal-deep-study-2026-05-11.md` DS gap #4.

`ObjectiveDeepDiveSheet` and `TablePropertiesDrawer` (and `ExportDrawer`) each duplicate the inline `style={{top, bottom, right, height}}` math + the `showOverlay={false}` + `showCloseButton={false}` triplet. The pattern lives only in `FloatingSheetAllSidesPreview` — which sits at the mislabelled `/library/dialog` route (L2 above).

**Recommended action:** export a `FloatingSheet` wrapper (or document a snippet) that codifies the inset math + overlay/close-button suppression as a single composition.

---

## Demo gaps

### D1 — No canonical footer demo for the Cancel-left-ghost / primary-right pattern
Source: `modal-deep-study-2026-05-11.md` DS gap #2.

None of the Sheet or Dialog demos show this explicitly. The 6f180c1 commit (`ReleaseSheet`) is the only working example in product code. The absence is why the `pce-modals.tsx` cluster used the deprecated `flex-1`/`flex-1` pattern for so long.

**Recommended action:** add an "Acceptable footer patterns" section to `/library/sheet` showing:
- ghost Cancel + default primary (canonical for forms)
- destructive footer (outline Cancel + destructive primary)
- 3-button wizard footer (Back / Cancel / Next)

### D2 — No canonical demo of validation surface on dialog inputs
Source: `modal-deep-study-2026-05-11.md` DS gap #3.

The DS exposes `Field` / `FieldError` / `LocalBanner`, but no canonical Dialog demo shows the pattern: `validate()` → `setErrors` → re-render with `aria-invalid` + `FieldError` + `LocalBanner` summary on 2+ errors. The canonical reference today is buried in product code at `apps/pce/admin/app/(app)/admin/accommodations/page.tsx:96-126`.

**Recommended action:** add a "Dialog with form validation" demo showing the canonical pattern + a `LocalBanner` pre-footer for ≥2 field errors.

### D3 — Popover under-documented in the state catalog
Source: `modal-deep-study-2026-05-11.md` cross-reference, `component-state-catalog.md:612`.

Catalog has one line for Popover. Modal deep-study surveyed 7 instances across at least 5 distinct patterns (confirmation popover, filter-pill editor, hover-diff, sibling-switcher, collaborator-avatars). No canonical patterns documented.

**Recommended action:** upgrade Popover documentation with each of the five patterns + a sandbox showing align/side/sideOffset variants.

---

## Structural / a11y gaps in DS source

### S1 — `aria-required-children` (axe critical) on cmdk `CommandDialog`
Source: `interaction-sweep-2026-05-11.md` (extended) — assessment-taker sweep 2026-05-11.

On every assessment-taker route, opening any dropdown triggers a critical axe violation: cmdk's `CommandDialog` (used internally by DS `Command`) renders a structure missing required ARIA children. The error surfaces as `TypeError: Cannot read properties of undefined (reading 'subscribe')` in console — appears to be a Radix portal / cmdk version mismatch under React Router v6 + Vite, plus the underlying ARIA structure issue.

This is most visible on the Vite-based `assessment-taker` (3 routes, 3 instances on `open-dropdown` state). Worth confirming whether the bug surfaces in the Next.js admin apps too.

**Recommended action:** investigate cmdk version pin + ARIA structure inside `CommandDialog`; consider patching the Radix `Dialog.Content` aria nesting.

### S2 — `aria-hidden-focus` cluster on `DropdownMenu` portal
Source: `interaction-sweep-2026-05-11.md` line 18-30; `apps/pce/admin/components/data-table/pagination.tsx:76`; commit 6ca6587.

Until the workspace-wide `modal={false}` sweep was committed (6ca6587), every DropdownMenu mounted via the Radix Portal triggered the rule because the trigger lived inside an `aria-hidden` region while focus was inside the menu. 64 nodes across 35 routes pre-fix.

**Recommended action:** make DS `DropdownMenu` default to `modal={false}` (or document the requirement prominently). Product code shouldn't have to remember the flag on every instance.

### S3 — Long names inside `DialogTitle` cause clipping in narrow Dialogs
Source: `modal-deep-study-2026-05-11.md` §3.

Multiple QB + PCE delete dialogs literally embed the entity name with curly quotes inside `DialogTitle` (e.g., `Delete "{node.name}"?`). At long names + narrow `sm:max-w-md`, the title wraps or overflows. The DS provides no guidance to push the name into `DialogDescription` instead.

**Recommended action:** add a usage guideline in the `/library/dialog` page (after L2 fix): "Keep DialogTitle ≤ 40 chars; push entity names + counts into DialogDescription."

### S4 — Per-product card-imposter divs slip through audit
Source: `scripts/ds-adoption-audit.py` (`card-imposter-div` rule).

Even after the inline-Card sweep, `apps/pce/admin/components/pce/pce-modals.tsx:106` still has a `<div>` with rounded + border + padding masquerading as Card chrome. The DS audit catches it as a warn, but the rule has no auto-fix and no canonical "this is what Card should look like" demo at that scale (a small bordered group inside a Sheet body).

**Recommended action:** consider a `Card variant="grouped"` or `FieldGroup`-like wrapper specifically for "bordered checkbox group inside a Sheet body" — the current pattern is wedged between `Card` (too heavy) and bare `<div>` (audit-noisy).

---

## Recommended escalation priority (top 5)

| # | Item | Why prioritize |
|---|---|---|
| 1 | **L2 — Fix `/library/dialog` mislabel** | Single-line case label swap; unblocks D1 + D2 demo work; eliminates the source of `flex-1`/`flex-1` footer copy-rot |
| 2 | **A1 — Add `loading` prop on Button** | Single API addition; eliminates 6+ hand-rolls already in product code; required for the loading-state push when real APIs land |
| 3 | **A2 — Loading / empty / error variants on data surfaces** | Largest cross-product gap; will hit every page on first API integration; better to design the slots now than per-product later |
| 4 | **S2 — Default `modal={false}` on DropdownMenu** | Removes the workspace-wide a11y trap; commit 6ca6587 already proves the fix works; making it the default closes the rule permanently |
| 5 | **L1 — Catalog the 6 most-used missing components** (Popover, Checkbox, Select, RadioGroup, Textarea, Label) | Discoverability fix; product engineers stop copying from arbitrary product code |

---

## Defer / track but not blocking

- L3, L4 (sandbox + variant-coverage) — important for new product onboarding but doesn't unblock current work
- A3 (ToggleSwitch aria-label) — only affects icon-only switches, none in current product code
- A4 (Checkbox in `role=option`) — one consumer (`TablePropertiesDrawer`), documented vendor rationale already in place
- A5 (FloatingSheet wrapper) — three consumers, inline math is annoying but stable
- D3 (Popover documentation) — survey usage is shallow per product; lift after L1
- S3 (DialogTitle guideline) — documentation-only
- S4 (card-imposter alternative) — design decision, not a blocker
