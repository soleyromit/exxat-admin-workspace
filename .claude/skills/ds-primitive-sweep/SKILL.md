---
name: ds-primitive-sweep
description: Use when Romit asks whether ONE DS primitive is used consistently ACROSS ALL products — "are the table / tabs / avatar / sheets following the same DS components?", "I'm still seeing pages in PCE and Exam management not following", "do for table, tabs, avatar, navigation, leo button, sheets, dialogs, headings, etc.", "why hasn't exam management been updated?". Sweeps one component type across every app under apps/ and reports, per product, which files hand-roll or mis-configure it. Read-only — reports a deviation list, fixes nothing until told. Invoked with `/ds-primitive-sweep <primitive> [<primitive2> ...]`.
---

# DS Primitive Sweep — one component type, every product

Romit's single most-repeated design ask is **cross-product component conformance**: "are table, tabs, avatar, sheets, etc. all using the same DS component — I'm still seeing pages in PCE and Exam Management that aren't." This skill answers exactly that.

**It is NOT the other DS skills:**
- `ds-check` = one file / staged set, all rules.
- `ds-sweep` = one product dir, all rules, remediation backlog.
- `cross-page-audit` = one pattern across sibling pages in ONE product.
- **`ds-primitive-sweep` = ONE primitive across ALL products** — the axis none of the above cover, and the one that catches "why hasn't exam-management been updated?" (a fix applied to PCE but not the other apps).

Read-only by default. Report the deviation table; fix only when Romit says "yes, fix" / "batch it all now".

## When to invoke

- "ensure that the table / tabs / avatar / sheets are following the same DS components across products"
- "do for table, tabs, avatar, navigation, leo button, sheets, dialogs, headings, etc." (multiple primitives → run once per primitive)
- "why hasn't exam management been updated?" / "why is this screen still like this?" (a fix landed in one product, not the rest)
- Proactively after changing how a primitive is used in ONE product — sweep the same primitive across the others before claiming done.

## Products in scope

Sweep every app under `/Users/romitsoley/Work/apps/*/` — both `admin/` and `student/` where present:

```bash
APPS=$(ls -d /Users/romitsoley/Work/apps/*/ | grep -Ev '/(docs|skills-checklist)/')
# exam-management, pce, portal, patient-log, learning-contracts
```

Admin imports `@exxatdesignux/ui`; student imports `@exxat/student/components/ui/*`. A "deviation" is a hand-rolled element or a mis-configured DS usage where the product's DS exports the correct primitive.

## The primitive registry

For each primitive: the DS component to expect, the deviation signatures to grep, and the DS-convention checks. Signatures are starting points — Read each hit ±8 lines to confirm before reporting (avoid false positives).

### `table` / `datatable`
- **Expect:** `DataTable` (admin) — never raw `<table>`, never a re-implemented table.
- **Deviation grep:** `<table[ >]` · `<thead` · `role="grid"` hand-rolled · `<Table` used raw without DataTable wrapper.
- **Convention:** rounded table wrapper needs `overflow-hidden`; `searchable={false}` needs `showQueryControls={false}`; `toolbarSlot` present on list pages; no `bg-dt-header-bg`/`tracking-wide` on `TableHead` (admin-DS-only override, not DS default).

### `tabs`
- **Expect:** DS `Tabs` / `TabsList` / `TabsTrigger`.
- **Deviation grep:** hand-rolled tab bars — `role="tablist"` on a raw `<div>`, button rows toggling `activeTab` state without `TabsTrigger`.
- **Convention:** `TabsList` needs `variant="line"` (active underline) and the Tabs root needs `flex flex-col`; entity-detail tabs start with Overview.

### `avatar`
- **Expect:** DS `Avatar` / `AvatarFallback` / `AvatarImage`.
- **Deviation grep:** `rounded-full` on an `<img>` or initials `<div>` not wrapped in `Avatar`; person identity rendered ad-hoc.
- **Convention:** no persona-tinted background hardcoded on `AvatarFallback`; fallback text ≥12px (never overridden down); person identity uses the DS identity display, not bespoke name+avatar markup.

### `sheet` / `drawer`
- **Expect:** DS `Sheet` (form drawers), not Vaul, not a hand-rolled slide-over.
- **Deviation grep:** `vaul` import · `Drawer` from a non-DS source · fixed-position slide-over `<div>` with `translate-x`.
- **Convention (Romit flags this repeatedly):** form Sheets use `showOverlay={false}` + `showCloseButton={false}` + a footer **Cancel** button, width ≤600px. Never render BOTH the default `X` and a Cancel. See `component-consistency.md §6`.

### `dialog`
- **Expect:** DS `Dialog` / `AlertDialog`.
- **Deviation grep:** hand-rolled modal — `fixed inset-0` backdrop `<div>` with a centered card not using `Dialog`.
- **Convention:** confirm/destructive → `AlertDialog`; choose Sheet vs Dialog per `exxat-overlays`.

### `button`
- **Expect:** DS `Button` with explicit `variant` + `size`.
- **Deviation grep:** raw `<button` · `Button` without `variant=` · `Button` without `size=`.
- **Convention:** icon-only `Button` needs `aria-label`; action/CTA buttons are text-only (no leading/trailing `fa-` icon); brand-color reserved for primary CTAs only.

