---
name: exxat-accessibility
description: WCAG 2.x / ARIA checklist for Exxat DS — tablists, touch targets, contrast, and audit follow-ups. Use when fixing axe/Deque issues, building nav or tab UIs, or reviewing accessibility.
user-invocable: true
---

# Exxat DS — accessibility checklist

Standard target: **WCAG 2.1 Level AA** (and 2.2 where noted).

**Canonical for agents (MUST/MUST NOT, checklist):** `exxat-ds/AGENTS.md` **§8** in the repo (same content summarized there; this skill stays the detailed checklist + product tokens).

## ARIA roles & structure (SC 1.3.1)

- **`role="tablist"`** may only contain **`role="tab"`** (or elements that resolve to tabs). Do **not** place `role="button"`, menus (`aria-haspopup`), or ad-hoc controls **inside** the same `tablist` container.
- **Composite view switchers** (tabs + per-tab settings menu + remove control): use **`role="toolbar"`** with **`aria-label`**, and **`aria-pressed`** on view toggle buttons instead of misusing `tab`/`tablist`.
- Prefer **`<button type="button">`** over **`span role="button"`** for clickable icons (keyboard + AT).

## Touch targets (WCAG 2.2 AA — 2.5.8 Target Size Minimum)

- Interactive controls (including icon-only chevrons and close icons) should be at least **24×24 CSS pixels**, or have **24px** spacing so their **24px** hit circles do not overlap adjacent targets.
- Use **`min-h-6 min-w-6`** (or `size-6`) with centered icons; avoid `size-4` (16px) for sole click targets.

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
