"use client"

/**
 * State for one import, shared by variants A (four steps), B (file beside the list) and C (paste or drop several). Local only:
 * the lab never writes the v2 store.
 *
 * The file goes to the program's default list unless the admin changes it (skill-setup-journey 02, J1): nothing blocks the drop.
 * Demo states in the URL: ?state=empty | reading | failed | review | clear | large | done (the lab bar's Scenario menu sets them).
 * ?source=paste reads sessionStorage "lab:import:paste" ({ text, category }) written by add a skill, paste several.
 * The window event "lab:reset" (lab bar, Reset edits) clears the import.
 */
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import {
  DEFAULT_LIST,
  NEW_LIBRARY,
  PASTE_KEY,
  SAMPLE_FILE_NAME,
  TARGET_LABEL,
  applySuggestions,
  buildReview,
  buildSampleText,
  clearDecisions,
  decisionKey,
  fixGroups,
  importTargets,
  leaveOut,
  linesLeft,
  parsePastePayload,
  pasteToText,
  planImport,
  resolve,
  summarize,
  type Decisions,
  type ExceptionKind,
  type Fix,
  type LibrarySkill,
  type SampleScale,
} from "@/lib/lab/import"

export type Phase = "empty" | "reading" | "failed" | "review" | "done"
export type DemoState = "empty" | "reading" | "failed" | "review" | "clear" | "large" | "done"

const DEMO_STATES: DemoState[] = ["empty", "reading", "failed", "review", "clear", "large", "done"]
const READ_MS = 1400

const stem = (name: string) => name.replace(/\.[a-z0-9]+$/i, "").replace(/[_-]+/g, " ").trim()
const today = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })

