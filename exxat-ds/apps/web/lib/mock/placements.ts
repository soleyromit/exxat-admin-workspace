// ─────────────────────────────────────────────────────────────────────────────
// Mock data — Placements
// ─────────────────────────────────────────────────────────────────────────────

export type Status = "confirmed" | "pending" | "under-review" | "rejected" | "completed"

/** Which lifecycle tab owns this row (All shows every row). */
export type PlacementPhase = "upcoming" | "ongoing" | "completed"

export interface Placement extends Record<string, unknown> {
  id: number
  student: string
  email: string
  initials: string
  program: string
  site: string
  siteAddress: string
  status: Status
  start: string
  duration: string
  supervisor: string
  placementPhase: PlacementPhase
  /** Display title for internship column */
  internship: string
  specialization: string
  /** Upcoming */
  compliance: string
  daysUntilStart: number
  readiness: string
  /** Ongoing */
  progressWeeksDone: number
  progressWeeksTotal: number
  endDate: string
  lastCheckin: string
  /** Completed */
  completionDate: string
  finalStatus: string
  rating: number
  suggestedToHire: string
  /** Visual indicator — row has new activity or was recently updated */
  isNew?: boolean
}

export const ALL_PLACEMENTS: Placement[] = [
  {
    id: 1, student: "Sarah Johnson", email: "s.johnson@college.edu", initials: "SJ", program: "Nursing", site: "City Medical Center",
    siteAddress: "1400 N Lake Shore Dr, Chicago, IL", status: "confirmed", start: "03/15/2026", duration: "12 wks", supervisor: "Dr. Patel",
    placementPhase: "ongoing", internship: "Med-Surg Clinical I", specialization: "Adult Health", compliance: "Complete", daysUntilStart: 0,
    readiness: "Ready", progressWeeksDone: 5, progressWeeksTotal: 12, endDate: "06/07/2026", lastCheckin: "Mar 22, 2026",
    completionDate: "—", finalStatus: "—", rating: 0, suggestedToHire: "—", isNew: true,
  },
  {
    id: 2, student: "Mike Chen", email: "m.chen@university.edu", initials: "MC", program: "Physical Therapy", site: "Metro Rehab",
    siteAddress: "250 E Superior St, Chicago, IL", status: "pending", start: "04/01/2026", duration: "8 wks", supervisor: "Dr. Kim",
    placementPhase: "upcoming", internship: "Outpatient PT Rotation", specialization: "Orthopedics", compliance: "In progress", daysUntilStart: 8,
    readiness: "Ready", progressWeeksDone: 0, progressWeeksTotal: 8, endDate: "05/27/2026", lastCheckin: "—",
    completionDate: "—", finalStatus: "—", rating: 0, suggestedToHire: "—",
  },
  {
    id: 3, student: "Amy Park", email: "a.park@school.edu", initials: "AP", program: "Occupational Therapy", site: "Bay Area Health",
    siteAddress: "3100 Telegraph Ave, Oakland, CA", status: "under-review", start: "03/28/2026", duration: "10 wks", supervisor: "Unassigned",
    placementPhase: "upcoming", internship: "Acute Care OT", specialization: "Hand Therapy", compliance: "Pending documents", daysUntilStart: 4,
    readiness: "At risk", progressWeeksDone: 0, progressWeeksTotal: 10, endDate: "06/06/2026", lastCheckin: "—",
    completionDate: "—", finalStatus: "—", rating: 0, suggestedToHire: "—", isNew: true,
  },
  {
    id: 4, student: "James Williams", email: "j.williams@college.edu", initials: "JW", program: "Nursing", site: "Sunrise Hospital",
    siteAddress: "5775 Wayzata Blvd, Minneapolis, MN", status: "confirmed", start: "04/07/2026", duration: "12 wks", supervisor: "Dr. Torres",
    placementPhase: "ongoing", internship: "ICU Practicum", specialization: "Critical Care", compliance: "Complete", daysUntilStart: 0,
    readiness: "Ready", progressWeeksDone: 2, progressWeeksTotal: 12, endDate: "06/30/2026", lastCheckin: "Mar 21, 2026",
    completionDate: "—", finalStatus: "—", rating: 0, suggestedToHire: "—",
  },
  {
    id: 5, student: "Emily Davis", email: "e.davis@university.edu", initials: "ED", program: "Social Work", site: "Community Care",
    siteAddress: "220 S State St, Chicago, IL", status: "rejected", start: "—", duration: "—", supervisor: "—",
    placementPhase: "upcoming", internship: "Community SW Field", specialization: "Behavioral Health", compliance: "Incomplete", daysUntilStart: 0,
    readiness: "Blocked", progressWeeksDone: 0, progressWeeksTotal: 10, endDate: "—", lastCheckin: "—",
    completionDate: "—", finalStatus: "—", rating: 0, suggestedToHire: "—",
  },
  {
    id: 6, student: "Carlos Rivera", email: "c.rivera@school.edu", initials: "CR", program: "Physical Therapy", site: "Summit Sports Med",
    siteAddress: "900 N Michigan Ave, Chicago, IL", status: "pending", start: "04/14/2026", duration: "8 wks", supervisor: "Dr. Lee",
    placementPhase: "upcoming", internship: "Sports Medicine PT", specialization: "Sports Rehab", compliance: "Complete", daysUntilStart: 21,
    readiness: "Ready", progressWeeksDone: 0, progressWeeksTotal: 8, endDate: "06/09/2026", lastCheckin: "—",
    completionDate: "—", finalStatus: "—", rating: 0, suggestedToHire: "—",
  },
  {
    id: 7, student: "Priya Sharma", email: "p.sharma@college.edu", initials: "PS", program: "Nursing", site: "Harbor Medical",
    siteAddress: "1200 W Harrison St, Chicago, IL", status: "confirmed", start: "03/22/2026", duration: "12 wks", supervisor: "Dr. Patel",
    placementPhase: "ongoing", internship: "Pediatric Nursing", specialization: "Pediatrics", compliance: "Complete", daysUntilStart: 0,
    readiness: "Ready", progressWeeksDone: 7, progressWeeksTotal: 12, endDate: "06/14/2026", lastCheckin: "Mar 23, 2026",
    completionDate: "—", finalStatus: "—", rating: 0, suggestedToHire: "—", isNew: true,
  },
  {
    id: 8, student: "Tom Bradley", email: "t.bradley@university.edu", initials: "TB", program: "Occupational Therapy", site: "Valley Health",
    siteAddress: "4646 N Marine Dr, Chicago, IL", status: "under-review", start: "04/03/2026", duration: "10 wks", supervisor: "Dr. Wong",
    placementPhase: "upcoming", internship: "Rehabilitation OT", specialization: "Neuro", compliance: "Review", daysUntilStart: 10,
    readiness: "In review", progressWeeksDone: 0, progressWeeksTotal: 10, endDate: "06/12/2026", lastCheckin: "—",
    completionDate: "—", finalStatus: "—", rating: 0, suggestedToHire: "—",
  },
  {
    id: 9, student: "Lena Fischer", email: "l.fischer@school.edu", initials: "LF", program: "Nursing", site: "Westside Clinic",
    siteAddress: "2525 S Michigan Ave, Chicago, IL", status: "confirmed", start: "03/18/2026", duration: "12 wks", supervisor: "Dr. Santos",
    placementPhase: "ongoing", internship: "Primary Care RN", specialization: "Family Practice", compliance: "Complete", daysUntilStart: 0,
    readiness: "Ready", progressWeeksDone: 8, progressWeeksTotal: 12, endDate: "06/10/2026", lastCheckin: "Mar 24, 2026",
    completionDate: "—", finalStatus: "—", rating: 0, suggestedToHire: "—",
  },
  {
    id: 10, student: "Omar Hassan", email: "o.hassan@college.edu", initials: "OH", program: "Physical Therapy", site: "Metro Rehab",
    siteAddress: "250 E Superior St, Chicago, IL", status: "pending", start: "04/21/2026", duration: "8 wks", supervisor: "Dr. Kim",
    placementPhase: "upcoming", internship: "Neurologic PT", specialization: "Neuro Rehab", compliance: "Pending", daysUntilStart: 28,
    readiness: "Ready", progressWeeksDone: 0, progressWeeksTotal: 8, endDate: "06/16/2026", lastCheckin: "—",
    completionDate: "—", finalStatus: "—", rating: 0, suggestedToHire: "—",
  },
  {
    id: 11, student: "Nina Patel", email: "n.patel@university.edu", initials: "NP", program: "Social Work", site: "Hope Community Ctr",
    siteAddress: "3517 W Arthington St, Chicago, IL", status: "confirmed", start: "03/25/2026", duration: "10 wks", supervisor: "Ms. Torres",
    placementPhase: "ongoing", internship: "School Social Work", specialization: "Youth Services", compliance: "Complete", daysUntilStart: 0,
    readiness: "Ready", progressWeeksDone: 4, progressWeeksTotal: 10, endDate: "06/03/2026", lastCheckin: "Mar 19, 2026",
    completionDate: "—", finalStatus: "—", rating: 0, suggestedToHire: "—",
  },
  {
    id: 12, student: "David Okonkwo", email: "d.okonkwo@school.edu", initials: "DO", program: "Nursing", site: "Lakeside Hospital",
    siteAddress: "4440 N Clark St, Chicago, IL", status: "under-review", start: "04/10/2026", duration: "12 wks", supervisor: "Unassigned",
    placementPhase: "upcoming", internship: "Emergency Dept RN", specialization: "Emergency", compliance: "Pending", daysUntilStart: 17,
    readiness: "At risk", progressWeeksDone: 0, progressWeeksTotal: 12, endDate: "07/03/2026", lastCheckin: "—",
    completionDate: "—", finalStatus: "—", rating: 0, suggestedToHire: "—",
  },
  {
    id: 13, student: "Alex Morgan", email: "a.morgan@college.edu", initials: "AM", program: "Nursing", site: "City Medical Center",
    siteAddress: "1400 N Lake Shore Dr, Chicago, IL", status: "completed", start: "01/06/2026", duration: "12 wks", supervisor: "Dr. Patel",
    placementPhase: "completed", internship: "Med-Surg Clinical II", specialization: "Adult Health", compliance: "Complete", daysUntilStart: 0,
    readiness: "Ready", progressWeeksDone: 12, progressWeeksTotal: 12, endDate: "03/30/2026", lastCheckin: "Mar 28, 2026",
    completionDate: "03/30/2026", finalStatus: "Passed", rating: 4.8, suggestedToHire: "Yes",
  },
  {
    id: 14, student: "Jordan Lee", email: "j.lee@university.edu", initials: "JL", program: "Physical Therapy", site: "Metro Rehab",
    siteAddress: "250 E Superior St, Chicago, IL", status: "completed", start: "11/04/2025", duration: "8 wks", supervisor: "Dr. Kim",
    placementPhase: "completed", internship: "Inpatient PT", specialization: "Acute Care", compliance: "Complete", daysUntilStart: 0,
    readiness: "Ready", progressWeeksDone: 8, progressWeeksTotal: 8, endDate: "12/30/2025", lastCheckin: "Dec 28, 2025",
    completionDate: "12/30/2025", finalStatus: "Passed", rating: 4.2, suggestedToHire: "Yes",
  },
  {
    id: 15, student: "Sam Rivera", email: "s.rivera@school.edu", initials: "SR", program: "Occupational Therapy", site: "Bay Area Health",
    siteAddress: "3100 Telegraph Ave, Oakland, CA", status: "completed", start: "10/01/2025", duration: "10 wks", supervisor: "Dr. Nguyen",
    placementPhase: "completed", internship: "Hand Therapy OT", specialization: "Hand Therapy", compliance: "Complete", daysUntilStart: 0,
    readiness: "Ready", progressWeeksDone: 10, progressWeeksTotal: 10, endDate: "12/10/2025", lastCheckin: "Dec 08, 2025",
    completionDate: "12/10/2025", finalStatus: "Incomplete", rating: 3.5, suggestedToHire: "No",
  },
  {
    id: 16, student: "Taylor Brooks", email: "t.brooks@college.edu", initials: "TB", program: "Nursing", site: "Sunrise Hospital",
    siteAddress: "5775 Wayzata Blvd, Minneapolis, MN", status: "completed", start: "09/02/2025", duration: "12 wks", supervisor: "Dr. Torres",
    placementPhase: "completed", internship: "Labor & Delivery", specialization: "Women's Health", compliance: "Complete", daysUntilStart: 0,
    readiness: "Ready", progressWeeksDone: 12, progressWeeksTotal: 12, endDate: "11/25/2025", lastCheckin: "Nov 22, 2025",
    completionDate: "11/25/2025", finalStatus: "Passed", rating: 5, suggestedToHire: "Yes",
  },
]

/** Distinct sorted values for filter dropdowns (list UI) on text-like columns. */
export function uniquePlacementFieldOptions(
  key: keyof Placement,
): { value: string; label: string }[] {
  const set = new Set<string>()
  for (const r of ALL_PLACEMENTS) {
    const raw = r[key]
    if (raw === undefined || raw === null) continue
    const v = typeof raw === "number" ? String(raw) : String(raw).trim()
    if (!v || v === "—") continue
    set.add(v)
  }
  return [...set].sort((a, b) => a.localeCompare(b)).map(v => ({ value: v, label: v }))
}

export function placementsForPhase(
  phase: "all" | PlacementPhase,
): Placement[] {
  if (phase === "all") return ALL_PLACEMENTS
  return ALL_PLACEMENTS.filter((p) => p.placementPhase === phase)
}

export function getPlacementById(id: number): Placement | undefined {
  return ALL_PLACEMENTS.find(p => p.id === id)
}
