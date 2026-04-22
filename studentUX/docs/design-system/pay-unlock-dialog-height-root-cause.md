# Root Cause: Pay Unlock Dialog Height Not Changing

## Symptoms

- Dialog height stays full/tall instead of respecting `h-[60vh] max-h-[60vh]`
- Sticky header/footer/cost section and scrollable cards area don't behave as expected

## Root Cause Analysis

### 1. Tailwind Arbitrary Value Classes May Not Apply (Primary)

The Pay Unlock dialog passes `h-[60vh] max-h-[60vh]` via `className` to `DialogContent`. Possible reasons these don't take effect:

| Factor | Explanation |
|--------|-------------|
| **Tailwind v4 content scanning** | Arbitrary values like `h-[60vh]` are generated when the build scans the file. If the scan path or content config excludes `pay-unlock-dialog.tsx`, the class may not be emitted. |
| **Class merge order** | `cn(base, className)` merges base dialog classes with our `className`. The base has `grid`; we override with `!flex`. For `height`, the base has none; we add `h-[60vh]`. No conflict—but if the class isn't in the output CSS, it won't apply. |
| **Specificity** | No inline styles or higher-specificity rules found on Radix Dialog or our components that would override height. |

### 2. Base DialogContent Layout (Secondary)

`DialogContent` base classes include:

- `display: grid` — grid rows size to content by default (`grid-auto-rows: auto`)
- `gap-4`, `p-6` — padding and gaps
- No `height` or `max-height` — height is content-driven

We override with `!flex flex-col` so layout becomes flex. But if `h-[60vh]` isn't applied, the container stays content-sized.

### 3. Radix Dialog

- Radix does **not** inject inline `height` or `maxHeight` on `DialogContent`
- Content is portaled to `document.body`; `fixed` positioning uses `top: 50%; left: 50%; transform: translate(-50%, -50%)` for centering

## Fix Applied

**Use inline `style` to force height** — bypasses Tailwind and any class-ordering issues:

```tsx
<DialogContent
  className="max-w-[min(28rem,calc(100%-2rem))] !flex flex-col overflow-hidden gap-4"
  style={{ height: "60vh", maxHeight: "60vh" }}
  ...
>
```

If the dialog now respects 60vh height, the root cause was Tailwind classes not applying. If it still doesn't, the issue is elsewhere (e.g. parent or layout).

## Next Steps (If Inline Style Works)

1. Investigate why `h-[60vh] max-h-[60vh]` weren't applied — check Tailwind content config, build output, and whether the classes appear in the compiled CSS.
2. Optionally add a `maxHeight` or `height` prop to `DialogContent` in `dialog.tsx` for dialogs that need constrained height.
3. Keep the inline style as a fallback if Tailwind arbitrary values remain unreliable for this component.
