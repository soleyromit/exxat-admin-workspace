/**
 * Mock compliance obligations — replace with API data in production.
 */

export type ComplianceStatus = "compliant" | "due_soon" | "overdue" | "pending"

export interface ComplianceItem extends Record<string, unknown> {
  id: string
  title: string
  category: string
  status: ComplianceStatus
  /** MM/DD/YYYY */
  dueDate: string
  owner: string
  /** MM/DD/YYYY */
  lastReviewed: string
}

export const COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    id: "1",
    title: "Annual HIPAA training attestation",
    category: "HIPAA",
    status: "compliant",
    dueDate: "12/31/2026",
    owner: "Alex Rivera",
    lastReviewed: "03/01/2026",
  },
  {
    id: "2",
    title: "OSHA bloodborne pathogen review",
    category: "OSHA",
    status: "due_soon",
    dueDate: "04/10/2026",
    owner: "Jordan Chen",
    lastReviewed: "10/15/2025",
  },
  {
    id: "3",
    title: "Clinical site affiliation agreements",
    category: "Clinical",
    status: "pending",
    dueDate: "05/01/2026",
    owner: "Sam Patel",
    lastReviewed: "—",
  },
  {
    id: "4",
    title: "FERPA student records policy",
    category: "Privacy",
    status: "compliant",
    dueDate: "09/30/2026",
    owner: "Taylor Brooks",
    lastReviewed: "02/20/2026",
  },
  {
    id: "5",
    title: "Background check re-verification",
    category: "Clinical",
    status: "overdue",
    dueDate: "03/01/2026",
    owner: "Jordan Chen",
    lastReviewed: "03/01/2025",
  },
  {
    id: "6",
    title: "Accreditation self-study draft",
    category: "Accreditation",
    status: "due_soon",
    dueDate: "04/22/2026",
    owner: "Alex Rivera",
    lastReviewed: "01/10/2026",
  },
  {
    id: "7",
    title: "Incident response tabletop exercise",
    category: "HIPAA",
    status: "pending",
    dueDate: "06/15/2026",
    owner: "Sam Patel",
    lastReviewed: "—",
  },
  {
    id: "8",
    title: "Emergency preparedness plan",
    category: "OSHA",
    status: "compliant",
    dueDate: "11/01/2026",
    owner: "Taylor Brooks",
    lastReviewed: "02/28/2026",
  },
  {
    id: "9",
    title: "Medication safety competency checklist",
    category: "Clinical",
    status: "compliant",
    dueDate: "08/01/2026",
    owner: "Alex Rivera",
    lastReviewed: "03/15/2026",
  },
  {
    id: "10",
    title: "Data breach notification procedure",
    category: "Privacy",
    status: "due_soon",
    dueDate: "04/05/2026",
    owner: "Jordan Chen",
    lastReviewed: "10/01/2025",
  },
  {
    id: "11",
    title: "LCME / programmatic review evidence",
    category: "Accreditation",
    status: "pending",
    dueDate: "07/30/2026",
    owner: "Sam Patel",
    lastReviewed: "—",
  },
  {
    id: "12",
    title: "Sharps injury log audit",
    category: "OSHA",
    status: "overdue",
    dueDate: "02/20/2026",
    owner: "Taylor Brooks",
    lastReviewed: "02/20/2025",
  },
  {
    id: "13",
    title: "Business associate agreement inventory",
    category: "HIPAA",
    status: "compliant",
    dueDate: "10/15/2026",
    owner: "Alex Rivera",
    lastReviewed: "03/01/2026",
  },
  {
    id: "14",
    title: "Student immunization tracking",
    category: "Clinical",
    status: "due_soon",
    dueDate: "04/18/2026",
    owner: "Jordan Chen",
    lastReviewed: "09/01/2025",
  },
]
