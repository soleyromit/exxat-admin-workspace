/**
 * Student Schedule Detail — V2 Template
 * Support-ticket / queue-based review layout (Freshdesk, Jira, Linear patterns)
 *
 * Layout:
 * - Left: Queue list (students needing review) — Quick list sidebar
 * - Center: Main content — single-item focus for compliance review
 * - Right: Properties panel (student, site, preceptor)
 *
 * Features:
 * - J/K keyboard shortcuts for next/previous
 * - Action-triggered advance (Approve → next item)
 * - Single requirement focus in compliance mode
 */

import * as React from "react"
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { SectionCard } from "../shared/section-card"
import { Progress } from "../ui/progress"
import { cn } from "../ui/utils"
import { generateStudentScheduleData } from "../../data/mock-data"
import { useAppStore } from "../../stores/app-store"

// ─── Types ──────────────────────────────────────────────────────────────────

interface ComplianceItem {
  id: string
  name: string
  category: string
  status: "Complete" | "Pending" | "Missing" | "Expired" | "In Review"
  dueDate: string
  submittedDate?: string
  source: "School" | "Site" | "System"
  notes?: string
}

const complianceItemsByStage: Record<string, ComplianceItem[]> = {
  upcoming: [
    { id: "c1", name: "CPR/BLS Certification", category: "Certifications", status: "Complete", dueDate: "03/01/2024", submittedDate: "02/15/2024", source: "Site" },
    { id: "c2", name: "HIPAA Training", category: "Training", status: "Complete", dueDate: "03/01/2024", submittedDate: "02/20/2024", source: "System" },
    { id: "c3", name: "Background Check", category: "Clearances", status: "Complete", dueDate: "02/15/2024", submittedDate: "01/28/2024", source: "School" },
    { id: "c4", name: "Immunization Records", category: "Health", status: "Pending", dueDate: "03/01/2024", source: "School", notes: "Awaiting upload" },
    { id: "c5", name: "TB Test Results", category: "Health", status: "Missing", dueDate: "03/10/2024", source: "Site" },
    { id: "c6", name: "Professional Liability Insurance", category: "Insurance", status: "Pending", dueDate: "03/01/2024", source: "School" },
    { id: "c7", name: "Drug Screening", category: "Clearances", status: "Missing", dueDate: "03/05/2024", source: "Site" },
    { id: "c8", name: "Orientation Module", category: "Training", status: "In Review", dueDate: "03/12/2024", submittedDate: "03/01/2024", source: "Site" },
    { id: "c9", name: "Student Agreement Form", category: "Administrative", status: "Complete", dueDate: "02/28/2024", submittedDate: "02/22/2024", source: "System" },
    { id: "c10", name: "Flu Vaccination", category: "Health", status: "Expired", dueDate: "02/01/2024", submittedDate: "10/15/2023", source: "Site" },
  ],
  ongoing: [
    { id: "c1", name: "CPR/BLS Certification", category: "Certifications", status: "Complete", dueDate: "03/01/2024", submittedDate: "02/15/2024", source: "Site" },
    { id: "c2", name: "HIPAA Training", category: "Training", status: "Complete", dueDate: "03/01/2024", submittedDate: "02/20/2024", source: "System" },
    { id: "c3", name: "Background Check", category: "Clearances", status: "Complete", dueDate: "02/15/2024", submittedDate: "01/28/2024", source: "School" },
    { id: "c4", name: "Immunization Records", category: "Health", status: "Complete", dueDate: "03/01/2024", submittedDate: "02/10/2024", source: "School" },
    { id: "c5", name: "TB Test Results", category: "Health", status: "Complete", dueDate: "03/10/2024", submittedDate: "03/06/2024", source: "Site" },
    { id: "c6", name: "Professional Liability Insurance", category: "Insurance", status: "Complete", dueDate: "03/01/2024", submittedDate: "02/18/2024", source: "School" },
    { id: "c7", name: "Drug Screening", category: "Clearances", status: "Complete", dueDate: "03/05/2024", submittedDate: "02/28/2024", source: "Site" },
    { id: "c8", name: "Orientation Module", category: "Training", status: "Complete", dueDate: "03/12/2024", submittedDate: "03/01/2024", source: "Site" },
    { id: "c9", name: "Student Agreement Form", category: "Administrative", status: "Complete", dueDate: "02/28/2024", submittedDate: "02/22/2024", source: "System" },
    { id: "c10", name: "Flu Vaccination", category: "Health", status: "Pending", dueDate: "10/01/2024", source: "Site" },
  ],
  completed: [
    { id: "c1", name: "CPR/BLS Certification", category: "Certifications", status: "Complete", dueDate: "03/01/2024", submittedDate: "02/15/2024", source: "Site" },
    { id: "c2", name: "HIPAA Training", category: "Training", status: "Complete", dueDate: "03/01/2024", submittedDate: "02/20/2024", source: "System" },
    { id: "c3", name: "Background Check", category: "Clearances", status: "Complete", dueDate: "02/15/2024", submittedDate: "01/28/2024", source: "School" },
    { id: "c4", name: "Immunization Records", category: "Health", status: "Complete", dueDate: "03/01/2024", submittedDate: "02/10/2024", source: "School" },
    { id: "c5", name: "TB Test Results", category: "Health", status: "Complete", dueDate: "03/10/2024", submittedDate: "03/06/2024", source: "Site" },
    { id: "c6", name: "Professional Liability Insurance", category: "Insurance", status: "Complete", dueDate: "03/01/2024", submittedDate: "02/18/2024", source: "School" },
    { id: "c7", name: "Drug Screening", category: "Clearances", status: "Complete", dueDate: "03/05/2024", submittedDate: "02/28/2024", source: "Site" },
    { id: "c8", name: "Orientation Module", category: "Training", status: "Complete", dueDate: "03/12/2024", submittedDate: "03/01/2024", source: "Site" },
    { id: "c9", name: "Student Agreement Form", category: "Administrative", status: "Complete", dueDate: "02/28/2024", submittedDate: "02/22/2024", source: "System" },
    { id: "c10", name: "Flu Vaccination", category: "Health", status: "Complete", dueDate: "10/01/2024", submittedDate: "09/20/2024", source: "Site" },
  ],
}

