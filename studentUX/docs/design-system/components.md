# UI Components (Primitives)

Located in `src/components/ui/`. These are low-level building blocks (mostly wrapping Radix UI). They have **no product logic** and accept only generic props.

---

## Button

**File:** `button.tsx`

| Variant | Tailwind | When to use |
|---------|----------|-------------|
| `default` | `bg-primary text-primary-foreground` | Primary action (Save, Submit, Confirm) |
| `outline` | `border bg-background` | Secondary action (Cancel, Back) |
| `secondary` | `bg-secondary` | Alternate secondary |
| `ghost` | transparent hover | Toolbar actions, subtle controls |
| `destructive` | `bg-destructive` | Delete, Remove, dangerous actions |
| `link` | underline | Inline text links |

| Size | Height | When to use |
|------|--------|-------------|
| `default` | h-9 (36px) | Standard buttons |
| `sm` | h-8 (32px) | Compact UI, table actions |
| `lg` | h-10 (40px) | Hero CTAs |
| `icon` | size-9 (36px) | Icon-only buttons |

**Rules:**
- One primary action per visible section.
- Icon-only buttons require `aria-label`.
- Use `asChild` with `<Slot>` when wrapping a router `<Link>`.

```tsx
<Button variant="default">Save</Button>
<Button variant="outline" size="sm">Cancel</Button>
<Button variant="ghost" size="icon" aria-label="Close">
  <X className="h-4 w-4" />
</Button>
```

---

## Card

**File:** `card.tsx`

**Slots:** `Card` → `CardHeader` → `CardTitle` + `CardDescription` + `CardAction` → `CardContent` → `CardFooter`

| Slot | Default Classes |
|------|----------------|
| `Card` | `rounded-xl border bg-card` |
| `CardHeader` | `px-6 pt-6`, auto-grid with `CardAction` |
| `CardContent` | `px-6`, last-child gets `pb-6` |
| `CardFooter` | `px-6 pb-6` |

**Rules:**
- Always use the `Card` wrapper — don't recreate card styling with raw divs.
- Use `CardAction` for top-right action buttons.
- The default `gap-6` between Card slots is built in.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
    <CardAction><Button size="sm">Edit</Button></CardAction>
  </CardHeader>
  <CardContent>{children}</CardContent>
</Card>
```

---

## Input

**File:** `input.tsx`

| Property | Value |
|----------|-------|
| Height | `var(--control-height)` (40px comfortable / 36px compact) |
| Border | `var(--control-border)` → `--border-control-3` (≈ #90929A, WCAG AA 3:1) |
| Background | `var(--input-background)` (default) or `var(--background)` (outline variant) |
| Border radius | `rounded-md` |
| Focus | `ring-[3px] ring-ring/50` |
| Error | `aria-invalid` → `border-destructive ring-destructive/20` |

**Rules:**
- Every input must have a visible `<label>` or `aria-label`.
- Never rely on `placeholder` as the only label.
- Never use `border-border` or hardcoded colors — use `border-[var(--control-border)]`.

---

## Badge

**File:** `badge.tsx`

| Variant | Usage |
|---------|-------|
| `default` | Primary status |
| `secondary` | Neutral/info |
| `destructive` | Error/critical |
| `outline` | Subtle |

**Specials:** `CountBadge`, `NewBadge`, `BetaBadge`, `CountText`

---

## Tabs

**File:** `tabs.tsx`

**Slots:** `Tabs` → `TabsList` + `TabsTrigger` + `TabsContent`

| Element | Style |
|---------|-------|
| `TabsList` background | `var(--sidebar)` |
| Active trigger | White bg + `var(--shadow-sm)` |
| Inactive trigger | Transparent, `text-muted-foreground` |

**Rules:**
- Use `m-0` on `TabsContent` to prevent unwanted margin.
- Use `TabsList className="flex-nowrap w-max"` (or `w-fit`) for consistency with Student Schedule, Slots, Wishlist, Reports.
- Use icon + label on `TabsTrigger` when possible: `<div className="flex items-center gap-2"><FontAwesomeIcon ... /><span>Label</span></div>`.
- Do not override tab styling — it is defined in `globals.css`.

```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="flex-nowrap w-max">
    <TabsTrigger value="overview" className="flex-shrink-0">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon name="activity" className="h-4 w-4" />
        <span>Overview</span>
      </div>
    </TabsTrigger>
  </TabsList>
  <TabsContent value="overview" className="m-0 pt-6">{content}</TabsContent>
</Tabs>
```

---

## Form Components

**Files:** `form.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, `radio-group.tsx`, `switch.tsx`

**Structure:**

```
Form
  FormField (name, control, render)
    FormItem
      FormLabel
      FormControl → Input | Select | Textarea | Checkbox
      FormDescription (optional helper text)
      FormMessage (error messages)
```

**Rules:**
- Labels via `FormLabel` + `htmlFor` / `id` pairing.
- Errors: `aria-invalid`, `aria-describedby`, visible error text.
- Required fields: `aria-required="true"` + visual asterisk.
- Group related fields in `<fieldset>` with `<legend>`.

---

## Dialog / Sheet

**Files:** `dialog.tsx`, `sheet.tsx`

- **Dialog**: Modal centered overlay. Focus-trapped. `Escape` to close.
- **Sheet**: Slide-out panel (left/right/top/bottom).
- Both require `aria-labelledby` pointing to the title.

---

## Other Primitives

| Component | File | Notes |
|-----------|------|-------|
| Alert | `alert.tsx` | Variants: `default`, `destructive` |
| Tooltip | `tooltip.tsx` | Shows on hover AND focus |
| Popover | `popover.tsx` | Click-triggered floating panel |
| DropdownMenu | `dropdown-menu.tsx` | Context menus, action menus |
| Accordion | `accordion.tsx` | Collapsible sections |
| ScrollArea | `scroll-area.tsx` | Custom scrollbars |
| Skeleton | `skeleton.tsx` | Loading placeholders |
| Progress | `progress.tsx` | Progress bar (`role="progressbar"`) |
| Separator | `separator.tsx` | Horizontal/vertical dividers |
| Avatar | `avatar.tsx` | User profile images |
| Pagination | `pagination.tsx` | Page navigation |
| Calendar | `calendar.tsx` | Date picker |
| Carousel | `carousel.tsx` | Content carousel |

---

## Adding a New Primitive

1. Place in `src/components/ui/`.
2. Build on Radix UI or native HTML — no product logic.
3. Support `className` for composition via `cn()`.
4. Use design tokens (never hardcoded colors/sizes).
5. Include focus-visible styles.
6. Export from the file; add to this doc.
