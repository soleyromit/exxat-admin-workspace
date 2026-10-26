import {
  buildCourses,
  buildHgtcSkills,
  buildMappings,
  buildOfferings,
  buildSites,
  clinicalCourseFor,
  COHORTS,
  cumulative,
  CURRENT_TERM,
  draw,
  ENROLLED,
  heroSiteIds,
  HGTC,
  isIvLevel,
  type Rand,
  pick,
  shuffle,
  skillIdOf,
  STALE_SITES,
  STALLED_SITE,
  stream,
  TERMS,
  TRACKS,
  TWIN,
  TWIN_HGTC,
  UNCONFIGURED,
  splitNonMandatory,
  withEnrollment,
} from "./generate-ref"
import {
  APPROVAL_NOTES,
  CONCERN_NOTES,
  CREDENTIAL_FORMS,
  domainOf,
  FACULTY_CREDENTIALS,
  FACULTY_TITLES,
  FEEDBACK_COACHING,
  FEEDBACK_SHORTFALL,
  FEEDBACK_STRENGTH,
  HERO_SITES,
  INSTITUTION,
  LAB_CREDENTIALS,
  mailPart,
  namesFrom,
  NICKNAME,
  PRACTICE_RATINGS,
  REMEDIATION_CLOSED_NOTES,
  REMEDIATION_STEPS,
  RESERVED_NAMES,
  RESERVED_SURNAMES,
  RETURN_REASONS,
  SELF_NOTES,
  STAFF_TITLES,
  UNVERIFIED_TYPED,
  type PersonName,
} from "./pools"
import { daysBefore, DEMO_TODAY, HERO_APPROVAL, IDS } from "./seed-core"
import type {
  AuditEntry,
  ConcernFlag,
  Evaluation,
  EvaluationStatus,
  LabCheckoff,
  LogEntry,
  Outcome,
  Person,
  Placement,
  Remediation,
  Setting,
  Site,
  Skill,
  Submission,
  V2State,
} from "./types"

/**
 * The deterministic cohort generator (dataset spec sections 3 and 4). It builds 123 students (the 12 hand-written ones plus 111), the HGTC
 * starter library next to the hero library, 22 courses x 5 terms, 120 sites, 180 evaluators and about 8,900 pieces of evidence, around the
 * hand-written hero layer, which it never edits. Pure: same input, same output. No Date.now, no Math.random.
 *
 * Counts (target = the sum over hero and generated rows):
 *   counted (status counted, outcome met) 8,031 · did not qualify (counted, not met; plus reopened) 361 · awaiting approval 20 · returned 64
 *   · waiting skill requests (a Submission with the evaluator or stalled, no Evaluation yet) 403 · total 8,879 (spec section 12).
 * Documented deviation from the build prompt: did-not-qualify is 360 not 25 (spec Q2); the level-shortfall kind (met below the minimum level)
 * stays in the counted bucket.
 */

// Section 12 (2026-10-26): the director story answers one waiting request Unmet, moving one item from waiting (404 -> 403) to
// did not qualify (360 -> 361). The total stays 8,879.
export const TARGETS = { counted: 8031, didNotQualify: 361, awaiting: 20, returned: 64, waiting: 403 } as const
/** Items the director story moves from waiting to did not qualify (the generator draws one fewer did-not-qualify itself). */
const STORY_ANSWERED = 1

/** Director story dates (dataset spec section 12): verifications, then a rule change, then the answered request. */
export const STORY = { verifiedAt: "2026-10-02T15:00:00.000Z", ruleChangedAt: "2026-10-20", answeredAt: "2026-10-21T10:00:00.000Z" } as const
/** Share of generated clinical evaluations that carry a self-evaluation, how often it agrees, and share approved with a note. */
const SELF_SHARE = 0.6
const SELF_AGREE = 0.85
const APPROVED_SHARE = 0.08
/** Share of generated evaluations (no feedback yet) that carry a short evaluator comment: positional, every third of ten. */
const FEEDBACK_EVERY = 10
const FEEDBACK_SHARE = 3
export const BEHIND_TARGET = 12

// ---------------------------------------------------------------------------------------------------------------------
// Names and free text come from lib/v2/pools.ts (decision D-X23). Nothing below depends on what a name says.

/** Evaluator comment for the i-th commented evaluation: a strength plus, often, one thing to work on. Positional. */
export function feedbackText(i: number, outcome: Outcome): string {
  if (outcome !== "met") return FEEDBACK_SHORTFALL[(i * 3) % FEEDBACK_SHORTFALL.length]
  const a = FEEDBACK_STRENGTH[(i * 7) % FEEDBACK_STRENGTH.length]
  const b = FEEDBACK_COACHING[(i * 5 + 3) % FEEDBACK_COACHING.length]
  return b ? `${a} ${b}` : a
}
const personEmail = (n: PersonName, domain: string) => `${mailPart(n.given)}.${mailPart(n.surname)}@${domain}`

// ---------------------------------------------------------------------------------------------------------------------
// Small helpers

const dayCache = new Map<number, string>()
const dBefore = (n: number): string => {
  let v = dayCache.get(n)
  if (!v) {
    v = daysBefore(n)
    dayCache.set(n, v)
  }
  return v
}
const todayMs = Date.parse(`${DEMO_TODAY}T09:00:00Z`)
const termOf = (daysAgo: number): string => {
  const d = new Date(todayMs - daysAgo * 86_400_000).toISOString().slice(0, 10)
  let id = TERMS[0].id
  for (const t of TERMS) if (t.start <= d) id = t.id
  return id
}
const ri = (r: Rand, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1))

const isoPlus = (iso: string, days: number): string => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
/** Rotations run 4 to 8 weeks, Monday to Friday, inside the term (dataset spec section 12). */
export const ROTATION_WEEKS = { min: 4, max: 8 } as const
/** Shares of current-term rotations by where they stand on the demo day: finished, ending within 21 days, just started, mid. */
const CURRENT_MIX = [0.3, 0.3, 0.2] as const

/**
 * Start and end of one rotation. Starts fall on a week boundary of the term. In the current term the rotation is drawn so the
 * demo day sees a realistic mix: about 30 percent finished, 30 percent ending within 21 days, 20 percent started in the last week,
 * the rest mid-rotation. Pure: the dates come from the stream passed in.
 */
function rotationDates(term: { start: string; end: string }, r: Rand, current: boolean): { startDate: string; endDate: string } {
  const weeks = ri(r, ROTATION_WEEKS.min, ROTATION_WEEKS.max)
  const len = weeks * 7 - 3
  const termDays = Math.round((Date.parse(`${term.end}T00:00:00Z`) - Date.parse(`${term.start}T00:00:00Z`)) / 86_400_000)
  const maxK = Math.max(0, Math.floor((termDays - len) / 7))
  const ks = Array.from({ length: maxK + 1 }, (_, k) => k)
  const span = (k: number) => ({ startDate: isoPlus(term.start, k * 7), endDate: isoPlus(term.start, k * 7 + len) })
  let pool = ks
  if (current) {
    const u = r()
    const today = DEMO_TODAY
    const soon = isoPlus(today, 21)
    const lastWeek = isoPlus(today, -7)
    const want =
      u < CURRENT_MIX[0] ? (k: number) => span(k).endDate < today
      : u < CURRENT_MIX[0] + CURRENT_MIX[1] ? (k: number) => span(k).endDate >= today && span(k).endDate <= soon && span(k).startDate <= today
      : u < CURRENT_MIX[0] + CURRENT_MIX[1] + CURRENT_MIX[2] ? (k: number) => span(k).startDate > lastWeek && span(k).startDate <= today
      : (k: number) => span(k).startDate <= today && span(k).endDate > soon
    const hit = ks.filter(want)
    if (hit.length) pool = hit
  }
  return span(pool[Math.floor(r() * pool.length)])
}

type Year = 2026 | 2027 | 2028
interface G {
  p: Person
  year: Year
  hero: boolean
  idx: number
  /** Term id -> the site of the placement. */
  sites: Record<string, Site>
  /** Mandatory-skill evidence for NURS 350 in [urinary catheter, oral medication, sterile dressing, vital signs], Met each (0 to 3). */
  pace: [number, number, number, number]
  kind: "complete" | "one-short" | "far-behind" | "standard"
  /** Required share for standard students, 0 to 1. */
  prog: number
  /** Optional breadth, 0 to 1. */
  breadth: number
  ivArc: boolean
  ivDone: number
  sameEvaluator: boolean
  oneAway: boolean
  labOnly: boolean
  missingTail: number
  /** Skills the student has not done yet, nearest first. */
  next: string[]
}

interface Row {
  g: G
  skillId: string
  setting: Setting
  daysAgo: number
  evaluatorId: string
  siteId?: string
  clinicalSetting?: string
  location: string
  courseId: string
  levelIndex?: number
}

function mkEval(id: string, g: G, row: Pick<Row, "skillId" | "setting" | "daysAgo" | "evaluatorId" | "siteId" | "clinicalSetting" | "location" | "courseId" | "levelIndex">, outcome: Outcome, status: EvaluationStatus = "counted"): Evaluation {
  const at = dBefore(row.daysAgo)
  return {
    id,
    studentId: g.p.id,
    skillId: row.skillId,
    evaluatorId: row.evaluatorId,
    setting: row.setting,
    date: at,
    status,
    outcome,
    currentVersion: 1,
    versions: [{ version: 1, outcome, at, by: row.evaluatorId, reason: null }],
    ...(row.clinicalSetting ? { clinicalSetting: row.clinicalSetting } : {}),
    location: row.location,
    courseId: row.courseId,
    ...(row.levelIndex !== undefined ? { levelIndex: row.levelIndex } : {}),
    ...(row.siteId ? { siteId: row.siteId } : {}),
  }
}


