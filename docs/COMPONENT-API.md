# Admin DS — Component API Reference
# Source: exxat-ds/packages/ui/src/components/ui/
# Import all from: @exxat/ds/packages/ui/src
# Read this file on demand — do NOT load proactively.

---

## Icon Name Map

```
fa-ellipsis          ⋯ row actions (regular=inactive, solid=open)
fa-plus              add/create           fa-pen            edit
fa-trash-can         delete               fa-copy           duplicate
fa-xmark             close/dismiss        fa-check          confirm/selected
fa-sliders           filter/properties    fa-magnifying-glass search
fa-folder            folder               fa-folder-open    folder open state
fa-rectangle-list    question set         fa-bookmark       bookmark (regular=off, solid=on)
fa-lock-keyhole      private/locked       fa-thumbtack      pinned
fa-clock-rotate-left version history      fa-calendar-days  date picker
fa-chevron-down      dropdown indicator   fa-chevron-right  breadcrumb/expand
fa-sidebar           toggle nav sidebar   fa-gear           settings
fa-share-nodes       share                fa-sparkles       AI/smart (generic) — NOT Leo
fa-star-christmas    Leo AI only (duotone solid)
fa-circle-info       info                 fa-bell           alert/notification
fa-arrow-up          sort ascending       fa-arrow-down     sort descending
fa-arrow-down-to-line download            fa-arrow-up-from-bracket upload/export
fa-users             team/collaborators   fa-graduation-cap course
fa-flag              flag                 fa-star           favorite
fa-grip-dots-vertical drag handle
```

Font sizes in style objects:
```
fontSize: 9  → badge indicators    fontSize: 12 → default inline
fontSize: 11 → tight row cells     fontSize: 13 → sidebar nav
fontSize: 14 → standard buttons    fontSize: 16 → header actions
```

---

## How to Start a New Product

1. Create admin `next.config.ts` with `@exxat/ds` + `@exxat/student` webpack aliases
2. Create student `next.config.ts` with `@exxat/student` alias only
3. Import `theme.css` in admin `app/globals.css`; import `studentUX/src/styles/globals.css` in student
4. Add Typekit + Font Awesome to admin `app/layout.tsx`
5. Set `<html class="theme-one">` in admin layout (default brand = Exxat One Lavender)
6. Import DS components — never recreate them

---

## Button

```ts
// variant: default | outline | secondary | ghost | destructive | link
// size:    default(h-9) | sm(h-8) | lg(h-10) | xs(h-6) | icon(36px) | icon-sm(32px) | icon-xs(24px) | icon-lg(40px)
```

| Variant | Use for |
|---------|---------|
| `default` | Primary CTA — one per view |
| `outline` | Secondary action beside a primary |
| `ghost` | Toolbar, icon actions, row actions |
| `secondary` | Tertiary, low-emphasis |
| `destructive` | Delete / danger |

**Icon-only button:**
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon-sm" aria-label="Delete">
      <i className="fa-light fa-trash-can" aria-hidden="true" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Delete</TooltipContent>
</Tooltip>
```

**Split button:**
```tsx
<div style={{ display: 'flex' }}>
  <Button variant="default" style={{ borderRadius: '7px 0 0 7px' }}>Add Question</Button>
  <Button variant="default" style={{ borderRadius: '0 7px 7px 0', borderLeft: '1px solid var(--qb-split-divider)', paddingInline: 8 }}>
    <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 10 }} />
  </Button>
</div>
```

---

## Badge

```ts
// variant: default | secondary | destructive | outline | ghost | link
```

| Variant | Use for |
|---------|---------|
| `default` | Count badges, high-emphasis (dark bg) |
| `secondary` | Role, type, metadata (muted bg) — most common |
| `destructive` | Error / rejected state |
| `outline` | Low-emphasis label, no fill |

**Custom color override:**
```tsx
<Badge variant="secondary" style={{ backgroundColor: 'var(--token-bg)', color: 'var(--token-fg)' }}>
  Label
</Badge>
```

**Shape overrides:** `className="rounded"` → 4px rect · `className="rounded-full"` → pill

---

## DropdownMenu

```ts
// DropdownMenuContent: align(start|center|end) — always set className="w-44" (or w-48, w-56) to fix width
// DropdownMenuItem: variant(default|destructive) inset(boolean)
```

**Row actions (⋯):**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon-sm" aria-label="Row actions">
      <i className="fa-regular fa-ellipsis" aria-hidden="true" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-44">
    <DropdownMenuItem onClick={handleEdit}>
      <i className="fa-light fa-pen" aria-hidden="true" /> Edit
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive" onClick={handleDelete}>
      <i className="fa-light fa-trash-can" aria-hidden="true" /> Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## Sheet

```ts
// SheetContent: side(top|right|bottom|left) showCloseButton(true) showOverlay(true)
```

**Standard tray (full-height, with overlay):**
```tsx
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent side="right">
    <SheetHeader>
      <SheetTitle>Filter Questions</SheetTitle>
      <SheetDescription>Narrow the list.</SheetDescription>
    </SheetHeader>
    {/* body */}
    <SheetFooter>
      <Button onClick={onApply}>Apply</Button>
      <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

