"use client"

/**
 * Admin Dashboard, variant B: exceptions first ("who do I act on?"), concept B in docs/knowledge/design/dashboard-concepts.
 * An inbox: five exception counts are tabs (students behind, requests waiting 15 days or more, awaiting approval, returned,
 * unverified evaluators holding requests); the chosen tab is one ranked table with the cause in numbers; a row opens a side
 * peek. Tab and peek live in the URL (?tab=, ?peek=). No hero and no population charts; the counts are the only figures.
 * Demo states: ?state=loading|empty|clear|error|partial|stale.
 */
import * as React from "react"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { DashboardPage, type DashboardContext } from "@/components/lab/dashboard/frame"
import { NeedsYou, SetupHero, setupOnly } from "@/components/lab/dashboard/cards"
import { ExceptionsView } from "@/components/lab/dashboard/exceptions"
import { EXCEPTION_KINDS, buildExceptions, type ExceptionKind } from "@/lib/lab/dashboard"

function Inbox({ ctx }: { ctx: DashboardContext }) {
  const { data, model, scope, demo, clearDemo, param, setParams } = ctx
  const lists = React.useMemo(() => buildExceptions(data, model), [data, model])
  const raw = param("tab")
  const tab: ExceptionKind = (EXCEPTION_KINDS as string[]).includes(raw ?? "") ? (raw as ExceptionKind) : "behind"
  return (
    <div className="flex flex-col gap-4">
      {demo === "error" ? (
        <LocalBanner variant="error" title="Students behind could not be calculated" retry={{ label: "Try again", onClick: clearDemo }}>
          The other lists are current.
        </LocalBanner>
      ) : null}
      {demo === "partial" ? (
        <LocalBanner variant="info" title="Evaluator names could not be checked">
          The unverified evaluators list is empty until the check runs again. The other lists are current.
        </LocalBanner>
      ) : null}
      <ExceptionsView
        data={data}
        model={model}
        scope={scope}
        lists={demo === "error" ? { ...lists, behind: [] } : demo === "partial" ? { ...lists, unverified: [] } : lists}
        tab={tab}
        onTab={(t) => setParams({ tab: t === "behind" ? null : t, peek: null })}
        peek={param("peek")}
        onPeek={(id) => setParams({ peek: id })}
        filters={ctx.filters}
      />
    </div>
  )
}

export function AdminDashboardB() {
  return (
    // Filters scopes every exception list, so it shares the tab row (D-L8b); the empty demo has no tabs and keeps the frame row.
    <DashboardPage variant="B" filtersInBody={(ctx) => ctx.demo !== "empty"}>
      {(ctx) =>
        ctx.demo === "empty" ? (
          <div className="flex flex-col gap-4">
            <SetupHero termName={ctx.model.term.name} />
            <NeedsYou model={setupOnly(ctx.model)} />
          </div>
        ) : (
          <Inbox ctx={ctx} />
        )
      }
    </DashboardPage>
  )
}
