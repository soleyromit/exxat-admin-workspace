# Patterns

Reusable layout, form, responsive, icon, and accessibility patterns. These are conventions, not components — apply them when building pages and features.

---

## Layout Patterns

### Page Padding

```
px-4 lg:px-6
```

All page-level content uses this horizontal padding. Nested cards and sections inherit it.

### Section Spacing

| Between | Spacing |
|---------|---------|
| Major page sections | `gap-12` (48px) |
| Related components within a section | `gap-6` (24px) |
| Tight groupings (label + input) | `gap-2` (8px) |

### Responsive Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id}>...</Card>)}
</div>
```

### Tab Consistency

All tabbed interfaces (Student Schedule, Slots, Wishlist, Reports, etc.) must follow the same pattern:

| Element | Classes / Pattern |
|---------|-------------------|
| `TabsList` | `flex-nowrap w-max` (or `w-fit`) — matches shadcn default `bg-sidebar p-1` |
| `TabsTrigger` | `flex-shrink-0` when in a row; use `flex items-center gap-2` with icon + label + optional `Badge` |
| `TabsContent` | `m-0` to reset default margin; add `pt-6` or similar for content spacing |

**List pages (PrimaryPageTemplate):** Tabs in toolbar row with Search, Filter, TableProperties. Each trigger: icon + name + count Badge.

**Content pages (e.g. Reports):** Tabs above content. Each trigger: icon + name. Use `TabsList className="flex-nowrap w-max"` and FontAwesome icons to match list pages.

### Report Tabs (underline variant)

For report-style pages (Reports, Analytics), use the **underline variant**:

| Element | Classes / Pattern |
|---------|-------------------|
| Container | `border-b border-border` — full-width bar with bottom border |
| `TabsList` | `bg-transparent p-0 rounded-none border-0` — no pill background |
| `TabsTrigger` | `border-b-2 border-transparent` — inactive; `data-[state=active]:border-primary` — active underline |
| Content | `px-4 py-3.5` per trigger; icon + label; optional `description` for `title` tooltip |

**Tab config:** `ReportPageViewConfig` — `name`, `id`, `icon`, optional `description`, optional `count`.

**Labels:** Use semantic names: Dashboard (overview), Analytics, Charts, Media (images), Reports.

```tsx
// ReportPageTemplate uses this pattern by default
const REPORT_TABS: ReportPageViewConfig[] = [
  { name: "Dashboard", id: "overview", icon: <FontAwesomeIcon name="gaugeHigh" />, description: "KPIs and overview" },
  { name: "Analytics", id: "analytics", icon: <FontAwesomeIcon name="chartLine" />, description: "Data exploration" },
  ...
];
```

### Responsive Visibility

```tsx
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>
```

### Page-Level Structure

```
┌──────────────────────────────────────┐
│ SiteHeader                           │
├──────────────────────────────────────┤
│ Key Metrics (full width, no margins)│  ← No horizontal margins
├──────────────────────────────────────┤
│ Page Content (px-4 lg:px-6)          │
│  ┌────────────────────────────────┐  │
│  │ Section 1                      │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │  gap-12
│  │ Section 2                      │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### Main Key Metrics — Full Width, No Margins

The main Key Metrics block (`KeyMetricsShowcase`) must be **full width with no horizontal margins**.

- Do **not** add `margin-left`, `margin-right`, or wrapper margins around `KeyMetricsShowcase`.
- Keep the standard padding (`px-4 lg:px-6`) inside the component.
- The block spans the full width of its container; only padding applies, not margins.

### Page Scroll Behavior

| Page Type | Scroll Behavior | When to Use |
|-----------|-----------------|-------------|
| **List pages** (Student Schedule, Slots, Wishlist) | Only the tab content area scrolls; header, metrics, and toolbar stay fixed | DataTable or dense list content; user needs persistent header/tabs while scrolling |
| **Content pages** (Reports) | **Full page scroll** — header, metrics, tabs, and content all scroll together as one unit | Dashboard-style sections, cards, charts; content-heavy pages where the whole page flows |

**PrimaryPageTemplate:** Use `fullPageScroll={true}` for content pages (e.g. Reports with SectionWithHeader, PendingApprovalChartCard). Omit or use `false` for list pages with DataTable.

```tsx
// Content page — whole page scrolls
<PrimaryPageTemplate
  fullPageScroll
  ...
/>

// List page — only tab content scrolls (default)
<PrimaryPageTemplate ... />
```

**Rule:** Do not add `overflow-auto` to tab content when using `fullPageScroll`; the template's scroll container handles it.

---

## Drawer vs Modal vs Full Page

When to use each overlay pattern, based on modern SaaS conventions (Notion, Linear, Figma, Stripe, etc.):

### Decision Tree

