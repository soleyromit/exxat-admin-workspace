export type Review = {
  author: string
  role: string
  institution: string
  date: string
  rating: number
  text: string
}

export type ReleaseNote = {
  version: string
  date: string
  notes: string[]
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
      reviews: Review[]
      releaseNotes: ReleaseNote[]
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
      reviews: Review[]
      releaseNotes: ReleaseNote[]
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
    reviews: [
      {
        author: 'Dr. Sarah Chen',
        role: 'Course Director',
        institution: 'UChicago Nursing',
        date: 'May 2026',
        rating: 5,
        text: 'Excellent for high-stakes exam management. The question bank organization and Bloom\'s tagging make curriculum alignment straightforward.',
      },
      {
        author: 'Prof. Mark Rivera',
        role: 'Assessment Lead',
        institution: 'Johns Hopkins',
        date: 'April 2026',
        rating: 4,
        text: 'Solid platform overall. The analytics dashboard helps identify learning gaps early in the semester.',
      },
      {
        author: 'Dr. Priya Nair',
        role: 'Faculty Developer',
        institution: 'UCSF School of Nursing',
        date: 'March 2026',
        rating: 5,
        text: 'The AI gap analysis is a game changer for our program review cycle.',
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
          'Confidence-based marking (Aarti-championed)',
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
    reviews: [
      {
        author: 'Dr. James Park',
        role: 'Clinical Education Director',
        institution: 'Stanford Medicine',
        date: 'April 2026',
        rating: 5,
        text: 'PCE has transformed our placement coordination. What used to take our team weeks now takes days.',
      },
      {
        author: 'Dr. Amara Osei',
        role: 'Program Director',
        institution: 'Emory PA Program',
        date: 'March 2026',
        rating: 4,
        text: 'The preceptor evaluation system is robust. Would love more reporting customization options.',
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
    reviews: [
      {
        author: 'Dr. Lisa Thompson',
        role: 'Clerkship Coordinator',
        institution: 'Michigan Medicine',
        date: 'April 2026',
        rating: 4,
        text: 'The ICD-10 search makes encounter logging fast. Students complete logs in under 2 minutes.',
      },
    ],
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
    reviews: [
      {
        author: 'Prof. Elena Santos',
        role: 'Clinical Skills Lab Director',
        institution: 'Duke Nursing',
        date: 'March 2026',
        rating: 5,
        text: 'Finally a skills tracking solution that integrates with our existing Exxat workflows. The sign-off process is seamless.',
      },
    ],
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
    reviews: [
      {
        author: 'Dr. Kevin Walsh',
        role: 'Academic Advisor',
        institution: 'Columbia Nursing',
        date: 'February 2026',
        rating: 4,
        text: 'Great for personalizing remediation plans. The collaborative editing feature saves back-and-forth emails.',
      },
    ],
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
    reviews: [],
    releaseNotes: [],
    comingSoon: true,
  },
]
