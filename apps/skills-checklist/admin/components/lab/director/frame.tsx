"use client"

/**
 * Chrome shared by the director screens: PageHeader (20 px serif title, no subtitle prose), the shared scope bar on one row
 * (term, cohort, course unless the screen moves it into Filters, Filters, as-of with Refresh; no Compare with, the director does not compare against a
 * clock), the polite announcement, and the states every screen gets the same way: loading (final-shape skeleton), empty scope
 * (names the filters, one Remove each), no required skills (?state=empty), stale (the scope bar's own badge). A screen lays out
 * only its own regions; error and partial are per region and live in the screen.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import type { PageHeaderActionItem } from "@exxatdesignux/ui/components/ui/page-header"
import { PageFrame } from "@/components/skills/page-header"
import { ScopeBar } from "@/components/lab/dashboard/scope-bar"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { Calm, DirectorSkeleton } from "@/components/lab/director/parts"
import { useDirector, type DirectorContext } from "@/components/lab/director/use-director"
import { plural, type Readiness } from "@/lib/lab/director"
import { SCOPE_LABEL, removeScope, type ScopeKey } from "@/lib/lab/scope"

export interface DirectorPageProps {
  title: string | ((ctx: DirectorContext) => string)
  variant: string
  pageType: "dashboard" | "list" | "detail"
  actionItems?: PageHeaderActionItem[]
  /** Detail pages hide the scope bar (the record is one student). */
  showScope?: boolean
  announce?: (m: Readiness) => string
  children: (ctx: DirectorContext & { model: Readiness }) => React.ReactNode
  width?: "full" | "wide"
  /** List-shaped screens move Course into the scope bar's Filters popover (strategy/07 list budget). */
  courseInFilters?: boolean
}

export function DirectorPage({ title, variant, pageType, actionItems, showScope = true, announce, children, width = "full", courseInFilters = false }: DirectorPageProps) {
  const ctx = useDirector()
  const m = ctx.model
  const applied = (["cohort", "group", "course", "cat", "tag", "loc", "setting"] as ScopeKey[]).filter((k) => !!ctx.scope[k])
  return (
    <PageFrame title={typeof title === "function" ? title(ctx) : title} actionItems={actionItems} actions={<SampleDataBadge />} width={width}>
      <div className="flex flex-col gap-4" data-page-type={pageType} data-director-lab={variant}>
        {showScope && m ? (
          <ScopeBar
            scope={ctx.scope}
            options={m.options}
            termName={m.population.term.name}
            onChange={ctx.setScope}
            chipValue={ctx.chip}
            asOf={ctx.asOf}
            onRefresh={ctx.refresh}
            stale={ctx.demo === "stale"}
            showBasis={false}
            courseInFilters={courseInFilters}
          />
        ) : null}
        <p role="status" aria-live="polite" className="sr-only">
          {!ctx.ready || !m ? "Loading" : announce ? announce(m) : `${plural(m.rows.length, "student", "students")} in scope`}
        </p>
        {!ctx.ready || !m ? (
          <DirectorSkeleton />
        ) : ctx.demo === "empty" || m.required.length === 0 ? (
          <Calm icon="fa-list-check" title="No skills are marked required for graduation" body="Readiness appears here once the program marks which skills each student must achieve before graduating." />
        ) : m.rows.length === 0 ? (
          <Calm icon="fa-filter" title="No students in this scope" body={`${ctx.scope.cohort || "These filters"} ${ctx.scope.course ? "with this course " : ""}match nobody in ${m.population.term.name}.`}>
            <span className="flex flex-wrap gap-2 pt-1">
              {applied.map((k) => (
                <Button key={k} type="button" variant="outline" size="sm" onClick={() => ctx.setScope(removeScope(ctx.scope, k))}>
                  {`Remove ${SCOPE_LABEL[k].toLowerCase()}`}
                </Button>
              ))}
            </span>
          </Calm>
        ) : (
          children({ ...ctx, model: m })
        )}
      </div>
    </PageFrame>
  )
}
