import type { CommandMenuGroup } from "@/lib/command-menu-config"
import { MOCK_SURVEYS, MOCK_TEMPLATES } from "@/lib/pce-mock-data"
import { termsOrdered } from "@/lib/pce-term-metrics"

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
  { id: "page-ce-dashboard",      label: "Course Evaluation · Dashboard",        href: "/course-evaluation/dashboard", icon: "fa-light fa-grid-2" },
  ...termsOrdered.map((t) => ({
    id: `page-term-${t.id}`,
    label: `${t.name} · Term Workspace`,
    keywords: "term workspace evaluations response rate",
    href: `/course-evaluation/term/${t.id}`,
    icon: "fa-light fa-calendar-days",
  })),
  { id: "page-surveys",           label: "Surveys",                              href: "/surveys",                   icon: "fa-light fa-paper-plane" },
  { id: "page-activate",          label: "Activate Term",                        href: "/surveys/activate",          icon: "fa-light fa-circle-play" },
  { id: "page-remind",            label: "Send Reminders",                       keywords: "reminder nudge non-responders email", href: "/surveys/remind", icon: "fa-light fa-bell" },
  { id: "page-term-setup",        label: "Set up Term",                          keywords: "term calendar configure setup readiness", href: "/course-evaluation/term-setup", icon: "fa-light fa-calendar-plus" },
  { id: "page-templates",         label: "Templates",                            href: "/admin/eval-settings?section=templates", icon: "fa-light fa-rectangle-list" },
  { id: "page-moderation",        label: "Moderation",                           href: "/moderation",                icon: "fa-light fa-shield-check" },
  { id: "page-results",           label: "Results",                              href: "/results",                   icon: "fa-light fa-square-poll-vertical" },
  { id: "page-analytics-ce",      label: "Analytics · Course Evaluation",        href: "/analytics",                 icon: "fa-light fa-chart-mixed" },
  { id: "page-analytics-ps",      label: "Analytics · Programmatic",             href: "/analytics/programmatic",    icon: "fa-light fa-chart-mixed" },
  { id: "page-email-templates",   label: "Email Templates",                      href: "/admin/email-templates",     icon: "fa-light fa-envelope" },
  { id: "page-reminder-schedule", label: "Reminder Schedule",                    href: "/admin/reminder-schedule",   icon: "fa-light fa-bell" },
  { id: "page-compare-push-flow-rows", label: "Compare · Push flow rows (Variant B)", keywords: "variant compare per-flow evaluatee monil", href: "/compare/push-flow-rows", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-course-ledger", label: "Compare · Course flow ledger (Variant C)", keywords: "variant compare ledger course flows monil", href: "/compare/push-course-ledger", icon: "fa-light fa-table-list" },
  { id: "page-compare-fix-affordance", label: "Compare · Fix affordance (3 treatments)", keywords: "variant compare add faculty students action density", href: "/compare/fix-affordance", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step2-template-switch", label: "Compare · Template switch (mandatory decision)", keywords: "variant compare template switch confirm mandatory decision co-instructor faculty roles", href: "/compare/push-step2-template-switch", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step2-template-assignment", label: "Compare · Template assignment (bare fields)", keywords: "variant compare template override late-added faculty inline field", href: "/compare/push-step2-template-assignment", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step2-accordion-layout", label: "Compare · Accordion layout (3 arrangements)", keywords: "variant compare accordion expanded row layout template evaluatees", href: "/compare/push-step2-accordion-layout", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step2-template-picker-hub", label: "Compare · Template picker (all 5, switchable)", keywords: "variant compare template picker hub switch review shipped popover compact sheet segmented", href: "/compare/push-step2-template-picker", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step2-template-picker-popover", label: "Compare · Template picker (Popover + Command)", keywords: "variant compare template picker popover command searchable width", href: "/compare/push-step2-template-picker-popover", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step2-template-picker-compact-list", label: "Compare · Template picker (compact list)", keywords: "variant compare template picker compact dense list airtable otter", href: "/compare/push-step2-template-picker-compact-list", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step2-template-picker-sheet", label: "Compare · Template picker (Sheet gallery)", keywords: "variant compare template picker sheet drawer gallery cards", href: "/compare/push-step2-template-picker-sheet", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step2-template-picker-segmented", label: "Compare · Template picker (segmented browse)", keywords: "variant compare template picker toggle group segmented browse detail", href: "/compare/push-step2-template-picker-segmented", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step2-template-flow-unified", label: "Compare · Template flow (unified decision)", keywords: "variant compare template switch flow conflict override create-new unified single dialog", href: "/compare/push-step2-template-flow-unified", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step2-template-flow-inline", label: "Compare · Template flow (inline, no modal)", keywords: "variant compare template switch flow conflict override create-new inline no modal", href: "/compare/push-step2-template-flow-inline", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step2-template-flow-forward", label: "Compare · Template flow (consequence-forward)", keywords: "variant compare template switch flow conflict caption before pick", href: "/compare/push-step2-template-flow-forward", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step2-template-flow-wizard", label: "Compare · Template flow (2-step mini-wizard)", keywords: "variant compare template switch flow conflict wizard step pick resolve", href: "/compare/push-step2-template-flow-wizard", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step3-survey-title-builder", label: "Compare · Survey title builder (A–E)", keywords: "variant compare survey title merge field chips formula slots reorder preview", href: "/compare/push-step3-survey-title-builder", icon: "fa-light fa-table-list" },
  { id: "page-compare-push-step3-survey-title-builder-v2", label: "Compare · Survey title builder v2 (inline tokens)", keywords: "variant compare survey title merge field inline token pill hubspot slash preset formula", href: "/compare/push-step3-survey-title-builder-v2", icon: "fa-light fa-table-list" },
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
      label: `${s.courseCode} · ${s.courseName}`,
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
