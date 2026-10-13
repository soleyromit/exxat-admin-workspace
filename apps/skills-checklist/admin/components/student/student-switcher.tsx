"use client"

/** Demo-only: which student the shell acts as. A real student signs in and sees only their own record. Lives in the student shell only. */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { useActions, useDb, usePrefs } from "@/lib/store/react"
import { studentLocal as local } from "@/lib/copy"

export function StudentSwitcher() {
  const db = useDb()
  const { currentStudentId } = usePrefs()
  const { setPrefs } = useActions()
  const student = db.students.find((s) => s.id === currentStudentId) ?? db.students[0]
  const label = (id: string) => {
    const s = db.students.find((x) => x.id === id)
    if (!s) return id
    const c = db.cohorts.find((x) => x.id === s.cohortId)?.name
    const g = db.groups.find((x) => x.id === s.groupId)?.name
    return `${s.name}, ${[c, g].filter(Boolean).join(" ")}`
  }
  if (!student) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="min-h-11 max-w-[60%] justify-end truncate">
          <span className="truncate">
            {student.name}
            <span className="sr-only"> is the student shown. {local.demoStudent}: change</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        <DropdownMenuLabel>{local.demoStudent}</DropdownMenuLabel>
        <p className="px-2 pb-1 text-xs text-muted-foreground">{local.demoNote}</p>
        <DropdownMenuRadioGroup value={student.id} onValueChange={(id) => setPrefs({ currentStudentId: id })}>
          {db.students.map((s) => (
            <DropdownMenuRadioItem key={s.id} value={s.id} className="min-h-11">
              {label(s.id)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
