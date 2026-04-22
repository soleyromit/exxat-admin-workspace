/**
 * Command palette (⌘K) — types, static groups, and `buildCommandMenuConfig()`.
 * Optional **`dataGroups`** can be passed from the app shell when you want searchable row data.
 */

export type CommandMenuItem = {
  id: string
  label: string
  /** cmdk filter keywords */
  keywords?: string
  /** Font Awesome classes for link rows */
  icon?: string
  /** Navigate to this in-app route */
  href?: string
  /** If set, opens Ask Leo with this prompt (no navigation) */
  askLeoPrompt?: string
}

export type CommandMenuGroup = {
  id: string
  heading: string
  items: CommandMenuItem[]
  /**
   * When true, this group is not rendered until the user types a non-empty search.
   * Use for large row indexes (e.g. placements) so the palette does not list every record on open.
   */
  searchOnly?: boolean
}

export type CommandMenuConfig = {
  /** cmdk accessible name */
  commandLabel: string
  dialogTitle: string
  dialogDescription: string
  inputPlaceholder: string
  inputAriaLabel: string
  emptyMessage: string
  closeMenuAriaLabel: string
  groups: CommandMenuGroup[]
}

const COMMAND_MENU_SHELL: Omit<CommandMenuConfig, "groups"> = {
  commandLabel: "Command menu",
  dialogTitle: "Search",
  dialogDescription:
    "Search pages and components, or use AI suggestions. Use arrow keys to move through results, Enter to open, Escape to close.",
  inputPlaceholder: "Search or ask Leo anything…",
  inputAriaLabel: "Search pages, components, or ask Leo",
  emptyMessage: "No results found.",
  closeMenuAriaLabel: "Close command menu",
}

/** AI prompts, navigation, library, and patterns — fixed product chrome (not row data). */
const STATIC_COMMAND_GROUPS: CommandMenuGroup[] = [
  {
    id: "ai",
    heading: "AI suggestions",
    items: [
      {
        id: "ai-compliance",
        label: "Which students are at risk of non-compliance?",
        keywords: "leo ai assistant compliance students risk",
        askLeoPrompt: "Which students are at risk of non-compliance?",
      },
      {
        id: "ai-placements-month",
        label: "Show me placements ending this month",
        keywords: "leo ai placements calendar month",
        askLeoPrompt: "Show me placements ending this month",
      },
      {
        id: "ai-summarize",
        label: "Summarize placement progress",
        keywords: "leo ai summary placements progress",
        askLeoPrompt: "Summarize placement progress",
      },
      {
        id: "ai-compare-cycle",
        label: "Compare this cycle vs. last cycle",
        keywords: "leo ai compare cycle trend",
        askLeoPrompt: "Compare this cycle vs. last cycle",
      },
    ],
  },
  {
    id: "navigation",
    heading: "Navigation",
    items: [
      { id: "nav-dashboard", icon: "fa-light fa-grid-2", label: "Dashboard", href: "/dashboard" },
      {
        id: "nav-question-bank",
        icon: "fa-light fa-books",
        label: "Question bank",
        href: "/question-bank",
        keywords: "assessment items exam quiz",
      },
      { id: "nav-placements", icon: "fa-light fa-user-graduate", label: "Placements", href: "/data-list" },
      { id: "nav-rotations", icon: "fa-light fa-arrows-rotate", label: "Rotations", href: "/rotations" },
      { id: "nav-team", icon: "fa-light fa-users", label: "Team", href: "/team" },
      { id: "nav-compliance", icon: "fa-light fa-shield-check", label: "Compliance", href: "/compliance" },
      { id: "nav-settings", icon: "fa-light fa-gear", label: "Settings", href: "/settings" },
    ],
  },
]

export type BuildCommandMenuConfigOptions = {
  /**
   * Searchable row groups from your data layer (mock or API). Omitted or empty = no data rows.
   * Order: inserted after AI suggestions, before Navigation / Components / Patterns.
   */
  dataGroups?: CommandMenuGroup[]
}

/**
 * Merge shell copy + static product groups with optional **`dataGroups`** from the app.
 */
export function buildCommandMenuConfig(
  options: BuildCommandMenuConfigOptions = {},
): CommandMenuConfig {
  const { dataGroups = [] } = options
  const [aiGroup, ...staticRest] = STATIC_COMMAND_GROUPS

  return {
    ...COMMAND_MENU_SHELL,
    groups: [aiGroup, ...dataGroups, ...staticRest],
  }
}
