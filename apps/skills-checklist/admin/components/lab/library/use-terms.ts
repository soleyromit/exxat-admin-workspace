"use client"

/**
 * Re-renders the calling component when the program's noun changes (Settings > Naming), and loads the noun saved in this
 * lab session after mount. The server snapshot is always the default noun, so hydration never mismatches.
 */
import * as React from "react"
import { DEFAULT_TERMS, getTerms, loadStoredTerms, subscribeTerms, type Terms } from "@/lib/lab/terms"

export function useTerms(): Terms {
  const terms = React.useSyncExternalStore(subscribeTerms, getTerms, () => DEFAULT_TERMS)
  React.useEffect(() => loadStoredTerms(), [])
  return terms
}
