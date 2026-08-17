"use client"

/**
 * The profile-menu door to sign-in flows: pick one here, author one next door.
 *
 * Two things sit behind one row because they are two sizes of the same job.
 * Picking which flow runs is a one-click preference, so it belongs in the menu
 * beside theme and home layout, in the same submenu shape they use. Authoring a
 * flow is steps, options, conditions, and a canvas, so it belongs on its own URL
 * (see `exxat-overlays`), and `Configure` is the way through.
 *
 * **Picking a flow ends the session.** Not a side effect that could be dropped: a
 * flow's whole output is what the session holds (which apps, which role, where
 * home lands), so pointing sign-in at a different flow makes the session in front
 * of you one no flow granted, and the only way to see the new one is to sign in
 * again. `Try this flow` in the builder made the same trade for the same reason.
 * The submenu says so above the list rather than letting it be a surprise.
 *
 * Rendered by both profile menus and the student header, so the entry point and
 * its gate live in one place. Gated on product authoring, because this is
 * prototype scaffolding: an end-user workspace has exactly one sign-in flow and
 * nobody gets to choose it.
 */

import * as React from "react"
import { Link } from "react-router"
import { useProductAuthoringEnabled } from "@exxatdesignux/ui/components/shell"

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { useLogOut } from "@/hooks/use-log-out"
import {
  getActiveFlowId,
  getLoginFlows,
  setActiveFlowId,
  type LoginFlowDefinition,
} from "@/lib/login-flow"
import { SIGN_IN_FLOWS_PATH } from "@/lib/sign-in-flows-shell"

export { SIGN_IN_FLOWS_PATH }

export function SignInFlowMenuItem() {
  const authoringEnabled = useProductAuthoringEnabled()
  const logOut = useLogOut()

  // Read once per open. The menu unmounts when it closes, so this is current
  // every time it is on screen, and no store subscription is needed for a list
  // only this surface and the builder ever write.
  const [flows] = React.useState<LoginFlowDefinition[]>(() =>
    authoringEnabled ? getLoginFlows() : [],
  )
  const [activeId] = React.useState<string>(() =>
    authoringEnabled ? getActiveFlowId() : "",
  )

  if (!authoringEnabled) return null

  const active = flows.find(flow => flow.id === activeId)
  const roles = flows.filter(flow => flow.id.startsWith("role-"))
  const shapes = flows.filter(flow => !flow.id.startsWith("role-"))

  function run(id: string) {
    setActiveFlowId(id)
    logOut()
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <i className="fa-light fa-route" aria-hidden="true" />
        Sign-in flow
        {/* The trailing-value pattern the theme and home-layout rows use, so which
            flow runs is readable without opening the submenu. */}
        <span className="ms-auto pe-1 text-xs text-muted-foreground">
          {active?.name}
        </span>
      </DropdownMenuSubTrigger>
      {/* No `DropdownMenuPortal`: portalling sub-content out of the parent menu's
          layer leaves it under that layer's `pointer-events: none`, so the options
          render and cannot be clicked. No submenu in this app portals. */}
      <DropdownMenuSubContent className="w-60">
        {/* A caption for the whole submenu, not a heading for the first three
            flows, so it is separated from the list it warns about. */}
        <DropdownMenuLabel>Signs out and runs it</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={activeId} onValueChange={run}>
          {shapes.map(flow => (
            <DropdownMenuRadioItem key={flow.id} value={flow.id}>
              {flow.name}
            </DropdownMenuRadioItem>
          ))}
          {/* Two groups rather than one list of nine, the split the builder's own
              picker makes: the role flows are all one shape and differ only in
              what they hand the session. */}
          {roles.length > 0 ? (
            <>
              <DropdownMenuLabel>User roles</DropdownMenuLabel>
              {roles.map(flow => (
                <DropdownMenuRadioItem key={flow.id} value={flow.id}>
                  {flow.name}
                </DropdownMenuRadioItem>
              ))}
            </>
          ) : null}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to={SIGN_IN_FLOWS_PATH} className="cursor-pointer">
            <i className="fa-light fa-sliders" aria-hidden="true" />
            Configure
          </Link>
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
