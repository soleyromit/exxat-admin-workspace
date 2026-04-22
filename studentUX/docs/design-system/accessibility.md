# Accessibility (WCAG 2.1 Level AA)

Exxat One follows WCAG 2.1 Level AA standards. All components must meet these requirements.

---

## Quick Reference

| Requirement | Implementation |
|-------------|----------------|
| **Icon-only buttons** | `aria-label` + `Tooltip` (hover + focus) |
| **Form inputs** | Visible `<label>` with `htmlFor` / `id`, or `aria-label` on search |
| **Interactive regions** | `role="region"` + `aria-label` |
| **Tabs** | `role="tablist"`, `role="tab"`, `aria-selected`, `tabIndex`, Arrow keys |
| **Focus** | Visible ring (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`) |
| **Color contrast** | ≥ 4.5:1 text, ≥ 3:1 UI controls |
| **Touch targets** | ≥ 44×44px |

---

## ARIA Labels

### Icon-only buttons

Every icon-only button **must** have a descriptive `aria-label` and optionally a `Tooltip` for additional context. Use `IconButton` for consistent height (h-8), ARIA, and tooltip:

```tsx
// ✅ Preferred — IconButton with built-in Tooltip + aria-label
<IconButton
  icon={<FontAwesomeIcon name="filter" className="h-4 w-4" />}
  aria-label="Show filters"
  tooltip="Show filters"
  variant="outline"
  onClick={handleClick}
/>

// ✅ Alternative — aria-label + Tooltip for richer context
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="Clear selection">
      <FontAwesomeIcon name="x" className="h-4 w-4" aria-hidden="true" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Clear selection</TooltipContent>
</Tooltip>
```

### Decorative icons

Icons that are purely decorative (next to visible text) must have `aria-hidden="true"`:

```tsx
<Button>
  <FontAwesomeIcon name="download" className="h-4 w-4 mr-2" aria-hidden="true" />
  Export
</Button>
```

### Regions and landmarks

Floating UI, bulk action bars, and distinct sections should use `role="region"` with `aria-label`:

```tsx
<div role="region" aria-label="Bulk actions: 7 items selected">
  {/* bulk action content */}
</div>
```

---

## Keyboard Navigation

### Required keys

| Component | Keys | Behavior |
|-----------|------|----------|
| Buttons | `Enter`, `Space` | Activate (native) |
| Tabs | `Arrow Left` / `Arrow Right` | Switch tabs |
| Dropdowns | `Enter` to open, `Arrow Up/Down` to navigate, `Escape` to close | (Radix handles) |
| Modals | `Escape` to close; focus trapped inside | (Radix handles) |
| Checkboxes | `Space` | Toggle (native) |

### Custom interactive elements

If using `<div>` or `<span>` as a button, add keyboard support:

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-label="Descriptive action"
>
  {children}
</div>
```

### Tab keyboard pattern

Custom tab implementations must support Arrow keys:

```tsx
<button
  role="tab"
  tabIndex={isActive ? 0 : -1}
  aria-selected={isActive}
  aria-controls="panel-id"
  id="tab-id"
  onKeyDown={(e) => {
    if (e.key === "ArrowRight") setActiveTab("next");
    if (e.key === "ArrowLeft") setActiveTab("prev");
  }}
>
  Tab label
</button>
<div role="tabpanel" id="panel-id" aria-labelledby="tab-id">
  Content
</div>
```

---

## Tooltips

- **TooltipProvider** wraps the app (in `App.tsx`) so tooltips work globally.
- **Icon-only buttons**: Always pair `aria-label` with a `Tooltip` for hover/focus context.
- **Tooltip content**: Use clear, concise text (e.g., "Clear selection", "Download data").

---

## Focus Management

- Never remove focus outlines without providing a visible alternative.
- Use `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none`.
- Focus must return to the trigger after closing overlays (modals, dropdowns).
- Avoid `tabIndex > 0` — use natural document order.

---

## Color Contrast (WCAG 1.4.3, 1.4.11)

| Element | Required Ratio |
|---------|----------------|
| Normal text (< 18px) | ≥ 4.5:1 |
| Large text (≥ 18px or ≥ 14px bold) | ≥ 3:1 |
| UI components (buttons, inputs, toggles) | ≥ 3:1 boundary |
| Placeholder text | ≥ 4.5:1 |

### Color independence (WCAG 1.4.1)

Never convey information by color alone. Pair with:

| Information | Color | + Secondary |
|-------------|-------|--------------|
| Status | green/gray | Text label ("Active") |
| Trend | green/red | Arrow icon + percentage |
| Error | red border | Error message text |
| Link | blue | Underline on hover |

---

## Touch Targets (WCAG 2.5.8)

- Minimum: **44×44px** for touch targets.
- Icon-only buttons: Use `h-9 w-9` or `h-10 w-10` minimum.
- Buttons: Ensure padding yields ≥ 44px hit area.

---

## Forms

- Every field: visible `<label>` with `htmlFor` / `id`.
- Search fields: `aria-label` on input when visible label omitted.
- Required: `aria-required="true"` + visual asterisk with `sr-only` text.
- Errors: Associate via `aria-describedby`; use `role="alert"` or `aria-live="polite"`.

---

## Motion (WCAG 2.3.1)

- Respect `prefers-reduced-motion`.
- No content flashes > 3 times per second.

---

## Checklist for New Components

- [ ] Icon-only buttons have `aria-label` and optionally `Tooltip`
- [ ] Decorative icons have `aria-hidden="true"`
- [ ] All inputs have labels or `aria-label`
- [ ] Custom tabs support Arrow keys
- [ ] Regions have `role="region"` + `aria-label` where appropriate
- [ ] Focus ring is visible
