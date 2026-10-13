import type { CriteriaPart } from "@/lib/store/selectors/shared"

// Skills Library copy, EXACTLY as shown in Sankalp's prototype (docs/build/prototype-parity.md cards P-04 and P-05; captures
// docs/source/parity 20-36, 43, 44). Romit (2026-10-08): build the exact mockup, so these strings are verbatim, including the
// prototype's em-dashes. The static voice test (tests/copy/copy.test.ts) lists its modules explicitly and does not include this
// one; the em-dash rule from docs/ux/09 §1 conflicts with "exact copy" and is flagged for Romit in the R1 report.
// Behaviour strings the prototype does not show (loading, errors, OD-26 block) stay in lib/copy/library.ts.

export const r1 = {
  title: "Skills",
  subtitle: "The program's skills, plus the categories, tags and settings that organise them",
  tabsLabel: "Library sections",
  tabs: {
    skills: "Skills",
    kits: "Kits",
    categories: "Categories",
    tags: "Tags",
    settings: "Clinical Settings",
    labInstructors: "Lab Instructors",
  },
  tabLabel: (name: string, n: number) => `${name} (${n})`,

  // ---- Skills tab (P-04)
  search: "Search skills",
  allCategories: "All categories",
  noCategory: "No category",
  allTags: "All tags",
  allStatuses: "All statuses",
  statusActive: "Active",
  statusNeedsConfiguration: "Needs configuration",
  statusInactive: "Inactive",
  import: "Import",
  addSkill: "Add skill",
  columns: ["Skill", "Category", "Evaluation model", "Achievement criteria", "Courses", "Status"] as const,
  /** Evaluation model names exactly as the prototype shows them in the table and wizard. */
  modelNames: { binary: "Overall Binary Outcome", question: "Question-Level Qualitative", scored: "Scored / Likert", demonstration: "Demonstration-Level Outcome" } as const,
  notConfigured: "Not configured",
  dash: "—",
  edit: "Edit",
  configure: "Configure",
  importedBanner: (n: number) => `Added ${n} ${n === 1 ? "skill" : "skills"} to the library. They cannot be used until each one is configured.`,
  configureNow: "Configure them now",
  dismiss: "Dismiss",
  unconfiguredBanner: (n: number) => `${n} ${n === 1 ? "skill in the library has" : "skills in the library have"} not been configured, so ${n === 1 ? "it is" : "they are"} not available for mapping or submission.`,
  showThem: "Show them",

  // ---- Categories (P-05)
  categoriesIntro: "Categories are defined by the program — Prism does not ship a standard taxonomy. A skill sits in at most one category, which is how the library is organised.",
  categoriesCard: { title: "Categories", subtitle: "Each skill belongs to at most one", add: "Add category", columns: ["Category", "Description", "Skills", "Status"] as const },
  // ---- Tags
  tagsIntro: "Tags are optional and cross-cutting. A skill can carry any number of them, and a tag can span categories — that is what lets you report on a theme the category structure does not follow.",
  tagsCard: { title: "Tags", subtitle: "Applied to any number of skills", add: "Add tag", columns: ["Tag", "Description", "Skills", "Status"] as const },
  reach: { title: "Where each tag reaches", subtitle: "A tag spanning several categories is doing the job a category cannot.", summary: (skills: number, cats: number) => `${skills} skills across ${cats} ${cats === 1 ? "category" : "categories"}` },
  // ---- Clinical settings
  settingsIntro:
    "A student on one placement may move between several settings. Recording which one an evaluation came from keeps the evidence meaningful — and lets a program see whether experience is spread across settings or concentrated in one. Applies to clinical evidence only; lab evidence is recorded as lab.",
  settingsCard: { title: "Clinical settings", subtitle: "Offered to students when they record clinical evidence", add: "Add setting", columns: ["Setting", "Evidence recorded", "Status"] as const },
  // ---- Lab instructors
  labIntro:
    "Lab instructors are not Prism users and are not stored elsewhere in the product. This roster holds only what a delegator link needs — a name and an email. Nobody here can sign in, and no account is created. A student can also name someone who is not on this list when sending a skill for review.",
  labCard: { title: "Lab instructors", subtitle: "Offered to students when a skill is signed off in the lab", add: "Add instructor", columns: ["Name", "Email", "Evaluations", "Status"] as const },
  named: { title: "Named by students, not on the roster", subtitle: "Add them if they sign off regularly — otherwise the spelling drifts and reporting splits", add: "Add to roster" },

  // ---- Dialogs (672px)
  dialog: {
    nameLabel: "Name",
    descriptionLabel: "Description",
    emailLabel: "Email",
    statusLabel: "Status",
    namePlaceholder: "Program-defined name",
    settingPlaceholder: "Program-defined setting",
    emailPlaceholder: "name@example.edu",
    cancel: "Cancel",
    save: "Save",
    close: "Close",
    active: "Active",
    inactive: "Inactive",
    category: { addTitle: "Add category", editTitle: "Edit category", subtitle: "Each skill belongs to at most one category." },
    tag: { addTitle: "Add tag", editTitle: "Edit tag", subtitle: "Tags can be applied to any number of skills." },
    setting: { addTitle: "Add clinical setting", editTitle: "Edit clinical setting", subtitle: null, statusHelper: "Inactive settings stay on existing evidence but are not offered to students." },
    lab: {
      addTitle: "Add lab instructor",
      editTitle: "Edit lab instructor",
      subtitle: "Held by the Skills module only. No Prism account is created.",
      emailHelper: "Where the delegator link is sent. Without it they cannot be sent a form.",
    },
  },
} as const

/**
 * "Achievement criteria" cell exactly as the prototype words it (P-04): `5 demonstrations · 1 observed · 1 with assistance ·
 * 3 independent`, `4 demonstrations · 1 performed with supervision · 2 performed independently · 1 in Inpatient`,
 * `3 qualifying evaluations`. Level labels are program-defined and shown lower-cased after their minimum.
 */
export function prototypeCriteria(parts: CriteriaPart[]): string {
  if (parts.length === 0) return "No criteria set"
  return parts
    .map((p) => {
      switch (p.kind) {
        case "required":
          return `${p.n} ${p.noun === "demonstrations" ? (p.n === 1 ? "demonstration" : "demonstrations") : p.n === 1 ? "qualifying evaluation" : "qualifying evaluations"}`
        case "level":
          return `${p.min} ${p.label.toLowerCase()}`
        case "setting":
          return `${p.min} in ${p.name}`
      }
    })
    .join(" \u00b7 ")
}
