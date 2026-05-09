# Focus Not Obscured by Sticky Chrome

**Question answered:** When a user keyboard-navigates down a page with a sticky header / FloatingActionBar / sticky table header, how do we ensure the focused element isn't hidden behind the sticky chrome?

**Pattern ID:** `A11Y-PATTERN-008`
**Binds rules:** A11Y-016; WCAG 2.4.11 Focus Not Obscured (Minimum) (Level AA, **NEW in WCAG 2.2**)

## When this matters

- Tables with sticky `<TableHeader>` — focused row can hide under it
- Admin pages with sticky page header — focused element on tab can scroll behind it
- `FloatingActionBar` at bottom — focused button can hide behind action bar
- Modal stacks — focused element under a modal overlay
- Sidebar collapse animations — focus can land mid-collapse

## The fix — `scroll-padding`

Browser-native, zero JS:

```css
/* On the scroll container */
.scroll-container {
  scroll-padding-top: var(--sticky-header-height);  /* e.g., 60px */
  scroll-padding-bottom: var(--floating-action-bar-height);  /* e.g., 80px when present */
}

/* Or on <html> for full-page scrolling */
html {
  scroll-padding-top: 60px;
  scroll-padding-bottom: 80px;  /* when action bar present */
}
```

When `Tab` moves focus to an element that triggers `scrollIntoView` (browsers do this automatically on Tab), the browser uses scroll-padding to keep the focus target away from sticky edges.

## Per-route scroll padding (Next.js)

```tsx
// app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>...</Sidebar>
      <SidebarInset
        style={{
          // header height + bottom action bar (if rendered conditionally)
          scrollPaddingTop: '60px',
          scrollPaddingBottom: '80px',
        }}
      >
        <main id="main" tabIndex={-1}>{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

## With dynamic FloatingActionBar

When the action bar appears/disappears, update scroll-padding:

```tsx
const [hasFloatingBar, setHasFloatingBar] = useState(false)

<SidebarInset
  style={{
    scrollPaddingTop: '60px',
    scrollPaddingBottom: hasFloatingBar ? '80px' : '0',
  }}
>
  ...
</SidebarInset>
```

## Sticky table headers

DS `Table` with `<thead>` sticky:

```tsx
<div className="overflow-auto" style={{ scrollPaddingTop: '40px' }}>
  <Table>
    <TableHeader className="sticky top-0 bg-background z-10">
      ...
    </TableHeader>
    <TableBody>...</TableBody>
  </Table>
</div>
```

The `40px` matches the table header height.

## Modal stacks

Don't allow them. Per A11Y-018, modal depth ≤ 1. If you need multi-step, use a single Dialog with internal step navigation.

## Anti-patterns

- ❌ Sticky elements without scroll-padding adjustment
- ❌ Only fixing for `Tab` direction — Shift+Tab also needs scroll-padding (top fix covers both)
- ❌ Manual `el.scrollIntoView({ block: 'center' })` in onFocus handlers (fragile; fights browser's default; CSS scroll-padding is the right tool)
- ❌ Position-fixed footer that overlays content without setting `scroll-padding-bottom`
- ❌ Sticky table header that's not actually sticky (uses `position: relative` + `top`) — won't trigger scroll-padding

## Verification

1. Open a page with sticky header + a long form
2. Tab through the form rapidly
3. Confirm: every focused field is fully visible — none are tucked under the sticky header
4. Repeat with Shift+Tab going back up
5. With a FloatingActionBar visible: focused fields near the bottom should not hide behind it

## See also

- DESIGN.md A11Y-016
- W3C WCAG 2.4.11: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum
- WCAG 2.2 What's New: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
- MDN scroll-padding: https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding
