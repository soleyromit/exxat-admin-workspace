"use client";

import * as React from "react";
import { X, ArrowUp, ChevronRight, Users, FileText, Calendar, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  Sidebar,
  SidebarHeader,
} from "../ui/sidebar";
import Leo from "../../imports/Leo-68-134";
import { useAppStore } from "../../stores/app-store";

// ─── Entity Types & Mock Data ────────────────────────────────────────────────

type EntityType = "students" | "requests" | "schedules" | "slots";

interface EntityRecord {
  id: string;
  name: string;
  detail: string;
  status: string;
  statusColor: string;
  date: string;
}

// Mock data generators keyed by entity filter
const entityData: Record<string, { records: EntityRecord[]; total: number; page: string; pageLabel: string }> = {
  "students-not-started": {
    total: 211,
    page: "My Students",
    pageLabel: "My Students",
    records: [
      { id: "STU-1401", name: "Sarah Chen", detail: "Nursing BSN • Cohort 2026", status: "Not Started", statusColor: "text-destructive", date: "01/08/2026" },
      { id: "STU-1402", name: "Marcus Johnson", detail: "Physical Therapy DPT • Cohort 2026", status: "Not Started", statusColor: "text-destructive", date: "01/10/2026" },
      { id: "STU-1403", name: "Priya Patel", detail: "Nursing BSN • Cohort 2026", status: "Not Started", statusColor: "text-destructive", date: "01/12/2026" },
      { id: "STU-1404", name: "James Rivera", detail: "Radiology Tech • Cohort 2026", status: "Not Started", statusColor: "text-destructive", date: "01/14/2026" },
      { id: "STU-1405", name: "Emily Nguyen", detail: "Nursing MSN • Cohort 2026", status: "Not Started", statusColor: "text-destructive", date: "01/15/2026" },
    ],
  },
  "students-expired": {
    total: 92,
    page: "My Students",
    pageLabel: "My Students",
    records: [
      { id: "STU-0892", name: "David Kim", detail: "Nursing BSN • Cohort 2025", status: "Expired", statusColor: "text-destructive", date: "12/15/2025" },
      { id: "STU-0901", name: "Aisha Williams", detail: "Physical Therapy DPT • Cohort 2025", status: "Expired", statusColor: "text-destructive", date: "12/20/2025" },
      { id: "STU-0915", name: "Carlos Mendez", detail: "Respiratory Therapy • Cohort 2025", status: "Expired", statusColor: "text-destructive", date: "12/22/2025" },
      { id: "STU-0923", name: "Rachel Thompson", detail: "Nursing BSN • Cohort 2025", status: "Expired", statusColor: "text-destructive", date: "12/28/2025" },
      { id: "STU-0930", name: "Omar Hassan", detail: "Physician Assistant • Cohort 2025", status: "Expired", statusColor: "text-destructive", date: "01/02/2026" },
    ],
  },
  "students-pending": {
    total: 186,
    page: "My Students",
    pageLabel: "My Students",
    records: [
      { id: "STU-1101", name: "Jessica Liu", detail: "Nursing BSN • Cohort 2026", status: "Pending Docs", statusColor: "text-chart-4", date: "01/20/2026" },
      { id: "STU-1108", name: "Tyler Brooks", detail: "Physical Therapy DPT • Cohort 2026", status: "Pending Docs", statusColor: "text-chart-4", date: "01/22/2026" },
      { id: "STU-1115", name: "Fatima Al-Rashid", detail: "Nursing MSN • Cohort 2026", status: "Pending Docs", statusColor: "text-chart-4", date: "01/24/2026" },
      { id: "STU-1123", name: "Brandon Park", detail: "Radiology Tech • Cohort 2026", status: "Pending Docs", statusColor: "text-chart-4", date: "01/25/2026" },
      { id: "STU-1130", name: "Maria Santos", detail: "Physician Assistant • Cohort 2026", status: "Pending Docs", statusColor: "text-chart-4", date: "01/27/2026" },
    ],
  },
  "requests-overdue-16": {
    total: 246,
    page: "Slots",
    pageLabel: "Slots",
    records: [
      { id: "REQ-2045", name: "Mayo Clinic — Internal Medicine", detail: "3 slots requested by Springfield School of Nursing", status: "16+ days", statusColor: "text-chart-4", date: "01/15/2026" },
      { id: "REQ-2038", name: "Cleveland Clinic — Pediatrics", detail: "2 slots requested by Lake Erie Allied Health", status: "22 days", statusColor: "text-chart-4", date: "01/08/2026" },
      { id: "REQ-2031", name: "Johns Hopkins — Emergency Med", detail: "4 slots requested by Baltimore School of Nursing", status: "25 days", statusColor: "text-destructive", date: "01/05/2026" },
      { id: "REQ-2024", name: "Mass General — Surgery", detail: "1 slot requested by Boston Health Sciences", status: "28 days", statusColor: "text-destructive", date: "01/02/2026" },
      { id: "REQ-2019", name: "UCSF Medical — Psychiatry", detail: "2 slots requested by Pacific Nursing Academy", status: "30+ days", statusColor: "text-destructive", date: "12/28/2025" },
    ],
  },
  "requests-overdue-30": {
    total: 123,
    page: "Slots",
    pageLabel: "Slots",
    records: [
      { id: "REQ-1945", name: "Stanford Health — Cardiology", detail: "2 slots requested by Bay Area School of Nursing", status: "35 days", statusColor: "text-destructive", date: "12/20/2025" },
      { id: "REQ-1938", name: "Mount Sinai — Oncology", detail: "3 slots requested by NYC Health Sciences", status: "38 days", statusColor: "text-destructive", date: "12/17/2025" },
      { id: "REQ-1929", name: "Duke University — Neurology", detail: "1 slot requested by Carolina Allied Health", status: "42 days", statusColor: "text-destructive", date: "12/13/2025" },
      { id: "REQ-1920", name: "Cedars-Sinai — Orthopedics", detail: "2 slots requested by LA Nursing Academy", status: "45 days", statusColor: "text-destructive", date: "12/10/2025" },
      { id: "REQ-1912", name: "NYU Langone — Family Medicine", detail: "4 slots requested by Empire State School of Nursing", status: "48 days", statusColor: "text-destructive", date: "12/07/2025" },
    ],
  },
  "schedules-unscheduled": {
    total: 11,
    page: "Student Schedule",
    pageLabel: "Student Schedule",
    records: [
      { id: "SCH-3001", name: "Emily Watson — Internal Medicine", detail: "Mayo Clinic, Rochester MN", status: "To Be Scheduled", statusColor: "text-chart-4", date: "02/15/2026" },
      { id: "SCH-3002", name: "Michael Torres — Pediatrics", detail: "Children's Hospital, Philadelphia PA", status: "To Be Scheduled", statusColor: "text-chart-4", date: "02/18/2026" },
      { id: "SCH-3003", name: "Ashley Greene — Surgery", detail: "Johns Hopkins, Baltimore MD", status: "To Be Scheduled", statusColor: "text-chart-4", date: "02/20/2026" },
      { id: "SCH-3004", name: "Ryan O'Brien — Emergency Med", detail: "Mass General, Boston MA", status: "To Be Scheduled", statusColor: "text-chart-4", date: "02/22/2026" },
      { id: "SCH-3005", name: "Sophia Yamamoto — Psychiatry", detail: "UCSF Medical Center, San Francisco CA", status: "To Be Scheduled", statusColor: "text-chart-4", date: "02/25/2026" },
    ],
  },
  "schedules-pending-30": {
    total: 5,
    page: "Student Schedule",
    pageLabel: "Student Schedule",
    records: [
      { id: "SCH-2801", name: "Noah Mitchell — Radiology", detail: "UCLA Medical, Los Angeles CA", status: "Pending 32 days", statusColor: "text-destructive", date: "12/22/2025" },
      { id: "SCH-2802", name: "Isabella Cruz — OB/GYN", detail: "Northwestern Memorial, Chicago IL", status: "Pending 35 days", statusColor: "text-destructive", date: "12/19/2025" },
      { id: "SCH-2803", name: "Ethan Park — Anesthesiology", detail: "Cleveland Clinic, Cleveland OH", status: "Pending 38 days", statusColor: "text-destructive", date: "12/16/2025" },
      { id: "SCH-2804", name: "Olivia Bennett — Dermatology", detail: "Stanford Health, Palo Alto CA", status: "Pending 40 days", statusColor: "text-destructive", date: "12/14/2025" },
      { id: "SCH-2805", name: "Liam Foster — Pathology", detail: "Mount Sinai, New York NY", status: "Pending 44 days", statusColor: "text-destructive", date: "12/10/2025" },
    ],
  },
};