// ---------------------------------------------------------------------------------------------------------------------

export interface HeroCounts {
  counted: number
  didNotQualify: number
  awaiting: number
  returned: number
  waiting: number
}

/** The five evidence counts from a state: the same function the tests use, so the partition is asserted, not assumed. */
export function evidenceStatusCounts(s: Pick<V2State, "evaluations" | "submissions">): HeroCounts {
  let counted = 0
  let didNotQualify = 0
  let awaiting = 0
  let returned = 0
  for (const e of s.evaluations) {
    if (e.status === "counted") {
      if (e.outcome === "met") counted++
      else didNotQualify++
    } else if (e.status === "reopened") didNotQualify++
    else if (e.status === "awaiting-approval") awaiting++
    else if (e.status === "returned") returned++
  }
  let waiting = 0
  for (const x of s.submissions) if (x.status === "with-evaluator" || x.status === "stalled" || x.status === "on-device") waiting += x.skillIds.length
  return { counted, didNotQualify, awaiting, returned, waiting }
}

/** Students whose Fall 2026 clock puts them behind pace on the four NURS 350 mandatory skills (the same arithmetic as reports.paceRows). */
function heroBehind(hero: V2State): number {
  const first = Date.parse("2026-08-24T00:00:00Z")
  const last = Date.parse("2026-12-11T00:00:00Z")
  const share = Math.min(1, Math.max(0, (Date.parse(`${DEMO_TODAY}T00:00:00Z`) - first) / (last - first)))
  const mand = hero.mappings.filter((m) => m.courseId === hero.course.id && m.level === "mandatory").map((m) => m.skillId)
  let n = 0
  for (const p of hero.people.filter((x) => x.kind === "student")) {
    let need = 0
    let have = 0
    for (const k of mand) {
      const skill = hero.skills.find((x) => x.id === k)
      if (!skill?.configured || !skill.published || !skill.config) continue
      const nd = skill.config.achievement.need
      need += nd
      have += Math.min(nd, hero.evaluations.filter((e) => e.studentId === p.id && e.skillId === k && e.status === "counted" && e.outcome === "met").length)
    }
    if (Math.floor(need * share) - have > 1) n++
  }
  return n
}

