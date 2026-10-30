"use client"

/**
 * Chrome shared by the director screens: PageHeader (20 px serif title, no subtitle, D-L8b), the toolbar row above the first
 * figure or table with the screen's own controls and the shared Filters group (term and course scope shown beside it, applied
 * values as removable chips; no Compare with, the director does not compare against a clock), the polite announcement, and the states every screen gets the same way: loading (final-shape skeleton), empty scope
 * (names the filters, one Remove each), a scope that cannot produce evidence (explained with one Remove per filter, REQ RP-09),
 * no required skills (?state=empty), stale (the scope bar's own badge). A screen lays out
 * only its own regions; error and partial are per region and live in the screen.
 */
import { skillNounPlural } from "@/lib/lab/terms"
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import type { PageHeaderActionItem } from "@exxatdesignux/ui/components/ui/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { PageFrame } from "@/components/skills/page-header"
import { ScopeAppliedLine, ScopeBar, ScopeFiltersButton, type ScopeBarProps } from "@/components/lab/dashboard/scope-bar"
import { ImpossibleScopeBanner, useImpossibleScope } from "@/components/lab/dashboard/impossible-scope"
import { SampleDataBadge } from "@/components/lab/import/sample-badge"
import { Calm, DirectorSkeleton } from "@/components/lab/director/parts"
import { useDirector, type DirectorContext } from "@/components/lab/director/use-director"
import { plural, type Readiness } from "@/lib/lab/director"
import { SCOPE_LABEL, removeScope, type ScopeKey } from "@/lib/lab/scope"
import { recountText } from "@/lib/lab/dashboard"
import { TYPE } from "@/components/lab/type-scale"

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
  /** A control that shares the scope bar's row, before Filters (Reports: the required-set control). */
  toolbar?: (ctx: DirectorContext) => React.ReactNode
  /**
   * Page tabs above the shared toolbar (Reports, D-L8c): one Filters control serves every tab, so the applied chips carry across.
   * Every state (loading, empty, impossible scope) renders inside the active tab's panel, so the tabs never disappear.
   */
  tabs?: { value: string; items: Array<{ value: string; label: string }>; onChange: (v: string) => void; ariaLabel: string }
  /** A header control that needs the model (Reports, Readiness tab: the Export menu), so Export sits in the header on every tab. */
  headerAction?: (ctx: DirectorContext & { model: Readiness }) => React.ReactNode
}

export function DirectorPage({ title, variant, pageType, actionItems, showScope = true, announce, children, width = "full", toolbar, tabs, headerAction }: DirectorPageProps) {
  const ctx = useDirector()
  const m = ctx.model
  const applied = (["cohort", "group", "course", "cat", "tag", "loc", "setting"] as ScopeKey[]).filter((k) => !!ctx.scope[k])
  // RP-09: a scope that cannot produce evidence is explained in place of the figures (never silent zeros). Scope pages only.
  const impossible = useImpossibleScope(showScope ? ctx.state : null, ctx.scope)
  const recount = showScope ? recountText(ctx.scope) : null
  const scopeProps: ScopeBarProps | null = m ? { scope: ctx.scope, options: m.options, termName: m.population.term.name, onChange: ctx.setScope, chipValue: ctx.chip, showBasis: false, stale: ctx.demo === "stale" } : null
  // Dashboards (no table owns the filter): page-wide Filters in the header beside the actions, applied chips on one line under
  // it only when something is applied (Romit 2026-10-30). Lists keep Filters in the toolbar of the table it filters.
  const inHeader = showScope && pageType === "dashboard" && !toolbar
  const head = inHeader && scopeProps ? (
    <ScopeAppliedLine {...scopeProps} />
  ) : showScope && m ? (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2" data-region="toolbar">
      {toolbar ? toolbar(ctx) : null}
      <ScopeBar
        scope={ctx.scope}
        options={m.options}
        termName={m.population.term.name}
        onChange={ctx.setScope}
        chipValue={ctx.chip}
        showBasis={false}
        stale={ctx.demo === "stale"}
      />
    </div>
  ) : null
  const status = (
    <p role="status" aria-live="polite" className="sr-only">
      {/* RP-09 for screen readers too: an impossible scope announces the explanation, never "0 of 38 complete". */}
      {!ctx.ready || !m ? "Loading" : impossible ? impossible.text : announce ? announce(m) : `${plural(m.rows.length, "student", "students")} in scope`}
    </p>
  )
  const body = !ctx.ready || !m ? (
    <DirectorSkeleton />
  ) : ctx.demo === "empty" || m.required.length === 0 ? (
    <Calm icon="fa-list-check" title={`No ${skillNounPlural()} are marked required for graduation`} body={`Readiness appears here once the program marks which ${skillNounPlural()} each student must achieve before graduating.`} />
  ) : impossible ? (
    <ImpossibleScopeBanner state={ctx.state} scope={ctx.scope} onChange={ctx.setScope} />
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
    <>
      {/* RP-08: under a location or setting filter, say once that the figures count only the evidence gathered there (the same
          line, from the same function, as the admin dashboards, drills, Reports and Export). Hidden when the scope is impossible:
          the RP-09 banner says so instead. */}
      {recount ? <p className={TYPE.helper} data-recount>{recount}</p> : null}
      {children({ ...ctx, model: m })}
    </>
  )
  return (
    <PageFrame title={typeof title === "function" ? title(ctx) : title} actionItems={actionItems} actions={<>{inHeader && scopeProps ? <ScopeFiltersButton {...scopeProps} /> : null}{headerAction && ctx.ready && m ? headerAction({ ...ctx, model: m }) : null}<SampleDataBadge /></>} width={width}>
      {tabs ? (
        <Tabs value={tabs.value} onValueChange={tabs.onChange} className="flex flex-col gap-4" data-page-type={pageType} data-director-lab={variant} data-reports-tab={tabs.value}>
          <TabsList variant="line" ariaLabel={tabs.ariaLabel}>
            {tabs.items.map((t) => (
              <TabsTrigger key={t.value} value={t.value} data-tab={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>
          {head}
          {status}
          {/* The active tab's panel (the selected trigger's aria-controls must name a panel that exists, WCAG 4.1.2). */}
          <TabsContent value={tabs.value} className="mt-0 flex flex-col gap-4">{body}</TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col gap-4" data-page-type={pageType} data-director-lab={variant}>
          {head}
          {status}
          {body}
        </div>
      )}
    </PageFrame>
  )
}
