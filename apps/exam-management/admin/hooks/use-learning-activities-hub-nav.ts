"use client"

import * as React from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import {
  currentLearningActivitiesBasePath,
  laCanonicalNavHref,
  isLearningActivitiesHubPath,
  parseLearningActivitiesNav,
} from "@/lib/learning-activities-nav"

function searchParamsEqual(a: URLSearchParams, b: URLSearchParams): boolean {
  const keys = new Set([...a.keys(), ...b.keys()])
  for (const k of keys) {
    if (a.getAll(k).join("\u0000") !== b.getAll(k).join("\u0000")) return false
  }
  return true
}

export function useLearningActivitiesHubNav(folders?: readonly import("@/lib/mock/library-folders").LibraryFolder[]) {
  const actualPathname = useLocation().pathname
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const isHubPath = isLearningActivitiesHubPath(actualPathname)
  const hubBasePath = currentLearningActivitiesBasePath(actualPathname)
  const searchParamsKey = searchParams.toString()
  const navState = React.useMemo(
    () => parseLearningActivitiesNav(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  )

  React.useEffect(() => {
    if (!isHubPath) return
    const basePath = currentLearningActivitiesBasePath(actualPathname)
    const target = laCanonicalNavHref(new URLSearchParams(searchParamsKey), folders, basePath)
    if (!target) return
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost"
      const u = new URL(target, origin)
      const want = u.searchParams
      const cur = new URLSearchParams(searchParamsKey)
      if (u.pathname === actualPathname && searchParamsEqual(want, cur)) return
    } catch {
      /* fall through */
    }
    navigate(target, { replace: true })
  }, [actualPathname, folders, isHubPath, navigate, searchParamsKey])

  return {
    navState,
    searchParamsKey,
    hubBasePath,
    pathname: actualPathname,
    isHubPath,
  }
}
