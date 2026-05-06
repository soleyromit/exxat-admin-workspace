/**
 * UNIFIED PERSONAS — single source of truth for who is using the app.
 *
 * Selecting a persona reshapes the entire admin: nav, sidebar, courses scope,
 * QB folder access, trust-level affordances, page filtering. Replaces the
 * previously-split `useFacultySession().role` + `useQB().currentPersona`.
 *
 * IDs are stable: the four faculty persona IDs (thompson/chen/patel/kim) are
 * referenced as `creator`, `lastEditedBy`, and `collaborators` throughout
 * lib/qb-mock-data.ts — do not rename them.
 *
 * Cast (Aarti walkthrough, May 7):
 *   - Hannah Park        — Admin (program coordinator, full system access)
 *   - Dr. Sarah Thompson — Faculty Senior (chair, all courses editor)
 *   - Dr. Steven Chen    — Faculty Mid (course director on PHAR101 + BIOL201)
 *   - Dr. James Patel    — Faculty Junior (instructor on PHAR101 + BIOL201)
 *   - Dr. Marcus Kim     — Faculty Junior (instructor on SKEL101)
 */

export type PersonaRole = 'admin' | 'faculty'
export type AccessLevel = 'editor' | 'viewer'
export type TrustLevel  = 'senior' | 'mid' | 'junior'

/** QB's existing role taxonomy — kept distinct from PersonaRole. */
export type QBRole = 'exam_admin' | 'course_director' | 'instructor'

export interface CourseAccess {
  courseId: string
  level: AccessLevel
}

export interface Persona {
  id: string                     // Stable across QB and session — see header note
  name: string
  title: string                  // "Dr." / "Ms."
  initials: string
  email: string
  department: string
  role: PersonaRole
  /** Drives QB trust-level affordances + auto-approval rules. Senior > Mid > Junior. */
  trustLevel: TrustLevel
  /** QB's role taxonomy — different shape from PersonaRole, kept distinct. */
  qbRole: QBRole
  /** Per-course access. Empty for admins (admins have implicit all-courses-editor access). */
  courses: CourseAccess[]
  /** Avatar tint — CSS custom property reference. */
  color: string
}

export const PERSONAS: Persona[] = [
  {
    id:          'persona-admin',
    name:        'Hannah Park',
    title:       'Ms.',
    initials:    'HP',
    email:       'hannah.park@university.edu',
    department:  'Program Administration',
    role:        'admin',
    trustLevel:  'senior',
    qbRole:      'exam_admin',
    courses:     [],
    color:       'var(--brand-color)',
  },
  {
    id:          'persona-thompson',
    name:        'Sarah Thompson',
    title:       'Dr.',
    initials:    'ST',
    email:       'thompson@university.edu',
    department:  'College of Pharmacy · Chair',
    role:        'faculty',
    trustLevel:  'senior',
    qbRole:      'exam_admin',
    courses: [
      { courseId: 'course-phar101', level: 'editor' },
      { courseId: 'course-biol201', level: 'editor' },
      { courseId: 'course-skel101', level: 'editor' },
    ],
    color:       'var(--chart-1)',
  },
  {
    id:          'persona-chen',
    name:        'Steven Chen',
    title:       'Dr.',
    initials:    'SC',
    email:       'steven.chen@university.edu',
    department:  'College of Pharmacy',
    role:        'faculty',
    trustLevel:  'mid',
    qbRole:      'course_director',
    courses: [
      { courseId: 'course-phar101', level: 'editor' },
      { courseId: 'course-biol201', level: 'editor' },
    ],
    color:       'var(--chart-2)',
  },
  {
    id:          'persona-patel',
    name:        'James Patel',
    title:       'Dr.',
    initials:    'JP',
    email:       'james.patel@university.edu',
    department:  'College of Pharmacy',
    role:        'faculty',
    trustLevel:  'junior',
    qbRole:      'instructor',
    courses: [
      { courseId: 'course-phar101', level: 'editor' },
      { courseId: 'course-biol201', level: 'editor' },
      { courseId: 'course-skel101', level: 'viewer' },
    ],
    color:       'var(--chart-4)',
  },
  {
    id:          'persona-kim',
    name:        'Marcus Kim',
    title:       'Dr.',
    initials:    'MK',
    email:       'marcus.kim@university.edu',
    department:  'School of Kinesiology',
    role:        'faculty',
    trustLevel:  'junior',
    qbRole:      'instructor',
    courses: [
      { courseId: 'course-skel101', level: 'editor' },
    ],
    color:       'var(--chart-5)',
  },
]

/** Default = Admin, so the system boots in admin view. */
export const DEFAULT_PERSONA = PERSONAS[0]

export function findPersona(id: string | undefined | null): Persona | null {
  if (!id) return null
  return PERSONAS.find(p => p.id === id) ?? null
}

export const TRUST_LABEL: Record<TrustLevel, string> = {
  senior: 'Senior',
  mid:    'Mid',
  junior: 'Junior',
}

export const ROLE_LABEL: Record<QBRole, string> = {
  exam_admin:      'Exam Admin',
  course_director: 'Course Director',
  instructor:      'Instructor',
}

export const ROLE_LABEL_PERSONA: Record<PersonaRole, string> = {
  admin:   'Admin',
  faculty: 'Faculty',
}
