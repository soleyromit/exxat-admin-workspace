import { cn } from "@/lib/utils"

/**
 * Shell utility-bar icon/text triggers — brand-tinted sidebar-accent hover,
 * not generic `interactive-hover` (muted grey). Matches sidebar chrome +
 * `icon-button-chrome` token rules in `globals.css`.
 *
 * Always include `rounded-md` here so Link-based hits (Back, Help) match
 * `Button` ghost / `icon-sm` hover shape. Do not invent a second radius on
 * the bar.
 */
export const utilityBarActionButtonClass =
  "rounded-md bg-transparent icon-button-chrome hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:bg-sidebar-accent aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-accent-foreground"

/**
 * Ask Leo launcher — the one AI affordance on the bar, so it rests as an
 * outlined brand chip instead of ghost chrome.
 *
 * `background-color` stays transparent in every slot below, and that is the
 * point of this class. A flat translucent tint was what made the launcher read
 * as a disabled control, and leaving the colour channel clear is also what stops
 * the ghost variant's dark grey from returning in dark mode.
 *
 * The chip is not bare, though: it carries a resting glow on its `::before`
 * (`--ask-leo-chip-glow`, in `globals.css`) that fades in once the halo has
 * played. That lives in CSS rather than here because it is a gradient keyed to
 * an animation state, and because `::before` can inherit the chip's corner —
 * which a sibling cannot. Ink is left to `icon-button-chrome` (the bar's own
 * foreground): brand pink as label text does not clear 4.5:1 here.
 *
 * Hover and open therefore move the border, not the fill. `data-leo-open` is set
 * by `AskLeoToggle` — Radix owns `data-state` on a tooltip trigger.
 *
 * Every slot below is restated under `dark:`, and that is load-bearing rather
 * than repetitive: the shared bar chrome carries `hover:bg-sidebar-accent` and
 * the ghost variant carries `dark:bg-interactive-hover-subtle`. A `dark:` rule
 * outranks a plain one in the cascade, so naming each slot here lets
 * `tailwind-merge` drop the grey outright instead of losing a specificity race
 * to it and re-filling the chip.
 */
export const askLeoLauncherChipClass = [
  "border-brand/45 bg-transparent dark:bg-transparent",
  "hover:border-brand/70 hover:bg-transparent dark:hover:bg-transparent",
  "focus-visible:bg-transparent dark:focus-visible:bg-transparent",
  "data-[leo-open]:border-brand data-[leo-open]:bg-transparent dark:data-[leo-open]:bg-transparent",
].join(" ")

export function utilityBarActionButtonClassName(...extra: Array<string | false | null | undefined>) {
  return cn(utilityBarActionButtonClass, ...extra)
}
