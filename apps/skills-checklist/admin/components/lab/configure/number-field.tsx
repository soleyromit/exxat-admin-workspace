"use client"

/**
 * One rule for every small number on Evaluation settings and Configure one or several skills (Romit 2026-11-11: "why does Times needed differ?").
 * One width (`NUMBER_WIDTH`), one gap (gap-2) between the input and its words, and the words in one style: muted, 14 px (TYPE.helper). A standalone field
 * has its label above (FieldBlock or Row); a radio option that carries a number is the one inline case, and uses this same line after its label.
 */
import * as React from "react"
import { TYPE } from "@/components/lab/type-scale"

export const NUMBER_WIDTH = "w-20 tabular-nums"

/** "[ 3 ] evaluations for each skill", "1 to [ 6 ]": the input with its words before (`lead`) or after (`unit`), one gap, the words muted. */
export function NumberWithUnit({ children, unit, unitId, lead, leadId }: { children: React.ReactNode; unit?: React.ReactNode; unitId?: string; lead?: React.ReactNode; leadId?: string }) {
  return (
    <span className="flex flex-wrap items-center gap-2" data-number-line>
      {lead ? <span id={leadId} className={TYPE.helper}>{lead}</span> : null}
      {children}
      {unit ? <span id={unitId} className={TYPE.helper}>{unit}</span> : null}
    </span>
  )
}
