# IvyPresto Headline Font Styles

Reference for all IvyPresto Headline (`ivypresto-headline`) styles in the Exxat One design system.

**Source:** `src/styles/globals.css` (lines 720–772)

---

## Font

| Property | Value |
|----------|-------|
| Font name | IvyPresto Headline |
| CSS font-family | `"ivypresto-headline"` |
| Provider | Adobe Fonts (Typekit) |
| Kit ID | `kmo8bbz` |
| Load URL | `https://use.typekit.net/kmo8bbz.css` |
| globals.css | `@import url("https://use.typekit.net/kmo8bbz.css");` |
| index.css | `@import url("https://use.typekit.net/kmo8bbz.css");` |
| index.html | `<link rel="stylesheet" href="https://use.typekit.net/kmo8bbz.css" />` |
| Usage | Display headings, page titles, hero headers. Body text uses Inter. |

---

## Token Values (from `:root`)

| Token | Value |
|-------|-------|
| `--foreground` | `oklch(0.145 0 0)` (light) / `oklch(0.985 0 0)` (dark) |
| `--font-weight-light` | 300 |
| `--font-weight-bold` | 700 |
| `--font-weight-extrabold` | 800 |

---

## Class Reference (with values)

### 1. `.font-display`

| Property | Value |
|----------|-------|
| `font-family` | `"ivypresto-headline"` |
| `font-weight` | `300` |

**Modifiers:**
- `.font-display.font-display-bold` → `font-weight: 700`
- `.font-display.font-display-light` → `font-weight: 300`

---

### 2. `.hero-header`

| Property | Value |
|----------|-------|
| `font-family` | `"ivypresto-headline"` |
| `font-weight` | `700` |
| `font-size` | `2.5rem` (40px) |
| `line-height` | `1.2` |
| `letter-spacing` | `-0.08px` |
| `color` | `var(--foreground)` → `oklch(0.145 0 0)` (light) |

**Usage:** Welcome page, landing hero titles

---

### 3. `.page-title`

| Property | Value |
|----------|-------|
| `font-family` | `"ivypresto-headline"` |
| `font-weight` | `300` |
| `font-size` | `2rem` (32px) |
| `line-height` | `1.2` |
| `color` | `var(--foreground)` |

**Usage:** Home, Jobs, Schedule page titles ("Hi, …")

---

### 4. `.page-title-sm`

| Property | Value |
|----------|-------|
| `font-family` | `"ivypresto-headline"` |
| `font-weight` | `300` |
| `font-size` | `1.5rem` (24px) |
| `line-height` | `1.3` |
| `color` | `var(--foreground)` |

**Usage:** List/detail page titles

---

### 5. `.promo-card-title`

| Property | Value |
|----------|-------|
| `font-family` | `"ivypresto-headline"` |
| `font-weight` | `300` |
| `font-size` | `1.5rem` (24px) |
| `line-height` | `1.3` |
| `color` | `var(--foreground)` |

**Usage:** Promo cards, card titles (matches `.page-title-sm`)

---

### 6. `.font-serif`

| Property | Value |
|----------|-------|
| `font-family` | `"ivypresto-headline"` |

**Usage:** Serif fallback (no Georgia/serif)

---

## Quick Reference Table

| Class | font-family | font-weight | font-size | line-height | letter-spacing | color |
|-------|------------|-------------|-----------|-------------|---------------|-------|
| **Font** | ivypresto-headline | — | — | — | — | — |
| `.font-display` | ivypresto-headline | 300 | inherit | inherit | inherit | inherit |
| `.font-display.font-display-bold` | ivypresto-headline | 700 | inherit | inherit | inherit | inherit |
| `.hero-header` | ivypresto-headline | 700 | 2.5rem (40px) | 1.2 | -0.08px | var(--foreground) |
| `.page-title` | ivypresto-headline | 300 | 2rem (32px) | 1.2 | — | var(--foreground) |
| `.page-title-sm` | ivypresto-headline | 300 | 1.5rem (24px) | 1.3 | — | var(--foreground) |
| `.promo-card-title` | ivypresto-headline | 300 | 1.5rem (24px) | 1.3 | — | var(--foreground) |
| `.font-serif` | ivypresto-headline | inherit | inherit | inherit | inherit | inherit |

---

## Raw CSS (copy-paste)

```css
/* Display font utility */
.font-display {
  font-family: "ivypresto-headline" !important;
  font-weight: 300 !important;
}
.font-display.font-display-bold {
  font-weight: 700 !important;
}
.font-display.font-display-light {
  font-weight: 300 !important;
}

/* Hero header — 40px, bold */
.hero-header {
  font-family: "ivypresto-headline" !important;
  font-weight: 700 !important;
  font-size: 2.5rem;
  line-height: 1.2;
  letter-spacing: -0.08px;
  color: var(--foreground);
}

/* Page title — 32px, light */
.page-title {
  font-family: "ivypresto-headline" !important;
  font-weight: 300 !important;
  font-size: 2rem;
  line-height: 1.2;
  color: var(--foreground);
}

/* Page title (list/detail) — 24px, light */
.page-title-sm {
  font-family: "ivypresto-headline" !important;
  font-weight: 300 !important;
  font-size: 1.5rem;
  line-height: 1.3;
  color: var(--foreground);
}

/* Promo/card title — 24px, light */
.promo-card-title {
  font-family: "ivypresto-headline" !important;
  font-weight: 300 !important;
  font-size: 1.5rem;
  line-height: 1.3;
  color: var(--foreground);
}

/* Serif fallback */
.font-serif {
  font-family: "ivypresto-headline" !important;
}
```
