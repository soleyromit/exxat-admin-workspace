// One-off generator for lib/lab/screens.json. Edit lib/lab/screens.json directly after generation; this stays as the seed of the registry.
import fs from "node:fs"

const DASH = ["PageHeader", "KeyMetrics", "DataTable", "PersonIdentityCell", "LocalBanner", "Tip", "Skeleton", "Card", "Button", "ChartCard"]
const TABLE = ["PageHeader", "DataTable", "Button", "Badge"]
const FORM = ["PageHeader", "Button", "Input", "Label", "Card"]
const WIZ = ["PageHeader", "Wizard", "Button", "Card"]
const DETAIL = ["PageHeader", "Card", "Button", "Badge"]
const q = {
  "admin/dashboard": ["Brief and worklist: does one hero verdict plus a worklist answer who is behind and what needs me?", "Cohort lens: is the attainment report a better launch page than a brief?", "Triage: does answering one question at a time beat a dense overview?"],
  "admin/skills-library": ["Table first: can a coordinator scan the whole library by setup state in one table?", "Grouped by section: does grouping by section make setup progress easier to see?", "Setup board: does a board by setup state beat a flat list?"],
  "admin/configure-skill": ["Stepper: does a seven step wizard keep configuration manageable?", "Single page with sections: is one scrolling page faster for repeat configuration?", "Rule first: does starting from the rule sentence reduce errors?"],
  "reviewer/review-item": ["Full page: is a full page enough for one decision?", "Split panel: does keeping the queue visible beside the submission speed up review?", "Evidence first: does leading with the evidence beat leading with the decision?"],
  "student/home": ["Progress first: does the student see what is left before anything else?", "Next action first: does one next action beat a progress summary?", "Requests first: does waiting and returned work belong on top?"],
  "evaluator/evaluation-form": ["One screen: can an evaluator finish on a single screen on a phone?", "Stepped: does one question per step lower errors?", "Checklist: does a criteria checklist match how evaluators think?"],
  "admin/add-skill": ["Single form: is one form faster than a guided flow?", "Guided flow: does asking one thing at a time lower mistakes?"],
  "admin/import-ai-review": ["Review table: can suggestions be confirmed in bulk in a table?", "Card by card: does one suggestion at a time lower mistakes?"],
  "admin/course-mapping": ["Matrix: does skills by courses in one grid map faster?", "Course by course: does picking a course first map faster?"],
  "admin/attainment": ["Heat grid: does a student by skill grid answer who has achieved what?", "Cohort lens: does leading with cohort totals answer it faster?"],
  "director/verification-detail": ["Record view: does reading the whole record support a verify decision?", "Checklist view: does ticking criteria support a verify decision?"],
  "student/record": ["By skill: does grouping by skill match how students read their record?", "Chronological: does a timeline match how students read their record?"],
}
const S = [
  ["admin", "dashboard", "Dashboard", 1, DASH], ["admin", "skills-library", "Skills library", 1, TABLE], ["admin", "add-skill", "Add a skill", 2, FORM],
  ["admin", "import-ai-review", "Import and AI review", 2, TABLE], ["admin", "starter-library", "Starter library", 3, TABLE], ["admin", "configure-skill", "Configure skill", 1, WIZ],
  ["admin", "rule-change-impact", "Rule change impact and publish", 3, DETAIL], ["admin", "retire-deactivate", "Deactivate, retire and new list", 3, DETAIL],
  ["admin", "course-mapping", "Map skills to courses", 2, TABLE], ["admin", "lists-cohorts", "Groups of skills", 3, TABLE], ["admin", "evaluator-directory", "Evaluator directory", 3, TABLE],
  ["admin", "settings", "Settings", 3, FORM], ["admin", "categories-tags", "Categories and tags", 3, FORM],["admin", "attainment", "Attainment", 2, ["PageHeader", "KeyMetrics", "DataTable", "ChartCard"]], ["admin", "export", "Export", 3, DETAIL], ["admin", "approvals", "Approvals", 3, TABLE],
  ["student", "home", "Home", 1, ["PageHeader", "KeyMetrics", "Card", "Button", "Badge"]], ["student", "log-skill", "Log a skill", 3, FORM], ["student", "request-signoff", "Request a sign-off", 3, FORM],
  ["student", "my-requests", "My requests", 3, TABLE], ["student", "fix-returned", "Fix a returned submission", 3, FORM], ["student", "skill-detail", "Skill detail", 3, DETAIL],
  ["student", "record", "My evaluations", 2, DETAIL], ["student", "share-record", "Share verified record", 3, DETAIL], ["student", "offline-sync", "Offline and sync", 3, ["PageHeader", "LocalBanner", "Card", "Button"]],
  ["evaluator", "evaluation-form", "Evaluation form", 1, FORM], ["evaluator", "submitted", "Submitted", 3, DETAIL], ["evaluator", "expired", "Expired or not for you", 3, DETAIL],
  ["lab-instructor", "lab-batch-grid", "Lab batch grid", 3, ["PageHeader", "Table", "Checkbox", "Button"]],
  ["reviewer", "approvals", "Approvals queue", 3, TABLE], ["reviewer", "review-item", "Submission", 1, DETAIL], ["reviewer", "student-record", "Student record", 3, DETAIL], ["reviewer", "students", "Students", 3, TABLE],
  ["director", "dashboard", "Dashboard", 3, ["PageHeader", "KeyMetrics", "DataTable", "ChartCard"]], ["director", "verification-detail", "Verification detail", 2, DETAIL],
  ["director", "reports", "Reports", 3, ["PageHeader", "KeyMetrics", "DataTable"]], ["director", "attainment", "Attainment", 3, ["PageHeader", "DataTable", "ChartCard"]],
]
const ids = ["A", "B", "C"]
const screens = S.map(([persona, slug, title, tier, req]) => {
  const qs = q[`${persona}/${slug}`] ?? ["Single recommended layout."]
  const n = tier === 1 ? 3 : tier === 2 ? 2 : 1
  const variants = Array.from({ length: n }, (_, i) => ({
    id: ids[i],
    question: qs[i] ?? "Single recommended layout.",
    ...(persona === "admin" && slug === "dashboard" && i === 0 ? { file: "components/lab/screens/admin-dashboard-a.tsx" } : {}),
  }))
  return { persona, slug, title, tier, recommended: "A", variants, requiredDsComponents: req }
})
fs.writeFileSync("lib/lab/screens.json", JSON.stringify({ screens }, null, 1) + "\n")
console.log(screens.length)
