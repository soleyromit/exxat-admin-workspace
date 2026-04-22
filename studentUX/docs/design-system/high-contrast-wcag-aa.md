# High Contrast UI & WCAG AA Compliance

Research summary and implementation guide for WCAG 2.1/2.2 Level AA non-text contrast, focus visibility, and high-contrast mode.

**Strategy & UX patterns (hierarchy, gradients, charts, dark vs HC):** see **[High Contrast Style Guidelines](./high-contrast-style-guidelines.md)**.

---

## WCAG Requirements (Relevant to Our Styling)

### 1.4.11 Non-text Contrast (Level AA)

- **Requirement:** Visual information used to indicate component states and boundaries must have a **3:1 contrast ratio** against adjacent colors.
- **Applies to:** Input borders, button boundaries, checkbox outlines, focus indicators, tab borders.
- **Exempt:** Decorative borders (cards, dividers) do not need 3:1.
- **Source:** [WCAG 1.4.11](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)

### 2.4.11 Focus Appearance (Minimum) — WCAG 2.2 Level AA

- **Requirement:** Focus indicator must:
  - Enclose the component
  - Have **3:1 contrast** between focused and unfocused states
  - Have **3:1 contrast** against adjacent colors
- **Implication:** A light gray ring (`oklch(0.708 0 0)`) on white fails; use a darker ring.
- **Source:** [WCAG 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance-minimum.html)

### 1.4.1 Use of Color (Level A)

- **Requirement:** Links must be distinguishable without relying on color alone.
- **Best practice:** Underline links by default; color-only links fail for colorblind users.
- **Source:** [WCAG 1.4.1](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html)

### 2.5.5 Target Size (Level AAA, Level AA in 2.2)

- **Requirement:** Touch targets ≥ 44×44px.
- **Our approach:** `--control-height-touch: 44px`; checkbox glyph 16px but wrapper/label provides full hit area.

---

## Our High-Contrast Triggers

| Trigger | Purpose |
|---------|---------|
| `html[data-contrast="high"]` | Manual toggle (Profile → Dev → Contrast → High) |
| `@media (prefers-contrast: more)` | OS "Increase Contrast" (macOS, Windows) |
| `@media (forced-colors: active)` | Windows High Contrast Mode; browser overrides colors |

---

## How Our Styling Changes in High Contrast Mode

### Default (Normal) Mode

| Token | Value | Notes |
|-------|-------|-------|
| `--ring` | oklch(0.25 0 0) | Dark ring for 3:1+ contrast on light bg |
| `--control-border` | `--border-control-3` | Form field borders (3:1, ≈ #90929A). Input/Select use this. |
| Links | `text-decoration: underline` | Non-color cue for links |

### Manual High Contrast (`data-contrast="high"`)

| Token | Light | Dark |
|-------|-------|------|
| `--foreground` | oklch(0.08 0 0) | oklch(0.99 0 0) |
| `--muted-foreground` | oklch(0.2 0 0) | oklch(0.85 0 0) |
| `--border` | oklch(0.25 0 0) | oklch(0.6 0 0) |
| `--border-control` | oklch(0.2 0 0) | oklch(0.65 0 0) |
| `--ring` | oklch(0.08 0 0) | — |
| `--tabs-background` | Darker | Lighter |
| `--muted` | Darker | Lighter |
| `--input-background` | Adjusted | Adjusted |

### OS Increase Contrast (`prefers-contrast: more`)

Same token overrides as manual high contrast, except when `data-contrast="off"` explicitly opts out.

### Forced Colors (`forced-colors: active`)

- **Borders:** `CanvasText` (system color)
- **Focus:** `outline: 2px solid Highlight` (system highlight)
- **Backgrounds:** `Canvas`; `background-image` forced to `none`
- **Box-shadow:** Forced to `none` — use borders instead for affordances
- **Links:** `LinkText` for proper link styling

---

## Implementation Checklist

- [x] Stronger default focus ring (3:1+)
- [x] Form field borders use `--control-border` (3:1)
- [x] Links underlined by default
- [x] `forced-colors` focus uses `Highlight`
- [x] `forced-colors` expands to body, links, cards
- [x] High contrast mode adjusts tabs, muted, input-background
- [ ] Verify contrast ratios with a checker (e.g. WebAIM, APCA)
- [ ] Test with Windows HCM enabled
- [ ] Test with macOS "Increase contrast" enabled

---

## References

- [WCAG 2.2 Success Criteria](https://www.w3.org/WAI/WCAG22/quickref/)
- [MDN: forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)
- [Adrian Roselli: WHCM and System Colors](https://adrianroselli.com/2021/02/whcm-and-system-colors.html)
- [Windows: Styling for forced colors](https://blogs.windows.com/msedgedev/2020/09/17/styling-for-windows-high-contrast-with-new-standards-for-forced-colors/)
