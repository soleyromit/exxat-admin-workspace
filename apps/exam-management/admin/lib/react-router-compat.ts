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
  const search = useNextSearchParams()?.toString() ?? ""
  return {
    pathname,
    search: search ? `?${search}` : "",
    hash: "",
    state: null as unknown,
    key: "default",
  }
}

// ---------------------------------------------------------------------------
// useSearchParams — returns [URLSearchParams, setSearchParams] like RR.
// App components (e.g. library-secondary-nav) read the query string and
// push updates. Backed by Next's useSearchParams (read) + useRouter (write).
// ---------------------------------------------------------------------------
type SearchParamsInit =
  | URLSearchParams
  | Record<string, string>
  | ((prev: URLSearchParams) => URLSearchParams)

export function useSearchParams(): [
  URLSearchParams,
  (next: SearchParamsInit, opts?: { replace?: boolean }) => void,
] {
  const router = useRouter()
  const pathname = usePathname()
  const nextParams = useNextSearchParams()
  // Clone into a writable URLSearchParams (Next returns a read-only instance).
  const currentString = nextParams?.toString() ?? ""
  const params = React.useMemo(
    () => new URLSearchParams(currentString),
    [currentString],
  )

  const setSearchParams = React.useCallback(
    (next: SearchParamsInit, opts?: { replace?: boolean }) => {
      const resolved =
        typeof next === "function"
          ? next(new URLSearchParams(currentString))
          : next instanceof URLSearchParams
            ? next
            : new URLSearchParams(next)
      const qs = resolved.toString()
      const url = qs ? `${pathname}?${qs}` : pathname
      if (opts?.replace) router.replace(url)
      else router.push(url)
    },
    [router, pathname, currentString],
  )

  return [params, setSearchParams]
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
// Link — thin wrapper (DS rarely uses this directly)
// ---------------------------------------------------------------------------
export const Link = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { to?: string }
>(function Link({ to, href, ...props }, ref) {
  // createElement (not JSX) so this stays a valid .ts module — it is aliased
  // to "react-router-dom" in next.config.ts and must parse without a .tsx ext.
  return React.createElement("a", { ref, href: to ?? href, ...props })
})
Link.displayName = "Link"
