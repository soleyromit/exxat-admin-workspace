/**
 * Design OS route wiring — component catalog, token hub, column catalog, and
 * the focus-workflow / exam-lock showcases, plus the pre-`/design-os` root
 * redirects.
 *
 * Kept in its own module (not inlined in `src/routes.tsx`) because `routes.tsx`
 * is app-owned in consumer apps: `exxat-ui upgrade` may never overwrite it, so
 * the Design OS surface has to arrive as a package-owned file that the consumer
 * mounts with one spread. See `packages/ui/bin/upgrade-design-os-wiring.mjs`.
 */
import { Suspense, lazy } from "react"
import { Navigate, useLocation, type RouteObject } from "react-router"

import { LoadingFallback } from "../_loading"
import { RouteError } from "../_error"

/** Prefix swap that preserves the rest of the path, the query, and the hash. */
export function RedirectToDesignOsSubpath({
  fromPrefix,
  toPrefix,
}: {
  fromPrefix: string
  toPrefix: string
}) {
  const location = useLocation()
  const rest = location.pathname.startsWith(fromPrefix)
    ? location.pathname.slice(fromPrefix.length)
    : ""
  const normalizedRest = rest.startsWith("/") ? rest : rest ? `/${rest}` : ""
  return (
    <Navigate to={`${toPrefix}${normalizedRest}${location.search}${location.hash}`} replace />
  )
}

function lazyPage(loader: () => Promise<{ default: React.ComponentType }>) {
  const Lazy = lazy(loader)
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Lazy />
    </Suspense>
  )
}

/**
 * Design OS hubs, mounted under the product root gate so they resolve at
 * `/design-os/design-system`, `/design-os/tokens-themes`, and siblings.
 */
export function designOsProductChildRoutes(): RouteObject[] {
  return [
    {
      path: "design-system",
      element: lazyPage(() => import("./_layout")),
      errorElement: <RouteError />,
      children: [
        { index: true, element: lazyPage(() => import("./index")) },
        { path: ":slug", element: lazyPage(() => import("./doc")) },
      ],
    },
    {
      path: "columns",
      element: lazyPage(() => import("../columns")),
      errorElement: <RouteError />,
    },
    {
      path: "column-types-demo",
      element: lazyPage(() => import("../column-types-demo")),
      errorElement: <RouteError />,
    },
    {
      path: "tokens-themes",
      element: lazyPage(() => import("../tokens-themes")),
      errorElement: <RouteError />,
    },
    {
      path: "focus-workflow",
      element: lazyPage(() => import("../focus-workflow")),
      errorElement: <RouteError />,
    },
    {
      path: "exam-lock",
      element: lazyPage(() => import("../exam-lock")),
      errorElement: <RouteError />,
    },
  ]
}

/** Back-compat: these hubs lived at the workspace root before Design OS existed. */
export function designOsLegacyRootRedirects(): RouteObject[] {
  return [
    {
      path: "library/*",
      element: <RedirectToDesignOsSubpath fromPrefix="/library" toPrefix="/design-os/library" />,
    },
    {
      path: "design-system/*",
      element: (
        <RedirectToDesignOsSubpath
          fromPrefix="/design-system"
          toPrefix="/design-os/design-system"
        />
      ),
    },
    {
      path: "columns/*",
      element: <RedirectToDesignOsSubpath fromPrefix="/columns" toPrefix="/design-os/columns" />,
    },
    {
      path: "tokens-themes/*",
      element: (
        <RedirectToDesignOsSubpath
          fromPrefix="/tokens-themes"
          toPrefix="/design-os/tokens-themes"
        />
      ),
    },
    {
      path: "exam/*",
      element: <RedirectToDesignOsSubpath fromPrefix="/exam" toPrefix="/design-os/exam-lock" />,
    },
  ]
}
