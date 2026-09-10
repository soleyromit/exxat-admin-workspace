---
name: exxat-accessibility
description: WCAG 2.x / ARIA checklist for Exxat DS — tablists, touch targets, contrast, high-contrast modes (data-contrast high/windows, forced-colors, non-text contrast SC 1.4.11), audit follow-ups, axe gate + Lighthouse verification. Use when fixing axe/Deque issues, building nav or tab UIs, working on high contrast or forced-colors, reviewing accessibility, or when the user wants Lighthouse a11y score 100.
user-invocable: true
---

# Exxat DS — accessibility checklist

Standard target: **WCAG 2.1 Level AA** (and 2.2 where noted).

**Canonical for agents (MUST/MUST NOT, checklist):** `./AGENTS.md` **§8** in the repo (same content summarized there; this skill stays the detailed checklist + product tokens).

## Accessibility gate (axe + HC probe + Lighthouse)

When the user asks for **a11y verification**, **axe scan**, **Lighthouse accessibility 100**, or post-fix confirmation:

1. **Ensure dev server** — `pnpm dev:web` (`http://127.0.0.1:4000`).
2. **Run axe** (primary gate — fast, same engine as Lighthouse a11y):

   ```bash
   pnpm a11y:setup              # once per machine
   pnpm a11y:axe                # smoke (~30s)
   pnpm a11y:axe /design-os/library   # routes you changed
   pnpm a11y:axe:all --variants ship  # pre-ship full matrix
   ```

3. **Read the report** — each run writes:
   - `.axe-reports/<run>/axe-a11y-summary.json` (machine-readable)
   - `.axe-reports/<run>/axe-a11y-report.md` (human-readable)
   - Regenerate from an older run: `pnpm a11y:axe:report --dir .axe-reports/<run>`
   - List runs: `pnpm a11y:axe:report --list`

4. **Run the high-contrast pair** whenever the change touches chrome, tokens, state styling, icons, or charts:

   ```bash
   pnpm a11y:axe:contrast       # axe × 4 HC variants
   pnpm a11y:hc                 # non-text contrast (SC 1.4.11) × same 4
   ```

   axe has **no** non-text contrast check, so a clean axe run says nothing about invisible icons, flat chart series, or meter bars that match their track. See **§ High-Contrast modes**.

5. **Fix loop** — follow `.agents/skills/exxat-accessibility/lighthouse-gate/SKILL.md` (fix playbook). Rebuild UI if `packages/ui/**` changed. Re-run axe on the same paths until `allPassed: true`.

6. **Lighthouse spot-check** (slow, optional score-100 confirmation): `pnpm a11y:lighthouse`

**Commands:**

```bash
pnpm a11y:setup              # once per machine
pnpm a11y:axe                # smoke, desktop-light (~30s)
pnpm a11y:axe:matrix         # smoke × 6 ship variants (theme + reflow-320, ~3–5 min)
pnpm a11y:axe:themes         # smoke × 4 theme modes
pnpm a11y:axe:contrast       # smoke × 4 HC variants (hc-light/dark, hc-app-light/dark)
pnpm a11y:hc                 # non-text contrast probe, HC only (~3 min)
pnpm a11y:axe /design-os/design-system/wizard   # single route
pnpm a11y:axe --variants theme /settings/profile
pnpm a11y:axe:all            # full 163 routes, desktop-light (~4 min)
pnpm a11y:axe:all --variants ship   # full × 6 variants (~25 min, pre-release)
pnpm a11y:axe:report         # markdown report for latest run
pnpm a11y:axe:report --list  # list saved runs
node scripts/axe-a11y-gate.mjs --list-variants
pnpm a11y:lighthouse         # slow spot-check — Lighthouse score 100
```

Reports: **`.axe-reports/`** (`axe-a11y-summary.json` + `axe-a11y-report.md`) · **`.lighthouse-reports/`** (Lighthouse, gitignored).

---

## ARIA roles & structure (SC 1.3.1)

- **`role="tablist"`** may only contain **`role="tab"`** (or elements that resolve to tabs). Do **not** place `role="button"`, menus (`aria-haspopup`), or ad-hoc controls **inside** the same `tablist` container.
- **Composite view switchers** (tabs + per-tab settings menu + remove control): use **`role="toolbar"`** with **`aria-label`**, and **`aria-pressed`** on view toggle buttons instead of misusing `tab`/`tablist`.
- Prefer **`<button type="button">`** over **`span role="button"`** for clickable icons (keyboard + AT).

## Touch targets (WCAG 2.2 AA — 2.5.8 Target Size Minimum)

- Interactive controls (including icon-only chevrons and close icons) should be at least **24×24 CSS pixels** in **computed** layout (verify in DevTools — do not assume Tailwind class names alone), or have **24px** spacing so their **24px** hit circles do not overlap adjacent targets.
- **Prefer `size-8`** for tree expand/collapse chevrons, folder rail icon buttons, and list-page view-settings triggers. **`size-6`** (`1.5rem`) often computes to **~22.5px** when root font size is ~15px (browser zoom / user prefs) — axe still flags it.
- **`min-h-[24px] min-w-[24px]` does not help** when `size-6` also sets width/height — drop `size-6` or bump to **`size-8`**.
- Avoid `size-4` (16px) for sole click targets.

Reference implementations: **`hub-tree-panel-view.tsx`** (expand chevron **`size-8`**), **`library-folder-tree-branch.tsx`**, **`list-page.tsx`** view settings (**`size-8`**).

## Sidebar icon rail — link names (SC 2.4.4, 4.1.2)

When **`SidebarProvider`** state is **`collapsed`** (desktop icon rail), **`SidebarMenuButton`** hides all children except the first icon via **`group-data-[collapsible=icon]:[&>*:not(:first-child)]:hidden`**. Screen readers then see an icon-only link unless you add a programmatic name.

**Pattern:**

```tsx
const iconRailCollapsed = state === "collapsed" && !isMobile

<SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
  <Link
    to={item.url}
    aria-current={isActive ? "page" : undefined}
    {...(iconRailCollapsed ? { "aria-label": item.title } : {})}
  >
    <span aria-hidden="true">{item.icon}</span>
    <SidebarNavLabel>{item.title}</SidebarNavLabel>
  </Link>
</SidebarMenuButton>
```

**Anti-pattern (breaks axe):**

```tsx
// ❌ explicit undefined on Link overrides SidebarMenuButton's collapsed tooltip aria-label
<Link aria-label={iconRailCollapsed ? item.title : undefined} … />
```

**MUST** use conditional spread so the attribute is **omitted** when expanded. **`SidebarMenuButton`** also sets `aria-label` from `tooltip` when collapsed — child links must not clobber it with `undefined`.

Apply in: primary nav (`NavLinkItems`), drill-in lists (`SidebarDrillInItems`), utilities / Ask Leo rows (`SidebarNavSecondaryItems`).

## Vertical resize handles (SC 4.1.2)

Drag handles on **`NestedSecondaryPanelShell`**, **`DataTable`** columns, and **`SidebarDrillInResizeHandle`** use **`role="separator"`** with **`aria-orientation="vertical"`**. axe requires **`aria-valuemin`**, **`aria-valuemax`**, and **`aria-valuenow`** (current width in px).

**Use the shared helper** — do not hand-roll incomplete separator ARIA:

```tsx
import { verticalResizeSeparatorAria } from "@exxatdesignux/ui/lib/edge-resize-handle"

<div
  {...verticalResizeSeparatorAria({
    label: "Resize secondary panel",
    valueNow: panelWidthPx,
    valueMin: 200,
    valueMax: 480,
  })}
  onMouseDown={startResize}
  className={EDGE_RESIZE_HANDLE_CLASS}
/>
```

Column resize: `valueMin` = column `minWidth ?? 60`; `valueNow` = live `colWidths[key]`.

## Icons that communicate information — always have a text alternative (SC 1.1.1, 3.3.2, 2.4.6)

