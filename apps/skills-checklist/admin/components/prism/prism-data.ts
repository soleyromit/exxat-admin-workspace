/** Static content of the PRISM home, copied from the live page (steps.exxat.com/dashboard, captured 2026-11-15). */
export type Tone = "pink" | "orange" | "teal"
export type Badge = "new" | "beta" | "leo"
export interface PrismItem { id: string; label: string; icon: string; desc: string; badge?: Badge; sharp?: boolean; href?: string }
export interface PrismSection { id: string; title: string; tone: Tone; items: PrismItem[] }

/** The one live entry: Skills checklist, a child of Competency Management, opens the Skill lists walkthrough stop. */
export const SKILLS_CHECKLIST = { label: "Skills checklist", href: "/admin/lists" } as const

export const SECTIONS: PrismSection[] = [
  {
    id: "program", title: "Program", tone: "pink", items: [
      { id: "program-details", label: "Program Details", icon: "fa-university", desc: "Set up defining attributes of the program including mission, vision, accreditation standards and more." },
      { id: "students", label: "Students", icon: "fa-graduation-cap", desc: "Manage profiles and demographic information on matriculated students and alumni." },
      { id: "faculty", label: "Faculty and Staff", icon: "fa-chalkboard-teacher", desc: "View faculty portfolios including teaching responsibility, scholarly productivity and service activities." },
      { id: "student-compliance", label: "Student Compliance", icon: "fa-file-invoice", desc: "Configure, collect, review and communicate with students about clearance documents for clinical education." },
      { id: "faculty-compliance", label: "Faculty Compliance", icon: "fa-file-invoice", desc: "Configure, collect and review clearance documents for faculty." },
      { id: "reports", label: "Reports", icon: "fa-chart-line", desc: "Access all standard, custom, and accreditation reports across the system from a centralized location." },
      { id: "surveys", label: "Surveys", icon: "fa-list-check", badge: "new", desc: "Create, distribute, and analyze surveys to collect feedback from students, preceptors, and faculty." },
    ],
  },
  {
    id: "curriculum", title: "Curriculum Management", tone: "orange", items: [
      { id: "courses", label: "Courses", icon: "fa-books", desc: "Enter, organize and manage courses including course documents, schedules, resources and registration." },
      { id: "curriculum-mapping", label: "Curriculum Mapping", icon: "fa-grid-2-plus", sharp: true, badge: "leo", desc: "Build your curriculum, map it with standards, and get insightful reports." },
      { id: "competency", label: "Competency Management", icon: "fa-transporter", sharp: true, badge: "beta", desc: "Set up your competencies, map them to assessments and course offerings and generate insightful reports." },
      // Not on the live page. Copy is [INFER], not approved by Romit.
      { id: "skills-checklist", label: SKILLS_CHECKLIST.label, icon: "fa-list-check", href: SKILLS_CHECKLIST.href, desc: "Set up skills, evaluation settings and course mapping." },
    ],
  },
  {
    id: "placement", title: "Placement Management", tone: "teal", items: [
      { id: "sites", label: "Sites", icon: "fa-building", desc: "Find contact information, contracts, availability and clearance requirements for all clinical sites." },
      { id: "requests", label: "Process My Requests", icon: "fa-file-invoice", desc: "Process placement requests submitted by students." },
      { id: "placements", label: "Placements", icon: "fa-hospital-user", desc: "Navigate the process of matching students to sites from start to finish." },
      { id: "activities", label: "Learning Activities", icon: "fa-clipboard", desc: "Set up, distribute, review and grade course related activities." },
    ],
  },
]

export const DRAWER_FOOTER = { label: "Forms (Exxat Internal)", icon: "fa-clipboard" }
export const DASHBOARD_ROW = { label: "Dashboard", icon: "fa-table-cells" }
export const BANNER = {
  title: "Your Students Can Now Find Their First Job on Exxat One",
  body: "Explore open roles, share them with your students, and encourage applications based on their skills and clinical experience.",
  cta: "Explore",
}
export const TODAY_CHIP = "Nov 15"
export const USER = { name: "Romit Soley", org: "PA DEMO (DPT)" }
