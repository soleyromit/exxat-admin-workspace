# Exxat DS — Horizontal scroll controls

**Audience:** humans + AI agents. **Binding rule:** [`.cursor/rules/exxat-horizontal-scroll.mdc`](../../.cursor/rules/exxat-horizontal-scroll.mdc).

When a row of tabs, breadcrumbs, or chips overflows its container, Exxat DS uses a **shared scroll control** — not ad-hoc chevrons on each side of the bar.

---

## Primitives

| Export | Package path | App re-export |
|---|---|---|
| `HorizontalScrollControls` | `@exxatdesignux/ui/components/ui/horizontal-scroll-controls` | `@/components/ui/horizontal-scroll-controls` |
| `HorizontalScrollRegion` | `@exxatdesignux/ui/components/ui/horizontal-scroll-region` | `@/components/ui/horizontal-scroll-region` |
| `useHorizontalScrollAffordances` | same as controls | same |
| `useHorizontalScrollAlignEnd` | same as controls | same |
| `horizontalScrollViewportClassName` | same as controls | same |

**Source:** `packages/ui/src/components/ui/horizontal-scroll-controls.tsx`, `horizontal-scroll-region.tsx`.

---

## Mental model

```
┌─────────────────────────────────────────────────────────────┐
│  [ scrollable viewport — tabs / crumbs / chips ]  [ ← | → ] │  group-end (default)
└─────────────────────────────────────────────────────────────┘
```

- **Grouped control (default):** one segmented `[← | →]` button after the viewport (`controlsLayout="group-end"`).
- **Split (legacy):** prev before content, next after — only when product explicitly needs flanking chevrons.
- **Overflow detection:** `ResizeObserver` + scroll listener; controls render **only when** content overflows.

---

## `HorizontalScrollRegion` (preferred)

High-level wrapper — viewport + controls when needed.

```tsx
<HorizontalScrollRegion
  ariaLabel="Views"
  controlsLayout="group-end"  // default
  alignEnd={false}            // true for breadcrumb trails
>
  {children}
</HorizontalScrollRegion>
```

| Prop | Default | Use |
|---|---|---|
| `ariaLabel` | `"Scroll"` | Prefix for prev/next `aria-label`s |
| `controlsLayout` | `"group-end"` | `"split"` \| `"group-end"` \| `"group-start"` |
| `alignEnd` | `false` | Pin scroll to trailing edge when content grows (SiteHeader breadcrumbs) |
| `scrollClassName` | — | Extra classes on the viewport |

---

## `HorizontalScrollControls` (compose your own)

When the scroll viewport is not a simple sibling row (custom chrome, nested layout):

```tsx
const ref = useRef<HTMLDivElement>(null)
const { canScrollLeft, canScrollRight, scrollPrev, scrollNext } =
  useHorizontalScrollAffordances(ref)

return (
  <div className="flex min-w-0 items-center gap-1.5">
    <div ref={ref} className={horizontalScrollViewportClassName}>
      {/* overflow content */}
    </div>
    <HorizontalScrollControls
      ariaLabel="My row"
      layout="group"
      canScrollLeft={canScrollLeft}
      canScrollRight={canScrollRight}
      onScrollPrev={scrollPrev}
      onScrollNext={scrollNext}
    />
  </div>
)
```

`layout`: `"group"` (segmented pair) \| `"split-prev"` \| `"split-next"`.

---

## Where it ships today

| Surface | Reference | Notes |
|---|---|---|
| Hub view tabs | `packages/ui/src/components/templates/list-page.tsx` | `controlsLayout="group-end"` |
| Record section tabs | `packages/ui/src/components/ui/tabs.tsx` (`TabsListScrollRegion`) | same |
| SiteHeader breadcrumbs | `apps/web/components/page-breadcrumb-trail.tsx` | `alignEnd` + grouped control |

---

## Accessibility

- Controls sit in a **`role="group"`** with `aria-label="{ariaLabel} scroll"`.
- Each chevron is a **`Button`** with `aria-label="{ariaLabel} — previous|next"` and a matching **`Tip`**.
- Viewport hides scrollbars visually but remains keyboard-scrollable (`overflow-x-auto`).
- Do **not** rely on scroll alone — always expose prev/next when overflow is detected.

---

## MUST NOT

- Hand-build paired chevrons per surface when `HorizontalScrollRegion` or `HorizontalScrollControls` fits.
- Place prev/next on **both ends** of a tab bar unless `controlsLayout="split"` is an explicit product requirement.
- Use raw `localStorage` or one-off scroll state — use the shared hook.

---

## See also

- [`.cursor/rules/exxat-tabs-chrome.mdc`](../../.cursor/rules/exxat-tabs-chrome.mdc) — hub view tabs use `ListPageTemplate` toolbar inside a scroll region
- [`.cursor/rules/exxat-breadcrumbs-no-back.mdc`](../../.cursor/rules/exxat-breadcrumbs-no-back.mdc) — breadcrumb trail + scroll
- [`reference-implementations.md`](./reference-implementations.md) — Hub chrome row
