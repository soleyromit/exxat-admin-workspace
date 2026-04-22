"use client"

/**
 * DashboardTabs — three-view dashboard switcher
 *
 *  Report  — full KPI + charts view (current dashboard)
 *  Simple  — Greeting · Tasks · Insights · Recent Activity · Guide · Onboarding
 *  Mix     — compact metrics + key chart + tasks & activity side-by-side
 */

import * as React from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { KeyMetrics, type MetricItem, type MetricInsight } from "@/components/key-metrics"
import type { ChartCardVariant } from "@/components/charts-overview"
import { DashboardReportCharts } from "@/components/dashboard-report-charts"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { useDashboardView }  from "@/contexts/dashboard-view-context"
import { useChartVariant }   from "@/contexts/chart-variant-context"
import { AskLeoShortcutKbds, useAskLeo, useAskLeoPageContext } from "@/components/ask-leo-sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { CoachMark } from "@/components/ui/coach-mark"
import { useCoachMark } from "@/hooks/use-coach-mark"

/* ── Types passed from the page ─────────────────────────────────────────── */
interface DashboardTabsProps {
  metrics: MetricItem[]
  insight: MetricInsight
  title?: string
  subtitle?: string
}

/* ════════════════════════════════════════════════════════════════════════════
   SIMPLE TAB — widgets
   ════════════════════════════════════════════════════════════════════════════ */

/* ── Greeting ─────────────────────────────────────────────────────────────── */
function GreetingWidget() {
  const [now, setNow] = React.useState<Date | null>(null)
  React.useEffect(() => { setNow(new Date()) }, [])

  const hour = now?.getHours() ?? 9
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider" suppressHydrationWarning>
            {now?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) ?? ""}
          </p>
          <h2
            className="text-2xl font-semibold tracking-tight leading-tight text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {greeting}, Himanshu 👋
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            You have <span className="font-medium text-foreground">8 reviews</span> pending and{" "}
            <span className="font-medium text-foreground">23 requests</span> waiting today.
          </p>
        </div>
        <span
          className="shrink-0 flex h-12 w-12 items-center justify-center rounded-full text-xl bg-brand/12 text-brand"
          aria-hidden="true"
        >
          <i className="fa-light fa-sun-bright" />
        </span>
      </div>
    </div>
  )
}

/* ── Tasks ────────────────────────────────────────────────────────────────── */
const TASKS = [
  { id: 1, label: "Review pending evaluations",   due: "Today",     priority: "high",   done: false },
  { id: 2, label: "Approve site contract — City Med", due: "Today",  priority: "high",   done: false },
  { id: 3, label: "Send onboarding docs to PT cohort", due: "Tomorrow", priority: "medium", done: false },
  { id: 4, label: "Update compliance checklist",  due: "Mar 25",    priority: "medium", done: false },
  { id: 5, label: "Schedule supervisor training", due: "Mar 28",    priority: "low",    done: true  },
]

const PRIORITY_STYLES: Record<string, string> = {
  high:   "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-chart-4/12 text-chart-4 border-chart-4/20",
  low:    "bg-muted text-muted-foreground border-border",
}

