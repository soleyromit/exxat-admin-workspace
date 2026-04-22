# Button Styles

Reference for all Button component styles in the Exxat One design system.

**Source:** `src/components/ui/button.tsx`

---

## Component

| Property | Value |
|----------|-------|
| File | `src/components/ui/button.tsx` |
| Import | `import { Button, buttonVariants } from "@/components/ui/button"` |
| Base classes | `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all` |
| Radius | Size-dependent: sm=4px, default=8px, lg=12px |
| Focus | `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background` |
| Disabled | `disabled:pointer-events-none disabled:opacity-50` |
| Icon size | `[&_svg]:size-4` (16px) |

---

## Radius (4px base scale)

| Token | Value | Tailwind | Button |
|-------|-------|----------|--------|
| `--radius-sm` | 4px | `rounded-sm` | ✓ sm, icon |
| `--radius-md` | 8px | `rounded-md` | ✓ default |
| `--radius-lg` | 12px | `rounded-lg` | ✓ lg, touch, icon-touch |
| `--radius-2xl` | 20px | `rounded-2xl` | — |
| `--radius-3xl` | 24px | `rounded-3xl` | — |

---

## Variants

| Variant | Classes | Usage |
|---------|---------|-------|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary-foreground/60` | Primary action (Save, Submit) |
| `outline` | `border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:ring-ring` | Secondary (Cancel, Back). Border uses `var(--border-control-35)` |
| `secondary` | `bg-secondary text-secondary-foreground hover:bg-secondary/80 focus-visible:ring-ring` | Alternate secondary |
| `ghost` | `hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 focus-visible:ring-ring` | Toolbar, subtle controls |
| `destructive` | `bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60` | Delete, Remove |
| `link` | `text-primary underline-offset-4 hover:underline focus-visible:ring-ring focus-visible:underline` | Inline text links |

---

## Sizes

| Size | Classes | min-height | padding | Usage |
|------|---------|------------|---------|-------|
| `default` | `px-4 py-2 has-[>svg]:px-3` | 40px (`var(--control-height)`) | 8px 16px | Standard buttons |
| `sm` | `rounded-md gap-1.5 px-3 py-1.5 has-[>svg]:px-2.5` | 44px mobile / 32px desktop | 6px 12px | Compact, table actions |
| `lg` | `rounded-md px-6 py-2.5 has-[>svg]:px-4` | 44px | 10px 24px | Hero CTAs |
| `icon` | `rounded-md p-2` | 44px mobile / 40px desktop | 8px | Icon-only |
| `touch` | `gap-1.5 px-4 py-3` | 44px | 12px 16px | Mobile touch targets |
| `icon-touch` | `rounded-md p-2` | 44px | 8px | Icon-only, mobile |

---

## Quick Reference Table

| Variant | bg | text | hover | focus ring |
|---------|-----|------|-------|------------|
| default | bg-primary | text-primary-foreground | bg-primary/90 | ring-primary-foreground/60 |
| outline | bg-background | text-foreground | bg-accent | ring-ring |
| secondary | bg-secondary | text-secondary-foreground | bg-secondary/80 | ring-ring |
| ghost | transparent | inherit | bg-accent | ring-ring |
| destructive | bg-destructive | text-white | bg-destructive/90 | ring-destructive/20 |
| link | transparent | text-primary | underline | ring-ring |

---

## Size Quick Reference

| Size | radius | min-height | padding-x | padding-y | gap |
|------|------------|-----------|-----------|-----|
| default | rounded-md (8px) | 40px | 16px | 8px | 8px |
| sm | rounded-sm (4px) | 32px (md) / 44px (mobile) | 12px | 6px | 6px |
| lg | rounded-lg (12px) | 44px | 24px | 10px | 8px |
| icon | rounded-sm (4px) | 40px (md) / 44px (mobile) | 8px | 8px | — |
| touch | rounded-lg (12px) | 44px | 16px | 12px | 6px |
| icon-touch | rounded-lg (12px) | 44px | 8px | 8px | — |

---

## Usage

```tsx
import { Button, buttonVariants } from "@/components/ui/button";

<Button variant="default">Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost" size="icon" aria-label="Close">
  <FontAwesomeIcon name="x" />
</Button>

// For links styled as buttons (use anchor, not Button asChild)
<a className={buttonVariants({ variant: "default", size: "sm" })} href="...">
  Open Exxat Prism
</a>
```

**Rules:**
- Icon-only buttons require `aria-label`.
- Use `asChild` with `<Slot>` for router `<Link>` — note: Button wraps children in spans; prefer plain anchor + `buttonVariants()` for links.
- One primary action per visible section.
