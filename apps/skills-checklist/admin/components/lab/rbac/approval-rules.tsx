"use client"

/**
 * Approval rules (admin permission `configureApprovalRules`, REQ SC-15): which skills hold evidence for approval and how much each
 * holds now. Read from the same queue rows the Approvals list shows (lib/lab/rbac.ts approvalRules), so per-skill counts can be
 * checked against the queue. The "Change rule" link renders only when the role can configure.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { DataTable } from "@exxatdesignux/ui/components/data-table"
import type { ColumnDef } from "@exxatdesignux/ui/components/data-table/types"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelToolbar, railTriggerProps } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { configureHref } from "@/lib/lab/library"
import { reviewItemHref, plural } from "@/lib/lab/reviewer"
import { approvalRules, can, type ApprovalRuleRow, type StaffRole } from "@/lib/lab/rbac"
import { capitalize, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import type { LabScope } from "@/lib/lab/scope"
import { useReviewer } from "@/components/lab/reviewer/use-reviewer"
import { AgeText, LINK } from "@/components/lab/reviewer/parts"

export function SettingBadge({ on }: { on: boolean }) {
  return on ? <StatusBadge label="Asks for approval" tone="neutral" icon="fa-scale-balanced" size="sm" /> : <StatusBadge label="Not set" tone="neutral" icon="fa-circle-dashed" size="sm" />
}

export function RulesTable({ rows, scope, role, compact = false }: { rows: ApprovalRuleRow[]; scope: LabScope; role: StaffRole; compact?: boolean }) {
  const configure = can(role, "configureApprovalRules")
  const columns = React.useMemo<ColumnDef<ApprovalRuleRow>[]>(() => {
    const cols: ColumnDef<ApprovalRuleRow>[] = [
      {
        key: "name",
        label: capitalize(skillNoun()),
        width: compact ? 230 : 260,
        sortable: true,
        cell: (r) => (
          <span className="flex min-w-0 flex-col py-0.5">
            <span className="truncate text-sm font-medium text-foreground">{r.name}</span>
            <span className="truncate text-xs text-muted-foreground">{compact ? `${r.section} · ${r.setting ? "Asks for approval" : "Approval not set"}` : r.section}</span>
          </span>
        ),
      },
      ...(compact ? [] : [{ key: "setting", label: "Approval", width: 160, cell: (r: ApprovalRuleRow) => <SettingBadge on={r.setting} /> }]),
      {
        key: "holding",
        label: "Holds now",
        width: 104,
        sortable: true,
        cell: (r) =>
          r.holding && r.oldestKey ? (
            <Link className={`${LINK} tabular-nums`} href={reviewItemHref(scope, r.oldestKey)} aria-label={`${r.name}: ${plural(r.holding, "submission", "submissions")} held. Review the oldest`}>
              {r.holding}
            </Link>
          ) : (
            <span className="tabular-nums text-muted-foreground">0</span>
          ),
      },
    ]
    if (!compact) {
      cols.push(
        { key: "students", label: "Students", width: 96, sortable: true, cell: (r) => <span className="tabular-nums text-sm">{r.students}</span> },
        { key: "oldestDays", label: "Oldest", width: 96, sortable: true, cell: (r) => (r.holding ? <AgeText days={r.oldestDays} /> : <span className="text-sm text-muted-foreground">None</span>) },
      )
    }
    if (configure) {
      cols.push({
        key: "actions",
        label: "Change rule",
        width: 132,
        resizable: false,
        header: () => <span className="sr-only">Change rule</span>,
        cell: (r) => (
          <Button asChild variant="ghost" size="sm">
            <Link href={configureHref(r.skillId)} aria-label={`Change the rule for ${r.name}`}>Change rule</Link>
          </Button>
        ),
      })
    }
    return cols
  }, [compact, configure, scope])
  return (
    <div data-region="rules">
      <DataTable<ApprovalRuleRow>
        data={rows}
        columns={columns}
        getRowId={(r) => r.skillId}
        searchable={false}
        showQueryControls={false}
        edgeInset={false}
        emptyState={<p className="p-4 text-sm text-muted-foreground">{`No ${skillNoun()} asks for approval.`}</p>}
      />
    </div>
  )
}

/** Variant A's one admin addition: an "Approval rules" button that opens the rules beside the reused reviewer queue. */
export function RulesSheetTrigger({ role }: { role: StaffRole }) {
  const ctx = useReviewer()
  const [open, setOpen] = React.useState(false)
  const rows = ctx.scoped?.rows ?? []
  const model = React.useMemo(() => (ctx.state ? approvalRules(ctx.state, rows) : null), [ctx.state, rows])
  if (!can(role, "configureApprovalRules")) return null
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open} {...railTriggerProps()}>
        Approval rules
      </Button>
      <FloatingSheetPanel open={open} onOpenChange={setOpen}>
        <FloatingSheetPanelContent contentSlot="lab-admin-approval-rules" size="md">
          <FloatingSheetPanelToolbar />
          {model ? (
            <>
              <FloatingSheetPanelHeader title="Approval rules" subtitle={`${plural(model.ruleCount, `${skillNoun()} asks`, `${skillNounPlural()} ask`)} for approval. ${plural(model.ruleHeld, "submission is", "submissions are")} held by a rule in this scope.`} />
              <FloatingSheetPanelBody className="flex flex-col gap-3 px-4 pb-4">
                <RulesTable rows={model.rules} scope={ctx.scope} role={role} compact />
              </FloatingSheetPanelBody>
            </>
          ) : null}
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </>
  )
}

/**
 * Places a role's page action in the header row of a reused screen whose frame takes no actions (ApprovalsFrame). The frame's
 * PageFrame pads 20 px top and 16 or 24 px sides, so the slot sits in the same row as the 20 px title, at the right edge.
 */
export function HeaderActionSlot({ action, children }: { action: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative" data-rbac-header-slot>
      {children}
      <div className="absolute top-5 right-4 md:right-6">{action}</div>
    </div>
  )
}
