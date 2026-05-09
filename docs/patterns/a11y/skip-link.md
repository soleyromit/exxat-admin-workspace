# Skip to Main Content Link

**Question answered:** How does a keyboard user bypass nav/sidebar/header to reach page content with a single keystroke?

**Pattern ID:** `A11Y-PATTERN-001`
**Binds rules:** A11Y-012 (mandatory in admin layouts); WCAG 2.4.1 Bypass Blocks (Level A)

## When to use

Every admin `app/(app)/layout.tsx` and student layout MUST include a skip-to-main link as the first focusable element.

## Anatomy

```tsx
<body>
  <a
    href="#main"
    className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:px-3 focus:py-1.5 focus:rounded-md focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring"
  >
    Skip to main content
  </a>
  <SidebarProvider>
    <Sidebar>...</Sidebar>
    <SidebarInset>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </SidebarInset>
  </SidebarProvider>
</body>
```

Key points:
- Visually hidden with `sr-only` until focused, then `not-sr-only` reveals it
- `tabIndex={-1}` on `<main>` so the link can move focus to it programmatically
- High z-index so it appears over sticky chrome when revealed
- Uses DS focus ring tokens

## Anti-patterns

- ❌ Hidden with `display: none` (not focusable)
- ❌ Inside the `<Sidebar>` (defeats the purpose — already past nav)
- ❌ Pointing to `#content` when no element has `id="content"`
- ❌ Multiple skip links per page (one is enough; complicates focus order)
- ❌ Wired to a div without `tabIndex={-1}` (focus won't land)

## Verification

1. Tab once on a fresh page load → skip link appears in top-left
2. Press Enter → focus moves to the main content area
3. Tab again → focus is on the first interactive element inside `<main>`, not back at the sidebar

## See also

- DESIGN.md A11Y-012
- W3C WCAG 2.4.1: https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks
