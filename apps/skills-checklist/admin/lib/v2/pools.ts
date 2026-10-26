/**
 * Swappable sample-data pools (decision D-X23: realistic but fictional). Every person, organisation, place and free-text
 * string the generator writes comes from this file; generate.ts and generate-ref.ts hold no names. To swap the data for
 * another region, institution or language, replace the arrays below and keep their shapes (dataset spec section 13).
 *
 * Rules the pools follow (asserted by tests/v2/realistic-data.test.ts):
 * - People, the university, hospitals, clinics and towns are fictional. No real organisation or person is attached to a
 *   problem story. Facility names avoid real health-system trademarks (see REAL_SYSTEM_DENY_LIST).
 * - Every email uses a reserved example domain (RFC 2606 `.example`).
 * - HGTC skill names (hgtc-library.json) and NUR course numbers stay real, because the HGTC skills card is public.
 * - Every screen still shows its "Sample data" label.
 *
 * Nothing in this file draws random numbers. Picks are positional (index arithmetic), so the generator's PRNG streams, and
 * therefore every count and story, are untouched when a pool changes.
 */

// ---------------------------------------------------------------------------------------------------------------------
// Institution

export interface Campus {
  id: string
  name: string
  town: string
  state: string
}

export const INSTITUTION = {
  name: "Harbor University",
  /** Staff mailboxes. Reserved example domain. */
  domain: "harbor.example",
  /** Student mailboxes: firstname.lastname@students.harbor.example. */
  studentDomain: "students.harbor.example",
  /** Student number prefix and the entry-year form: S2026-0412. */
  studentNumber: (entryYear: number, n: number) => `S${entryYear}-${String(n).padStart(4, "0")}`,
  campuses: [
    { id: "cmp-porthalsey", name: "Port Halsey campus", town: "Port Halsey", state: "SC" },
    { id: "cmp-marlow", name: "Marlow campus", town: "Marlow", state: "SC" },
    { id: "cmp-sandhaven", name: "Sandhaven campus", town: "Sandhaven", state: "NC" },
  ] as Campus[],
  /**
   * Programs the university runs. Only nursing is modelled in the data; the others name the specialties the hand-written
   * library already holds (radiography, surgical technology, paramedic) so the catalog reads like a real health-sciences school.
   * Course lists for the non-nursing programs are catalog reference only (not in the state: the 22 x 5 offerings stay fixed).
   */
  programs: [
    { id: "prg-adn", name: "Associate Degree in Nursing (ADN)", campusIds: ["cmp-porthalsey", "cmp-marlow"], courses: ["NUR 101", "NUR 120", "NUR 150", "NUR 162", "NUR 201", "NUR 220", "NUR 221"] },
    { id: "prg-bsn", name: "Bachelor of Science in Nursing (BSN)", campusIds: ["cmp-porthalsey"], courses: ["NURS 350", "NURS 352"] },
    { id: "prg-absn", name: "Accelerated BSN track", campusIds: ["cmp-porthalsey", "cmp-sandhaven"], courses: ["NURS 350", "NURS 352"] },
    { id: "prg-rad", name: "Radiologic Technology (AAS)", campusIds: ["cmp-marlow"], courses: ["RAD 101 Introduction to Radiography", "RAD 130 Radiographic Procedures I", "RAD 165 Clinical Applications I", "RAD 230 Radiographic Procedures III"] },
    { id: "prg-st", name: "Surgical Technology (AAS)", campusIds: ["cmp-sandhaven"], courses: ["SUR 101 Introduction to Surgical Technology", "SUR 103 Surgical Procedures I", "SUR 113 Surgical Technology Clinical I", "SUR 205 Surgical Technology Practicum"] },
    { id: "prg-ems", name: "Paramedic (Certificate)", campusIds: ["cmp-marlow"], courses: ["EMS 101 Emergency Medical Technician", "EMS 131 Advanced Airway Management", "EMS 210 Cardiology for Paramedics", "EMS 240 Paramedic Field Internship"] },
  ],
} as const

// ---------------------------------------------------------------------------------------------------------------------
// Courses (nursing). Codes NUR 101, 120, 150, 162, 201, 220 and 221 are the sign-off columns of the public HGTC skills
// card. Titles are NOT printed on the card: the titles below are the closest common-course titles we know and are marked
// [INFER] until the nursing SME confirms them. The legacy id keeps every URL, mapping and test that names a course id.

