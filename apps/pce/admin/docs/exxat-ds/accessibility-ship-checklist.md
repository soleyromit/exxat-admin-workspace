# Accessibility ship checklist

Every new or materially changed surface **MUST pass this checklist** before merge. Target: **WCAG 2.1 Level AA** (2.2 where noted).

**Agent entry:** [`component-selection-guide.md`](./component-selection-guide.md) → job doc → this checklist at ship time. Not an always-on rule.

See **`AGENTS.md` §8**, **`.cursor/rules/exxat-accessibility.mdc`**, **`.cursor/skills/exxat-accessibility/SKILL.md`**, full criterion map **[`wcag-21-aa-matrix.md`](./wcag-21-aa-matrix.md)**.

## Before you ship (all surfaces)

- [ ] **One H1 per route** — page title in `<main>` only; side panels (Ask Leo, insight popovers) use **`h2`** or **`aria-level={2}`**, not a second `<h1>`.
- [ ] **Page `<title>` (SC 2.4.2)** — browser tab matches route via **`SiteHeader`** / **`useDocumentTitle`**; unique per view (not static “Exxat Design System” on every route).
- [ ] **Skip link** — shell exposes “Skip to main content”; focus order reaches `<main>` without traps.
- [ ] **Overlay titles** — every `Dialog`, `Sheet`, and blocking `AlertDialog` has a **`Title`** (visible or `sr-only`).
- [ ] **Typography** — no visible copy below **12px** (`text-xs` / `text-2xs` minimum); decorative-only icons may be smaller.
- [ ] **Touch targets** — icon-only controls **≥ 24×24 CSS px** in computed layout; prefer **`size-8`** for tree chevrons and rail icon buttons ( **`size-6` can compute ~22.5px** at scaled root font). View settings / toolbar icon triggers: **`size-8`** square.
- [ ] **Icons (Case A/B/C)** — decorative icons **`aria-hidden`**; informational standalone icons **`role="img"` + label + Tooltip**; icon-only buttons **`aria-label` + `Tip`/`Tooltip`** (see §8.6 in `AGENTS.md`).
- [ ] **Sidebar icon rail** — collapse primary nav; every **`SidebarMenuButton asChild` → `Link`** has a discernible name (`aria-label` when collapsed). **Never** `aria-label={undefined}` on the child (use conditional spread).
- [ ] **Resize handles** — secondary panel, drill-in panel, and table column drag edges use **`verticalResizeSeparatorAria()`** (`aria-valuemin` / `max` / `now`).
- [ ] **Format hints** — date, phone, ID, GPA, currency, etc. use persistent **`FormDescription`** / helper text — not placeholder-only.
- [ ] **Keyboard** — every mouse action has a keyboard path; focus ring visible; workflow buttons pair shortcuts per **`exxat-kbd-shortcuts.mdc`**.
- [ ] **Tab semantics** — view switchers use **`role="toolbar"`** + **`aria-pressed`**; never put menus inside **`role="tablist"`**.
- [ ] **Reflow (SC 1.4.10)** — at **320px** width and **200% zoom**, no loss of function; no page-level horizontal scroll except allowed 2D regions (see below).
- [ ] **Text resize (SC 1.4.4)** — browser **text-only zoom 200%** on changed routes; no clipped controls or lost function.
- [ ] **Text spacing (SC 1.4.12)** — with user spacing overrides (line-height 1.5×, letter/word spacing per spec), no overlap or hidden text on changed layouts.
- [ ] **`autoComplete` (SC 1.3.5)** — email, name, tel, address fields use valid **`autoComplete`** tokens (not `off` on real PII).
- [ ] **Character shortcuts (SC 2.1.4)** — no bare single-letter/arrow shortcuts app-wide; use modifiers (`⌘`, `Alt+←`) or scope to focused region.
- [ ] **Shell rail alignment** — with system banner enabled, banner left edge aligns with the **secondary panel**; primary sidebar top/bottom inset matches workspace chrome (`--app-shell-inset-y`); secondary + main share a top edge below the banner.
- [ ] **Font Awesome only** — no Lucide; run **`pnpm --filter @exxat-ds/reference-app fa:subset-audit`** when adding glyphs.

## Theme modes (required for product chrome)

Run manual or automated checks in **all four** combinations:

| Mode | How to set |
|------|------------|
| Light | default theme, contrast off |
| Dark | `.dark` on `<html>`, contrast off |
| HC light | Settings → High contrast, light theme |
| HC dark | Settings → High contrast, dark theme |

- [ ] **Contrast** — body text ≥ 4.5:1; controls/focus ≥ 3:1 on the surface they sit on (sidebar, card, sheet — not only page canvas).
- [ ] **Sidebar badges** — status/count badges align **far end** of the row (`ms-auto` on primary and child links); collapsed rail shows dot indicator only.

### High contrast (both gates, not one)

```bash
pnpm a11y:axe:contrast   # axe × hc-light, hc-dark, hc-app-light, hc-app-dark
pnpm a11y:hc             # non-text contrast (SC 1.4.11) × the same four
```

axe measures **text** contrast only. A surface can pass axe in all four HC variants and still ship an invisible icon, a chart series the colour of the canvas, or a meter bar matching its own track. Both commands must be green.

