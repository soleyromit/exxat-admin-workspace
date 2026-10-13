// R2 re-skin copy: the prototype's EXACT strings for the Import dialogs (docs/build/prototype-parity.md card P-06, captures
// docs/source/parity/40..43). Imported by path, not through the barrel. Every string is [PROTO] unless marked.
// The sample list below is the prototype's own "Paste a sample list" content: demo text for the paste box only. It is not a
// shipped skills library (SL-01): nothing is created from it until the admin reads, reviews and confirms (IM-05, IM-13).

export const r2i = {
  title: "Import skills",
  subtitle: "Bring in a list you already hold instead of entering skills one at a time.",
  info: "Skills arrive unconfigured. A list tells us what the skills are called, not how each one should be evaluated or what achievement requires — those are decided per skill afterwards.",
  upload: { title: "Upload a file", body: "Spreadsheet, document or PDF. No particular template or column order is needed.", choose: "Choose file" },
  paste: { title: "Or paste the list", body: "One skill per line. A description and a grouping are picked up if present.", placeholder: "Skill, Description, Category\nNasogastric Tube Insertion, Placement and confirmation, Category A", sample: "Paste a sample list" },
  cancel: "Cancel",
  read: "Read the list",
  review: {
    title: (n: number, source: string) => `Review ${n} ${n === 1 ? "skill" : "skills"} found in ${source}`,
    subtitle: "Nothing is added until you confirm. Edit, exclude or rename anything before creating.",
    found: "Found",
    foundCaption: "Rows read from the source",
    willBeCreated: "Will be created",
    excludedCaption: (n: number) => `${n} excluded`,
    duplicates: "Possible duplicates",
    duplicatesCaption: "Already in the library",
    createCategories: (n: number) => `Create ${n} new ${n === 1 ? "category" : "categories"} from the groupings in this list`,
    createCategoriesNames: (names: string[]) => names.join(", "),
    columns: { skill: "Skill", description: "Description", category: "Category" },
    unreadTitle: (n: number) => `${n} lines were not read as skills`,
    unreadBody: "Shown so nothing is lost silently. Add any of these by hand if they should have been included.",
    unreadLine: (line: number, text: string) => `Line ${line}: ${text}`,
    sectionHeading: "Looks like a section heading",
    back: "Back",
    create: (n: number) => `Create ${n} ${n === 1 ? "skill" : "skills"}`,
  },
} as const

/** The prototype's sample: a header row, seven rows, one section heading (not a skill) and one plain line. */
export const SAMPLE_LIST = [
  "Skill,Description,Category",
  "Nasogastric Tube Insertion,Placement and confirmation per programme policy,Category D",
  "Central Line Dressing Change,Sterile technique on an established line,Category D",
  "Blood Glucose Monitoring,Capillary sampling and result interpretation,Category E",
  "Oxygen Therapy Administration,Delivery device selection and titration,Category E",
  "Urinary Catheter Removal,,Category F",
  "Peripheral IV Removal,Documentation of site condition,Category F",
  "Lead ECG Acquisition,Lead placement and trace quality,",
  "SECTION 2 — ADVANCED PROCEDURES",
  "Wound Irrigation",
].join("\n")
