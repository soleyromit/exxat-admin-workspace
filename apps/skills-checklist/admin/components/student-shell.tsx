"use client"

/**
 * Strip for the pages that are NOT the prototype's Student View: "My skills" (S-15, cross-course record, which the
 * prototype does not have; kept reachable by URL pending Romit's decision, see docs/build/prototype-parity.md P-11).
 * The page frame (utility bar, sidebar, main landmark) comes from the shell. The acting student switcher is demo only.
 */
import * as React from "react"
import Link from "next/link"
import { STUDENT_ROUTES } from "@/lib/skills-routes"
import { useDb, usePrefs } from "@/lib/store/react"
import { StudentSwitcher } from "@/components/student/student-switcher"

export function StudentShell({ children }: { children: React.ReactNode }) {
  const db = useDb()
  const { currentStudentId } = usePrefs()
  const student = db.students.find((s) => s.id === currentStudentId)
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <Link href={STUDENT_ROUTES.courses} className="inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Back to Student View
          </Link>
          {student ? <StudentSwitcher /> : null}
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl flex-1">{children}</div>
    </div>
  )
}
