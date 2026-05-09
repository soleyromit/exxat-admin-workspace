# Modal Focus Trap + Restore

**Question answered:** When a modal opens, how do we trap focus inside until close, and restore it to the opener afterwards?

**Pattern ID:** `A11Y-PATTERN-003`
**Binds rules:** A11Y-018 (raw `<div role="dialog">` BANNED); DS-001/DS-010 (use DS Dialog/Sheet/Drawer); WCAG 2.1.2 No Keyboard Trap; WCAG 2.4.3 Focus Order

## The DS handles this for you

DS `Dialog`, `Sheet`, `Drawer`, `Popover` (when modal) from `@exxat-ds/ui` are built on Radix primitives that:
- Move focus to the dialog content on open (or first focusable inside)
- Trap Tab/Shift+Tab within the dialog
- Restore focus to the opener `<button>` on close (the element that triggered the open)
- Close on Escape
- Close on click outside (when modal)

**Use them.** Never reach for `<div role="dialog">`.

## Anatomy (DS-correct)

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@exxat/ds/packages/ui/src'

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button variant="default">Add accommodation</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add accommodation</DialogTitle>
    </DialogHeader>
    {/* form */}
    <DialogClose asChild>
      <Button variant="outline">Cancel</Button>
    </DialogClose>
  </DialogContent>
</Dialog>
```

Focus flow:
- Click trigger → focus moves to first focusable inside DialogContent (usually first input)
- Tab cycles through dialog content; Shift+Tab cycles back
- Escape OR DialogClose → focus restored to the trigger button

## Critical: DialogTitle is required

Even when visually hidden:

```tsx
<DialogTitle className="sr-only">Add accommodation</DialogTitle>
```

Screen readers announce the title when focus enters; without it, the dialog is "unnamed" and users get no orientation.

## Anti-patterns

- ❌ Raw `<div role="dialog">` — A11Y-018 hard ban
- ❌ Custom focus management (you'll get one of the 5 edge cases wrong)
- ❌ DialogTitle missing or empty
- ❌ Closing the dialog without restoring focus (DS handles this; only matters if you bypass)
- ❌ `tabIndex={-1}` on the `DialogContent` itself (Radix manages this)
- ❌ Multi-modal stacks (open dialogs A, B, C simultaneously) — keep depth ≤ 1, or use a single multi-step flow

## Sheet vs Dialog vs Drawer

| Pattern | When | Focus behavior |
|---|---|---|
| `Dialog` | Confirm / quick form / single-purpose | Modal; full focus trap |
| `Sheet` | Full-height tray, side-mounted | Modal by default; focus trap (set `showOverlay={false}` for non-modal floating panels — but those are NOT focus-trapped, by design) |
| `Drawer` | Bottom-anchored mobile primary | Modal; focus trap |

If you set `showOverlay={false}` on a Sheet (the floating-properties-panel pattern), you've intentionally made it non-modal — focus is NOT trapped. That's correct for non-blocking floating panels. Don't pretend it's a dialog.

## Verification

1. Click the trigger button
2. Tab around — focus should never leave the dialog content
3. Shift+Tab from first element → wraps to last
4. Press Escape → focus returns to the trigger button (keyboard-only check)
5. Screen reader announces the DialogTitle on open

## See also

- DESIGN.md A11Y-018, DS-001, DS-010
- Radix Dialog docs: https://www.radix-ui.com/primitives/docs/components/dialog
- W3C WAI-ARIA APG, Modal pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
