"use client"

/**
 * Director Attainment: the admin Attainment pieces (components/lab/admin-b: StudentMatrix, SkillsTable, EvidencePeek, ExportPanel;
 * model lib/lab/attainment.ts buildAttainment) rendered read-only with the director permission set (lib/lab/rbac.ts): export yes,
 * configure no (the admin views carry no configure links, so nothing is hidden, only nothing is added). The frame is the director's
 * own (components/lab/director/frame.tsx): the cohort is preselected to the graduating cohort and stays a filter. Above the view, a
 * readiness line for that cohort from the same model the director dashboard uses (buildReadiness), each figure a link to the list,
 * in the four graduation bands (D-X11). The view is read against "Required to graduate" by default for the graduating cohort
 * (D-X12, `defaultRequiredSet`), so the matrix totals equal the readiness line; "Required this term" is one link away (`set`).
 * Director and verification are v2 proposals, not REQ [AUDIT T3]; nothing here verifies.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { DirectorPage } from "@/components/lab/director/frame"
import type { DirectorContext } from "@/components/lab/director/use-director"
import { LINK } from "@/components/lab/director/parts"
import { useSnapshot } from "@/components/lab/dashboard/use-dashboard"
import { useAttainmentUrl } from "@/components/lab/admin-b/use-att-url"
import { MATRIX_BINS, StudentMatrix } from "@/components/lab/admin-b/student-matrix"
import { SkillsTable } from "@/components/lab/admin-b/attainment-tables"
import { EvidencePeek } from "@/components/lab/admin-b/evidence-peek"
import { ExportPanel } from "@/components/lab/admin-b/export-panel"
import { StateLegend } from "@/components/lab/admin-b/state-viz"
import { RequiredSetSwitch, useRequiredSet } from "@/components/lab/admin-b/required-set-switch"
import { capitalize, skillNounPlural } from "@/lib/lab/terms"
import { DiamondGlyph, VIZ } from "@/components/lab/viz"
import { BASIS_LABEL, conditionLabel } from "@/lib/lab/dashboard"
import { buildAttainment, peekRecords, scopeLines, type AttView } from "@/lib/lab/attainment"
import { GRADUATION_LIST, GRADUATION_STAGES, GRADUATION_STAGE_LABEL, listHref, plural, type GraduationStage, type Readiness } from "@/lib/lab/director"
import { basisOf } from "@/lib/lab/scope"
import { can } from "@/lib/lab/rbac"
import type { V2State } from "@/lib/v2/types"

type DirectorView = "matrix" | "skills"
const ROLE = "director" as const

export function DirectorAttainment({ variant, view }: { variant: string; view: DirectorView }) {
  const [exportOpen, setExportOpen] = React.useState(false)
  const actionItems = can(ROLE, "export") ? [{ id: "export", label: "Export", icon: "fa-arrow-down-to-line", variant: "outline" as const, onSelect: () => setExportOpen(true) }] : []
  return (
    <DirectorPage title="Attainment" variant={`attainment-${variant}`} pageType="list" courseInFilters actionItems={actionItems} announce={(m) => `${plural(m.rows.length, "student", "students")} in scope`}>
      {(ctx) => <Body ctx={ctx} view={view} exportOpen={exportOpen} setExportOpen={setExportOpen} />}
    </DirectorPage>
  )
}

function Body({ ctx, view, exportOpen, setExportOpen }: { ctx: DirectorContext & { model: Readiness }; view: DirectorView; exportOpen: boolean; setExportOpen: (o: boolean) => void }) {
  const attView: AttView = view === "matrix" ? "students" : "skills"
  const url = useAttainmentUrl(attView)
  const snap = useSnapshot()
  const state = snap.state as V2State | null
  const reqSet = useRequiredSet(state, ctx.scope, url.param, url.hrefWith)
  const model = React.useMemo(() => (state ? buildAttainment(state, ctx.scope, undefined, { basis: reqSet.basis }) : null), [state, ctx.scope, reqSet.basis])
  const peek = React.useMemo(() => (model && state && url.peek ? peekRecords(model, state, url.peek) : null), [model, state, url.peek])
  if (!model || !state) return null
  const term = ctx.model.population.term
  const lines = [...scopeLines(ctx.scope, term.name, BASIS_LABEL[basisOf(ctx.scope)], ctx.asOf, ctx.chip), `Required set: ${model.basisLabel}`]
  const toGraduate = model.basis === "toGraduate"
  const behindLabel = toGraduate ? GRADUATION_STAGE_LABEL.far : "Behind"
  const fileStem = `attainment-${(ctx.scope.cohort || "all-cohorts").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${attView}`
  return (
    <>
      <ReadinessLine ctx={ctx} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-sm font-semibold text-foreground">
            {view === "matrix" ? `Students by section · ${model.students.length}` : `${capitalize(skillNounPlural())}, most not achieved first · ${model.skills.length}`}
          </h2>
          <RequiredSetSwitch basis={model.basis} hrefFor={reqSet.hrefFor} />
        </div>
        {view === "matrix" ? (
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
            {MATRIX_BINS.map((b) => (
              <li key={b.label} className="flex items-center gap-1.5">
                <span className="inline-block size-3 rounded-sm" style={{ background: b.fill, boxShadow: `inset 0 0 0 1px ${VIZ.grid}` }} aria-hidden="true" />
                {b.label}
              </li>
            ))}
            <li className="flex items-center gap-1.5"><DiamondGlyph size={10} />{toGraduate ? behindLabel : conditionLabel(basisOf(ctx.scope))}</li>
          </ul>
        ) : (
          <StateLegend />
        )}
      </div>
      <div data-region="view">
        {view === "matrix" ? <StudentMatrix model={model} peekHref={url.peekHref} behindLabel={behindLabel} activePeek={url.peek} /> : <SkillsTable rows={model.skills} peekHref={url.peekHref} />}
      </div>
      <EvidencePeek peek={peek} data={state} evidence={model.pop.evidenceState} scope={ctx.scope} onClose={url.closePeek} />
      {can(ROLE, "export") ? <ExportPanel open={exportOpen} onOpenChange={setExportOpen} model={model} data={state} view={attView} scopeLines={lines} fileStem={fileStem} /> : null}
    </>
  )
}

export const STAGE_ICON: Record<GraduationStage, React.ReactNode> = {
  complete: <i className="fa-solid fa-circle-check text-xs text-muted-foreground" aria-hidden="true" />,
  "one-short": <DiamondGlyph size={10} />,
  short: <DiamondGlyph size={10} />,
  far: <DiamondGlyph size={10} />,
}

/** The director's question, answered first: how ready is the graduating cohort. Four bands (D-X11) that sum to the cohort. */
export function ReadinessLine({ ctx }: { ctx: DirectorContext & { model: Readiness } }) {
  const m = ctx.model
  const who = ctx.scope.cohort || "All cohorts"
  return (
    <section aria-label={`Graduation readiness, ${who}`} className="flex flex-wrap items-baseline gap-x-6 gap-y-2 rounded-lg border border-border bg-(--brand-tint-subtle) px-4 py-3" data-region="readiness">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{who}</span>
        {` ready to graduate, every required skill · ${plural(m.rows.length, "student", "students")}`}
      </p>
      {GRADUATION_STAGES.map((st) => (
        <span key={st} className="inline-flex items-baseline gap-1.5 text-sm text-muted-foreground" data-figure data-band={st} data-band-count={m.graduation[st]}>
          <span className="self-center">{STAGE_ICON[st]}</span>
          {m.graduation[st] ? (
            <Link className={`${LINK} text-base tabular-nums`} href={listHref(ctx.scope, { list: GRADUATION_LIST[st] })} aria-label={`${m.graduation[st]} ${GRADUATION_STAGE_LABEL[st].toLowerCase()}. Open the list`}>
              {m.graduation[st]}
            </Link>
          ) : (
            <span className="text-base tabular-nums text-foreground">0</span>
          )}
          {GRADUATION_STAGE_LABEL[st].toLowerCase()}
        </span>
      ))}
    </section>
  )
}
