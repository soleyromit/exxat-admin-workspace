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
      subscriptionStatus: 'active' | 'trial' | 'not-subscribed'
      accountManager: { name: string; email: string }
      worksWith?: string[]
      /** Display names of program staff with access — drives the avatar rail. */
      team?: string[]
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
      /** Target launch window shown on Explore cards — keeps "Coming soon" specific per product. */
      expectedLaunch?: string
      adminUrl?: never
      studentUrl?: never
      extra?: never
      subscriptionStatus: 'active' | 'trial' | 'not-subscribed'
      accountManager: { name: string; email: string }
      worksWith?: string[]
      team?: string[]
    }

/** Sales inbox for connect/express-interest CTAs — the sales pipeline itself is offline; the portal only surfaces the CTA. */
export const SALES_EMAIL = 'sales@exxat.com'

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
    subscriptionStatus: 'active',
    accountManager: { name: 'Sarah Chen', email: 'sarah.chen@exxat.com' },
    worksWith: ['compliance-management', 'clinical-experiential-education'],
    team: ['Dana Whitfield', 'Marcus Lee', 'Elena Torres', 'James Park', 'Aisha Patel', 'Noah Brooks'],
  },
  {
    id: 'pce',
    name: 'Surveys & Course Evaluations',
    description: 'Build surveys, distribute course and faculty evaluations, and track responses across terms.',
    icon: 'fa-square-poll-vertical',
    colorKey: 'pce',
    version: '3.1',
    category: 'Cross-stage',
    features: [
      'Survey and course-evaluation template builder',
      'Course, faculty, and student evaluatee mapping',
      'Term-based distribution with automated reminders',
      'Anonymous and identified response modes',
      'Live response and completion tracking',
      'Merged course-and-faculty evaluation reporting',
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
        title: 'Running End-of-Term Course Evaluations at Scale',
        kind: 'webinar' as const,
        date: 'April 22, 2026',
        duration: '40 min',
        host: 'Exxat Product Team',
        description: 'See how programs distribute course and faculty evaluations across every term using reusable templates, automated reminders, and live response tracking.',
        url: '#',
        status: 'available' as const,
      },
    ],
    releaseNotes: [
      {
        version: '3.1',
        date: 'May 5, 2026',
        notes: [
          'Term workspace with Table ⇄ Board views',
          'Bulk survey distribution and reminder flows',
          'Response progress tracking on the term dashboard',
        ],
      },
      {
        version: '3.0',
        date: 'March 20, 2026',
        notes: [
          'Complete UI redesign on Exxat-DS',
          'Anonymous course-evaluation response mode',
          'Survey and evaluation template library',
        ],
      },
    ],
    roadmap: [
      {
        title: 'Reusable question banks for evaluation items',
        quarter: 'Q3 2026',
        description: 'Curate and share standardized question sets across surveys and evaluations.',
        status: 'in-progress' as const,
      },
      {
        title: 'Cross-term evaluation trend analytics',
        quarter: 'Q4 2026',
        description: 'Compare course and faculty evaluation results across terms and cohorts.',
        status: 'planned' as const,
      },
    ],
    adminUrl: process.env.NEXT_PUBLIC_PCE_ADMIN_URL ?? 'http://localhost:3005',
    studentUrl: process.env.NEXT_PUBLIC_PCE_STUDENT_URL ?? 'http://localhost:3006',
    subscriptionStatus: 'active',
    accountManager: { name: 'Marcus Webb', email: 'marcus.webb@exxat.com' },
    team: ['Nora Blake', 'Sam Rivera', 'Grace Chen', 'Tom Okafor'],
  },
  {
    id: 'clinical-experiential-education',
    name: 'Clinical & Experiential Education',
    description: 'Coordinate placements, preceptors, and experiential hours across clinical rotations.',
    icon: 'fa-stethoscope',
    colorKey: 'cee',
    version: '—',
    category: 'Clinical',
    features: [
      'Placement matching between students and clinical sites',
      'Preceptor evaluation and hours attestation workflows',
      'Competency milestone tracking',
      'Site coordinator portal',
    ],
    universities: [],
    resources: [],
    roadmap: [],
    releaseNotes: [],
    comingSoon: true,
    expectedLaunch: 'Q3 2026',
    subscriptionStatus: 'not-subscribed',
    accountManager: { name: 'Marcus Webb', email: 'marcus.webb@exxat.com' },
    worksWith: ['compliance-management', 'exam-management'],
  },
  {
    id: 'curriculum-mapping',
    name: 'Curriculum Mapping',
    description: 'Map courses, objectives, and competencies to accreditation standards across the program.',
    icon: 'fa-diagram-project',
    colorKey: 'cm',
    version: '—',
    category: 'Didactic',
    features: [
      'Course-to-competency alignment matrix',
      'Objective and outcome tagging',
      'Gap and coverage analysis across the curriculum',
      'Standards-mapped reporting',
    ],
    universities: [],
    resources: [],
    roadmap: [],
    releaseNotes: [],
    comingSoon: true,
    expectedLaunch: 'Q4 2026',
    subscriptionStatus: 'not-subscribed',
    accountManager: { name: 'Sarah Chen', email: 'sarah.chen@exxat.com' },
  },
  {
    id: 'compliance-management',
    name: 'Compliance Management',
    description: 'Track immunizations, clearances, and document requirements across students and sites.',
    icon: 'fa-shield-check',
    colorKey: 'cmp',
    version: '—',
    category: 'Cross-stage',
    features: [
      'Immunization and clearance tracking',
      'Document requirement checklists per site',
      'Expiration alerts and renewal reminders',
      'Audit-ready compliance reporting',
    ],
    universities: [],
    resources: [],
    roadmap: [],
    releaseNotes: [],
    comingSoon: true,
    expectedLaunch: 'Q4 2026',
    subscriptionStatus: 'not-subscribed',
    accountManager: { name: 'Priya Nair', email: 'priya.nair@exxat.com' },
    worksWith: ['exam-management', 'clinical-experiential-education'],
  },
  {
    id: 'accreditation-management',
    name: 'Accreditation Management',
    description: 'Assemble self-studies and evidence for accreditation reviews and site visits.',
    icon: 'fa-award',
    colorKey: 'am',
    version: '—',
    category: 'Cross-stage',
    features: [
      'Standard-by-standard evidence collection',
      'Self-study assembly and collaboration',
      'Evidence linking to curriculum and outcomes',
      'Site-visit readiness dashboard',
    ],
    universities: [],
    resources: [],
    roadmap: [],
    releaseNotes: [],
    comingSoon: true,
    expectedLaunch: 'Q1 2027',
    subscriptionStatus: 'not-subscribed',
    accountManager: { name: 'Daniel Osei', email: 'daniel.osei@exxat.com' },
  },
]
