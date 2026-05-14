export type Product =
  | {
      id: string
      name: string
      icon: string
      colorKey: string
      adminUrl: string
      studentUrl: string
      extra?: { label: string; url: string }
      comingSoon?: never
    }
  | {
      id: string
      name: string
      icon: string
      colorKey: string
      comingSoon: true
      adminUrl?: never
      studentUrl?: never
      extra?: never
    }

export const PRODUCTS: Product[] = [
  {
    id: 'exam-management',
    name: 'Exam Management',
    icon: 'fa-pen-to-square',
    colorKey: 'em',
    adminUrl: process.env.NEXT_PUBLIC_EXAM_MANAGEMENT_ADMIN_URL ?? 'http://localhost:3001',
    studentUrl: process.env.NEXT_PUBLIC_EXAM_MANAGEMENT_STUDENT_URL ?? 'http://localhost:3002',
    extra: {
      label: 'Assessment Taker',
      url: process.env.NEXT_PUBLIC_EXAM_MANAGEMENT_TAKER_URL ?? 'http://localhost:5174',
    },
  },
  {
    id: 'pce',
    name: 'PCE',
    icon: 'fa-stethoscope',
    colorKey: 'pce',
    adminUrl: process.env.NEXT_PUBLIC_PCE_ADMIN_URL ?? 'http://localhost:3005',
    studentUrl: process.env.NEXT_PUBLIC_PCE_STUDENT_URL ?? 'http://localhost:3006',
  },
  {
    id: 'patient-log',
    name: 'Patient Log',
    icon: 'fa-clipboard-list',
    colorKey: 'pl',
    adminUrl: process.env.NEXT_PUBLIC_PATIENT_LOG_ADMIN_URL ?? 'http://localhost:3003',
    studentUrl: process.env.NEXT_PUBLIC_PATIENT_LOG_STUDENT_URL ?? 'http://localhost:3004',
  },
  {
    id: 'skills-checklist',
    name: 'Skills Checklist',
    icon: 'fa-list-check',
    colorKey: 'sc',
    adminUrl: process.env.NEXT_PUBLIC_SKILLS_CHECKLIST_ADMIN_URL ?? 'http://localhost:3007',
    studentUrl: process.env.NEXT_PUBLIC_SKILLS_CHECKLIST_STUDENT_URL ?? 'http://localhost:3008',
  },
  {
    id: 'learning-contracts',
    name: 'Learning Contracts',
    icon: 'fa-handshake',
    colorKey: 'lc',
    adminUrl: process.env.NEXT_PUBLIC_LEARNING_CONTRACTS_ADMIN_URL ?? 'http://localhost:3009',
    studentUrl: process.env.NEXT_PUBLIC_LEARNING_CONTRACTS_STUDENT_URL ?? 'http://localhost:3010',
  },
  {
    id: 'faas',
    name: 'FaaS 2.0',
    icon: 'fa-puzzle-piece',
    colorKey: 'faas',
    comingSoon: true,
  },
]
