"use client"

import * as React from "react"
import { useLabLinkContext } from "@/components/lab/lab-bar/page-context"
import { variantFor } from "@/lib/lab/links"
import { findScreen } from "@/lib/lab/screens"
import { countSkills } from "@/lib/lab/terms"

const CONFIGURE = "admin/configure-skill"

/** The selection bar's action: N is the selected skills that are not inactive (D-L48). */
export const configureManyLabel = (n: number): string => `Configure ${countSkills(n)}`

/**
 * "Configure these together" from the library, in the reviewer's option set. Only a configure variant that accepts
 * `skills` (screens.json `accepts`, set 3 "one rule for many") can take several at once; in the other sets the action
 * opens the first one in that set's own configure design, so a click never leaves the design being walked.
 */
export function useConfigureMany(): (ids: string[], inactive?: readonly string[]) => { href: string; label: string; many: boolean } {
  const ctx = useLabLinkContext()
  return React.useCallback((ids: string[], inactive: readonly string[] = []) => {
    const letter = variantFor(CONFIGURE, ctx)
    const screen = findScreen("admin", "configure-skill")
    const def = screen?.variants.find((v) => v.id === (letter ?? screen.recommended))
    const many = !!def?.accepts?.includes("skills") && ids.length > 1
    const list = ids.map(encodeURIComponent).join(",")
    const left = inactive.length ? `&inactive=${inactive.map(encodeURIComponent).join(",")}` : ""
    if (many) return { href: `/lab/${CONFIGURE}?skills=${list}${left}`, label: `Configure ${ids.length} together`, many }
    return { href: `/lab/${CONFIGURE}?skill=${encodeURIComponent(ids[0] ?? "")}`, label: ids.length > 1 ? `Configure the first of ${ids.length}` : "Configure it", many }
  }, [ctx])
}