function TasksWidget() {
  const [tasks, setTasks] = React.useState(TASKS)
  const pending = tasks.filter((t) => !t.done).length
  const { toggle: toggleAskLeo } = useAskLeo()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Tasks</CardTitle>
          <Badge variant="outline" className="text-xs tabular-nums">{pending} pending</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {tasks.map((task) => (
          <label
            key={task.id}
            className={cn(
              "flex items-start gap-2.5 rounded-lg px-2 py-1.5 cursor-pointer",
              "hover:bg-interactive-hover-medium transition-colors select-none",
              task.done && "opacity-50"
            )}
          >
            <input
              type="checkbox"
              className="mt-0.5 accent-[var(--brand-color)] shrink-0"
              checked={task.done}
              onChange={() =>
                setTasks((prev) =>
                  prev.map((t) => t.id === task.id ? { ...t, done: !t.done } : t)
                )
              }
            />
            <div className="flex-1 min-w-0">
              <p className={cn("text-xs font-medium leading-snug", task.done && "line-through text-muted-foreground")}>
                {task.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{task.due}</p>
            </div>
            <span className={cn("shrink-0 mt-0.5 rounded border px-1.5 py-0.5 text-xs font-medium", PRIORITY_STYLES[task.priority])}>
              {task.priority}
            </span>
          </label>
        ))}
      </CardContent>
      <CardFooter>
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5">
          <i className="fa-light fa-clipboard-list text-xs" aria-hidden="true" />
          View all tasks
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-xs gap-1.5 text-muted-foreground ms-auto"
              onClick={toggleAskLeo}
              aria-label="Ask Leo"
            >
              <i className="fa-duotone fa-solid fa-star-christmas text-xs text-brand" aria-hidden="true" />
              Ask Leo
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="flex flex-wrap items-center gap-1.5">
            <span>Ask Leo</span>
            <AskLeoShortcutKbds />
          </TooltipContent>
        </Tooltip>
      </CardFooter>
    </Card>
  )
}

/* ── Insights ─────────────────────────────────────────────────────────────── */
const INSIGHTS = [
  {
    id: 1,
    icon: "fa-arrow-trend-up",
    color: "var(--chart-2)",
    bg:   "var(--chart-2)",
    title: "Placement rate up 12%",
    body:  "Nursing placements increased compared to last quarter. Site capacity utilisation at 94%.",
  },
  {
    id: 2,
    icon: "fa-triangle-exclamation",
    color: "var(--chart-4)",
    bg:   "var(--chart-4)",
    title: "Review backlog growing",
    body:  "8 evaluations have been pending for more than 48 hrs. Clear them to unblock new requests.",
  },
  {
    id: 3,
    icon: "fa-certificate",
    color: "var(--brand-color)",
    bg:   "var(--brand-color)",
    title: "Compliance milestone",
    body:  "Nursing program reached 98% compliance — highest in 12 months.",
  },
]

