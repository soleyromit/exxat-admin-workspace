"use client"

/**
 * Group check-off session (PROTO prism-skills-prototype_10282026.html `GS`). One hook for both variants of the course offering
 * Skills screen, so the workflow is identical and only the layout differs. Pure rules live in lib/lab/course-checkoff.ts.
 * Recording writes real evaluations to the shared v2 store (source "checkoff"), so Approvals and the student's history see them.
 */
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useV2Hydrated, useV2State, useV2Store } from "@/lib/v2/react"
import { DEMO_TODAY } from "@/lib/v2/seed"
import { shortDate } from "@/lib/lab/evaluator"
import {
  cellFlags,
  cellKey,
  checkoffOfferings,
  isTickable,
  notAvailableReason,
  offeringRoster,
  offeringSkills,
  recordCheckoffs,
  recorders,
  tickRecords,
  type CellFlags,
  type CheckoffSetting,
  type MappedSkill,
  type RecorderRole,
} from "@/lib/lab/course-checkoff"

export interface SessionSkill extends MappedSkill {
  /** null when this recorder can check it off in this session. */
  reason: string | null
  /** "A tick marks the student as met" etc. */
  records: string
  approval: boolean
  selfEvaluation: boolean
}

export const PAGE_SIZE = 15
export const PAGE_STEP = 25

export function useCheckoff() {
  const s = useV2State()
  const store = useV2Store()
  const hydrated = useV2Hydrated()
  const params = useSearchParams()
  const offerings = React.useMemo(() => checkoffOfferings(s), [s])
  const [offeringId, setOfferingId] = React.useState<string>(() => params?.get("offering") ?? "")
  const offering = (s.offerings ?? []).find((o) => o.id === offeringId && offerings.some((x) => x.id === o.id)) ?? (s.offerings ?? []).find((o) => o.id === offerings[0]?.id) ?? null
  const offeringRow = offerings.find((o) => o.id === offering?.id) ?? null
  const [date, setDate] = React.useState(DEMO_TODAY)
  const [setting, setSetting] = React.useState<CheckoffSetting>("lab")
  const [role, setRoleState] = React.useState<RecorderRole>("faculty")
  const people = React.useMemo(() => recorders(s, role), [s, role])
  const [recorderId, setRecorderId] = React.useState<string>("")
  const recorder = people.find((p) => p.id === recorderId) ?? people[0]
  const setRole = (r: RecorderRole) => {
    setRoleState(r)
    setRecorderId("")
  }

  const skills: SessionSkill[] = React.useMemo(() => {
    if (!offering) return []
    return offeringSkills(s, offering).map((m) => ({
      ...m,
      reason: notAvailableReason(m.skill, recorder, setting),
      records: tickRecords(m.skill),
      approval: !!m.skill.config?.approvalRequired,
      selfEvaluation: !!m.skill.config?.selfEvaluation,
    }))
  }, [s, offering, recorder, setting])
  const eligible = skills.filter((k) => !k.reason)
  const unavailable = skills.filter((k) => k.reason)
  const roster = React.useMemo(() => (offering ? offeringRoster(s, offering) : []), [s, offering])

  const [query, setQuery] = React.useState("")
  const [shown, setShown] = React.useState(PAGE_SIZE)
  const rows = roster.filter((p) => !query.trim() || p.name.toLowerCase().includes(query.trim().toLowerCase()))

  const [ticked, setTicked] = React.useState<Record<string, true>>({})
  const [recorded, setRecorded] = React.useState<Record<string, "done" | "review">>({})
  const [saved, setSaved] = React.useState<{ count: number; review: number; who: string; date: string } | null>(null)

  const flagCache = React.useRef(new Map<string, CellFlags>())
  React.useEffect(() => {
    flagCache.current = new Map()
  }, [s])
  const flags = (studentId: string, skillId: string): CellFlags => {
    const key = cellKey(studentId, skillId)
    let f = flagCache.current.get(key)
    if (!f) {
      f = cellFlags(s, studentId, skillId)
      flagCache.current.set(key, f)
    }
    return f
  }

  const reset = () => {
    setTicked({})
    setRecorded({})
    setSaved(null)
  }
  const chooseOffering = (id: string) => {
    setOfferingId(id)
    setShown(PAGE_SIZE)
    reset()
  }
  const toggle = (studentId: string, skillId: string) => {
    const key = cellKey(studentId, skillId)
    if (recorded[key] || !isTickable(flags(studentId, skillId))) return
    setSaved(null)
    setTicked((p) => {
      const n = { ...p }
      if (n[key]) delete n[key]
      else n[key] = true
      return n
    })
  }
  // Only ticks on skills this session can carry are recorded (a setting or recorder change can make a skill unavailable).
  // A student who already qualifies is never counted (D-L8d).
  const liveKeys = Object.keys(ticked).filter((k) => {
    const [studentId, skillId] = k.split("|")
    return eligible.some((x) => x.skill.id === skillId) && isTickable(flags(studentId, skillId))
  })
  const reviewSkills = eligible.filter((k) => k.approval && liveKeys.some((x) => x.endsWith(`|${k.skill.id}`)))

  const record = () => {
    if (!offering || !recorder || !liveKeys.length) return
    const sessionId = `cs${Date.now().toString(36)}`
    let result: ReturnType<typeof recordCheckoffs> | null = null
    store.update((st) => {
      result = recordCheckoffs(st, { offeringId: offering.id, date, setting, recorderId: recorder.id, sessionId }, liveKeys, new Date().toISOString())
      return result.state
    })
    const r = result as ReturnType<typeof recordCheckoffs> | null
    if (!r) return
    setRecorded((p) => ({ ...p, ...r.cells }))
    setTicked({})
    setSaved({ count: r.count, review: r.review, who: recorder.name.split(",")[0], date: shortDate(date) })
  }

  return {
    hydrated,
    offerings,
    offering,
    offeringRow,
    chooseOffering,
    date,
    setDate,
    setting,
    setSetting,
    role,
    setRole,
    people,
    recorder,
    setRecorderId,
    skills,
    eligible,
    unavailable,
    roster,
    rows,
    query,
    setQuery: (q: string) => {
      setQuery(q)
      setShown(PAGE_SIZE)
    },
    shown,
    showMore: () => setShown((n) => n + PAGE_STEP),
    ticked,
    recorded,
    flags,
    toggle,
    count: liveKeys.length,
    reviewSkills,
    clear: () => setTicked({}),
    record,
    saved,
    dismissSaved: () => setSaved(null),
  }
}

export type CheckoffModel = ReturnType<typeof useCheckoff>
