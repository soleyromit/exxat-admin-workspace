"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { SCOPE_CARRY, activeSetFor, labHref, rewriteLabUrl, type LinkContext, type LinkParams } from "@/lib/lab/links"
import { flowsForScreen, splitScreen } from "@/lib/lab/flows"

/** What the route knows about the page: its flow step (flow route) or its screen and variant (screen route). */
export interface LabPage {
  flow?: string
  step?: string
  /** "persona/slug" */
  screen?: string
  variant?: string
}

const PageContext = React.createContext<LabPage>({})

export function LabPageProvider({ page, children }: { page: LabPage; children: React.ReactNode }) {
  return <PageContext.Provider value={page}>{children}</PageContext.Provider>
}

export const useLabPage = (): LabPage => React.useContext(PageContext)

/** Session key for the last option set seen, so a hop through a screen in no flow can restore it. */
export const SET_STORAGE_KEY = "lab:set"

export function readStoredSet(): string | null {
  try { return window.sessionStorage.getItem(SET_STORAGE_KEY) } catch { return null }
}
export function writeStoredSet(set: string) {
  try { window.sessionStorage.setItem(SET_STORAGE_KEY, set) } catch { /* blocked storage: the URL still carries the set */ }
}

/** Screen and variant of a /lab/<persona>/<screen> URL when the route did not provide them (components rendered outside a frame). */
function pageFromPath(pathname: string, params: URLSearchParams | null): LabPage {
  const [, lab, a, b, c] = pathname.split("/")
  if (lab !== "lab" || !a) return {}
  if (a === "flow") return { flow: b, step: c }
  return b ? { screen: `${a}/${b}`, variant: params?.get("variant") ?? undefined } : {}
}

/** The link context of the current page: flow, step, screen, variant and the active option set. */
export function useLabLinkContext(): LinkContext {
  const provided = useLabPage()
  const params = useSearchParams()
  const pathname = usePathname() ?? ""
  const page = provided.screen || provided.flow ? provided : pageFromPath(pathname, params)
  const [stored, setStored] = React.useState<string | null>(null)
  React.useEffect(() => { setStored(readStoredSet()) }, [])

  let flowId = page.flow
  if (!flowId && page.screen && page.variant) {
    const { persona, slug } = splitScreen(page.screen)
    flowId = flowsForScreen(persona, slug, page.variant, params)[0]?.flow.id
  }
  const urlSet = params?.get("set") ?? null
  const set = activeSetFor({ flowId, screen: page.screen, variant: page.variant, urlSet, stored, params })

  React.useEffect(() => { if (set) writeStoredSet(set) }, [set])

  return React.useMemo(
    () => ({ flowId, stepId: page.step, set, screen: page.screen, variant: page.variant, onFlowRoute: !!(page.flow && page.step), carry: params }),
    [flowId, page.step, set, page.screen, page.variant, page.flow, params],
  )
}

const SCREEN_KEY = /^[a-z-]+\/[a-z0-9-]+$/

/**
 * The set-aware link builder for components. `to("admin/configure-skill", { skill })` or `to("/lab/admin/configure-skill?skill=x")`
 * returns the href in the active option set. Any other href passes through.
 */
export function useLabHref(): (target: string, params?: LinkParams) => string {
  const ctx = useLabLinkContext()
  return React.useCallback((target: string, params?: LinkParams) => {
    if (target.startsWith("?")) {
      // A query-only href replaces the page's query: keep the set and the scope so the click stays in the same design.
      const q = new URLSearchParams(target.slice(1))
      for (const k of ["set", ...SCOPE_CARRY]) {
        const v = ctx.carry?.get(k)
        if (v && !q.has(k)) q.set(k, v)
      }
      return `?${q.toString()}`
    }
    if (SCREEN_KEY.test(target)) return labHref(target, params, ctx)
    if (target.startsWith("/lab/")) return params ? labHref(target.slice(5).split("?")[0]!, params, ctx) : rewriteLabUrl(target, ctx)
    return target
  }, [ctx])
}