**Floating properties panel (no overlay, no close button):**
```tsx
<SheetContent
  side="right"
  showOverlay={false}
  showCloseButton={false}
  className="w-80 sm:max-w-80 p-0 gap-0 flex flex-col border border-border shadow-xl rounded-xl overflow-hidden"
  style={{ top: '0.5rem', bottom: '0.5rem', right: '0.5rem', height: 'calc(100vh - 1rem)' }}
>
  <SheetTitle className="sr-only">Properties</SheetTitle>
  {/* content */}
</SheetContent>
```

---

## Dialog

```ts
// DialogContent: showCloseButton(true) className(sm:max-w-sm default)
// DialogFooter:  showCloseButton(false) — adds "Close" outline button when true
```

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogDescription>This cannot be undone.</DialogDescription>
    </DialogHeader>
    {/* body */}
    <DialogFooter showCloseButton>
      <Button variant="destructive" onClick={handleDelete}>Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

→ `DialogTitle` is required — add `className="sr-only"` if visually hidden.

---

## Popover

```ts
// PopoverContent: align(start|center|end) side(top|right|bottom|left) sideOffset(4)
```

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon-sm" aria-label="Version history">
      <i className="fa-light fa-clock-rotate-left" aria-hidden="true" />
    </Button>
  </PopoverTrigger>
  <PopoverContent align="end" className="w-72 p-3">
    {/* content */}
  </PopoverContent>
</Popover>
```

---

## Tooltip

```ts
// TooltipProvider must exist at root (already in app-sidebar.tsx — don't add a second)
// delayDuration defaults to 0
```

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon-sm" aria-label="Filter">
      <i className="fa-light fa-sliders" aria-hidden="true" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Filter</TooltipContent>
</Tooltip>
```

---

## Tabs

```ts
// TabsList: variant(default|line)   Tabs: orientation(horizontal|vertical)
```

```tsx
{/* Pill tabs (default) */}
<TabsList>
  <TabsTrigger value="all">All Questions</TabsTrigger>
  <TabsTrigger value="my">My Questions</TabsTrigger>
</TabsList>

{/* Line tabs (underline indicator) */}
<TabsList variant="line">
  <TabsTrigger value="overview">Overview</TabsTrigger>
</TabsList>
```

---

## Checkbox

```ts
// checked: boolean | 'indeterminate'   onCheckedChange: (checked) => void
```

```tsx
{/* Select-all indeterminate */}
<Checkbox
  checked={selected.length === 0 ? false : selected.length === total ? true : 'indeterminate'}
  onCheckedChange={checked => setSelected(checked ? allIds : [])}
  aria-label="Select all"
/>
```

---

## Select

```ts
// SelectTrigger: size(default=h-8 | sm=h-7) — default is w-fit, add className="w-[180px]" to fix width
// SelectContent: position(item-aligned|popper) align(center)
```

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select difficulty…" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="easy">Easy</SelectItem>
    <SelectItem value="medium">Medium</SelectItem>
    <SelectItem value="hard">Hard</SelectItem>
  </SelectContent>
</Select>
```

---

## Input / InputGroup

```ts
// InputGroupAddon: align(start|end|inline-start|inline-end)
// Use InputGroupInput (NOT Input) inside InputGroup — Input has its own border which creates double-border
```

```tsx
{/* Plain input — always pair with Label */}
<div className="flex flex-col gap-1.5">
  <Label htmlFor="title">Question Title</Label>
  <Input id="title" placeholder="Enter title…" />
</div>

{/* Search with left icon */}
<InputGroup>
  <InputGroupAddon align="inline-start">
    <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
  </InputGroupAddon>
  <InputGroupInput placeholder="Search…" />
</InputGroup>
```

---

## Field (form field wrapper)

```ts
// orientation: vertical(default) | horizontal | responsive
// FieldError.errors: Array<{ message?: string } | undefined> — NOT a string[]
```

```tsx
<Field orientation="vertical">
  <FieldLabel htmlFor="stem">Question Stem</FieldLabel>
  <FieldDescription>Write a clear, concise question.</FieldDescription>
  <Textarea id="stem" />
  <FieldError errors={[formState.errors.stem]} />
</Field>
```

---

## Sidebar

```ts
// useSidebar(): { state('expanded'|'collapsed'), open, setOpen, toggleSidebar, isMobile }
```

**Required shell:**
```tsx
<SidebarProvider className="h-svh">          {/* h-svh REQUIRED — layout breaks without it */}
  <Sidebar variant="inset" collapsible="icon"> {/* variant="inset" REQUIRED — for rounded corners */}
    <SidebarHeader>…</SidebarHeader>
    <SidebarContent>…</SidebarContent>
    <SidebarFooter>…</SidebarFooter>
  </Sidebar>
  <SidebarInset className="flex flex-col overflow-hidden">
    {children}
  </SidebarInset>
</SidebarProvider>
```

→ `⌘B` / `Ctrl+B` sidebar toggle is wired automatically by `SidebarProvider`.
→ `toggleSidebar()` controls the MAIN sidebar only — QB library panel is a separate `<aside>`.
