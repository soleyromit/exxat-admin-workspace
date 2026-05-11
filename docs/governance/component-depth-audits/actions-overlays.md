# Actions & Overlay Molecules — Depth audit (2026-05-11)

> Covers: Button, DropdownMenu, Tooltip, Tip

## Library reality

| Component | Variants / API | Notes |
|---|---|---|
| **Button** (`button.tsx`, 67 lines) | variants: `default` `outline` `secondary` `ghost` `destructive` `link` · sizes: `default` (h-9) `xs` (h-6) `sm` (h-8) `lg` (h-10) `icon` `icon-xs` `icon-sm` `icon-lg` · `asChild` | Stamps `data-variant data-size`. Variant = CTA discipline, size = density. `[a]:hover:bg-primary/80` makes asChild-Link wraps a real hover surface. |
| **DropdownMenu** (`dropdown-menu.tsx`, 423 lines) | Radix primitives · default `align="start"` · `Item` accepts `variant="destructive"` + `shortcut` · ships `Shortcut`/`useShortcut` for global key binding | Library: `/library/dropdown-menu`. `shortcut` prop is the visual hint only — pair with sibling `<Shortcut keys onInvoke/>` to actually bind, because items unmount when the menu closes. |
| **Tooltip** (`tooltip.tsx`, 59 lines) | Radix Tooltip · `TooltipProvider delayDuration={0}` default · `TooltipContent` has `has-data-[slot=kbd]:pe-1.5` for Kbd reflow | Provider must wrap app root. No built-in `side` default. |
| **Tip** (`tip.tsx`, 21 lines) | Thin wrapper: `Tooltip → TooltipTrigger asChild → TooltipContent`. Adds `flex flex-wrap items-center gap-1.5` for inline Kbd | Pure shorthand. Whenever trigger is one element and content is a plain label (with or without Kbd), `<Tip label="…">` is 2 lines instead of 6. |

## Adoption snapshot

| Component | PCE admin | exam-mgmt admin | Discipline grade |
|---|---|---|---|
| Button (DS) | **101** | **275** | **used well** — exam-mgmt skews ghost (146) for icon row actions; PCE skews outline (45) for primary-on-card. Zero raw `<button>` outside DataTable internals. |
| DropdownMenu | 15 files (11× row-action + 4× chrome) | 8 files (1× row-action + 7× toolbar/chrome) | PCE: **used well** (single canonical shape). exam-mgmt: **shallow** (only one true row-action; rest is filter toolbars). |
| Tooltip | 11 files | 18 files | **used well** — both apps wrap `TooltipProvider` at `(app)/layout.tsx`. |
| Tip | 1 file (PCE DataTable + Pagination, 9 uses) | **0** | **has-gap in exam-mgmt** — 36 single-label Tooltips eligible for `<Tip>` collapse. |

## Per-component findings

### Button

- **Total:** 376 DS Buttons (101 PCE + 275 exam-mgmt).
- **Variants (PCE):** outline 45 · default 38 · ghost 18 · destructive 15 · secondary 7 · link 1 — healthy spread.
- **Variants (exam-mgmt):** ghost 146 (53%) · outline 81 · secondary 56 · default 21 · destructive 9 — ghost-heavy because QB is a manipulator app (icon-buttons in row strips). Default-CTA only ~7%; reflects domain, not monotony.
- **Raw `<button>`:** exam-mgmt **0** (clean). PCE **21**, all inside `components/data-table/{index,pagination}.tsx` — Student-DS DataTable infrastructure (sort headers, search input, column chevrons). Documented hand-roll, **not a violation**.
- **Size:** PCE — `sm` 35 · `icon-sm` 14 · `lg` 2 · `icon-xs` 1 (strict). exam-mgmt — `sm` 172 · `icon-sm` 35 · `icon-xs` 34 · `xs` 12 · `lg` 4 · `default` 4 (six sizes, no rule). The four `lg` and four `default` look accidental.
- **Reference:** `apps/pce/admin/app/(app)/admin/faculty/page.tsx:174-181` — `ghost icon-sm` + `aria-label` + `stopPropagation`. Identical across 11 PCE entity pages.
- **Recommended next 1 fix:** Write `docs/patterns/admin/button-density.md` — `sm` toolbars, `icon-sm/icon-xs` row strips, `default` modal CTAs, `lg` empty-state primary. Catches the 8 exam-mgmt outliers.

### DropdownMenu

- **Row-action pattern (PCE): consistent across 11/11 entity pages** (faculty:172, offerings:418, terms:271, accommodations:342, permissions:202, students:408, courses:297, competencies:264, content-areas:243, standards:226, surveys:229, templates:175). Identical shape:
  ```
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Actions for {entity}"
              onClick={(e) => e.stopPropagation()}>
        <i className="fa-regular fa-ellipsis" aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
  ```
  `align="end"` ✓ on all 11. `stopPropagation` on trigger AND content ✓ on all 11. **Codify in `docs/patterns/admin/row-actions.md`.**
