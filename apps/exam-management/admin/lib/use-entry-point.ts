'use client'

// useEntryPoint is a thin wrapper over the existing FacultySession.entry so that
// all Prism cross-link gates react to the same session switcher that drives the
// banner, breadcrumb, and sidebar — no separate detection needed.

import { useFacultySession } from './faculty-session'

export type { EntryPoint } from './faculty-session'

export function useEntryPoint() {
  return useFacultySession().entry
}