This rule covers **every icon that carries meaning**, not only icon-only buttons. FA glyphs, inline SVGs, avatar placeholders, trend arrows, status dots, chart-legend squares, calendar/clock/pin icons in cells — if the icon **tells the user something**, that something MUST be reachable by screen readers AND discoverable to sighted users who don't recognise the glyph.

There are three cases. Pick the one that matches the icon's context:

### Case A — Decorative icon next to text that already names it

When the icon sits adjacent to a visible text label that already carries the meaning, the icon is **decorative**. It MUST be `aria-hidden` and MUST NOT carry `aria-label` (screen readers would announce the meaning twice).

```tsx
<span className="flex items-center gap-1.5">
  <i className="fa-light fa-calendar-days" aria-hidden />
  <span>12/14/2025 – 12/20/2025</span>
</span>

<Button>
  <i className="fa-light fa-plus" aria-hidden />
  <span>New placement</span>
</Button>
```

No tooltip needed — the text is the alt. This is the default in table cells, buttons with text labels, breadcrumbs, badges, menu items.

### Case B — Informational icon standing alone (no adjacent label)

When the icon is the **only visible carrier** of the information — e.g.:

- `fa-calendar-days` in a compact table column header meaning "date range"
- `fa-clock` meaning "updated at" or "time remaining"
- `fa-location-dot` meaning "site" / "location"
- `fa-graduation-cap` meaning "student"
- trending arrow in a KPI card (↑ / ↓)
- status dot (a coloured circle meaning "on track / at risk / blocked")
- icon-only legend key on a chart
- `fa-paperclip` meaning "has attachments"
- `fa-lock` meaning "restricted"

…the icon MUST:

1. Announce itself to AT via **`role="img"` + `aria-label`** on a wrapping element (span/div), OR inherit the name from a labelled ancestor via `aria-labelledby`.
2. Expose a visible **`Tooltip`** so sighted mouse/keyboard users who don't recognise the glyph learn the meaning.

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    {/* Non-interactive: wrap in a span with role="img".
        tabIndex={0} so the tooltip opens on keyboard focus, not just hover. */}
    <span
      role="img"
      aria-label="Placement date range"
      tabIndex={0}
      className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <i className="fa-light fa-calendar-days" aria-hidden />
    </span>
  </TooltipTrigger>
  <TooltipContent side="top">Placement date range</TooltipContent>
</Tooltip>
```

Rules:
1. `TooltipContent` text MUST match the `aria-label`.
2. The inner `<i>` / `<svg>` is always `aria-hidden`; the accessible name lives on the wrapper.
3. If a visible text label could fit, **prefer Case A** (add the label) over tooltip-only.
4. Target/focus size still **≥ 24×24 CSS px** so keyboard users can focus the icon reliably.
5. Status dots MUST additionally carry a **text or shape cue** (not colour alone — SC 1.4.1). E.g. pair a coloured dot with a status label nearby, or differentiate by icon shape (`circle-check` vs `triangle-exclamation` vs `circle-xmark`).

### Case C — Interactive icon-only button / link

Any button or link whose visible content is a **single icon** — close (`×`), chevron, overflow (`⋯`), sort direction, filter chip dismiss, copy-to-clipboard, Ask Leo toggle, expand/collapse, row actions — MUST carry BOTH:

1. **`aria-label`** on the `<button>` / `<a>` (programmatic name for AT and axe).
2. A wrapping **`Tooltip`** whose content repeats the same name (plus a `Kbd` when a shortcut exists).

```tsx
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"

<Tooltip>
  <TooltipTrigger asChild>
    <button
      type="button"
      aria-label="Close insight"
      onClick={onClose}
      className="inline-flex size-7 min-h-7 min-w-7 items-center justify-center rounded-md …"
    >
      <i className="fa-solid fa-xmark" aria-hidden />
    </button>
  </TooltipTrigger>
  <TooltipContent side="top" className="flex items-center gap-1.5">
    <span>Close</span>
    <Kbd>Esc</Kbd>
  </TooltipContent>
