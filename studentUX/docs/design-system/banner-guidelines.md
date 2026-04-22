# Banner & Promo Component Guidelines

Banners and promo blocks (e.g. Exxat Prism banner, product switcher promo) must use design tokens for **fonts**, **colors**, and **spacing** from the global style system. Never hardcode values.

---

## Fonts

| Rule | Do | Don't |
|------|-----|-------|
| **Font family** | Inherit from body (Inter) or use `font-display` for headings | `font-family: "Some Font"` or custom `@font-face` |
| **Font size** | `text-xs`, `text-sm`, `text-base`, `text-lg`, etc. | `style={{ fontSize: "14px" }}` or `text-[14px]` |
| **Font weight** | `font-normal`, `font-medium`, `font-semibold`, `font-bold` | `font-weight: 500` or hardcoded values |
| **Line height** | Inherit or use `leading-tight`, `leading-relaxed` | Custom line-height values |

**Body copy:** Use `text-sm` or `text-base` with `text-foreground`.  
**Headings in banners:** Use `font-display` + `text-lg` or `text-xl` for display titles.

---

## Colors

| Rule | Do | Don't |
|------|-----|-------|
| **Background** | `bg-sidebar`, `bg-muted`, `bg-card`, `bg-accent` | `style={{ backgroundColor: "oklch(...)" }}`, `#hex`, `rgb()` |
| **Text** | `text-foreground`, `text-muted-foreground`, `text-primary-foreground` | Hardcoded hex, palette colors |
| **Borders** | `border-border`, `border-sidebar-border` | `border-[#ccc]` or inline color |

**Banner backgrounds:**
- `bg-banner-prism` — Exxat Prism promo banner; always rose hue (343) regardless of color theme
- `bg-sidebar` — matches selected color theme (rose/lavender/sage)
- `bg-muted` — subtle neutral
- `bg-card` — card surface

---

## Spacing

| Rule | Do | Don't |
|------|-----|-------|
| **Padding** | `p-3`, `p-4`, `px-4 py-3`, `p-6` | `style={{ padding: "12px" }}` |
| **Gaps** | `gap-2`, `gap-4`, `gap-6` | `gap-[12px]` or inline values |

**Conventions:** Card padding → `p-3` to `p-6`; section gaps → `gap-4` or `gap-6`.

---

## Checklist for New Banners

- [ ] No inline `style` for colors, fonts, or spacing
- [ ] Background uses `bg-*` token (`bg-sidebar`, `bg-muted`, `bg-card`)
- [ ] Text uses `text-foreground` or `text-muted-foreground`
- [ ] Typography uses Tailwind tokens (`text-sm`, `font-normal`, etc.)
- [ ] Padding/gaps use Tailwind spacing (`p-3`, `gap-4`)
- [ ] Borders use `border-border` or `border-sidebar-border`
- [ ] Works correctly in light/dark and all color themes (Exxat Prism, Exxat One, Sage)

---

## Reference

- **Tokens:** `docs/design-system/tokens.md`
- **Global styles:** `src/styles/globals.css`
- **Example:** `src/components/pages/home-exxat-prism-banner.tsx`