// ─── Entity Reference Markup ─────────────────────────────────────────────────
// Format: [[label|entity_key]] — entity_key maps to entityData above

// ─── Inline Entity List Component ────────────────────────────────────────────
// Shows when user clicks an entity chip inside a Leo response

function EntityList({
  entityKey,
  label,
  onNavigate,
}: {
  entityKey: string;
  label: string;
  onNavigate: (page: string) => void;
}) {
  const data = entityData[entityKey];
  if (!data) return null;

  const iconMap: Record<string, React.ReactNode> = {
    students: <Users className="h-3.5 w-3.5" />,
    requests: <FileText className="h-3.5 w-3.5" />,
    schedules: <Calendar className="h-3.5 w-3.5" />,
    slots: <FileText className="h-3.5 w-3.5" />,
  };
  const entityType = entityKey.split("-")[0] as EntityType;

  return (
    <div className="mt-2 rounded-lg border border-border bg-card overflow-hidden animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border bg-muted/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          {iconMap[entityType]}
          <span>{label}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Showing 5 of {data.total}
        </span>
      </div>

      {/* Records */}
      <div className="divide-y divide-border">
        {data.records.map((record) => (
          <button
            key={record.id}
            className="w-full text-left px-3 py-2 hover:bg-accent/50 transition-colors group cursor-pointer"
            onClick={() => onNavigate(data.page)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-foreground truncate">
                  {record.name}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {record.detail}
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className={`text-xs font-medium ${record.statusColor}`}>
                  {record.status}
                </span>
                <span className="text-xs text-muted-foreground">{record.date}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <button
        className="w-full px-3 py-2 border-t border-border bg-muted/30 flex items-center justify-center gap-1.5 text-xs font-medium text-chart-1 hover:text-chart-1/80 hover:bg-accent/50 transition-colors cursor-pointer"
        onClick={() => onNavigate(data.page)}
      >
        <span>View all {data.total} in {data.pageLabel}</span>
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Rich Text Renderer ──────────────────────────────────────────────────────
// Parses bold, newlines, and [[label|entity_key]] chips

function RichMessageContent({
  content,
  expandedEntities,
  onToggleEntity,
  onNavigate,
}: {
  content: string;
  expandedEntities: Set<string>;
  onToggleEntity: (key: string, label: string) => void;
  onNavigate: (page: string) => void;
}) {
  // Split by entity refs [[label|key]], bold **text**, and newlines
  const parts = content.split(/(\[\[[^\]]+\]\]|\*\*[^*]+\*\*|\n)/);

  return (
    <>
      {parts.map((part, i) => {
        // Entity reference: [[label|entity_key]]
        if (part.startsWith("[[") && part.endsWith("]]")) {
          const inner = part.slice(2, -2);
          const pipeIdx = inner.indexOf("|");
          const label = pipeIdx !== -1 ? inner.slice(0, pipeIdx) : inner;
          const entityKey = pipeIdx !== -1 ? inner.slice(pipeIdx + 1) : "";
          const isExpanded = expandedEntities.has(entityKey);

          return (
            <React.Fragment key={i}>
              <button
                onClick={() => onToggleEntity(entityKey, label)}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer
                  ${isExpanded
                    ? "bg-chart-1/15 text-chart-1 ring-1 ring-chart-1/30"
                    : "bg-chart-1/10 text-chart-1 hover:bg-chart-1/20"
                  }`}
              >
                {label}
                <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
              </button>
              {isExpanded && (
                <EntityList
                  entityKey={entityKey}
                  label={label}
                  onNavigate={onNavigate}
                />
              )}
            </React.Fragment>
          );
        }
        // Bold text
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        // Newline
        if (part === "\n") {
          return <br key={i} />;
        }
        // Regular text
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Streaming Text Component ────────────────────────────────────────────────
// Reveals text word-by-word, renders entity chips as they appear

function StreamingText({
  content,
  speed = 30,
  onComplete,
  onWordReveal,
  expandedEntities,
  onToggleEntity,
  onNavigate,
}: {
  content: string;
  speed?: number;
  onComplete?: () => void;
  onWordReveal?: () => void;
  expandedEntities: Set<string>;
  onToggleEntity: (key: string, label: string) => void;
  onNavigate: (page: string) => void;
}) {
  const [visibleCount, setVisibleCount] = React.useState(0);
  const words = React.useMemo(() => content.split(/(\s+)/), [content]);
  const completedRef = React.useRef(false);

  React.useEffect(() => {
    setVisibleCount(0);
    completedRef.current = false;
  }, [content]);

  React.useEffect(() => {
    if (visibleCount >= words.length) {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete?.();
      }
      return;
    }
    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
      onWordReveal?.();
    }, speed);
    return () => clearTimeout(timer);
  }, [visibleCount, words.length, speed, onComplete, onWordReveal]);

  const visibleText = words.slice(0, visibleCount).join("");

  return (
    <>
      <RichMessageContent
        content={visibleText}
        expandedEntities={expandedEntities}
        onToggleEntity={onToggleEntity}
        onNavigate={onNavigate}
      />
      {visibleCount < words.length && (
        <span className="inline-block w-1.5 h-4 bg-foreground/60 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
      )}
    </>
  );
}

// ─── Generate structured chart analysis with entity refs ─────────────────────

function generateChartAnalysis(query: string, pageContext: string): string {
  const titleMatch = query.match(/Analyze the "([^"]+)" chart/);
  const chartTitle = titleMatch ? titleMatch[1] : null;

  const insightMatch = query.match(/Analyze the insight: "([^"]+)" — (.+?)(?:\. Provide|$)/);

  if (insightMatch) {
    const insightTitle = insightMatch[1];
    const insightDesc = insightMatch[2];

    let response = `📋 **Insight Deep Dive: ${insightTitle}**\n\n`;
    response += `**Summary**\n${insightDesc}\n\n`;
    response += `**⚠️ Related Concerns**\n`;
    response += `1. If this issue persists without intervention, it could cascade into delayed placements and reduced site partner satisfaction.\n`;
    response += `2. Similar patterns in previous semesters led to a 12% drop in on-time placement rates when not addressed within 2 weeks.\n\n`;
    response += `**💡 Recommended Actions**\n`;
    response += `1. Set up automated alerts to flag items approaching the threshold so your team is notified early.\n`;
    response += `2. Consider batch-processing the backlog — grouping similar items can reduce per-item review time by ~40%.\n`;
    response += `3. Schedule a brief standup with your team to distribute the workload and set clear ownership for each pending item.\n`;

    return response;
  }

  const displayTitle = chartTitle || "this chart";
  const dataMatch = query.match(/Data: (.+?)\. Provide/);
  const rawData = dataMatch ? dataMatch[1] : "";

  const analyses: Record<string, { summary: string; issues: string[]; insights: string[] }> = {
    "Schedule Pipeline Overview": {
      summary: "The schedule pipeline shows [[11 schedules|schedules-unscheduled]] in \"To Be Scheduled\" status with only 2 confirmed. No schedules are currently in \"Not Confirmed\" or \"Cancelled\" states.",
      issues: [
        "High backlog: 85% of schedules ([[11 schedules|schedules-unscheduled]]) are still unscheduled — this could delay student placements.",
        "Low confirmation rate: Only 15% of schedules have been confirmed, suggesting a bottleneck in the approval workflow.",
      ],
      insights: [
        "Consider prioritizing the [[11 schedules|schedules-unscheduled]] by urgency or start date to clear the backlog.",
        "The zero cancellation rate is positive — once schedules enter the pipeline, they are being retained.",
        "Setting up automated reminders for pending confirmations could improve the confirmation rate.",
      ],
    },
    "Student Onboarding Overview": {
      summary: "Out of 1,234 total students, 745 (60%) are compliant, [[186 students|students-pending]] have pending documents, [[92 students|students-expired]] have expired credentials, and [[211 students|students-not-started]] haven't started onboarding.",
      issues: [
        "[[92 students|students-expired]] have expired credentials — these students cannot be placed until renewed. This needs immediate attention.",
        "[[211 students|students-not-started]] (17%) haven't started onboarding at all, which could impact upcoming placement cycles.",
        "Combined non-compliant rate is 40%, which is high for this point in the semester.",
      ],
      insights: [
        "Focus outreach on the [[186 students|students-pending]] with pending documents — they are closest to compliance and represent a quick win.",
        "Consider implementing deadline reminders for the [[92 students|students-expired]] with expired credentials.",
        "The 60% compliance rate suggests the onboarding process may need streamlining or better communication.",
      ],
    },
    "Requests Pending Approval": {
      summary: "There are 486 total pending requests. 142 are under 7 days old, 98 are 7-15 days, and [[246 requests|requests-overdue-16]] (51%) have been pending over 16 days.",
      issues: [
        "[[246 requests|requests-overdue-16]] (51%) are older than 16 days — this exceeds the recommended 10-day SLA for approval turnaround.",
        "[[123 requests|requests-overdue-30]] are over 30 days old — these are critically overdue and risk site partner dissatisfaction.",
      ],
      insights: [
        "The aging distribution suggests requests are entering the pipeline faster than they are being approved.",
        "Prioritize the [[123 requests|requests-overdue-30]] over 30 days to prevent relationship damage with site partners.",
        "Consider adding approval workflow automation or distributing the review workload across more approvers.",
      ],
    },
    "Schedules Pending Confirmation": {
      summary: "56 schedules await confirmation. 28 are under 7 days, 15 are 7-15 days, 8 are 16-30 days, and [[5 schedules|schedules-pending-30]] are over 30 days old.",
      issues: [
        "[[5 schedules|schedules-pending-30]] have been pending over 30 days — these may need direct follow-up with the site partners.",
        "The confirmation pipeline is healthier than requests, but 23% of items are over 16 days.",
      ],
      insights: [
        "The majority (50%) of pending confirmations are under 7 days, indicating a generally responsive process.",
        "Consider automated email reminders at the 7-day and 14-day marks to nudge pending confirmations.",
        "The low volume of aged items suggests the confirmation bottleneck is manageable with targeted follow-up.",
      ],
    },
    "Placement Trends": {
      summary: "Student placement activity has shown steady growth over the current semester with seasonal peaks during clinical rotation start dates.",
      issues: [
        "Some placement categories may be underrepresented in the current data, limiting trend accuracy.",
      ],
      insights: [
        "Placement volume typically peaks at semester start — plan capacity accordingly.",
        "Tracking trends by specialization could reveal which departments need more site partnerships.",
        "Compare current semester trends with historical data to forecast upcoming demand.",
      ],
    },
    "Top Specializations": {
      summary: "Internal Medicine leads at 87%, followed by Emergency Medicine (76%), Pediatrics (65%), Surgery (58%), and Psychiatry (43%).",
      issues: [
        "Psychiatry has the lowest request rate at 43% — this could indicate insufficient available sites or low student interest.",
        "High demand for Internal Medicine (87%) could strain available placement sites.",
      ],
      insights: [
        "Expand site partnerships for Internal Medicine and Emergency Medicine to meet high demand.",
        "Psychiatry's lower percentage may present an opportunity to increase student awareness of career paths.",
        "The top 3 specializations account for the majority of requests — focus partnership development here for maximum impact.",
      ],
    },
    "Interactive Analytics Dashboard": {
      summary: "The interactive dashboard shows healthcare placement volumes across multiple locations and disciplines with completed, active, and pending breakdowns.",
      issues: [
        "Monitor locations with high pending-to-active ratios — they may have approval bottlenecks.",
      ],
      insights: [
        "Use the location and discipline filters to identify which areas need the most support.",
        "Compare completed vs. pending ratios across locations to spot high-performing and lagging sites.",
        "Trend data can help predict future placement needs for resource planning.",
      ],
    },
  };

  const analysis = analyses[displayTitle] || {
    summary: `The "${displayTitle}" data shows the current state of this metric on the ${pageContext} page.${rawData ? ` Current data: ${rawData}.` : ""}`,
    issues: [
      "Review the data for any trends that deviate from expected benchmarks.",
      "Check if any values are outside acceptable thresholds for your program.",
    ],
    insights: [
      "Compare this data with previous periods to identify meaningful trends.",
      "Consider correlating this metric with related KPIs for deeper analysis.",
      "Set up alerts for when key thresholds are exceeded.",
    ],
  };

  let response = `📊 **${displayTitle} Analysis**\n\n`;
  response += `**Summary**\n${analysis.summary}\n\n`;
  response += `**⚠️ Issues & Concerns**\n`;
  analysis.issues.forEach((issue, i) => {
    response += `${i + 1}. ${issue}\n`;
  });
  response += `\n**💡 Key Insights**\n`;
  analysis.insights.forEach((insight, i) => {
    response += `${i + 1}. ${insight}\n`;
  });

  return response;
}

// ─── Leo Panel Component ─────────────────────────────────────────────────────

interface LeoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pageContext: string;
}

export function LeoPanel({
  isOpen,
  onClose,
  pageContext,
}: LeoPanelProps) {
  const [messages, setMessages] = React.useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([
    {
      role: "assistant",
      content: `Hi! I'm Leo, your AI assistant. I can see you're on the ${pageContext} page. How can I help you today?`,
    },
  ]);
  const [inputValue, setInputValue] = React.useState("");
  const [streamingIndex, setStreamingIndex] = React.useState<number | null>(null);
  const [expandedEntities, setExpandedEntities] = React.useState<Set<string>>(new Set());
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const previousMessageCountRef = React.useRef(0);
  const leoInitialQuery = useAppStore((state) => state.leoInitialQuery);
  const setLeoInitialQuery = useAppStore((state) => state.setLeoInitialQuery);
  const navigateToPage = useAppStore((state) => state.navigateToPage);
  const processedQueryRef = React.useRef<string | null>(null);
  const pendingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toggle entity expansion
  const handleToggleEntity = React.useCallback((key: string, _label: string) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    // Scroll after expansion to keep content visible
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 250);
  }, []);

  // Navigate to a page from entity list
  const handleEntityNavigate = React.useCallback((page: string) => {
    navigateToPage(page);
    onClose();
  }, [navigateToPage, onClose]);

  // Update the initial message when page context changes
  React.useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          role: "assistant",
          content: `Hi! I'm Leo, your AI assistant. I can see you're on the ${pageContext} page. How can I help you today?`,
        },
      ]);
      previousMessageCountRef.current = 1;
      processedQueryRef.current = null;
      setExpandedEntities(new Set());
    }
  }, [pageContext, isOpen]);

  // Handle initial query from Ask Leo buttons / global search bar
  React.useEffect(() => {
    if (isOpen && leoInitialQuery && leoInitialQuery !== processedQueryRef.current) {
      const query = leoInitialQuery;
      processedQueryRef.current = query;
      setLeoInitialQuery("");

      const labelMatch = query.match(/Analyze the "([^"]+)" chart/);
      const insightLabelMatch = query.match(/Analyze the insight: "([^"]+)"/);
      const userLabel = labelMatch
        ? `Analyze "${labelMatch[1]}"`
        : insightLabelMatch
        ? `Tell me more about "${insightLabelMatch[1]}"`
        : query.length > 80 ? query.slice(0, 77) + "…" : query;

      setMessages((prev) => [
        ...prev,
        { role: "user" as const, content: userLabel },
      ]);

      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(() => {
        pendingTimerRef.current = null;
        setMessages((prev) => {
          const newIndex = prev.length;
          setStreamingIndex(newIndex);
          return [
            ...prev,
            {
              role: "assistant" as const,
              content: generateChartAnalysis(query, pageContext),
            },
          ];
        });
      }, 600);
    }
  }, [isOpen, leoInitialQuery, pageContext, setLeoInitialQuery]);

  // Cleanup ref timer on unmount
  React.useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    };
  }, []);

  // Auto-scroll to bottom only when new messages are added
  React.useEffect(() => {
    if (
      messages.length > previousMessageCountRef.current &&
      messages.length > 1
    ) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
    previousMessageCountRef.current = messages.length;
  }, [messages]);

  // Auto-scroll callback for streaming
  const handleStreamScroll = React.useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const assistantIndex = messages.length + 1;
    setStreamingIndex(assistantIndex);

    const newMessages = [
      ...messages,
      { role: "user" as const, content: inputValue },
      {
        role: "assistant" as const,
        content: generateChartAnalysis(inputValue, pageContext),
      },
    ];

    setMessages(newMessages);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <Sidebar
      collapsible="none"
      className="w-[320px] md:flex flex-col relative h-screen"
      data-leo-panel={isOpen ? "open" : "closed"}
    >
      <SidebarHeader className="gap-3.5 border-b border-border p-4 flex-shrink-0">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
              <div className="h-5 w-5 flex items-center justify-center text-primary-foreground">
                <Leo />
              </div>
            </div>
            <div>
              <div className="font-medium text-foreground">
                Leo AI Assistant
              </div>
              <div className="text-xs text-muted-foreground">
                Context: {pageContext}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close Leo AI</span>
          </Button>
        </div>
      </SidebarHeader>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto px-4 pt-4 space-y-4"
        style={{ paddingBottom: "180px" }}
        ref={scrollContainerRef}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-3 ${
              message.role === "user"
                ? "justify-end"
                : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="h-8 w-8 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                <div className="h-4 w-4 flex items-center justify-center text-primary-foreground">
                  <Leo />
                </div>
              </div>
            )}
            {message.role === "user" ? (
              <div className="rounded-lg p-3 max-w-[240px] bg-primary text-primary-foreground">
                <div className="text-sm leading-relaxed whitespace-pre-line">
                  {message.content}
                </div>
              </div>
            ) : (
              <div className="max-w-[240px] py-1">
                <div className="text-sm leading-relaxed text-foreground">
                  {index === streamingIndex ? (
                    <StreamingText
                      content={message.content}
                      speed={25}
                      onComplete={() => setStreamingIndex(null)}
                      onWordReveal={handleStreamScroll}
                      expandedEntities={expandedEntities}
                      onToggleEntity={handleToggleEntity}
                      onNavigate={handleEntityNavigate}
                    />
                  ) : (
                    <RichMessageContent
                      content={message.content}
                      expandedEntities={expandedEntities}
                      onToggleEntity={handleToggleEntity}
                      onNavigate={handleEntityNavigate}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Chat Input */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[80px] max-h-[120px] resize-none border border-border rounded-lg p-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary bg-background"
            />
            <Button
              size="sm"
              className="absolute bottom-2 right-2 h-8 w-8 p-0 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
              disabled={!inputValue.trim()}
              onClick={handleSend}
            >
              <ArrowUp className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground px-1">
            Leo has context of your current page and can help
            with tasks specific to {pageContext}.
          </p>
        </div>
      </div>
    </Sidebar>
  );
}