</Tooltip>
```

Rules:
1. `TooltipContent` MUST match or extend the `aria-label`.
2. Inside the tooltip use the **default tile** `<Kbd>` (NOT `variant="bare"`).
3. The inner `<i>` / `<svg>` MUST have `aria-hidden`.
4. Click target **≥ 24×24 CSS px** (see Touch targets section).

### Narrow exceptions (all cases)

- A chevron inside a labelled composite (`Select`, `Combobox`, `Breadcrumb` separator) where the parent already names the whole control or the glyph is purely structural — mark it `aria-hidden`.
- Drag handles inside a `dnd-kit` listener that reference a labelled ancestor via `aria-describedby`.
- Decorative icons that purely decorate (e.g. the Leo star next to an already-named "Ask Leo" button) — `aria-hidden`, no tooltip.

### Decision tree

```
Icon appears somewhere →
  Is there adjacent visible text that already names the meaning?
    YES → Case A: aria-hidden, no tooltip. Done.
    NO  → Is the icon the visible content of a button/link?
            YES → Case C: aria-label on the control + Tooltip.
            NO  → Case B: span[role="img", aria-label, tabIndex=0] + Tooltip.
```

**When in doubt: add the accessible name + tooltip.** Silence is never correct for an icon that means something.

## Keyboard shortcuts inside buttons — `<Kbd variant="bare">` only

The `Kbd` primitive (`@/components/ui/kbd`) has two variants:

| Variant | Where it goes | Chrome |
|---------|---------------|--------|
| `tile` (default) | Inside `TooltipContent`, menu `shortcut=` slots, standalone surfaces | Background + border, fixed contrast |
| `bare` | Inline **inside** a `Button` (primary, secondary, wizard Next/Back/Submit) | No background, no border, inherits `currentColor` at 70 % opacity |

Inside a filled/solid button the `tile` variant looks like a pasted-on patch (wrong background color against the button fill). Always glue multi-key chords into **one** bare kbd:

```tsx
// ✅ correct — bare inside a button
<Button>
  <span>Ask Leo</span>
  <KbdGroup className="ml-1.5">
    <Kbd variant="bare">⌘⌥K</Kbd>
  </KbdGroup>
</Button>

// ❌ wrong — tile variant on a primary button
<Button>
  <span>Ask Leo</span>
  <KbdGroup className="ml-1.5">
    <Kbd>⌘</Kbd><Kbd>⌥</Kbd><Kbd>K</Kbd>
  </KbdGroup>
</Button>
```

Reference pattern: `components/new-placement-form.tsx` (Next = `<Kbd variant="bare">{mod}⏎</Kbd>`, Back = `<Kbd variant="bare">{mod}{alt}←</Kbd>`). See `.agents/rules/exxat-kbd-shortcuts.md` for the full shortcut table.

## Color (SC 1.4.3 / 1.4.11)

- **Normal text** (including small badge labels): **≥ 4.5:1** against its background.
- **UI components** (borders, focus rings): **≥ 3:1** where required by 1.4.11.
- **Muted text on tinted surfaces** (e.g. sidebar): use tokens mixed against **`--sidebar`**, not only against `--background` (see `--sidebar-section-label-foreground`).

## Sidebar badges (design tokens)

- **Count / numeric (sidebar):** **red** (`bg-red-600` + white). Placement toolbar counts use **status colors** (see below).
- **“New”:** use **brand** (`bg-brand` + `text-brand-foreground`).
- **“Beta”:** bright yellow fill + **dark** text (`bg-yellow-400` + `text-yellow-950`) for contrast.

## Placements toolbar count pills (`filterId`)

- **`all`:** slate  
- **`upcoming`:** amber  
- **`ongoing`:** blue  
- **`completed`:** emerald  
- Unknown `filterId` falls back to **all** (slate).

## Form fields — format hints MUST be persistent (SC 3.3.2, 1.3.1)

Placeholder text disappears on focus, is low-contrast by default, and is not reliably announced by assistive tech. For any field with a **required format**, render the format as **persistent helper text** tied to the input via `aria-describedby` — never rely on the placeholder alone.

**When this applies (non-exhaustive):**

- Dates, times, date ranges (even when a picker is present — the typed-format fallback must show the mask).
- Phone / fax, country-specific formats.
- Currency, GPA, percentages, hours, durations, unit-bearing numbers ("hrs/wk", "USD").
- IDs with a pattern (Student ID `STU-YYYY-####`, NPI, license #).
- Email / URL where a domain or protocol is required.
- Credit hours, scores, weights — anything whose scale is not obvious from the label.