export type CourseSeed = [code: string, name: string, kind: "clinical" | "didactic", level: 1 | 2 | 3, legacyId?: string]
export const COURSE_SEEDS: CourseSeed[] = [
  ["NUR 101", "Fundamentals of Nursing", "clinical", 1],
  ["NUR 120", "Basic Nursing Concepts", "clinical", 1],
  ["NUR 150", "Nursing Care of Adults I", "clinical", 1],
  ["NUR 162", "Psychiatric and Mental Health Nursing", "clinical", 2],
  ["NUR 201", "Transition Nursing", "clinical", 2],
  ["NUR 220", "Family-Centered Nursing Care", "clinical", 3],
  ["NUR 221", "Advanced Nursing Concepts", "clinical", 3],
  ["NURS 350", "Clinical Practicum", "clinical", 2],
  ["NURS 352", "Skills and Simulation Lab", "clinical", 2],
  ["NUR 108", "Pharmacology for Nursing I", "didactic", 1, "crs-phm110"],
  ["NUR 208", "Pharmacology for Nursing II", "didactic", 2, "crs-phm210"],
  ["NUR 112", "Pathophysiology for Nursing I", "didactic", 1, "crs-pth120"],
  ["NUR 212", "Pathophysiology for Nursing II", "didactic", 2, "crs-pth220"],
  ["NUR 106", "Pharmacologic Nursing Calculations", "didactic", 1, "crs-dsg130"],
  ["NUR 102", "Professional Nursing Concepts", "didactic", 1],
  ["NUR 130", "Health Care Informatics", "didactic", 1],
  ["NUR 160", "Mental Health Concepts", "didactic", 2],
  ["NUR 170", "Maternal and Child Health Concepts", "didactic", 2],
  ["NUR 180", "Gerontologic Nursing", "didactic", 2],
  ["NUR 230", "Nursing Management and Leadership", "didactic", 3],
  ["NUR 240", "Evidence-Based Practice in Nursing", "didactic", 3],
  ["NUR 250", "NCLEX-RN Preparation Seminar", "didactic", 3],
]

// ---------------------------------------------------------------------------------------------------------------------
// People: name pools by heritage, so a given name and surname read as one believable person. A share of names is
// deliberately cross-paired (families, marriages, Anglicised surnames), as in any US cohort.

interface Heritage {
  id: string
  given: string[]
  surname: string[]
}

