"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { updateActiveV2Store, useV2Hydrated, useV2State } from "@/lib/v2/react"
import { submitEvaluation, type SkillResponse } from "@/lib/v2/preceptor"
import { labNow } from "@/lib/lab/logged"
import { ensureRequest, openRequestFor, type RequestLinkFields } from "@/lib/lab/story-request"
import type { V2State } from "@/lib/v2/types"
import { isLabelPreset } from "@/lib/lab/configure"
import { qualifyingOutcome } from "@/lib/v2/rules"
import { EVALUATOR_ID, answersDecide, outcomeFromAnswers, blankResponse, buildRequest, levelOnly, isEvState, receipt, sampleResponses, validate, doneCount, type EvOptions, type EvRequest, type EvResponse, type EvSample, type EvState, type EvIssue, type ReceiptLine } from "@/lib/lab/evaluator"

/** Lab URL params, so every state is a shareable link: ?state=&sample=&hint=1&fo=1&prefill=1&fb=1&hold=1 */
export function useLabParams() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const get = (k: string) => params?.get(k) ?? null
  const set = React.useCallback(
    (patch: Record<string, string | null>) => {
      const q = new URLSearchParams(params?.toString() ?? "")
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "" || v === "0") q.delete(k)
        else q.set(k, v)
      }
      router.replace(`${pathname}?${q.toString()}`, { scroll: false })
    },
    [params, pathname, router],
  )
  return { get, set }
}

/**
 * The request the link names. A walkthrough stop or a scanned code also names the student and skills (`student`, `skills`): with no
 * `request`, the student's newest open request for them. When this browser's store has no such request, the page reads it as a
 * preview over the store and WRITES NOTHING: visiting a stop never creates a request or an attempt. Only a real submit writes it,
 * once (`fields`, see EvaluatorModel.submit). The id is stable for the page, so the receipt follows the submit. Never the seeded
 * request of another student. (D-L67, D-L71)
 */
export function useLinkedRequest(): { id: string | null; pending: boolean; preview: boolean; state: V2State; fields: (RequestLinkFields & { to: string }) | null } {
  const { get } = useLabParams()
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const requestId = get("request")
  const student = get("student")
  const skillsParam = get("skills") ?? ""
  const to = get("to")
  const course = get("course")
  const [previewId] = React.useState(() => `req-lab-${Date.now().toString(36)}`)
  const fields = React.useMemo(() => (student && skillsParam ? { student, skills: skillsParam.split(",").filter(Boolean), to: to ?? EVALUATOR_ID, course } : null), [student, skillsParam, to, course])
  const open = !requestId && fields ? openRequestFor(s, fields.student, fields.skills) : null
  const id = requestId ?? open?.id ?? (fields ? previewId : null)
  const exists = !!id && s.submissions.some((x) => x.id === id)
  const preview = !!fields && !exists
  const state = React.useMemo(() => (preview && fields && id ? ensureRequest(s, id, fields) : s), [preview, fields, id, s])
  return { id, pending: !!fields && !hydrated, preview, state, fields }
}

/** The evaluator's answers as the store records them. */
const toPassResponse = (skillId: string, r: EvResponse): SkillResponse => ({
  skillId,
  outcome: r.outcome,
  answers: r.answers.map((a) => (a === "yes" || a === "no" ? a : null)),
  scores: r.answers.map((a) => (typeof a === "number" ? a : null)),
  levelIndex: r.level,
  feedback: r.feedback,
})

export interface EvaluatorModel {
  hydrated: boolean
  state: EvState
  sample: EvSample
  options: EvOptions
  req: EvRequest | null
  responses: Record<string, EvResponse>
  response: (skillId: string) => EvResponse
  setAnswer: (skillId: string, patch: Partial<EvResponse>) => void
  /** Marks every skill that takes an outcome with the label that qualifies on it [REQ SC-03]. */
  setAll: () => void
  issues: EvIssue[]
  issuesFor: (skillId: string) => EvIssue[]
  showErrors: boolean
  done: number
  phase: "form" | "submitted"
  submit: () => boolean
  receiptLines: ReceiptLine[]
  offline: boolean
  identity: "ask" | "me" | "other"
  setIdentity: (v: "ask" | "me" | "other") => void
  summaryRef: React.RefObject<HTMLDivElement | null>
}