function InsightsWidget() {
  /* Glow applied — AI surface (rule 1). See GLOW GUIDELINE in key-metrics.tsx */
  return (
    <Card
      className="overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 120% 80% at 50% 100%, oklch(from var(--brand-color) l c h / 0.14) 0%, transparent 65%)",
      }}
    >
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Insights</CardTitle>
        <CardDescription className="text-xs">AI-generated · Updated now</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {INSIGHTS.map((ins) => (
          <div key={ins.id} className="flex gap-3 items-start">
            <span
              className="shrink-0 mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs"
              style={{ background: `oklch(from ${ins.bg} l c h / 0.14)`, color: ins.color }}
              aria-hidden="true"
            >
              <i className={`fa-light ${ins.icon}`} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground leading-snug">{ins.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{ins.body}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ── Recent Activity ──────────────────────────────────────────────────────── */
const ACTIVITY = [
  { id: 1, icon: "fa-user-check",      color: "var(--chart-2)",     actor: "Dr. Patel",     action: "approved",    subject: "City Med placement",      time: "2m ago"  },
  { id: 2, icon: "fa-file-signature",  color: "var(--brand-color)", actor: "Sarah Kim",     action: "submitted",   subject: "OT evaluation form",       time: "18m ago" },
  { id: 3, icon: "fa-circle-xmark",    color: "var(--destructive)", actor: "North Clinic",  action: "rejected",    subject: "2 pending requests",       time: "1h ago"  },
  { id: 4, icon: "fa-envelope-open",   color: "var(--chart-4)",     actor: "System",        action: "sent reminder", subject: "to 5 supervisors",       time: "3h ago"  },
  { id: 5, icon: "fa-arrow-up-right",  color: "var(--brand-color)", actor: "You",           action: "exported",    subject: "Q1 compliance report",     time: "5h ago"  },
  { id: 6, icon: "fa-user-plus",       color: "var(--chart-2)",     actor: "Admissions",    action: "added",       subject: "14 new nursing students",  time: "Yesterday"},
]

function RecentActivityWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col overflow-auto">
        {ACTIVITY.map((ev, idx) => (
          <React.Fragment key={ev.id}>
            <div className="flex items-start gap-3 py-2">
              <span
                className="shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs"
                style={{ background: `oklch(from ${ev.color} l c h / 0.13)`, color: ev.color }}
                aria-hidden="true"
              >
                <i className={`fa-light ${ev.icon}`} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-snug text-foreground">
                  <span className="font-medium">{ev.actor}</span>{" "}
                  <span className="text-muted-foreground">{ev.action}</span>{" "}
                  <span className="font-medium">{ev.subject}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{ev.time}</p>
              </div>
            </div>
            {idx < ACTIVITY.length - 1 && (
              <Separator className="opacity-50" aria-hidden="true" />
            )}
          </React.Fragment>
        ))}
      </CardContent>
    </Card>
  )
}

/* ── Learn / Guide ────────────────────────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Create your organisation profile",  done: true  },
  { id: 2, label: "Add your first placement site",     done: true  },
  { id: 3, label: "Import student roster",             done: true  },
  { id: 4, label: "Configure compliance requirements", done: false },
  { id: 5, label: "Invite supervisors",                done: false },
  { id: 6, label: "Launch first placement cycle",      done: false },
]

const GUIDE_ARTICLES = [
  {
    id: "workflow",
    icon: "fa-sitemap",
    title: "How does a placement actually work?",
    meta: "5m read",
    gradientClass: "bg-gradient-to-br from-chart-3 to-chart-1",
  },
  {
    id: "site",
    icon: "fa-circle-play",
    title: "Watch: Setting up your first clinical site",
    meta: "3m watch",
    gradientClass: "bg-gradient-to-br from-chart-1 to-chart-5",
  },
  {
    id: "compliance",
    icon: "fa-shield-check",
    title: "Make compliance less of a headache",
    meta: "8m read",
    gradientClass: "bg-gradient-to-br from-chart-2 to-chart-4",
  },
  {
    id: "reports",
    icon: "fa-file-chart-column",
    title: "Turn your data into a report in 2 minutes",
    meta: "4m read",
    gradientClass: "bg-gradient-to-br from-chart-4 to-chart-5",
  },
  {
    id: "support",
    icon: "fa-headset",
    title: "Stuck? Our team is one message away",
    meta: "Get help",
    gradientClass: "bg-gradient-to-br from-chart-3 to-muted",
  },
]

function LearnSection() {
  const done     = STEPS.filter((s) => s.done).length
  const total    = STEPS.length
  const pct      = Math.round((done / total) * 100)
  const nextStep = STEPS.find((s) => !s.done)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 shrink-0">
        <CardTitle className="text-sm font-semibold">Learn</CardTitle>
        <CardDescription className="text-xs">Guides, videos &amp; resources</CardDescription>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>

          {/* ── Card 1: Onboarding progress ── */}
          <a
            href="#"
            className="shrink-0 w-[13rem] flex flex-col rounded-lg overflow-hidden border border-border bg-card hover:bg-interactive-hover-soft transition-colors focus-visible:outline-2 focus-visible:outline-ring"
            aria-label={`Continue setup — ${done} of ${total} steps done`}
          >
            <div
              className="h-[6.5rem] relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-chart-1 to-chart-3"
            >
              <i className="fa-light fa-rocket-launch text-[3rem] text-background/25" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
                <div className="h-[3px] rounded-full overflow-hidden bg-background/20">
                  <div
                    className="h-full rounded-full bg-background/80"
                    style={{ width: `${pct}%`, transition: "width 0.5s ease" }}
                  />
                </div>
              </div>
            </div>
            <div className="p-3 flex flex-col gap-1 flex-1">
              <p className="text-[0.8125rem] font-semibold text-foreground leading-snug">
                Pick up where you left off
              </p>
              {nextStep && (
                <p className="text-xs text-muted-foreground leading-snug">Next: {nextStep.label}</p>
              )}
              <div className="mt-auto pt-1.5">
                <span className="inline-block text-xs font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {done}/{total} steps
                </span>
              </div>
            </div>
          </a>

          {/* ── Article cards ── */}
          {GUIDE_ARTICLES.map((g) => (
            <a
              key={g.id}
              href="#"
              className="shrink-0 w-[13rem] flex flex-col rounded-lg overflow-hidden border border-border bg-card hover:bg-interactive-hover-soft transition-colors focus-visible:outline-2 focus-visible:outline-ring"
              aria-label={g.title}
            >
              <div
                className={cn("h-[6.5rem] flex items-center justify-center overflow-hidden", g.gradientClass)}
              >
                <i className={`fa-light ${g.icon} text-[3rem] text-background/25`} aria-hidden="true" />
              </div>
              <div className="p-3 flex flex-col gap-1 flex-1">
                <h3 className="text-[0.8125rem] font-medium text-foreground leading-snug">{g.title}</h3>
                <div className="flex items-center gap-1.5 mt-auto pt-1.5 text-muted-foreground">
                  <i className="fa-light fa-book-open text-xs" aria-hidden="true" />
                  <span className="text-xs">{g.meta}</span>
                </div>
              </div>
            </a>
          ))}

        </div>
      </CardContent>
    </Card>
  )
}

