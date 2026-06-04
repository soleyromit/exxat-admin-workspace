export type StudentStatus = 'on-track' | 'at-risk' | 'completed'

export interface StudentLog extends Record<string, unknown> {
  id: string
  name: string
  program: string
  loggedCount: number
  targetCount: number
  status: StudentStatus
}

export interface EncounterType {
  label: string
  count: number
  percentage: number
}

export const STUDENTS: StudentLog[] = [
  { id: '1',  name: 'Emily Chen',      program: 'Nursing',    loggedCount: 18, targetCount: 20, status: 'on-track'  },
  { id: '2',  name: 'James Wilson',    program: 'PA Studies', loggedCount: 6,  targetCount: 20, status: 'at-risk'   },
  { id: '3',  name: 'Maria Garcia',    program: 'Nursing',    loggedCount: 20, targetCount: 20, status: 'completed' },
  { id: '4',  name: 'Robert Kim',      program: 'PT',         loggedCount: 4,  targetCount: 20, status: 'at-risk'   },
  { id: '5',  name: 'Aisha Patel',     program: 'Nursing',    loggedCount: 15, targetCount: 20, status: 'on-track'  },
  { id: '6',  name: 'Carlos Rivera',   program: 'OT',         loggedCount: 20, targetCount: 20, status: 'completed' },
  { id: '7',  name: 'Sarah Thompson',  program: 'PA Studies', loggedCount: 3,  targetCount: 20, status: 'at-risk'   },
  { id: '8',  name: 'David Lee',       program: 'Nursing',    loggedCount: 17, targetCount: 20, status: 'on-track'  },
  { id: '9',  name: 'Fatima Hasan',    program: 'PT',         loggedCount: 19, targetCount: 20, status: 'on-track'  },
  { id: '10', name: 'Michael Brown',   program: 'OT',         loggedCount: 5,  targetCount: 20, status: 'at-risk'   },
  { id: '11', name: 'Lisa Nakamura',   program: 'Nursing',    loggedCount: 20, targetCount: 20, status: 'completed' },
  { id: '12', name: 'Omar Khalid',     program: 'PA Studies', loggedCount: 12, targetCount: 20, status: 'on-track'  },
]

export const ENCOUNTER_TYPES: EncounterType[] = [
  { label: 'Primary Care', count: 240, percentage: 48 },
  { label: 'Acute Care',   count: 150, percentage: 30 },
  { label: 'Preventive',   count: 90,  percentage: 18 },
  { label: 'Other',        count: 20,  percentage: 4  },
]

export function getKPIs() {
  const total    = STUDENTS.length
  const atRisk   = STUDENTS.filter(s => s.status === 'at-risk').length
  const onTrack  = STUDENTS.filter(s => s.status !== 'at-risk').length
  const avgLogged = Math.round(STUDENTS.reduce((sum, s) => sum + s.loggedCount, 0) / total)
  const target   = STUDENTS[0].targetCount
  return { total, atRisk, onTrack, onTrackPct: Math.round((onTrack / total) * 100), avgLogged, target }
}
