// lib/pce-nav.tsx
"use client"

import type * as React from "react"

export interface NavLinkItem {
  key: string
  title: string
  url: string
  icon: React.ReactNode
  iconActive?: React.ReactNode
  children?: NavLinkItem[]
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
    icon: <i className="fa-duotone fa-solid fa-star-christmas text-brand" aria-hidden="true" />,
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
    children: [
      {
        key: "ce-surveys",
        title: "Evaluations",
        url: "/surveys",
        icon:       <i className="fa-light fa-paper-plane" aria-hidden="true" />,
        iconActive: <i className="fa-solid fa-paper-plane" aria-hidden="true" />,
      },
      {
        key: "ce-templates",
        title: "Templates",
        url: "/templates",
        icon:       <i className="fa-light fa-rectangle-list" aria-hidden="true" />,
        iconActive: <i className="fa-solid fa-rectangle-list" aria-hidden="true" />,
      },
    ],
  },
  {
    key: "programmatic-surveys",
    title: "Programmatic Surveys",
    url: "#",
    icon:       <i className="fa-light fa-chart-network" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-chart-network" aria-hidden="true" />,
    children: [
      {
        key: "ps-surveys",
        title: "Surveys",
        url: "/surveys/programmatic",
        icon:       <i className="fa-light fa-paper-plane" aria-hidden="true" />,
        iconActive: <i className="fa-solid fa-paper-plane" aria-hidden="true" />,
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
    key: "setup",
    title: "Setup",
    url: "/admin",
    icon:       <i className="fa-light fa-gear-complex" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-gear-complex" aria-hidden="true" />,
    children: [
      { key: "students",         title: "Students",         url: "/admin/students",         icon: <i className="fa-light fa-graduation-cap" aria-hidden="true" /> },
      { key: "faculty",          title: "Faculty",          url: "/admin/faculty",          icon: <i className="fa-light fa-user-tie" aria-hidden="true" /> },
      { key: "courses",          title: "Courses",          url: "/admin/courses",          icon: <i className="fa-light fa-book" aria-hidden="true" /> },
      { key: "terms",            title: "Terms",            url: "/admin/terms",            icon: <i className="fa-light fa-calendar" aria-hidden="true" /> },
      { key: "offerings",        title: "Offerings",        url: "/admin/offerings",        icon: <i className="fa-light fa-layer-group" aria-hidden="true" /> },
      { key: "competencies",     title: "Competencies",     url: "/admin/competencies",     icon: <i className="fa-light fa-list-check" aria-hidden="true" /> },
      { key: "content-areas",    title: "Content Areas",    url: "/admin/content-areas",    icon: <i className="fa-light fa-grid-2" aria-hidden="true" /> },
      { key: "standards",        title: "Standards",        url: "/admin/standards",        icon: <i className="fa-light fa-certificate" aria-hidden="true" /> },
      { key: "assessment-types", title: "Assessment Types", url: "/admin/assessment-types", icon: <i className="fa-light fa-clipboard-list" aria-hidden="true" /> },
      { key: "permissions",      title: "Permissions",      url: "/admin/permissions",      icon: <i className="fa-light fa-lock" aria-hidden="true" /> },
      { key: "admin-home",       title: "Overview",         url: "/admin",                  icon: <i className="fa-light fa-house" aria-hidden="true" /> },
    ],
  },
]

export const NAV_FACULTY: NavLinkItem[] = [
  {
    key: "my-surveys",
    title: "My Forms",
    url: "/my-surveys",
    icon:       <i className="fa-light fa-paper-plane" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-paper-plane" aria-hidden="true" />,
  },
  {
    key: "results",
    title: "Results",
    url: "/my-surveys?filter=released",
    icon:       <i className="fa-light fa-chart-bar" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-chart-bar" aria-hidden="true" />,
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
