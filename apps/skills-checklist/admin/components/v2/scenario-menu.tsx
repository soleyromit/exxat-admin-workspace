"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { STEPS } from "@/lib/v2/scenario"
import { useV2State, useV2Store } from "@/lib/v2/react"

/** Scenario menu: jump to any of the 14 story steps, or reset the demo to its seed. */
export function ScenarioMenu() {
  const router = useRouter()
  const store = useV2Store()
  const state = useV2State()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const reviewed = Object.keys(state.stepsReviewed).length
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button ref={triggerRef} type="button" variant="outline" size="sm" className="gap-1.5">
            Scenario
            <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="max-h-[75vh] w-96 max-w-[calc(100vw-1rem)] overflow-y-auto">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            Story steps ({reviewed} of {STEPS.length} reviewed)
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STEPS.map((s) => (
            <DropdownMenuItem key={s.id} asChild className="min-h-10 gap-2">
              <Link href={s.route}>
                <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">{s.n}</span>
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                {s.id in state.stepsReviewed ? <i className="fa-solid fa-check text-xs text-(--brand-color)" aria-label="Reviewed" role="img" /> : null}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="min-h-10" onSelect={() => setConfirmOpen(true)}>
            Reset demo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          className="sm:max-w-md"
          onCloseAutoFocus={(e) => {
            // The menu item that opened this dialog unmounts with the menu, so return focus to the Scenario button.
            e.preventDefault()
            triggerRef.current?.focus()
          }}
        >
          <DialogHeader>
            <DialogTitle>Reset the demo data?</DialogTitle>
            <DialogDescription>
              Every change made in this browser goes back to the starting data for Harbor University BSN. Reviewed steps are cleared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" size="default" autoFocus onClick={() => setConfirmOpen(false)}>
              Keep my changes
            </Button>
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => {
                store.reset()
                setConfirmOpen(false)
                router.push("/v2?reset=1")
              }}
            >
              Reset demo data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
