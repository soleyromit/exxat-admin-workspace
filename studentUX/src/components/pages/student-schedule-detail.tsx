import * as React from "react"
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon"

import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { SectionCard } from "../shared/section-card"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Progress } from "../ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { SimpleMetric, createSimpleMetricData, type SimpleMetricData } from "../shared/simple-metric"
import { InsightCard, createInsightCardData } from "../shared/insight-card"
import { cn } from "../ui/utils"
import { formatDate, formatDateRange } from "../../utils/date-utils"
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

interface MilestoneItem {
  id: string
  title: string
  description: string
  dueDate: string
  completedDate?: string
  status: "Completed" | "In Progress" | "Upcoming" | "Overdue"
  type: "clinical" | "academic" | "administrative"
}

interface EvaluationItem {
  id: string
  title: string
  evaluator: string
  evaluatorRole: string
  date: string
  type: "Mid-Rotation" | "Final" | "Self-Assessment" | "Peer Review"
  status: "Completed" | "Pending" | "Overdue"
  rating?: number
  maxRating: number
  summary?: string
}

interface ActivityItem {
  id: string
  action: string
  description: string
  actor: string
  timestamp: string
  type: "status" | "document" | "evaluation" | "communication" | "system"
}

// ─── Stage-aware mock data ──────────────────────────────────────────────────

