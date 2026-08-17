"use client"

/**
 * School / program scope — shared state for the utility bar's school switcher.
 *
 * Was local `useState` inside the sidebar's `TeamSwitcher` (components/
 * app-sidebar.tsx) before the compact-shell migration. That component only
 * rendered when the sidebar was expanded; forcing the rail permanently
 * icon-only (Aug 2026) silently stopped it from ever rendering — the school/
 * program picker was lost from the UI, not just moved. Lifted here so the new
 * utility-bar avatar trigger (components/pce/utility-bar-school-switcher.tsx)
 * can own it instead, matching the DS's UtilityBarSchoolSwitcher pattern.
 */

import * as React from "react"
import {
  NAV_SCHOOLS,
  NAV_SCHOOL_DEFAULT,
  NAV_PROGRAM_DEFAULT,
  type NavSchool,
  type NavProgram,
} from "@/lib/pce-nav"

interface SchoolSwitcherValue {
  school: NavSchool
  program: NavProgram
  setSchool: (school: NavSchool) => void
  setProgram: (program: NavProgram) => void
}

const SchoolSwitcherContext = React.createContext<SchoolSwitcherValue | null>(null)

export function SchoolSwitcherProvider({ children }: { children: React.ReactNode }) {
  const [school, setSchoolState] = React.useState<NavSchool>(NAV_SCHOOL_DEFAULT)
  const [program, setProgram] = React.useState<NavProgram>(NAV_PROGRAM_DEFAULT)

  const setSchool = React.useCallback((s: NavSchool) => {
    setSchoolState(s)
    setProgram(s.programs[0])
  }, [])

  const value = React.useMemo(
    () => ({ school, program, setSchool, setProgram }),
    [school, program, setSchool],
  )

  return (
    <SchoolSwitcherContext.Provider value={value}>
      {children}
    </SchoolSwitcherContext.Provider>
  )
}

export function useSchoolSwitcher(): SchoolSwitcherValue {
  const ctx = React.useContext(SchoolSwitcherContext)
  if (!ctx) throw new Error("useSchoolSwitcher must be used inside SchoolSwitcherProvider")
  return ctx
}

export { NAV_SCHOOLS }