**Pattern — use `FormDescription` from shadcn `Form`:**

```tsx
<FormField name="dob" render={({ field }) => (
  <FormItem>
    <FormLabel>Date of birth<span aria-hidden="true"> *</span></FormLabel>
    <FormControl>
      <Input {...field} inputMode="numeric" placeholder="MM/DD/YYYY" />
    </FormControl>
    {/* Persistent — announced via aria-describedby, survives focus */}
    <FormDescription>MM/DD/YYYY</FormDescription>
    <FormMessage />
  </FormItem>
)} />
```

**Rules:**

1. The format MUST appear as visible text **outside** the placeholder — `FormDescription`, a helper `<p>` with `id` referenced by `aria-describedby`, or an adjacent `<small>`.
2. Placeholder MAY mirror the format as extra affordance, but is never the sole source.
3. Prefer a **picker primitive** over free-text where one exists: `DatePickerField` for dates, `Select` for enumerated values, masked input for phone/IDs.
4. Required marker (`*`) is decorative — always pair with `aria-required="true"` on the input.
5. Error messages (`FormMessage`) replace description announcement while active; keep the description concise so the combined `aria-describedby` string stays readable.
6. Units belong in the description, not the label suffix, when they vary by context (e.g. "Out of 4.0" under GPA rather than in the label).

## Reflow (WCAG 2.1 / 2.2 — SC 1.4.10 Level AA)

Content **MUST** reflow at **320 CSS px** viewport width and at **~200% browser zoom** without loss of information or function, and without **page-level** horizontal scrolling — except where a **two-dimensional layout is essential** (data tables, wide chart canvases, maps).

### Shell signal (reuse — do not fork)

| API | Role |
|-----|------|
| `computeReflowViewport()` / `useSidebarReflowZoom()` | `packages/ui/src/lib/reflow-viewport.ts` |
| `isNavFlyout` on `SidebarProvider` | Primary sidebar → overlay flyout |
| `secondaryPanelCompact` | Nested scope rail collapses at reflow |
| `useCompactFilterToolbar()` | Hub filter toolbar compact mode |
| DataTable sticky columns | Disabled when reflow is active |

**Triggers:** viewport width **≤ 320px**, `visualViewport.scale` **≥ 1.99**, or short viewport height (≤ 640px / ≤ 420px).

### MUST (feature pages)

1. **Read the reflow hook** when pinning multi-column chrome (side rails, split panes, fixed toolbars). At reflow, collapse to a single column or flyout — same contract as the app shell.
2. **Allowed horizontal scroll** only **inside** the 2D region (`HubTable`, `HorizontalScrollRegion` for tabs/breadcrumbs, chart `ChartContainer`). **MUST NOT** force `min-width` on page shells that causes document-level `overflow-x`.
3. **Typography at reflow** — `--text-xs` / `--text-2xs` stay at **12px** floor under zoom (`globals.css`); body copy **`text-sm`**+.
4. **Verify manually** at **320px** and **200% zoom** before merge (see ship checklist § Reflow).

### MUST NOT

- Ship fixed dual-sidebar layouts that stay pinned at 320px without flyout/compact behavior.
- Hide primary actions or filters behind horizontal page scroll at reflow.
- Invent a parallel zoom/width hook — use **`useSidebarReflowZoom()`**.