const complianceItemsByStage: Record<string, ComplianceItem[]> = {
  upcoming: [
    { id: "c1", name: "CPR/BLS Certification", category: "Certifications", status: "Complete", dueDate: "03/01/2024", submittedDate: "02/15/2024", source: "Site", notes: "American Heart Association certification" },
    { id: "c2", name: "HIPAA Training", category: "Training", status: "Complete", dueDate: "03/01/2024", submittedDate: "02/20/2024", source: "System" },
    { id: "c3", name: "Background Check", category: "Clearances", status: "Complete", dueDate: "02/15/2024", submittedDate: "01/28/2024", source: "School" },
    { id: "c4", name: "Immunization Records", category: "Health", status: "Pending", dueDate: "03/01/2024", source: "School", notes: "Awaiting upload from student" },
    { id: "c5", name: "TB Test Results", category: "Health", status: "Missing", dueDate: "03/10/2024", source: "Site", notes: "Must be completed before rotation start" },
    { id: "c6", name: "Professional Liability Insurance", category: "Insurance", status: "Pending", dueDate: "03/01/2024", source: "School", notes: "School processing" },
    { id: "c7", name: "Drug Screening", category: "Clearances", status: "Missing", dueDate: "03/05/2024", source: "Site", notes: "Must be completed within 30 days of start" },
    { id: "c8", name: "Orientation Module", category: "Training", status: "In Review", dueDate: "03/12/2024", submittedDate: "03/01/2024", source: "Site" },
    { id: "c9", name: "Student Agreement Form", category: "Administrative", status: "Complete", dueDate: "02/28/2024", submittedDate: "02/22/2024", source: "System" },
    { id: "c10", name: "Flu Vaccination", category: "Health", status: "Expired", dueDate: "02/01/2024", submittedDate: "10/15/2023", source: "Site", notes: "Annual requirement — needs renewal" },
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
    { id: "c10", name: "Flu Vaccination", category: "Health", status: "Pending", dueDate: "10/01/2024", source: "Site", notes: "Due for next flu season" },
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

function getMilestones(stage: string): MilestoneItem[] {
  if (stage === "upcoming") {
    return [
      { id: "m1", title: "Pre-Rotation Orientation", description: "Complete site orientation and safety training", dueDate: "03/15/2024", status: "Upcoming", type: "administrative" },
      { id: "m2", title: "Compliance Verification", description: "All compliance requirements met and verified", dueDate: "03/10/2024", status: "Upcoming", type: "administrative" },
      { id: "m3", title: "Week 1 Goals Submission", description: "Submit initial reflection on clinical goals and expectations", dueDate: "03/22/2024", status: "Upcoming", type: "academic" },
    ]
  }
  if (stage === "ongoing") {
    return [
      { id: "m1", title: "Pre-Rotation Orientation", description: "Complete site orientation and safety training", dueDate: "03/15/2024", completedDate: "03/15/2024", status: "Completed", type: "administrative" },
      { id: "m2", title: "Week 1 Reflection", description: "Submit initial reflection on clinical goals", dueDate: "03/22/2024", completedDate: "03/21/2024", status: "Completed", type: "academic" },
      { id: "m3", title: "Patient Assessment Competency", description: "Demonstrate proficiency in patient assessment techniques", dueDate: "03/29/2024", completedDate: "03/28/2024", status: "Completed", type: "clinical" },
      { id: "m4", title: "Mid-Rotation Evaluation", description: "Complete mid-rotation evaluation with preceptor", dueDate: "04/12/2024", completedDate: "04/11/2024", status: "Completed", type: "academic" },
      { id: "m5", title: "Treatment Planning Project", description: "Submit comprehensive treatment plan for assigned case", dueDate: "04/19/2024", status: "In Progress", type: "clinical" },
      { id: "m6", title: "Evidence-Based Practice Presentation", description: "Present a case study applying evidence-based practices", dueDate: "04/26/2024", status: "Upcoming", type: "academic" },
      { id: "m7", title: "Clinical Hours Verification (240 hrs)", description: "Verify completion of 240 clinical hours", dueDate: "05/03/2024", status: "Upcoming", type: "administrative" },
      { id: "m8", title: "Final Evaluation & Exit Interview", description: "Complete final evaluation, feedback, and exit interview", dueDate: "05/10/2024", status: "Upcoming", type: "academic" },
    ]
  }
  // completed
  return [
    { id: "m1", title: "Pre-Rotation Orientation", description: "Complete site orientation and safety training", dueDate: "03/15/2024", completedDate: "03/15/2024", status: "Completed", type: "administrative" },
    { id: "m2", title: "Week 1 Reflection", description: "Submit initial reflection on clinical goals", dueDate: "03/22/2024", completedDate: "03/21/2024", status: "Completed", type: "academic" },
    { id: "m3", title: "Patient Assessment Competency", description: "Demonstrate proficiency in patient assessment", dueDate: "03/29/2024", completedDate: "03/28/2024", status: "Completed", type: "clinical" },
    { id: "m4", title: "Mid-Rotation Evaluation", description: "Complete mid-rotation evaluation with preceptor", dueDate: "04/12/2024", completedDate: "04/11/2024", status: "Completed", type: "academic" },
    { id: "m5", title: "Treatment Planning Project", description: "Submit comprehensive treatment plan", dueDate: "04/19/2024", completedDate: "04/18/2024", status: "Completed", type: "clinical" },
    { id: "m6", title: "Evidence-Based Practice Presentation", description: "Present a case study", dueDate: "04/26/2024", completedDate: "04/25/2024", status: "Completed", type: "academic" },
    { id: "m7", title: "Clinical Hours Verification", description: "All 320 clinical hours verified", dueDate: "05/03/2024", completedDate: "05/02/2024", status: "Completed", type: "administrative" },
    { id: "m8", title: "Final Evaluation & Exit Interview", description: "Final evaluation and exit interview complete", dueDate: "05/10/2024", completedDate: "05/10/2024", status: "Completed", type: "academic" },
  ]
}

function getEvaluations(stage: string): EvaluationItem[] {
  if (stage === "upcoming") return []
  if (stage === "ongoing") {
    return [
      { id: "e1", title: "Mid-Rotation Evaluation", evaluator: "Dr. James Mitchell", evaluatorRole: "Preceptor", date: "04/11/2024", type: "Mid-Rotation", status: "Completed", rating: 4.2, maxRating: 5, summary: "Strong clinical reasoning. Continue building confidence with patient communication." },
      { id: "e2", title: "Self-Assessment — Week 4", evaluator: "Emily Rodriguez", evaluatorRole: "Student", date: "04/12/2024", type: "Self-Assessment", status: "Completed", rating: 3.8, maxRating: 5, summary: "I'm improving in manual therapy but need more practice with documentation." },
      { id: "e3", title: "Peer Review", evaluator: "Michael Chen", evaluatorRole: "Peer", date: "04/15/2024", type: "Peer Review", status: "Completed", rating: 4.5, maxRating: 5, summary: "Excellent teamwork and communication. Very collaborative." },
      { id: "e4", title: "Final Evaluation", evaluator: "Dr. James Mitchell", evaluatorRole: "Preceptor", date: "05/10/2024", type: "Final", status: "Pending", maxRating: 5 },
      { id: "e5", title: "Final Self-Assessment", evaluator: "Emily Rodriguez", evaluatorRole: "Student", date: "05/10/2024", type: "Self-Assessment", status: "Pending", maxRating: 5 },
    ]
  }
  return [
    { id: "e1", title: "Mid-Rotation Evaluation", evaluator: "Dr. James Mitchell", evaluatorRole: "Preceptor", date: "04/11/2024", type: "Mid-Rotation", status: "Completed", rating: 4.2, maxRating: 5, summary: "Strong clinical reasoning. Continue building confidence with patient communication." },
    { id: "e2", title: "Self-Assessment — Week 4", evaluator: "Emily Rodriguez", evaluatorRole: "Student", date: "04/12/2024", type: "Self-Assessment", status: "Completed", rating: 3.8, maxRating: 5, summary: "I'm improving in manual therapy but need more practice with documentation." },
    { id: "e3", title: "Peer Review", evaluator: "Michael Chen", evaluatorRole: "Peer", date: "04/15/2024", type: "Peer Review", status: "Completed", rating: 4.5, maxRating: 5, summary: "Excellent teamwork and communication." },
    { id: "e4", title: "Final Evaluation", evaluator: "Dr. James Mitchell", evaluatorRole: "Preceptor", date: "05/10/2024", type: "Final", status: "Completed", rating: 4.6, maxRating: 5, summary: "Excellent overall performance. Demonstrated strong growth throughout the rotation." },
    { id: "e5", title: "Final Self-Assessment", evaluator: "Emily Rodriguez", evaluatorRole: "Student", date: "05/10/2024", type: "Self-Assessment", status: "Completed", rating: 4.0, maxRating: 5, summary: "I gained significant confidence and clinical skills during this rotation." },
  ]
}

function getActivityLog(stage: string): ActivityItem[] {
  const base: ActivityItem[] = [
    { id: "a12", action: "Schedule Created", description: "Student schedule created and assigned to site", actor: "System", timestamp: "01/10/2024 10:00 AM", type: "system" },
  ]
  if (stage === "upcoming") {
    return [
      { id: "a1", action: "Compliance Updated", description: "Immunization records submitted for review", actor: "Emily Rodriguez", timestamp: "02/07/2026 4:15 PM", type: "document" },
      { id: "a2", action: "Document Uploaded", description: "Background check clearance uploaded", actor: "University of Minnesota", timestamp: "02/05/2026 11:00 AM", type: "document" },
      { id: "a3", action: "Status Change", description: "Readiness status changed to 'Pending' — 3 items remain", actor: "System", timestamp: "02/04/2026 9:45 AM", type: "status" },
      { id: "a4", action: "Reminder Sent", description: "Compliance reminder sent to student for missing items", actor: "System", timestamp: "02/01/2026 8:30 AM", type: "communication" },
      ...base,
    ]
  }
  if (stage === "ongoing") {
    return [
      { id: "a1", action: "Check-in Completed", description: "Weekly check-in submitted with preceptor notes", actor: "Dr. James Mitchell", timestamp: "02/07/2026 2:30 PM", type: "evaluation" },
      { id: "a2", action: "Document Uploaded", description: "Clinical hours log for Week 4 uploaded", actor: "Emily Rodriguez", timestamp: "02/06/2026 4:15 PM", type: "document" },
      { id: "a3", action: "Evaluation Submitted", description: "Mid-rotation evaluation completed and submitted", actor: "Dr. James Mitchell", timestamp: "02/05/2026 11:00 AM", type: "evaluation" },
      { id: "a4", action: "Milestone Completed", description: "Patient Assessment Competency milestone marked complete", actor: "System", timestamp: "02/04/2026 9:45 AM", type: "status" },
      { id: "a5", action: "Message Sent", description: "Follow-up message about treatment planning project", actor: "Emily Rodriguez", timestamp: "02/03/2026 3:20 PM", type: "communication" },
      { id: "a6", action: "Compliance Updated", description: "TB Test results marked as pending review", actor: "System", timestamp: "02/02/2026 10:00 AM", type: "document" },
      { id: "a7", action: "Schedule Modified", description: "Shift adjusted for Week 5 per site request", actor: "Dr. James Mitchell", timestamp: "02/01/2026 8:30 AM", type: "system" },
      ...base,
    ]
  }
  return [
    { id: "a1", action: "Certificate Issued", description: "Rotation completion certificate generated", actor: "System", timestamp: "05/12/2024 10:00 AM", type: "status" },
    { id: "a2", action: "Final Evaluation Submitted", description: "Final evaluation completed and submitted", actor: "Dr. James Mitchell", timestamp: "05/10/2024 4:00 PM", type: "evaluation" },
    { id: "a3", action: "Rotation Completed", description: "Student has completed all rotation requirements", actor: "System", timestamp: "05/10/2024 3:30 PM", type: "status" },
    { id: "a4", action: "Hours Verified", description: "All 320 clinical hours verified by preceptor", actor: "Dr. James Mitchell", timestamp: "05/09/2024 11:00 AM", type: "document" },
    { id: "a5", action: "Final Self-Assessment", description: "Student submitted final self-assessment", actor: "Emily Rodriguez", timestamp: "05/08/2024 2:15 PM", type: "evaluation" },
    ...base,
  ]
}

// ─── Sub Components ─────────────────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, string> = {
    Ready: "bg-chart-2/10 text-chip-2 border-chip-2/40",
    Pending: "bg-chart-4/10 text-chip-4 border-chip-4/40",
    "Action Required": "bg-destructive/10 text-chip-destructive border-chip-destructive/40",
  }
  const icons: Record<string, React.ReactNode> = {
    Ready: <FontAwesomeIcon name="checkCircle" className="h-3 w-3 mr-1" weight="light" />,
    Pending: <FontAwesomeIcon name="clock" className="h-3 w-3 mr-1" weight="light" />,
    "Action Required": <FontAwesomeIcon name="alertTriangle" className="h-3 w-3 mr-1" weight="light" />,
  }
  return (
    <Badge variant="secondary" className={config[status] || ""}>
      {icons[status]}
      {status}
    </Badge>
  )
}