// ─── Component ──────────────────────────────────────────────────────────────

const allStudentScheduleData = generateStudentScheduleData(50)

export interface StudentScheduleDetailV2Props {
  scheduleId: string
  onBack: () => void
}

export function StudentScheduleDetailV2({ scheduleId, onBack }: StudentScheduleDetailV2Props) {
  const navigateToScheduleDetail = useAppStore((s) => s.navigateToScheduleDetail)
  const [queueCollapsed, setQueueCollapsed] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<"overview" | "compliance">("compliance")
  const [focusedRequirementIndex, setFocusedRequirementIndex] = React.useState(0)

  const item = React.useMemo(
    () => allStudentScheduleData.find((d) => d.id === scheduleId) ?? allStudentScheduleData[0],
    [scheduleId]
  )
  const stage = item.stage
  const complianceItems = React.useMemo(
    () => complianceItemsByStage[stage] || complianceItemsByStage.ongoing,
    [stage]
  )
  const itemsNeedingReview = React.useMemo(
    () => complianceItems.filter((c) => c.status === "Pending" || c.status === "In Review" || c.status === "Missing" || c.status === "Expired"),
    [complianceItems]
  )
  React.useEffect(() => {
    setFocusedRequirementIndex(0)
  }, [scheduleId])
  const safeIndex = Math.min(focusedRequirementIndex, Math.max(0, itemsNeedingReview.length - 1))
  const currentRequirement = itemsNeedingReview[safeIndex] ?? itemsNeedingReview[0]
  const hasNextRequirement = safeIndex < itemsNeedingReview.length - 1
  const hasPrevRequirement = safeIndex > 0

  const reviewQueue = React.useMemo(() => {
    return allStudentScheduleData
      .filter((s) => (s.stage === "upcoming" || s.stage === "ongoing") && s.compliancePercent < 100)
      .sort((a, b) => a.compliancePercent - b.compliancePercent)
  }, [])
  const currentQueueIndex = reviewQueue.findIndex((s) => s.id === scheduleId)
  const prevStudent = currentQueueIndex > 0 ? reviewQueue[currentQueueIndex - 1] : null
  const nextStudent = currentQueueIndex >= 0 && currentQueueIndex < reviewQueue.length - 1 ? reviewQueue[currentQueueIndex + 1] : null

  const detail = React.useMemo(
    () => ({
      phone: "(612) 555-0187",
      school: "University of Minnesota",
      sitePhone: "(507) 284-2511",
      siteEmail: "clinicalplacements@mayo.edu",
      preceptorEmail: `${item.preceptorName.toLowerCase().replace(/dr\.\s/, "").replace(" ", ".")}@mayo.edu`,
      preceptorPhone: "(507) 284-3200",
      shift: "Monday – Friday, 7:00 AM – 3:30 PM",
    }),
    [item]
  )

  const handleApprove = React.useCallback(() => {
    if (hasNextRequirement) {
      setFocusedRequirementIndex((i) => Math.min(i + 1, itemsNeedingReview.length - 1))
    } else if (nextStudent) {
      navigateToScheduleDetail(nextStudent.id, nextStudent.studentName, nextStudent.siteName)
      setFocusedRequirementIndex(0)
    }
  }, [hasNextRequirement, nextStudent, navigateToScheduleDetail, itemsNeedingReview.length])

  const handleRequestChanges = React.useCallback(() => {
    if (hasNextRequirement) {
      setFocusedRequirementIndex((i) => Math.min(i + 1, itemsNeedingReview.length - 1))
    } else if (nextStudent) {
      navigateToScheduleDetail(nextStudent.id, nextStudent.studentName, nextStudent.siteName)
      setFocusedRequirementIndex(0)
    }
  }, [hasNextRequirement, nextStudent, navigateToScheduleDetail, itemsNeedingReview.length])

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault()
          if (nextStudent) navigateToScheduleDetail(nextStudent.id, nextStudent.studentName, nextStudent.siteName)
          break
        case "k":
        case "ArrowUp":
          e.preventDefault()
          if (prevStudent) navigateToScheduleDetail(prevStudent.id, prevStudent.studentName, prevStudent.siteName)
          break
        case "1":
          if (currentRequirement && (currentRequirement.status === "Pending" || currentRequirement.status === "In Review")) {
            e.preventDefault()
            handleApprove()
          }
          break
        case "2":
          if (currentRequirement && (currentRequirement.status === "Pending" || currentRequirement.status === "In Review")) {
            e.preventDefault()
            handleRequestChanges()
          }
          break
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [prevStudent, nextStudent, currentRequirement, handleApprove, handleRequestChanges, navigateToScheduleDetail])

  return (
    <div className="flex h-full min-h-0 bg-background">
      {/* ── Left: Queue list (Quick list) ───────────────────────────────────── */}
      <div
        className={cn(
          "flex flex-col border-r border-border bg-muted/30 transition-all",
          queueCollapsed ? "w-12" : "w-64 min-w-[200px]"
        )}
      >
        <div className="flex items-center justify-between p-2 border-b border-border">
          {!queueCollapsed && (
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Review Queue
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setQueueCollapsed((c) => !c)}
          >
            <FontAwesomeIcon name={queueCollapsed ? "chevronRight" : "chevronLeft"} className="h-4 w-4" />
          </Button>
        </div>
        {!queueCollapsed && (
          <div className="flex-1 overflow-y-auto py-2">
            <div className="text-xs text-muted-foreground px-3 mb-2">
              {reviewQueue.length} students needing review
            </div>
            {reviewQueue.map((s, i) => (
              <button
                key={s.id}
                onClick={() => navigateToScheduleDetail(s.id, s.studentName, s.siteName)}
                className={cn(
                  "w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-muted/80 transition-colors border-l-2",
                  s.id === scheduleId
                    ? "border-l-primary bg-primary/5"
                    : "border-l-transparent"
                )}
              >
                <span className="text-xs text-muted-foreground w-6">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{s.studentName}</div>
                  <div className="text-xs text-muted-foreground truncate">{s.siteName} • {s.compliancePercent}%</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Center: Main content ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header + Action bar */}
        <div className="flex-none border-b border-border px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">
              {item.studentName}
              <span className="text-muted-foreground font-normal mx-1">@</span>
              {item.siteName}
            </h1>
            <div className="text-xs text-muted-foreground">
              {item.scheduleId} • {item.compliancePercent}% compliance
              {reviewQueue.length > 0 && (
                <span className="ml-2">
                  • Student {currentQueueIndex + 1} of {reviewQueue.length}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setViewMode("overview")}>
              Overview
            </Button>
            <Button
              variant={viewMode === "compliance" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("compliance")}
            >
              Compliance
              {itemsNeedingReview.length > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 bg-destructive text-destructive-foreground text-xs">
                  {itemsNeedingReview.length}
                </Badge>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={onBack}>
              <FontAwesomeIcon name="chevronLeft" className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
        </div>

        {/* Prev/Next navigation bar */}
        {(prevStudent || nextStudent) && (
          <div className="flex items-center justify-between gap-4 px-4 py-2 bg-muted/50 border-b border-border text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              disabled={!prevStudent}
              onClick={() => prevStudent && navigateToScheduleDetail(prevStudent.id, prevStudent.studentName, prevStudent.siteName)}
            >
              <FontAwesomeIcon name="chevronLeft" className="h-4 w-4" />
              Previous <span className="hidden sm:inline">(K)</span>
            </Button>
            <span className="text-muted-foreground text-xs">
              Use <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">J</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">K</kbd> to move • <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">1</kbd> Approve • <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">2</kbd> Request changes
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              disabled={!nextStudent}
              onClick={() => nextStudent && navigateToScheduleDetail(nextStudent.id, nextStudent.studentName, nextStudent.siteName)}
            >
              Next <span className="hidden sm:inline">(J)</span>
              <FontAwesomeIcon name="chevronRight" className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Main content area */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewMode === "overview" ? (
            <div className="max-w-2xl space-y-6">
              <SectionCard title="Student & Assignment">
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div><span className="text-muted-foreground">Student:</span> {item.studentName}</div>
                  <div><span className="text-muted-foreground">Email:</span> {item.studentEmail}</div>
                  <div><span className="text-muted-foreground">Site:</span> {item.siteName}</div>
                  <div><span className="text-muted-foreground">Preceptor:</span> {item.preceptorName}</div>
                  <div><span className="text-muted-foreground">Dates:</span> {item.startDate} — {item.endDate}</div>
                  <div><span className="text-muted-foreground">Compliance:</span> {item.compliancePercent}%</div>
                </div>
              </SectionCard>
            </div>
          ) : (
            /* ── Compliance: Single-item focus (queue-based review) ─────────── */
            <div className="max-w-4xl space-y-6">
              {itemsNeedingReview.length === 0 ? (
                <SectionCard title="Compliance">
                  <div className="py-12 text-center">
                    <FontAwesomeIcon name="checkCircle" className="h-12 w-12 text-chart-2 mx-auto mb-3" />
                    <p className="font-medium text-foreground">All requirements reviewed</p>
                    <p className="text-sm text-muted-foreground mt-1">No documents pending review for this student.</p>
                    {nextStudent && (
                      <Button className="mt-4" onClick={() => navigateToScheduleDetail(nextStudent.id, nextStudent.studentName, nextStudent.siteName)}>
                        Next Student
                        <FontAwesomeIcon name="chevronRight" className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </SectionCard>
              ) : (
                <>
                  {/* Progress indicator */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Requirement {safeIndex + 1} of {itemsNeedingReview.length}</span>
                    <div className="flex-1 max-w-xs">
                      <Progress value={((safeIndex + 1) / itemsNeedingReview.length) * 100} className="h-1.5" />
                    </div>
                  </div>

                  {/* Single requirement card — document viewer + actions */}
                  <SectionCard title={currentRequirement.name}>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 text-sm">
                        <Badge variant="outline">{currentRequirement.category}</Badge>
                        <span className="text-muted-foreground">Source: {currentRequirement.source}</span>
                        <span className="text-muted-foreground">Due: {currentRequirement.dueDate}</span>
                        {currentRequirement.submittedDate && (
                          <span className="text-muted-foreground">Submitted: {currentRequirement.submittedDate}</span>
                        )}
                      </div>
                      {currentRequirement.notes && (
                        <p className="text-sm text-muted-foreground italic">{currentRequirement.notes}</p>
                      )}

                      {/* Document viewer placeholder */}
                      <div className="min-h-[280px] rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <FontAwesomeIcon name="fileText" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Document preview</p>
                          <p className="text-xs mt-1">PDF or image would display here</p>
                        </div>
                      </div>

                      {/* Action bar — persistent, action-triggered advance */}
                      <div className="flex items-center gap-3 pt-2 border-t border-border">
                        <Button variant="outline" size="sm">
                          <FontAwesomeIcon name="eye" className="h-4 w-4 mr-2" />
                          View full document
                        </Button>
                        {(currentRequirement.status === "Pending" || currentRequirement.status === "In Review") && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-chart-2 hover:bg-chart-2/90"
                              onClick={handleApprove}
                            >
                              <FontAwesomeIcon name="checkCircle" className="h-4 w-4 mr-2" />
                              Approve <span className="text-xs opacity-80 ml-1">(1)</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive border-destructive/50 hover:bg-destructive/10"
                              onClick={handleRequestChanges}
                            >
                              <FontAwesomeIcon name="refreshCw" className="h-4 w-4 mr-2" />
                              Request Changes <span className="text-xs opacity-80 ml-1">(2)</span>
                            </Button>
                          </>
                        )}
                        <div className="flex-1" />
                        {hasPrevRequirement && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFocusedRequirementIndex((i) => i - 1)}
                          >
                            <FontAwesomeIcon name="chevronLeft" className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                        )}
                        {hasNextRequirement && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFocusedRequirementIndex((i) => i + 1)}
                          >
                            Next
                            <FontAwesomeIcon name="chevronRight" className="h-4 w-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </SectionCard>

                  {/* Requirements list (compact) — click to focus */}
                  <div className="flex flex-wrap gap-2">
                    {itemsNeedingReview.map((ci, i) => (
                      <button
                        key={ci.id}
                        onClick={() => setFocusedRequirementIndex(i)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                          i === safeIndex
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        )}
                      >
                        {ci.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Properties panel ────────────────────────────────────────── */}
      <div className="hidden lg:flex flex-col w-72 min-w-[240px] border-l border-border bg-muted/20">
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Properties</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Student:</span> {item.studentName}</div>
            <div><span className="text-muted-foreground">Site:</span> {item.siteName}</div>
            <div><span className="text-muted-foreground">Location:</span> {item.location}</div>
            <div><span className="text-muted-foreground">Preceptor:</span> {item.preceptorName}</div>
          </div>
        </div>
        <div className="p-4 border-b border-border">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Contact</h3>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Site:</span> {detail.sitePhone}</div>
            <div><span className="text-muted-foreground">Preceptor:</span> {detail.preceptorEmail}</div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Compliance</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall</span>
              <span className="font-medium">{item.compliancePercent}%</span>
            </div>
            <Progress value={item.compliancePercent} className="h-2" />
            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <div className="text-center p-2 rounded bg-chart-2/10 text-chart-2">
                {complianceItems.filter((c) => c.status === "Complete").length}
              </div>
              <div className="text-center p-2 rounded bg-destructive/10 text-destructive">
                {itemsNeedingReview.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
