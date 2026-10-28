"use client"

/**
 * Chrome shared by both course mapping variants: page header, the demo states, and the shared model (offerings, coverage, term
 * options, the N-13 count). The variant lays out the toolbar and the body.
 */
import * as React from "react"
import { PageFrame } from "@/components/skills/page-header"
import { importHref } from "@/lib/lab/library"
import { coverage, currentTermId, offeringRows, termOptions, type Coverage, type MappingOverlay, type OfferingRow } from "@/lib/lab/mapping"
import type { SkillList } from "@/lib/lab/lists"
import { skillNounPlural } from "@/lib/lab/terms"
import type { V2State } from "@/lib/v2/types"
import { ErrorState, LoadingState, type Opt } from "./parts"
import { EmptyBlock } from "@/components/lab/empty-block"
import { useAdminData, useLists, useMappingOverlay, type AdminData } from "./use-admin-data"

export interface MappingModel extends AdminData {
  state: V2State
  overlay: MappingOverlay
  setOverlay: (o: MappingOverlay) => void
  lists: SkillList[]
  offerings: OfferingRow[]
  termId: string
  termName: string
  termOpts: Opt[]
  cohortOpts: Opt[]
  yearOpts: Opt[]
  cover: Coverage
  /** Didactic courses included (URL ?incl=didactic). Default false: clinical courses only (CALL 10-26, pending the client). */
  didactic: boolean
  setDidactic: (on: boolean) => void
}

export function MappingFrame({ variant, children }: { variant: string; children: (m: MappingModel) => React.ReactNode }) {
  const data = useAdminData()
  const [overlay, setOverlay] = useMappingOverlay()
  const { lists } = useLists(data.state)
  const state = data.state
  const termParam = data.query.get("term")
  const didactic = data.query.get("incl") === "didactic"
  const model = React.useMemo(() => {
    if (!state) return null
    const terms = termOptions(state)
    const termId = terms.some((t) => t.id === termParam) ? termParam : currentTermId(state)
    const offerings = offeringRows(state, overlay, lists)
    return {
      offerings,
      termId,
      termName: terms.find((t) => t.id === termId)?.name ?? "",
      termOpts: terms.map((t) => ({ value: t.id, label: t.name, group: t.academicYear })),
      cohortOpts: (state.cohorts ?? []).map((c) => ({ value: c.id, label: c.name })),
      yearOpts: [1, 2, 3, 4].map((y) => ({ value: String(y), label: `Year ${y}` })),
      cover: coverage(state, overlay, termId, lists, undefined, didactic),
      didactic,
    }
  }, [state, overlay, termParam, lists, didactic])
  const setDidactic = React.useCallback((on: boolean) => data.query.set({ incl: on ? "didactic" : null }), [data.query])

  let body: React.ReactNode
  if (!data.ready || !state || !model) body = <LoadingState label="Loading course mapping" />
  else if (data.demo === "error") body = <ErrorState what="Course mapping" onRetry={data.retry} />
  else if (data.demo === "empty")
    body =
      variant === "B" ? (
        <EmptyBlock title={`No ${skillNounPlural()} to map yet`} body={`Add ${skillNounPlural()} to the library first. Each one can be mapped once it is configured.`} action={{ label: "Import a file", href: importHref }} />
      ) : (
        <EmptyBlock title="No course offerings yet" body="Offerings appear here once your program's courses are set up for a term. Mapping starts from there." />
      )
  else body = children({ ...data, state, overlay, setOverlay, lists, ...model, setDidactic })

  return (
    <PageFrame title="Course mapping">
      <div className="flex flex-col gap-4" data-page-type="list" data-admin-lab={`course-mapping-${variant}`}>
        {body}
      </div>
    </PageFrame>
  )
}