const StageBadge = ({ stage }: { stage: string }) => {
  const config: Record<string, string> = {
    upcoming: "bg-chart-1/10 text-chip-1 border-chip-1/40",
    ongoing: "bg-chart-2/10 text-chart-2 border-chart-2/20",
    completed: "bg-muted text-muted-foreground border-border",
  }
  const labels: Record<string, string> = {
    upcoming: "Upcoming",
    ongoing: "Ongoing",
    completed: "Completed",
  }
  return (
    <Badge variant="secondary" className={config[stage] || ""}>
      {labels[stage] || stage}
    </Badge>
  )
}

const ComplianceStatusBadge = ({ status }: { status: ComplianceItem["status"] }) => {
  const config: Record<string, { className: string; icon: React.ReactNode }> = {
    Complete: { className: "bg-chart-2/10 text-chart-2 border-chart-2/20", icon: <FontAwesomeIcon name="checkCircle" className="h-3 w-3 mr-1" weight="light" /> },
    Pending: { className: "bg-chart-4/10 text-chart-4 border-chart-4/20", icon: <FontAwesomeIcon name="clock" className="h-3 w-3 mr-1" weight="light" /> },
    Missing: { className: "bg-destructive/10 text-chip-destructive border-chip-destructive/40", icon: <FontAwesomeIcon name="alertCircle" className="h-3 w-3 mr-1" weight="light" /> },
    Expired: { className: "bg-destructive/10 text-chip-destructive border-chip-destructive/40", icon: <FontAwesomeIcon name="alertTriangle" className="h-3 w-3 mr-1" weight="light" /> },
    "In Review": { className: "bg-chart-1/10 text-chart-1 border-chart-1/20", icon: <FontAwesomeIcon name="eye" className="h-3 w-3 mr-1" weight="light" /> },
  }
  const c = config[status] || config.Pending
  return (
    <Badge variant="secondary" className={c.className}>
      {c.icon}
      {status}
    </Badge>
  )
}

const MilestoneStatusIcon = ({ status }: { status: MilestoneItem["status"] }) => {
  switch (status) {
    case "Completed":
      return <FontAwesomeIcon name="checkCircle" className="h-5 w-5 text-chart-2" />
    case "In Progress":
      return <FontAwesomeIcon name="activity" className="h-5 w-5 text-chart-1" />
    case "Overdue":
      return <FontAwesomeIcon name="alertTriangle" className="h-5 w-5 text-destructive" />
    default:
      return <FontAwesomeIcon name="clock" className="h-5 w-5 text-muted-foreground" />
  }
}

