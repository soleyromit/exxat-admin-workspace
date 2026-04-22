# WCAG 2.1 AA — Full Accessibility Checklist

This is the single source of truth for all accessibility requirements in Exxat DS. Every component, edit, or feature must pass ALL applicable sections before it is considered done.

---

## 1. Interactive Elements

- Every `<button>` has visible text OR `aria-label`
- Icon-only buttons: `aria-label` + wrap with `<Tip>` (from `@/components/ui/tip`) — no exceptions
- Stateful buttons describe current state: `aria-label="Sort ascending — click to sort descending"`
- Links describe destination (no "click here"); new-window links: "(opens in new tab)"
- No nested interactive elements (button inside button, anchor inside button)
- Custom clickable `<div>`/`<span>`: `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space)
- Disabled: use native `disabled` or `aria-disabled="true"`; keep discoverable by screen readers

## 2. Keyboard

- ALL interactions reachable by keyboard alone — zero mouse-only features
- Tab order follows visual reading order
- Skip link → `#main-content` (verify after layout changes)
- `Enter`/`Space` activate buttons; `Escape` closes modals/popovers; `Arrow keys` in composite widgets
- `focus-visible:` ring on ALL interactive elements (≥ 2px, 3:1 contrast against adjacent colors)
- Hidden elements (opacity-0): `group-focus-within:opacity-100` for keyboard visibility
- Modal: focus trapped inside, returns to trigger on close
- Multi-step forms: move focus to step heading on advance (`tabIndex={-1}` + `.focus()`)
- Popover/Dropdown: `initialFocus` on first interactive child

## 3. Forms & Inputs

- Every `<input>`/`<textarea>`/`<select>` has `<label>` (visible or `sr-only`) OR `aria-label`
- Labels use `htmlFor` matching input `id`; placeholder is NOT a label
- Errors: `aria-describedby` → error element + `aria-invalid="true"` + visible descriptive text
- Required fields: `aria-required="true"` or HTML `required`
- Grouped controls: `<fieldset>` + `<legend>` or `role="group"` + `aria-labelledby`
- Dates: ALWAYS Calendar + Popover picker; format MM/DD/YYYY; `initialFocus` on Calendar open
- Toggle/Switch: `role="switch"` + `aria-checked` + `<label htmlFor>`

## 4. Semantic Structure

- One `<main>` per page with `id="main-content"` + `tabIndex={-1}` (required for skip link)
- Heading hierarchy: one `<h1>` (via `PageHeader`), logical `<h2>` → `<h3>` (no skipping)
- `SiteHeader` title in the breadcrumb bar is NOT an `<h1>`
- Multiple `<nav>` elements: each must have `aria-label`
- Modal/Sheet/Dialog: `DialogTitle`/`SheetTitle`/`DrawerTitle` ALWAYS present — use `sr-only` if visually hidden
- `<aside>` panels: `aria-label` (e.g. "Ask Leo assistant", "Rotation navigation")
- Data tables: `<table>` + `<thead>` + `<th scope="col">`; sortable columns: `aria-sort` on `<th>`
- Listbox: `role="listbox"` + `role="option"` + `aria-selected`

## 5. Tooltips

- Use `<Tip>` from `@/components/ui/tip` — NEVER the HTML `title` attribute
- Open on BOTH hover AND keyboard focus
- Every icon-only button gets `<Tip>` — no exceptions
- Tooltip content is supplementary; never the sole source of critical information

## 6. Color & Contrast

- **Normal text**: 4.5:1 ratio
- **Large text** (≥18px regular / ≥14px bold): 3:1
- **UI components** (borders, focus rings): 3:1
- Status conveyed NEVER by color alone — always include text label or icon alongside
- Error states: red + icon + descriptive text (not just red color)
- Decorative icons: `aria-hidden="true"`
- All ratios apply in BOTH light AND dark themes
- Hover states visibly distinct in dark mode (brand-tinted `--accent`, not grey)
- Test against all themes: Lavender × Prism × light × dark × high-contrast

