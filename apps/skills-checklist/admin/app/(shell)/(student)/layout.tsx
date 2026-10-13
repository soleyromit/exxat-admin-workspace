import * as React from "react"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { StudentShell } from "@/components/student-shell"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      <StudentShell>{children}</StudentShell>
    </TooltipProvider>
  )
}
