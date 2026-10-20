import * as React from "react"
import { V2ShellFrame } from "@/components/v2/v2-shell-frame"

export const metadata = { title: "Skills tracking, connected prototype v2" }

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return <V2ShellFrame>{children}</V2ShellFrame>
}
