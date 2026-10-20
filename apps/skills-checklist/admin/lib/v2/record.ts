import type { Block, SignedContent } from "./pdf"
import type { Evaluation, Person, Skill, V2State, Verification } from "./types"
import { verificationStatus, type VerifyStatus } from "./verification"

/**
 * Stage 5: the student's shareable verified record. It can only say what the program director verified (RP-07, SH-07). Pure.
 * Included: Met evaluations the latest verification rests on, still counted at the version verified, for skills that were achieved
 * when it was verified. Everything else is left out and the reason is stated. A confidential concern is never read.
 */

export interface RecordSkill {
  skill: Skill
  evaluations: Evaluation[]
}

export interface Exclusion {
  key: string
  label: string
  count: number
  reason: string
}

export interface VerifiedRecord {
  student: Person | null
  status: VerifyStatus
  verification: Verification | null
  verifiedBy: string | null
  canShare: boolean
  /** Why sharing is off, in plain words. Null when it is on. */
  blocked: string | null
  included: RecordSkill[]
  excluded: Exclusion[]
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
const nameOf = (s: V2State, id: string) => s.people.find((p) => p.id === id)?.name ?? "Unknown person"

export function verifiedRecord(s: V2State, studentId: string): VerifiedRecord {
  const student = s.people.find((p) => p.id === studentId && p.kind === "student") ?? null
  const st = verificationStatus(s, studentId)
  const v = st.latest
  const base: VerifiedRecord = { student, status: st.status, verification: v, verifiedBy: v ? nameOf(s, v.byId) : null, canShare: false, blocked: null, included: [], excluded: [] }
  if (!student) return { ...base, blocked: "That student is not in this course." }
  if (!v) return { ...base, blocked: "Your program director has not verified your record yet. Nothing can be shared until they do." }
  if (st.status === "changed") {
    return { ...base, blocked: `Your record changed after it was verified, so it cannot be shared until the program director verifies it again. ${st.changes[0] ?? ""}`.trim() }
  }

  const achieved = new Set(v.skills.filter((k) => k.achieved).map((k) => k.skillId))
  const bySkill = new Map<string, Evaluation[]>()
  let notMet = 0
  let skillNotAchieved = 0
  for (const ev of v.evidence) {
    const e = s.evaluations.find((x) => x.id === ev.evaluationId)
    if (!e || e.status !== "counted" || e.currentVersion !== ev.version) continue
    if (e.outcome !== "met") {
      notMet++
      continue
    }
    if (!achieved.has(e.skillId)) {
      skillNotAchieved++
      continue
    }
    bySkill.set(e.skillId, [...(bySkill.get(e.skillId) ?? []), e])
  }
  const included: RecordSkill[] = []
  for (const [skillId, evaluations] of bySkill) {
    const skill = s.skills.find((k) => k.id === skillId)
    if (skill) included.push({ skill, evaluations: evaluations.sort((a, b) => (a.date < b.date ? -1 : 1)) })
  }
  included.sort((a, b) => a.skill.name.localeCompare(b.skill.name))

  const excluded: Exclusion[] = []
  const add = (key: string, label: string, count: number, reason: string) => {
    if (count > 0) excluded.push({ key, label, count, reason })
  }
  const notAchievedSkills = v.skills.filter((k) => !k.achieved).length
  add("skills-not-achieved", `${notAchievedSkills} ${plural(notAchievedSkills, "mandatory skill", "mandatory skills")} not achieved`, notAchievedSkills, `${plural(notAchievedSkills, "It was", "They were")} not achieved when the record was verified. Partial progress is not shared.`)
  add("not-met", `${notMet} ${plural(notMet, "attempt", "attempts")} that did not meet the criteria or were marked not yet`, notMet, "These stay in your private history. A shared record lists what you achieved.")
  add("below-skill", `${skillNotAchieved} met ${plural(skillNotAchieved, "evaluation", "evaluations")} on skills not yet achieved`, skillNotAchieved, "The skill was not achieved when verified, so its evaluations are not shared on their own.")
  add("after", `${st.newer} ${plural(st.newer, "evaluation", "evaluations")} counted after the verification`, st.newer, `They are not part of version ${v.version}. A new verification would include them.`)
  const waiting = s.evaluations.filter((e) => e.studentId === studentId && e.status === "awaiting-approval").length
  add("waiting", `${waiting} ${plural(waiting, "evaluation", "evaluations")} waiting for approval`, waiting, "Only approved evidence counts, and only verified evidence is shared.")
  const notes = s.logEntries.filter((e) => e.studentId === studentId && (e.note.trim() || e.rating)).length
  add("self", `${notes} of your own ${plural(notes, "rating or note", "ratings and notes")}`, notes, "Your self-ratings and notes are yours. They are not part of what the program verified.")
  const feedback = included.flatMap((k) => k.evaluations).filter((e) => e.versions[e.versions.length - 1]?.detail?.feedback?.trim()).length
  add("feedback", `${feedback} ${plural(feedback, "evaluator comment", "evaluator comments")}`, feedback, "Written feedback stays inside the program. You can read it on your record.")
  return { ...base, canShare: true, included, excluded }
}

// ---------------------------------------------------------------------------------------------------------------------
// PDF content

const day = (iso: string) => iso.slice(0, 10)
const settingWord = (e: Evaluation) => (e.setting === "clinical" ? `Clinical${e.clinicalSetting ? `, ${e.clinicalSetting}` : ""}` : e.setting === "lab" ? "Lab" : "Simulation")

export function recordContent(s: V2State, studentId: string, at: string): SignedContent | null {
  const r = verifiedRecord(s, studentId)
  if (!r.canShare || !r.student || !r.verification) return null
  const v = r.verification
  const blocks: Block[] = [
    { t: "h2", s: "Verification" },
    { t: "p", s: `Verified by ${r.verifiedBy} on ${day(v.at)}, version ${v.version}. ${s.program.school}, ${s.program.name} ${s.course.cohort}, ${s.course.code} ${s.course.name}, ${s.course.term}.` },
    ...(v.note ? ([{ t: "p", s: `Director's note: ${v.note}` }] as Block[]) : []),
    { t: "gap" },
    { t: "h2", s: r.included.length ? "Skills achieved" : "No skill is achieved yet" },
  ]
  for (const k of r.included) {
    blocks.push({ t: "mono", s: k.skill.name })
    for (const e of k.evaluations) blocks.push({ t: "mono", s: `  ${day(e.date)}  Met  ${settingWord(e).padEnd(22)} ${s.people.find((p) => p.id === e.evaluatorId)?.name ?? "Unknown person"}` })
  }
  blocks.push({ t: "gap" }, { t: "h2", s: "Not included" })
  if (r.excluded.length === 0) blocks.push({ t: "p", s: "Nothing was left out." })
  for (const x of r.excluded) blocks.push({ t: "p", s: `${x.label}. ${x.reason}` })
  return { v: 1, kind: "verified-record", generatedAt: at, title: "Verified skills record", subject: `${r.student.name}. ${s.program.school}.`, filters: [], blocks }
}

// ---------------------------------------------------------------------------------------------------------------------
// CLR 2.0 (1EdTech Comprehensive Learner Record). Unsigned: it carries no proof, so a receiver cannot treat it as a verifiable credential.

/** A stable id shaped like a UUID, from text. Not random and not secret. */
export function pseudoUuid(seed: string): string {
  let h1 = 0x811c9dc5
  let h2 = 0x1b873593
  const hex: string[] = []
  for (let r = 0; r < 4; r++) {
    for (let i = 0; i < seed.length; i++) {
      h1 = Math.imul(h1 ^ seed.charCodeAt(i), 16777619) >>> 0
      h2 = Math.imul(h2 ^ (seed.charCodeAt(i) + r), 2246822519) >>> 0
    }
    hex.push(h1.toString(16).padStart(8, "0"), h2.toString(16).padStart(8, "0"))
  }
  const h = hex.join("").slice(0, 32)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`
}

const VC_CONTEXT = "https://www.w3.org/ns/credentials/v2"
const CLR_CONTEXT = "https://purl.imsglobal.org/spec/clr/v2p0/context-2.0.1.json"
const OB_CONTEXT = "https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json"

export function clrOf(s: V2State, studentId: string, at: string): Record<string, unknown> | null {
  const r = verifiedRecord(s, studentId)
  if (!r.canShare || !r.student || !r.verification) return null
  const v = r.verification
  const issuer = { id: `urn:uuid:${pseudoUuid(`issuer:${s.program.id}`)}`, type: ["Profile"], name: `${s.program.school}, ${s.program.name}` }
  const subjectId = { type: "IdentityObject", identityType: "emailAddress", hashed: false, identityHash: r.student.email }
  const creds = r.included.map((k) => {
    const achievement = {
      id: `urn:uuid:${pseudoUuid(`achievement:${k.skill.id}`)}`,
      type: ["Achievement"],
      achievementType: "Competency",
      name: k.skill.name,
      description: k.skill.description ?? `${k.skill.category}. Evaluated by the program against its own achievement rule.`,
      criteria: { narrative: `The program's achievement rule for ${k.skill.name} was met and verified by the program director.` },
    }
    return {
      "@context": [VC_CONTEXT, OB_CONTEXT],
      id: `urn:uuid:${pseudoUuid(`cred:${studentId}:${k.skill.id}:${v.version}`)}`,
      type: ["VerifiableCredential", "AchievementCredential"],
      issuer,
      validFrom: v.at,
      name: k.skill.name,
      credentialSubject: { type: ["AchievementSubject"], identifier: [subjectId], achievement },
      evidence: k.evaluations.map((e) => ({
        id: `urn:uuid:${pseudoUuid(`evidence:${e.id}:${e.currentVersion}`)}`,
        type: ["Evidence"],
        name: `Evaluation on ${day(e.date)}`,
        description: `${settingWord(e)}. Evaluated by ${s.people.find((p) => p.id === e.evaluatorId)?.name ?? "an evaluator"}. Outcome: Met.`,
      })),
    }
  })
  return {
    "@context": [VC_CONTEXT, CLR_CONTEXT],
    id: `urn:uuid:${pseudoUuid(`clr:${studentId}:${v.version}`)}`,
    type: ["VerifiableCredential", "ClrCredential"],
    issuer,
    validFrom: at,
    name: `Verified skills record, ${s.course.code} ${s.course.name}, ${s.course.term}`,
    description: `Skills the program verified for ${r.student.name} (record version ${v.version}, verified ${day(v.at)} by ${r.verifiedBy}). Prototype file built from sample data. It is unsigned and carries no proof.`,
    partial: true,
    credentialSubject: {
      type: ["ClrSubject"],
      identifier: [subjectId],
      verifiableCredential: creds,
    },
  }
}

