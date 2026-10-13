"use client"
/**
 * react-router-dom compat shim for Next.js App Router.
 *
 * @exxatdesignux/ui dist files import from "react-router-dom" directly
 * (they are designed for the template-vite Vite stack). This module is
 * aliased to "react-router-dom" via next.config.ts webpack alias so the DS
 * shell components (ProductRouteSync, DefaultProductRedirect) receive
 * Next.js-compatible implementations of the router hooks they need.
 *
 * Scope: only implements the subset used by @exxatdesignux/ui dist — do not
 * expand unless a specific DS component requires it.
 */

import * as React from "react"
import NextLink from "next/link"
import {
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation"

// ---------------------------------------------------------------------------
// useLocation — provides { pathname, search, hash, state, key }
// ProductRouteSync reads `.pathname` to determine the active product segment.
// ---------------------------------------------------------------------------
export function useLocation() {
  const pathname = usePathname()
  return {
    pathname,
    search: "",
    hash: "",
    state: null as unknown,
    key: "default",
  }
}

// ---------------------------------------------------------------------------
// useNavigate — wraps Next.js useRouter
// ---------------------------------------------------------------------------
type NavigateOptions = { replace?: boolean; state?: unknown }

export function useNavigate() {
  const router = useRouter()
  return React.useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        if (to < 0) router.back()
        else router.forward()
        return
      }
      if (options?.replace) router.replace(to)
      else router.push(to)
    },
    [router],
  )
}

// ---------------------------------------------------------------------------
// useSearchParams — mirrors react-router's [params, setParams] tuple, backed
// by Next's useSearchParams + router. DS shell reads query scope from this.
// (webpack tolerated this being absent; Turbopack hard-errors on the missing
// named export, so it must be exported here.)
// ---------------------------------------------------------------------------
type SetSearchParams = (
  next:
    | URLSearchParams
    | Record<string, string>
    | ((prev: URLSearchParams) => URLSearchParams),
  options?: { replace?: boolean },
) => void

export function useSearchParams(): [URLSearchParams, SetSearchParams] {
  const params = useNextSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const qs = params?.toString() ?? ""

  const setSearchParams = React.useCallback<SetSearchParams>(
    (next, options) => {
      const resolved =
        typeof next === "function"
          ? next(new URLSearchParams(qs))
          : next instanceof URLSearchParams
            ? next
            : new URLSearchParams(next)
      const nextQs = resolved.toString()
      const url = nextQs ? `${pathname}?${nextQs}` : pathname
      if (options?.replace) router.replace(url)
      else router.push(url)
    },
    [router, pathname, qs],
  )

  return [new URLSearchParams(qs), setSearchParams]
}

// ---------------------------------------------------------------------------
// Navigate component — redirect on mount (used by DefaultProductRedirect)
// ---------------------------------------------------------------------------
export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const navigate = useNavigate()
  React.useEffect(() => {
    navigate(to, { replace })
  }, [navigate, to, replace])
  return null
}

// ---------------------------------------------------------------------------
// Outlet — no-op in Next.js file-based routing
// ---------------------------------------------------------------------------
export function Outlet() {
  return null
}

// ---------------------------------------------------------------------------
// useParams — DS uses this for product-root-gate.tsx
// ---------------------------------------------------------------------------
export function useParams(): Record<string, string | undefined> {
  return {}
}

// ---------------------------------------------------------------------------
// Link — must go through next/link, not a raw <a>. A plain anchor bypasses
// the Next.js client router entirely: every click becomes a full document
// GET, which throws away all in-memory React state app-wide (any context
// provider mounted in a shared layout resets to its initial value the
// moment a user clicks ANY <Link> using this shim — confirmed via network
// capture showing a full-document request instead of an RSC transition,
// 2026-08-04). This is the single highest-blast-radius fix available here:
// dozens of app files import Link from "react-router-dom", aliased to this
// shim by next.config.ts, so this one component decides whether client-side
// navigation actually works across the entire app.
// ---------------------------------------------------------------------------
export const Link = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }
>(function Link({ to, href, ...props }, ref) {
  return <NextLink ref={ref} href={to ?? href ?? ""} {...props} />
})
Link.displayName = "Link"
