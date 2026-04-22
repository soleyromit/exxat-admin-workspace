// ─────────────────────────────────────────────────────────────────────────────
// Mock data — Navigation
// Uses .tsx because icons are JSX (<i> elements).
// ─────────────────────────────────────────────────────────────────────────────

import type * as React from "react"

import { logoDevUrl } from "@/lib/logo-dev"
import { stockPortraitUrl } from "@/lib/stock-portrait"

// ── Types ─────────────────────────────────────────────────────────────────────

/** Flat sidebar link (screenshot: primary + Documents + utilities) */
export interface NavLinkItem {
  key: string
  title: string
  url: string
  icon: React.ReactNode
  iconActive?: React.ReactNode
  /** Optional child links — renders as a collapsible sub-menu */
  children?: NavLinkItem[]
  /** Optional inline badge — count (number) or label text (string).
   *  Special string values get distinct colors:
   *  "New" → green,  "Beta" → amber,  other strings → brand/primary  */
  badge?: number | string
  /**
   * When this collapsible section uses `SecondaryPanel`, set the panel id so
   * child links can reopen the panel on click while already on the same route
   * (Next.js Link does not navigate on same href).
   */
  secondaryPanel?: string
  /**
   * When several children share the same `url` (hub route), only this child’s
   * key receives `data-active` for that pathname — otherwise every sub-row
   * looks selected (same issue as duplicate `href` in any nav).
   */
  primaryHubChildKey?: string
}

// ── Team / school switcher mock data ─────────────────────────────────────────

export interface NavProgram { id: string; name: string }
export interface NavSchool {
  id: string
  name: string
  /** URL of school logo — used as the avatar image */
  logo: string
  /** Two-letter abbreviation shown as AvatarFallback */
  initials: string
  programs: NavProgram[]
}

export const NAV_SCHOOLS: NavSchool[] = [
  {
    id: "jhu",
    name: "Johns Hopkins University",
    logo: logoDevUrl("jhu.edu"),
    initials: "JH",
    programs: [
      { id: "som", name: "School of Medicine" },
      { id: "son", name: "School of Nursing" },
      { id: "sph", name: "Bloomberg School of Public Health" },
    ],
  },
  {
    id: "mayo",
    name: "Mayo Clinic Alix School of Medicine",
    logo: logoDevUrl("mayoclinic.org"),
    initials: "MC",
    programs: [
      { id: "md", name: "Doctor of Medicine" },
      { id: "bms", name: "Biomedical Sciences" },
    ],
  },
]

export const NAV_SCHOOL_DEFAULT = NAV_SCHOOLS[0]
export const NAV_PROGRAM_DEFAULT = NAV_SCHOOLS[0].programs[0]

// ── Primary navigation ────────────────────────────────────────────────────────

export const NAV_PRIMARY: NavLinkItem[] = [
  {
    key: "dashboard",
    title: "Dashboard",
    url: "/dashboard",
    icon:       <i className="fa-light fa-grid-2" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-grid-2" aria-hidden="true" />,
  },
  {
    key: "question-bank",
    title: "Question bank",
    url: "/question-bank",
    icon:       <i className="fa-light fa-books" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-books" aria-hidden="true" />,
  },
  {
    key: "analytics",
    title: "Analytics",
    url: "#",
    icon:       <i className="fa-light fa-chart-line" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-chart-line" aria-hidden="true" />,
    badge: "New",
  },
  {
    key: "data-list",
    title: "Placements",
    url: "/data-list",
    icon:       <i className="fa-light fa-user-graduate" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-user-graduate" aria-hidden="true" />,
    badge: 24,
  },
  {
    key: "rotations",
    title: "Rotations",
    url: "/rotations",
    icon:       <i className="fa-light fa-arrows-rotate" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-arrows-rotate" aria-hidden="true" />,
    secondaryPanel: "rotations",
    primaryHubChildKey: "view-all-rotations",
    children: [
      {
        key: "rotation-1",
        title: "Clinical Nursing — Fall 2026",
        url: "/rotations",
        icon: <i className="fa-light fa-folder" aria-hidden="true" />,
      },
      {
        key: "rotation-2",
        title: "PT Fieldwork — Spring 2026",
        url: "/rotations",
        icon: <i className="fa-light fa-folder" aria-hidden="true" />,
      },
      {
        key: "rotation-3",
        title: "OT Level II — Summer 2026",
        url: "/rotations",
        icon: <i className="fa-light fa-folder" aria-hidden="true" />,
      },
      {
        key: "view-all-rotations",
        title: "View all",
        url: "/rotations",
        icon: <i className="fa-light fa-arrow-right" aria-hidden="true" />,
      },
    ],
  },
  {
    key: "team",
    title: "Team",
    url: "/team",
    icon:       <i className="fa-light fa-users" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-users" aria-hidden="true" />,
  },
  {
    key: "compliance",
    title: "Compliance",
    url: "/compliance",
    icon:       <i className="fa-light fa-shield-check" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-shield-check" aria-hidden="true" />,
  },
]

// ── Documents section ───────────────────────────────────────────────────────

export const NAV_DOCUMENTS_LABEL = "Documents"

export const NAV_DOCUMENTS: NavLinkItem[] = [
  {
    key: "data-library",
    title: "Data Library",
    url: "#",
    icon:       <i className="fa-light fa-database" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-database" aria-hidden="true" />,
  },
  {
    key: "reports",
    title: "Reports",
    url: "#",
    icon:       <i className="fa-light fa-chart-column" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-chart-column" aria-hidden="true" />,
  },
  {
    key: "word-assistant",
    title: "Word Assistant",
    url: "#",
    icon:       <i className="fa-light fa-file-pen" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-file-pen" aria-hidden="true" />,
    badge: "Beta",
  },
  {
    key: "more",
    title: "More",
    url: "#",
    icon:       <i className="fa-light fa-ellipsis" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-ellipsis" aria-hidden="true" />,
  },
]

// ── Quick actions (above primary nav) + bottom utilities ───────────────────────

/** `opensCommandMenu` wires ⌘K instead of `url`. */
export interface NavSecondaryItem {
  key: string
  title: string
  url: string
  icon: React.ReactNode
  opensCommandMenu?: boolean
}

/** Search + Notifications — rendered above Dashboard in the sidebar. */
export const NAV_QUICK_ACTIONS: NavSecondaryItem[] = [
  {
    key: "command-menu",
    title: "Search or ask Leo",
    url: "#",
    icon: <i className="fa-light fa-magnifying-glass" aria-hidden="true" />,
    opensCommandMenu: true,
  },
  {
    key: "notifications",
    title: "Notifications",
    url: "#",
    icon: <i className="fa-light fa-bell" aria-hidden="true" />,
  },
]

export const NAV_SECONDARY: NavSecondaryItem[] = [
  {
    key: "settings",
    title: "Settings",
    url: "/settings",
    icon: <i className="fa-light fa-gear" aria-hidden="true" />,
  },
  {
    key: "help",
    title: "Get Help",
    url: "/help",
    icon: <i className="fa-light fa-circle-question" aria-hidden="true" />,
  },
]

// ── User ──────────────────────────────────────────────────────────────────────

export const NAV_USER = {
  name:  "Jordan Rivera",
  email: "jordan.rivera@jhmi.edu",
  /** Stock portrait (randomuser.me); stable for this seed */
  avatar: stockPortraitUrl("exxat-nav-user-jordan-rivera"),
}
