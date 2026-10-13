/**
 * Route registry for the admin app (docs/ux/03 §4, docs/build/contracts/00-cross-cutting.md §2).
 *
 * `SKILLS_BASE` is the module root. Placement of the module (standalone app vs a section of
 * Prism admin) is OPEN (OD-P1), so every route is written as `${SKILLS_BASE}/...` and the
 * decision becomes a one-line change here.
 */
export const SKILLS_BASE = ""

export const ROUTES = {
  /** HY-01 Home (Layout 2, docs/build/contracts/HY-01-home.md): the landing page, setup card plus attention list. */
  home: `${SKILLS_BASE}/home`,
  /** Attainment replaces the prototype's Overview. Student and evidence levels are query params (?student=, ?skill=, ?evaluation=). */
  attainment: `${SKILLS_BASE}/attainment`,
  /** @deprecated alias of `attainment` (kept so existing links keep compiling). */
  overview: `${SKILLS_BASE}/attainment`,
  skills: `${SKILLS_BASE}/skills/library`,
  /** Add skill, Configure and Import are dialogs on the library page (dialog URL contract, components/library/dialog-bridge.ts). */
  skillNew: `${SKILLS_BASE}/skills/library?dialog=add`,
  skillConfigure: (skillId: string) => `${SKILLS_BASE}/skills/library?dialog=configure&skill=${skillId}`,
  /** Kits: a tab on the Skills page (?tab=kits). Groups of skills configured with one explicitly chosen model (hybrid step 3, docs/design/brief-v2.md Direction A). */
  kits: `${SKILLS_BASE}/skills/library?tab=kits`,
  import: `${SKILLS_BASE}/skills/library?dialog=import`,
  /** Admin course mapping now lives at /courses (the student page is /student). */
  courses: `${SKILLS_BASE}/courses`,
  /** @deprecated alias of `courses`. */
  courseMapping: `${SKILLS_BASE}/courses`,
  courseMappingOffering: (offeringId: string) => `${SKILLS_BASE}/courses/${offeringId}`,
  reviews: `${SKILLS_BASE}/reviews`,
  /** @deprecated alias of `reviews`. */
  review: `${SKILLS_BASE}/reviews`,
  reviewItem: (submissionId: string) => `${SKILLS_BASE}/reviews/${submissionId}`,
  attainmentStudent: (studentId: string) => `${SKILLS_BASE}/attainment?student=${studentId}`,
  attainmentEvidence: (studentId: string, skillId: string) => `${SKILLS_BASE}/attainment?student=${studentId}&skill=${skillId}`,
  /** @deprecated use attainmentStudent. */
  overviewStudent: (studentId: string) => `${SKILLS_BASE}/attainment?student=${studentId}`,
  /** @deprecated use attainmentEvidence. */
  overviewEvidence: (studentId: string, skillId: string) => `${SKILLS_BASE}/attainment?student=${studentId}&skill=${skillId}`,
  importReview: (_batchId: string) => `${SKILLS_BASE}/skills/library?dialog=import`,
  devState: `/dev/state`,
} as const

/** Student routes (docs/ux/03 §4). S-13 (send for review) is a sheet over S-12; its route exists for deep links. */
export const STUDENT_ROUTES = {
  /** R5: the prototype's single "Student View" page. Course, send and history are query params; the old /courses/... URLs redirect here. */
  courses: `/student`,
  courseSkills: (offeringId: string) => `/student?course=${offeringId}`,
  send: (offeringId: string) => `/student?course=${offeringId}&send=1`,
  history: (offeringId: string, skillId: string) => `/student?course=${offeringId}&history=${skillId}`,
  mySkills: `/my-skills`,
  mySkill: (skillId: string) => `/my-skills/${skillId}`,
} as const

/**
 * In-shell views from the prototype's sidebar (docs/source/prototype-text-dump.txt): "Student View" and
 * "Preceptor Evaluation" sit beside the admin pages in one sidebar. /student is an alias of the student
 * course view; /preceptor is the in-shell mailbox plus form, the demo of what an emailed link opens. The real
 * shell-free link route stays /e/[token] (EV-01).
 */
export const PREVIEW_ROUTES = {
  student: `/student`,
  preceptor: `/preceptor`,
} as const

/** Evaluator route (S-16): tokenised, no shell, no navigation (EV-01). The token is the only identifier in the URL. */
export const EVALUATOR_ROUTES = {
  evaluate: (token: string) => `/e/${token}`,
} as const

/**
 * Placeholder metadata: title and subtitle are quoted from docs/ux/09 (S-xx sections), contract
 * is the confirmed surface contract each page will be built from. No feature logic lives here.
 */
export interface PlaceholderMeta {
  surface: string
  title: string
  subtitle: string
  contract: string
}

