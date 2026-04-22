# Design Tokens

All tokens are defined in `src/styles/globals.css` under `:root`. Use Tailwind utilities or `var(--token)` in custom CSS.

---

## Colors

### Brand

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--brand-color` | oklch(0.57 0.24 342) | `text-brand`, `bg-brand` | Primary accent, CTAs |
| `--brand-color-dark` | oklch(0.42 0.24 342) | — | Hover / pressed states |

### Semantic Palette

| Token | Tailwind | Usage |
|-------|----------|-------|
| `--background` | `bg-background` | Page background |
| `--foreground` | `text-foreground` | Primary text |
| `--card` / `--card-foreground` | `bg-card`, `text-card-foreground` | Card surfaces |
| `--primary` / `--primary-foreground` | `bg-primary`, `text-primary-foreground` | Primary buttons |
| `--secondary` / `--secondary-foreground` | `bg-secondary` | Secondary surfaces |
| `--muted` / `--muted-foreground` | `bg-muted`, `text-muted-foreground` | Muted bg, descriptions |
| `--accent` / `--accent-foreground` | `bg-accent` | Hover highlights |
| `--destructive` / `--destructive-foreground` | `bg-destructive`, `text-destructive` | Errors, destructive actions |

### Borders

| Token | Tailwind | Usage |
|-------|----------|-------|
| `--border` | `border-border` | Decorative borders (cards, dividers) |
| `--border-control` | `border-[var(--border-control)]` | Subtle borders (non-AA) |
| `--border-control-35` | `border-[var(--border-control-35)]` | Form field borders (3.5:1 contrast, WCAG AA) |
| `--border-control-3` | `border-[var(--border-control-3)]` | Lighter form borders (3:1 minimum, WCAG AA) — ≈ #90929A |
| `--control-border` | `border-[var(--control-border)]` | **Form fields:** Input, Select, Textarea. Maps to `--border-control-3`. Use for all field borders. |

**Form field borders:** Always use `var(--control-border)` for Input, Select, and Textarea. Never hardcode hex or `border-border` on form controls.

### Chart Colors

| Token | Tailwind | Semantic Role |
|-------|----------|---------------|
| `--chart-1` | `text-chart-1` | Blue — primary data, links |
| `--chart-2` | `text-chart-2` | Green — success, secondary |
| `--chart-3` | `text-chart-3` | Purple — tertiary |
| `--chart-4` | `text-chart-4` | Yellow — warnings, highlights |
| `--chart-5` | `text-chart-5` | Orange — accents |

### Sidebar

| Token | Value (default light) | Tailwind | Usage |
|-------|------------------------|----------|-------|
| `--sidebar` | oklch(0.97 0.02 343) | `bg-sidebar` | Sidebar background |
| `--sidebar-foreground` | oklch(0.145 0 0) | `text-sidebar-foreground` | Sidebar text |
| `--sidebar-accent` | oklch(0.945 0.025 343) | `bg-sidebar-accent` | Sidebar hover/active |
| `--sidebar-border` | oklch(0.92 0.025 343) | `border-sidebar-border` | Sidebar dividers |

### Focus Ring

| Token | Value (default light) | Tailwind | Usage |
|-------|------------------------|----------|-------|
| `--ring` | oklch(0.25 0 0) | `ring-ring` | Focus ring (WCAG 2.4.11) |

### JobCard Interactive States

Used by `JobCard` and similar selectable cards. Values reference sidebar tokens for consistency.

| State | Property | Variable | Value (default light) | Tailwind |
|-------|----------|----------|------------------------|----------|
| **Hover** | Border | `--sidebar-border` | oklch(0.92 0.025 343) | `hover:border-sidebar-border` |
| **Hover** | Background | `--sidebar` @ 50% | oklch(0.97 0.02 343) / 0.5 | `hover:bg-sidebar/50` |
| **Hover** | Shadow | `--shadow-md` | oklch(0 0 0 / 0.1) 0px 1px 3px 0px, … | `hover:shadow-md` |
| **Selected** | Border | `--sidebar-border` | oklch(0.92 0.025 343) | `border-sidebar-border` |
| **Selected** | Background | `--sidebar` | oklch(0.97 0.02 343) | `bg-sidebar` |
| **Selected** | Shadow | `--shadow-md` | oklch(0 0 0 / 0.1) 0px 1px 3px 0px, … | `shadow-md` |
| **Focus** | Ring | `--ring` | oklch(0.25 0 0) | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |

**Base:** `transition-all duration-200`, `rounded-2xl`, `cursor-pointer`

### Rules

- **Never hardcode** hex/rgb/Tailwind palette colors (`text-blue-500`, `#E31C79`).
- **Never use dynamic Tailwind classes** like `` `text-${color}` `` — Tailwind tree-shakes them. Use a static mapping object instead.
- All colors must switch correctly between light/dark/theme variants.

