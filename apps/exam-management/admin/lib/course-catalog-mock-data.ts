/**
 * MASTER COURSES — Course Catalog mock data
 *
 * Base entity: Course Catalog (Master Courses)
 * No standalone detail page — add/edit via Sheet drawer.
 *
 * Note: Creating a course offering from a master course auto-generates a
 * Question Bank shell with the same name.
 *
 * See docs/BASE-ENTITIES.md for the universal Master Course field spec.
 */

export interface MasterCourse {
  id: string
  courseNumber: string   // e.g. "PHARM 501"
  courseName: string
  credits: number
  type: 'Core' | 'Elective'
  department: string
  description?: string
  prerequisites?: string
  sisId?: string         // Canvas/SIS Course ID — auto-populated when Canvas active
}

export const masterCourses: MasterCourse[] = [
  // ── Pharmacy ──────────────────────────────────────────────────────────────
  {
    id: 'mc-001',
    courseNumber: 'PHARM 501',
    courseName: 'Pharmacology I',
    credits: 4,
    type: 'Core',
    department: 'Pharmacy',
    description: 'Fundamental principles of drug action, receptor theory, and pharmacokinetics. Covers major drug classes and mechanisms.',
    prerequisites: '',
  },
  {
    id: 'mc-002',
    courseNumber: 'PHARM 502',
    courseName: 'Pharmacology II',
    credits: 4,
    type: 'Core',
    department: 'Pharmacy',
    description: 'Continuation of Pharmacology I. Advanced drug classes including cardiovascular, CNS, and antimicrobial agents.',
    prerequisites: 'PHARM 501',
  },
  {
    id: 'mc-003',
    courseNumber: 'PHARM 601',
    courseName: 'Drug Therapy Management',
    credits: 3,
    type: 'Core',
    department: 'Pharmacy',
    description: 'Evidence-based approaches to drug therapy selection, monitoring, and patient counseling.',
    prerequisites: 'PHARM 501, PHARM 502',
  },
  {
    id: 'mc-004',
    courseNumber: 'PHARM 610',
    courseName: 'Pharmacy Law & Ethics',
    credits: 2,
    type: 'Core',
    department: 'Pharmacy',
    description: 'Federal and state pharmacy regulations, professional standards, and ethical decision-making.',
    prerequisites: '',
  },
  {
    id: 'mc-005',
    courseNumber: 'PHARM 720',
    courseName: 'Compounding & Sterile Products',
    credits: 3,
    type: 'Elective',
    department: 'Pharmacy',
    description: 'Advanced compounding techniques for sterile and non-sterile preparations. Includes lab practicum.',
    prerequisites: 'PHARM 502',
  },
  // ── Nursing ───────────────────────────────────────────────────────────────
  {
    id: 'mc-006',
    courseNumber: 'NURS 210',
    courseName: 'Health Assessment',
    credits: 3,
    type: 'Core',
    department: 'Nursing',
    description: 'Systematic approach to physical and psychosocial health assessment across the lifespan.',
    prerequisites: '',
  },
  {
    id: 'mc-007',
    courseNumber: 'NURS 320',
    courseName: 'Adult Health Nursing I',
    credits: 4,
    type: 'Core',
    department: 'Nursing',
    description: 'Nursing care of adults with acute and chronic medical-surgical conditions.',
    prerequisites: 'NURS 210',
  },
  {
    id: 'mc-008',
    courseNumber: 'NURS 321',
    courseName: 'Adult Health Nursing II',
    credits: 4,
    type: 'Core',
    department: 'Nursing',
    description: 'Advanced nursing care including critical care, perioperative, and oncology nursing.',
    prerequisites: 'NURS 320',
  },
  {
    id: 'mc-009',
    courseNumber: 'NURS 410',
    courseName: 'Pediatric Nursing',
    credits: 3,
    type: 'Core',
    department: 'Nursing',
    description: 'Nursing care of children and adolescents across wellness, acute, and chronic conditions.',
    prerequisites: 'NURS 320',
  },
  {
    id: 'mc-010',
    courseNumber: 'NURS 480',
    courseName: 'Nursing Informatics',
    credits: 2,
    type: 'Elective',
    department: 'Nursing',
    description: 'Use of data, information systems, and technology to support nursing practice and patient care.',
    prerequisites: '',
  },
  // ── Physical Therapy ──────────────────────────────────────────────────────
  {
    id: 'mc-011',
    courseNumber: 'PT 501',
    courseName: 'Anatomy & Kinesiology',
    credits: 4,
    type: 'Core',
    department: 'Physical Therapy',
    description: 'Applied human anatomy with emphasis on the musculoskeletal system and biomechanics of movement.',
    prerequisites: '',
  },
  {
    id: 'mc-012',
    courseNumber: 'PT 510',
    courseName: 'Clinical Pathophysiology',
    credits: 3,
    type: 'Core',
    department: 'Physical Therapy',
    description: 'Pathophysiological mechanisms underlying conditions commonly encountered in physical therapy practice.',
    prerequisites: 'PT 501',
  },
  {
    id: 'mc-013',
    courseNumber: 'PT 601',
    courseName: 'Therapeutic Exercise',
    credits: 4,
    type: 'Core',
    department: 'Physical Therapy',
    description: 'Principles and techniques of therapeutic exercise prescription for musculoskeletal rehabilitation.',
    prerequisites: 'PT 501, PT 510',
  },
  {
    id: 'mc-014',
    courseNumber: 'PT 620',
    courseName: 'Neuromuscular Rehabilitation',
    credits: 3,
    type: 'Core',
    department: 'Physical Therapy',
    description: 'Assessment and treatment of patients with neurological conditions including stroke, TBI, and Parkinson\'s.',
    prerequisites: 'PT 601',
  },
  {
    id: 'mc-015',
    courseNumber: 'PT 710',
    courseName: 'Pediatric PT',
    credits: 3,
    type: 'Elective',
    department: 'Physical Therapy',
    description: 'Physical therapy evaluation and intervention for pediatric populations with developmental disorders.',
    prerequisites: 'PT 601',
  },
  // ── Occupational Therapy ──────────────────────────────────────────────────
  {
    id: 'mc-016',
    courseNumber: 'OT 501',
    courseName: 'Foundations of Occupational Therapy',
    credits: 3,
    type: 'Core',
    department: 'Occupational Therapy',
    description: 'History, theory, and philosophical base of occupational therapy practice. Occupational science and OTPF.',
    prerequisites: '',
  },
  {
    id: 'mc-017',
    courseNumber: 'OT 560',
    courseName: 'Occupational Analysis & Adaptation',
    credits: 4,
    type: 'Core',
    department: 'Occupational Therapy',
    description: 'Activity and task analysis, adaptive equipment, and environmental modification strategies.',
    prerequisites: 'OT 501',
  },
  {
    id: 'mc-018',
    courseNumber: 'OT 650',
    courseName: 'Mental Health OT',
    credits: 3,
    type: 'Elective',
    department: 'Occupational Therapy',
    description: 'OT theory and practice in mental health settings. Recovery model, psychosocial rehabilitation, and group process.',
    prerequisites: 'OT 501',
  },
]