```
Is this a critical, blocking action (delete, confirm, verify)?
  YES → Modal (Dialog)
  NO  → Does the user need to reference the main content while working?
        YES → Drawer
        NO  → Is this a primary workflow (create/edit entity, multi-step)?
              YES → Full page (or Drawer if < 3 steps)
              NO  → Drawer for settings/filters; Full page for complex forms
```

### When to Use Drawer

| Use Drawer For | Examples |
|----------------|----------|
| **Settings & configuration** | View settings, table properties, filter/sort/column config |
| **Supplementary content** | Related details, previews, notes that complement the main view |
| **Sequential entries** | Adding multiple items one after another (user stays in flow) |
| **Filters & refinement** | Filter panels, column pickers, saved views |
| **Mobile-first patterns** | On small screens, drawers often replace modals for forms |
| **Context preservation** | User needs to see the underlying list/table while configuring |

**Drawer characteristics:** Slides from edge, light overlay, maintains context, non-blocking. Use `modal={false}` when drawer contains dropdowns.

### When to Use Modal (Dialog)

| Use Modal For | Examples |
|---------------|----------|
| **Critical confirmations** | Delete, discard changes, overwrite |
| **Short, focused forms** | Quick add, single-field edit, 1–2 inputs |
| **Blocking attention** | Important alerts, permission requests |
| **Immediate action required** | "Session expired", "Unsaved changes" |
| **Small, interruptive content** | Tooltips, short messages, single-choice pickers |

**Modal characteristics:** Centers on screen, heavy overlay, blocks interaction, demands focus.

### When to Use Full Page

| Use Full Page For | Examples |
|-------------------|----------|
| **Primary workflows** | Create student, edit placement, multi-step wizards |
| **Complex forms** | 5+ fields, tabs within form, file uploads |
| **Detail views** | Record detail, profile, entity overview |
| **Dedicated flows** | Onboarding, setup, configuration wizards |

**Full page characteristics:** Replaces or pushes main content, full attention, URL/bookmarkable.

### Quick Reference

| Pattern | Overlay | Context | Best For |
|---------|---------|---------|----------|
| **Drawer** | Light, edge slide | Preserved | Settings, filters, supplementary |
| **Modal** | Heavy, center | Blocked | Confirmations, short forms |
| **Full page** | None (replaces) | Full | Complex forms, detail views |

### Exxat One Usage

- **Drawer:** TableProperties (View Settings), FilterBar add-filter dropdown content, any settings panel that complements a list/table.
- **Modal:** Delete confirmations, discard-changes dialogs, short "Add X" forms (1–2 fields).
- **Full page:** Student Schedule detail, placement detail, create/edit wizards.

---

## Form Patterns

### Standard Form Structure

```
Form
  FormField (name, control, render)
    FormItem
      FormLabel          ← visible label
      FormControl        ← Input | Select | Textarea
      FormDescription    ← optional helper
      FormMessage        ← error message
```

### Input Styling

