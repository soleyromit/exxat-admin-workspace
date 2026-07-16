---
description: Exxat DS — WCAG 2.1 AA, ARIA tablists, 24px targets, contrast; see AGENTS.md §8 and exxat-accessibility skill
activation: model_decision
---

<!-- Synced from .agents/rules/exxat-accessibility.mdc - run npx exxat-ui sync-extras after Cursor rule edits -->

# Exxat DS — accessibility (binding summary)

**Full checklist (ARIA, touch targets, color, sidebar badges, audit follow-ups):** repo **`.agents/skills/exxat-accessibility/SKILL.md`**.

**Product rules in prose + checklist:** **`./AGENTS.md` §8**.

## Non‑negotiables

1. **Target:** **WCAG 2.1 Level AA** (2.2 where noted — e.g. target size).
2. **`role="tablist"`** — only **`role="tab"`** (or equivalent) as direct tab semantics. **MUST NOT** put `role="button"`, menus (`aria-haspopup`), or other controls **inside** the same `tablist` container.
3. **Composite view switchers** (tabs + per-tab menu + remove): use **`role="toolbar"`** + **`aria-label`**; **`aria-pressed`** on toggles — **MUST NOT** misuse `tab`/`tablist` for those controls.
4. **Touch targets (2.5.8):** interactive controls **≥ 24×24 CSS px** measured in the browser (DevTools), not only by Tailwind class intent. Prefer **`size-8`** (32px) for icon-only chevrons, tree expanders, and toolbar icon buttons in dense rails — **`size-6`** (`1.5rem`) can compute below 24px when root font size is scaled (~15px → 22.5px). **`min-h-6 min-w-6` alone does not fix** a fixed `size-6` width/height. Avoid **`size-4`** as the sole target.
5. **Contrast:** normal text **≥ 4.5:1**; UI components / focus where required **≥ 3:1**; muted text on tinted surfaces use tokens against the correct surface (e.g. sidebar), not only `--background`.
6. **Minimum text size:** visible product copy **≥ 12px** — use **`text-xs`** (`--text-xs` = 12px) or larger. **`text-2xs`** shares the same 12px floor with tighter line-height for count badges and "New" pills — **MUST NOT** use arbitrary `text-[10px]` / `text-[11px]` (see **`globals.css`**, **`./AGENTS.md` §8.3`). **Prose (body, descriptions, helper text) uses `text-sm` or larger** — do not default paragraphs to `text-xs` just because they are muted.
7. **Dialogs / sheets:** must expose a **Title** (`DialogTitle` / `SheetTitle`); use **`sr-only`** if visually hidden (shadcn pattern).
8. **Format hints are persistent, not placeholders (SC 3.3.2 Labels or Instructions, 1.3.1).** Any field that expects a specific format — **date, time, phone, currency, ID pattern, GPA scale, URL, hours, unit-bearing numbers** — MUST show the format as **persistent helper text** via **`FormDescription`** (or the field's description slot). Placeholders disappear on focus and are unreliable for AT, so **MUST NOT** be the sole carrier of the format. Example: GPA → "Out of 4.0"; Date → "MM/DD/YYYY"; Phone → "+1 (555) 555-0100"; Student ID → "STU-YYYY-####". Pair with `inputMode`, `pattern`, or a picker primitive (e.g. `DatePickerField`) where applicable; never rely on a free-text date input.
9. **Every icon that communicates information MUST have a text alternative** — not just icon-only buttons. Three cases (SC 1.1.1 Non-text Content, 3.3.2 Labels or Instructions, 2.4.6 Headings and Labels):

   - **A. Decorative icon next to text that already names it** (e.g. `<i class="fa-light fa-calendar-days" aria-hidden /> 12/14/2025 – 12/20/2025`) → icon MUST be **`aria-hidden`**; MUST NOT add `aria-label` (screen readers would announce the meaning twice). No tooltip needed.
   - **B. Informational icon standing alone** — a calendar glyph used to mean "date range", clock for "updated at", pin for "site", graduation cap for "student", trending arrow for direction, status dot, icon-only chart legend — MUST pair **`role="img"` + `aria-label`** (or `aria-labelledby` on a wrapping element) with a visible **`Tooltip`** so sighted users who don't recognise the glyph learn the meaning. The icon wrapper MUST be keyboard-focusable (`tabIndex={0}` on the `span[role="img"]`) so the tooltip opens on focus.
   - **C. Interactive icon-only button/link** (close `×`, chevron, overflow `⋯`, sort direction, filter chip dismiss, copy, Ask Leo toggle, row actions) → MUST pair **`aria-label`** on the `<button>` with a wrapping **`Tooltip`**. `aria-label` alone is NOT enough — sighted mouse users and keyboard users rely on the tooltip to discover what a bare icon does.

   In all three cases, the inner `<i>` / `<svg>` MUST be `aria-hidden`; the accessible name lives on the wrapping element. Tooltip text MUST match the accessible name. Narrow exception: a chevron inside a labelled composite (`Select`, `Combobox`) where the parent control already names the whole thing. See **§8.6 (Case A/B/C)** in `AGENTS.md` and the accessibility skill.
10. **Keyboard shortcut hints inside buttons** MUST use **`<Kbd variant="bare">`** (no background, no border, inherits `currentColor` at 70%). The default `tile` variant is reserved for **tooltips** and **menu `shortcut=` slots**. Glue multi-key chords into one bare kbd (e.g. `<Kbd variant="bare">⌘⌥K</Kbd>`), not one tile per key. Reference: `Next` / `Back` buttons in `new-library-item-form.tsx`; see `.agents/rules/exxat-kbd-shortcuts.md`.
11. **Reflow (SC 1.4.10):** at **320 CSS px** width and **~200% zoom**, content reflows without page-level horizontal scroll (except essential 2D regions: tables, chart canvases). Shell uses **`useSidebarReflowZoom()`** (`reflow-viewport.ts`) for flyout sidebar, compact rails, and disabled table stickies. Feature layouts **MUST** read this hook or equivalent — see skill **§ Reflow** and **`accessibility-ship-checklist.md` § Reflow**.
12. **Page title (SC 2.4.2):** **`SiteHeader`** / **`useDocumentTitle`** sets a unique `<title>` per route — not the static `index.html` title alone.
13. **Shell rail alignment:** **`SystemBannerSlot`** lives inside **`[data-app-shell-main]`** so the library secondary panel aligns with the fixed primary sidebar.
14. **Sidebar icon rail + `SidebarMenuButton asChild`:** When the primary sidebar is collapsed (icon rail), nav labels are CSS-hidden — every **`<Link>`** inside **`SidebarMenuButton asChild`** MUST expose a name via **`aria-label`** (or **`sr-only`** text). **MUST NOT** pass **`aria-label={undefined}`** on the child — Radix **`Slot`** merge lets explicit `undefined` **override** the button's collapsed tooltip label and fails axe **“Links must have discernible text”**. Use conditional spread: `{...(collapsed ? { "aria-label": title } : {})}`. Reference: **`components/sidebar/app-sidebar.tsx`** (`NavLinkItems`, `SidebarDrillInItems`, `SidebarNavSecondaryItems`).
15. **Vertical resize handles:** Mouse-drag column / panel edges use **`role="separator"`** + **`aria-orientation="vertical"`** and **MUST** include **`aria-valuemin`**, **`aria-valuemax`**, **`aria-valuenow`** (current width in px). Use **`verticalResizeSeparatorAria()`** from **`packages/ui/src/lib/edge-resize-handle.ts`** — wired in **`NestedSecondaryPanelShell`**, **`DataTable`** column resize, **`SidebarDrillInResizeHandle`**.

After changing **views toolbar**, **sidebar nav**, **tree expanders**, or **resize handles**, re-run **axe** on **Library** (`/design-os/library/all` or `/prism/library/all`) and **Placements**.

For **Lighthouse accessibility 100**, dispatch **`.agents/skills/exxat-accessibility/lighthouse-gate/SKILL.md`** or run **`pnpm a11y:lighthouse`**.

## Ship gate (every new build)

Before merge, complete **`docs/exxat-ds/accessibility-ship-checklist.md`** for touched surface(s). Agents **MUST** verify: one H1 in `<main>`; icon-only Case C; persistent format hints; theme matrix (light / dark / HC); **reflow at 320px + 200% zoom** when touching layout/nav; axe zero WCAG 2.x AA on `<main>`.

**Charts:** Keyboard exploration uses **`ChartFigure`**; selected data points should have **visible** focus feedback — see skill **§ Charts (keyboard exploration)** and **`AGENTS.md` §4.3** (`chart-keyboard-selection`).

## See also

- **`./AGENTS.md`** §8 — accessibility in project context.
- **`docs/accessibility-ship-checklist.md`** / **`docs/exxat-ds/accessibility-ship-checklist.md`** — pre-merge ship gate.
- **`.agents/rules/exxat-kbd-shortcuts.md`** — shortcuts paired with `Kbd` hints.
- **`.agents/rules/exxat-horizontal-scroll.md`** — tab/breadcrumb overflow (1.4.10 allowed 2D scroll regions).
- **`.agents/rules/exxat-dashboard-view-charts.md`** — Data view chart keyboard parity.