- [ ] **Three HC paths covered** — in-app **`data-contrast="high"`**, mirrored **`data-contrast="windows"`**, and OS **`forced-colors`**. `hc:` handles the first two, `forced-colors:` the third; a `forced-colors:`-only fix never reaches the in-app toggle.
- [ ] **Color-only state has a second cue** — progress, pills, and status encoded by colour also carry border, shape, or text.
- [ ] **Selected still reads as selected** — tabs, chips, segments, and nav rows keep a **fill** (`--accent` + `--accent-foreground`), never degrading to an outline that matches their unselected neighbours. Check controls that signal state with `aria-checked` / `aria-pressed` / `aria-current`, not just `data-state`.
- [ ] **Badges inside a filled surface invert** rather than inheriting ink they can't carry; structural wrappers that re-declare a background go transparent.
- [ ] **Text fields are readable** — field fill comes from `--input-background`, not `--input` (HC redefines `--input` as a light border grey).
- [ ] **Charts** — every series clears 3:1 against the canvas; axis ticks, grid lines, and radial tracks are visible.
- [ ] **Decorative-only glyphs** carry **`data-a11y-decorative`**; logotypes are exempt from 1.4.11 by selector. Neither is a way to silence a real failure.

## Reflow (SC 1.4.10 — all product chrome)

Manual pass at **320 CSS px** width **and** at **200% browser zoom** (1280px viewport zoomed, or DevTools device mode 320px):

- [ ] **Primary sidebar** — becomes overlay flyout (`useSidebarReflowZoom` / `isNavFlyout`); ⌘B toggles; no clipped nav labels.
- [ ] **Secondary panel** — compact rail or flyout; scope labels visible in flyout mode.
- [ ] **Main content** — hub title, primary CTA, and filters reachable without horizontal page scroll.
- [ ] **Typography** — copy stays **≥ 12px** (`text-xs` floor); body prose **`text-sm`**+.
- [ ] **Tables / wide charts** — horizontal scroll is **inside** the table/chart region only (allowed 2D exception); sticky columns disabled at reflow.
- [ ] **Tab bars / breadcrumbs** — use **`HorizontalScrollRegion`** with keyboard prev/next; not a full-page width overflow.

**Shell hook:** `packages/ui/src/lib/reflow-viewport.ts` · **`useSidebarReflowZoom()`**. Feature pages **MUST NOT** pin fixed multi-column chrome that blocks reflow without using this signal.

## Windows display scale + browser zoom (mid-scale)

**Windows Settings → Display → Scale (100% / 125% / 150%) is not browser zoom.** The OS shrinks CSS viewport width and raises DPR; `visualViewport.scale` stays ~1. Do **not** add OS-DPI layout modes or CSS counter-zoom.

When touching **shell chrome**, **identity menus**, or **page layout**, spot-check this matrix on a laptop-class width (or DevTools width ~1280 CSS px at 100%):

| Windows scale | Browser zoom | Expect |
|---------------|--------------|--------|
| 100% | 100% | Baseline dual-rail desktop |
| 125% | 100% | School/product menus stay `w-72`; long names wrap; no page-level H-scroll |
| 150% | 100% | Same as 125%; utility-bar product lockup stays within ~20rem; actions remain reachable |
| 100% | 150% | Layout tighter; labels wrap; no clipped primary CTAs |
| 100% | 200% | Full reflow path (flyout nav, compact utility More menu) — see § Reflow |

- [ ] **School / product switchers** use **`SHELL_IDENTITY_MENU_SURFACE_CLASS`** (fixed width + wrap) — not unbounded `!w-max`.
- [ ] **No** global `:root { font-size: 87.5% }` (compounds with Windows 150% — see `globals.css`).
- [ ] Charts remain sharp (Recharts SVG / `ChartContainer` ResponsiveContainer — no canvas DPR fork required).

## Hubs and data surfaces (add when applicable)

- [ ] **`ChartFigure`** + **`ChartDataTable`** on dashboard charts; keyboard selection via **`chart-keyboard-selection`**.
- [ ] **Properties sheet** — opening from column filter moves focus **into** the sheet without scrolling the hub behind it.
- [ ] **Empty / loading / error** — all three states implemented (P5).

## Automated pass

- [ ] **axe** (or equivalent) on the changed route’s `<main>` — **zero violations** for WCAG 2.x AA tags in **light** and **dark** at minimum.
- [ ] **`pnpm a11y:axe:contrast` + `pnpm a11y:hc`** — both green when the change touches chrome, tokens, state styling, icons, or charts.
- [ ] Re-run axe after changing **views toolbar**, **sidebar nav**, or **sheet/dialog** chrome.

**If many routes report `navigation timed out`,** check for duplicate dev servers (`lsof -nP -iTCP -sTCP:LISTEN | grep 400`) before trusting the run — starved routes are skipped, not failed, so the result looks clean because most of it never loaded.

## Reference routes for regression

| Surface | Route |
|---------|--------|
| Library + secondary rail | `/prism/library/all` or `/design-os/library/all` |
| List hub | `/prism/placements` (or nearest full hub) |
| Column catalog | `/exam/columns` or `/columns` |
| Settings + contrast | `/settings/profile` |
| Properties sheet | any hub → Table properties or column filter |

---

*Binding rules: `.cursor/rules/exxat-accessibility.mdc` · Handoff: cite this checklist in PR description when touching UI.*
