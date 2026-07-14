# Exxat DS: Button pattern

**Audience:** engineers + AI agents. **Binding rule:** [`.cursor/rules/exxat-accessibility.mdc`](../../.cursor/rules/exxat-accessibility.mdc) (icon labels, touch targets).

`Button` is the primary action control: one clear CTA per surface, with secondary, ghost, destructive, and link variants for hierarchy.

**Job:** Trigger a single intentional action with correct visual weight and an accessible name.

---

## When to use

| Scenario | Variant | Example |
|----------|---------|---------|
| Primary page or footer CTA | `default` | Save placement, Continue |
| Secondary / cancel path | `outline` or `secondary` | Cancel, Back |
| Irreversible delete trigger | `destructive` | Delete student (pairs with Dialog) |
| Toolbar tertiary action | `ghost` | Export, Filter |
| Inline text action | `link` | View all, Learn more |
| Icon-only control | `icon-sm` / `icon` + `aria-label` | Close, overflow menu trigger |
| Route navigation styled as button | `asChild` + `Link` | Open record |

---

## MUST requirements

- **MUST** ship one `default` (filled) primary per surface (P3).
- **MUST** use specific verb + object labels (`Save placement`, not `Submit`).
- **MUST** pair icon-only buttons with `aria-label` and `Tip` (Case C).
- **MUST** meet 24×24 CSS px touch target on icon-only sizes.
- **MUST NOT** use Button for persistent on/off. Use `ToggleSwitch`.
- **MUST NOT** toast on click. Use inline status, banner, or dialog per exxat-no-toast.

## MUST NOT anti-patterns

- Multiple filled primaries on one row.
- Strip ghost resting background to mimic plain text. Use `link` variant.
- Generic labels (`OK`, `Submit`, `Click here`).
- `span role="button"` instead of native `button`.

---

## Composition example

```tsx
<PageHeader
  actions={
    <>
      <Button variant="outline">Cancel</Button>
      <Button>Save placement</Button>
    </>
  }
/>

<Tooltip>
  <TooltipTrigger asChild>
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Export roster"
    >
      <i className="fa-light fa-arrow-down-to-line" aria-hidden />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Export roster</TooltipContent>
</Tooltip>
```

---

## See also

- **Primitive:** [`packages/ui/src/components/ui/button.tsx`](../../packages/ui/src/components/ui/button.tsx)
- **Rule:** [`.cursor/rules/exxat-accessibility.mdc`](../../.cursor/rules/exxat-accessibility.mdc)
- **Related:** `toggle-switch`, `button-group`, `tip`, `dialog`
