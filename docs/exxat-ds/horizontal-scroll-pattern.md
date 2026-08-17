# Exxat DS — Horizontal scroll controls

**Audience:** humans + AI agents. **Binding rule:** [`.cursor/rules/exxat-horizontal-scroll.mdc`](../../.cursor/rules/exxat-horizontal-scroll.mdc).

When a row of tabs or chips overflows its container, Exxat DS uses a **shared scroll control** — not ad-hoc chevrons on each side of the bar.

**Breadcrumbs are not on this path.** A trail collapses its middle segments into More instead of scrolling, because scrolling hides the ancestors behind a gesture, and it does so on measured room rather than a crumb count. See [`.cursor/rules/exxat-breadcrumbs-no-back.mdc`](../../.cursor/rules/exxat-breadcrumbs-no-back.mdc).

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

## The edge fades, it does not cut

A clipped row ends mid-card, mid-label, or mid-chart, which reads as a rendering
fault rather than as "there is more this way". So `HorizontalScrollViewport`
writes `data-fade="start | end | both | none"` from its own scroll position and
one rule in `packages/ui/src/globals.css` masks that side to transparent over
`2rem`.

Three things follow from it being a **mask** and not a coloured gradient:

- It works on every surface. These rows sit on white cards, on brand-tinted
 washes, and on the page canvas, so a scrim painted in one of those colours
 would be wrong on the other two. A mask fades the content itself and lets
 whatever is behind show through, in light, dark, and both high-contrast themes.
- Only the side with content behind it fades, so a row nobody has scrolled keeps
 its first card crisp against the page margin.
- **Focus suppresses it.** A mask fades a focus ring along with the content it
 belongs to, so while keyboard focus is anywhere in the row (the row's own ring
 or any child's) nothing is masked.

You get this by using the primitive. Do not add a `::after` scrim or a
background-coloured fade of your own.

---

## `HorizontalScrollRegion` (preferred)

High-level wrapper — viewport + controls when needed.

```tsx
<HorizontalScrollRegion
  ariaLabel="Views"
  controlsLayout="group-end"  // default
  alignEnd={false}            // true when the newest item matters most
>
  {children}
</HorizontalScrollRegion>
```

| Prop | Default | Use |
|---|---|---|
| `ariaLabel` | `"Scroll"` | Prefix for prev/next `aria-label`s |
| `controlsLayout` | `"group-end"` | `"split"` \| `"group-end"` \| `"group-start"` |
| `alignEnd` | `false` | Pin scroll to trailing edge when content grows |
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
| Record section tabs | `packages/ui/src/components/ui/tabs.tsx` (`TabsList`, built in) | same |
| SiteHeader breadcrumbs | `apps/web/components/page-breadcrumb-trail.tsx` | **Not scrolled.** Middle segments collapse into More on measured room |

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
