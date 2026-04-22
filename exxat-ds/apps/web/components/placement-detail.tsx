"use client"

import * as React from "react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tip } from "@/components/ui/tip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Placement, Status } from "@/lib/mock/placements"

// ─────────────────────────────────────────────────────────────────────────────
// Status badge — matches data-list-table pattern
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<Status, string> = {
  confirmed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  "under-review": "bg-blue-500/10 text-blue-700 border-blue-500/20",
  rejected: "bg-red-500/10 text-red-700 border-red-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
}

function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge className={cn("capitalize", STATUS_STYLES[status])}>
      {status.replace("-", " ")}
    </Badge>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Info row — <dl> pattern for structured data
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string
  value: React.ReactNode
  icon?: string
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      {icon && (
        <i
          className={cn(
            "fa-light",
            icon,
            "text-muted-foreground text-[13px] mt-0.5 w-4 shrink-0"
          )}
          aria-hidden="true"
        />
      )}
      <dt className="text-sm text-muted-foreground w-32 shrink-0">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabs config
// ─────────────────────────────────────────────────────────────────────────────

type TabId = "overview" | "schedule" | "compliance" | "activity"

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "fa-circle-info" },
  { id: "schedule", label: "Schedule", icon: "fa-calendar" },
  { id: "compliance", label: "Compliance", icon: "fa-shield-check" },
  { id: "activity", label: "Activity", icon: "fa-clock-rotate-left" },
]

// ─────────────────────────────────────────────────────────────────────────────
// Overview tab
// ─────────────────────────────────────────────────────────────────────────────

