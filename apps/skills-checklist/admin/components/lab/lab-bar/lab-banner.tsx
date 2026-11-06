"use client"

import * as React from "react"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LabLink } from "./lab-link"

type BannerAction = NonNullable<React.ComponentProps<typeof LocalBanner>["action"]>

/**
 * DS LocalBanner whose actions read as one style. The DS draws an `onClick` action as an outline button and an `href` action as an underlined link with an arrow, so one
 * banner could show two looks for the same kind of thing (Add several review, 2026-11-05). Here both are the DS outline button; a link stays a link, in the active
 * option set (LabLink rewrites a lab URL the way the page's other links do). Lab files import it as `LocalBanner`.
 */
export function LabLocalBanner({ action, secondaryAction, children, ...props }: React.ComponentProps<typeof LocalBanner> & { secondaryAction?: BannerAction }) {
  const actions = [action, secondaryAction].filter((a): a is BannerAction => !!a)
  if (!actions.some((a) => a.href) && !secondaryAction) return <LocalBanner {...props} action={action}>{children}</LocalBanner>
  return (
    <LocalBanner {...props}>
      {children}
      <span className="mt-2.5 flex flex-wrap items-center gap-2">
        {actions.map((a) => a.href ? (
          <Button key={a.label} asChild variant="outline" size="xs"><LabLink href={a.href}>{a.label}</LabLink></Button>
        ) : (
          <Button key={a.label} type="button" variant="outline" size="xs" onClick={a.onClick}>{a.label}</Button>
        ))}
      </span>
    </LocalBanner>
  )
}