export const HERITAGE: Heritage[] = [
  {
    id: "anglo",
    given: ["Emily", "Hannah", "Madison", "Abigail", "Olivia", "Sarah", "Lauren", "Megan", "Rachel", "Caroline", "Katherine", "Rebecca", "Allison", "Brooke", "Courtney", "Jessica", "Kayla", "Morgan", "Paige", "Taylor", "Claire", "Molly", "Haley", "Chloe", "Audrey", "Jacob", "Tyler", "Austin", "Connor", "Dylan", "Garrett", "Logan", "Mason", "Nathan", "Ryan", "Wyatt", "Cole", "Bryce", "Colin", "Patrick", "William", "Jonathan", "Michael", "Christopher", "Robert", "Elizabeth", "Patricia", "Shannon", "Heather", "Amanda"],
    surname: ["Whitaker", "Callahan", "Pruitt", "Holloway", "Barnhart", "McAllister", "Sutton", "Garrison", "Langford", "Ashworth", "Kendrick", "Fairbanks", "Doyle", "Brennan-Hale", "Mercer", "Pickett", "Rutledge", "Abernathy", "Haskins", "Lockhart", "Gentry", "Hollister", "Bowman", "Cartwright", "Delaney", "Easley", "Fitzgerald", "Granger", "Hutchins", "Kirkland", "Lyons", "McBride", "Norwood", "Ogden", "Prescott", "Quinlan", "Radford", "Stroud", "Tillman", "Underhill", "Vaughn", "Wakefield", "Yarborough", "Ziegler", "Schaefer", "Hoffmann", "Romano", "DeLuca", "Moretti", "Sullivan-Ward"],
  },
  {
    id: "hispanic",
    given: ["Alejandra", "Daniela", "Valeria", "Camila", "Lucia", "Mariana", "Gabriela", "Ximena", "Isabel", "Natalia", "Andrea", "Paola", "Diego", "Santiago", "Javier", "Luis", "Mateo", "Adrian", "Carlos", "Emilio", "Rafael", "Joaquin", "Esteban", "Alejandro", "Marisol", "Yesenia"],
    surname: ["Hernandez", "Ramirez", "Gutierrez", "Morales", "Castaneda", "Villarreal", "Ochoa", "Salazar", "Aguilar", "Medina", "Fuentes", "Cervantes", "Espinoza", "Ibarra", "Montoya", "Navarro", "Orozco", "Pacheco", "Quintana", "Rosales", "Sandoval", "Trujillo", "Valdivia", "Zamora", "Reyes-Morales", "Benitez"],
  },
  {
    id: "black",
    given: ["Aaliyah", "Imani", "Destiny", "Jasmine", "Kiara", "Nia", "Tiana", "Ebony", "Brianna", "Jada", "Zaria", "Monique", "Darnell", "Jamal", "Malik", "Terrence", "Andre", "Isaiah", "Xavier", "DeShawn", "Marcus", "Jalen"],
    surname: ["Washington", "Jefferson", "Okafor", "Mensah", "Adeyemi", "Boateng", "Coleman", "Dawkins", "Freeman", "Gaines", "Harrell", "Jenkins", "Kamara", "Lawson", "Mayfield", "Nwachukwu", "Owusu", "Pettiford", "Rivers", "Simmons", "Thornton", "Wilder"],
  },
  {
    id: "asian",
    given: ["Linh", "Thao", "Mei", "Jia", "Hana", "Min-ji", "Grace", "Kevin", "Bao", "Daniel", "Jun", "Trinh", "Angela", "Vincent", "Minh"],
    surname: ["Nguyen", "Tran", "Pham", "Le", "Huang", "Chen", "Lin", "Park", "Kim", "Choi", "Yamada", "Santos", "Reyes", "Bautista", "Dizon"],
  },
  {
    id: "south-asian",
    given: ["Ananya", "Divya", "Kavya", "Riya", "Neha", "Arjun", "Rohan", "Vikram", "Aditya", "Sanjana"],
    surname: ["Patel", "Shah", "Reddy", "Iyer", "Desai", "Chaudhary", "Menon", "Bhatt", "Kapoor", "Nair"],
  },
  {
    id: "arab",
    given: ["Layla", "Yasmin", "Noor", "Rania", "Salma", "Omar", "Karim", "Tariq", "Sami", "Hadi"],
    surname: ["Haddadin", "Khoury", "Mansour", "Nasser", "Saleh", "Aziz", "Darwish", "Hamdan", "Barakat", "Toma"],
  },
  {
    id: "east-european",
    given: ["Natalia", "Katarzyna", "Irina", "Daria", "Milena", "Pavel", "Nikolai", "Tomasz", "Andrei", "Viktor"],
    surname: ["Kowalczyk", "Novak", "Petrov", "Horvath", "Wisniewski", "Dragomir", "Lazarescu", "Sokolov", "Mazur", "Kovac"],
  },
]

/** Heritage per position in a cycle of 20, roughly the mix of a US nursing cohort. */
export const HERITAGE_CYCLE = ["anglo", "hispanic", "anglo", "black", "anglo", "asian", "hispanic", "anglo", "black", "south-asian", "anglo", "hispanic", "east-european", "anglo", "black", "arab", "anglo", "asian", "hispanic", "anglo"]

/** Names the hand-written layer already uses, never repeated by the generator, and surnames kept off evaluators so the only
 *  "same surname" merge suggestions are the deliberate ones (the unverified spellings below). */
export const RESERVED_NAMES = ["Maya Ferreira", "Jordan Okafor", "Priya Raman", "Tomas Alvarez", "Hannah Brooks", "Devon Lee", "Amara Nwosu", "Liam Kowalski", "Sofia Marchetti", "Noah Whitfield", "Grace Tanaka", "Ethan Cole"]
export const RESERVED_SURNAMES = ["Delgado", "Okonkwo", "Castillo", "Aldridge", "Whitmore", "Ross", "Haddad", "Brennan", "Ferreira"]

export interface PersonName {
  given: string
  surname: string
}

/**
 * `count` unique names, positional and pure. `start` offsets the walk (students and evaluators walk different stretches),
 * `taken` holds full names already used (it is updated). About one name in six takes its surname from another heritage.
 */
export function namesFrom(count: number, start: number, taken: Set<string>, avoidSurnames: ReadonlyArray<string> = []): PersonName[] {
  const byId = new Map(HERITAGE.map((h) => [h.id, h]))
  const used = new Map<string, number>()
  const out: PersonName[] = []
  const avoid = new Set(avoidSurnames)
  for (let j = start; out.length < count; j++) {
    const h = byId.get(HERITAGE_CYCLE[j % HERITAGE_CYCLE.length])!
    const k = used.get(h.id) ?? 0
    used.set(h.id, k + 1)
    const cross = j % 6 === 5 ? byId.get(HERITAGE_CYCLE[(j + 7) % HERITAGE_CYCLE.length])! : h
    for (let t = 0; t < 60; t++) {
      const given = h.given[(k * 7 + t) % h.given.length]
      const surname = cross.surname[(k * 11 + t * 3 + j) % cross.surname.length]
      const full = `${given} ${surname}`
      if (taken.has(full) || avoid.has(surname)) continue
      taken.add(full)
      out.push({ given, surname })
      break
    }
  }
  return out
}

