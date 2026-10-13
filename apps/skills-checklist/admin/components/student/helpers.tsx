"use client"

import * as React from "react"
import type { Db, Id, Student } from "@/lib/domain/types"
import { useDb, usePrefs } from "@/lib/store/react"

/** The student the shell acts as (demo state; real sign-in is out of scope). Falls back to the first student. */
export function useActingStudent(): { studentId: Id; student: Student | undefined; db: Db } {
  const db = useDb()
  const { currentStudentId } = usePrefs()
  const student = db.students.find((s) => s.id === currentStudentId) ?? db.students[0]
  return { studentId: student?.id ?? "", student, db }
}

/** False on the server and the first client paint, so persisted data never flashes the seed (state L). */
export function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  return mounted
}

/** Phone-width check for the bottom sheet (S-13 mobile [INFER]). */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = React.useState(false)
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const q = window.matchMedia("(max-width: 639px)")
    const on = () => setMobile(q.matches)
    on()
    q.addEventListener?.("change", on)
    return () => q.removeEventListener?.("change", on)
  }, [])
  return mobile
}
