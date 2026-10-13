// Atoms shared by the copy added during the build. One definition per word so a surface never retypes it and a rename
// is one edit. Sentence case, no em-dashes.
export const common = {
  active: "Active",
  inactive: "Inactive",
  deactivate: "Deactivate",
  reactivate: "Reactivate",
  name: "Name",
  email: "Email",
  description: "Description",
  searchSkills: "Search skills",
  checkEntries: "Check these entries.",
} as const
