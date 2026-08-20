/**
 * Route-derived defaults for Ask Leo when no page calls `useAskLeoPageContext`.
 * Copy stays generic for the design-system shell.
 */

export interface AskLeoRouteContextPayload {
  title: string
  description?: string
  suggestions?: string[]
  data?: Record<string, unknown>
}

/** Fallback starters when a page provides no `suggestions`. */
export const ASK_LEO_GENERIC_SUGGESTIONS = [
  "How do I meet WCAG 2.1 AA for tables and dialogs?",
  "Explain how semantic tokens map to components",
  "What belongs on a ListPageTemplate hub?",
  "How should charts expose keyboard exploration?",
]

export function getAskLeoRouteContext(pathname: string | null): AskLeoRouteContextPayload {
  if (!pathname || pathname === "/") {
    return {
      title: "Dashboard",
      description: "Overview of metrics, charts, and layout patterns.",
      suggestions: [
        "What changed in the headline metrics this week?",
        "Summarize the dashboard layout for a stakeholder",
        "Which chart should I inspect first for anomalies?",
      ],
    }
  }

  if (pathname.startsWith("/dashboard")) {
    return {
      title: "Dashboard",
      description: "Overview of metrics, charts, and layout patterns.",
      suggestions: [
        "What changed in the headline metrics this week?",
        "Summarize the dashboard layout for a stakeholder",
        "Which chart should I inspect first for anomalies?",
      ],
    }
  }

  if (pathname.startsWith("/data-list")) {
    return {
      title: "List hub",
      description: "Demo list with table, list, board, and dashboard views sharing one table state.",
      suggestions: [
        "How do filters and search interact with board and dashboard tabs?",
        "Summarize what is shown in the active view",
        "What columns are useful for a dense data grid?",
      ],
    }
  }

  if (pathname.startsWith("/examples")) {
    return {
      title: "Patterns",
      description: "Entry points for reusable shells and demos.",
      suggestions: [
        "Where is the list hub implemented?",
        "How is the command palette wired?",
        "What is the sidebar + content layout pattern?",
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

  if (pathname.startsWith("/question-bank/library") || pathname.startsWith("/question-bank/list") || pathname.startsWith("/question-bank/find")) {
    return {
      title: "Question library",
      description: "Browse folders, views, and mock assessment items.",
      suggestions: [
        "Summarize questions in the active folder scope",
        "Suggest folders for a new pediatrics module",
        "How do panel and tree views relate to the same dataset?",
      ],
    }
  }

  if (pathname.startsWith("/question-bank")) {
    return {
      title: "Question bank",
      description: "Search in plain language, draft items with AI, or open the full library.",
      suggestions: [
        "Draft a multiple-choice question on clinical reasoning",
        "Outline a new question bank for a course module",
        "Rewrite this stem for clarity and bias-free wording",
      ],
    }
  }

  if (pathname.startsWith("/help")) {
    return {
      title: "Get help",
      description: "Support and documentation entry points.",
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