### `navigation` / `nav` / `sidebar`
- **Expect:** DS `Sidebar` / `NavLinkItem` shell (Design OS chrome — all products must share it).
- **Deviation grep:** raw `<nav>` with hand-rolled links · `<a>`/`<button>` nav rows not using `NavLinkItem` · inner sub-panels using `var(--sidebar)` (brand-tint) instead of `var(--background)`.
- **Convention:** single active row; active state = `var(--background)` + `data-active:bg-muted`, never brand-tint on inner panels; only the top-level app sidebar uses `var(--sidebar)`.

### `leo button` / `ask leo`
- **Expect:** the shared Leo / Ask-Leo button component.
- **Deviation grep:** `Ask Leo` / `Leo` rendered as a bespoke `Button`+icon instead of the shared component; missing on entity layouts that should have it.
- **Convention:** consistent placement per the entity layout pattern (QB-style header).

### `heading` / `headings`
- **Expect:** DS display type — `font-heading` (ivypresto serif) for page/section titles.
- **Deviation grep:** `text-2xl font-semibold` / `text-xl font-semibold` on a page title (flat Tailwind sans instead of `font-heading`); sub-12px font sizes anywhere (`text-[11px]`, `text-[10px]`).
- **Convention:** min font size 12px everywhere; use `font-heading` + type/shadow tokens for fidelity.

### `badge` / `status`
- **Expect:** DS `Badge`; PCE status → `ListHubStatusBadge` (single source of truth), never a dot-span or custom-token pill.
- **Deviation grep:** `rounded-full` status dot `<span>` · hardcoded status colors · bespoke status pill not routing through `ListHubStatusBadge`.
- **Convention:** `Badge`/`AvatarFallback` default 12px, never overridden down.

### `kpi` / `keymetrics`
- **Expect:** DS `KeyMetrics`.
- **Deviation grep:** flat `<div>` metric strips; more than four tiles; progress/segmented-bar dashboard viz.
- **Convention:** max four tiles; `variant="compact"` for no-header cards; honest deltas; no basic progress-bar viz.

> Primitive not listed? First resolve its real API — `node tools/ds/source.mjs <Component>` — then grep for raw HTML equivalents and DS-config gaps the same way. Add the new primitive's signatures to this registry when done.

## Protocol

### Step 1 — Resolve the primitive(s)

Map each word Romit gave to a registry entry above. If he listed several ("table, tabs, avatar, sheets, etc."), queue one pass per primitive and report them as separate sections.

### Step 2 — Sweep every product

For the primitive's deviation signatures, grep across all apps at once, grouped by product:

```bash
PRIM_GREP='<table[ >]|<thead'   # example: table
for app in exam-management pce portal patient-log learning-contracts; do
  echo "===== $app ====="
  grep -rnE "$PRIM_GREP" /Users/romitsoley/Work/apps/$app --include='*.tsx' \
    2>/dev/null | grep -v node_modules
done
```

Run the DS-convention checks (Step-by-step from the registry entry) as additional greps — a file can import the DS component and still be a deviation (e.g. a Sheet with a default `X` AND a Cancel).

### Step 3 — Confirm each hit

Grep gives file:line. Read ±8 lines to confirm it is a genuine deviation, not a false positive (e.g. a `<table>` inside a code-block string, or `variant` set on the next line).

### Step 4 — Report the cross-product deviation table

```
DS PRIMITIVE SWEEP: Sheet
────────────────────────────────────────────────
exam-management  ✗ 2 deviations
  admin/app/(app)/faculty/invite-faculty-sheet.tsx:41 — renders default X AND footer Cancel (convention §6)
  admin/app/(app)/terms/add-term-sheet.tsx:12 — width 720px (>600px cap)
pce              ✓ CLEAN (all 6 Sheets: showOverlay=false + showCloseButton=false + Cancel)
portal           ✗ 1 deviation
  admin/components/export-drawer.tsx:8 — imports `vaul` (banned)
patient-log      — no Sheet usage
learning-contracts — no Sheet usage
────────────────────────────────────────────────
Deviations: 3 across 2 products / 5 products checked
Fix now? (report-only until you say "yes, fix" / "batch it all now")
```

### Step 5 — Fix only on approval, then re-sweep

When Romit approves ("yes", "batch it all now", "do it"):
- Fix every confirmed deviation in the same pass (do NOT fix one product and defer the rest — that recreates the exact "why hasn't exam management been updated?" miss this skill exists to prevent).
- Re-run Step 2 for the primitive and paste a CLEAN table as evidence before claiming done.
- For a primitive with a runtime/visual dimension (Sheet width, active-tab underline), note it needs a `ds-conformance-reviewer` / visual-diff pass — Two-tier verdict: report `GREENLIGHT (static)` for the grep-clean sweep.

## Usage examples

```
/ds-primitive-sweep sheet
/ds-primitive-sweep table tabs avatar sheets headings
```

Multiple primitives run sequentially and report one deviation table each, followed by a one-line roll-up: `N primitives swept · M total deviations · P products touched`.
