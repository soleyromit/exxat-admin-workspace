"use client"

/**
 * Evaluation settings, variant A: sections with a side index (Proposed 2026-11-02; Romit: "Evaluation settings design is
 * confusing, make a better UI"). The five groups in the order an admin decides (How skills are judged, What counts as achieved, How many evaluations, Who signs)
 * each a titled section; an anchored index on the left from 1024 px jumps between them and marks the one in view.
 * Labels and controls only (D-L34). One Save in the footer (components/lab/configure/program-layout.tsx).
 *
 * Regions: header, index, sections, footer. URL: ?state=loading.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { TYPE } from "@/components/lab/type-scale"
import { PROGRAM_GROUPS, ProgramGroupBody, groupOfIssue, type ProgramGroupId } from "@/components/lab/configure/program-parts"
import { ProgramSettingsFrame } from "@/components/lab/configure/program-layout"

const anchor = (id: ProgramGroupId) => `prog-group-${id}`
const jump = (id: ProgramGroupId) => document.getElementById(anchor(id))?.scrollIntoView({ block: "start" })

export function AdminEvaluationSettingsA() {
  const [active, setActive] = React.useState<ProgramGroupId>("judged")
  // The section in view: the last one whose top has passed the top fifth of the viewport. The shell scrolls inside its own
  // container, so listen in the capture phase for any scroll.
  React.useEffect(() => {
    const onScroll = () => {
      const line = window.innerHeight * 0.2
      let current: ProgramGroupId = "judged"
      for (const g of PROGRAM_GROUPS) {
        const el = document.getElementById(anchor(g.id))
        if (el && el.getBoundingClientRect().top <= line) current = g.id
      }
      setActive(current)
    }
    document.addEventListener("scroll", onScroll, true)
    return () => document.removeEventListener("scroll", onScroll, true)
  }, [])
  return (
    <ProgramSettingsFrame onIssue={(i) => jump(groupOfIssue(i))}>
      {(p) => (
        <div className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)]" data-layout="index">
          <nav aria-label="Sections" className="hidden lg:block">
            <ul className="sticky top-4 flex flex-col gap-1">
              {PROGRAM_GROUPS.map((g) => (
                <li key={g.id}>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className={cn("w-full justify-start", active === g.id && "bg-muted text-foreground")}
                  >
                    <a href={`#${anchor(g.id)}`} aria-current={active === g.id ? "location" : undefined} onClick={(e) => { e.preventDefault(); jump(g.id) }}>
                      {g.label}
                    </a>
                  </Button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex min-w-0 flex-col" data-region="settings">
            {PROGRAM_GROUPS.map((g, i) => (
              <div key={g.id} id={anchor(g.id)} role="group" aria-labelledby={`${anchor(g.id)}-h`} className={cn("flex scroll-mt-4 flex-col gap-4 py-6", i > 0 && "border-t border-border")}>
                <h2 id={`${anchor(g.id)}-h`} className={TYPE.section}>{g.label}</h2>
                <ProgramGroupBody id={g.id} m={p.m} edits={p.edits} setEdits={p.setEdits} />
              </div>
            ))}
          </div>
        </div>
      )}
    </ProgramSettingsFrame>
  )
}
