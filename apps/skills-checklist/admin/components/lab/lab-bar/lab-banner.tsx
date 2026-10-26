"use client"

import * as React from "react"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { useLabHref } from "./page-context"

/**
 * DS LocalBanner whose action link stays in the active option set. The DS renders `action.href` as a plain anchor, so a
 * hard-coded lab URL there would leave the set; this rewrites it the same way LabLink does. Lab files import it as
 * `LocalBanner`.
 */
export function LabLocalBanner(props: React.ComponentProps<typeof LocalBanner>) {
  const to = useLabHref()
  const action = props.action && "href" in props.action && typeof props.action.href === "string" ? { ...props.action, href: to(props.action.href) } : props.action
  return <LocalBanner {...props} action={action} />
}
