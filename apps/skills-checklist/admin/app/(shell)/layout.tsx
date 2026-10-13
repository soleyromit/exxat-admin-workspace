import * as React from "react"
import { ShellFrame } from "@/components/shell/shell-frame"

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <ShellFrame>{children}</ShellFrame>
}