---

## Typography

### Font Families

| Family | Tailwind | Usage |
|--------|----------|-------|
| Inter (300–700) | default | Body, UI |
| IvyPresto Headline | `font-display`, `.page-title`, `.page-title-sm` | Display headings — light weight (300) for consistency |

### Size Scale (14px base)

Base font size uses `html { font-size: 87.5%; }` (14px when browser default is 16px) so the system respects the user's browser font-size setting for accessibility.

| Token | Value | Tailwind |
|-------|-------|----------|
| `--font-size-xs` | 0.857rem (12px) | `text-xs` |
| `--font-size-sm` | 0.857rem (12px) | `text-sm` |
| `--font-size-base` | 1rem (14px) | `text-base` |
| `--font-size-lg` | 1.143rem (16px) | `text-lg` |
| `--font-size-xl` | 1.286rem (18px) | `text-xl` |
| `--font-size-2xl` | 1.5rem (21px) | `text-2xl` |
| `--font-size-3xl` | 1.714rem (24px) | `text-3xl` |
| `--font-size-4xl` | 2rem (28px) | `text-4xl` |
| `--font-size-20` | 1.25rem (20px) | `.text-detail-title` |

### Weight Scale

| Weight | Value | Tailwind |
|--------|-------|----------|
| Light | 300 | `font-light` |
| Normal | 400 | `font-normal` |
| Medium | 500 | `font-medium` |
| Semibold | 600 | `font-semibold` |
| Bold | 700 | `font-bold` |

### Heading Scale

| Element | Size | Weight | Line-height |
|---------|------|--------|-------------|
| h1 | 2rem | bold | 1.4 |
| h2 | 1.75rem | semibold | 1.4 |
| h3 | 1.25rem | medium | 1.5 |
| h4 | 1rem | medium | 1.5 |

### Rules

- Do not override base font-size, font-weight, or line-height unless explicitly required.
- Use semantic HTML headings (`h1`–`h4`) — they are auto-styled via `globals.css`.

---

## Spacing

| Token | Value | Tailwind |
|-------|-------|----------|
| `--spacing-xs` | 0.25rem (4px) | `gap-1`, `p-1` |
| `--spacing-sm` | 0.5rem (8px) | `gap-2`, `p-2` |
| `--spacing-md` | 0.75rem (12px) | `gap-3`, `p-3` |
| `--spacing-lg` | 1rem (16px) | `gap-4`, `p-4` |
| `--spacing-xl` | 1.5rem (24px) | `gap-6`, `p-6` |
| `--spacing-2xl` | 2rem (32px) | `gap-8`, `p-8` |
| `--spacing-3xl` | 3rem (48px) | `gap-12`, `p-12` |
| `--spacing-4xl` | 4rem (64px) | `gap-16`, `p-16` |

### Usage Conventions

| Context | Spacing |
|---------|---------|
| Between page sections | `gap-12` (48px) |
| Between related components | `gap-6` (24px) |
| Card internal padding | `px-6 pt-6 pb-6` or `p-5` |
| Page horizontal padding | `px-4 lg:px-6` |

---

## Border Radius (4px base scale)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--radius-base` | 4px | — | Base unit |
| `--radius-sm` | 4px | `rounded-sm` | Small elements, checkboxes, scrollbar |
| `--radius-md` | 8px | `rounded-md` | Buttons, inputs, tabs |
| `--radius-lg` | 12px | `rounded-lg` | Alternate card style |
| `--radius-xl` | 16px | `rounded-xl` | Cards, modals |
| `--radius-2xl` | 20px | `rounded-2xl` | Large containers |
| `--radius-3xl` | 24px | `rounded-3xl` | Extra-large containers |

**Convention:** Cards → `rounded-xl`; buttons and inputs → `rounded-md`. All values are multiples of 4px.

---