export const PLACEHOLDERS = {
  kits: {
    surface: "HY-02",
    title: "Kits",
    subtitle: "Group skills and give each group one evaluation model",
    contract: "docs/design/brief-v2.md", // Direction A: Sort into kits
  },
  overview: {
    surface: "S-01",
    title: "Attainment",
    subtitle: "Skills attainment by student, by skill and by tag",
    contract: "docs/build/contracts/S-01-overview.md",
  },
  skills: {
    surface: "S-04",
    title: "Skills library",
    subtitle: "The program's skills, plus the categories, tags and settings that organise them",
    contract: "docs/build/contracts/S-04-library-skills-list.md",
  },
  categories: {
    surface: "S-05a",
    title: "Categories",
    subtitle: "Categories are defined by your program. A skill belongs to at most one category.",
    contract: "docs/build/contracts/S-05a-library-categories.md",
  },
  tags: {
    surface: "S-05b",
    title: "Tags",
    subtitle: "Tags are optional and cut across categories. A skill can have any number of tags.",
    contract: "docs/build/contracts/S-05b-library-tags.md",
  },
  settings: {
    surface: "S-06",
    title: "Clinical settings",
    subtitle: "Students choose from these when they record clinical evidence.",
    contract: "docs/build/contracts/S-06-library-clinical-settings.md",
  },
  labInstructors: {
    surface: "S-07",
    title: "Lab instructors",
    subtitle:
      "Lab instructors are not Prism users. Only a name and email are stored, and no account is created.",
    contract: "docs/build/contracts/S-07-library-lab-instructors.md",
  },
  import: {
    surface: "S-08",
    title: "Import skills",
    subtitle: "Bring in a list you already hold instead of entering skills one at a time.",
    contract: "docs/build/contracts/S-08-import.md",
  },
  skillNew: {
    surface: "S-09",
    title: "Add skill",
    subtitle: "You define how this skill is evaluated and what achievement requires.",
    contract: "docs/build/contracts/S-09-skill-configure.md",
  },
  skillConfigure: {
    surface: "S-09",
    title: "Configure skill",
    subtitle: "You define how this skill is evaluated and what achievement requires.",
    contract: "docs/build/contracts/S-09-skill-configure.md",
  },
  courseMapping: {
    surface: "S-10",
    title: "Course mapping",
    subtitle: "Set which skills are mandatory for each clinical course offering",
    contract: "docs/build/contracts/S-10-course-mapping.md",
  },
  overviewStudent: {
    surface: "S-02",
    title: "Student",
    subtitle: "Skills attainment for one student",
    contract: "docs/build/contracts/S-02-student-drilldown.md",
  },
  overviewEvidence: {
    surface: "S-03",
    title: "Evidence",
    subtitle: "The evaluations behind one student's skill record",
    contract: "docs/build/contracts/S-03-evidence-ledger-and-evaluation-detail.md",
  },
  importReview: {
    surface: "S-08",
    title: "Review imported skills",
    subtitle: "Edit, exclude or rename anything first.",
    contract: "docs/build/contracts/S-08-import.md",
  },
  courseMappingOffering: {
    surface: "S-10",
    title: "Course mapping",
    subtitle: "Set which skills are mandatory for each clinical course offering",
    contract: "docs/build/contracts/S-10-course-mapping.md",
  },
  reviewItem: {
    surface: "S-11",
    title: "Review and approve",
    subtitle: "Approve submitted evaluations for skills that require it",
    contract: "docs/build/contracts/S-11-review-and-approve.md",
  },
  courses: {
    surface: "S-12",
    title: "Course skills",
    subtitle: "Choose a course to see the skills it expects",
    contract: "docs/build/contracts/S-12-student-course-skills.md",
  },
  courseSkills: {
    surface: "S-12",
    title: "Skills for this course",
    subtitle: "Mandatory skills are required for this course. Non-mandatory skills are available but not required.",
    contract: "docs/build/contracts/S-12-student-course-skills.md",
  },
  send: {
    surface: "S-13",
    title: "Send for review",
    subtitle: "A sheet over the course skills list",
    contract: "docs/build/contracts/S-13-student-send-for-review.md",
  },
  history: {
    surface: "S-14",
    title: "Your submission history",
    subtitle: "Every attempt for this skill, across all your courses",
    contract: "docs/build/contracts/S-14-student-skill-history.md",
  },
  mySkills: {
    surface: "S-15",
    title: "My skills",
    subtitle: "Your record for every skill, across all your courses",
    contract: "docs/build/contracts/S-15-student-my-skills.md",
  },
  evaluate: {
    surface: "S-16",
    title: "Evaluate",
    subtitle: "Complete the evaluation your program set up. You will not be asked to sign in.",
    contract: "docs/build/contracts/S-16-evaluator-form.md",
  },
  review: {
    surface: "S-11",
    title: "Review and approve",
    subtitle: "Approve submitted evaluations for skills that require it",
    contract: "docs/build/contracts/S-11-review-and-approve.md",
  },
} satisfies Record<string, PlaceholderMeta>
