"use client"

/**
 * Shared state for the student lab screens: the student in context (?student=, default Maya Ferreira), the demo state
 * (?state=loading|empty|done|offline|error) and the model, built once per state change from the shared v2 store (read only).
 */
import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import type { V2State } from "@/lib/v2/types"
import { DEFAULT_STUDENT, buildStudent, withAllDone, type StudentModel } from "@/lib/lab/student"

export type StudentDemo = "loading" | "empty" | "done" | "offline" | "error"
const DEMOS: StudentDemo[] = ["loading", "empty", "done", "offline", "error"]

export interface StudentPageCtx {
  state: V2State
  studentId: string
  demo: StudentDemo | null
  model: StudentModel | null
  hydrated: boolean
  param: (k: string) => string | null
  setParams: (p: Record<string, string | null>) => void
}

export function useStudentPage(): StudentPageCtx {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const state = useV2State()
  const hydrated = useV2Hydrated()
  const studentId = params?.get("student") || DEFAULT_STUDENT
  const raw = params?.get("state")
  const demo = DEMOS.includes(raw as StudentDemo) ? (raw as StudentDemo) : null
  const model = React.useMemo(() => {
    if (!hydrated) return null
    const m = buildStudent(state, studentId)
    return m && demo === "done" ? withAllDone(m) : m
  }, [state, studentId, hydrated, demo])
  const setParams = React.useCallback(
    (p: Record<string, string | null>) => {
      const q = new URLSearchParams(params?.toString() ?? "")
      for (const [k, v] of Object.entries(p)) (v === null ? q.delete(k) : q.set(k, v))
      router.replace(`${pathname}${q.toString() ? `?${q.toString()}` : ""}`, { scroll: false })
    },
    [params, pathname, router],
  )
  return { state, studentId, demo, model, hydrated, param: (k) => params?.get(k) ?? null, setParams }
}
