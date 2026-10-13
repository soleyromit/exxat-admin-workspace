import { act } from "@testing-library/react"
import { getRuntime } from "@/lib/store/react"
import { ok } from "@/lib/store"
import type { Db, EvaluatorLink, Id, Submission } from "@/lib/domain/types"
import type { Responses } from "@/lib/engine"

export const db = (): Db => getRuntime().getDb()

/** Fresh sample data for one test. The runtime is a singleton, so every test starts here. */
export function resetStore() {
  const rt = getRuntime()
  act(() => {
    rt.reset()
    rt.setPrefs({ currentStudentId: "stu-01", skillStatusDisplay: "four", evaluatorSeesProgress: true })
  })
}

export function replaceDb(mut: (d: Db) => Db) {
  const rt = getRuntime()
  act(() => {
    rt.run((d) => ok(mut(d), null) as never)
  })
}

let n = 0
export interface AddRequestOptions {
  token?: string
  skillIds: string[]
  studentId?: Id
  offeringId?: Id
  roleId?: string
  evaluatorName?: string
  evaluatorEmail?: string
  evaluatorSource?: "recorded" | "roster" | "studentNamed"
  performedIn?: "clinical" | "lab"
  settingId?: Id | null
  locationId?: Id | null
  values?: Record<Id, string | number>
  note?: string
  selfEvaluation?: Responses | null
  revision?: number
}

/** Adds one open request (an emailed link with the submissions behind it) to the sample data and returns the token. */
export function addRequest(o: AddRequestOptions): string {
  n += 1
  const token = o.token ?? `tok-test-${n}`
  const performedIn = o.performedIn ?? "clinical"
  replaceDb((d) => {
    const evaluator = {
      personId: `person-t${n}`,
      source: o.evaluatorSource ?? ("recorded" as const),
      name: o.evaluatorName ?? "A. Whitfield, RN",
      email: o.evaluatorEmail ?? "a.whitfield@example.org",
      roleId: o.roleId ?? "preceptor",
    }
    const subs: Submission[] = o.skillIds.map((skillId, i) => ({
      id: `sub-t${n}-${i}`,
      requestId: `req-t${n}`,
      studentId: o.studentId ?? "stu-01",
      skillId,
      offeringId: o.offeringId ?? "off-350-f26",
      attempt: 90 + i,
      revision: o.revision ?? 0,
      performedIn,
      clinicalSettingId: performedIn === "clinical" ? (o.settingId === undefined ? "set-outpatient" : o.settingId) : null,
      locationId: performedIn === "clinical" ? (o.locationId === undefined ? "loc-harbor" : o.locationId) : null,
      evaluator,
      values: o.values ?? {},
      studentNote: o.note ?? "",
      selfEvaluation: o.selfEvaluation ?? null,
      lifecycle: "awaitingEvaluator",
      sentAt: "2026-08-24T10:00:00.000Z",
    }))
    const link: EvaluatorLink = { token, submissionIds: subs.map((s) => s.id), evaluator, createdAt: "2026-08-24T10:00:00.000Z", supersededAt: null, submittedAt: null }
    return { ...d, submissions: [...d.submissions, ...subs], links: [...d.links, link] }
  })
  return token
}

/** Ids of the skills used in tests (sample data): one per model. */
export const SK = { iv: "sk-iv", foley: "sk-foley", h2t: "sk-h2t", dressing: "sk-dressing", vitals: "sk-vitals", med: "sk-med", trach: "sk-trach" } as const

export const noContrast = { rules: { "color-contrast": { enabled: false } } }