/** Mailbox-safe local part: lowercase letters and hyphens. */
export const mailPart = (s: string) => s.toLowerCase().replace(/[^a-z-]+/g, "")

/** Short forms students type for an evaluator they know (used for the unverified spellings). */
export const NICKNAME: Record<string, string> = {
  Rebecca: "Becky", Katherine: "Kate", William: "Will", Robert: "Rob", Jonathan: "Jon", Elizabeth: "Liz", Michael: "Mike", Patricia: "Trish",
  Alejandro: "Alex", Christopher: "Chris", Jessica: "Jess", Daniel: "Dan", Nikolai: "Nick", Natalia: "Talia", Javier: "Javi", Samantha: "Sam",
}

// ---------------------------------------------------------------------------------------------------------------------
// Evaluator credentials (the "RN", "LPN", "NP" tokens the qualification rule reads are always kept; the degree is added for realism).

/** Display and credential tokens for a base credential, chosen positionally. */
export const CREDENTIAL_FORMS: Record<string, Array<{ display: string; tokens: string[] }>> = {
  RN: [
    { display: "BSN, RN", tokens: ["BSN", "RN"] },
    { display: "RN", tokens: ["RN"] },
    { display: "BSN, RN, CMSRN", tokens: ["BSN", "RN", "CMSRN"] },
    { display: "BSN, RN", tokens: ["BSN", "RN"] },
    { display: "MSN, RN", tokens: ["MSN", "RN"] },
    { display: "ADN, RN", tokens: ["ADN", "RN"] },
    { display: "BSN, RN, CCRN", tokens: ["BSN", "RN", "CCRN"] },
    { display: "BSN, RN", tokens: ["BSN", "RN"] },
  ],
  LPN: [{ display: "LPN", tokens: ["LPN"] }],
  NP: [
    { display: "MSN, FNP-C", tokens: ["MSN", "NP", "FNP-C"] },
    { display: "DNP, FNP-BC", tokens: ["DNP", "NP", "FNP-BC"] },
  ],
  "RN, CNE": [{ display: "MSN, RN, CNE", tokens: ["MSN", "RN", "CNE"] }],
}
export const FACULTY_CREDENTIALS = [
  { display: "MSN, RN", tokens: ["MSN", "RN"], doctor: false },
  { display: "DNP, RN, CNE", tokens: ["DNP", "RN", "CNE"], doctor: true },
  { display: "MSN, RN, CNE", tokens: ["MSN", "RN", "CNE"], doctor: false },
  { display: "PhD, RN", tokens: ["PhD", "RN"], doctor: true },
  { display: "MSN, RN, CCRN", tokens: ["MSN", "RN", "CCRN"], doctor: false },
  { display: "MSN, RNC-OB", tokens: ["MSN", "RN", "RNC-OB"], doctor: false },
]
export const LAB_CREDENTIALS = [
  { display: "MSN, RN, CHSE", tokens: ["MSN", "RN", "CHSE"] },
  { display: "BSN, RN", tokens: ["BSN", "RN"] },
  { display: "MSN, RN", tokens: ["MSN", "RN"] },
]
export const FACULTY_TITLES = ["Clinical faculty", "Assistant professor of nursing", "Clinical instructor", "Associate professor of nursing", "Nursing instructor"]
export const STAFF_TITLES = ["Clinical placement coordinator", "Clinical coordinator", "Clinical compliance coordinator"]

/**
 * The 14 names students typed for an evaluator the program has not adopted. Index 0 and 1 are filled by the generator as
 * spellings of adopted evaluators (index 0: the hero preceptor J. Delgado, RN; index 1: an adopted preceptor at the same
 * site, by nickname), so the adopt or merge screens have a real merge to suggest. The rest read as typed: missing
 * credentials, initials, a hyphenated surname.
 */
