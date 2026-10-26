"use client"

/**
 * URL helpers for Attainment and Export: the dashboard's scope hook (scope, basis, as-of, ?state=) plus the page params this
 * page owns: `tab` (the view) and `peek` (the records a count opened). `skill` from the skills library opens that skill's
 * peek. Every link is built from the current query, so the scope and variant always travel with it.
 */
import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useDashboardUrl } from "@/components/lab/dashboard/use-dashboard"
import { isAttView, parsePeek, peekParam, type AttView, type PeekRef } from "@/lib/lab/attainment"

export function useAttainmentUrl(defaultView: AttView) {
  const url = useDashboardUrl()
  const params = useSearchParams()
  const pathname = usePathname() ?? ""
  const tabRaw = url.param("tab")
  const view: AttView = isAttView(tabRaw) ? tabRaw : defaultView
  const skillParam = url.param("skill")
  const peek: PeekRef | null = parsePeek(url.param("peek")) ?? (skillParam ? { kind: "skill", id: skillParam } : null)

  const hrefWith = React.useCallback(
    (p: Record<string, string | null>) => {
      const q = new URLSearchParams(params?.toString() ?? "")
      for (const [k, v] of Object.entries(p)) {
        if (v) q.set(k, v)
        else q.delete(k)
      }
      const s = q.toString()
      return s ? `${pathname}?${s}` : pathname
    },
    [params, pathname],
  )
  const peekHref = React.useCallback((ref: PeekRef) => hrefWith({ peek: peekParam(ref), skill: null }), [hrefWith])
  const closePeek = React.useCallback(() => url.setParams({ peek: null, skill: null }), [url])
  const setView = React.useCallback((v: AttView) => url.setParams({ tab: v === defaultView ? null : v, peek: null, skill: null }), [url, defaultView])
  return { ...url, view, peek, peekHref, closePeek, setView, hrefWith }
}