- **exam-mgmt:** 1 of 13 `DropdownMenuContent` blocks is a true row-action (`qb-table.tsx:3091`). `align="end"` ✓ but **lacks** trigger-side stopPropagation — undocumented intent (QB rows treat click as selection).
- **align (exam-mgmt):** 8× `start`, 3× `end`, 1× `center` (`qb-table.tsx:3265` table-options gear — should be `end`).
- **Custom Popover that should be DropdownMenu:** **`apps/exam-management/admin/app/(app)/question-bank/qb-header.tsx:112-142`** — breadcrumb-overflow `…` menu. Popover with a list of `<Button variant="ghost" size="sm">` rows representing parent folders to navigate to. Semantically a navigation menu; Buttons-as-menu-items lose `role="menuitem"`, arrow-key nav, `aria-haspopup`. **Migrate to DropdownMenu.** All other Popovers (pce-modals share-form, qb-sidebar folder-diff hover, qb-table version-history / blooms / search-facet, qb-title collaborator hover-card) are content panels or forms — **leave as Popover.** ✓
- **Recommended next 1 fix:** Migrate `qb-header.tsx:112` to DropdownMenu (~15 lines); write `docs/patterns/admin/row-actions.md` from the PCE reference.

### Tooltip

- **TooltipProvider at app root:** **Yes, both apps** (exam-mgmt `layout.tsx:21-29`, PCE `layout.tsx:10-17`).
- **Redundant inner providers:** 3 nested `TooltipProvider`s in PCE DataTable (`components/data-table/index.tsx:548, :573`; `components/data-table/pagination.tsx:104`). Pass no overrides — pure boilerplate. **Drop.**
- **Side prop:** Mostly default. `side="top"` consistent in pagination (PCE + qb-table:3174/3182/3191/3199). `side="bottom"` in PCE search/filter hints (`:558`, `:613`). No inconsistency.
- **Usage that should be `<Tip>`:** 36 single-label `<TooltipContent>label</TooltipContent>` blocks in exam-mgmt — all rewritable as 1-line `<Tip>`.
- **Recommended next 1 fix:** Drop 3 redundant inner TooltipProviders in PCE DataTable. Zero risk.

### Tip

- **Adoption:** PCE 9 uses (all in DataTable + Pagination). exam-mgmt **0**.
- **PCE exemplars:** `data-table/pagination.tsx:106, 117, 131, 142` (pagination arrows); `data-table/index.tsx:852, 866, 883, 1236` (column-sort, column-label, column-options, clear-selection).
- **Highest-value migration clusters (exam-mgmt):**
  - `qb-table.tsx:3174, 3182, 3191, 3199` — pagination arrows. Identical to PCE's migrated pattern. ~25 lines saved.
  - `qb-table.tsx:2498, 2525, 2541, 2558, 3089` — 5 toolbar icon buttons (Search / Bookmarked / My questions / Filters / More options).
  - `question-editor/question-editor.tsx:198, 465` — 2 sites.
  - `qb-table.tsx:2926` — uses `className="max-w-xs"`; Tip's current API has no className passthrough → needs DS-level Tip enhancement first.
- **Tooltip + Kbd combo (Tip's namesake case):** `apps/pce/admin/components/data-table/index.tsx:560-563` — `KbdGroup` with `⌘K` inside a raw Tooltip, not Tip. Tip is literally built for this. **Migrate.**
- **Recommended next 1 fix:** Migrate qb-table pagination Tooltips (3174/3182/3191/3199) to `<Tip>` as proof-of-pattern, sweep remaining 32 in follow-on.

## Combined: 3 highest-leverage actions

1. **Write `docs/patterns/admin/row-actions.md`** from the PCE 11-page canonical shape (DropdownMenu + ghost icon-sm Button + `align="end"` + `stopPropagation` on trigger and content). Zero migrations today; every new admin entity ships row actions for free.
2. **Migrate `qb-header.tsx:112` breadcrumb-overflow Popover → DropdownMenu** (~15 lines). Restores `role="menuitem"`, arrow-key nav, `aria-haspopup="menu"`. Only true Popover-misuse in either codebase.
3. **Convert exam-mgmt qb-table pagination Tooltips (4 sites) to `<Tip>`** as proof-of-pattern, then sweep 32 more. ~150 lines of boilerplate eliminated; parity with PCE DataTable.

## What audit can't see

- **Whether Tip should accept `className`** — 1 of 36 exam-mgmt candidates (`qb-table.tsx:2926`) uses `max-w-xs`; needs a DS-level Tip API enhancement.
- **Whether the QB row-actions trigger at `qb-table.tsx:3091`** intentionally omits trigger-side `stopPropagation` (QB row click = selection, not navigation) or is a copy-paste miss vs. PCE. Needs Himanshu's call.
- **Variant-vs-CTA mismatch** — regex verifies `variant="default"` is present but not whether a labeled "Delete" wears the right coat. A misvariant would slip through.
- **size="lg" / size="default" outliers in exam-mgmt (8 total)** — modal emphasis or accidental? Per-case judgment; the proposed `button-density.md` rule would settle it.
- **Button-as-Link semantics** — DS Button supports `asChild` wrapping `<Link>`. Audit can't tell whether row-card click should be Link-wrapped Buttons (single hover) vs. Card-with-inner-Buttons (split hover).