export const UNVERIFIED_TYPED = [
  "Jon Delgado, RN",
  "", // filled: nickname spelling of an adopted preceptor at the same site
  "Kim Truong",
  "Dee Washburn RN",
  "Tasha Greenlee",
  "Rob Kessler, BSN",
  "Ana Lucia Paredes",
  "Gloria Ifeanyi-Bello",
  "Sam Whitlock",
  "Priscilla Duarte, LPN",
  "Hamid Rostami",
  "Lauren B.",
  "Terrence Holloway-Pryor RN",
  "Mei Ling Zhou",
]

// ---------------------------------------------------------------------------------------------------------------------
// Clinical sites. Fictional facilities in fictional towns of a coastal SC and NC region. Hospitals host inpatient,
// emergency and maternal-child units; clinics, long-term care and campus labs are their own facilities.

export interface Facility {
  name: string
  town: string
  state: string
  type: string
  /** Mailbox domain for staff at this facility (reserved example domain). */
  domain: string
}

export const domainOf = (name: string) => `${name.toLowerCase().replace(/&/g, "and").replace(/[^a-z]+/g, "")}.example`
const fac = (name: string, town: string, state: string, type: string): Facility => ({ name, town, state, type, domain: domainOf(name) })

export const HOSPITALS: Facility[] = [
  fac("Saltmarsh Regional Medical Center", "Port Halsey", "SC", "Hospital"),
  fac("Heron Bay Medical Center", "Heron Bay", "SC", "Hospital"),
  fac("Cypress Landing Community Hospital", "Cypress Landing", "SC", "Hospital"),
  fac("Ashby Point Hospital", "Ashby Point", "SC", "Hospital"),
  fac("Marlow County Memorial Hospital", "Marlow", "SC", "Hospital"),
  fac("Kestrel Ridge Medical Center", "Kestrel Ridge", "NC", "Hospital"),
  fac("Sandhaven Regional Hospital", "Sandhaven", "NC", "Hospital"),
  fac("Pine Hollow Medical Center", "Pine Hollow", "SC", "Hospital"),
  fac("Larkin Sound Hospital", "Larkin Sound", "NC", "Hospital"),
  fac("Briarwood Community Hospital", "Briarwood", "SC", "Hospital"),
  fac("Osprey Inlet Medical Center", "Osprey Inlet", "SC", "Hospital"),
  fac("Wrenfield Regional Medical Center", "Wrenfield", "SC", "Hospital"),
  fac("Graystone Bluff Hospital", "Graystone Bluff", "NC", "Hospital"),
  fac("Calder Springs Medical Center", "Calder Springs", "SC", "Hospital"),
  fac("Fennick Community Hospital", "Fennick", "SC", "Hospital"),
  fac("Thornbury Memorial Hospital", "Thornbury", "NC", "Hospital"),
  fac("Eastbrook Regional Medical Center", "Eastbrook", "SC", "Hospital"),
  fac("Silver Marsh Hospital", "Silver Marsh", "SC", "Hospital"),
]

/** Units per hospital setting. The hospital x unit pairs are taken diagonally, so no pair repeats. */
export const HOSPITAL_UNITS: Record<string, string[]> = {
  "Inpatient med-surg": ["Med-Surg 4 West", "Telemetry 5 East", "Medical ICU", "Surgical Step-Down", "Orthopedics 3 North", "Oncology 6 South", "Progressive Care", "Cardiac Step-Down 2 East", "Neuro 7 North", "Behavioral Health 2 North"],
  Emergency: ["Emergency Department", "Pediatric Emergency", "Emergency Fast Track", "Observation Unit"],
  "Maternal-child": ["Labor and Delivery", "Mother-Baby 3 East", "NICU", "Pediatrics 4 North", "Postpartum"],
}