export function generate(hero: V2State): V2State {
  const second = hero.otherCourses?.[0]
  const courses = buildCourses(hero.course, second)
  const offerings = buildOfferings(courses)
  const siteBuild = buildSites()
  const sites = siteBuild.sites
  const siteById = new Map(sites.map((x) => [x.id, x]))

  // ---------------------------------------------------------------------------------------------------------------------
  // Skills

  const heroSkills = hero.skills.map((k0) => {
    // Medication administration and point-of-care blood glucose ask for approval (SC-15): the hero queue's rule holds sit on them.
    const k = HERO_APPROVAL.has(k0.id) && k0.config ? { ...k0, config: { ...k0.config, approvalRequired: true } } : k0
    const hid = TWIN_HGTC[k.id]
    if (!hid) return k
    const h = HGTC.find((x) => x.id === hid)!
    return { ...k, hgtc: { id: h.id, required: h.required, ...(h.group ? { group: h.group } : {}), ...(h.groupRule ? { groupRule: h.groupRule as "any" } : {}) } }
  })
  const genSkills = buildHgtcSkills()
  const skills = [...heroSkills, ...genSkills]
  const skillById = new Map(skills.map((k) => [k.id, k]))
  const hgtcOf = new Map(HGTC.map((h) => [skillIdOf(h), h]))

  const heroLib = new Set(hero.skills.map((k) => k.id))
  const PACE_SKILLS = [IDS.urinaryCath, "sk-med-admin", "sk-sterile-dressing", "sk-vitals"]
  const paceSet = new Set(PACE_SKILLS)
  const SKIP = new Set([IDS.ivCath, "sk-central-line"])
  const reqAll = HGTC.filter((h) => h.required).map(skillIdOf)
  const IV6 = HGTC.filter(isIvLevel).map(skillIdOf)
  const ivSet = new Set(IV6)
  const REQ44 = reqAll.filter((id) => !ivSet.has(id) && !paceSet.has(id))
  const rPop = stream("popularity")
  const FRONT = ["hgtc-safety-01", "hgtc-basic-skills-02", "hgtc-basic-skills-11", "hgtc-basic-skills-10", "hgtc-oxygenation-14", "hgtc-safety-16", "hgtc-medications-02", "hgtc-basic-skills-07"]
  const optionalAll = HGTC.filter((h) => !h.required && !UNCONFIGURED.has(h.id) && !SKIP.has(skillIdOf(h)) && !paceSet.has(skillIdOf(h))).map(skillIdOf)
  const optShuffled = shuffle(rPop, optionalAll)
  const TAIL = optShuffled.slice(-25)
  const OPT_REG = optShuffled.slice(0, -25)
  // Nasogastric tube care rests on one evaluator by design (the single-rater flag), so it never gets extra practice rows.
  const POP = [...FRONT.map(skillIdOf2), ...shuffle(rPop, [...REQ44, ...OPT_REG].filter((id) => !FRONT.map(skillIdOf2).includes(id) && id !== "sk-ng-tube"))]
  function skillIdOf2(hid: string) {
    return TWIN[hid] ?? hid
  }
  const popCum = cumulative(POP.map((_, i) => 1 / Math.pow(i + 1, 1.25)))

  // ---------------------------------------------------------------------------------------------------------------------
  // People

  const rPeople = stream("people")
  const heroStudents = hero.people.filter((p) => p.kind === "student")
  // The hand-written preceptors supervise at the hand-written places, which are now real site records (generate-ref.ts).
  const heroSite = heroSiteIds(sites)
  const HERO_HOME: Record<string, string | undefined> = {
    [IDS.delgado]: heroSite[HERO_SITES.inpatient[0].location],
    "pre-okonkwo": heroSite[HERO_SITES.inpatient[1].location],
    "pre-aldridge": heroSite[HERO_SITES.inpatient[1].location],
    "pre-castillo": heroSite[HERO_SITES.outpatient.location],
  }
  const entryYearOf = (cohortId: string) => Number(cohortId.slice(4)) - 2
  const studentNo = (cohortId: string, i: number) => INSTITUTION.studentNumber(entryYearOf(cohortId), 100 + ((i * 37 + 11) % 900))
  let heroNo = 0
  const people: Person[] = hero.people.map((p) =>
    p.kind === "student"
      ? { ...p, cohortId: "coh-2027", ...(p.cohort === "ABSN 2027" ? { trackIds: ["trk-accelerated"] } : {}), studentNumber: studentNo("coh-2027", 200 + heroNo++) }
      : HERO_HOME[p.id]
        ? { ...p, homeSiteId: HERO_HOME[p.id] }
        : { ...p },
  )
  const taken = new Set<string>(RESERVED_NAMES)
  const studentNames = namesFrom(111, 0, taken)

  const gs: G[] = []
  const gById = new Map<string, G>()
  const newG = (p: Person, year: Year, hero_: boolean): G => ({ p, year, hero: hero_, idx: gs.length, sites: {}, pace: [0, 0, 0, 0], kind: "standard", prog: 0, breadth: 0, ivArc: false, ivDone: 0, sameEvaluator: false, oneAway: false, labOnly: false, missingTail: 0, next: [] })
  for (const p of heroStudents) {
    const g = newG(p, 2027, true)
    gs.push(g)
    gById.set(p.id, g)
  }
  const mkStudent = (i: number, year: Year, cohort: string, group: string, track: boolean): G => {
    const nm = studentNames[i]
    const id = `stu-g-${String(i + 1).padStart(3, "0")}`
    const p: Person = { id, name: `${nm.given} ${nm.surname}`, title: cohort, kind: "student", email: personEmail(nm, INSTITUTION.studentDomain), cohort, group, cohortId: `coh-${year}`, ...(track ? { trackIds: ["trk-accelerated"] } : {}), studentNumber: studentNo(`coh-${year}`, i) }
    people.push(p)
    const g = newG(p, year, false)
    gs.push(g)
    gById.set(p.id, g)
    return g
  }
  let si = 0
  const g26: G[] = []
  const g27: G[] = []
  const g28: G[] = []
  for (let i = 0; i < 38; i++) g26.push(mkStudent(si++, 2026, "BSN 2026", ["Group A", "Group B", "Group C"][i % 3], false))
  for (let i = 0; i < 21; i++) g27.push(mkStudent(si++, 2027, "BSN 2027", ["Group A", "Group B", "Group C"][i % 3], false))
  for (let i = 0; i < 10; i++) g27.push(mkStudent(si++, 2027, "ABSN 2027", ["Group A", "Group B"][i % 2], true))
  for (let i = 0; i < 42; i++) g28.push(mkStudent(si++, 2028, "BSN 2028", ["Group A", "Group B", "Group C"][i % 3], false))

  // Evaluators: 146 generated preceptors, 18 faculty, 5 lab instructors, 3 more staff (the 8 hand-written staff make 180 with these 172).
  const act = siteBuild.active
  const wSite = act.map((_, i) => 1 / Math.pow(i + 1, 0.25))
  const wSum = wSite.reduce((a, b) => a + b, 0)
  const perSite = wSite.map((w) => Math.max(2, Math.round((146 * w) / wSum)))
  let diff = 146 - perSite.reduce((a, b) => a + b, 0)
  for (let i = 0; diff !== 0; i = (i + 1) % perSite.length) {
    if (diff > 0) {
      perSite[i]++
      diff--
    } else if (perSite[i] > 2) {
      perSite[i]--
      diff++
    }
  }
  const credPick = (r: Rand) => {
    const x = r()
    return x < 0.8 ? "RN" : x < 0.92 ? "LPN" : x < 0.97 ? "NP" : "RN, CNE"
  }
  const siteEvals = new Map<string, Array<{ id: string; w: number }>>()
  const preceptors: Person[] = []
  const evaluatorNames = namesFrom(146 + 18 + 5 + 3, 3, taken, RESERVED_SURNAMES)
  const nameOf = new Map<string, PersonName>()
  let pi = 0
  act.forEach((site, si2) => {
    const list: Array<{ id: string; w: number }> = []
    for (let j = 0; j < perSite[si2]; j++) {
      const nm = evaluatorNames[pi]
      const cred = credPick(rPeople)
      const forms = CREDENTIAL_FORMS[cred]
      const form = forms[(pi * 3 + j) % forms.length]
      const id = `pre-g-${String(pi + 1).padStart(3, "0")}`
      nameOf.set(id, nm)
      const p: Person = {
        id,
        name: `${nm.given} ${nm.surname}, ${form.display}`,
        title: `Preceptor, ${site.facility}`,
        kind: "preceptor",
        email: personEmail(nm, domainOf(site.facility)),
        credentials: [...form.tokens],
        yearsPractice: ri(rPeople, 1, 25),
        training: rPeople() < 0.4 ? ["IV therapy"] : [],
        homeSiteId: site.id,
      }
      preceptors.push(p)
      list.push({ id: p.id, w: (1 / Math.pow(j + 1, 1.15)) * (0.5 + rPeople()) })
      pi++
    }
    siteEvals.set(site.id, list)
  })
  // 14 unverified: the last preceptor of the smallest sites. Never picked for ordinary evidence.
  const unverifiedIds: string[] = []
  for (let i = act.length - 1; i >= 0 && unverifiedIds.length < 14; i--) {
    const list = siteEvals.get(act[i].id)!
    if (list.length > 2) {
      const last = list.pop()!
      unverifiedIds.push(last.id)
    }
  }
  for (let i = act.length - 1; i >= 0 && unverifiedIds.length < 14; i--) {
    const list = siteEvals.get(act[i].id)!
    if (list.length > 1) unverifiedIds.push(list.pop()!.id)
  }
  const unverified = new Set(unverifiedIds)
  // What the students typed for these 14 names (pools.UNVERIFIED_TYPED). The second is a nickname spelling of an adopted
  // preceptor at the same site (or, failing that, anywhere), so the merge suggestion is a real one.
  const typedName = (i: number, p: Person): { name: string; email: string } => {
    if (i !== 1) {
      const typed = UNVERIFIED_TYPED[i]
      const parts = typed.replace(/,.*$/, "").replace(/\s+RN$/, "").trim().split(/\s+/)
      const local = parts.map((x) => mailPart(x)).filter(Boolean).join(".")
      return { name: typed, email: `${local}@${i % 3 === 0 ? "mail.example" : domainOf(siteById.get(p.homeSiteId!)!.facility)}` }
    }
    const adopted = preceptors.filter((x) => !unverified.has(x.id) && NICKNAME[nameOf.get(x.id)!.given])
    const twin = adopted.find((x) => x.homeSiteId === p.homeSiteId) ?? adopted[0]
    const nm = nameOf.get(twin.id)!
    return { name: `${NICKNAME[nm.given]} ${nm.surname}`, email: `${mailPart(NICKNAME[nm.given])}.${mailPart(nm.surname)}@mail.example` }
  }
  for (const p of preceptors) {
    const k = unverifiedIds.indexOf(p.id)
    people.push(k >= 0 ? { ...p, ...typedName(k, p), verified: false } : p)
  }

  const faculty: Person[] = []
  const campuses = INSTITUTION.campuses
  for (let i = 0; i < 18; i++) {
    const nm = evaluatorNames[146 + i]
    const c = FACULTY_CREDENTIALS[i % FACULTY_CREDENTIALS.length]
    const p: Person = { id: `fac-g-${String(i + 1).padStart(2, "0")}`, name: `${c.doctor ? "Dr. " : ""}${nm.given} ${nm.surname}, ${c.display}`, title: `${FACULTY_TITLES[i % FACULTY_TITLES.length]}, ${campuses[i % campuses.length].name}`, kind: "faculty", email: personEmail(nm, INSTITUTION.domain), credentials: [...c.tokens], yearsPractice: ri(rPeople, 6, 25), training: [] }
    faculty.push(p)
    people.push(p)
  }
  const labInstr: Person[] = []
  for (let i = 0; i < 5; i++) {
    const nm = evaluatorNames[164 + i]
    const c = LAB_CREDENTIALS[i % LAB_CREDENTIALS.length]
    const home = siteBuild.labSites[i % siteBuild.labSites.length]
    const campus = home.facility.includes(", ") ? home.facility.split(", ")[1] : home.facility
    const p: Person = { id: `lab-g-${i + 1}`, name: `${nm.given} ${nm.surname}, ${c.display}`, title: `Lab instructor, ${campus}`, kind: "lab-instructor", email: personEmail(nm, INSTITUTION.domain), credentials: [...c.tokens], yearsPractice: ri(rPeople, 4, 20), training: ["Simulation facilitation"], homeSiteId: home.id }
    labInstr.push(p)
    people.push(p)
  }
  const staff: Person[] = []
  for (let i = 0; i < 3; i++) {
    const nm = evaluatorNames[169 + i]
    const p: Person = { id: `rev-g-${i + 1}`, name: `${nm.given} ${nm.surname}`, title: `${STAFF_TITLES[i % STAFF_TITLES.length]}, ${campuses[i % campuses.length].name}`, kind: "reviewer", email: personEmail(nm, INSTITUTION.domain) }
    staff.push(p)
    people.push(p)
  }
  const reviewers = [IDS.reviewer, ...staff.map((x) => x.id)]

  // Evaluator pick tables
  const siteCum = new Map<string, number[]>()
  for (const [sid, list] of siteEvals) siteCum.set(sid, cumulative(list.map((x) => x.w)))
  const placeCum = cumulative(wSite)
  const inpatientSites = act.filter((s) => s.clinicalSetting === "Inpatient")
  const inpCum = cumulative(inpatientSites.map((s) => wSite[act.indexOf(s)]))
  const evaluatorPick = (site: Site, r: Rand, exclude?: Set<string>): string => {
    const list = siteEvals.get(site.id)!
    const cum = siteCum.get(site.id)!
    let id = list[draw(cum, r)].id
    for (let t = 0; t < 8 && exclude?.has(id); t++) id = list[draw(cum, r)].id
    for (let t = 0; t < 40 && exclude?.has(id); t++) {
      const other = act[draw(placeCum, r)]
      id = siteEvals.get(other.id)![draw(siteCum.get(other.id)!, r)].id
    }
    return id
  }
  const labPool = [...labInstr, ...faculty]
  // Where lab evidence is recorded: the instructor's own lab, or for faculty the main lab of their campus (no site link).
  const labLocationOf = (p: Person): string => (p.homeSiteId ? siteById.get(p.homeSiteId)!.location : siteBuild.labSites[faculty.indexOf(p) % siteBuild.labSites.length].location)
  const labCum = cumulative(labPool.map((p) => (p.kind === "lab-instructor" ? 1 : 0.6)))
  const facCum = cumulative(faculty.map((_, i) => 1 / Math.pow(i + 1, 0.8)))

  // ---------------------------------------------------------------------------------------------------------------------
  // Student attributes: kinds, progress, arcs

  const rS = stream("students")
  // 2026: 31 complete, 4 one short (Hangs PB Med), 3 far behind.
  g26.forEach((g, i) => {
    g.kind = i < 31 ? "complete" : i < 35 ? "one-short" : "far-behind"
    g.prog = 1
    g.breadth = 0.4 + rS() * 0.5
    g.pace = [3, 3, 3, 3]
  })
  // 2027 (generated 31) and hero 12: 9 generated students are behind in IV therapy (arc 1).
  const arcIdx = new Set([0, 2, 3, 5, 8, 11, 14, 17, 21])
  g27.forEach((g, i) => {
    g.prog = 0.2 + rS() * 0.55
    g.breadth = 0.05 + rS() * 0.45
    if (arcIdx.has(i)) {
      g.ivArc = true
      g.ivDone = rS() < 0.5 ? 0 : 1
    } else g.ivDone = ri(rS, 4, 6)
  })
  for (const g of gs.filter((x) => x.hero)) {
    g.prog = 0.15 + rS() * 0.6
    g.breadth = 0.05 + rS() * 0.4
    g.ivDone = ri(rS, 4, 6)
  }
  g28.forEach((g) => {
    g.prog = 0.08 + rS() * 0.42
    g.breadth = 0.02 + rS() * 0.25
    g.ivDone = 0
  })
  // Pace on the four NURS 350 skills. Behind = few Met toward the four rules (reports.paceRows).
  const needBehind = Math.max(0, BEHIND_TARGET - heroBehind(hero))
  const behindIds = new Set<string>()
  const arcList = g27.filter((g) => g.ivArc)
  for (const g of arcList.slice(0, Math.max(0, needBehind - 2))) behindIds.add(g.p.id)
  if (needBehind >= 2) {
    behindIds.add(g27.filter((g) => g.p.cohort === "ABSN 2027" && !g.ivArc)[0].p.id)
    behindIds.add(g28[7].p.id)
  }
  // Order of fill: oral medication, sterile dressing, urinary catheter, vital signs.
  const paceVec = (sum: number): [number, number, number, number] => {
    const med = Math.min(3, sum)
    const ster = Math.min(3, Math.max(0, sum - 3))
    const uri = Math.min(3, Math.max(0, sum - 6))
    const vit = Math.min(3, Math.max(0, sum - 9))
    return [uri, med, ster, vit]
  }
  for (const g of [...g27, ...g28]) {
    const behind = behindIds.has(g.p.id)
    const sum = behind ? ri(rS, 2, 4) : g.year === 2027 ? Math.min(12, 5 + Math.round(g.prog * 9) + ri(rS, 0, 2)) : ri(rS, 5, 8)
    g.pace = paceVec(sum)
  }
  for (const g of gs.filter((x) => x.hero)) g.pace = [0, 0, 0, 0]
  // 2026 far behind: missing 4 or more required rows (IV therapy + 12 / 9 / 4 more).
  const far = [12, 9, 4]
  g26.filter((g) => g.kind === "far-behind").forEach((g, i) => (g.missingTail = far[i]))
  // Arc 13: 12 students have two sign-offs from the same person on a two-evaluator skill. Arc 4: 6 are one sign-off away.
  const std = [...g27.filter((g) => !g.ivArc), ...g28]
  shuffle(stream("arc13"), std).slice(0, 12).forEach((g) => (g.sameEvaluator = true))
  shuffle(stream("arc4"), std.filter((g) => !g.sameEvaluator && g.prog > 0.4)).slice(0, 6).forEach((g) => (g.oneAway = true))
  // Arc 10: about 20 students have lab-only evidence on a skill that needs a clinical setting.
  shuffle(stream("arc10"), [...g27, ...g28].filter((g) => !g.ivArc)).slice(0, 20).forEach((g) => (g.labOnly = true))

  // Placements: one site per student per enrolled term, heavy tail. site-087 holds 9 this term; the IV-arc students sit at three sites.
  const rPl = stream("placements")
  // Hand-written placements gain the site record their location names (they keep every other field).
  const placements: Placement[] = [...hero.placements.map((p) => (!p.siteId && heroSite[p.location] ? { ...p, siteId: heroSite[p.location] } : { ...p }))]
  const t3 = CURRENT_TERM
  const arcSites = [STALLED_SITE, STALLED_SITE, STALLED_SITE, STALE_SITES[0], STALE_SITES[0], STALE_SITES[1], undefined, undefined, undefined]
  const siteForced = new Map<string, string>()
  arcList.forEach((g, i) => {
    const s = arcSites[i]
    if (s) siteForced.set(g.p.id, s)
  })
  const plain27 = g27.filter((g) => !g.ivArc)
  const plain28 = g28.filter((g) => !behindIds.has(g.p.id))
  ;[plain27[1], plain27[4], plain27[9], plain28[2], plain28[11], plain28[20]].forEach((g) => siteForced.set(g.p.id, STALLED_SITE))
  const homeCourse = (g: G) => clinicalCourseFor(`coh-${g.year}`, courses)
  // Rotation dates (dataset spec section 12): a separate stream, so adding dates moved no other draw.
  const rDates = stream("placement-dates")
  const heroPlaced = new Set(hero.placements.map((p) => `${p.studentId}|${p.termId ?? t3}`))
  for (const g of gs) {
    const enrolled = ENROLLED[`coh-${g.year}`]
    for (const t of enrolled) {
      const forced = t === t3 ? siteForced.get(g.p.id) : undefined
      let site = forced ? siteById.get(forced)! : act[draw(placeCum, rPl)]
      // site-087 holds exactly the placements forced onto it this term: the stalled-site story needs a known count.
      while (!forced && t === t3 && site.id === STALLED_SITE) site = act[draw(placeCum, rPl)]
      g.sites[t] = site
      // A term the hand-written layer leaves without a placement gets one, so every student has a rotation in every term.
      if (!g.hero || !heroPlaced.has(`${g.p.id}|${t}`)) {
        const cid = t === t3 && g.year === 2027 ? hero.course.id : homeCourse(g)
        const term = TERMS.find((x) => x.id === t)!
        const offering = offerings.find((o) => o.courseId === cid && o.termId === t)
        placements.push({ id: g.hero ? `pl-h-${g.p.id.slice(4)}-${t.slice(4)}` : `pl-g-${g.p.id.slice(6)}-${t.slice(4)}`, studentId: g.p.id, courseId: cid, location: site.location, setting: site.clinicalSetting ?? "Inpatient", siteId: site.id, termId: t, ...(offering ? { offeringId: offering.id } : {}), ...rotationDates(term, rDates, t === t3) })
      }
    }
  }
  for (const p of placements) if (!p.offeringId && p.termId) {
    const offering = offerings.find((o) => o.courseId === p.courseId && o.termId === p.termId)
    if (offering) p.offeringId = offering.id
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // Evidence

  const evals: Evaluation[] = []
  const rows: Row[] = []
  const rowsByEvaluator = new Map<string, Row[]>()
  const attempted = new Map<string, G[]>()
  const optionalRows: Evaluation[] = []
  let evN = 0
  const evId = () => `ev-g-${String(++evN).padStart(5, "0")}`

  const ageFor = (g: G, r: Rand): number => {
    const older = g.year === 2026 ? 0.6 : g.year === 2027 ? 0.72 : 0.6
    if (r() >= older) return ri(r, 1, 62)
    return g.year === 2026 ? ri(r, 63, 395) : g.year === 2027 ? ri(r, 63, 285) : ri(r, 63, 150)
  }
  const settingFor = (skillId: string, r: Rand, labP: number): Setting => {
    const h = hgtcOf.get(skillId)
    if (skillId === "sk-vitals") return r() < 0.11 ? "lab" : "clinical"
    if (h?.setting === "lab") return "lab"
    if (h?.setting === "clinical") return "clinical"
    return r() < labP ? "lab" : "clinical"
  }
  const needsInpatient = (skillId: string) => skillById.get(skillId)?.config?.achievement.settingMinimums.some((m) => m.setting === "Inpatient") ?? false
  const rowFor = (g: G, skillId: string, setting: Setting, daysAgo: number, r: Rand, exclude?: Set<string>): Row => {
    const course = setting === "clinical" ? clinicalCourseFor(`coh-${g.year}`, courses) : g.year === 2027 ? "crs-nurs352" : clinicalCourseFor(`coh-${g.year}`, courses)
    const courseId = g.year === 2027 && daysAgo <= 62 ? (setting === "clinical" ? hero.course.id : "crs-nurs352") : course
    if (skillId === "sk-ng-tube") return { g, skillId, setting: "clinical", daysAgo, evaluatorId: "pre-castillo", clinicalSetting: "Outpatient", location: HERO_SITES.outpatient.location, courseId }
    if (setting === "lab") {
      let inst = labPool[draw(labCum, r)]
      for (let t = 0; t < 20 && exclude?.has(inst.id); t++) inst = labPool[draw(labCum, r)]
      return { g, skillId, setting, daysAgo, evaluatorId: inst.id, siteId: inst.homeSiteId, location: labLocationOf(inst), courseId }
    }
    if (setting === "simulation") {
      return { g, skillId, setting, daysAgo, evaluatorId: faculty[draw(facCum, r)].id, location: "Simulation lab", courseId }
    }
    let site = g.sites[termOf(daysAgo)] ?? g.sites[t3]
    if (needsInpatient(skillId) && site.clinicalSetting !== "Inpatient") site = inpatientSites[draw(inpCum, r)]
    return { g, skillId, setting, daysAgo, evaluatorId: evaluatorPick(site, r, exclude), siteId: site.id, clinicalSetting: site.clinicalSetting ?? undefined, location: site.location, courseId }
  }
  const emit = (row: Row, outcome: Outcome, optional = false): Evaluation => {
    const e = mkEval(evId(), row.g, row, outcome)
    evals.push(e)
    if (outcome === "met") {
      rows.push(row)
      const l = rowsByEvaluator.get(row.evaluatorId)
      if (l) l.push(row)
      else rowsByEvaluator.set(row.evaluatorId, [row])
      if (optional) optionalRows.push(e)
    }
    return e
  }
  const markAttempt = (skillId: string, g: G) => {
    const l = attempted.get(skillId)
    if (l) {
      if (l[l.length - 1] !== g) l.push(g)
    } else attempted.set(skillId, [g])
  }
  const OPT_SCALE = 0.75
  const PBMED = "hgtc-nutrition-18"
  const BP = "hgtc-basic-skills-11"

  /** Met evaluations that make a skill's rule hold (or fall one short). */
  const doSkill = (g: G, skillId: string, r: Rand, o: { short?: boolean; optional?: boolean; same?: boolean; labOnly?: boolean } = {}) => {
    if (g.hero && heroLib.has(skillId)) return
    const k = skillById.get(skillId)!
    const a = k.config!.achievement
    let n = a.need
    if (o.short) n = Math.max(0, n - 1)
    const used = new Set<string>()
    let first: string | null = null
    for (let i = 0; i < n; i++) {
      const setting = o.labOnly ? "lab" : settingFor(skillId, r, g.year === 2026 ? 0.36 : 0.4)
      const row = rowFor(g, skillId, setting, ageFor(g, r), r, a.distinctEvaluators > 1 && !o.same ? used : undefined)
      if (o.same && first) row.evaluatorId = first
      first ??= row.evaluatorId
      used.add(row.evaluatorId)
      if (ivSet.has(skillId)) row.levelIndex = 1 + (r() < 0.4 ? 1 : 0)
      emit(row, "met", !!o.optional)
      markAttempt(skillId, g)
    }
  }

  const reqOrder = [...REQ44, ...IV6]
  for (const g of gs) {
    const r = stream(`plan:${g.p.id}`)
    const hasHero = g.hero
    // Pace skills (generated students only; hero students keep their hand-written history).
    if (!hasHero) {
      PACE_SKILLS.forEach((sk, k) => {
        for (let i = 0; i < g.pace[k]; i++) {
          const setting = settingFor(sk, r, 0.11)
          emit(rowFor(g, sk, setting, ageFor(g, r), r), "met")
          markAttempt(sk, g)
        }
      })
    }
    // Required rows.
    const nonIv = REQ44.length
    let reqCount = g.kind === "complete" || g.kind === "one-short" ? nonIv : g.kind === "far-behind" ? nonIv - g.missingTail : Math.round(g.prog * nonIv)
    reqCount = Math.max(0, Math.min(nonIv, reqCount))
    const labOnlySkill = g.labOnly ? REQ44.slice(0, reqCount).find((id) => hgtcOf.get(id)?.setting === "clinical") : undefined
    for (let i = 0; i < reqCount; i++) {
      const sk = REQ44[i]
      if (g.oneAway && sk === BP) doSkill(g, sk, r, { short: true })
      else doSkill(g, sk, r, { same: g.sameEvaluator && skillById.get(sk)!.config!.achievement.distinctEvaluators > 1, labOnly: sk === labOnlySkill })
    }
    // IV therapy rows (the level rows).
    const ivList = IV6.slice()
    let ivTake = 0
    if (g.kind === "complete") ivTake = 6
    else if (g.kind === "one-short") ivTake = 6
    else if (g.kind === "far-behind") ivTake = 0
    else ivTake = g.ivDone
    ivList.forEach((sk, i) => {
      if (g.kind === "one-short" && sk === PBMED) return
      if (i < ivTake) doSkill(g, sk, r)
    })
    // Optional rows.
    const optCount = Math.round(g.breadth * OPT_SCALE * OPT_REG.length)
    for (let i = 0; i < optCount; i++) doSkill(g, OPT_REG[i], r, { optional: true })
    // What is still ahead.
    const nextReq = [...REQ44.slice(reqCount), ...IV6.filter((sk, i) => i >= ivTake || (g.kind === "one-short" && sk === PBMED))]
    g.next = [...nextReq, ...OPT_REG.slice(optCount)]
    if (g.kind === "one-short") g.next = [PBMED, ...g.next.filter((x) => x !== PBMED)]
    if (g.ivArc) g.next = [...IV6.filter((sk, i) => i >= g.ivDone), ...g.next.filter((x) => !ivSet.has(x))]
    void reqOrder
  }

  // Tail skills: a handful of pieces each, from a few graduating students (the long tail).
  const rTail = stream("tail")
  TAIL.forEach((sk, i) => {
    const n = i % 5
    for (let j = 0; j < n; j++) {
      const g = g26[ri(rTail, 0, 30)]
      const setting = settingFor(sk, rTail, 0.25)
      emit(rowFor(g, sk, setting, ageFor(g, rTail), rTail), "met", true)
      markAttempt(sk, g)
    }
  })

  // Unverified evaluators: each holds one to six pieces of evidence (a name a student gave that the program has not adopted).
  const rUn = stream("unverified")
  unverifiedIds.forEach((id, i) => {
    const owner = people.find((p) => p.id === id)!
    const site = siteById.get(owner.homeSiteId!)!
    for (let j = 0; j < 1 + (i % 6); j++) {
      const g = pick(rUn, [...g27, ...g28])
      const sk = OPT_REG[ri(rUn, 0, OPT_REG.length - 1)]
      const row = rowFor(g, sk, "clinical", ageFor(g, rUn), rUn)
      emit({ ...row, evaluatorId: id, siteId: site.id, clinicalSetting: site.clinicalSetting ?? undefined, location: site.location }, "met")
      markAttempt(sk, g)
    }
  })

  // Quotas: hero counts first.
  const heroC = evidenceStatusCounts(hero)
  const metQuota = TARGETS.counted - heroC.counted
  let metNow = evals.filter((e) => e.outcome === "met").length
  if (metNow > metQuota) {
    // Trim the optional rows added last until the total fits.
    const drop = new Set<string>()
    for (let i = optionalRows.length - 1; i >= 0 && metNow - drop.size > metQuota; i--) drop.add(optionalRows[i].id)
    if (metNow - drop.size > metQuota) throw new Error(`Generator overshoot: ${metNow - drop.size - metQuota} more rows than the quota and no optional rows left to trim.`)
    for (let i = evals.length - 1; i >= 0; i--) if (drop.has(evals[i].id)) evals.splice(i, 1)
    for (let i = rows.length - 1; i >= 0; i--) {
      /* rows are pruned below by rebuilding from evals */
    }
    metNow = metQuota
    rebuildRows()
  }
  function rebuildRows() {
    const keep = new Set(evals.map((e) => e.id))
    const idxById = new Map<string, number>()
    evals.forEach((e, i) => idxById.set(e.id, i))
    void keep
    // Re-derive rows from evaluations (the row fields are all on the evaluation).
    rows.length = 0
    rowsByEvaluator.clear()
    for (const e of evals) {
      if (e.outcome !== "met") continue
      const g = gById.get(e.studentId)!
      const row: Row = { g, skillId: e.skillId, setting: e.setting, daysAgo: Math.round((todayMs - Date.parse(e.date)) / 86_400_000), evaluatorId: e.evaluatorId, siteId: e.siteId, clinicalSetting: e.clinicalSetting, location: e.location ?? "", courseId: e.courseId ?? "", levelIndex: e.levelIndex }
      rows.push(row)
      const l = rowsByEvaluator.get(e.evaluatorId)
      if (l) l.push(row)
      else rowsByEvaluator.set(e.evaluatorId, [row])
    }
  }
  // Extras: more practice on the popular skills, by students who already did them. A few are simulation. 25 are Met below the minimum level.
  const rEx = stream("extras")
  const attemptedFinal = new Map<string, G[]>()
  for (const [k, l] of attempted) attemptedFinal.set(k, l.filter((x) => !x.hero))
  let shortfall = 25
  let guard = 0
  while (metNow < metQuota && guard++ < 200000) {
    if (shortfall > 0) {
      const sk = IV6[ri(rEx, 0, IV6.length - 1)]
      const pool = attemptedFinal.get(sk)
      if (pool && pool.length) {
        const g = pool[ri(rEx, 0, pool.length - 1)]
        const row = rowFor(g, sk, "clinical", ageFor(g, rEx), rEx)
        row.levelIndex = 0
        emit(row, "met")
        shortfall--
        metNow++
        continue
      }
    }
    const sk = POP[draw(popCum, rEx)]
    const pool = attemptedFinal.get(sk)
    if (!pool || pool.length === 0) continue
    const g = pool[ri(rEx, 0, pool.length - 1)]
    const sim = rEx() < 0.3 && skillById.get(sk)?.config?.simulation.allowed
    const setting: Setting = sim ? "simulation" : settingFor(sk, rEx, 0.4)
    if (g.labOnly && hgtcOf.get(sk)?.setting === "clinical") continue
    emit(rowFor(g, sk, setting, ageFor(g, rEx), rEx), "met")
    metNow++
  }
  if (metNow !== metQuota) throw new Error(`Generator: ${metNow} Met rows, expected ${metQuota}`)

  // ---------------------------------------------------------------------------------------------------------------------
  // Outliers, did not qualify, returned, awaiting approval

  const evalCount = [...rowsByEvaluator].map(([id, l]) => [id, l.length] as [string, number]).filter(([id]) => id.startsWith("pre-g-")).sort((a, b) => b[1] - a[1])
  const OUT_A = evalCount[1][0]
  const OUT_B = evalCount[2][0]
  const OUT_C = evalCount[3][0]
  const nOf = (id: string) => rowsByEvaluator.get(id)?.length ?? 0
  const rQ = stream("quality")
  // Pending items (returned, awaiting approval, waiting) belong to students outside the graduating cohort, so 28 of the 38 graduating
  // students are free of anything open. The ten that hold open items are listed in the waiting block below.
  const allowed = (g: G) => !g.hero && g.year !== 2026
  const rowsOk = new Map<string, Row[]>()
  for (const [id, l] of rowsByEvaluator) rowsOk.set(id, l.filter((x) => allowed(x.g)))
  const others = [...rowsOk].filter(([id, l]) => l.length > 0 && id !== OUT_A && id !== OUT_B && id !== OUT_C && !unverified.has(id) && id.startsWith("pre-g-"))
  const othersCum = cumulative(others.map(([, l]) => l.length))
  const pickOther = () => others[draw(othersCum, rQ)][0]
  const pickRow = (evaluatorId: string): Row | null => {
    const l = rowsOk.get(evaluatorId)
    return l && l.length ? l[ri(rQ, 0, l.length - 1)] : null
  }

  const dnqQuota = TARGETS.didNotQualify - STORY_ANSWERED - heroC.didNotQualify
  const meanDnq = dnqQuota / metQuota
  const nB = Math.round(Math.min(0.18, meanDnq * 3.5) * nOf(OUT_B))
  const nC = Math.round(Math.min(0.18, meanDnq * 3.2) * nOf(OUT_C))
  const dnqPlan: string[] = [...Array(nB).fill(OUT_B), ...Array(nC).fill(OUT_C)]
  while (dnqPlan.length < dnqQuota) dnqPlan.push(pickOther())
  const notMetEvals: Evaluation[] = []
  for (const evaluatorId of dnqPlan) {
    let row = pickRow(evaluatorId)
    if (!row) row = pickRow(pickOther())!
    const outcome: Outcome = rQ() < 0.62 ? "not-yet" : "not-met"
    const e = mkEval(evId(), row.g, { ...row, daysAgo: row.daysAgo + ri(rQ, 0, 20), levelIndex: undefined }, outcome)
    evals.push(e)
    notMetEvals.push(e)
  }

  const subs: Submission[] = []
  const logEntries: LogEntry[] = []
  let subN = 0
  const subId = () => `sub-g-${String(++subN).padStart(3, "0")}`
  const rowsOfStudentWith = (evaluatorId: string, _avoid?: Set<string>): Row[] => {
    const l = rowsOk.get(evaluatorId) ?? []
    return l
  }
  void rowsOfStudentWith

  /** Evaluations from an evaluator's rows of one student: one per distinct skill, up to `size`. */
  const siblingGroup = (evaluatorId: string, size: number, usedSkills?: Set<string>): Row[] => {
    const first = pickRow(evaluatorId)
    if (!first) return []
    const mine = (rowsOk.get(evaluatorId) ?? []).filter((x) => x.g === first.g)
    const seen = new Set<string>([first.skillId])
    const out = [first]
    for (const x of mine) {
      if (out.length >= size) break
      if (!seen.has(x.skillId)) {
        seen.add(x.skillId)
        out.push(x)
      }
    }
    void usedSkills
    return out
  }

  // Returned: 64 evaluations in 40 requests (24 with two skills). Evaluator A and C are the outliers.
  const retQuota = TARGETS.returned - heroC.returned
  const meanRet = retQuota / metQuota
  const nRetA = Math.round(Math.min(0.06, meanRet * 3.6) * nOf(OUT_A))
  const nRetC = Math.round(Math.min(0.06, meanRet * 3.2) * nOf(OUT_C))
  let retDone = 0
  const retPlan: string[] = [...Array(Math.max(1, Math.round(nRetA / 1.6))).fill(OUT_A), ...Array(Math.max(1, Math.round(nRetC / 1.6))).fill(OUT_C)]
  let retIdx = 0
  while (retDone < retQuota) {
    const evaluatorId = retIdx < retPlan.length ? retPlan[retIdx] : pickOther()
    const want = Math.min(retQuota - retDone, retIdx % 5 < 3 ? 2 : 1)
    const grp = siblingGroup(evaluatorId, want)
    retIdx++
    if (grp.length === 0) continue
    const sid = subId()
    const age = ri(rQ, 2, 40)
    const rv = reviewers[retIdx % reviewers.length]
    const note = RETURN_REASONS[retIdx % RETURN_REASONS.length]
    grp.forEach((row, i) => {
      const e = mkEval(evId(), row.g, { ...row, daysAgo: age + 1, levelIndex: undefined }, "met", "returned")
      e.submissionId = sid
      e.versions[0].detail = { feedback: feedbackText(retIdx + i, "met") }
      e.review = { decision: "returned", byId: rv, at: dBefore(age), note }
      evals.push(e)
    })
    retDone += grp.length
    subs.push({
      id: sid,
      studentId: grp[0].g.p.id,
      skillIds: grp.map((x) => x.skillId),
      method: retIdx % 3 === 0 ? "link" : retIdx % 3 === 1 ? "qr" : "handover",
      status: "returned",
      assignedToId: evaluatorId,
      createdAt: dBefore(age + 2),
      daysWaiting: age,
      candidateIds: [evaluatorId],
      completedById: evaluatorId,
      completedAt: dBefore(age + 1),
      revisions: 0,
      returns: [{ at: dBefore(age), byId: rv, reason: note, revision: 1 }],
      siteId: grp[0].siteId,
    })
  }

  // Awaiting approval: 12 more evaluations in 7 requests; evaluator A holds four of the seven. Two are older than 10 days.
  const awQuota = TARGETS.awaiting - heroC.awaiting
  const awPlan: Array<[string, number, number]> = [[OUT_A, 2, 2], [OUT_A, 1, 6], [OUT_A, 1, 11], [OUT_A, 1, 14]]
  const g26Complete = [...g26.slice(0, 3)]
  void g26Complete
  const awOthers: Array<[number, number]> = [[2, 1], [2, 4], [3, 9]]
  let awDone = 0
  const awRequests: Array<{ evaluatorId: string; size: number; age: number }> = awPlan.map(([evaluatorId, size, age]) => ({ evaluatorId, size, age }))
  for (const [size, age] of awOthers) awRequests.push({ evaluatorId: pickOther(), size, age })
  // A rule hold (SC-15) sits only on a skill whose configuration asks for approval: each held evaluation takes the next such skill in
  // turn, keeping its student, evaluator, site, course and date. No extra draw, so every other stream is unchanged.
  const approvalIds = skills.filter((k) => k.configured && k.published && k.active !== false && k.config?.approvalRequired).map((k) => k.id)
  let apN = 0
  const holdSkill = (taken: Set<string>): string => {
    for (let i = 0; i < approvalIds.length; i++) {
      const id = approvalIds[(apN + i) % approvalIds.length]
      if (!taken.has(id)) {
        apN = (apN + i + 1) % approvalIds.length
        taken.add(id)
        return id
      }
    }
    return approvalIds[0]
  }
  let awIdx = 0
  for (const req of awRequests) {
    const grp0 = siblingGroup(req.evaluatorId, req.size)
    if (grp0.length === 0) continue
    const taken = new Set<string>()
    const grp = grp0.map((row) => ({ ...row, skillId: holdSkill(taken) }))
    const sid = subId()
    const rv = reviewers[awIdx % reviewers.length]
    const entryIds: string[] = []
    grp.forEach((row, i) => {
      const e = mkEval(evId(), row.g, { ...row, daysAgo: req.age, levelIndex: undefined }, "met", "awaiting-approval")
      e.submissionId = sid
      e.versions[0].detail = { feedback: feedbackText(awIdx + i + 40, "met") }
      evals.push(e)
      awDone++
      if (awIdx === 1 && i === 0) {
        // One request where the student rated herself lower than the evaluator did.
        const lid = `log-${sid}-1`
        entryIds.push(lid)
        const sk = skillById.get(row.skillId)
        logEntries.push({ id: lid, studentId: row.g.p.id, skillId: row.skillId, batchId: `lb-${sid}`, setting: "clinical", clinicalSetting: row.clinicalSetting ?? null, location: row.location, rating: sk?.config?.outcomeLabels[1] ?? "Not met", answers: null, note: "", at: dBefore(req.age + 1), requestId: sid })
      }
    })
    subs.push({
      id: sid,
      studentId: grp[0].g.p.id,
      skillIds: grp.map((x) => x.skillId),
      method: awIdx % 2 === 0 ? "link" : "qr",
      status: "awaiting-review",
      assignedToId: rv,
      createdAt: dBefore(req.age + 1),
      daysWaiting: req.age,
      candidateIds: [req.evaluatorId],
      completedById: req.evaluatorId,
      completedAt: dBefore(req.age),
      ...(entryIds.length ? { entryIds } : {}),
      siteId: grp[0].siteId,
    })
    awIdx++
  }
  if (awDone !== awQuota) {
    // Top up with single-skill requests from other evaluators until the quota holds exactly.
    while (awDone < awQuota) {
      const grp0 = siblingGroup(pickOther(), 1)
      if (!grp0.length) continue
      const grp = grp0.map((row) => ({ ...row, skillId: holdSkill(new Set<string>()) }))
      const sid = subId()
      const age = ri(rQ, 1, 9)
      const e = mkEval(evId(), grp[0].g, { ...grp[0], daysAgo: age, levelIndex: undefined }, "met", "awaiting-approval")
      e.submissionId = sid
      e.versions[0].detail = { feedback: feedbackText(awDone + 60, "met") }
      evals.push(e)
      subs.push({ id: sid, studentId: grp[0].g.p.id, skillIds: [grp[0].skillId], method: "qr", status: "awaiting-review", assignedToId: reviewers[0], createdAt: dBefore(age + 1), daysWaiting: age, candidateIds: [grp[0].evaluatorId], completedById: grp[0].evaluatorId, completedAt: dBefore(age), siteId: grp[0].siteId })
      awDone++
    }
    if (awDone > awQuota) throw new Error(`Generator: ${awDone} awaiting, expected ${awQuota}`)
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // Waiting requests: 404 skill requests in buckets 0-3 / 4-7 / 8-14 / 15+ days = 40 / 25 / 22 / 13 percent.

  const rW = stream("waiting")
  const heroWait = hero.submissions.filter((x) => x.status === "with-evaluator" || x.status === "stalled" || x.status === "on-device")
  const bucketOf = (age: number) => (age <= 3 ? 0 : age <= 7 ? 1 : age <= 14 ? 2 : 3)
  const bucketTarget = [162, 101, 89, 52]
  const bucketUsed = [0, 0, 0, 0]
  for (const x of heroWait) bucketUsed[bucketOf(x.daysWaiting)] += x.skillIds.length
  const sitePreceptor = (siteId: string, ex?: Set<string>) => evaluatorPick(siteById.get(siteId)!, rW, ex)
  const unvList = unverifiedIds.slice(0, 3)
  const addWait = (g: G, skillIds: string[], age: number, evaluatorId: string, status: Submission["status"] = "with-evaluator") => {
    const e = people.find((p) => p.id === evaluatorId)
    subs.push({ id: subId(), studentId: g.p.id, skillIds, method: (["qr", "link", "handover"] as const)[subN % 3], status, assignedToId: evaluatorId, createdAt: dBefore(age), daysWaiting: age, candidateIds: [evaluatorId], ...(e?.homeSiteId ? { siteId: e.homeSiteId } : {}) })
    bucketUsed[bucketOf(age)] += skillIds.length
  }
  const nextTwo = (g: G, n: number) => g.next.slice(0, n)
  // Arc 1: nine students behind in IV therapy. Six have two old IV requests at three sites; three have recent ones.
  const oldPlan: Array<[number, string]> = [[0, STALLED_SITE], [1, STALLED_SITE], [2, STALLED_SITE], [3, STALE_SITES[0]], [4, STALE_SITES[0]], [5, STALE_SITES[1]]]
  let oldN = 0
  for (const [i, site] of oldPlan) {
    const g = arcList[i]
    const skillIds = IV6.filter((_, k) => k >= g.ivDone).slice(0, 2)
    const age = ri(rW, 16, 30) + (site === STALLED_SITE ? 0 : 0)
    addWait(g, skillIds, age, sitePreceptor(site))
    oldN++
  }
  void oldN
  for (let i = 6; i < 9; i++) {
    const g = arcList[i]
    addWait(g, IV6.filter((_, k) => k >= g.ivDone).slice(0, 2), ri(rW, 1, 9), evaluatorPick(g.sites[t3], rW))
  }
  // site-087: eight more old requests (four requests of two skills), three of them stalled one a week apart.
  const at087 = gs.filter((g) => !g.hero && g.sites[t3].id === STALLED_SITE && !g.ivArc)
  ;[21, 28, 34, 17].forEach((age, i) => {
    const g = at087[i % at087.length]
    const ids = nextTwo(g, 2)
    addWait(g, ids.length ? ids : ["hgtc-basic-skills-02"], age, sitePreceptor(STALLED_SITE), i < 3 ? "stalled" : "with-evaluator")
  })
  // The two stale sites: a few requests older than 10 days that are not IV therapy.
  STALE_SITES.forEach((site, i) => {
    const pool = gs.filter((g) => !g.hero && !g.ivArc && g.year !== 2026 && g.sites[t3].id === site)
    const g = pool[0] ?? g27.find((x) => !x.ivArc)!
    addWait(g, nextTwo(g, 2), ri(rW, 11, 14), sitePreceptor(site))
    if (i === 1) addWait(pool[1] ?? g, nextTwo(pool[1] ?? g, 1), 12, sitePreceptor(site))
  })
  // Three unverified evaluators each hold two requests older than 8 days.
  unvList.forEach((id, i) => {
    const pool = gs.filter((g) => !g.hero && g.year !== 2026 && !g.ivArc)
    const g = pool[(i * 11 + 3) % pool.length]
    addWait(g, nextTwo(g, 1), ri(rW, 9, 14), id)
    const g2 = pool[(i * 11 + 7) % pool.length]
    addWait(g2, nextTwo(g2, 1), ri(rW, 16, 20), id)
  })
  // Graduating students: the four one short and the three far behind hold waiting requests; three of the one short wait on Hangs PB Med.
  g26.slice(31).forEach((g, i) => {
    const ids = i < 3 ? [PBMED] : nextTwo(g, 2)
    addWait(g, ids, ri(rW, 3, 12), evaluatorPick(g.sites[t3], rW))
  })
  // Three complete graduating students also hold one open request each, so 10 of 38 are blocked from verification and 28 are ready.
  g26.slice(0, 3).forEach((g) => addWait(g, nextTwo(g, 1), ri(rW, 2, 6), evaluatorPick(g.sites[t3], rW)))

  // Generic requests fill each bucket exactly.
  const pool = gs.filter((g) => allowed(g) && g.year !== 2026 && !g.ivArc)
  const sizes = [2, 2, 1, 2, 1]
  const ranges: Array<[number, number]> = [[0, 3], [4, 7], [8, 14], [15, 35]]
  for (let b = 0; b < 4; b++) {
    let i = 0
    while (bucketUsed[b] < bucketTarget[b]) {
      const g = pool[(subN * 7 + i * 13 + b) % pool.length]
      const left = bucketTarget[b] - bucketUsed[b]
      const size = Math.min(left, sizes[i % sizes.length], Math.max(1, g.next.length))
      const ids = g.next.slice(i % 3, (i % 3) + size)
      const useIds = ids.length === size ? ids : g.next.slice(0, size)
      if (useIds.length === 0) {
        i++
        continue
      }
      const age = ri(rW, ranges[b][0], ranges[b][1])
      // Generic requests stay away from the three sites the stale-request story is written about.
      let site = g.sites[t3]
      while (site.id === STALLED_SITE || STALE_SITES.includes(site.id)) site = act[draw(placeCum, rW)]
      const ev = evaluatorPick(site, rW)
      addWait(g, useIds, age, ev)
      i++
    }
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // Lab check-offs and practice trials, remediation, concerns, audit

  const labCheckoffs: LabCheckoff[] = hero.labCheckoffs.map((c) => ({ ...c }))
  const rLab = stream("lab")
  const with27 = new Set(g27.slice(0, 18).map((g) => g.p.id))
  for (const g of [...g26, ...g27]) {
    if (g.year === 2027 && !with27.has(g.p.id)) continue
    const inst = labInstr[ri(rLab, 0, labInstr.length - 1)]
    labCheckoffs.push({ id: `lc-g-${g.p.id.slice(6)}`, studentId: g.p.id, skillId: IDS.ivCath, byId: inst.id, at: dBefore(ri(rLab, 20, g.year === 2026 ? 300 : 90)) })
    for (let k = 0; k < 3; k++) {
      logEntries.push({ id: `log-g-${g.p.id.slice(6)}-p${k + 1}`, studentId: g.p.id, skillId: IDS.ivCath, batchId: `lb-g-${g.p.id.slice(6)}-${k + 1}`, setting: "lab", clinicalSetting: null, location: labLocationOf(inst), rating: PRACTICE_RATINGS[k === 0 ? 0 : 1], answers: null, note: "", at: dBefore(ri(rLab, 21, g.year === 2026 ? 320 : 100)), requestId: null })
    }
  }

  const rRem = stream("remediation")
  const remediations: Remediation[] = hero.remediations.map((x) => structuredClone(x))
  const concerns: ConcernFlag[] = hero.concerns.map((x) => ({ ...x }))
  const failed = notMetEvals.filter((e) => e.outcome === "not-met" && !gById.get(e.studentId)!.hero)
  const statuses: Array<Remediation["status"]> = ["open", "in-progress", "in-progress", "open", "closed", "open", "in-progress", "closed", "open"]
  for (let i = 0; i < 9; i++) {
    const e = failed[(i * 17 + 5) % failed.length]
    const age = Math.round((todayMs - Date.parse(e.date)) / 86_400_000)
    const st = statuses[i]
    remediations.push({
      id: `rem-g-${i + 1}`,
      studentId: e.studentId,
      skillId: e.skillId,
      status: st,
      evaluationId: e.id,
      openedAt: dBefore(Math.max(1, age - 1)),
      openedById: e.evaluatorId,
      steps: REMEDIATION_STEPS[i % REMEDIATION_STEPS.length].map((label, k) => ({ label, done: k === 0 ? st !== "open" : st === "closed" })),
      ...(st === "closed" ? { closed: { at: dBefore(Math.max(0, age - 10)), byId: reviewers[0], completed: true, note: REMEDIATION_CLOSED_NOTES[i % REMEDIATION_CLOSED_NOTES.length] } } : {}),
    })
  }
  for (let i = 0; i < 6; i++) {
    const e = failed[(i * 23 + 11) % failed.length]
    concerns.push({ id: `cn-g-${i + 1}`, evaluationId: e.id, studentId: e.studentId, raisedById: e.evaluatorId, visibleTo: "faculty-only", note: CONCERN_NOTES[i % CONCERN_NOTES.length], at: dBefore(ri(rRem, 1, 30)) })
  }

  const audit: AuditEntry[] = hero.audit.map((x) => ({ ...x }))
  const rAu = stream("audit")
  const actions: Array<[string, () => string]> = [
    ["Mapped skills", () => pick(rAu, courses.filter((c) => c.id !== hero.course.id)).code],
    ["Adopted evaluator", () => people.find((p) => p.id === unverifiedIds[ri(rAu, 0, 13)])?.name ?? "An evaluator"],
    ["Copied starter library", () => "HGTC ADN clinical skills"],
    ["Configured skill", () => pick(rAu, genSkills.filter((k) => k.configured)).name],
  ]
  for (let i = 0; i < 40; i++) {
    const [action, target] = actions[i % actions.length]
    audit.push({ id: `au-g-${String(i + 1).padStart(2, "0")}`, at: dBefore(ri(rAu, 3, 120)), actorId: i % 3 === 0 ? IDS.reviewer : IDS.ross, action, target: target() })
  }

  // ---------------------------------------------------------------------------------------------------------------------
  // Director story (dataset spec section 12; moved here from the director screen model so every screen sees it).
  // 1. One graduating student who is one skill short had the waiting request on that skill answered Unmet: nothing is open,
  //    the gap remains ("3 of the 4 one short already have a waiting request", dataset-spec story 2).
  // 2. Two complete graduating records with nothing open were verified (version 1) on STORY.verifiedAt.
  // 3. The busiest required-to-graduate rule changed on STORY.ruleChangedAt, after those verifications, so both read
  //    "Changed since verified" (strategy/03 H11).

  const allSubs = () => [...hero.submissions, ...subs]
  const OPEN_STATUS: Array<Submission["status"]> = ["on-device", "with-evaluator", "awaiting-review", "stalled", "returned"]
  const openOf = (id: string) => allSubs().filter((x) => x.studentId === id && OPEN_STATUS.includes(x.status))
  // Story students are chosen by id, never by name, so swapping the name pools cannot change who the story is about.
  const byName = (a: G, b: G) => a.p.id.localeCompare(b.p.id)
  for (const g of g26.filter((x) => x.kind === "one-short").sort(byName)) {
    const open = openOf(g.p.id)
    if (open.length !== 1 || open[0].skillIds.length !== 1 || open[0].skillIds[0] !== PBMED) continue
    const sub = open[0]
    evals.push({
      id: `ev-g-answer-${sub.id}`,
      studentId: g.p.id,
      skillId: PBMED,
      evaluatorId: sub.assignedToId,
      setting: "clinical",
      date: STORY.answeredAt,
      status: "counted",
      outcome: "not-met",
      currentVersion: 1,
      versions: [{ version: 1, outcome: "not-met", at: STORY.answeredAt, by: sub.assignedToId, reason: null }],
      submissionId: sub.id,
      ...(sub.siteId ? { siteId: sub.siteId } : {}),
    })
    const i = subs.findIndex((x) => x.id === sub.id)
    if (i >= 0) subs[i] = { ...sub, status: "done", completedById: sub.assignedToId, completedAt: STORY.answeredAt }
    break
  }
  const requiredToComplete = skills.filter((k) => k.configured && k.published && k.hgtc?.required)
  const verifications: NonNullable<V2State["verifications"]> = [...(hero.verifications ?? [])]
  for (const g of g26.filter((x) => x.kind === "complete" && openOf(x.p.id).length === 0).sort(byName).slice(0, 2)) {
    const counted = [...hero.evaluations, ...evals].filter((e) => e.studentId === g.p.id && e.status === "counted")
    verifications.push({
      id: `vf-g-${verifications.length + 1}`,
      studentId: g.p.id,
      version: 1,
      byId: IDS.director,
      at: STORY.verifiedAt,
      note: "",
      evidence: counted.map((e) => ({ evaluationId: e.id, skillId: e.skillId, version: e.currentVersion })),
      skills: requiredToComplete.map((k) => ({ skillId: k.id, achieved: true })),
    })
  }
  const evidenceCount = new Map<string, number>()
  for (const e of [...hero.evaluations, ...evals]) evidenceCount.set(e.skillId, (evidenceCount.get(e.skillId) ?? 0) + 1)
  const busiest = [...requiredToComplete].sort((a, b) => (evidenceCount.get(b.id) ?? 0) - (evidenceCount.get(a.id) ?? 0) || a.name.localeCompare(b.name))[0]
  const ruleChanges: NonNullable<V2State["ruleChanges"]> = busiest ? [{ skillId: busiest.id, at: STORY.ruleChangedAt, byId: IDS.ross, version: 2 }] : []

  // Export fields (REQ RP-10: the row-per-evaluation export carries self-evaluations and review notes). A separate stream, so
  // no earlier draw moves. Generated evidence only: the hand-written layer stays as written.
  const rSelf = stream("self-evaluations")
  const skillOf = new Map(skills.map((k) => [k.id, k]))
  const unverifiedSet = new Set(unverifiedIds)
  for (let i = 0; i < evals.length; i++) {
    const e = evals[i]
    if (e.setting !== "clinical") continue
    let next = e
    if (rSelf() < SELF_SHARE) {
      const c = skillOf.get(e.skillId)?.config
      const agree = rSelf() < SELF_AGREE
      const levels = c?.levels ?? []
      const rating = e.levelIndex !== undefined && levels.length ? levels[Math.max(0, Math.min(levels.length - 1, e.levelIndex + (agree ? 0 : -1)))] : c?.outcomeLabels?.length ? c.outcomeLabels[(e.outcome === "met") === agree ? 0 : 1] : null
      next = { ...next, self: { rating, note: pick(rSelf, SELF_NOTES) } }
    }
    // Counted evidence a reviewer approved (rules that hold evidence for approval), with the reviewer's note. Never on evidence
    // from an unadopted evaluator name: that stays held until the name is adopted.
    if (e.status === "counted" && !e.review && !unverifiedSet.has(e.evaluatorId) && rSelf() < APPROVED_SHARE) {
      next = { ...next, review: { decision: "approved", byId: IDS.reviewer, at: e.date, note: pick(rSelf, APPROVAL_NOTES) } }
    }
    if (next !== e) evals[i] = next
  }

  // Evaluator comments on about 30 percent of generated evaluations that have none (positional, no draw), so the record and
  // the export read like real sign-offs.
  let fb = 0
  for (let i = 0; i < evals.length; i++) {
    const e = evals[i]
    if (e.versions[0].detail || i % FEEDBACK_EVERY >= FEEDBACK_SHARE) continue
    evals[i] = { ...e, versions: [{ ...e.versions[0], detail: { feedback: feedbackText(fb++, e.outcome) } }, ...e.versions.slice(1)] }
  }

  // Two deactivated skills (SL-11, decision D-X14), so the inactive state is in the data every screen reads: the last two
  // published starter-list skills of the section with the most published skills (the rule the library screen used as a demo).
  const sectionOfSkill = (k: Skill) => (k.hgtc ? hgtcOf.get(k.id)?.section : undefined) ?? k.category
  const bySection = new Map<string, Skill[]>()
  for (const k of skills.filter((x) => x.published && x.hgtc)) bySection.set(sectionOfSkill(k), [...(bySection.get(sectionOfSkill(k)) ?? []), k])
  const inactiveIds = new Set(([...bySection.values()].sort((a, b) => b.length - a.length)[0] ?? []).slice(-2).map((k) => k.id))
  const skillsOut = skills.map((k) => (inactiveIds.has(k.id) ? { ...k, active: false } : k))

  // ---------------------------------------------------------------------------------------------------------------------
  // Compose

  // Position-based post-passes (no PRNG draw, so nothing above shifts): three per-course levels, and the enrollment fields.
  const mappings = splitNonMandatory([...hero.mappings, ...buildMappings(courses, hero.course.id)])
  const program = {
    ...hero.program,
    cohorts: ["BSN 2026", "BSN 2027", "ABSN 2027", "BSN 2028"],
    // Every site the program places at (or runs a lab in) is a location evidence can name (RP-08), after the hand-written ones.
    locations: (() => {
      const out = [...(hero.program.locations ?? [])]
      const have = new Set(out.map((l) => l.name))
      for (const x of sites) {
        if (!x.hasPreceptors || have.has(x.location)) continue
        have.add(x.location)
        out.push(x.clinicalSetting ? { name: x.location, setting: "clinical" as const, clinicalSetting: x.clinicalSetting } : { name: x.location, setting: "lab" as const })
      }
      return out
    })(),
    groups: { ...(hero.program.groups ?? {}), "BSN 2026": ["Group A", "Group B", "Group C"], "BSN 2028": ["Group A", "Group B", "Group C"] },
  }
  // A counted evaluation on a skill that asks for approval was approved (SC-15, AR-01): it carries the approval, with no note.
  // Evidence from an evaluator name not adopted yet is left alone, because approvals.heldState holds it for the reviewer.
  const approvalSet = new Set(skillsOut.filter((k) => k.config?.approvalRequired).map((k) => k.id))
  const unadopted = new Set(people.filter((p) => p.verified === false).map((p) => p.id))
  // The hand-written layer already carries its approvals (seed.ts buildEvaluations), so it stays a byte-stable prefix.
  const evaluationsOut = [...hero.evaluations, ...evals.map((e) =>
    e.status === "counted" && !e.review && approvalSet.has(e.skillId) && !unadopted.has(e.evaluatorId) ? { ...e, review: { decision: "approved" as const, byId: IDS.reviewer, at: e.date, note: "" } } : e,
  )]
  return {
    ...hero,
    program,
    people: withEnrollment(people),
    skills: skillsOut,
    mappings,
    evaluations: evaluationsOut,
    submissions: [...hero.submissions, ...subs],
    placements,
    logEntries: [...hero.logEntries, ...logEntries],
    labCheckoffs,
    concerns,
    remediations,
    audit,
    cohorts: COHORTS.map((c) => ({ ...c })),
    tracks: TRACKS.map((t) => ({ ...t })),
    terms: TERMS.map((t) => ({ ...t })),
    courses,
    offerings,
    sites,
    verifications,
    ruleChanges,
  }
}