## 7. Dynamic Content

- Count changes (filter results, badge updates): `aria-live="polite"` on the element
- Toast/snackbar notifications: `role="status"` or `aria-live="polite"`
- Loading states: `aria-busy="true"` on the loading container
- Progress indicators: `role="progressbar"` + `aria-valuenow/min/max`

## 8. Images & Media

- Informative images: descriptive `alt` text
- Decorative images: `alt=""` or `aria-hidden="true"`
- SVG icons accompanying text: `aria-hidden="true"`
- Standalone SVG (no adjacent text): `role="img"` + `aria-label`

## 9. ARIA Roles — Critical Rules

### Tabs
- `role="tablist"` → only `role="tab"` (or equivalent tab semantics) as direct children
- **Never** put `role="button"`, menus (`aria-haspopup`), remove buttons, or other controls **inside** the `tablist` container
- Tab panels: `role="tabpanel"` + `aria-labelledby`

### View Switchers (tabs + per-tab settings + remove)
- These are composite toolbar widgets — use `role="toolbar"` + `aria-label`
- Use `aria-pressed` on toggle-style controls within the toolbar
- Do NOT misuse `tablist`/`tab` for mixed-control toolbars

### Touch Targets (WCAG 2.2 — 2.5.8)
- Interactive controls: minimum **24×24 CSS pixels**, OR 24px spacing so hit areas don't overlap
- Icon-only buttons: `size-6` or `min-h-6 min-w-6` — **never** `size-4` as the sole target

## 10. Component-Specific Requirements

| Component | Requirements |
|-----------|-------------|
| Sidebar nav | `aria-current="page"` on active link; badges include value in `aria-label`; collapsed state → tooltip shows label |
| DataTable header column menu | `group-focus-within/th:opacity-100`; wrap trigger with `<Tip label="Column options">` |
| Sort button | `<Tip label="Sort by {col}">` + `aria-sort` attribute on `<th>` |
| Selection checkbox | `aria-label="Select {row name}"` |
| Tabs | `role="tablist"` / `role="tab"` / `role="tabpanel"` + `aria-selected` + arrow key navigation |
| Dropdown | `aria-haspopup` + `aria-expanded` (Radix handles automatically) |
| Filter pill | Keyboard-navigable; Escape closes the popover |
| Modal/Dialog | Focus trap + Escape closes + `aria-hidden` on background (Radix handles automatically) |
| Sheet/Drawer | `SheetTitle` required; floating style defined in component reuse rules |
| Ask Leo sidebar | `<aside aria-label="Ask Leo assistant">` |

## 11. Pre-Completion Testing Protocol

Run for EVERY task before marking done:

1. **Keyboard:** Tab through all changed elements — can you reach and activate every control without a mouse?
2. **Focus ring:** Visible on every interactive element after tabbing to it?
3. **Tooltips:** Every icon-only button has `<Tip>`?
4. **Labels:** Every input has a label? Every button has text or `aria-label`?
5. **Color contrast:** Text ≥ 4.5:1, UI ≥ 3:1? (Check with browser devtools or axe)
6. **Dark mode:** Repeat contrast check in dark theme
7. **200% zoom:** Layout usable at 200% browser zoom?
8. **axe audit:** Run axe (DevTools extension) on any page where you touched views toolbar, tabs, or primary list surfaces

## Quick Reference Card

```
Icon button     → aria-label + <Tip>
Toggle/Switch   → role="switch" + aria-checked
Dropdown        → aria-haspopup + aria-expanded (Radix auto)
Tab             → role="tab" + aria-selected
Sort column     → aria-sort on <th>
Live count      → aria-live="polite"
Error message   → id + aria-describedby on input
Date input      → Calendar + Popover + initialFocus
Modal           → DialogTitle (required) + focus trap
Progress        → role="progressbar" + aria-valuenow/min/max
Tablist         → only tab-role children (no buttons/menus inside)
View switcher   → role="toolbar" + aria-label + aria-pressed
```