/** Outpatient facilities (clinics, dialysis, home health, school nursing, public health), each with its units. */
export const OUTPATIENT: Array<[Facility, string[]]> = [
  [fac("Seagrass Family Medicine", "Port Halsey", "SC", "Primary care clinic"), ["Adult primary care", "Pediatric primary care"]],
  [fac("Cypress Landing Dialysis Center", "Cypress Landing", "SC", "Dialysis center"), ["Hemodialysis", "Home dialysis training"]],
  [fac("Heron Bay Infusion Center", "Heron Bay", "SC", "Infusion center"), ["Outpatient infusion", "Anticoagulation clinic"]],
  [fac("Marlow Pediatric Associates", "Marlow", "SC", "Pediatric clinic"), ["Well-child clinic"]],
  [fac("Ashby Point Wound Care Center", "Ashby Point", "SC", "Wound clinic"), ["Wound and ostomy clinic"]],
  [fac("Sandhaven Community Health Center", "Sandhaven", "NC", "Community health center"), ["Primary care", "Women's health"]],
  [fac("Kestrel Ridge Heart and Vascular", "Kestrel Ridge", "NC", "Cardiology clinic"), ["Cardiology clinic", "Cardiac rehabilitation"]],
  [fac("Pine Hollow Home Health", "Pine Hollow", "SC", "Home health agency"), ["Home health visits"]],
  [fac("Larkin Sound Home Health and Hospice", "Larkin Sound", "NC", "Home health agency"), ["Home health visits", "Hospice home care"]],
  [fac("Marlow County School District", "Marlow", "SC", "School district"), ["School nursing"]],
  [fac("Halsey County Schools", "Port Halsey", "SC", "School district"), ["School nursing"]],
  [fac("Osprey Inlet Urgent Care", "Osprey Inlet", "SC", "Urgent care"), ["Urgent care", "Occupational health"]],
  [fac("Eastbrook Diabetes and Endocrine Clinic", "Eastbrook", "SC", "Specialty clinic"), ["Diabetes education"]],
  [fac("Silver Marsh Behavioral Health Clinic", "Silver Marsh", "SC", "Behavioral health clinic"), ["Outpatient behavioral health"]],
  [fac("Thornbury Cancer Care", "Thornbury", "NC", "Oncology clinic"), ["Medical oncology clinic", "Infusion suite"]],
  [fac("Calder Springs Orthopedic Clinic", "Calder Springs", "SC", "Orthopedic clinic"), ["Orthopedics clinic"]],
  [fac("Graystone Bluff Women's Health", "Graystone Bluff", "NC", "Women's health clinic"), ["Prenatal clinic"]],
  [fac("Briarwood County Health Department", "Briarwood", "SC", "Public health department"), ["Immunization clinic", "Maternal health"]],
  [fac("Heron Bay Surgery Center", "Heron Bay", "SC", "Ambulatory surgery center"), ["Pre-op", "PACU"]],
  [fac("Fennick Free Clinic", "Fennick", "SC", "Free clinic"), ["Primary care"]],
  [fac("Wrenfield Rural Health Clinic", "Wrenfield", "SC", "Rural health clinic"), ["Primary care"]],
  [fac("Sandhaven Pulmonary Rehabilitation", "Sandhaven", "NC", "Rehabilitation clinic"), ["Pulmonary rehabilitation"]],
]

/** Long-term care, rehabilitation and hospice facilities. */
export const LONG_TERM_CARE: Array<[Facility, string[]]> = [
  [fac("Oak Hollow Skilled Nursing and Rehabilitation", "Pine Hollow", "SC", "Skilled nursing facility"), ["Skilled nursing, East Wing", "Short-term rehab", "Long-term care, West Wing"]],
  [fac("Linden Terrace Health and Rehabilitation", "Marlow", "SC", "Skilled nursing facility"), ["Long-term care, North Hall", "Memory care"]],
  [fac("Willow Glen Senior Living", "Heron Bay", "SC", "Assisted living"), ["Memory care", "Assisted living"]],
  [fac("Seabright Manor Nursing Center", "Osprey Inlet", "SC", "Skilled nursing facility"), ["Long-term care", "Short-term rehab"]],
  [fac("Quail Run Care Center", "Kestrel Ridge", "NC", "Skilled nursing facility"), ["Skilled nursing", "Memory care"]],
  [fac("Ashby Point Veterans Home", "Ashby Point", "SC", "Veterans home"), ["Long-term care, B Wing", "Memory care"]],
  [fac("Pine Hollow Hospice House", "Pine Hollow", "SC", "Inpatient hospice"), ["Inpatient hospice"]],
  [fac("Heron Bay Rehabilitation Hospital", "Heron Bay", "SC", "Rehabilitation hospital"), ["Inpatient rehab", "Brain injury unit"]],
  [fac("Larkin Sound Assisted Living", "Larkin Sound", "NC", "Assisted living"), ["Assisted living", "Memory care"]],
]

