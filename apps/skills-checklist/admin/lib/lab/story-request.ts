/**
 * The request a walkthrough stop, or a scanned QR code, opens (D-L67, D-L71). The student's Send writes the request to the shared store
 * and puts its id on the URL. A stop opened without sending (the path bar's Next), or a code scanned on another device whose browser
 * has no copy of the request, reads it through the same `sendNew` as a preview, so the evaluator always opens the request the student
 * would have sent and never another student's. Only a real submit writes it. Pure and idempotent: returns a new state, or `s` itself
 * when the id exists.
 */
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import type { Submission, V2State } from "@/lib/v2/types"
import { sendNew } from "./logged"

const OPEN: Submission["status"][] = ["with-evaluator", "stalled"]

export interface RequestLinkFields {
  student: string
  skills: string[]
  to?: string | null
  course?: string | null
}

/** The newest open request from this student for exactly these skills. */
export function openRequestFor(s: V2State, studentId: string, skillIds: string[]): Submission | null {
  const want = [...skillIds].sort().join(",")
  return [...s.submissions].reverse().find((x) => x.studentId === studentId && OPEN.includes(x.status) && [...x.skillIds].sort().join(",") === want) ?? null
}

/** The query a request link carries, so the link alone can rebuild the request on a device that has not seen it. */
export function requestLinkQuery(id: string, f: RequestLinkFields): string {
  const q = new URLSearchParams({ request: id, student: f.student, skills: f.skills.join(",") })
  if (f.to) q.set("to", f.to)
  if (f.course) q.set("course", f.course)
  return q.toString()
}

/**
 * Writes the request as a clinical request at the student's placement for the course: the current one, else the latest, as Send
 * does [REQ ST-06]. Unchanged when `id` already exists.
 */
export function ensureRequest(s: V2State, id: string, f: RequestLinkFields & { to: string }): V2State {
  if (s.submissions.some((x) => x.id === id)) return s
  const own = s.placements.filter((p) => p.studentId === f.student)
  const forCourse = own.filter((p) => !f.course || p.courseId === f.course)
  const current = forCourse.find((p) => !!p.startDate && !!p.endDate && p.startDate <= DEMO_TODAY && DEMO_TODAY <= p.endDate)
  const place = current ?? forCourse.at(-1) ?? own.at(-1) ?? null
  const clinicalSetting = place?.setting ?? s.program.clinicalSettings[0] ?? null
  return sendNew(
    s,
    { skillIds: f.skills, where: place ? `placement:${place.id}` : `program:${clinicalSetting}`, setting: "clinical", clinicalSetting, location: place?.location ?? null, date: DEMO_TODAY, unit: "", case: "", note: "", ratings: {}, answers: {}, course: f.course ?? null, step: "send", who: f.to, method: "link", batchId: null },
    f.student,
    { id, studentId: f.student, skillIds: f.skills, method: "link", status: "with-evaluator", assignedToId: f.to, createdAt: new Date().toISOString(), daysWaiting: 0, candidateIds: [f.to] },
  )
}