## Shadows

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--shadow-sm` | oklch(0 0 0 / 0.1) 0px 1px 2px 0px | `shadow-sm` | Subtle elevation |
| `--shadow-md` | oklch(0 0 0 / 0.1) 0px 1px 3px 0px, oklch(0 0 0 / 0.1) 0px 1px 2px -1px | `shadow-md` | Cards, dropdowns, JobCard hover/selected |
| `--shadow-lg` | oklch(0 0 0 / 0.1) 0px 4px 6px -1px, oklch(0 0 0 / 0.1) 0px 2px 4px -2px | `shadow-lg` | Modals, popovers |
| — | — | `shadow-xl` | Floating elements |

### Main Page (SidebarInset)

The main content area uses these values:

| Property | Value |
|----------|-------|
| **Shadow** | `shadow-sm` → `var(--shadow-sm)` = `oklch(0 0 0 / 0.1) 0px 1px 2px 0px` |
| **Border** | `border border-border/40` |
| **Radius** | `rounded-2xl` (1rem) |
| **Classes** | `rounded-2xl shadow-sm` on `SidebarInset` |

Tailwind `shadow-sm` (from `index.css`): `0 1px 3px 0 #0000001a, 0 1px 2px -1px #0000001a`

---

## Density

Density modes let users choose how tight the UI is. **Compact** is recommended for Windows 125% scaling and enterprise data-heavy workflows.

| Mode | Control Height | Table Row | Line-height (dense) |
|------|----------------|-----------|---------------------|
| Comfortable | 40px | 48px | 1.5 |
| Compact | 36px | 42px | 1.25 |

**Tokens** (in `globals.css`):

| Token | Comfortable | Compact |
|-------|-------------|---------|
| `--control-height` | 40px | 36px |
| `--control-height-sm` | 32px | 28px |
| `--control-padding-y` | 8px | 6px |
| `--table-row-height` | 48px | 42px |
| `--table-header-height` | 48px | 42px |
| `--line-height-dense` | 1.5 | 1.25 |

**Usage:** Toggle via user menu (Avatar → Density → Comfortable / Compact). Stored in `localStorage` and `data-density` on `<html>`.

**DataTable:** `<DataTable density="compact" />` or inherits from global density.

---

## Form Field Box (Input, Select, Textarea)

### Border Color

| Token | Value | Usage |
|-------|-------|-------|
| `--control-border` | `var(--border-control-3)` | All form field borders. WCAG AA 3:1 contrast. ≈ #90929A. |

**Rule:** Input, Select, and Textarea must use `border-[var(--control-border)]` or `style={{ borderColor: 'var(--control-border)' }}`. Never use `border-border` or hardcoded colors on form controls.

### Field Height

| Context | Height | Token / Class |
|---------|--------|---------------|
| Default (page forms) | 40px (comfortable) / 36px (compact) | `[height:var(--control-height)]` |
| Small variant | 32px / 28px | `[height:var(--control-height-sm)]` |
| Profile card dialog / modal forms | 44px mobile / 32px desktop | `min-height: 2.75rem` mobile; `2rem` at `md:` |

**Implementation:** Input and SelectTrigger use `[min-height:var(--control-height)] [height:var(--control-height)] [padding-block:var(--control-padding-y)]`. Profile card dialog overrides via `.profile-card-dialog-form`: 44px mobile, 32px desktop/tablet (md breakpoint).

---

## Layout Rail

Content rail constrains primary content width for consistent layout. **Desktop (≥1024px):** 1040px max-width. **Tablet (768–1023px):** 768px max-width. **Mobile (<768px):** full width with 16px gutters.

| Token | Value | Breakpoint |
|-------|-------|------------|
| `--content-max-width-desktop` | 1040px | ≥1024px |
| `--content-max-width-tablet` | 768px | 768–1023px |
| `--content-max-width-mobile` | 100% | <768px |
| `--content-gutter` | 24px | ≥768px |
| `--content-gutter-mobile` | 1rem (16px) | <768px |

**Usage:** Add class `content-rail` to page containers (e.g. Home, `PrimaryPageTemplate`).

---

## Breakpoints

| Name | Min Width |
|------|-----------|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

---

## Transitions

| Token | Value |
|-------|-------|
| `--transition-fast` | 0.2s ease |
| `--transition-normal` | 0.3s ease-in-out |
| `--transition-colors` | color, background-color, border-color 0.2s ease |