**Reference:** `components/sidebar/app-sidebar.tsx` (`data-reflow-zoom`), `packages/ui/src/components/ui/sidebar.tsx`, **`.agents/rules/exxat-horizontal-scroll.md`**.

### Shell rail alignment (secondary panel)

The **system banner** (`SystemBannerSlot`) **MUST** render inside **`[data-app-shell-main]`** only — not above the full `data-app-shell-row`. A full-width banner pushes the library secondary rail down while the primary sidebar stays `fixed inset-y-0`, producing a visible top gap on `/prism/library/all`.

**Secondary panel height:** `NestedSecondaryPanelShell` uses **`self-stretch min-h-0`** in the shell row (not `100svh` + `sticky top-2`).

## High-Contrast modes

There are **three** HC paths. Fix all three or the surface will still look broken in one of them:

1. **App HC theme — `html[data-contrast="high"]`** (user toggle in Settings → Appearance). Greyscale token ramp over the app's own light/dark canvas.
2. **Windows HC palette — `html[data-contrast="windows"]`** — the app mirrors the OS palette from `packages/ui/src/theme/windows-contrast-theme.json` so it can be previewed and audited on any machine.
3. **OS / browser forced-colors** — real Windows High Contrast, some Linux DEs, `prefers-contrast: more`. Use `forced-colors:` variants mapping to system colors (`Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `GrayText`).

The **`hc:`** Tailwind variant covers paths 1 and 2 together — `@custom-variant hc (&:is([data-contrast="high"] *, [data-contrast="windows"] *))` in `globals.css`. `forced-colors:` covers path 3. A fix written only with `forced-colors:` will not show up in the in-app toggle, which is the path most users actually reach.

### Verify with both gates — axe alone is not enough

```bash
pnpm a11y:axe:contrast   # axe across hc-light, hc-dark, hc-app-light, hc-app-dark
pnpm a11y:hc             # non-text contrast probe (SC 1.4.11) — same four variants
```

**axe only measures text contrast.** It has no check for SC 1.4.11 Non-text Contrast, so an invisible icon, a flat chart series, an unfilled progress arc, and a meter bar the same colour as its track all pass axe cleanly. `scripts/hc-nontext-contrast.mjs` walks SVG `fill` / `stroke`, Font Awesome glyphs, and childless elements that are drawn purely by a background colour, measuring each against the surface actually behind it. Treat a green axe run on HC as **half** the evidence.

Two exemptions the probe honours, both of which you must opt into deliberately:

- **Logotypes** are exempt from 1.4.11. The probe skips `[data-product-logo]`, `[data-product-logo-base]`, `[data-product-mark]`, `[data-product-logo-mark]`. A product's **app mark** is not a logotype: `[data-product-app-mark]` (`components/product-app-mark.tsx`) is a meaningful graphic and is measured against the 3:1 floor like any other glyph.
- **Purely decorative glyphs** (an oversized illustration behind card copy that carries no meaning) need **`data-a11y-decorative`** on the element. Do not reach for this to silence a real failure — if removing the glyph would cost the user information, it is not decorative.

If the probe reports `navigation timed out` on many routes, check for **duplicate dev servers** (`lsof -nP -iTCP -sTCP:LISTEN | grep 400`) before believing the run. Starved routes are skipped, not failed, so a stale second server produces a run that looks clean because most of it never loaded.

### Selected state stays filled — never let it degrade to an outline

The single most common HC regression: a blanket rule strips a brand or palette background back to the canvas, and a **selected** tab, chip, segment, or nav row loses the fill that was its only state signal. The row then reads as five identical outlines and the user cannot tell what is active.

**MUST:** a selected surface keeps a fill in HC. Swap the hue, not the fill — `var(--accent)` background with `var(--accent-foreground)` ink, plus a `var(--foreground)` rim for edge definition. Both halves of that pair must be decided by the **same** rule; setting the background in one place and the ink in another is how selected controls end up with near-black text on a near-black fill.

**Selection is not signalled by `data-state` alone.** Any stripping rule must exempt, and any fill rule must cover, all of these: `[data-state="on"|"checked"|"active"|"selected"]`, `[data-active="true"]`, `[data-selected]`, `[aria-checked="true"]`, `[aria-pressed="true"]`, `[aria-selected="true"]`, `[aria-current]:not([aria-current="false"])`. A filter chip built on `role="radio"` uses `aria-checked` and nothing else.

### Children of a filled surface: badges invert, structure steps aside

Ink on a selected surface cascades to descendants, but a child that paints **its own** background is not sitting on the accent, so accent ink would be measured against the wrong colour. Split the two cases:

- **Badges and count pills** (`[data-slot="badge"]`, `[data-slot="sidebar-menu-badge"]`, rounded-full counts) **invert** — `background-color: var(--accent-foreground)` with `color: var(--accent)`. This is the treatment the active sidebar badge already uses.
- **Structural wrappers** that merely re-declare a background (the segmented control wraps its button in a shell and both declare a fill) go **`background-color: transparent`** and take the accent ink. Inverting a wrapper paints it the same colour as the icon inside it.

### Writing blanket HC rules without collateral damage

- Put stripping guards in **`:where()`** so they stay at zero specificity and still lose to deliberate component patterns.
- **`:empty` matches `<input>`.** A rule aimed at childless meter bars will repaint every text field, because inputs are childless too and their class lists mention `bg-muted` for the disabled state. Scope such rules to `:is(div, span, i, b, em)`.
- Text fields must pin their fill to **`var(--input-background)`**, not `var(--input)` — HC redefines `--input` as a *light* grey so the border can be seen, and reusing it as a fill puts near-white text on light grey.
- **Charts:** every series must clear 3:1 against the canvas, because a series is a graphical object under 1.4.11. A five-step greyscale ramp cannot spend its bottom half on light-grey-on-white; stop the ramp around `L 0.60` and take smaller steps. Scope `--brand-color` to `[data-chart]` when remapping it so chart series adapt without flattening the brand hue everywhere else.

### Why tokens collapse in HC

In HC themes many surfaces resolve to near-identical values (e.g. `bg-muted` ≈ `bg-background` in HC dark, `bg-brand` gets desaturated). Any UI encoding state **only via fill/track color** (progress bars, quota gauges, chart ranges, meter pills, dashed reference lines, status pills) flattens into a single rectangle. The fix is to force distinct contrast in HC:

- **Track / container:** `hc:border hc:border-border hc:bg-background` + `forced-colors:border-[CanvasText] forced-colors:bg-[Canvas]`
- **Active fill / progress:** `hc:bg-foreground` + `forced-colors:bg-[Highlight]`
- **Dashed marker / divider:** `hc:border-foreground` + `forced-colors:border-[CanvasText]`
- **Pill on colored bg:** invert to `hc:bg-background hc:text-foreground hc:border hc:border-foreground` + `forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border-[CanvasText]`
- **Disabled state:** `forced-colors:text-[GrayText]`

Never rely on `box-shadow` alone for separation in HC — shadows are suppressed; pair with a border.

Windows HC mode (and the CSS `forced-colors: active` media query) strips every custom `background-color`, `border-color`, and `box-shadow` and remaps text/icons to a small palette of system colors. Progress bars, pills, chart legends, avg-markers, and any "color-only" indicator collapse into a single flat rectangle if you rely purely on tokens like `bg-brand` or `bg-muted`.

**Rule:** for every UI that encodes state **via fill / track color** (progress bars, quota gauges, chart ranges, meter pills, status pills, dashed reference lines):

1. Keep the default `bg-*` tokens for light/dark themes.
2. Add `forced-colors:` variants mapping to system colors:
   - **Track / container:** `forced-colors:bg-[Canvas] forced-colors:border forced-colors:border-[CanvasText]`
   - **Active fill / progress:** `forced-colors:bg-[Highlight]` (text on it → `forced-colors:text-[HighlightText]`)
   - **Dashed marker / divider:** `forced-colors:border-[CanvasText]`
   - **Tooltip / pill on colored bg:** `forced-colors:bg-[Canvas] forced-colors:text-[CanvasText] forced-colors:border forced-colors:border-[CanvasText]`
   - **Disabled state:** `forced-colors:text-[GrayText]`
3. Never rely on `box-shadow` alone for separation in HC — shadows are suppressed; pair with a border.

Reference fix: `components/dashboard-quota-progress-card.tsx` `StudentScoreProgressRow` — track → `Canvas`, fill → `Highlight`, avg-marker pill → `Canvas` + `CanvasText` border.

## Audit rules to track (examples)

| Severity | Rule | Criterion |
|----------|------|-----------|
| Critical | Required ARIA on `role="separator"` (vertical) — missing `aria-valuenow` | 4.1.2 |
| Serious | Links must have discernible text (icon rail / `aria-label={undefined}` on `Link`) | 2.4.4, 4.1.2 |
| Critical | Certain ARIA roles must contain particular children | 1.3.1 |
| Serious | Content reflow without two-dimensional page scroll | 1.4.10 |
| Serious | Touch targets must be ≥24px or spaced accordingly | 2.5.8 |

After changing **views toolbar**, **sidebar nav**, **tree expanders**, or **resize handles**, re-run **axe** on **Library** (`/design-os/library/all` or `/prism/library/all`).

For **Lighthouse accessibility 100** on a route, run **`pnpm a11y:lighthouse`** after axe passes. Fix playbook: **`.agents/skills/exxat-accessibility/lighthouse-gate/SKILL.md`**.

## Charts (keyboard exploration)

- **Chart region:** Product charts that support arrow-key exploration use **`ChartFigure`** (`role="application"`, focus ring on the chart container, click-or-Tab to focus per `charts-overview`).
- **Selected datum:** Prefer **visible** feedback that matches the **`/dashboard` gallery** — Recharts **`activeBar`** + **`activeIndex`** for bars, **`activeShape`** + **`activeIndex`** for pies — via **`@/lib/chart-keyboard-selection`**. Avoid relying on **opacity-only** dimming as the only “selected” indicator; pair with ring/stroke so focus is perceivable (WCAG **2.4.7 Focus Visible** where applicable).
- **Tables under charts:** **`ChartDataTable`** (`sr-only`) provides an equivalent programmatic structure for screen-reader users.

## Pre-ship gate (MUST before merge)

Complete **`docs/exxat-ds/accessibility-ship-checklist.md`** for every new or materially changed surface. Full WCAG 2.1 AA map: **`docs/exxat-ds/wcag-21-aa-matrix.md`**. Minimum:

1. One **`<h1>`** in `<main>` only — panels/popovers use **`h2`**.
2. **Case C** on all icon-only buttons — **`aria-label` + `Tip`**.
3. **Format hints** — persistent **`FormDescription`**, not placeholder-only.
4. **Four theme modes** — light, dark, **`data-contrast="high"`** light + dark when touching chrome/tokens/forms. Verify with **both** `pnpm a11y:axe:contrast` **and** `pnpm a11y:hc`; selected controls still read as filled, not outlined.
5. **Reflow (1.4.10)** — manual pass at **320px** width + **200% zoom** per checklist § Reflow when touching layout, shell, tables, or nav.
6. **Page title (2.4.2)** — `SiteHeader` / `useDocumentTitle` updates `<title>` per route.
7. **axe** on `<main>` — zero WCAG 2.x AA violations on the affected route.
8. **Icon rail** — collapse primary sidebar; every nav link has a discernible name (no `aria-label={undefined}` on `Link` children of `SidebarMenuButton asChild`).
9. **Resize handles** — secondary panel + table column drag edges expose `aria-valuemin` / `aria-valuemax` / `aria-valuenow` via `verticalResizeSeparatorAria()`.

Pair with **`AGENTS.md` §13** accessibility line and **`.agents/rules/exxat-accessibility.md`** ship gate.
