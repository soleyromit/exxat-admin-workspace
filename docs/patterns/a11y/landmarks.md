# Landmarks + Heading Hierarchy

**Question answered:** How does a screen reader user navigate the page structure (jump to nav, main, search, footer) and understand the content hierarchy?

**Pattern ID:** `A11Y-PATTERN-006`
**Binds rules:** A11Y-019 (heading hierarchy); A11Y-010 (alt text); WCAG 1.3.1 Info and Relationships, 2.4.6 Headings and Labels

## Required landmarks per route

```html
<body>
  <a href="#main">Skip to content</a>
  <header>
    <Sidebar /> or <TopNav />
  </header>
  <nav aria-label="Primary"> ... </nav>
  <main id="main" tabIndex={-1}>
    <h1>Page title</h1>
    {/* content */}
  </main>
  <aside aria-label="Properties"> ... </aside>  {/* if present */}
  <footer> ... </footer>
</body>
```

The semantic elements (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`) automatically expose ARIA landmarks. Don't add `role="navigation"` to a `<nav>` (redundant).

## Heading hierarchy rules

1. **Exactly one `<h1>` per route.** It's the page title.
2. **No heading level skipped.** `<h1>` → `<h2>` → `<h3>` — never `<h1>` → `<h3>`.
3. **Sidebar/nav headings are not counted in route hierarchy.** They live in `<nav>` and screen readers treat them separately when navigating by landmark.
4. **Section headings need a heading.** A `Card` with a title should use `<h2>` or `<h3>` for that title (depending on depth), not styled `<div>`.

## Multi-landmark routes

When a page has multiple of the same landmark, distinguish with `aria-label`:

```tsx
<nav aria-label="Primary">...</nav>
<nav aria-label="Pagination">...</nav>
<aside aria-label="Filters">...</aside>
<aside aria-label="Properties">...</aside>
```

## Anti-patterns

- ❌ Multiple `<h1>` on one route
- ❌ Heading level skipped (h2 → h4)
- ❌ Heading inside `<button>` (use `<button>` containing styled text instead)
- ❌ Visual headings as `<div>` (no semantic level; not exposed to landmark nav)
- ❌ `<main>` nested inside another `<main>` (only one per route)
- ❌ `<header>` in every Card (`<header>` is for top-level page header; cards use `<div>`)
- ❌ Adding `role="navigation"` to a `<nav>` (redundant; can confuse some screen readers)
- ❌ Skip link without matching `id="main"` target

## Verification

1. NVDA: press D (next landmark) → moves through header / nav / main / aside / footer in order
2. NVDA: press 1, 2, 3 (heading levels) → moves through h1, h2, h3 in route order
3. Confirm no skipped levels (h1 then h2; never h1 then h3)
4. Open landmarks list (NVDA Insert+F7) → see all named landmarks in route

## In Next.js App Router

Per-route `app/.../layout.tsx` controls header/nav/main wrapping. Per-route `page.tsx` controls h1 + section headings.

```tsx
// app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="...sr-only">Skip to content</a>
      <SidebarProvider>
        <Sidebar>...</Sidebar>  {/* Sidebar handles <nav> internally */}
        <SidebarInset>
          <main id="main" tabIndex={-1}>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </>
  )
}

// app/(app)/students/page.tsx
export default function StudentsPage() {
  return (
    <>
      <header>
        <h1>Students</h1>  {/* ONE h1 per route */}
      </header>
      <section>
        <h2>Active enrollment</h2>  {/* h2 follows h1 */}
        ...
      </section>
    </>
  )
}
```

## See also

- DESIGN.md A11Y-012, A11Y-019
- W3C WCAG 2.4.6: https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels
- W3C WAI-ARIA Landmarks: https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/
