"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useDb, usePrefs } from "@/lib/store/react"
import { OverviewView } from "./overview-view"
import { parseParams, toSearch, type OverviewParams } from "./report-params"

/**
 * Connected S-01..S-03: reads the program database and the OD-03 display flag, and keeps ALL view state in the URL so a
 * shared link reopens the same filters, tab and rail level, and browser Back mirrors levels (docs/ux/08 P-07).
 */
export function OverviewClient() {
  const sp = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const db = useDb()
  const { skillStatusDisplay } = usePrefs()
  const params = React.useMemo(() => parseParams(sp), [sp])
  const onParams = React.useCallback(
    (next: OverviewParams, mode: "push" | "replace" = "replace") => {
      const url = `${pathname}${toSearch(next)}`
      if (mode === "push") router.push(url, { scroll: false })
      else router.replace(url, { scroll: false })
    },
    [pathname, router],
  )
  return <OverviewView db={db} display={skillStatusDisplay} params={params} onParams={onParams} />
}