/** Campus labs and the shared simulation center. The main campus labs carry their plain room name as the location. */
export const LABS: Array<{ facility: Facility; unit: string; location: string }> = [
  { facility: fac("Harbor University, Port Halsey campus", "Port Halsey", "SC", "Campus skills lab"), unit: "Skills lab 1", location: "Skills lab 1" },
  { facility: fac("Harbor University, Port Halsey campus", "Port Halsey", "SC", "Campus skills lab"), unit: "Skills lab 2", location: "Skills lab 2" },
  { facility: fac("Harbor University, Port Halsey campus", "Port Halsey", "SC", "Campus skills lab"), unit: "Skills lab 3", location: "Skills lab 3" },
  { facility: fac("Harbor University, Port Halsey campus", "Port Halsey", "SC", "Simulation center"), unit: "Simulation center", location: "Port Halsey simulation center" },
  { facility: fac("Harbor University, Port Halsey campus", "Port Halsey", "SC", "Campus skills lab"), unit: "Health assessment lab", location: "Health assessment lab" },
  { facility: fac("Harbor University, Marlow campus", "Marlow", "SC", "Campus skills lab"), unit: "Skills lab", location: "Marlow campus, Skills lab" },
  { facility: fac("Harbor University, Marlow campus", "Marlow", "SC", "Simulation center"), unit: "Simulation suite", location: "Marlow campus, Simulation suite" },
  { facility: fac("Harbor University, Sandhaven campus", "Sandhaven", "NC", "Campus skills lab"), unit: "Skills lab", location: "Sandhaven campus, Skills lab" },
  { facility: fac("Harbor University, Sandhaven campus", "Sandhaven", "NC", "Simulation center"), unit: "Simulation suite", location: "Sandhaven campus, Simulation suite" },
  { facility: fac("Coastal Plains Regional Simulation Center", "Heron Bay", "SC", "Simulation center"), unit: "High-fidelity simulation", location: "Coastal Plains Regional Simulation Center" },
]

/**
 * The hand-written layer's own places. The generator gives these names to real site records (so evidence, placements and
 * evaluators link by site id), keeping the exact location strings the hand-written evaluations and placements carry.
 */
export const HERO_SITES = {
  facility: fac("Harbor General", "Port Halsey", "SC", "Hospital (university teaching hospital)"),
  inpatient: [{ unit: "4 West", location: "Harbor General, 4 West" }, { unit: "5 East", location: "Harbor General, 5 East" }],
  emergency: { unit: "Emergency Department", location: "Harbor General Emergency Department" },
  outpatient: { facility: fac("Harbor Outpatient Clinic", "Port Halsey", "SC", "Primary care clinic"), unit: "Adult primary care", location: "Harbor Outpatient Clinic" },
}

/** Real health-system names fictional data must never use (tests/v2/realistic-data.test.ts). Not exhaustive: a guard. */
export const REAL_SYSTEM_DENY_LIST = [
  "Mayo", "Cleveland Clinic", "Kaiser", "Permanente", "HCA", "Johns Hopkins", "Hopkins", "Prisma Health", "Prisma", "MUSC", "Medical University of South Carolina",
  "Atrium", "Novant", "Duke", "UNC Health", "Vidant", "ECU Health", "Bon Secours", "Roper", "Trident", "AnMed", "McLeod", "Tidelands", "Grand Strand", "Conway Medical",
  "Lexington Medical", "Spartanburg Regional", "Self Regional", "Ascension", "CommonSpirit", "Tenet", "Sutter", "Advocate", "Intermountain", "Geisinger",
  "Mass General", "Mount Sinai", "NYU Langone", "Cedars-Sinai", "Baptist Health", "Providence", "Banner Health", "Ochsner", "Piedmont", "Wellstar",
  "Sentara", "Carilion", "Genesis", "Encompass Health", "Brookdale", "Kindred", "Amedisys", "DaVita", "Fresenius", "MinuteClinic", "CVS", "Walgreens",
]

// ---------------------------------------------------------------------------------------------------------------------
// Free text. Composed from parts so about 2,500 comments do not repeat one string; picks are positional.

