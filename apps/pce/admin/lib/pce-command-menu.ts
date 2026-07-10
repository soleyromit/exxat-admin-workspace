import type { CommandMenuGroup } from "@/lib/command-menu-config"
import { MOCK_SURVEYS, MOCK_TEMPLATES } from "@/lib/pce-mock-data"

const ADMIN_ENTITY_ROUTES = [
  { id: "admin-students",         label: "Students",         href: "/admin/students",         icon: "fa-light fa-graduation-cap" },
  { id: "admin-faculty",          label: "Faculty",          href: "/admin/faculty",          icon: "fa-light fa-user-tie" },
  { id: "admin-terms",            label: "Terms",            href: "/admin/terms",            icon: "fa-light fa-calendar" },
  { id: "admin-offerings",        label: "Course Offerings", href: "/admin/offerings",        icon: "fa-light fa-layer-group" },
  { id: "admin-competencies",     label: "Competencies",     href: "/admin/competencies",     icon: "fa-light fa-list-check" },
  { id: "admin-content-areas",    label: "Content Areas",    href: "/admin/content-areas",    icon: "fa-light fa-grid-2" },
  { id: "admin-standards",        label: "Standards",        href: "/admin/standards",        icon: "fa-light fa-certificate" },
  { id: "admin-assessment-types", label: "Assessment Types", href: "/admin/assessment-types", icon: "fa-light fa-clipboard-list" },
  { id: "admin-permissions",      label: "Permissions",      href: "/admin/permissions",      icon: "fa-light fa-lock" },
  { id: "admin-home",             label: "Admin Overview",   href: "/admin",                  icon: "fa-light fa-house" },
]

const PAGE_ROUTES = [
  { id: "page-surveys",           label: "Surveys",                              href: "/surveys",                   icon: "fa-light fa-paper-plane" },
  { id: "page-activate",          label: "Activate Term",                        href: "/surveys/activate",          icon: "fa-light fa-circle-play" },
  { id: "page-templates",         label: "Templates",                            href: "/admin/eval-settings?section=templates", icon: "fa-light fa-rectangle-list" },
  { id: "page-moderation",        label: "Moderation",                           href: "/moderation",                icon: "fa-light fa-shield-check" },
  { id: "page-results",           label: "Results",                              href: "/results",                   icon: "fa-light fa-square-poll-vertical" },
  { id: "page-analytics-ce",      label: "Analytics — Course Evaluation",        href: "/analytics",                 icon: "fa-light fa-chart-mixed" },
  { id: "page-analytics-ps",      label: "Analytics — Programmatic",             href: "/analytics/programmatic",    icon: "fa-light fa-chart-mixed" },
  { id: "page-email-templates",   label: "Email Templates",                      href: "/admin/email-templates",     icon: "fa-light fa-envelope" },
  { id: "page-reminder-schedule", label: "Reminder Schedule",                    href: "/admin/reminder-schedule",   icon: "fa-light fa-bell" },
  { id: "page-settings",          label: "Settings",                             href: "/settings",                  icon: "fa-light fa-gear" },
  { id: "page-help",              label: "Help",                                 href: "/help",                      icon: "fa-light fa-circle-question" },
]

export const PCE_COMMAND_MENU_DATA_GROUPS: CommandMenuGroup[] = [
  {
    id: "surveys",
    heading: "Surveys",
    searchOnly: true,
    items: MOCK_SURVEYS.map(s => ({
      id: `survey-${s.id}`,
      label: `${s.courseCode} — ${s.courseName}`,
      keywords: s.term,
      icon: "fa-light fa-paper-plane",
      href: `/surveys/${s.id}`,
    })),
  },
  {
    id: "templates",
    heading: "Templates",
    searchOnly: true,
    items: MOCK_TEMPLATES.map(t => ({
      id: `template-${t.id}`,
      label: t.name,
      icon: "fa-light fa-rectangle-list",
      href: `/templates/${t.id}`,
    })),
  },
  {
    id: "admin",
    heading: "Admin",
    items: ADMIN_ENTITY_ROUTES,
  },
  {
    id: "pages",
    heading: "Pages",
    items: PAGE_ROUTES,
  },
]
