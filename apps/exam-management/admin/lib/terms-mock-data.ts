/**
 * Terms base entity — mock data for the Terms module (Exam Management admin).
 *
 * 10 terms spanning past (Completed), current (Active), and future (Upcoming).
 * When Canvas LMS integration is live, these records are imported automatically
 * and fields are locked — the UI must surface an info banner for that state.
 */

export interface Term {
  id: string
  label: string        // e.g. "Fall 2025"
  academicYear: string // e.g. "2025-2026"
  startDate: string    // ISO date string (YYYY-MM-DD)
  endDate: string      // ISO date string (YYYY-MM-DD)
  status: 'active' | 'upcoming' | 'completed'
  sisTermId?: string   // Canvas SIS Term ID — auto-populated when Canvas active
  notes?: string
}

export const terms: Term[] = [
  {
    id: 'term-001',
    label: 'Spring 2024',
    academicYear: '2023-2024',
    startDate: '2024-01-08',
    endDate: '2024-05-10',
    status: 'completed',
    notes: 'First term fully tracked in Exam Management.',
  },
  {
    id: 'term-002',
    label: 'Summer 2024',
    academicYear: '2023-2024',
    startDate: '2024-05-20',
    endDate: '2024-08-09',
    status: 'completed',
  },
  {
    id: 'term-003',
    label: 'Fall 2024',
    academicYear: '2024-2025',
    startDate: '2024-08-26',
    endDate: '2024-12-13',
    status: 'completed',
    notes: 'Pilot cohort for competency-based assessments.',
  },
  {
    id: 'term-004',
    label: 'Winter 2025',
    academicYear: '2024-2025',
    startDate: '2025-01-06',
    endDate: '2025-03-21',
    status: 'completed',
  },
  {
    id: 'term-005',
    label: 'Spring 2025',
    academicYear: '2024-2025',
    startDate: '2025-01-13',
    endDate: '2025-05-09',
    status: 'completed',
    notes: 'Expanded to all nursing cohorts.',
  },
  {
    id: 'term-006',
    label: 'Summer 2025',
    academicYear: '2024-2025',
    startDate: '2025-05-19',
    endDate: '2025-08-08',
    status: 'completed',
  },
  {
    id: 'term-007',
    label: 'Fall 2025',
    academicYear: '2025-2026',
    startDate: '2025-08-25',
    endDate: '2025-12-12',
    status: 'completed',
  },
  {
    id: 'term-008',
    label: 'Spring 2026',
    academicYear: '2025-2026',
    startDate: '2026-01-12',
    endDate: '2026-05-08',
    status: 'active',
    notes: 'Current term — AI gap analysis in use across NURS 210 and NURS 315.',
  },
  {
    id: 'term-009',
    label: 'Summer 2026',
    academicYear: '2025-2026',
    startDate: '2026-05-18',
    endDate: '2026-08-07',
    status: 'upcoming',
  },
  {
    id: 'term-010',
    label: 'Fall 2026',
    academicYear: '2026-2027',
    startDate: '2026-08-24',
    endDate: '2026-12-11',
    status: 'upcoming',
    notes: 'Lockdown browser rollout planned for this term.',
  },
]
