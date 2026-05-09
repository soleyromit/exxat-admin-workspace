# Non-Drag Alternative for Drag Operations

**Question answered:** How does a keyboard-only user, motor-impaired user, or touch user with limited fine motor control reorder/move items that are normally drag-and-drop?

**Pattern ID:** `A11Y-PATTERN-007`
**Binds rules:** A11Y-015; WCAG 2.5.7 Dragging Movements (Level AA, **NEW in WCAG 2.2**)

## When to use

Anywhere drag-and-drop is the primary affordance:
- Question Bank folder tree reorder (DragHandleGrip)
- Kanban board card movement
- Skills Checklist procedure reorder (when scaffolded)
- Assessment builder section reorder
- Tab reorder

WCAG 2.2 made this AA-level mandatory. Drag-only is no longer compliant.

## The required alternative — DropdownMenu pattern

```tsx
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@exxat/ds/packages/ui/src'
import { DragHandleGrip } from '@exxat/ds/packages/ui/src'

<div className="flex items-center gap-2">
  <DragHandleGrip aria-hidden="true" />  {/* mouse drag affordance */}
  <span>{item.label}</span>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label={`Move ${item.label}`}>
        <i className="fa-light fa-ellipsis-vertical" aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-40">
      <DropdownMenuItem onClick={() => moveUp(item.id)} disabled={isFirst}>
        <i className="fa-light fa-arrow-up" aria-hidden="true" />
        Move up
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => moveDown(item.id)} disabled={isLast}>
        <i className="fa-light fa-arrow-down" aria-hidden="true" />
        Move down
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => openMoveToDialog(item.id)}>
        <i className="fa-light fa-arrows-up-down" aria-hidden="true" />
        Move to…
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

## Alternative — keyboard arrow-key reorder

For lists where moving with menu is too verbose:

```tsx
<li
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'ArrowUp' && e.altKey) { e.preventDefault(); moveUp(item.id) }
    if (e.key === 'ArrowDown' && e.altKey) { e.preventDefault(); moveDown(item.id) }
  }}
  aria-label={`${item.label}. Press Alt+Up or Alt+Down to reorder.`}
>
  ...
</li>
```

`Alt+Arrow` is the convention (matches Notion, Linear, etc.). Pure arrow keys conflict with focus navigation.

## Across columns / containers (kanban)

```tsx
<DropdownMenuItem onClick={() => openMoveToDialog(item.id)}>
  Move to…  {/* opens Dialog with column picker */}
</DropdownMenuItem>
```

The Move-to dialog is a `Combobox` (DS) with the columns as options.

## Anti-patterns

- ❌ Drag-only kanban board — A11Y-015 violation
- ❌ DropdownMenu trigger that's icon-only without `aria-label` — A11Y-001 violation
- ❌ Reorder that doesn't announce the move — pair with `aria-live` (see live-region pattern)
- ❌ Keyboard reorder using bare arrow keys (conflicts with row focus navigation)
- ❌ Disabled "Move up" without indication for first item (use `disabled` + the dropdown closes; visible state)
- ❌ `DragHandleGrip` left as the only affordance with no menu / keys

## Announce the move

After a successful reorder, surface a polite live-region update:

```tsx
const [announcement, setAnnouncement] = useState('')

function moveUp(id: string) {
  // ... actually reorder
  setAnnouncement(`${item.label} moved up. Now position ${newPosition} of ${total}.`)
  setTimeout(() => setAnnouncement(''), 2000)
}

return (
  <>
    <div role="status" aria-live="polite" className="sr-only">
      {announcement}
    </div>
    {/* list */}
  </>
)
```

## Verification

1. Tab to the menu trigger button on a draggable item → focus visible
2. Open menu (Enter or Space) → "Move up" / "Move down" / "Move to…" available
3. Activate "Move up" → focus stays on the trigger, item moves, screen reader announces "moved up. Now position N of M."
4. Repeat: Alt+ArrowUp / Alt+ArrowDown should also work
5. First item: "Move up" disabled (visually + announced via `aria-disabled`)

## See also

- DESIGN.md A11Y-015, A11Y-001, A11Y-013
- W3C WCAG 2.5.7: https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements
- WCAG 2.2 What's New: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/
