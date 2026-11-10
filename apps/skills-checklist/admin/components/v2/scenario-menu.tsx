"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { STEPS } from "@/lib/v2/scenario"
import { ROLE_BY_ID, roleForPath } from "@/lib/v2/roles"
import { evaluatorChoicesForDemo } from "@/lib/v2/preceptor"
import { IDS } from "@/lib/v2/seed"
import { useV2State, useV2Store } from "@/lib/v2/react"
import { setDevice, simulateServerEdit } from "@/lib/v2/sync"

const EVALUATION_PATH = "/v2/preceptor/preceptor-evaluation"
const LAB_PATH = "/v2/preceptor/lab-batch-grid"

type Panel = { kind: "confirm" } | { kind: "done" } | { kind: "notice"; title: string; text: string }

/** Demo menu: everything a presenter needs that is not part of the product. Walkthrough jumps, phone state, who opens an evaluator link, and reset. */
export function ScenarioMenu() {
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const store = useV2Store()
  const state = useV2State()
  const [panel, setPanel] = React.useState<Panel | null>(null)
  const [openAs, setOpenAs] = React.useState<string>(IDS.delgado)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const role = roleForPath(pathname)
  const home = role ? ROLE_BY_ID[role].home : "/v2/admin"
  const d = state.device
  const nowIso = () => new Date().toISOString()

  const patchDevice = (patch: Parameters<typeof setDevice>[1]) => store.update((s) => setDevice(s, patch, nowIso()).state)

  const simulateEdit = () => {
    let message: Panel = { kind: "notice", title: "Edit made on another device", text: "Another device changed the latest entry. The conflict shows on the Sync page when it syncs." }
    store.update((s) => {
      const r = simulateServerEdit(s, nowIso())
      if (!r.ok) {
        message = { kind: "notice", title: "Nothing to change yet", text: r.error }
        return s
      }
      return r.state
    })
    setPanel(message)
  }

  // The same ?as= query the evaluation form and the lab grid read. Other query parts, such as the request, stay.
  const openEvaluatorAs = (personId: string) => {
    setOpenAs(personId)
    const onLab = pathname === LAB_PATH
    const base = onLab || pathname === EVALUATION_PATH ? pathname : EVALUATION_PATH
    const q = new URLSearchParams(base === pathname && typeof window !== "undefined" ? window.location.search : "")
    q.set("as", personId)
    router.replace(`${base}?${q.toString()}`)
  }

  return (
    <>
      <DropdownMenu
        onOpenChange={(open) => {
          if (open && typeof window !== "undefined") setOpenAs(new URLSearchParams(window.location.search).get("as") ?? IDS.delgado)
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button ref={triggerRef} type="button" variant="outline" size="sm" className="gap-1.5">
            Demo
            <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="max-h-[75vh] w-96 max-w-[calc(100vw-1rem)] overflow-y-auto">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Walkthrough</DropdownMenuLabel>
            {STEPS.map((s) => (
              <DropdownMenuItem key={s.id} asChild className="min-h-10">
                <Link href={s.route}>{s.title}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Student phone</DropdownMenuLabel>
            {(
              [
                ["offline", "Phone is offline"],
                ["signedOut", "Phone is signed out"],
                ["updatePending", "App update is pending"],
              ] as const
            ).map(([key, label]) => (
              <DropdownMenuCheckboxItem key={key} className="min-h-10" checked={d[key]} onSelect={(e) => e.preventDefault()} onCheckedChange={(v) => patchDevice({ [key]: v === true })}>
                {label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuCheckboxItem className="min-h-10" checked={d.failNextSync} disabled={d.failNextSync} onSelect={(e) => e.preventDefault()} onCheckedChange={(v) => v === true && patchDevice({ failNextSync: true })}>
              Make the next sync fail
            </DropdownMenuCheckboxItem>
            <DropdownMenuItem className="min-h-10" onSelect={simulateEdit}>
              Simulate an edit on another device
            </DropdownMenuItem>
          </DropdownMenuGroup>
          {role === "preceptor" ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Open evaluator link as</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={openAs} onValueChange={openEvaluatorAs}>
                  {evaluatorChoicesForDemo(state).map((p) => (
                    <DropdownMenuRadioItem key={p.id} value={p.id} className="min-h-10">
                      {`${p.name}, ${p.title}`}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="min-h-10" onSelect={() => setPanel({ kind: "confirm" })}>
            Reset demo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={panel !== null} onOpenChange={(o) => !o && setPanel(null)}>
        <DialogContent
          className="sm:max-w-md"
          onCloseAutoFocus={(e) => {
            // The menu item that opened this dialog unmounts with the menu, so return focus to the Demo button.
            e.preventDefault()
            triggerRef.current?.focus()
          }}
        >
          {panel?.kind === "confirm" ? (
            <>
              <DialogHeader>
                <DialogTitle>Reset the demo data?</DialogTitle>
                <DialogDescription>Every change made in this browser goes back to the starting data for Harbor University BSN.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" size="default" autoFocus onClick={() => setPanel(null)}>
                  Keep my changes
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  onClick={() => {
                    store.reset()
                    setPanel({ kind: "done" })
                    router.push(home)
                  }}
                >
                  Reset demo data
                </Button>
              </DialogFooter>
            </>
          ) : panel?.kind === "done" ? (
            <>
              <DialogHeader>
                <DialogTitle>Demo data reset</DialogTitle>
                <DialogDescription>Everything is back to the starting data for Harbor University BSN.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="default" size="default" autoFocus onClick={() => setPanel(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : panel?.kind === "notice" ? (
            <>
              <DialogHeader>
                <DialogTitle>{panel.title}</DialogTitle>
                <DialogDescription>{panel.text}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="default" size="default" autoFocus onClick={() => setPanel(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
