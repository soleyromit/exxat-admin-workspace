"use client"

/**
 * Course offering detail — identity header, module tabs, and per-module bodies.
 * Route: `/<product>/learning-activities/courses/:offeringId`
 */

import * as React from "react"
import { Navigate, useNavigate, useSearchParams } from "react-router-dom"

import { FavoriteNameCell, HubTable, PillCell, RowActionsCell, TableNewRowDot, type BulkAction } from "@/components/data-views"
import type { ColumnDef } from "@/components/data-table/types"
import { PageHeader } from "@/components/page-header"
import { PageTitleRecordSwitcher } from "@/components/page-breadcrumb-trail"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { PersonAvatar } from "@/components/pce/person-avatar"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ExportDrawer } from "@/components/export-drawer"
import { KeyMetrics } from "@/components/key-metrics"
import { Kbd } from "@/components/ui/kbd"
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge"
import { Tabs, TabsContent, TabsList, TabsListScrollRegion, TabsTrigger } from "@/components/ui/tabs"
import { Tip } from "@/components/ui/tip"
import { useProduct } from "@/contexts/product-context"
import { useDocumentTitle } from "@/hooks/use-document-title"
import { initialsFromDisplayName } from "@/lib/initials-from-name"
import { cn } from "@/lib/utils"
import { productPersistKey } from "@/stores/app-store"
import {
  COURSE_DETAIL_MODULE_LABELS,
  type CourseDetailModule,
  type CourseFormsPanel,
  laCourseDetailHref,
  laHubFromCourseDetailHref,
  offeringDetailTitle,
  parseCourseDetailNav,
} from "@/lib/learning-activities-course-detail-nav"
import { currentLearningActivitiesBasePath } from "@/lib/learning-activities-nav"
import {
  courseFormRows,
  courseFormReviewRows,
  courseGradebookRows,
  coursePracticumRows,
  courseReportRows,
  type CourseFormRow,
  type CourseFormReviewRow,
  type CourseGradebookRow,
  type CoursePracticumRow,
  type CourseReportRow,
} from "@/lib/mock/learning-activities-course-detail"
import {
  courseOfferingModuleSnapshots,
  courseOfferingOverviewMetrics,
  courseOfferingStaticQuickActions,
  courseOfferingWhatsNewItems,
  type CourseOverviewAction,
  type CourseWhatsNewItem,
} from "@/lib/mock/learning-activities-course-overview"
import {
  getCourseOfferingById,
  LEARNING_ACTIVITY_OFFERINGS,
  learningActivityTypeLabel,
  offeringDisplayTitle,
  type CourseOffering,
  type LearningActivityType,
} from "@/lib/mock/learning-activities-offerings"

const DETAIL_MODULES: CourseDetailModule[] = [
  "overview",
  "setup",
  "forms-evaluations",
  "patient-log",
  "timesheet",
  "time-off",
  "gradebook",
  "reports",
]

/**
 * Tab strip omits "setup" — Configure is low-frequency and config-shaped,
 * not a peer of the daily-use operational modules, so it lives in the page
 * header's overflow menu instead (`exxat-page-header-actions.mdc`). Content
 * routing still uses the full `DETAIL_MODULES` list so `?module=setup`
 * deep links keep working.
 */
const VISIBLE_DETAIL_MODULES = DETAIL_MODULES.filter(module => module !== "setup")

const ACTIVITY_MODULE_IDS = new Set<LearningActivityType>([
  "forms-evaluations",
  "patient-log",
  "timesheet",
  "time-off",
])

function isActivityModule(module: CourseDetailModule): module is LearningActivityType {
  return ACTIVITY_MODULE_IDS.has(module as LearningActivityType)
}

/** Tone for a "count / total" completion metric — derives from the ratio, never hardcoded. */
/** Basis filter shared by every Forms/Evaluations table — one filter, not a page-level toggle. */
const FORMS_BASIS_FILTER_OPTIONS = [
  { value: "true", label: "Practicum based" },
  { value: "false", label: "Non-practicum based" },
]

function completionTone(count: number, total: number): StatusBadgeTone {
  if (total <= 0) return "neutral"
  if (count >= total) return "success"
  if (count === 0) return "danger"
  return "warning"
}

/**
 * Academic year + term are fixed scheduling facts about *when* this offering
 * runs — plain text, not a scannable tag (record-detail.md §4 "Identity"
 * layer). Cohort + professional year are the offering's *classification*
 * (which students it serves) and stay scannable `PillCell` chips. Neither is
 * a status — nothing here drives a decision or changes state, so no `Badge`
 * is fabricated (`record-detail.md` §4 "Status" layer only applies to
 * decision-driving state, which this dataset doesn't have at the header).
 * All four render inline in one row below the title — splitting them across
 * a subtitle line and a separate chip row reads as two disconnected facts
 * about the same offering instead of one identity line.
 */
function OfferingMetaRow({ offering }: { offering: CourseOffering }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="text-xs text-muted-foreground sm:text-sm">
        {offering.academicYear} · {offering.term}
      </span>
      <PillCell label={offering.cohort} icon="fa-users" />
      <PillCell label={offering.professionalYear} icon="fa-graduation-cap" />
    </div>
  )
}