/* keep OnboardingWidget for MixView standalone use */
function OnboardingWidget() {
  const done  = STEPS.filter((s) => s.done).length
  const total = STEPS.length
  const pct   = Math.round((done / total) * 100)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Guided Onboarding</CardTitle>
          <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--brand-color)" }}>
            {done}/{total}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden" aria-hidden="true">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: "var(--brand-color)" }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{pct}% complete</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-0.5">
        {STEPS.map((step) => (
          <div key={step.id} className="flex items-center gap-2.5 py-1.5 px-1 rounded-lg">
            <span
              className={cn(
                "shrink-0 flex h-5 w-5 items-center justify-center rounded-full text-xs border",
                step.done
                  ? "border-transparent text-white"
                  : "border-border bg-background text-muted-foreground"
              )}
              style={step.done ? { background: "var(--brand-color)" } : {}}
              aria-hidden="true"
            >
              {step.done
                ? <i className="fa-light fa-check" />
                : <span className="text-xs font-medium">{step.id}</span>
              }
            </span>
            <p className={cn(
              "text-xs leading-snug flex-1",
              step.done ? "text-muted-foreground line-through" : "text-foreground font-medium"
            )}>
              {step.label}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   TAB VIEWS
   ════════════════════════════════════════════════════════════════════════════ */

const VIEW_OPTIONS = [
  { value: "report", label: "Report" },
  { value: "simple", label: "Simple" },
  { value: "mix",    label: "Mix"    },
]

const CHART_VARIANT_OPTIONS: { value: ChartCardVariant; label: string }[] = [
  { value: "normal",       label: "Normal"        },
  { value: "tabs",         label: "With Tabs"     },
  { value: "selector",     label: "With Filters"  },
  { value: "metrics-tabs", label: "Tabs + Metrics" },
  { value: "kpi-chart",    label: "KPI + Chart"   },
]

function ReportView({ metrics, insight, chartVariant }: DashboardTabsProps & { chartVariant: ChartCardVariant }) {
  return (
    <DashboardReportCharts
      metrics={metrics}
      insight={insight}
      chartVariant={chartVariant}
    />
  )
}

function SimpleView() {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <GreetingWidget />
        <TasksWidget />
        <InsightsWidget />
        <RecentActivityWidget />
      </div>
      {/* Full-bleed dark learn panel — no horizontal padding, card handles its own */}
      <div className="px-4 lg:px-6">
        <LearnSection />
      </div>
    </div>
  )
}

function MixView({ metrics, insight }: DashboardTabsProps) {
  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* Key metrics flat band */}
      <KeyMetrics variant="flat" metrics={metrics} insight={insight} />

      <div className="px-4 lg:px-6 flex flex-col gap-4">
        {/* Row: Greeting + Onboarding */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
          <div className="lg:col-span-2">
            <GreetingWidget />
          </div>
          <OnboardingWidget />
        </div>

        {/* Row: Tasks + Recent Activity */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-stretch">
          <TasksWidget />
          <RecentActivityWidget />
        </div>

        {/* Row: Insights */}
        <InsightsWidget />

        {/* Learn panel — full width */}
        <LearnSection />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
   COACH MARK FLOW — dashboard onboarding tour
   ════════════════════════════════════════════════════════════════════════════ */

const DASHBOARD_TOUR_STEPS = [
  {
    id: "tour-welcome",
    target: "h1",
    side: "bottom" as const,
    align: "start" as const,
    title: "Welcome to your Dashboard",
    description:
      "This is your command centre. See key metrics, charts, tasks and AI insights — all in one place.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=640&h=320&fit=crop&q=80",
    imageAlt: "Dashboard analytics overview",
  },
  {
    id: "tour-metrics",
    target: "[aria-label='Key Metrics']",
    side: "bottom" as const,
    align: "start" as const,
    title: "Key Metrics at a Glance",
    description:
      "Track pending requests, confirmed placements, compliance rate and more. Trends show how numbers changed since last period.",
  },
  {
    id: "tour-insights",
    target: "[aria-label='Insight']",
    side: "left" as const,
    align: "start" as const,
    title: "AI-Powered Insights",
    description:
      "Leo analyses your data and surfaces actionable insights automatically — no need to dig through reports.",
  },
  {
    id: "tour-askleo",
    target: "[aria-label='Ask Leo']",
    side: "bottom" as const,
    align: "end" as const,
    title: "Ask Leo Anything",
    description:
      "Click here or press ⌘⌥K to open Leo, your AI assistant. Ask questions about your data, get recommendations, or automate tasks.",
  },
]

/* ════════════════════════════════════════════════════════════════════════════
   Main export
   ════════════════════════════════════════════════════════════════════════════ */

export function DashboardTabs({
  metrics,
  insight: insightProp,
  title = "Dashboard",
  subtitle,
}: DashboardTabsProps) {
  const { chartVariant } = useChartVariant()
  const { activeView }   = useDashboardView()
  const { openWithPrompt } = useAskLeo()

  const insight = React.useMemo<MetricInsight>(() => {
    if (insightProp.onAction) return insightProp
    return {
      ...insightProp,
      onAction: () =>
        openWithPrompt(
          insightProp.description ?? insightProp.statement ?? insightProp.title,
        ),
    }
  }, [insightProp, openWithPrompt])

  const tour = useCoachMark({
    flowId: "dashboard-tour",
    steps: DASHBOARD_TOUR_STEPS,
    delay: 800,
  })

  const viewLabel =
    activeView === "report" ? "Report" : activeView === "simple" ? "Simple" : "Mix"

  useAskLeoPageContext(
    React.useMemo(
      () => ({
        title: "Dashboard",
        description: `${viewLabel} layout · ${metrics.length} KPI tiles on the strip.`,
        suggestions: [
          "What changed in my key metrics this week?",
          "Summarize the insight card for my stand-up",
          "Which metric should I watch for placement risk?",
        ],
      }),
      [viewLabel, metrics.length],
    ),
  )

  return (
    <div className="flex flex-col">
      {/* Coach mark tour — targets elements by CSS selector, no wrapping needed */}
      <CoachMark state={tour} />

      {/* Simple view: greeting IS the page header — no separate PageHeader */}
      {activeView !== "simple" && (
        <PageHeader title={title} subtitle={subtitle} className="pt-4 md:pt-6" />
      )}
      {activeView === "report" && <ReportView metrics={metrics} insight={insight} chartVariant={chartVariant} />}
      {activeView === "simple" && <SimpleView />}
      {activeView === "mix"    && <MixView metrics={metrics} insight={insight} />}
    </div>
  )
}
