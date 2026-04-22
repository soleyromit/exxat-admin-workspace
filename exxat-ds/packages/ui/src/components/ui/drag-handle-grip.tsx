import { cn } from "../../lib/utils"

/**
 * Solid grip icon for drag handles — use anywhere rows/cards reorder (dashboard, Properties, etc.).
 */
export function DragHandleGripIcon({ className }: { className?: string }) {
  return (
    <i className={cn("fa-solid fa-grip-dots-vertical shrink-0", className)} aria-hidden="true" />
  )
}