function ModuleDisabledBanner({
  offering,
  module,
}: {
  offering: CourseOffering
  module: LearningActivityType
}) {
  const action = offering.activityActions.find(a => a.type === module)
  if (!action || action.enabled) return null
  return (
    <div
      role="status"
      className="mb-4 rounded-2 border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
    >
      <span className="font-medium text-foreground">{learningActivityTypeLabel(module)}</span> is not
      enabled for this offering
      {action.disabledReason ? ` — ${action.disabledReason}` : "."}
    </div>
  )
}

function OfferingConfigureCards({ offering }: { offering: CourseOffering }) {
  const enabled = offering.activityActions.filter(a => a.enabled)
  const disabled = offering.activityActions.filter(a => !a.enabled)

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Offering metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Course number</span>
            <span className="font-mono tabular-nums text-foreground">{offering.courseNumber}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Course name</span>
            <span className="text-right text-foreground">{offering.courseName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Academic year</span>
            <span className="text-foreground">{offering.academicYear}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Term</span>
            <span className="text-foreground">{offering.term}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Cohort</span>
            <span className="text-foreground">{offering.cohort}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Professional year</span>
            <span className="text-foreground">{offering.professionalYear}</span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Learning activities</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {enabled.map(action => (
            <div key={action.type} className="flex items-center justify-between gap-3">
              <span className="text-sm text-foreground">{learningActivityTypeLabel(action.type)}</span>
              <StatusBadge label="Enabled" tone="success" />
            </div>
          ))}
          {disabled.map(action => (
            <div key={action.type} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground">{learningActivityTypeLabel(action.type)}</span>
                <StatusBadge label="Disabled" tone="neutral" />
              </div>
              {action.disabledReason ? (
                <p className="text-xs text-muted-foreground">{action.disabledReason}</p>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function CourseOverviewPanel({
  offering,
  offeringId,
  onNavigate,
}: {
  offering: CourseOffering
  offeringId: string
  onNavigate: (patch: { module: CourseDetailModule; formsPanel?: CourseFormsPanel }) => void
}) {
  const metrics = React.useMemo(
    () => courseOfferingOverviewMetrics(offeringId, offering),
    [offering, offeringId],
  )
  const actions = React.useMemo(() => courseOfferingStaticQuickActions(offering), [offering])
  const whatsNew = React.useMemo(() => courseOfferingWhatsNewItems(offeringId), [offeringId])
  const moduleSnapshots = React.useMemo(
    () => courseOfferingModuleSnapshots(offeringId, offering),
    [offering, offeringId],
  )

  const runAction = (action: CourseOverviewAction | CourseWhatsNewItem) => {
    onNavigate({
      module: action.module,
      ...(action.formsPanel ? { formsPanel: action.formsPanel } : {}),
    })
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <KeyMetrics variant="flat" metrics={metrics} showHeader={false} metricsSingleRow />

      <section aria-labelledby="course-overview-actions-heading">
        <h2
          id="course-overview-actions-heading"
          className="mb-2 text-sm font-medium text-muted-foreground"
        >
          Quick actions
        </h2>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {actions.map(action => (
            <li key={action.id} className="max-w-full">
              {/* DS Button, not Badge-around-raw-<button>: same chip look via
                  h-7 + rounded chip radius, real DS focus/keyboard chrome. */}
              <Button
                variant="outline"
                size="xs"
                onClick={() => runAction(action)}
                className="h-7 max-w-full gap-1.5 px-2.5 text-xs font-medium hover:border-brand/40 hover:bg-interactive-hover-soft"
              >
                <i
                  className={`fa-light ${action.icon} shrink-0 text-xs text-muted-foreground`}
                  aria-hidden="true"
                />
                <span className="truncate">{action.label}</span>
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {whatsNew.length > 0 ? (
        <section aria-labelledby="course-overview-whats-new-heading">
          <h2
            id="course-overview-whats-new-heading"
            className="mb-3 text-sm font-medium text-muted-foreground"
          >
            What&apos;s new
          </h2>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {whatsNew.map(item => (
                /* DS Button as a full-width list row: h-auto + rounded-none +
                   whitespace-normal override the pill anatomy so the divided
                   rows keep their shape; focus ring comes from the DS. */
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => runAction(item)}
                  className="h-auto w-full items-start justify-start gap-3 whitespace-normal rounded-none px-4 py-3 text-left font-normal hover:bg-muted/30"
                >
                  <TableNewRowDot className="mt-2" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-foreground">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{item.subtitle}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{item.occurredAt}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section aria-labelledby="course-overview-modules-heading">
        <h2
          id="course-overview-modules-heading"
          className="mb-3 text-sm font-medium text-muted-foreground"
        >
          Across modules
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {moduleSnapshots.map(snapshot => (
            <Card key={snapshot.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{snapshot.title}</CardTitle>
                  <StatusBadge label={snapshot.statusLabel} tone={snapshot.statusTone} size="sm" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 pt-0">
                <p className="text-sm text-foreground">{snapshot.summary}</p>
                {snapshot.detail ? (
                  <p className="text-xs text-muted-foreground">{snapshot.detail}</p>
                ) : null}
                {snapshot.disabledReason ? (
                  <p className="text-xs text-muted-foreground">{snapshot.disabledReason}</p>
                ) : null}
                {snapshot.enabled ? (
                  <div className="mt-auto pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() =>
                        onNavigate({
                          module: snapshot.id,
                          ...(snapshot.id === "forms-evaluations"
                            ? { formsPanel: "catalog" as const }
                            : {}),
                        })
                      }
                    >
                      View {snapshot.title}
                      <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}

/**
 * Forms/Evaluations catalog — one row per form, merging what used to be two
 * separate "Overview" and "Distribution" views (both are per-form grain, so
 * they're one table, not two tabs). A form with no `distributedTotal` simply
 * hasn't gone out yet — "Not yet distributed" reads as an empty state, not a
 * missing feature. Per-student review status is a drill-in (`onReview`),
 * opened as a sheet, not a third persistent view.
 */
function FormsTable({
  rows,
  persistKey,
  onToggleFavorite,
}: {
  rows: CourseFormRow[]
  persistKey: string
  onToggleFavorite: (row: CourseFormRow) => void
}) {
  const columns = React.useMemo<ColumnDef<CourseFormRow>[]>(
    () => [
      // Explicit "select" column — DataTable/HubTable never auto-inject the
      // checkbox cell; without this, `bulkActions` below has nothing to
      // attach to and the header/row checkboxes silently never render.
      {
        key: "select",
        label: "",
        width: 40,
        minWidth: 40,
        defaultPin: "left",
        lockPin: true,
      },
      {
        key: "name",
        label: "Forms/Evaluations name",
        width: 360,
        minWidth: 240,
        defaultPin: "left",
        lockPin: true,
        sortable: true,
        sortKey: "name",
        favoriteFilter: true,
        cellKind: "text",
        cell: row => (
          <FavoriteNameCell
            label={row.name}
            isFavorite={Boolean(row.isFavorite)}
            onToggleFavorite={() => onToggleFavorite(row)}
            interactive
            badge={row.isNew ? <TableNewRowDot className="mt-1.5" /> : null}
          />
        ),
      },
      {
        key: "initiator",
        label: "Initiator",
        width: 130,
        minWidth: 120,
        sortable: true,
        sortKey: "initiator",
        cellKind: "pill",
        cell: row => <PillCell label={row.initiator} icon="fa-user" />,
      },
      {
        key: "practicumBased",
        label: "Basis",
        width: 150,
        minWidth: 140,
        cellKind: "pill",
        cell: row => (
          <PillCell label={row.practicumBased ? "Practicum based" : "Non-practicum based"} />
        ),
        filter: { type: "select", icon: "fa-diagram-project", options: FORMS_BASIS_FILTER_OPTIONS },
      },
      {
        key: "distribution",
        label: "Distribution status",
        width: 190,
        minWidth: 170,
        cell: row =>
          row.distributedTotal ? (
            <div className="flex flex-col gap-1">
              <StatusBadge
                label={`${row.distributedCount}/${row.distributedTotal} distributed`}
                tone={completionTone(row.distributedCount ?? 0, row.distributedTotal)}
                size="sm"
              />
              {row.lastDistributedOn ? (
                <span className="text-xs text-muted-foreground">
                  Last distributed on {row.lastDistributedOn}
                </span>
              ) : null}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Not yet distributed</span>
          ),
      },
      {
        key: "submission",
        label: "Submission status",
        width: 160,
        minWidth: 140,
        cell: row =>
          row.submittedTotal ? (
            <StatusBadge
              label={`${row.submittedCount}/${row.submittedTotal} submitted`}
              tone={completionTone(row.submittedCount ?? 0, row.submittedTotal)}
              size="sm"
            />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          ),
      },
      {
        key: "actions",
        label: "",
        width: 48,
        minWidth: 48,
        defaultPin: "right",
        lockPin: true,
        cell: row => (
          <div className="flex items-center justify-center">
            <RowActionsCell<CourseFormRow>
              row={row}
              triggerLabel={`Actions for ${row.name}`}
              actions={[
                {
                  label: row.distributedTotal ? "Redistribute" : "Distribute",
                  icon: "fa-paper-plane",
                  onSelect: () => {},
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [onToggleFavorite],
  )

  const bulkActions = React.useMemo<BulkAction<CourseFormRow>[]>(
    () => [
      {
        id: "send-reminder",
        label: "Send reminder",
        icon: "fa-bell",
        ariaLabel: "Send reminder for selected forms",
        onSelect: () => {},
      },
    ],
    [],
  )

  return (
    <HubTable<CourseFormRow>
      rows={rows}
      columns={columns}
      view="table"
      hubLabel="Forms"
      lifecycleTabLabel="Forms"
      searchAriaLabel="Search forms and evaluations"
      getRowId={row => row.id}
      getRowSelectionLabel={row => row.name}
      defaultSort={{ key: "name", dir: "asc" }}
      emptyState="No forms configured for this offering."
      renderers={{}}
      supportedViewTypes={["table"]}
      persistKey={persistKey}
      bulkActions={bulkActions}
      pagination
      paginationInitialPageSize={25}
    />
  )
}

type FormReviewStatusKey = keyof CourseFormReviewRow["formStatuses"]
type FormReviewStatusValue = "not-started" | "in-progress" | "submitted"

const FORM_REVIEW_STATUS_LABEL: Record<FormReviewStatusValue, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  submitted: "Submitted",
}

const FORM_REVIEW_STATUS_TONE: Record<FormReviewStatusValue, StatusBadgeTone> = {
  "not-started": "neutral",
  "in-progress": "info",
  submitted: "success",
}

const FORM_REVIEW_STATUS_ACTION: Record<FormReviewStatusValue, string> = {
  "not-started": "Start",
  "in-progress": "Continue",
  submitted: "View",
}

/** Status + action for one form column — reads `row.formStatuses`, never hardcoded. */
function FormReviewStatusCell({
  formKey,
  status,
}: {
  formKey: FormReviewStatusKey
  status?: FormReviewStatusValue
}) {
  const resolved = status ?? "not-started"
  return (
    <div className="flex flex-col items-start gap-1.5">
      <StatusBadge label={FORM_REVIEW_STATUS_LABEL[resolved]} tone={FORM_REVIEW_STATUS_TONE[resolved]} size="sm" />
      <Button type="button" variant="outline" size="sm">
        {FORM_REVIEW_STATUS_ACTION[resolved]}
        <span className="sr-only"> — {formKey}</span>
      </Button>
    </div>
  )
}

function FormsReviewTable({
  rows,
  persistKey,
}: {
  rows: CourseFormReviewRow[]
  persistKey: string
}) {
  const columns = React.useMemo<ColumnDef<CourseFormReviewRow>[]>(
    () => [
      {
        key: "student",
        label: "Practicums",
        width: 240,
        minWidth: 200,
        defaultPin: "left",
        cell: row => (
          <div className="flex min-w-0 items-start gap-2.5">
            <PersonAvatar
              name={row.studentName}
              initials={initialsFromDisplayName(row.studentName)}
              className="mt-0.5 size-8 text-xs"
            />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{row.studentName}</span>
                {row.isNew ? <TableNewRowDot className="mt-1.5" /> : null}
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{row.studentId}</span>
              {row.electiveTag ? <PillCell label={row.electiveTag} className="w-fit" /> : null}
            </div>
          </div>
        ),
      },
      {
        key: "rotation",
        label: "Rotation",
        width: 180,
        minWidth: 140,
        cell: row => (
          <div className="flex flex-col gap-0.5 text-sm">
            <span className="font-medium text-foreground">{row.rotationName}</span>
            <span className="text-muted-foreground">{row.rotationDates}</span>
          </div>
        ),
      },
      {
        key: "faculty",
        label: "Placement faculty",
        width: 160,
        minWidth: 140,
        cell: row => <span className="text-sm text-foreground">{row.placementFaculty}</span>,
      },
      {
        key: "level1",
        label: "Level I Fieldwork",
        width: 150,
        minWidth: 130,
        cell: row => (
          <FormReviewStatusCell formKey="Level I Fieldwork" status={row.formStatuses["Level I Fieldwork"]} />
        ),
      },
      {
        key: "competency",
        label: "Competency",
        width: 150,
        minWidth: 130,
        cell: row => <FormReviewStatusCell formKey="Competency" status={row.formStatuses.Competency} />,
      },
      {
        key: "endorsement",
        label: "Preceptor endorsement",
        width: 180,
        minWidth: 160,
        cell: row => (
          <FormReviewStatusCell
            formKey="Preceptor Endorsement"
            status={row.formStatuses["Preceptor Endorsement"]}
          />
        ),
      },
      {
        key: "practicumBased",
        label: "Basis",
        filterOnly: true,
        filter: { type: "select", icon: "fa-diagram-project", options: FORMS_BASIS_FILTER_OPTIONS },
      },
    ],
    [],
  )

  return (
    <HubTable<CourseFormReviewRow>
      rows={rows}
      columns={columns}
      view="table"
      hubLabel="Forms review"
      lifecycleTabLabel="Review"
      searchAriaLabel="Search by student"
      getRowId={row => row.id}
      getRowSelectionLabel={row => row.studentName}
      emptyState="No practicum placements to review."
      renderers={{}}
      supportedViewTypes={["table"]}
      persistKey={persistKey}
      defaultSort={{ key: "student", dir: "asc" }}
      pagination
      paginationInitialPageSize={25}
    />
  )
}

function PracticumLogTable({
  rows,
  persistKey,
  mode,
}: {
  rows: CoursePracticumRow[]
  persistKey: string
  mode: "patient-log" | "timesheet"
}) {
  const columns = React.useMemo<ColumnDef<CoursePracticumRow>[]>(() => {
    const base: ColumnDef<CoursePracticumRow>[] = [
      {
        key: "student",
        label: "Practicums",
        width: 240,
        minWidth: 200,
        defaultPin: "left",
        cell: row => (
          <div className="flex min-w-0 items-start gap-2.5">
            <PersonAvatar
              name={row.studentName}
              initials={initialsFromDisplayName(row.studentName)}
              className="mt-0.5 size-8 text-xs"
            />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">{row.studentName}</span>
                {row.isNew ? <TableNewRowDot className="mt-1.5" /> : null}
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{row.studentId}</span>
              <span className="text-xs text-muted-foreground">{row.siteLocation}</span>
              {row.electiveTag ? <PillCell label={row.electiveTag} className="w-fit" /> : null}
            </div>
          </div>
        ),
      },
      {
        key: "rotation",
        label: "Rotation",
        width: 200,
        minWidth: 160,
        cell: row => (
          <div className="flex flex-col gap-0.5 text-sm">
            <span className="font-medium text-foreground">{row.rotationName}</span>
            <span className="text-muted-foreground">{row.rotationDates}</span>
          </div>
        ),
      },
    ]

    if (mode === "patient-log") {
      base.push(
        {
          key: "logCounts",
          label: "Logs count by status",
          width: 220,
          minWidth: 200,
          cell: row => {
            const counts = row.logCounts ?? { draft: 0, pending: 0, rejected: 0, approved: 0 }
            const items: { key: string; label: string; value: number; tone: StatusBadgeTone }[] = [
              { key: "draft", label: "Draft", value: counts.draft, tone: "neutral" },
              { key: "pending", label: "Pending", value: counts.pending, tone: "warning" },
              { key: "rejected", label: "Rejected", value: counts.rejected, tone: "danger" },
              { key: "approved", label: "Approved", value: counts.approved, tone: "success" },
            ]
            return (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Log counts by status">
                {items.map(item => (
                  <StatusBadge key={item.key} label={`${item.value} ${item.label}`} tone={item.tone} size="sm" />
                ))}
              </div>
            )
          },
        },
        {
          key: "lastEncounter",
          label: "Last encounter",
          width: 130,
          minWidth: 110,
          cell: row => (
            <span className="text-sm text-muted-foreground">{row.lastEncounter ?? "—"}</span>
          ),
        },
        {
          key: "lastUpdate",
          label: "Last update",
          width: 130,
          minWidth: 110,
          cell: row => <span className="text-sm text-muted-foreground">{row.lastUpdate ?? "—"}</span>,
        },
      )
    } else {
      base.push({
        key: "hours",
        label: "Timesheet hours by status",
        width: 280,
        minWidth: 240,
        cell: row => {
          const hours = row.timesheetHours ?? {
            draft: "00:00",
            submitted: "00:00",
            pending: "00:00",
            rejected: "00:00",
            approved: "00:00",
          }
          const items: { key: string; label: string; value: string; tone: StatusBadgeTone }[] = [
            { key: "draft", label: "Draft", value: hours.draft, tone: "neutral" },
            { key: "submitted", label: "Submitted", value: hours.submitted, tone: "info" },
            { key: "pending", label: "Pending", value: hours.pending, tone: "warning" },
            { key: "rejected", label: "Rejected", value: hours.rejected, tone: "danger" },
            { key: "approved", label: "Approved", value: hours.approved, tone: "success" },
          ]
          return (
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label={`Timesheet hours — draft ${hours.draft}, submitted ${hours.submitted}, pending ${hours.pending}, rejected ${hours.rejected}, approved ${hours.approved}`}
            >
              {items.map(item => (
                <StatusBadge key={item.key} label={item.value} tone={item.tone} size="sm" />
              ))}
            </div>
          )
        },
      },
      {
        key: "timesheetLastUpdate",
        label: "Last update",
        width: 130,
        minWidth: 110,
        cell: row => (
          <span className="text-sm text-muted-foreground">{row.timesheetLastUpdate ?? "—"}</span>
        ),
      })
    }

    return base
  }, [mode])

  return (
    <HubTable<CoursePracticumRow>
      rows={rows}
      columns={columns}
      view="table"
      hubLabel={mode === "patient-log" ? "Patient log" : "Timesheet"}
      lifecycleTabLabel="All practicums"
      searchAriaLabel="Search by student"
      getRowId={row => row.id}
      getRowSelectionLabel={row => row.studentName}
      emptyState="No practicum placements for this offering."
      renderers={{}}
      supportedViewTypes={["table"]}
      persistKey={persistKey}
      defaultSort={{ key: "student", dir: "asc" }}
      pagination
      paginationInitialPageSize={25}
    />
  )
}

function GradebookTable({
  rows,
  persistKey,
}: {
  rows: CourseGradebookRow[]
  persistKey: string
}) {
  const columns = React.useMemo<ColumnDef<CourseGradebookRow>[]>(
    () => [
      {
        key: "studentName",
        label: "Student name",
        width: 220,
        minWidth: 180,
        defaultPin: "left",
        sortable: true,
        sortKey: "studentName",
        cell: row => (
          <div className="flex min-w-0 items-center gap-2.5">
            {row.isNew ? <TableNewRowDot className="mt-1" /> : null}
            <PersonAvatar
              name={row.studentName}
              initials={initialsFromDisplayName(row.studentName)}
              className="size-8 text-xs"
            />
            <span className="truncate text-sm font-medium text-foreground">{row.studentName}</span>
          </div>
        ),
      },
      {
        key: "finalWeightedScore",
        label: "Final weighted score",
        width: 160,
        minWidth: 140,
        cell: row => (
          <span className="text-sm text-muted-foreground">{row.finalWeightedScore ?? "—"}</span>
        ),
      },
      {
        key: "patientLogCalScore",
        label: "Patient log — cal. score",
        width: 150,
        minWidth: 130,
        cell: row => (
          <span className="text-sm text-muted-foreground">{row.patientLogCalScore ?? "—"}</span>
        ),
      },
      {
        key: "patientLogWtScore",
        label: "Patient log — wt. score",
        width: 150,
        minWidth: 130,
        cell: row => (
          <span className="text-sm text-muted-foreground">{row.patientLogWtScore ?? "—"}</span>
        ),
      },
    ],
    [],
  )

  return (
    <HubTable<CourseGradebookRow>
      rows={rows}
      columns={columns}
      view="table"
      hubLabel="Gradebook"
      lifecycleTabLabel="Students"
      searchAriaLabel="Search by first or last name"
      getRowId={row => row.id}
      getRowSelectionLabel={row => row.studentName}
      emptyState="No students enrolled in this offering."
      renderers={{}}
      supportedViewTypes={["table"]}
      persistKey={persistKey}
      defaultSort={{ key: "studentName", dir: "asc" }}
      pagination
      paginationInitialPageSize={25}
    />
  )
}

function ReportsTable({
  rows,
  persistKey,
  onToggleFavorite,
}: {
  rows: CourseReportRow[]
  persistKey: string
  onToggleFavorite: (row: CourseReportRow) => void
}) {
  const columns = React.useMemo<ColumnDef<CourseReportRow>[]>(
    () => [
      {
        key: "name",
        label: "Report",
        width: 300,
        minWidth: 220,
        defaultPin: "left",
        sortable: true,
        sortKey: "name",
        favoriteFilter: true,
        cell: row => (
          <FavoriteNameCell
            label={row.name}
            isFavorite={Boolean(row.isFavorite)}
            onToggleFavorite={() => onToggleFavorite(row)}
            interactive
            badge={row.isNew ? <TableNewRowDot className="mt-1.5" /> : null}
          />
        ),
      },
      {
        key: "category",
        label: "Category",
        width: 160,
        minWidth: 120,
        sortable: true,
        sortKey: "category",
        cellKind: "pill",
        cell: row => <PillCell label={row.category} />,
        filter: { type: "select", icon: "fa-diagram-project" },
      },
      {
        key: "description",
        label: "Description",
        width: 360,
        minWidth: 240,
        cell: row => <span className="text-sm text-muted-foreground">{row.description}</span>,
      },
    ],
    [onToggleFavorite],
  )

  return (
    <HubTable<CourseReportRow>
      rows={rows}
      columns={columns}
      view="table"
      hubLabel="Reports"
      lifecycleTabLabel="Standard"
      searchAriaLabel="Search reports"
      getRowId={row => row.id}
      getRowSelectionLabel={row => row.name}
      emptyState="No reports available for this offering."
      renderers={{}}
      supportedViewTypes={["table"]}
      persistKey={persistKey}
      defaultSort={{ key: "name", dir: "asc" }}
      pagination
      paginationInitialPageSize={25}
    />
  )
}

/**
 * Review (all forms) — per-student, cross-form grain, with a row per active
 * practicum placement (hundreds of rows across a real cohort). That makes it
 * a primary task with its own URL, not a quick auxiliary peek — a route-level
 * content swap (own `?panel=review`, own back control), not a `Sheet`
 * (`exxat-page-vs-drawer.mdc`: long-form / substantial-data work gets a page,
 * not a drawer).
 */
function ReviewPanel({
  rows,
  persistKey,
  onBack,
}: {
  rows: CourseFormReviewRow[]
  persistKey: string
  onBack: () => void
}) {
  return (
    <div className="min-w-0 w-full">
      <div className="px-4 lg:px-6">
        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            <i className="fa-light fa-arrow-left" aria-hidden="true" />
            Back to Forms
          </Button>
        </div>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-foreground">Review — all forms</h2>
          <p className="text-sm text-muted-foreground">
            Per-student completion across every form in this offering.
          </p>
        </div>
      </div>
      {/* No px wrapper — `FormsReviewTable` (`HubTable`) owns its own edge inset. */}
      <FormsReviewTable rows={rows} persistKey={persistKey} />
    </div>
  )
}

/**
 * Forms/Evaluations module — one table (catalog + distribution + submission
 * merged, since they're the same per-form grain) with row/bulk actions, plus
 * a route-level Review panel. No second Tabs/segmented-control level: this
 * *is* the "very different pattern" — collapse what used to be 3 views into
 * 1 table + 1 drill-in page, matching Linear/Height's list-plus-detail model
 * for the same job (M4).
 */
function FormsEvaluationsModule({
  offeringId,
  persistPrefix,
  formsPanel,
  onFormsPanelChange,
}: {
  offeringId: string
  persistPrefix: string
  formsPanel: CourseFormsPanel
  onFormsPanelChange: (panel: CourseFormsPanel) => void
}) {
  const [rows, setRows] = React.useState<CourseFormRow[]>(() => courseFormRows(offeringId))

  const toggleFavorite = React.useCallback((row: CourseFormRow) => {
    setRows(current => current.map(r => (r.id === row.id ? { ...r, isFavorite: !r.isFavorite } : r)))
  }, [])

  if (formsPanel === "review") {
    return (
      <ReviewPanel
        rows={courseFormReviewRows(offeringId)}
        persistKey={`${persistPrefix}:forms-review`}
        onBack={() => onFormsPanelChange("catalog")}
      />
    )
  }

  const pendingCount = rows.filter(r => !r.distributedTotal).length

  return (
    <div className="min-w-0 w-full">
      {/* Secondary (outline) before primary (filled) — filled primary stays rightmost. */}
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2 px-4 lg:px-6">
        <Button type="button" variant="outline" onClick={() => onFormsPanelChange("review")}>
          Review (all forms)
        </Button>
        <Button type="button" variant="default" disabled={pendingCount === 0}>
          Distribute pending
          <Kbd variant="bare" className="ml-2 hidden sm:inline-flex">D</Kbd>
        </Button>
      </div>
      {/* No px wrapper — `FormsTable` (`HubTable`) owns its own edge inset. */}
      <FormsTable
        rows={rows}
        persistKey={`${persistPrefix}:forms`}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  )
}

/** Reports module — bulk actions + table, own favorite state (same pattern as Forms). */
function ReportsModule({
  offeringId,
  persistPrefix,
}: {
  offeringId: string
  persistPrefix: string
}) {
  const [rows, setRows] = React.useState<CourseReportRow[]>(() => courseReportRows(offeringId))

  const toggleFavorite = React.useCallback((row: CourseReportRow) => {
    setRows(current => current.map(r => (r.id === row.id ? { ...r, isFavorite: !r.isFavorite } : r)))
  }, [])

  return (
    <div className="min-w-0 w-full">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2 px-4 lg:px-6">
        <Button type="button" variant="outline">
          Create report with Leo
        </Button>
        <Button type="button" variant="default">
          <i className="fa-light fa-plus" aria-hidden="true" />
          Create new report
        </Button>
      </div>
      {/* No px wrapper — `ReportsTable` (`HubTable`) owns its own edge inset. */}
      <ReportsTable
        rows={rows}
        persistKey={`${persistPrefix}:reports`}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  )
}

function ModuleBody({
  offering,
  offeringId,
  module,
  persistPrefix,
  formsPanel,
  onFormsPanelChange,
  onNavigateDetail,
}: {
  offering: CourseOffering
  offeringId: string
  module: CourseDetailModule
  persistPrefix: string
  formsPanel: CourseFormsPanel
  onFormsPanelChange: (panel: CourseFormsPanel) => void
  onNavigateDetail: (patch: {
    module: CourseDetailModule
    formsPanel?: CourseFormsPanel
  }) => void
}) {
  if (module === "overview") {
    return (
      <div className="min-w-0 w-full px-4 lg:px-6">
        <CourseOverviewPanel
          offering={offering}
          offeringId={offeringId}
          onNavigate={onNavigateDetail}
        />
      </div>
    )
  }

  if (module === "setup") {
    return (
      <div className="min-w-0 w-full px-4 lg:px-6">
        <OfferingConfigureCards offering={offering} />
      </div>
    )
  }

  if (isActivityModule(module)) {
    const disabled = offering.activityActions.find(a => a.type === module && !a.enabled)
    if (disabled) {
      return (
        <div className="min-w-0 w-full px-4 lg:px-6">
          <ModuleDisabledBanner offering={offering} module={module} />
        </div>
      )
    }
    if (module === "forms-evaluations") {
      return (
        <FormsEvaluationsModule
          offeringId={offeringId}
          persistPrefix={persistPrefix}
          formsPanel={formsPanel}
          onFormsPanelChange={onFormsPanelChange}
        />
      )
    }
    if (module === "patient-log" || module === "timesheet") {
      // No px wrapper — `PracticumLogTable` (`HubTable`) owns its own edge inset.
      return (
        <div className="min-w-0 w-full">
          <PracticumLogTable
            rows={coursePracticumRows(offeringId)}
            persistKey={`${persistPrefix}:${module}`}
            mode={module}
          />
        </div>
      )
    }
    return (
      <div className="mx-4 lg:mx-6" role="status">
        <EmptyState
          icon="fa-calendar-xmark"
          title="No time off requests yet"
          description="Time off requests for this offering will appear here. Connect the time-off workflow when the backend is ready."
          align="center"
        />
      </div>
    )
  }

  if (module === "gradebook") {
    // Toolbar gets the page gutter; `GradebookTable` (`HubTable`) supplies its own.
    return (
      <div className="min-w-0 w-full">
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2 px-4 lg:px-6">
          <StatusBadge label="Not published" tone="warning" icon="fa-circle-info" size="md" />
          <Button type="button" variant="default">
            Upload final grade(s)
          </Button>
        </div>
        <GradebookTable
          rows={courseGradebookRows(offeringId)}
          persistKey={`${persistPrefix}:gradebook`}
        />
      </div>
    )
  }

  return <ReportsModule offeringId={offeringId} persistPrefix={persistPrefix} />
}

export interface LearningActivitiesCourseDetailClientProps {
  offeringId: string
}

export function LearningActivitiesCourseDetailClient({
  offeringId,
}: LearningActivitiesCourseDetailClientProps) {
  const { product, customProducts, activeCustomIndex } = useProduct()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hubBasePath = currentLearningActivitiesBasePath()
  const detailState = React.useMemo(
    () => parseCourseDetailNav(new URLSearchParams(searchParams.toString())),
    [searchParams],
  )

  const offering = getCourseOfferingById(offeringId)
  const persistPrefix = productPersistKey(
    product,
    `la-offering:${offeringId}`,
    customProducts,
    activeCustomIndex,
  )

  const title = offering ? offeringDetailTitle(offering.courseNumber, offering.courseName) : "Course offering"
  useDocumentTitle(title)
  const [exportOpen, setExportOpen] = React.useState(false)

  if (!offering) {
    return <Navigate to={laHubFromCourseDetailHref(hubBasePath)} replace />
  }

  const navigateDetail = (patch: Partial<typeof detailState>) => {
    navigate(laCourseDetailHref(offeringId, { ...detailState, ...patch }, hubBasePath))
  }

  // Export always targets the table on the active tab — there's no single
  // "course" row set to export from a page-level action.
  const exportRowCount = (() => {
    switch (detailState.module) {
      case "forms-evaluations":
        return detailState.formsPanel === "review"
          ? courseFormReviewRows(offeringId).length
          : courseFormRows(offeringId).length
      case "patient-log":
      case "timesheet":
        return coursePracticumRows(offeringId).length
      case "gradebook":
        return courseGradebookRows(offeringId).length
      case "reports":
        return courseReportRows(offeringId).length
      default:
        return 0
    }
  })()

  const courseSwitcherMenu = LEARNING_ACTIVITY_OFFERINGS.map(peer => ({
    id: peer.id,
    label: offeringDisplayTitle(peer),
    selected: peer.id === offeringId,
    onSelect: () => navigate(laCourseDetailHref(peer.id, detailState, hubBasePath)),
  }))

  const siteHeader = {
    back: { label: "All courses", href: laHubFromCourseDetailHref(hubBasePath) },
    documentTitle: title,
  }

  return (
    <PrimaryPageTemplate siteHeader={siteHeader} contentClassName="min-w-0 pb-16 pt-2">
      <PageHeader
        title={
          <PageTitleRecordSwitcher
            label={title}
            menu={courseSwitcherMenu}
            menuAriaLabel={`Switch course, currently ${offering.courseName}`}
          />
        }
        actions={
          <DropdownMenu>
            <Tip side="bottom" label="More actions">
              <DropdownMenuTrigger asChild>
                <Button type="button" size="icon-lg" variant="outline" aria-label="More actions">
                  <i className="fa-light fa-ellipsis text-base" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </Tip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setExportOpen(true)}>
                <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigateDetail({ module: "setup" })}>
                <i className="fa-light fa-gear" aria-hidden="true" />
                Configure
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <div className="px-4 lg:px-6">
        <OfferingMetaRow offering={offering} />
      </div>

      {/*
        No horizontal padding here — `HubTable` owns its own left/right inset
        (`DATA_TABLE_TOOLBAR_INSET_CLASS` / `DATA_TABLE_GRID_INSET_CLASS`,
        both `px-4 lg:px-6`). Wrapping `TabsContent` in the same padding
        double-insets every table module; each non-table module (Configure,
        disabled banner, toolbars) applies `px-4 lg:px-6` itself instead.
      */}
      <Tabs
        key={offeringId}
        value={detailState.module}
        onValueChange={value => navigateDetail({ module: value as CourseDetailModule })}
        className="mt-6 flex w-full min-w-0 flex-col"
      >
        <TabsListScrollRegion ariaLabel="Course offering modules" className="px-4 lg:px-6">
          <TabsList className="w-fit justify-start">
            {VISIBLE_DETAIL_MODULES.map(module => (
              <TabsTrigger key={module} value={module}>
                {COURSE_DETAIL_MODULE_LABELS[module]}
              </TabsTrigger>
            ))}
          </TabsList>
        </TabsListScrollRegion>

        {DETAIL_MODULES.map(module => (
          <TabsContent
            key={module}
            value={module}
            className="mt-6 w-full min-w-0 flex-none outline-none focus-visible:outline-none"
          >
            <ModuleBody
              offering={offering}
              offeringId={offeringId}
              module={module}
              persistPrefix={persistPrefix}
              formsPanel={detailState.formsPanel}
              onFormsPanelChange={panel => navigateDetail({ module, formsPanel: panel })}
              onNavigateDetail={patch => navigateDetail(patch)}
            />
          </TabsContent>
        ))}
      </Tabs>

      <ExportDrawer open={exportOpen} onOpenChange={setExportOpen} totalRows={exportRowCount} />
    </PrimaryPageTemplate>
  )
}
