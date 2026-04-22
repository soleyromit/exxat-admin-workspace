# WCAG 2.1 Level AA Checklist — New Components & Pages

> **Use this checklist** when creating any new component or page. All UI must meet WCAG 2.1 Level AA.

---

## Before You Ship

Run through this checklist for every new component or page. Mark each item before merging.

---

## 1. Keyboard & Focus

| # | Requirement | How to Meet |
|---|-------------|-------------|
| 1.1 | All functionality operable via keyboard | No mouse-only interactions. Use `onKeyDown` for custom controls. |
| 1.2 | Visible focus indicators | Use `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on interactive elements. Never remove outline without a visible replacement. |
| 1.3 | No keyboard traps | User can Tab out of modals, drawers, and custom widgets. Provide Escape to close. |
| 1.4 | Skip link available | Main content has `id="main-content"`; skip link targets it (see `App.tsx`). |

**Code pattern — custom interactive element:**
```tsx
<div
  role="button"
  tabIndex={0}
  aria-label="Descriptive action"
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }}
  className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
/>
```

---

## 2. Labels & Semantics

| # | Requirement | How to Meet |
|---|-------------|-------------|
| 2.1 | Icon-only buttons have `aria-label` | Every icon button needs `aria-label="Action name"`. |
| 2.2 | Form inputs have associated labels | Use `<Label htmlFor="id">` and `id` on input. |
| 2.3 | Images have alt text | Decorative: `alt=""` and `aria-hidden="true"`. Meaningful: descriptive `alt`. |
| 2.4 | Decorative icons are hidden from screen readers | Add `aria-hidden="true"` to decorative `FontAwesomeIcon`. |
| 2.5 | Links/buttons have meaningful text | Avoid "Click here". Use "Submit preferences", "View schedule", etc. |

---

## 3. Tooltips

| # | Requirement | How to Meet |
|---|-------------|-------------|
| 3.1 | Icon-only buttons have tooltips | Use `Tooltip` from `@/components/ui/tooltip` to provide a visible hint on hover/focus. |
| 3.2 | Tooltip content is descriptive | Use clear, action-oriented text: "Save organisation", "View board options", not "Button". |
| 3.3 | Tooltip is keyboard accessible | Radix `Tooltip` shows on focus. Ensure trigger is focusable (`asChild` with `Button` or `tabIndex={0}`). |
| 3.4 | Don't rely on tooltip alone for critical info | Tooltip supplements `aria-label`; both help different users. Icon-only buttons need both. |

**Code pattern — icon button with tooltip:**
```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="outline" size="icon" aria-label="View board options">
      <FontAwesomeIcon name="kanban" className="h-4 w-4" aria-hidden />
    </Button>
  </TooltipTrigger>
  <TooltipContent side="bottom">View board options</TooltipContent>
</Tooltip>
```

**When to use tooltips:**
- Icon-only buttons (required)
- Truncated text that reveals full content on hover
- Abbreviations or jargon that need clarification
- Secondary actions where the icon may be ambiguous

---

## 4. Color & Contrast

| # | Requirement | How to Meet |
|---|-------------|-------------|
| 4.1 | Text contrast ≥ 4.5:1 (normal), 3:1 (large) | Use design tokens only: `text-foreground`, `text-muted-foreground`, `text-chip-*`. Never hardcode hex colors. |
| 4.2 | Non-text contrast ≥ 3:1 | Input borders: `border-[var(--control-border)]`. Focus ring: `--ring`. |
| 4.3 | Don't rely on color alone | Links: `text-decoration: underline`. Status: use icon + text, not just color. |

**Design tokens (from `globals.css`):**
- Text: `text-foreground`, `text-muted-foreground`, `text-chip-1` through `text-chip-5`
- Backgrounds: `bg-card`, `bg-muted`, `bg-background`
- Form field borders: `border-[var(--control-border)]` (see [tokens.md](./tokens.md#form-field-box-input-select-textarea))

---

## 5. Touch Targets (Mobile)

| # | Requirement | How to Meet |
|---|-------------|-------------|
| 5.1 | Touch targets ≥ 44×44px on mobile | Use `touchTargetMobileClasses` from `@/components/ui/utils` for icon buttons. |
| 5.2 | Full-width buttons meet min height | `min-h-11` (44px) on mobile; `md:h-9` for compact desktop. |

**Code pattern:**
```tsx
import { touchTargetMobileClasses } from "@/components/ui/utils";

<Button
  className={cn(touchTargetMobileClasses, "md:h-9 md:w-9")}
  aria-label="Save"
/>
```

---

## 6. Forms & Errors

| # | Requirement | How to Meet |
|---|-------------|-------------|
| 6.1 | Required fields indicated | Use `*` + `aria-required="true"` or `required`. |
| 6.2 | Errors announced to screen readers | Use `aria-describedby` or `aria-invalid` with `role="alert"` for error messages. |
| 6.3 | Error messages are descriptive | "Enter a valid email" not "Invalid input". |

---

## 7. Modals & Overlays

| # | Requirement | How to Meet |
|---|-------------|-------------|
| 7.1 | Focus moves into modal on open | Use Radix `Dialog` / `Drawer` — they handle focus. |
| 7.2 | Focus returns to trigger on close | Radix handles this. |
| 7.3 | Escape closes modal | Radix handles this. |

---

## 8. Tables & Lists

| # | Requirement | How to Meet |
|---|-------------|-------------|
| 8.1 | Tables have proper headers | Use `<th scope="col">` or `scope="row"`. |
| 8.2 | Sortable columns announced | `aria-sort="ascending"` / `"descending"` when applicable. |

---

## 9. Motion & Animation

| # | Requirement | How to Meet |
|---|-------------|-------------|
| 9.1 | Respect `prefers-reduced-motion` | Avoid auto-playing animations. Use `@media (prefers-reduced-motion: reduce)` if needed. |

---

## Quick Reference — Must-Haves

When creating a **new component**:
- [ ] All interactive elements keyboard operable
- [ ] `focus-visible:ring-*` on custom controls
- [ ] `aria-label` on icon-only buttons
- [ ] Tooltip on icon-only buttons (use `Tooltip` from `@/components/ui/tooltip`)
- [ ] `aria-hidden` on decorative icons
- [ ] Design tokens only (no hex colors)
- [ ] Touch targets 44px on mobile for icon buttons

When creating a **new page**:
- [ ] Page has logical heading order (h1 → h2 → h3)
- [ ] Skip link targets main content
- [ ] All of the above for components on the page

---

## References

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Accessibility (full guide)](./accessibility.md) — ARIA, keyboard nav, tooltips, contrast
- [High Contrast Style Guidelines](./high-contrast-style-guidelines.md) — HC-specific UX patterns & checklist
- [Exxat One High Contrast & WCAG AA](./high-contrast-wcag-aa.md)
- [CLAUDE.md](../../CLAUDE.md) — Design system rules
