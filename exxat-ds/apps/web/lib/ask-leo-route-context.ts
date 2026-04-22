/**
 * Route-derived defaults for Ask Leo when no page calls `useAskLeoPageContext`.
 * Keeps titles and starters aligned with primary nav (not raw URL segments).
 */

export interface AskLeoRouteContextPayload {
  title: string
  description?: string
  suggestions?: string[]
  data?: Record<string, unknown>
}

/** Fallback starters when a page provides no `suggestions`. */
export const ASK_LEO_GENERIC_SUGGESTIONS = [
  "Which students are at risk of non-compliance?",
  "Show me placements ending this month",
  "Summarize placement progress",
  "Compare this cycle vs. last cycle",
]

export function getAskLeoRouteContext(pathname: string | null): AskLeoRouteContextPayload {
  if (!pathname || pathname === "/") {
    return {
      title: "Dashboard",
      description: "Overview of metrics, charts, and AI insights.",
      suggestions: [
        "What changed in my key metrics this week?",
        "Summarize tasks and insights I should act on",
        "Explain the trend on the main placement chart",
      ],
    }
  }

  if (pathname.startsWith("/dashboard")) {
    return {
      title: "Dashboard",
      description: "Overview of metrics, charts, and AI insights.",
      suggestions: [
        "What changed in my key metrics this week?",
        "Summarize tasks and insights I should act on",
        "Which chart should I look at first for placement health?",
      ],
    }
  }

  if (pathname.startsWith("/data-list")) {
    return {
      title: "Placements",
      description: "List, filter, and export placement records — table, board, and dashboard views.",
      suggestions: [
        "Which placements end in the next 30 days?",
        "Summarize placements by site for this lifecycle tab",
        "What filters would narrow this list to at-risk students?",
      ],
    }
  }

  if (pathname.startsWith("/team")) {
    return {
      title: "Team",
      description: "Directory and workload for coordinators and faculty.",
      suggestions: [
        "Who owns the most active placements?",
        "Summarize team workload by program",
      ],
    }
  }

  if (pathname.startsWith("/compliance")) {
    return {
      title: "Compliance",
      description: "Compliance tracking and outstanding requirements.",
      suggestions: [
        "List items due this week",
        "Which students have outstanding compliance tasks?",
      ],
    }
  }

  if (pathname.startsWith("/question-bank")) {
    return {
      title: "Question bank",
      description: "Assessment and question library.",
      suggestions: [
        "Suggest questions for a clinical reasoning quiz",
        "How do I filter by difficulty or topic?",
      ],
    }
  }

  if (pathname.startsWith("/rotations")) {
    return {
      title: "Rotations",
      description: "Rotation schedules and capacity.",
      suggestions: [
        "Summarize rotation blocks for this term",
        "Which sites have open capacity?",
      ],
    }
  }

  if (pathname.startsWith("/settings")) {
    return {
      title: "Settings",
      description: "Appearance, banner, and guided tours for this browser.",
      suggestions: [
        "How do I reset onboarding tours?",
        "Where is high contrast configured?",
      ],
    }
  }

  if (pathname.startsWith("/help")) {
    return {
      title: "Get help",
      description: "Exxat Help Center and support resources.",
      suggestions: [
        "Where do I find training articles?",
        "How do I contact support?",
      ],
    }
  }

  const last = pathname.split("/").filter(Boolean).pop() ?? "this page"
  const title = last
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

  return {
    title,
    suggestions: ASK_LEO_GENERIC_SUGGESTIONS,
  }
}