function OverviewTab({ placement }: { placement: Placement }) {
  return (
    <div className="grid gap-6 md:grid-cols-2" role="tabpanel" aria-label="Overview">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Placement Info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <InfoRow icon="fa-hospital" label="Site" value={placement.site} />
            <InfoRow icon="fa-location-dot" label="Address" value={placement.siteAddress} />
            <Separator />
            <InfoRow icon="fa-briefcase" label="Internship" value={placement.internship} />
            <InfoRow icon="fa-stethoscope" label="Specialization" value={placement.specialization} />
            <InfoRow icon="fa-user-doctor" label="Supervisor" value={placement.supervisor} />
            <InfoRow icon="fa-user-nurse" label="Preceptor" value={placement.supervisor} />
            <Separator />
            <InfoRow icon="fa-rotate" label="Rotation type" value="Clinical" />
            <InfoRow icon="fa-graduation-cap" label="Credit hours" value="3" />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supervisor &amp; Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <InfoRow
              icon="fa-user"
              label="Supervisor"
              value={placement.supervisor}
            />
            <InfoRow
              icon="fa-envelope"
              label="Email"
              value={`${placement.supervisor.toLowerCase().replace(/\s|dr\.\s?/gi, ".")}@clinic.org`}
            />
            <InfoRow icon="fa-phone" label="Phone" value="(312) 555-0147" />
            <Separator />
            <InfoRow
              icon="fa-bullseye"
              label="Learning objectives"
              value="Develop clinical assessment skills and patient communication techniques in a supervised healthcare environment."
            />
            <InfoRow
              icon="fa-triangle-exclamation"
              label="Special requirements"
              value="Must complete CPR certification before start date. Scrubs required on-site."
            />
            <InfoRow
              icon="fa-note-sticky"
              label="Notes"
              value="Student has expressed interest in extending the placement if performance is satisfactory."
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Schedule tab
// ─────────────────────────────────────────────────────────────────────────────

function ScheduleTab({ placement }: { placement: Placement }) {
  const progressPct =
    placement.progressWeeksTotal > 0
      ? Math.round(
          (placement.progressWeeksDone / placement.progressWeeksTotal) * 100
        )
      : 0

  return (
    <div role="tabpanel" aria-label="Schedule">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-8 md:grid-cols-2">
            <InfoRow icon="fa-calendar-day" label="Start date" value={placement.start} />
            <InfoRow icon="fa-calendar-check" label="End date" value={placement.endDate} />
            <InfoRow icon="fa-clock" label="Duration" value={placement.duration} />
            <InfoRow icon="fa-hourglass-half" label="Hours/week" value="20" />
            <InfoRow icon="fa-sun" label="Shift" value="Day" />
            <InfoRow icon="fa-sigma" label="Total hours" value="240" />
            <InfoRow icon="fa-building" label="Work arrangement" value="On-site" />
            <InfoRow icon="fa-calendar-week" label="Weekends" value="No" />
          </dl>

          {placement.placementPhase === "ongoing" && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {placement.progressWeeksDone} / {placement.progressWeeksTotal} weeks ({progressPct}%)
                  </span>
                </div>
                <div
                  className="h-2 w-full rounded-full bg-muted overflow-hidden"
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Placement progress: ${progressPct}%`}
                >
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Compliance tab
// ─────────────────────────────────────────────────────────────────────────────

const COMPLIANCE_ITEMS = [
  { label: "Background check", passed: true },
  { label: "Immunizations", passed: true },
  { label: "HIPAA training", passed: true },
]

function ComplianceTab({ placement }: { placement: Placement }) {
  return (
    <div role="tabpanel" aria-label="Compliance">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compliance Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-3" aria-label="Compliance items">
            {COMPLIANCE_ITEMS.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm">
                {item.passed ? (
                  <i
                    className="fa-solid fa-circle-check text-emerald-600 text-base"
                    aria-hidden="true"
                  />
                ) : (
                  <i
                    className="fa-solid fa-circle-xmark text-red-500 text-base"
                    aria-hidden="true"
                  />
                )}
                <span>{item.label}</span>
                <span className="sr-only">
                  {item.passed ? "completed" : "incomplete"}
                </span>
              </li>
            ))}
          </ul>

          <Separator />

          <dl>
            <InfoRow
              icon="fa-shield-check"
              label="Readiness"
              value={
                <Badge
                  variant="outline"
                  className={cn(
                    placement.readiness === "Ready"
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                      : placement.readiness === "At risk"
                        ? "bg-red-500/10 text-red-700 border-red-500/20"
                        : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                  )}
                >
                  {placement.readiness}
                </Badge>
              }
            />

            {placement.placementPhase === "upcoming" &&
              placement.daysUntilStart > 0 && (
                <InfoRow
                  icon="fa-calendar-days"
                  label="Days until start"
                  value={`${placement.daysUntilStart} days`}
                />
              )}

            <InfoRow
              icon="fa-clipboard-check"
              label="Compliance status"
              value={placement.compliance}
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity tab
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_ACTIVITY = [
  {
    date: "03/23/2026",
    description: "Supervisor evaluation submitted",
    icon: "fa-file-check",
  },
  {
    date: "03/22/2026",
    description: "Weekly check-in completed",
    icon: "fa-comments",
  },
  {
    date: "03/18/2026",
    description: "Hours log approved (20 hrs)",
    icon: "fa-clock",
  },
  {
    date: "03/15/2026",
    description: "Placement started",
    icon: "fa-play",
  },
  {
    date: "03/10/2026",
    description: "Compliance documents verified",
    icon: "fa-shield-check",
  },
  {
    date: "03/05/2026",
    description: "Placement confirmed by coordinator",
    icon: "fa-circle-check",
  },
]

function ActivityTab() {
  return (
    <div role="tabpanel" aria-label="Activity">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative border-s border-border ms-3" aria-label="Activity timeline">
            {MOCK_ACTIVITY.map((item, idx) => (
              <li key={idx} className="mb-6 ms-6 last:mb-0">
                <span className="absolute -start-3 flex size-6 items-center justify-center rounded-full bg-muted ring-4 ring-background">
                  <i
                    className={cn("fa-light", item.icon, "text-xs text-muted-foreground")}
                    aria-hidden="true"
                  />
                </span>
                <div className="flex flex-col gap-0.5">
                  <time className="text-xs text-muted-foreground">{item.date}</time>
                  <p className="text-sm text-foreground">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function PlacementDetail({ placement }: { placement: Placement }) {
  const [activeTab, setActiveTab] = useState<TabId>("overview")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar size="lg" className="size-12 rounded-xl shrink-0">
          <AvatarFallback className="rounded-xl text-sm font-bold bg-primary/10 text-primary">
            {placement.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h1
            className="text-xl font-semibold"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {placement.student}
          </h1>
          <p className="text-sm text-muted-foreground">{placement.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="secondary">{placement.specialization}</Badge>
            <StatusBadge status={placement.status} />
            <Badge variant="outline">{placement.placementPhase}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Tip label="Edit placement">
            <Button size="sm" variant="outline">
              <i className="fa-light fa-pen-to-square" aria-hidden="true" />{" "}
              Edit
            </Button>
          </Tip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" aria-label="More actions">
                <i className="fa-light fa-ellipsis" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <i className="fa-light fa-download" aria-hidden="true" /> Export
              </DropdownMenuItem>
              <DropdownMenuItem>
                <i className="fa-light fa-box-archive" aria-hidden="true" />{" "}
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <i className="fa-light fa-trash" aria-hidden="true" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Placement sections"
        className="inline-flex items-center gap-0.5 rounded-lg bg-muted/60 p-[3px]"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-md transition-all inline-flex items-center gap-1.5",
              activeTab === tab.id
                ? "bg-background text-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:text-interactive-hover-foreground"
            )}
          >
            <i
              className={cn("fa-light", tab.icon, "text-xs")}
              aria-hidden="true"
            />{" "}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab placement={placement} />}
      {activeTab === "schedule" && <ScheduleTab placement={placement} />}
      {activeTab === "compliance" && <ComplianceTab placement={placement} />}
      {activeTab === "activity" && <ActivityTab />}
    </div>
  )
}