export const FEEDBACK_STRENGTH = [
  "Introduced herself and explained the procedure before starting.",
  "Performed hand hygiene and checked two identifiers without prompting.",
  "Gathered all supplies before entering the room.",
  "Kept the sterile field intact throughout.",
  "Good body mechanics and raised the bed to working height.",
  "Communicated clearly with the patient and family.",
  "Organized and efficient with a full assignment.",
  "Documented promptly and accurately in the EHR.",
  "Recognized the change in the patient's condition and reported it right away.",
  "Answered my questions on rationale confidently.",
  "Respected privacy and kept the patient covered.",
  "Followed the facility policy step by step.",
  "Calm with an anxious patient and talked them through it.",
  "Checked the order against the MAR before preparing.",
  "Good situational awareness on a busy shift.",
  "Asked for help at the right moment instead of guessing.",
  "Explained the purpose of each step in plain language.",
  "Reassessed after the intervention and charted the response.",
  "Safe and steady technique.",
  "Gave a clear SBAR handoff to the oncoming nurse.",
  "Confirmed allergies before proceeding.",
  "Prioritized well when two call lights went off.",
]
export const FEEDBACK_COACHING = [
  "Next time, verbalize the rationale as you go.",
  "Work on time management during morning med pass.",
  "Remember to lower the bed and leave the call light in reach.",
  "Slow down slightly when counting the respiratory rate.",
  "Review the facility policy on documentation timing.",
  "Practice the sequence once more in the lab before the next shift.",
  "Watch the expiration date on supplies.",
  "Label the line with date and time before you leave the room.",
  "Close the loop with the patient before you leave.",
  "Be sure to scan the wristband before every dose.",
  "Keep working on confidence when calling providers.",
  "Double-check the pump settings with a second nurse.",
  "",
  "",
  "",
  "",
]
/** Feedback when the evaluator recorded the attempt as not yet or unmet. */
export const FEEDBACK_SHORTFALL = [
  "Broke sterile technique when opening the kit; we stopped and restarted.",
  "Did not verify the patient with two identifiers before starting.",
  "Needed several prompts on the order of steps. Repeat with supervision.",
  "Forgot to check the residual before the feeding. Discussed afterward.",
  "Hesitant with the equipment. Practice in the lab before the next attempt.",
  "Missed the reassessment after the intervention.",
  "Documentation was incomplete at the end of the shift.",
  "Rate calculation was off; we corrected it together before starting.",
  "Did not explain the procedure to the patient beforehand.",
  "Needs to review contraindications before giving the medication.",
]

export const SELF_NOTES = [
  "Felt confident with the steps.",
  "Needed one prompt on the order of steps.",
  "First time doing this on a real patient.",
  "Checked the order twice before starting.",
  "Patient was anxious, so I explained each step.",
  "My preceptor talked me through the setup.",
  "Went smoother than in the lab.",
  "I was slow with the documentation afterward.",
  "Practiced this in sim last week, which helped.",
  "Not sure I had the right gauge at first; asked before starting.",
  "Family was in the room, which made me nervous.",
  "I want another attempt to feel solid on this.",
  "Busy shift, but I was able to finish on time.",
  "",
  "",
  "",
]

export const APPROVAL_NOTES = [
  "Approved: evidence matches the rule.",
  "Approved after checking the setting.",
  "Approved. Evaluator name confirmed with the site.",
  "Approved: signed form on file.",
  "Approved. Confirmed with the unit manager that this preceptor was on shift.",
  "Approved after a quick call with the preceptor.",
  "Approved: date and setting check out.",
  "Approved. Self-rating differs slightly, but the evaluator's comments support it.",
]

export const RETURN_REASONS = [
  "The outcome does not match the comment. Please correct one of them and send it again.",
  "The signed form is missing the date. Add it and send the request again.",
  "The evaluator name on the form is not legible. Confirm who signed it.",
  "Choose the setting where you did this skill, then send it again.",
  "This was done in the lab, not on the unit. Resubmit it as lab evidence.",
  "The photo of the form is cut off at the signature. Upload the full page.",
  "The date is after your rotation ended at this site. Check the date and send it again.",
  "Two skills are on one form but only one is signed. Ask your preceptor to sign both.",
  "Your preceptor's comment says this was observed only. Ask for a sign-off when you perform it.",
  "Please add the unit where this happened.",
]

export const CONCERN_NOTES = [
  "Seemed rushed with patient identification today. Please follow up in post-conference.",
  "Arrived late twice this rotation. Discussed with the student.",
  "Hesitant to ask for help even when unsure. Worth a check-in.",
  "Charting was copied from the previous shift. Reviewed the expectation with her.",
  "Student seemed overwhelmed with two patients. Suggest a lighter assignment next week.",
  "Left the bed rails down after care. Addressed at the bedside.",
]

export const REMEDIATION_STEPS = [
  ["Review the technique with your preceptor", "Practice session in the skills lab", "Supervised attempt"],
  ["Watch the skills video and complete the checklist", "Return demonstration in the lab", "Supervised attempt on the unit"],
  ["Meet with your clinical instructor", "Two practice sessions in the lab", "Supervised attempt"],
]
export const REMEDIATION_CLOSED_NOTES = ["Passed the supervised attempt.", "Completed the return demonstration and a clean attempt on the unit.", "Met expectations on the supervised attempt."]

/** Ratings a student records for a lab practice trial (the order matters: first trial, later trials). */
export const PRACTICE_RATINGS = ["Needs coaching", "With assistance"] as const
