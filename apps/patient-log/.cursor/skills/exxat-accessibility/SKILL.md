---
name: exxat-accessibility
description: WCAG 2.x / ARIA checklist for Exxat DS — tablists, touch targets, contrast, and audit follow-ups. Use when fixing axe/Deque issues, building nav or tab UIs, or reviewing accessibility.
user-invocable: true
---

# Exxat DS — accessibility checklist

Standard target: **WCAG 2.1 Level AA** (and 2.2 where noted).

**Canonical for agents (MUST/MUST NOT, checklist):** `apps/web/AGENTS.md` **§8** in the repo (same content summarized there; this skill stays the detailed checklist + product tokens).

## ARIA roles & structure (SC 1.3.1)

- **`role="tablist"`** may only contain **`role="tab"`** (or elements that resolve to tabs). Do **not** place `role="button"`, menus (`aria-haspopup`), or ad-hoc controls **inside** the same `tablist` container.
- **Composite view switchers** (tabs + per-tab settings menu + remove control): use **`role="toolbar"`** with **`aria-label`**, and **`aria-pressed`** on view toggle buttons instead of misusing `tab`/`tablist`.
- Prefer **`<button type="button">`** over **`span role="button"`** for clickable icons (keyboard + AT).

## Touch targets (WCAG 2.2 AA — 2.5.8 Target Size Minimum)

- Interactive controls (including icon-only chevrons and close icons) should be at least **24×24 CSS pixels**, or have **24px** spacing so their **24px** hit circles do not overlap adjacent targets.
- Use **`min-h-6 min-w-6`** (or `size-6`) with centered icons; avoid `size-4` (16px) for sole click targets.

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

Reference pattern: `components/new-placement-form.tsx` (Next = `<Kbd variant="bare">{mod}⏎</Kbd>`, Back = `<Kbd variant="bare">{mod}{alt}←</Kbd>`). See `.cursor/rules/exxat-kbd-shortcuts.mdc` for the full shortcut table.

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

## High-Contrast modes

There are **two** HC paths in this app. Fix both or the bar will still look broken in one of them:

1. **App HC theme — `html[data-contrast="high"]`** (user toggle in Settings). Use the **`hc:`** Tailwind variant defined in `globals.css` (line 22: `@custom-variant hc (&:is([data-contrast="high"] *));`). This is what the user sees when they switch to High Contrast in-app.
2. **OS / browser forced-colors** — Windows High Contrast, some Linux DEs, `prefers-contrast: more`. Use `forced-colors:` variants mapping to system colors (`Canvas`, `CanvasText`, `Highlight`, `HighlightText`, `GrayText`).

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
| Critical | Certain ARIA roles must contain particular children | 1.3.1 |
| Serious | Touch targets must be ≥24px or spaced accordingly | 2.5.8 |

When fixing, re-run **axe** or your preferred checker on the **Placements** page after changing the Views toolbar.

## Charts (keyboard exploration)

- **Chart region:** Product charts that support arrow-key exploration use **`ChartFigure`** (`role="application"`, focus ring on the chart container, click-or-Tab to focus per `charts-overview`).
- **Selected datum:** Prefer **visible** feedback that matches the **`/dashboard` gallery** — Recharts **`activeBar`** + **`activeIndex`** for bars, **`activeShape`** + **`activeIndex`** for pies — via **`@/lib/chart-keyboard-selection`**. Avoid relying on **opacity-only** dimming as the only “selected” indicator; pair with ring/stroke so focus is perceivable (WCAG **2.4.7 Focus Visible** where applicable).
- **Tables under charts:** **`ChartDataTable`** (`sr-only`) provides an equivalent programmatic structure for screen-reader users.
