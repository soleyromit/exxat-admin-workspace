/**
 * Mock team directory — replace with API data in production.
 * Kept at 11+ rows so the Team page demonstrates search / sort / properties toolbar (see data-views-pattern.md).
 */

export interface TeamMember extends Record<string, unknown> {
  id: string
  name: string
  role: string
  email: string
  initials: string
  /** Shown as a subtle status chip */
  status: "active" | "away" | "invited"
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "1",
    name: "Alex Rivera",
    role: "Program Administrator",
    email: "alex.rivera@school.edu",
    initials: "AR",
    status: "active",
  },
  {
    id: "2",
    name: "Jordan Chen",
    role: "Clinical Coordinator",
    email: "jordan.chen@school.edu",
    initials: "JC",
    status: "active",
  },
  {
    id: "3",
    name: "Sam Patel",
    role: "Field Education",
    email: "sam.patel@school.edu",
    initials: "SP",
    status: "away",
  },
  {
    id: "4",
    name: "Taylor Brooks",
    role: "Viewer",
    email: "taylor.brooks@school.edu",
    initials: "TB",
    status: "invited",
  },
  {
    id: "5",
    name: "Morgan Lee",
    role: "Program Administrator",
    email: "morgan.lee@school.edu",
    initials: "ML",
    status: "active",
  },
  {
    id: "6",
    name: "Casey Nguyen",
    role: "Clinical Coordinator",
    email: "casey.nguyen@school.edu",
    initials: "CN",
    status: "active",
  },
  {
    id: "7",
    name: "Riley Johnson",
    role: "Field Education",
    email: "riley.johnson@school.edu",
    initials: "RJ",
    status: "away",
  },
  {
    id: "8",
    name: "Quinn Martinez",
    role: "Viewer",
    email: "quinn.martinez@school.edu",
    initials: "QM",
    status: "active",
  },
  {
    id: "9",
    name: "Jamie Wilson",
    role: "Program Administrator",
    email: "jamie.wilson@school.edu",
    initials: "JW",
    status: "invited",
  },
  {
    id: "10",
    name: "Drew Anderson",
    role: "Clinical Coordinator",
    email: "drew.anderson@school.edu",
    initials: "DA",
    status: "active",
  },
  {
    id: "11",
    name: "Skyler Kim",
    role: "Field Education",
    email: "skyler.kim@school.edu",
    initials: "SK",
    status: "active",
  },
]
