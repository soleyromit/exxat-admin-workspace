import { cn } from "@/lib/utils"

/**
 * Shell utility-bar icon/text triggers — brand-tinted sidebar-accent hover,
 * not generic `interactive-hover` (muted grey). Matches sidebar chrome +
 * `icon-button-chrome` token rules in `globals.css`.
 */
export const utilityBarActionButtonClass =
  "bg-transparent icon-button-chrome hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:bg-sidebar-accent aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"

export function utilityBarActionButtonClassName(...extra: Array<string | false | null | undefined>) {
  return cn(utilityBarActionButtonClass, ...extra)
}
