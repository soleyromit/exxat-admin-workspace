"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@exxatdesignux/ui/components/ui/tooltip"
import { withNoun } from "@/lib/lab/terms"
import { PRESENT_PARAM, isPresent } from "@/lib/lab/present"
import { WALKTHROUGH_EXIT, isWalkthrough, walkthroughPosition } from "@/lib/lab/walkthrough"
import { useLabPage } from "./page-context"
import { usePresent } from "./present"

/**
 * True on a walkthrough step in present mode. Reads only the route and the URL (no router), so lab labels such as the Sample data
 * chip can hide themselves in any component, including ones rendered in tests without a Next app router.
 */
export function useInWalkthrough(): boolean {
  const page = useLabPage()
  const params = useSearchParams()
  const pathname = usePathname() ?? ""
  const [, lab, a, b] = pathname.split("/")
  const flow = page.flow ?? (lab === "lab" && a === "flow" ? b : undefined)
  return isPresent(params?.get(PRESENT_PARAM)) && isWalkthrough(flow)
}

/** The walkthrough step the page is on, in present mode only (outside present mode the lab bar does the job). */
export function useWalkthrough() {
  const page = useLabPage()
  const params = useSearchParams()
  const { present } = usePresent()
  return React.useMemo(() => (present ? walkthroughPosition(page.flow, page.step, params) : undefined), [present, page.flow, page.step, params])
}

/**
 * The presenter control of a walkthrough: previous, "Step 3 of 5", next (Finish on the last step), Exit. It sits at the end of the
 * utility bar, so it never covers a page's sticky footer or the sidebar, and it is the only lab element on the page. No variant,
 * set, tier, build status, scenario, components drawer or sample label: the step count and the step's own product words only.
 */
export function WalkthroughControls() {
  const w = useWalkthrough()
  if (!w) return null
  const nextLabel = w.next ? `Next: ${withNoun(w.next.step.label)}` : "Finish the walkthrough"
  return (
    <div role="group" aria-label="Walkthrough" data-lab-chrome data-lab-walkthrough className="ms-auto flex shrink-0 items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          {w.prev ? (
            <Button asChild variant="ghost" size="icon-sm" aria-label={`Previous: ${withNoun(w.prev.step.label)}`}>
              <Link href={w.prev.href} data-walkthrough-prev><i className="fa-light fa-chevron-left" aria-hidden="true" /></Link>
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Previous" disabled data-walkthrough-prev>
              <i className="fa-light fa-chevron-left" aria-hidden="true" />
            </Button>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">{w.prev ? withNoun(w.prev.step.label) : "First step"}</TooltipContent>
      </Tooltip>
      <span className="px-1 text-sm tabular-nums text-muted-foreground" aria-current="step" data-walkthrough-position>{`Step ${w.index} of ${w.total}${w.optional ? ", optional" : ""}`}</span>
      {w.optional && w.next ? (
        // An optional step (Sankalp: groups of skills are "non mandatory"): Skip, in words, goes to the next step.
        <Button asChild variant="ghost" size="sm">
          <Link href={w.next.href} aria-label={`Skip to ${withNoun(w.next.step.label)}`} data-walkthrough-next data-walkthrough-skip>Skip</Link>
        </Button>
      ) : (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="ghost" size="icon-sm" aria-label={nextLabel}>
            <Link href={w.next ? w.next.href : WALKTHROUGH_EXIT} data-walkthrough-next><i className={w.next ? "fa-light fa-chevron-right" : "fa-light fa-check"} aria-hidden="true" /></Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{w.next ? withNoun(w.next.step.label) : "Finish"}</TooltipContent>
      </Tooltip>
      )}
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
      <Button asChild variant="ghost" size="sm">
        <Link href={WALKTHROUGH_EXIT} data-walkthrough-exit>Exit</Link>
      </Button>
    </div>
  )
}
