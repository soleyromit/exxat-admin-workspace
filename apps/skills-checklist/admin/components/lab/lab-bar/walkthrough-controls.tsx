"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@exxatdesignux/ui/components/ui/tooltip"
import { useShortcut } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { UserMenu } from "@/components/shell/user-menu"
import { withNoun } from "@/lib/lab/terms"
import { toLong } from "@/lib/short-urls"
import { WALKTHROUGH_EXIT, isWalkthrough, walkthroughPaths, walkthroughPosition, walkthroughStart } from "@/lib/lab/walkthrough"
import { useLabPage } from "./page-context"
import { usePresent } from "./present"
import { startAgain } from "./reset"
import { WALKTHROUGH_STEPS_SHORTCUT, focusWalkthroughBar, takeFocusOnShow, toggleWalkthroughSteps, useWalkthroughStepsShown } from "./walkthrough-visibility"

/**
 * True on a walkthrough step in present mode. Reads only the route and the URL (no router), so lab labels such as the Sample data
 * chip can hide themselves in any component, including ones rendered in tests without a Next app router.
 */
export function useInWalkthrough(): boolean {
  const page = useLabPage()
  const pathname = usePathname() ?? ""
  const [, lab, a, b] = toLong(pathname).split("/")
  const flow = page.flow ?? (lab === "lab" && a === "flow" ? b : undefined)
  // A walkthrough is always presented, with or without `present=1` in its short URL.
  return isWalkthrough(flow)
}

/** The walkthrough step the page is on, in present mode only (outside present mode the lab bar does the job). */
export function useWalkthrough() {
  const page = useLabPage()
  const params = useSearchParams()
  const { present } = usePresent()
  return React.useMemo(() => (present ? walkthroughPosition(page.flow, page.step, params) : undefined), [present, page.flow, page.step, params])
}

const chevron = (dir: "left" | "right") => <i className={`fa-light fa-chevron-${dir}`} aria-hidden="true" />

/** Moves focus to the user menu's avatar when the bar it sat in goes away, so the keyboard user is not left on the body. */
function focusMenuTrigger() {
  window.requestAnimationFrame(() => document.querySelector<HTMLElement>("[data-walkthrough-menu-trigger]")?.focus())
}

/** The shortcut that shows or hides the path bar, bound while a walkthrough step is on screen (WALKTHROUGH_STEPS_SHORTCUT). */
function WalkthroughShortcut() {
  useShortcut(WALKTHROUGH_STEPS_SHORTCUT, () => {
    const inBar = !!document.activeElement?.closest("[data-lab-walkthrough]")
    toggleWalkthroughSteps()
    if (inBar) focusMenuTrigger()
  })
  return null
}

/**
 * The end of the utility bar on a walkthrough step: the path bar when the presenter has turned it on, then the product's user menu,
 * which holds "Show walkthrough steps" (D-L139 amended, 2026-11-11). By default the path bar is not rendered at all: the page looks
 * like the plain product, with nothing in the DOM or the tab order where the bar was. `placement="row"` is the frame with no utility
 * bar (WalkthroughRow): the bar only, no user menu.
 */
export function WalkthroughControls({ placement = "bar" }: { placement?: "bar" | "row" }) {
  const w = useWalkthrough()
  const shown = useWalkthroughStepsShown()
  if (!w) return null
  if (placement === "row") return shown ? <PathBar w={w} /> : null
  return (
    <div className="ms-auto flex min-w-0 shrink-0 items-center gap-1" data-walkthrough-controls>
      <WalkthroughShortcut />
      {shown ? <><PathBar w={w} /><span aria-hidden="true" className="mx-1 h-5 w-px bg-border" /></> : null}
      <UserMenu walkthroughSteps={{ shown }} />
    </div>
  )
}

/**
 * The path bar of a walkthrough (D-L64): "Admin walkthrough", Back, the page's name, "N of M", Next, Exit. Nothing else: no persona, flow,
 * variant, score or scenario. It sits at the end of the utility bar, so it reads as tooling around the product rather than a step rail on
 * the page (D-L42). The page's own buttons still lead on. Next is a link, so Assign's unsaved-changes guard catches it.
 */
function PathBar({ w }: { w: NonNullable<ReturnType<typeof useWalkthrough>> }) {
  // Turned on by the presenter (menu or shortcut): focus moves to the bar, on its first control that can take it.
  React.useEffect(() => {
    if (takeFocusOnShow()) focusWalkthroughBar()
  }, [])
  // The configure pages hang off the Library: the bar reads the stop the admin is on, not a word from the old path (W4).
  const stop = w.step.screen === "admin/configure-skill" && w.step.after ? w.flow.steps.find((s) => s.id === w.step.after) ?? w.step : w.step
  const name = withNoun(stop.label)
  return (
    <div role="group" aria-label={w.flow.title} data-lab-chrome data-lab-walkthrough className="flex min-w-0 shrink-0 items-center gap-1">
      <span className="hidden whitespace-nowrap px-1 text-sm text-muted-foreground min-[75rem]:inline" data-walkthrough-title>{w.flow.title}</span>
      {w.prev ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon-sm" aria-label={`Back: ${withNoun(w.prev.step.label)}`}>
              <Link href={w.prev.href} data-walkthrough-prev>{chevron("left")}</Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{withNoun(w.prev.step.label)}</TooltipContent>
        </Tooltip>
      ) : (
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Back" disabled data-walkthrough-prev>{chevron("left")}</Button>
      )}
      <span className="flex items-baseline gap-2 px-1 text-sm" aria-current="step" data-walkthrough-position>
        <span className="hidden max-w-64 truncate font-medium text-foreground lg:inline" data-walkthrough-name>{name}</span>
        <span className="whitespace-nowrap tabular-nums text-muted-foreground">{`${w.index} of ${w.total}`}</span>
      </span>
      {w.next ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon-sm" aria-label={`Next: ${withNoun(w.next.step.label)}`}>
              <Link href={w.next.href} data-walkthrough-next>{chevron("right")}</Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{withNoun(w.next.step.label)}</TooltipContent>
        </Tooltip>
      ) : (
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Next" disabled data-walkthrough-next>{chevron("right")}</Button>
      )}
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" data-walkthrough-exit>
            Exit
            <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} data-lab-chrome>
          {walkthroughPaths().filter((p) => p.id !== w.flow.id).map((p) => (
            <DropdownMenuItem key={p.id} asChild><Link href={p.href} data-walkthrough-path={p.id}>{p.title}</Link></DropdownMenuItem>
          ))}
          <DropdownMenuItem asChild><Link href={WALKTHROUGH_EXIT} data-walkthrough-variants>All variants</Link></DropdownMenuItem>
          <DropdownMenuItem onSelect={() => startAgain(walkthroughStart(w.flow.id) ?? "/")} data-walkthrough-restart>Start again</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/** The same path bar on a page whose frame has no utility bar to hold it: a focus workflow (Log a skill), the evaluator's light frame. */
export function WalkthroughRow() {
  const w = useWalkthrough()
  const shown = useWalkthroughStepsShown()
  if (!w) return null
  // No user menu on these frames (the evaluator has no account, Log a skill is a focus workflow): the shortcut is the only way back.
  // Hidden, the row reserves no height.
  return (
    <>
      <WalkthroughShortcut />
      {/* A marker for the route smoke (scripts/lab-route-smoke.mjs): hidden, it takes no space and no focus. */}
      <span hidden data-walkthrough-controls />
      {shown ? <div className="flex h-11 items-center justify-end px-3" data-walkthrough-row><WalkthroughControls placement="row" /></div> : null}
    </>
  )
}
