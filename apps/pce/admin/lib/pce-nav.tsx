// lib/pce-nav.tsx
"use client"

import type * as React from "react"
import { LeoIcon } from "@/components/ui/leo-icon"

export interface NavLinkItem {
  key: string
  title: string
  url: string
  icon: React.ReactNode
  iconActive?: React.ReactNode
  children?: NavLinkItem[]
  /** Extra route prefixes (beyond url + children) that mark this item active —
   *  for wizard flows like /surveys/push that have no nav entry of their own. */
  activePrefixes?: string[]
  badge?: number | string
  secondaryPanel?: string
  primaryHubChildKey?: string
}

export interface NavSecondaryItem {
  key: string
  title: string
  url: string
  icon: React.ReactNode
  iconActive?: React.ReactNode
  opensCommandMenu?: boolean
  opensAskLeo?: boolean
}

export interface NavProgram { id: string; name: string }
export interface NavSchool {
  id: string
  name: string
  logo: string
  initials: string
  programs: NavProgram[]
}

export const NAV_SCHOOLS: NavSchool[] = [
  {
    id: "jhu",
    name: "Johns Hopkins University",
    logo: "https://img.logo.dev/jhu.edu?token=pk_X-1ZO13GSgeOoUrIuJ6BeQ",
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
    logo: "https://img.logo.dev/mayoclinic.org?token=pk_X-1ZO13GSgeOoUrIuJ6BeQ",
    initials: "MC",
    programs: [
      { id: "md", name: "Doctor of Medicine" },
      { id: "bms", name: "Biomedical Sciences" },
    ],
  },
]

export const NAV_SCHOOL_DEFAULT = NAV_SCHOOLS[0]
export const NAV_PROGRAM_DEFAULT = NAV_SCHOOLS[0].programs[0]

export const NAV_QUICK_ACTIONS: NavSecondaryItem[] = [
  {
    key: "ask-leo",
    title: "Ask Leo",
    url: "#",
    // LeoIcon's smallest preset is 32px (size-8); nav icons are 16px (size-4).
    // Wrap in a 16px slot and scale the glyph to 0.5 so it shares the exact
    // footprint + left edge of every other nav icon (no stray left padding).
    icon: (
      <span className="relative flex size-4 shrink-0 items-center justify-center">
        <LeoIcon
          variant="ambient"
          size="sm"
          sparkleCadence="default"
          orbitingSparkles={false}
          className="pointer-events-none absolute scale-[0.6] overflow-visible"
        />
      </span>
    ),
    opensAskLeo: true,
  },
  {
    key: "search",
    title: "Search",
    url: "#",
    icon: <i className="fa-light fa-magnifying-glass" aria-hidden="true" />,
    opensCommandMenu: true,
  },
]

export const NAV_ADMIN: NavLinkItem[] = [
  {
    key: "course-evaluation",
    title: "Course Evaluation",
    url: "#",
    icon:       <i className="fa-light fa-star" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-star" aria-hidden="true" />,
    // /surveys (list) + /surveys/push (push evaluation) belong to this module,
    // as do the results viewer and the moderation queue (reached via buttons,
    // no nav row of their own). /surveys/programmatic/* defers to Programmatic
    // Surveys (more specific).
    activePrefixes: ["/surveys", "/results", "/moderation"],
    children: [
      {
        key: "ce-dashboard",
        title: "Dashboard",
        url: "/course-evaluation/dashboard",
        // Term workspaces + term setup are Dashboard territory.
        activePrefixes: ["/course-evaluation/term", "/course-evaluation/term-setup"],
        icon:       <i className="fa-light fa-gauge-high" aria-hidden="true" />,
        iconActive: <i className="fa-solid fa-gauge-high" aria-hidden="true" />,
      },
      // Templates moved into Settings (/admin/eval-settings?section=templates)
      // as a tab — no standalone left-nav entry.
      {
        key: "ce-analytics",
        title: "Analytics",
        url: "/analytics",
        icon:       <i className="fa-light fa-chart-mixed" aria-hidden="true" />,
        iconActive: <i className="fa-solid fa-chart-mixed" aria-hidden="true" />,
      },
      // Results has NO admin left-nav row (Romit 2026-07-09) — admins reach
      // /results through the dashboard's Results row buttons, the term cards'
      // Released links, and the ⌘K palette. Faculty keep their "My Results"
      // nav entry below (their only entry point per ST-14).
      {
        key: "ce-settings",
        title: "Settings",
        url: "/admin/eval-settings",
        icon:       <i className="fa-light fa-gear-complex" aria-hidden="true" />,
        iconActive: <i className="fa-solid fa-gear-complex" aria-hidden="true" />,
      },
    ],
  },
  {
    key: "programmatic-surveys",
    title: "Programmatic Surveys",
    url: "#",
    icon:       <i className="fa-light fa-chart-network" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-chart-network" aria-hidden="true" />,
    // /surveys/programmatic (list) + /surveys/programmatic/push (push survey).
    activePrefixes: ["/surveys/programmatic"],
    children: [
      {
        key: "ps-analytics",
        title: "Dashboard",
        url: "/analytics/programmatic",
        icon:       <i className="fa-light fa-chart-mixed" aria-hidden="true" />,
        iconActive: <i className="fa-solid fa-chart-mixed" aria-hidden="true" />,
      },
      {
        key: "ps-templates",
        title: "Templates",
        url: "/templates/programmatic",
        icon:       <i className="fa-light fa-rectangle-list" aria-hidden="true" />,
        iconActive: <i className="fa-solid fa-rectangle-list" aria-hidden="true" />,
      },
    ],
  },
  {
    key: "directories",
    title: "Directory",
    // Consolidated: one Directory surface with Courses · Faculty · Students · Term
    // sub-tabs (matches live pce-three IA). Was 4 separate child rows. Each tab is
    // its own route, so own the whole /directory subtree to stay active across them.
    url: "/directory/courses",
    activePrefixes: ["/directory"],
    icon:       <i className="fa-light fa-folder-open" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-folder-open" aria-hidden="true" />,
  },
]

/* Faculty nav. "My Surveys" leads because the faculty job starts at the course
 * list, not at analytics (Apr 21: Dr. Robert lands on his surveys and clicks
 * through to results) — and the shell-migration spec always had My Surveys
 * first. It had drifted out of this array entirely, which orphaned the route. */
export const NAV_FACULTY: NavLinkItem[] = [
  {
    key: "my-surveys",
    title: "My Surveys",
    url: "/my-surveys",
    icon:       <i className="fa-light fa-paper-plane" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-paper-plane" aria-hidden="true" />,
  },
  {
    key: "my-dashboard",
    title: "My Dashboard",
    url: "/my-dashboard",
    icon:       <i className="fa-light fa-chart-mixed" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-chart-mixed" aria-hidden="true" />,
  },
]

export const NAV_SECONDARY: NavSecondaryItem[] = [
  {
    key: "settings",
    title: "Settings",
    url: "/settings",
    icon:       <i className="fa-light fa-gear" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-gear" aria-hidden="true" />,
  },
  {
    key: "help",
    title: "Help",
    url: "/help",
    icon:       <i className="fa-light fa-circle-question" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-circle-question" aria-hidden="true" />,
  },
]

export const NAV_USER = {
  name: "Ramona J.",
  email: "ramona@example.com",
  avatar: "",
}