/** `receiptStates`: lab states that open straight on the receipt with sample answers (the Submitted screen). */
export function useEvaluator(defaultState: EvState = "default", receiptStates: EvState[] = ["submitted"]): EvaluatorModel {
  const { get, set } = useLabParams()
  const hydrated = useV2Hydrated()
  const rawState = get("state")
  const state: EvState = isEvState(rawState) ? rawState : defaultState
  const sample: EvSample = get("sample") === "long" ? "long" : "request"
  const optKey = ["hint", "fo", "prefill", "fb", "hold"].map((k) => (get(k) === "1" ? "1" : "0")).join("")
  // ?labels=approval|independence previews the Configure presets on the form (the lab configure never writes the store).
  const rawLabels = get("labels")
  const labels = isLabelPreset(rawLabels) ? rawLabels : null
  const options: EvOptions = React.useMemo(() => ({ ruleHint: optKey[0] === "1", feedbackOnly: optKey[1] === "1", prefill: optKey[2] === "1", requireFeedback: optKey[3] === "1", holdForApproval: optKey[4] === "1", labels }), [optKey, labels])
  // The link opens the request it names (?request=), as the student sent it [REQ EV-01, EV-04].
  const linked = useLinkedRequest()
  const { id: requestId, pending } = linked
  const asked = requestId ? linked.state.submissions.find((x) => x.id === requestId) ?? null : null
  const req = React.useMemo(() => (pending ? null : buildRequest(linked.state, sample, state, options, requestId)), [linked.state, sample, state, options, requestId, pending])

  const initial = React.useCallback((): Record<string, EvResponse> => {
    if (!req) return {}
    if (receiptStates.includes(state)) return sampleResponses(req)
    if (state === "corrected" && options.prefill) return Object.fromEntries(req.skills.filter((k) => k.prior).map((k) => [k.id, { ...k.prior! }]))
    if (state === "errors" && req.skills[0]) return { [req.skills[0].id]: { ...blankResponse(req.skills[0]), outcome: "met" } }
    return {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [req, state, options.prefill])

  const resetKey = `${state}|${sample}|${optKey}|${labels ?? ""}|${req?.id ?? ""}|${req?.skills.length ?? 0}`
  const [responses, setResponses] = React.useState<Record<string, EvResponse>>({})
  const [showErrors, setShowErrors] = React.useState(false)
  const [phase, setPhase] = React.useState<"form" | "submitted">("form")
  const [identity, setIdentity] = React.useState<"ask" | "me" | "other">("ask")
  const summaryRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    setResponses(initial())
    setShowErrors(state === "errors")
    setPhase(receiptStates.includes(state) ? "submitted" : "form")
    setIdentity("ask")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  // Lab bar "Reset edits": clear the answers back to the state the URL asks for.
  React.useEffect(() => {
    const onReset = () => { setResponses(initial()); setShowErrors(state === "errors"); setPhase(receiptStates.includes(state) ? "submitted" : "form"); setIdentity("ask") }
    window.addEventListener("lab:reset", onReset)
    return () => window.removeEventListener("lab:reset", onReset)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey])

  const response = (skillId: string) => {
    const k = req?.skills.find((x) => x.id === skillId)
    return responses[skillId] ?? (k ? blankResponse(k) : { outcome: null, level: null, answers: [], feedback: "" })
  }
  const setAnswer = (skillId: string, patch: Partial<EvResponse>) => setResponses((prev) => {
    const k = req?.skills.find((x) => x.id === skillId)
    const cur = prev[skillId] ?? (k ? blankResponse(k) : { outcome: null, level: null, answers: [], feedback: "" })
    const next = { ...cur, ...patch }
    // The question model has no final result: the answers decide the outcome (D-L73).
    if (k && answersDecide(k)) next.outcome = outcomeFromAnswers(k, next.answers)
    return { ...prev, [skillId]: next }
  })
  const setAll = () => setResponses((prev) => {
    const next = { ...prev }
    // An independence-level skill has no outcome to mark: its level is its answer (levelOnly), so Mark all leaves it.
    // A questions skill has none either: its answers decide (D-L73).
    for (const k of req?.skills ?? []) if (!levelOnly(k) && !answersDecide(k)) next[k.id] = { ...(prev[k.id] ?? blankResponse(k)), outcome: qualifyingOutcome(k) }
    return next
  })
  const issues = req ? validate(req, responses) : []
  const submit = () => {
    if (issues.length) {
      setShowErrors(true)
      requestAnimationFrame(() => summaryRef.current?.focus())
      return false
    }
    // A link that names a real request records the evaluation in the shared store: one version per skill, immutable, and the engine
    // counts it on the student's record [REQ EV-07, RV-03, AE-01]. Lab states and the seeded sample stay previews.
    if (asked && state === "default" && sample === "request" && req) {
      const passResponses = req.skills.map((k) => toPassResponse(k.id, responses[k.id] ?? blankResponse(k)))
      const { fields } = linked
      updateActiveV2Store((st0) => {
        // A request read as a preview is written here, once, with its evaluation (ensureRequest leaves an existing id alone).
        const st = fields ? ensureRequest(st0, asked.id, fields) : st0
        const r = submitEvaluation(st, { requestId: asked.id, evaluatorId: asked.assignedToId, responses: passResponses, concern: { raised: false, note: "" }, attested: true }, labNow())
        return r.ok ? r.state : st0
      })
      // Coming back to this stop finds that request, closed.
      if (!get("request")) set({ request: asked.id })
    }
    setPhase("submitted")
    requestAnimationFrame(() => window.scrollTo({ top: 0 }))
    return true
  }
  // A completed evaluation stays closed: reopening its link says so, and offers no form [REQ RV-03, RV-05].
  const closed = state === "default" && phase === "form" && !!asked && (asked.status === "done" || asked.status === "awaiting-review")
  const offline = state === "offline"
  return {
    hydrated,
    state: closed ? "completed" : state,
    sample,
    options,
    req,
    responses,
    response,
    setAnswer,
    setAll,
    issues,
    issuesFor: (id) => (showErrors ? issues.filter((i) => i.skillId === id) : []),
    showErrors,
    done: req ? doneCount(req, responses) : 0,
    phase,
    submit,
    receiptLines: req ? receipt(req, responses, { offline }) : [],
    offline,
    identity,
    setIdentity,
    summaryRef,
  }
}

/** Moves focus to a field from an error link. A ToggleGroup carries the id on its first choice. */
export function focusField(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ block: "center", behavior: "smooth" })
  el.focus({ preventScroll: true })
}
