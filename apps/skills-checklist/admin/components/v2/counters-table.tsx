"use client"

import * as React from "react"
import { COUNTER_BY_ID, COUNTERS, type CounterDef } from "@/lib/v2/selectors"
import { useV2State } from "@/lib/v2/react"
import { V2Grid, v2col } from "@/components/v2/v2-grid"

/** Live counters read from the shared store. Pass ids to narrow; omit to show all. */
export function CountersTable({ ids, caption }: { ids?: string[]; caption: string }) {
  const state = useV2State()
  const defs: CounterDef[] = ids ? ids.map((id) => COUNTER_BY_ID[id]).filter(Boolean) : COUNTERS
  return (
    <V2Grid<CounterDef>
      caption={caption}
      rows={defs}
      id={(c) => c.id}
      columns={[
        v2col<CounterDef>("measure", "Measure", 420, (c) => c.label),
        v2col<CounterDef>("now", "Now", 120, (c) => (
          <span className="tabular-nums" data-counter={c.id}>
            {c.value(state)}
          </span>
        )),
      ]}
    />
  )
}
