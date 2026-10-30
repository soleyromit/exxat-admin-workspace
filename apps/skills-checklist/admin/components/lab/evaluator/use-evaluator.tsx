"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import { isLabelPreset } from "@/lib/lab/configure"
import { blankResponse, buildRequest, isEvState, receipt, sampleResponses, validate, doneCount, type EvOptions, type EvRequest, type EvResponse, type EvSample, type EvState, type EvIssue, type ReceiptLine } from "@/lib/lab/evaluator"

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

export interface EvaluatorModel {
  hydrated: boolean
  state: EvState
  sample: EvSample
  options: EvOptions
  req: EvRequest | null
  responses: Record<string, EvResponse>
  response: (skillId: string) => EvResponse
  setAnswer: (skillId: string, patch: Partial<EvResponse>) => void
  setAll: (outcome: EvResponse["outcome"]) => void
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
  const { get } = useLabParams()
  const s = useV2State()
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
  const requestId = get("request")
  const req = React.useMemo(() => buildRequest(s, sample, state, options, requestId), [s, sample, state, options, requestId])

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
    return { ...prev, [skillId]: { ...cur, ...patch } }
  })
  const setAll = (outcome: EvResponse["outcome"]) => setResponses((prev) => {
    const next = { ...prev }
    for (const k of req?.skills ?? []) next[k.id] = { ...(prev[k.id] ?? blankResponse(k)), outcome }
    return next
  })
  const issues = req ? validate(req, responses) : []
  const submit = () => {
    if (issues.length) {
      setShowErrors(true)
      requestAnimationFrame(() => summaryRef.current?.focus())
      return false
    }
    setPhase("submitted")
    requestAnimationFrame(() => window.scrollTo({ top: 0 }))
    return true
  }
  const offline = state === "offline"
  return {
    hydrated,
    state,
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
