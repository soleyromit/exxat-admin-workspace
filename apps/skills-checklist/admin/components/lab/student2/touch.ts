/** Touch height below the sm breakpoint; compact 32 px controls above it. */
export const TOUCH_ROW = "max-sm:min-h-(--control-height-touch)"

/**
 * One selected treatment for every choice on Send (Romit 2026-11-10: method cards and evaluator rows marked selection two ways):
 * a muted fill and a 1 px foreground outline, beside the visible radio. A bordered card draws the outline with its border; a row
 * inside a divided list draws it as an inset ring, so the list's own border never doubles.
 */
export const CHOICE_CARD = "rounded-lg border border-border hover:bg-muted/50 has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-muted has-[[data-disabled]]:hover:bg-transparent"
export const CHOICE_ROW = "hover:bg-muted/50 has-[[data-state=checked]]:bg-muted has-[[data-state=checked]]:ring-1 has-[[data-state=checked]]:ring-inset has-[[data-state=checked]]:ring-foreground has-[[data-disabled]]:hover:bg-transparent"