| Property | Value |
|----------|-------|
| Height | `var(--control-height)` (40px comfortable / 36px compact) |
| Border | `var(--control-border)` (≈ #90929A, WCAG AA 3:1) |
| Radius | `rounded-md` |
| Focus ring | `ring-[3px] ring-ring/50` |
| Error | `aria-invalid` → `border-destructive ring-destructive/20` |

**Profile card dialog / modal forms:** 44px mobile, 32px desktop/tablet; `bg-background`, `border-[var(--control-border)]` via `PROFILE_FIELD_CLASS` or `.profile-card-dialog-form`.

### Label Rules

- Every field: visible `<label>` with `htmlFor` / `id`.
- Search fields: `aria-label` on the input when visible label is omitted.
- Required: `aria-required="true"` + visual asterisk with `sr-only` text.

### Error Messages

- Associate via `aria-describedby`.
- Use `role="alert"` or `aria-live="polite"`.
- Include field name: "Email is required" not just "Required".

---

## Icon Patterns

### Libraries

| Library | Role | Usage |
|---------|------|-------|
| Font Awesome Pro | Primary icon set | `<FontAwesomeIcon name="home" weight="regular" />` |
| Lucide React | Secondary (specific components) | `import { Search } from "lucide-react"` |

### Sizing

| Size | Classes | Usage |
|------|---------|-------|
| Small | `h-3.5 w-3.5` or `h-4 w-4` | Inline, compact |
| Medium | `h-5 w-5` | Standard |
| Large | `h-6 w-6` | Hero, headers |

### Color

Use token-based colors: `text-muted-foreground`, `text-brand`, `text-chart-1`.

### Accessibility

- Decorative icons (next to a text label): `aria-hidden="true"`.
- Meaningful icons (convey information alone): `role="img"` + `aria-label`.
- Icon-only buttons: `<Button aria-label="...">`.

---

## Responsive Patterns

| Pattern | Mobile | Desktop |
|---------|--------|---------|
| Page padding | `px-4` | `lg:px-6` |
| Section gaps | `gap-6` | `gap-12` |
| Metric grid | 1 column | 3–4 columns |
| Search bar fields | Stacked | Inline row |
| Sidebar | Collapsed (icon mode) | Expanded |

---

## Accessibility Patterns

### Color Contrast (WCAG 1.4.3, 1.4.11)

| Element | Required Ratio |
|---------|---------------|
| Normal text (< 18px) | ≥ 4.5:1 |
| Large text (≥ 18px or ≥ 14px bold) | ≥ 3:1 |
| UI components (buttons, inputs, toggles) | ≥ 3:1 boundary |
| Placeholder text | ≥ 4.5:1 |

### Keyboard Navigation (WCAG 2.1.1)

| Component | Keys |
|-----------|------|
| Buttons | `Enter`, `Space` |
| Tabs | `Arrow Left/Right` to switch, `Enter` to activate |
| Dropdowns | `Enter` to open, `Arrow Up/Down` to navigate, `Escape` to close |
| Modals | `Escape` to close; focus trapped inside |
| Checkboxes | `Space` to toggle |

**Clickable non-button elements:**

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
>
  {children}
</div>
```

### Focus Indicators (WCAG 2.4.7)

```tsx
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
```

- Never remove outlines without providing an alternative.
- Focus must return to the trigger after closing overlays.

### ARIA Essentials

| Component | ARIA |
|-----------|------|
| Icon-only button | `aria-label` |
| Expandable section | `aria-expanded`, `aria-controls` |
| Loading container | `aria-busy="true"` |
| Sortable table header | `aria-sort` |
| Selected table row | `aria-selected="true"` |
| Search wrapper | `role="search"` |
| Progress bar | `role="progressbar"`, `aria-valuenow` |

### Color Independence (WCAG 1.4.1)

Never convey information by color alone. Always pair with:

| Information | Color | + Secondary |
|-------------|-------|-------------|
| Status | green/gray | Text label ("Active") |
| Trend | green/red | Arrow icon + percentage |
| Error | red border | Error message text |
| Link | blue | Underline on hover |

### Motion (WCAG 2.3.1)

- All animations respect `prefers-reduced-motion`.
- No content flashes > 3 times per second.

### Touch Targets (WCAG 2.5.8)

- Minimum: 44×44px.
- Buttons: `h-9` + padding ≥ 44px hit area.
- Icon-only buttons: `h-10 w-10` minimum.

---

## Data-Driven Color Classes

When data objects carry color information (e.g. alert items, chart segments), pass **full static Tailwind classes** — never fragments:

```tsx
// ✅ GOOD — Full static classes in data
const alerts = [
  { iconColor: "text-destructive", bgColor: "bg-destructive/10" },
  { iconColor: "text-chart-4", bgColor: "bg-chart-4/10" },
];

<div className={cn("w-10 h-10 rounded-lg", alert.bgColor)}>
  <Icon className={cn("h-5 w-5", alert.iconColor)} />
</div>
```

```tsx
// ❌ BAD — Dynamic fragments
const alerts = [{ color: "destructive" }];
<div className={`bg-${alert.color}/10`} /> // Won't compile
```

This works because Tailwind's JIT scans the data files and finds the full class strings.

---

## Conditional Classes with cn()

Always use `cn()` (from `src/components/ui/utils`) for conditional classes:

```tsx
// ✅ GOOD
<div className={cn("p-4 rounded-lg", isUser ? "bg-primary text-primary-foreground" : "bg-muted")} />

// ❌ BAD — template literal
<div className={`p-4 rounded-lg ${isUser ? "bg-primary" : "bg-muted"}`} />
```

For trend colors or status-based styling, use a mapping object:

```tsx
const TREND_COLORS = {
  up: "text-chart-2",
  down: "text-destructive",
} as const;

<span className={cn("text-xs", TREND_COLORS[trend])} />
```

---

## Do's and Don'ts

### Do

- Use design tokens (Tailwind utilities, CSS vars) instead of arbitrary values.
- Use shared composites before building custom components.
- Accept `className` for external layout composition.
- Use semantic HTML (`<button>`, `<a>`, `<label>`, `<table>`, `<nav>`).
- Keep components < 200 lines; extract sub-components beyond that.

### Don't

- Hardcode colors (`#E31C79`, `text-blue-500`).
- Use dynamic Tailwind classes (`` `text-${color}` ``).
- Duplicate section/page patterns — use the shared composites.
- Mix icon libraries in one component without a specific reason.
- Remove focus outlines without providing an alternative.
- Use `tabIndex > 0`.