export function useImportSession() {
  const params = useSearchParams()
  const raw = params?.get("state") ?? ""
  const demo = (DEMO_STATES as string[]).includes(raw) ? (raw as DemoState) : null
  const fromPaste = params?.get("source") === "paste"
  const state = useV2State()
  const hydrated = useV2Hydrated()

  const [phase, setPhase] = React.useState<Phase>("empty")
  const [scale, setScale] = React.useState<SampleScale>("standard")
  const [fileName, setFileName] = React.useState<string | null>(null)
  const [fileNames, setFileNames] = React.useState<string[]>([])
  /** Pasted or custom text; null means the sample file for `scale`. */
  const [sourceText, setSourceText] = React.useState<string | null>(null)
  const [target, setTarget] = React.useState<string>(DEFAULT_LIST)
  const [newLibraryName, setNewLibraryName] = React.useState("")
  const [batchName, setBatchName] = React.useState("")
  const [decisions, setDecisions] = React.useState<Decisions>({})
  const [names, setNames] = React.useState<Record<string, string>>({})
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const targets = React.useMemo(() => importTargets(state.skills), [state.skills])
  const library: LibrarySkill[] = React.useMemo(
    () => (target && target !== NEW_LIBRARY ? state.skills.filter((k) => k.specialty === target).map((k) => ({ id: k.id, name: k.name, configured: k.configured })) : []),
    [state.skills, target],
  )
  const isNewList = target === NEW_LIBRARY
  const targetLabel = isNewList ? newLibraryName.trim() || "a new list" : TARGET_LABEL[target] ?? ""

  const text = React.useMemo(() => (phase === "review" || phase === "done" ? sourceText ?? buildSampleText(scale) : ""), [phase, scale, sourceText])
  const review = React.useMemo(() => (text ? buildReview(text, library) : null), [text, library])
  const resolved = React.useMemo(() => (review ? resolve(review, decisions, names) : []), [review, decisions, names])
  const summary = React.useMemo(() => (review ? summarize(review, resolved) : null), [review, resolved])
  const plan = React.useMemo(() => planImport(resolved), [resolved])
  const groups = React.useMemo(() => (review ? fixGroups(review, decisions) : []), [review, decisions])
  const left = React.useMemo(() => linesLeft(resolved), [resolved])

  const clearAll = React.useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setPhase("empty")
    setFileName(null)
    setFileNames([])
    setSourceText(null)
    setDecisions({})
    setNames({})
  }, [])

  // Apply a demo state once, after the store has hydrated.
  const appliedDemo = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!hydrated || !demo || appliedDemo.current === demo) return
    appliedDemo.current = demo
    if (timer.current) clearTimeout(timer.current)
    const big = demo === "large"
    setScale(big ? "large" : "standard")
    setSourceText(null)
    setDecisions({})
    setNames({})
    setTarget(DEFAULT_LIST)
    const name = demo === "empty" ? null : SAMPLE_FILE_NAME[big ? "large" : "standard"]
    setFileName(name)
    setFileNames(name ? [name] : [])
    setBatchName(name ? `${stem(name)}, ${today()}` : "")
    setPhase(demo === "clear" || demo === "large" ? "review" : demo === "done" ? "done" : (demo as Phase))
  }, [demo, hydrated])

  // Hand-off from add a skill, paste several: read the pasted text straight away (instant parse, no file).
  const appliedPaste = React.useRef(false)
  React.useEffect(() => {
    if (!hydrated || !fromPaste || appliedPaste.current) return
    appliedPaste.current = true
    let payload = null
    try {
      payload = parsePastePayload(window.sessionStorage.getItem(PASTE_KEY))
    } catch {
      payload = null
    }
    if (!payload) return
    setSourceText(pasteToText(payload.text, payload.category))
    setFileName(null)
    setFileNames([])
    setBatchName(`Pasted list, ${today()}`)
    setPhase("review")
  }, [hydrated, fromPaste])

  // "clear" and "done" need the review built before suggestions can be applied.
  React.useEffect(() => {
    if (!review || !demo) return
    if ((demo === "clear" || demo === "done") && Object.keys(decisions).length === 0) setDecisions(applySuggestions(review, {}, library))
  }, [review, demo, library, decisions])

  // Lab bar "Reset edits".
  React.useEffect(() => {
    const onReset = () => clearAll()
    window.addEventListener("lab:reset", onReset)
    return () => window.removeEventListener("lab:reset", onReset)
  }, [clearAll])

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  /** Read one or several dropped files. The lab reads the sample whatever is chosen; several files read the larger sample. */
  const readFiles = React.useCallback((files: Array<{ name: string; size: number }>) => {
    if (files.length === 0) return
    if (timer.current) clearTimeout(timer.current)
    const several = files.length > 1
    const fail = files.length === 1 && files[0].size === 0
    setFileName(several ? `${files.length} files` : files[0].name)
    setFileNames(files.map((f) => f.name))
    setScale(several ? "large" : "standard")
    setSourceText(null)
    setDecisions({})
    setNames({})
    setBatchName((b) => b || `${several ? "Several files" : stem(files[0].name)}, ${today()}`)
    setPhase("reading")
    timer.current = setTimeout(() => setPhase(fail ? "failed" : "review"), READ_MS)
  }, [])

  /** Read text as it is typed or pasted (variant C): no reading delay, decisions on lines that still exist are kept. */
  const readText = React.useCallback((value: string) => {
    if (timer.current) clearTimeout(timer.current)
    if (!value.trim()) {
      setSourceText(null)
      setPhase("empty")
      return
    }
    setSourceText(pasteToText(value))
    setFileName(null)
    setBatchName((b) => b || `Pasted list, ${today()}`)
    setPhase("review")
  }, [])

  const decide = React.useCallback((rowId: string, kind: ExceptionKind, fix: Fix | null) => {
    setDecisions((d) => {
      const next = { ...d }
      if (fix) next[decisionKey(rowId, kind)] = fix
      else delete next[decisionKey(rowId, kind)]
      return next
    })
  }, [])

  const rename = React.useCallback((rowId: string, name: string) => setNames((m) => ({ ...m, [rowId]: name })), [])

  const bulkSuggest = React.useCallback(
    (opts: { kind?: ExceptionKind; rowIds?: ReadonlySet<string> } = {}) => { if (review) setDecisions((d) => applySuggestions(review, d, library, opts)) },
    [review, library],
  )
  const bulkLeaveOut = React.useCallback((ids: Iterable<string>) => { if (review) setDecisions((d) => leaveOut(review, d, ids)) }, [review])
  const putBack = React.useCallback((id: string) => setDecisions((d) => clearDecisions(d, id)), [])
  const confirm = React.useCallback(() => setPhase("done"), [])

  return {
    demo, fromPaste, hydrated, phase, setPhase, scale, fileName, fileNames, sourceText, target, setTarget, isNewList, newLibraryName, setNewLibraryName,
    batchName, setBatchName, targets, library, targetLabel, review, resolved, summary, plan, groups, left, decisions, names,
    readFiles, readText, reset: clearAll, decide, rename, bulkSuggest, bulkLeaveOut, putBack, confirm,
  }
}

export type ImportSession = ReturnType<typeof useImportSession>
