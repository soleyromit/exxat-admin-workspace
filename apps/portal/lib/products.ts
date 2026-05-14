export type Resource = {
  title: string
  kind: 'webinar' | 'video' | 'documentation' | 'support'
  date?: string
  duration?: string
  host?: string
  description: string
  url: string
  status: 'upcoming' | 'available'
}

export type ReleaseNote = {
  version: string
  date: string
  notes: string[]
}

export type RoadmapItem = {
  title: string
  quarter: string
  description?: string
  status: 'planned' | 'in-progress'
}

export type Product =
  | {
      id: string
      name: string
      description: string
      icon: string
      colorKey: string
      version: string
      category: string
      features: string[]
      universities: string[]
      resources: Resource[]
      releaseNotes: ReleaseNote[]
      roadmap: RoadmapItem[]
      adminUrl: string
      studentUrl: string
      extra?: { label: string; url: string }
      comingSoon?: never
    }
  | {
      id: string
      name: string
      description: string
      icon: string
      colorKey: string
      version: string
      category: string
      features: string[]
      universities: string[]
      resources: Resource[]
      releaseNotes: ReleaseNote[]
      roadmap: RoadmapItem[]
      comingSoon: true
      adminUrl?: never
      studentUrl?: never
      extra?: never
    }

export const PRODUCTS: Product[] = [
  {
    id: 'exam-management',
    name: 'Exam Management',
    description: 'Build question banks, configure assessments, and review student performance.',
    icon: 'fa-pen-to-square',
    colorKey: 'em',
    version: '2.4',
    category: 'Didactic → Clinical',
    features: [
      'Adaptive question bank with Bloom\'s taxonomy tagging',
      'Question types: MCQ, True/False, Short Answer, Essay',
      'Proctored exam delivery with lockdown browser mode',
      'Real-time performance analytics and reporting',
      'AI-powered gap analysis at the assessment level',
      'Full-text search across all question fields',
    ],
    universities: [
      'University of Chicago Nursing School',
      'Johns Hopkins School of Medicine',
      'NYU Rory Meyers College of Nursing',
      'Emory University Nell Hodgson Woodruff',
      'UCSF School of Nursing',
      'Vanderbilt University School of Nursing',
    ],
    resources: [
      {
        title: 'Building Effective Question Banks with Bloom\'s Taxonomy',
        kind: 'webinar' as const,
        date: 'June 10, 2026',
        duration: '45 min',
        host: 'Exxat Product Team',
        description: 'Learn how to structure question banks for maximum curriculum alignment using Bloom\'s taxonomy tagging and cognitive level analysis.',
        url: '#',
        status: 'upcoming' as const,
      },
      {
        title: 'AI Gap Analysis: Turning Assessment Data into Curriculum Insights',
        kind: 'video' as const,
        date: 'May 15, 2026',
        duration: '60 min',
        host: 'Exxat Product Team',
        description: 'A deep-dive into the AI-powered gap analysis feature — how it works, what it surfaces, and how programs are using it in their review cycles.',
        url: '#',
        status: 'available' as const,
      },
      {
        title: 'Exam Management Help Center',
        kind: 'support' as const,
        description: 'Browse articles, FAQs, and step-by-step guides for question bank management, assessment setup, and analytics.',
        url: '#',
        status: 'available' as const,
      },
    ],
    releaseNotes: [
      {
        version: '2.4',
        date: 'May 10, 2026',
        notes: [
          'AI gap analysis at the assessment level',
          'Full-text search across all question fields',
          'Toast notifications on all major actions',
          'Bulk folder management improvements',
        ],
      },
      {
        version: '2.3',
        date: 'April 15, 2026',
        notes: [
          'Confidence-based marking',
          'Question set improvements',
          'Filter sheet enhancements',
          'Performance and stability fixes',
        ],
      },
      {
        version: '2.2',
        date: 'March 28, 2026',
        notes: [
          'Assessment Builder redesign',
          'Lockdown review session',
          'Question bank folder tree improvements',
        ],
      },
    ],
    roadmap: [
      {
        title: 'NCLEX-style question types',
        quarter: 'Q3 2026',
        description: 'SBA, bow-tie, drag-and-drop, and hot-spot formats for NCLEX-RN alignment.',
        status: 'in-progress' as const,
      },
      {
        title: 'AI-generated question drafts',
        quarter: 'Q3 2026',
        description: 'Generate first-draft questions from learning objectives using AI.',
        status: 'planned' as const,
      },
      {
        title: 'Cross-program question bank sharing',
        quarter: 'Q4 2026',
        description: 'Share curated question sets between programs within an institution.',
        status: 'planned' as const,
      },
      {
        title: 'Student performance prediction',
        quarter: 'Q1 2027',
        description: 'Flag students at risk before high-stakes assessments occur.',
        status: 'planned' as const,
      },
    ],
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
    description: 'Manage practice and clinical experience placements, evaluations, and hours.',
    icon: 'fa-stethoscope',
    colorKey: 'pce',
    version: '3.1',
    category: 'Clinical',
    features: [
      'Placement matching between students and clinical sites',
      'Preceptor evaluation workflows',
      'Clinical hours tracking and attestation',
      'Competency milestone tracking',
      'Site coordinator portal',
      'Automated compliance reporting',
    ],
    universities: [
      'Emory PA Program',
      'Stanford School of Medicine',
      'Northwestern Feinberg School of Medicine',
      'University of Pennsylvania Medicine',
      'Duke University Health System',
    ],
    resources: [
      {
        title: 'Reducing Placement Coordination Time with PCE',
        kind: 'webinar' as const,
        date: 'April 22, 2026',
        duration: '40 min',
        host: 'Exxat Product Team',
        description: 'See how programs have cut placement coordination from weeks to days using automated matching, bulk evaluations, and the site coordinator portal.',
        url: '#',
        status: 'available' as const,
      },
    ],
    releaseNotes: [
      {
        version: '3.1',
        date: 'May 5, 2026',
        notes: [
          'Master-list entity views for all placement types',
          'Bulk evaluation send improvements',
          'Site performance reporting dashboard',
        ],
      },
      {
        version: '3.0',
        date: 'March 20, 2026',
        notes: [
          'Complete UI redesign on Exxat-DS',
          'New competency milestone tracking',
          'Automated hours attestation workflows',
        ],
      },
    ],
    roadmap: [
      {
        title: 'Automated preceptor matching by specialty',
        quarter: 'Q3 2026',
        description: 'Match students to preceptors based on specialty, availability, and prior rotations.',
        status: 'in-progress' as const,
      },
      {
        title: 'Real-time site capacity dashboard',
        quarter: 'Q4 2026',
        description: 'Live view of placement capacity across all clinical sites for a given term.',
        status: 'planned' as const,
      },
    ],
    adminUrl: process.env.NEXT_PUBLIC_PCE_ADMIN_URL ?? 'http://localhost:3005',
    studentUrl: process.env.NEXT_PUBLIC_PCE_STUDENT_URL ?? 'http://localhost:3006',
  },
  {
    id: 'patient-log',
    name: 'Patient Log',
    description: 'Track and validate student patient encounters across clinical rotations.',
    icon: 'fa-clipboard-list',
    colorKey: 'pl',
    version: '1.0',
    category: 'Clinical',
    features: [
      'ICD-10 diagnosis code search and tagging',
      'Encounter type and procedure logging',
      'Faculty validation and sign-off workflows',
      'Bulk log review tools',
      'Competency mapping to logged encounters',
    ],
    universities: [
      'Michigan Medicine',
      'Mayo Clinic College of Medicine',
      'Cleveland Clinic Lerner College',
    ],
    resources: [],
    roadmap: [],
    releaseNotes: [
      {
        version: '1.0',
        date: 'April 1, 2026',
        notes: [
          'Initial release of Patient Log',
          'ICD-10 code search integration',
          'Faculty validation workflow',
          'Bulk review dashboard',
        ],
      },
    ],
    adminUrl: process.env.NEXT_PUBLIC_PATIENT_LOG_ADMIN_URL ?? 'http://localhost:3003',
    studentUrl: process.env.NEXT_PUBLIC_PATIENT_LOG_STUDENT_URL ?? 'http://localhost:3004',
  },
  {
    id: 'skills-checklist',
    name: 'Skills Checklist',
    description: 'Define, assign, and sign off on clinical skills competency requirements.',
    icon: 'fa-list-check',
    colorKey: 'sc',
    version: '1.0',
    category: 'Clinical → Culminating',
    features: [
      'Custom skills checklist templates per program',
      'Faculty sign-off with digital attestation',
      'Remediation flagging and tracking',
      'Progress dashboard per student',
      'Export to PDF for accreditation reports',
    ],
    universities: [
      'Duke University School of Nursing',
      'Vanderbilt University School of Nursing',
      'The Ohio State University BSN Program',
    ],
    resources: [],
    roadmap: [],
    releaseNotes: [
      {
        version: '1.0',
        date: 'March 15, 2026',
        notes: [
          'Initial release of Skills Checklist',
          'Digital sign-off workflow',
          'Remediation tracking',
          'Program-level analytics',
        ],
      },
    ],
    adminUrl: process.env.NEXT_PUBLIC_SKILLS_CHECKLIST_ADMIN_URL ?? 'http://localhost:3007',
    studentUrl: process.env.NEXT_PUBLIC_SKILLS_CHECKLIST_STUDENT_URL ?? 'http://localhost:3008',
  },
  {
    id: 'learning-contracts',
    name: 'Learning Contracts',
    description: 'Create and track individualized student learning agreements and goals.',
    icon: 'fa-handshake',
    colorKey: 'lc',
    version: '1.0',
    category: 'Clinical',
    features: [
      'Collaborative contract creation between student and advisor',
      'Goal tracking with milestone check-ins',
      'Multi-party approval workflows',
      'PDF export for records',
      'Integration with PCE placement data',
    ],
    universities: [
      'Columbia University School of Nursing',
      'UNC Gillings School of Global Public Health',
      'Georgetown School of Medicine',
    ],
    resources: [],
    roadmap: [],
    releaseNotes: [
      {
        version: '1.0',
        date: 'February 20, 2026',
        notes: [
          'Initial release of Learning Contracts',
          'Collaborative contract editor',
          'Approval workflow engine',
          'PDF export',
        ],
      },
    ],
    adminUrl: process.env.NEXT_PUBLIC_LEARNING_CONTRACTS_ADMIN_URL ?? 'http://localhost:3009',
    studentUrl: process.env.NEXT_PUBLIC_LEARNING_CONTRACTS_STUDENT_URL ?? 'http://localhost:3010',
  },
  {
    id: 'faas',
    name: 'FaaS 2.0',
    description: 'Build and deploy custom form workflows across any program surface.',
    icon: 'fa-puzzle-piece',
    colorKey: 'faas',
    version: '—',
    category: 'Cross-stage',
    features: [
      'Visual drag-and-drop form builder',
      'Conditional logic and branching',
      'Multi-step workflow orchestration',
      'Integration API for all Exxat products',
      'Custom branding per institution',
    ],
    universities: [],
    resources: [],
    roadmap: [],
    releaseNotes: [],
    comingSoon: true,
  },
]