const ActivityIcon = ({ type }: { type: ActivityItem["type"] }) => {
  switch (type) {
    case "status":
      return <FontAwesomeIcon name="activity" className="h-4 w-4 text-chart-1" />
    case "document":
      return <FontAwesomeIcon name="fileText" className="h-4 w-4 text-chart-2" />
    case "evaluation":
      return <FontAwesomeIcon name="listChecks" className="h-4 w-4 text-chart-3" />
    case "communication":
      return <FontAwesomeIcon name="messageSquare" className="h-4 w-4 text-chart-4" />
    default:
      return <FontAwesomeIcon name="clock" className="h-4 w-4 text-muted-foreground" />
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

interface StudentScheduleDetailProps {
  scheduleId: string
  onBack: () => void
}

// Pre-generate data once
const allStudentScheduleData = generateStudentScheduleData(50)

export function StudentScheduleDetail({
  scheduleId,
  onBack,
}: StudentScheduleDetailProps) {

  // ── Lookup the real item from the student schedule list data ──
  const item = React.useMemo(
    () => allStudentScheduleData.find((d) => d.id === scheduleId) ?? allStudentScheduleData[0],
    [scheduleId]
  )

  const stage = item.stage // "upcoming" | "ongoing" | "completed"

  // Extended detail mock data based on the real item
  const detail = React.useMemo(() => ({
    phone: "(612) 555-0187",
    program: item.discipline,
    programYear: "3rd Year",
    school: "University of Minnesota",
    schoolId: "school-umn",
    gpa: 3.82,
    sitePhone: "(507) 284-2511",
    siteEmail: "clinicalplacements@mayo.edu",
    preceptorEmail: `${item.preceptorName.toLowerCase().replace(/dr\.\s/, "").replace(" ", ".")}@mayo.edu`,
    preceptorPhone: "(507) 284-3200",
    shift: "Monday – Friday, 7:00 AM – 3:30 PM",
    hoursPerWeek: 40,
    totalHoursRequired: [160, 240, 320, 400, 480][[4, 6, 8, 10, 12].indexOf(parseInt(item.duration)) >= 0 ? [4, 6, 8, 10, 12].indexOf(parseInt(item.duration)) : 2],
    totalHoursCompleted: stage === "completed"
      ? [160, 240, 320, 400, 480][[4, 6, 8, 10, 12].indexOf(parseInt(item.duration)) >= 0 ? [4, 6, 8, 10, 12].indexOf(parseInt(item.duration)) : 2]
      : Math.round(([160, 240, 320, 400, 480][[4, 6, 8, 10, 12].indexOf(parseInt(item.duration)) >= 0 ? [4, 6, 8, 10, 12].indexOf(parseInt(item.duration)) : 2]) * item.progressPercent / 100),
    currentWeek: Math.max(1, Math.ceil((item.progressPercent / 100) * parseInt(item.duration.replace(/\D/g, "")) / 7 * 7)),
    totalWeeks: Math.ceil(parseInt(item.duration.replace(/\D/g, ""))),
    lastCheckin: stage === "upcoming" ? "—" : "02/07/2026",
    nextCheckin: stage === "completed" ? "—" : "02/14/2026",
    createdDate: "01/10/2024",
    lastModified: "02/08/2026",
    finalGrade: stage === "completed" ? "A-" : undefined,
    totalHoursLogged: stage === "completed" ? 320 : undefined,
    attendanceRate: stage === "completed" ? 97 : undefined,
    certificateIssued: stage === "completed",
  }), [item, stage])

  // Stage-aware data
  const complianceItems = React.useMemo(() => complianceItemsByStage[stage] || complianceItemsByStage.ongoing, [stage])
  const milestones = React.useMemo(() => getMilestones(stage), [stage])
  const evaluations = React.useMemo(() => getEvaluations(stage), [stage])
  const activityLog = React.useMemo(() => getActivityLog(stage), [stage])

  const [activeTab, setActiveTab] = React.useState(() => {
    if (stage === "upcoming") return "overview"
    if (stage === "ongoing") return "overview"
    return "summary"
  })

  // Quick review navigation — move through students one by one (for faculty reviewing 100+ students)
  const navigateToScheduleDetail = useAppStore((s) => s.navigateToScheduleDetail)
  const reviewQueue = React.useMemo(() => {
    const list = allStudentScheduleData
      .filter((s) => (s.stage === "upcoming" || s.stage === "ongoing") && s.compliancePercent < 100)
      .sort((a, b) => a.compliancePercent - b.compliancePercent)
    return list
  }, [])
  const currentReviewIndex = React.useMemo(() => reviewQueue.findIndex((s) => s.id === scheduleId), [reviewQueue, scheduleId])
  const prevStudent = currentReviewIndex > 0 ? reviewQueue[currentReviewIndex - 1] : null
  const nextStudent = currentReviewIndex >= 0 && currentReviewIndex < reviewQueue.length - 1 ? reviewQueue[currentReviewIndex + 1] : null

  // Summaries
  const complianceSummary = React.useMemo(() => {
    const complete = complianceItems.filter((i) => i.status === "Complete").length
    const pending = complianceItems.filter((i) => i.status === "Pending" || i.status === "In Review").length
    const actionNeeded = complianceItems.filter((i) => i.status === "Missing" || i.status === "Expired").length
    return { complete, pending, actionNeeded, total: complianceItems.length }
  }, [complianceItems])

  const milestoneSummary = React.useMemo(() => {
    const completed = milestones.filter((m) => m.status === "Completed").length
    const inProgress = milestones.filter((m) => m.status === "In Progress").length
    return { completed, inProgress, total: milestones.length }
  }, [milestones])

  // ── Stage-aware metrics (SimpleMetric – borderless, matching PrimaryPageTemplate) ──

  const metrics: SimpleMetricData[] = React.useMemo(() => {
    if (stage === "upcoming") {
      return [
        createSimpleMetricData("Days Until Start", `${item.daysUntilStart}`, {
          trend: item.daysUntilStart <= 7 ? "down" : "neutral",
          trendValue: item.daysUntilStart <= 7 ? "Soon" : "",
        }),
        createSimpleMetricData("Compliance", `${item.compliancePercent}%`, {
          trend: item.compliancePercent >= 100 ? "up" : "down",
          trendValue: `${complianceSummary.actionNeeded} action`,
        }),
        createSimpleMetricData("Requirements Met", `${complianceSummary.complete}/${complianceSummary.total}`, {
          trend: complianceSummary.actionNeeded === 0 ? "up" : "down",
          trendValue: complianceSummary.actionNeeded === 0 ? "All clear" : `${complianceSummary.actionNeeded} missing`,
        }),
        createSimpleMetricData("Readiness", item.readinessStatus, {
          trend: item.readinessStatus === "Ready" ? "up" : "down",
          showArrow: false,
        }),
      ]
    }
    if (stage === "ongoing") {
      return [
        createSimpleMetricData("Hours Completed", `${detail.totalHoursCompleted}`, {
          trend: "up",
          trendValue: `/${detail.totalHoursRequired}`,
        }),
        createSimpleMetricData("Progress", `${item.progressPercent}%`, {
          trend: "up",
          trendValue: `Wk ${detail.currentWeek}/${detail.totalWeeks}`,
        }),
        createSimpleMetricData("Milestones", `${milestoneSummary.completed}/${milestoneSummary.total}`, {
          trend: "up",
          trendValue: milestoneSummary.inProgress > 0 ? `${milestoneSummary.inProgress} active` : "",
        }),
        createSimpleMetricData("Avg Rating", evaluations.filter((e) => e.rating).length > 0
          ? `${(evaluations.filter((e) => e.rating).reduce((s, e) => s + (e.rating || 0), 0) / evaluations.filter((e) => e.rating).length).toFixed(1)}`
          : "—", {
          trend: "up",
          trendValue: "/5.0",
        }),
      ]
    }
    // completed
    return [
      createSimpleMetricData("Final Grade", detail.finalGrade || "A-", {
        trend: "up",
        trendValue: item.finalStatus,
      }),
      createSimpleMetricData("Total Hours", `${detail.totalHoursLogged || 320}`, {
        trend: "up",
        trendValue: `${detail.attendanceRate || 97}% attend.`,
      }),
      createSimpleMetricData("Final Rating", item.finalEvaluation, {
        trend: "up",
        trendValue: `${evaluations.filter((e) => e.status === "Completed").length} evals`,
      }),
      createSimpleMetricData("Certificate", detail.certificateIssued ? "Issued" : "Pending", {
        trend: detail.certificateIssued ? "up" : "down",
        trendValue: detail.certificateIssued ? "Ready" : "Pending",
      }),
    ]
  }, [stage, item, detail, complianceSummary, milestoneSummary, evaluations])

  // ── Stage-aware insight banner ─────────────────────────────────────────

  const insightBanner = React.useMemo(() => {
    if (stage === "upcoming" && complianceSummary.actionNeeded > 0) {
      return (
        <InsightCard
          data={createInsightCardData(
            "Documents pending review",
            `${complianceSummary.actionNeeded} item${complianceSummary.actionNeeded > 1 ? "s" : ""} need review — verify documents meet guidelines before rotation starts ${item.startDate}.`,
            "sparkles"
          )}
          onClick={() => setActiveTab("compliance")}
        />
      )
    }
    if (stage === "upcoming" && item.daysUntilStart <= 7) {
      return (
        <InsightCard
          data={createInsightCardData(
            "Starting in " + item.daysUntilStart + " days",
            `Rotation begins on ${item.startDate}. Ensure all requirements are met.`,
            "sparkles"
          )}
        />
      )
    }
    if (stage === "ongoing" && milestoneSummary.inProgress > 0) {
      return (
        <InsightCard
          data={createInsightCardData(
            "Milestone in progress",
            `${milestoneSummary.inProgress} milestone${milestoneSummary.inProgress > 1 ? "s" : ""} currently in progress. ${milestoneSummary.completed}/${milestoneSummary.total} completed.`,
            "sparkles"
          )}
          onClick={() => setActiveTab("progress")}
        />
      )
    }
    if (stage === "completed") {
      return (
        <InsightCard
          data={createInsightCardData(
            "Rotation completed successfully",
            `${item.studentName} completed the rotation with a final evaluation of ${item.finalEvaluation}.`,
            "sparkles"
          )}
        />
      )
    }
    return null
  }, [stage, complianceSummary, milestoneSummary, item])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="pb-6 space-y-0">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex-none px-4 lg:px-6 pt-4 lg:pt-6 space-y-2">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <h1 className="page-title-sm">
                {item.studentName}
                <span className="text-muted-foreground font-normal mx-2">@</span>
                {item.siteName}
              </h1>
              <StageBadge stage={stage} />
            </div>
            <div className="text-sm text-muted-foreground">
              {item.scheduleId} • {item.availabilityName} • {item.location}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" aria-label="More actions">
                <FontAwesomeIcon name="moreHorizontal" className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <FontAwesomeIcon name="share" className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FontAwesomeIcon name="copy" className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FontAwesomeIcon name="edit" className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <FontAwesomeIcon name="eye" className="h-4 w-4 mr-2" />
                  View in Site
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FontAwesomeIcon name="download" className="h-4 w-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Quick Review Navigation — move through students one by one ── */}
      {(prevStudent || nextStudent) && (
        <div className="flex items-center justify-between gap-4 px-4 lg:px-6 py-2 bg-muted/50 border-y border-border">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            disabled={!prevStudent}
            onClick={() => prevStudent && navigateToScheduleDetail(prevStudent.id, prevStudent.studentName, prevStudent.siteName)}
          >
            <FontAwesomeIcon name="chevronLeft" className="h-4 w-4" />
            Previous Student
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentReviewIndex >= 0 ? (
              <>Student {currentReviewIndex + 1} of {reviewQueue.length} needing review</>
            ) : (
              "Review queue"
            )}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            disabled={!nextStudent}
            onClick={() => nextStudent && navigateToScheduleDetail(nextStudent.id, nextStudent.studentName, nextStudent.siteName)}
          >
            Next Student
            <FontAwesomeIcon name="chevronRight" className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* ── Key Metrics — SimpleMetric + gradient (PrimaryPageTemplate pattern) ── */}
      <div className="relative">
        <div
          data-slot="brand-gradient"
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{ background: "linear-gradient(to top, color-mix(in oklch, var(--brand-color) 8%, transparent), transparent)" }}
        />
        <div className="relative">
          <div className={cn("px-4 lg:px-6 pb-8", insightBanner ? "flex items-center gap-6" : "")}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 min-w-0">
              {metrics.map((metric, index) => (
                <SimpleMetric
                  key={`metric-${stage}-${index}`}
                  data={metric}
                  variant="compact"
                  className={cn(
                    index < metrics.length - 1 && "md:border-r border-border md:pr-6"
                  )}
                />
              ))}
            </div>
            {insightBanner && (
              <div className="hidden lg:block w-[340px] flex-shrink-0 py-1">
                {insightBanner}
              </div>
            )}
          </div>
          <div className="h-px bg-border" />
        </div>
      </div>

      {/* ── Tabs — stage-aware ──────────────────────────────────────────── */}
      <div className="px-4 lg:px-6 pt-4 space-y-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          {/* Stage-aware tab set */}
          {stage === "upcoming" && (
            <>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="compliance">
                <span className="flex items-center gap-2">
                  Compliance
                  {complianceSummary.actionNeeded > 0 && (
                    <Badge variant="secondary" className="h-4 px-1.5 bg-destructive text-destructive-foreground text-xs">
                      {complianceSummary.actionNeeded}
                    </Badge>
                  )}
                </span>
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </>
          )}
          {stage === "ongoing" && (
            <>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">
                <span className="flex items-center gap-2">
                  Progress
                  <Badge variant="secondary" className="h-4 px-1.5">
                    {milestoneSummary.completed}/{milestoneSummary.total}
                  </Badge>
                </span>
              </TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="evaluations">
                <span className="flex items-center gap-2">
                  Evaluations
                  <Badge variant="secondary" className="h-4 px-1.5">
                    {evaluations.filter(e => e.status === "Completed").length}/{evaluations.length}
                  </Badge>
                </span>
              </TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </>
          )}
          {stage === "completed" && (
            <>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="evaluations">
                <span className="flex items-center gap-2">
                  Evaluations
                  <Badge variant="secondary" className="h-4 px-1.5">
                    {evaluations.length}
                  </Badge>
                </span>
              </TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* ── Overview Tab (upcoming + ongoing) ──────────────────────────── */}
        <TabsContent value="overview" className="m-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2/3 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Student Information */}
              <SectionCard title="Student Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    {[
                      { icon: "user" as IconName, label: "Full Name", value: item.studentName },
                      { icon: "mail" as IconName, label: "Email", value: item.studentEmail },
                      { icon: "phone" as IconName, label: "Phone", value: detail.phone },
                      { icon: "bookOpen" as IconName, label: "Program", value: `${detail.program} — ${detail.programYear}` },
                      { icon: "building2" as IconName, label: "School", value: detail.school },
                      { icon: "award" as IconName, label: "GPA", value: detail.gpa.toFixed(2) },
                    ].map((row, i) => (
                      <div key={i} className="flex items-start gap-3 py-2.5">
                        <FontAwesomeIcon name={row.icon} className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground mb-0.5">{row.label}</div>
                          <div className="text-sm font-medium text-foreground">{row.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
              </SectionCard>

              {/* Assignment Details */}
              <SectionCard title="Assignment Details">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    {[
                      { icon: "briefcase" as IconName, label: "Internship", value: item.internshipName },
                      { icon: "book-open" as IconName, label: "Course", value: item.courseName },
                      { icon: "bookOpen" as IconName, label: "Discipline", value: item.discipline },
                      { icon: "stethoscope" as IconName, label: "Specialization", value: item.specialization },
                      { icon: "calendar" as IconName, label: "Duration", value: `${item.startDate} — ${item.endDate} (${item.duration})` },
                      { icon: "clock" as IconName, label: "Schedule", value: detail.shift },
                      { icon: "timer" as IconName, label: "Hours/Week", value: `${detail.hoursPerWeek} hours` },
                      { icon: "target" as IconName, label: "Total Hours Required", value: `${detail.totalHoursRequired} hours` },
                    ].map((row, i) => (
                      <div key={i} className="flex items-start gap-3 py-2.5">
                        <FontAwesomeIcon name={row.icon} className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground mb-0.5">{row.label}</div>
                          <div className="text-sm font-medium text-foreground">{row.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
              </SectionCard>

              {/* Timeline — stage-aware steps */}
              <SectionCard title="Schedule Timeline">
                  <div className="space-y-3">
                    {[
                      { label: "Schedule Created", date: detail.createdDate, completed: true },
                      { label: "Compliance Verification", date: item.startDate, completed: stage !== "upcoming" || item.compliancePercent === 100 },
                      { label: "Rotation Start", date: item.startDate, completed: stage !== "upcoming" },
                      ...(stage !== "upcoming" ? [{ label: "Mid-Rotation Review", date: "—", completed: item.progressPercent >= 50 }] : []),
                      { label: "Rotation End", date: item.endDate, completed: stage === "completed" },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                          step.completed ? "bg-chart-2/10" : "bg-muted"
                        )}>
                          {step.completed ? (
                            <FontAwesomeIcon name="checkCircle" className="h-4 w-4 text-chart-2" />
                          ) : (
                            <FontAwesomeIcon name="clock" className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <span className={cn("text-sm font-medium", step.completed ? "text-foreground" : "text-muted-foreground")}>
                            {step.label}
                          </span>
                          <span className="text-xs text-muted-foreground">{step.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
              </SectionCard>
            </div>

            {/* Right 1/3 */}
            <div className="space-y-6">
              {/* Clinical Site */}
              <SectionCard title="Clinical Site">
                  <div className="text-sm"><span className="text-muted-foreground">Name:</span> <span className="font-medium">{item.siteName}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Location:</span> <span className="font-medium">{item.location}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{detail.sitePhone}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{detail.siteEmail}</span></div>
              </SectionCard>

              {/* Preceptor */}
              <SectionCard title="Preceptor">
                  <div className="text-sm"><span className="text-muted-foreground">Name:</span> <span className="font-medium">{item.preceptorName}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Title:</span> <span className="font-medium">{item.preceptorTitle}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{detail.preceptorEmail}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{detail.preceptorPhone}</span></div>
              </SectionCard>

              {/* Compliance Summary */}
              <SectionCard title="Compliance Summary">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overall</span>
                      <span className="font-medium">{item.compliancePercent}%</span>
                    </div>
                    <Progress value={item.compliancePercent} className="h-2" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="space-y-1">
                      <div className="text-lg font-semibold text-chart-2">{complianceSummary.complete}</div>
                      <div className="text-xs text-muted-foreground">Complete</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-semibold text-chart-4">{complianceSummary.pending}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-semibold text-destructive">{complianceSummary.actionNeeded}</div>
                      <div className="text-xs text-muted-foreground">Action</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab("compliance")}>
                    View Details
                    <FontAwesomeIcon name="chevronRight" className="h-3.5 w-3.5 ml-1" />
                  </Button>
              </SectionCard>

              {/* Check-ins — only for ongoing */}
              {stage === "ongoing" && (
                <SectionCard title="Check-ins">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Check-in</span>
                      <span className="font-medium">{detail.lastCheckin}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next Check-in</span>
                      <span className="font-medium text-chart-1">{detail.nextCheckin}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <FontAwesomeIcon name="messageSquare" className="h-3.5 w-3.5 mr-1.5" />
                      Schedule Check-in
                    </Button>
                </SectionCard>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Summary Tab (completed only) ─────────────────────────────── */}
        <TabsContent value="summary" className="m-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Completion Summary */}
              <SectionCard title="Completion Summary">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 rounded-lg bg-chart-2/5">
                      <div className="text-2xl font-bold text-chart-2 font-serif">{detail.finalGrade || "A-"}</div>
                      <div className="text-xs text-muted-foreground mt-1">Final Grade</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-chart-1/5">
                      <div className="text-2xl font-bold text-chart-1 font-serif">{detail.totalHoursLogged || 320}</div>
                      <div className="text-xs text-muted-foreground mt-1">Hours Logged</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-chart-4/5">
                      <div className="text-2xl font-bold text-chart-4 font-serif">{item.finalEvaluation}</div>
                      <div className="text-xs text-muted-foreground mt-1">Final Rating</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-chart-3/5">
                      <div className="text-2xl font-bold text-chart-3 font-serif">{detail.attendanceRate || 97}%</div>
                      <div className="text-xs text-muted-foreground mt-1">Attendance</div>
                    </div>
                  </div>
              </SectionCard>

              {/* Student & Assignment — reuse overview pattern */}
              <SectionCard title="Student & Assignment">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    {[
                      { icon: "user" as IconName, label: "Student", value: item.studentName },
                      { icon: "building2" as IconName, label: "School", value: detail.school },
                      { icon: "briefcase" as IconName, label: "Internship", value: item.internshipName },
                      { icon: "book-open" as IconName, label: "Course", value: item.courseName },
                      { icon: "calendar" as IconName, label: "Dates", value: `${item.startDate} — ${item.endDate}` },
                      { icon: "clock" as IconName, label: "Duration", value: item.duration },
                    ].map((row, i) => (
                      <div key={i} className="flex items-start gap-3 py-2.5">
                        <FontAwesomeIcon name={row.icon} className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground mb-0.5">{row.label}</div>
                          <div className="text-sm font-medium text-foreground">{row.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
              </SectionCard>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <SectionCard title="Certificate">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon name="award" className={cn("h-5 w-5", detail.certificateIssued ? "text-chart-2" : "text-muted-foreground")} />
                    <span className="font-medium text-sm">{detail.certificateIssued ? "Certificate Issued" : "Pending"}</span>
                  </div>
                  {detail.certificateIssued && (
                    <Button variant="outline" size="sm" className="w-full">
                      <FontAwesomeIcon name="download" className="h-3.5 w-3.5 mr-1.5" />
                      Download Certificate
                    </Button>
                  )}
              </SectionCard>

              <SectionCard title="Site & Preceptor">
                  <div className="text-sm"><span className="text-muted-foreground">Site:</span> <span className="font-medium">{item.siteName}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Location:</span> <span className="font-medium">{item.location}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Preceptor:</span> <span className="font-medium">{item.preceptorName}</span></div>
                  <div className="text-sm"><span className="text-muted-foreground">Title:</span> <span className="font-medium">{item.preceptorTitle}</span></div>
              </SectionCard>

              <SectionCard title="Compliance">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-chart-2 font-serif">{complianceSummary.complete}/{complianceSummary.total}</div>
                    <div className="text-xs text-muted-foreground mt-1">All requirements met</div>
                  </div>
              </SectionCard>
            </div>
          </div>
        </TabsContent>

        {/* ── Progress Tab (ongoing only) ───────────────────────────────── */}
        <TabsContent value="progress" className="m-0 space-y-6">
          {/* Hours Progress */}
          <SectionCard title="Clinical Hours">
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-3xl font-bold text-foreground">{detail.totalHoursCompleted}</div>
                    <div className="text-sm text-muted-foreground">of {detail.totalHoursRequired} hours completed</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-chart-1">{Math.round((detail.totalHoursCompleted / detail.totalHoursRequired) * 100)}%</div>
                    <div className="text-xs text-muted-foreground">{detail.totalHoursRequired - detail.totalHoursCompleted} hrs remaining</div>
                  </div>
                </div>
                <Progress value={(detail.totalHoursCompleted / detail.totalHoursRequired) * 100} className="h-3" />
                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-lg font-semibold">{detail.hoursPerWeek}</div>
                    <div className="text-xs text-muted-foreground">Hours/Week</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-lg font-semibold">{detail.currentWeek}</div>
                    <div className="text-xs text-muted-foreground">Current Week</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <div className="text-lg font-semibold">{detail.totalWeeks - detail.currentWeek}</div>
                    <div className="text-xs text-muted-foreground">Weeks Left</div>
                  </div>
                </div>
              </div>
          </SectionCard>

          {/* Milestones */}
          <SectionCard title="Milestones">
              <div className="text-sm text-muted-foreground mb-3">{milestoneSummary.completed}/{milestoneSummary.total} completed</div>
              <div className="space-y-1">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                    <MilestoneStatusIcon status={milestone.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("text-sm font-medium", milestone.status === "Overdue" ? "text-destructive" : "text-foreground")}>
                          {milestone.title}
                        </span>
                        <Badge variant="outline" className="text-xs px-1.5 flex-shrink-0">
                          {milestone.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon name="calendar" className="h-3 w-3" />
                          Due: {milestone.dueDate}
                        </span>
                        {milestone.completedDate && (
                          <span className="flex items-center gap-1 text-chart-2">
                            <FontAwesomeIcon name="checkCircle" className="h-3 w-3" />
                            Completed: {milestone.completedDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </SectionCard>
        </TabsContent>

        {/* ── Milestones Tab (completed only) ──────────────────────────── */}
        <TabsContent value="milestones" className="m-0 space-y-6">
          <SectionCard title="All Milestones">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                  <FontAwesomeIcon name="checkCircle" className="h-3 w-3 mr-1" weight="light" />
                  {milestoneSummary.completed}/{milestoneSummary.total} completed
                </Badge>
              </div>
              <div className="space-y-1">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                    <MilestoneStatusIcon status={milestone.status} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{milestone.title}</span>
                        <Badge variant="outline" className="text-xs px-1.5 flex-shrink-0">{milestone.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon name="calendar" className="h-3 w-3" />
                          Due: {milestone.dueDate}
                        </span>
                        {milestone.completedDate && (
                          <span className="flex items-center gap-1 text-chart-2">
                            <FontAwesomeIcon name="checkCircle" className="h-3 w-3" />
                            Completed: {milestone.completedDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </SectionCard>
        </TabsContent>

        {/* ── Compliance Tab ────────────────────────────────────────────── */}
        <TabsContent value="compliance" className="m-0 space-y-6">
          {/* Review focus — verify documents meet guidelines */}
          {complianceSummary.actionNeeded > 0 && (
            <SectionCard title="Documents Pending Review">
              <p className="text-sm text-muted-foreground">
                {complianceSummary.actionNeeded} requirement{complianceSummary.actionNeeded > 1 ? "s" : ""} need{complianceSummary.actionNeeded === 1 ? "s" : ""} review. Verify documents are correct and meet guidelines.
              </p>
            </SectionCard>
          )}
          {/* Summary — key metrics (compact variant, no card wrapper) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <SimpleMetric
              data={createSimpleMetricData("Complete", String(complianceSummary.complete), { showArrow: false })}
              variant="compact"
              className={cn("md:border-r border-border md:pr-6", "[&_.font-bold]:text-chart-2")}
            />
            <SimpleMetric
              data={createSimpleMetricData("Pending / In Review", String(complianceSummary.pending), { showArrow: false })}
              variant="compact"
              className={cn("md:border-r border-border md:pr-6", "[&_.font-bold]:text-chart-4")}
            />
            <SimpleMetric
              data={createSimpleMetricData("Action Required", String(complianceSummary.actionNeeded), { showArrow: false })}
              variant="compact"
              className={cn("md:border-r border-border md:pr-6", "[&_.font-bold]:text-destructive")}
            />
            <SimpleMetric
              data={createSimpleMetricData("Overall Compliance", `${item.compliancePercent}%`, { showArrow: false })}
              variant="compact"
            />
          </div>

          {/* Items list */}
          <SectionCard title="Requirements">
              <div className="space-y-1">
                {complianceItems.map((ci) => (
                  <div key={ci.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5">
                        {ci.status === "Complete" ? (
                          <FontAwesomeIcon name="checkCircle" className="h-4 w-4 text-chart-2" />
                        ) : ci.status === "Missing" || ci.status === "Expired" ? (
                          <FontAwesomeIcon name="alertCircle" className="h-4 w-4 text-destructive" />
                        ) : (
                          <FontAwesomeIcon name="clock" className="h-4 w-4 text-chart-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-foreground">{ci.name}</div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{ci.category}</span>
                          <span>&bull;</span>
                          <span>Source: {ci.source}</span>
                          <span>&bull;</span>
                          <span>Due: {ci.dueDate}</span>
                        </div>
                        {ci.notes && (
                          <div className="text-xs text-muted-foreground mt-0.5 italic">{ci.notes}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {ci.submittedDate && (
                        <span className="text-xs text-muted-foreground">Submitted: {ci.submittedDate}</span>
                      )}
                      {ci.submittedDate && (
                        <Button variant="outline" size="sm" className="h-7">
                          <FontAwesomeIcon name="eye" className="h-3.5 w-3.5 mr-1.5" />
                          View
                        </Button>
                      )}
                      {(ci.status === "Pending" || ci.status === "In Review") && (
                        <>
                          <Button variant="outline" size="sm" className="h-7 text-chart-2">
                            <FontAwesomeIcon name="checkCircle" className="h-3.5 w-3.5 mr-1.5" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" className="h-7 text-destructive">
                            <FontAwesomeIcon name="refreshCw" className="h-3.5 w-3.5 mr-1.5" />
                            Request Changes
                          </Button>
                        </>
                      )}
                      <ComplianceStatusBadge status={ci.status} />
                    </div>
                  </div>
                ))}
              </div>
          </SectionCard>
        </TabsContent>

        {/* ── Evaluations Tab ──────────────────────────────────────────── */}
        <TabsContent value="evaluations" className="m-0 space-y-6">
          {evaluations.length === 0 ? (
            <SectionCard title="Evaluations">
              <div className="py-8 text-center">
                <FontAwesomeIcon name="award" className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <div className="text-sm font-medium text-muted-foreground">No evaluations yet</div>
                <p className="text-xs text-muted-foreground mt-1">Evaluations will appear once the rotation begins.</p>
              </div>
            </SectionCard>
          ) : (
            evaluations.map((evaluation) => (
              <Card key={evaluation.id}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-medium text-foreground">{evaluation.title}</h3>
                        <Badge variant="outline" className="text-xs px-1.5">{evaluation.type}</Badge>
                        {evaluation.status === "Completed" ? (
                          <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-xs">
                            <FontAwesomeIcon name="checkCircle" className="h-3 w-3 mr-0.5" />
                            Completed
                          </Badge>
                        ) : evaluation.status === "Overdue" ? (
                          <Badge variant="secondary" className="bg-destructive/10 text-chip-destructive border-chip-destructive/40 text-xs">
                            <FontAwesomeIcon name="alertTriangle" className="h-3 w-3 mr-0.5" weight="light" />
                            Overdue
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-chart-4/10 text-chart-4 border-chart-4/20 text-xs">
                            <FontAwesomeIcon name="clock" className="h-3 w-3 mr-0.5" weight="light" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon name="user" className="h-3 w-3" />
                          {evaluation.evaluator} ({evaluation.evaluatorRole})
                        </span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon name="calendar" className="h-3 w-3" />
                          {evaluation.date}
                        </span>
                      </div>
                      {evaluation.summary && (
                        <p className="text-sm text-muted-foreground italic">&ldquo;{evaluation.summary}&rdquo;</p>
                      )}
                    </div>
                    {evaluation.rating !== undefined && (
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon name="star" className="h-4 w-4 text-chart-4" />
                          <span className="text-xl font-bold text-foreground">{evaluation.rating}</span>
                          <span className="text-sm text-muted-foreground">/{evaluation.maxRating}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Activity Tab ─────────────────────────────────────────────── */}
        <TabsContent value="activity" className="m-0 space-y-6">
          <SectionCard title="Activity Log">
              <div className="space-y-0">
                {activityLog.map((al) => (
                  <div key={al.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                    <div className="mt-0.5 h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <ActivityIcon type={al.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">{al.action}</span>
                        <span className="text-xs text-muted-foreground flex-shrink-0">{al.timestamp}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{al.description}</p>
                      <span className="text-xs text-muted-foreground mt-0.5 inline-block">by {al.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
