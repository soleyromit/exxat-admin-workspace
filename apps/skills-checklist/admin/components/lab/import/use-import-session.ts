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
import { skillNounPlural } from "@/lib/lab/terms"
import {
  DEFAULT_LIST,
  NEW_LIBRARY,
  PASTE_KEY,
  SAMPLE_FILE_NAME,
  TARGET_LABEL,
  applySuggestions,
  applyReviewEdits,
  NO_EDITS,
  type ReviewEdits,
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
  /** Category chosen for one line in review (REQ SL-03, SL-05; decision D-X28); absent = the file's heading. */
  const [rowCategories, setRowCategories] = React.useState<Record<string, string>>({})
  /** Tags set for one line in review (REQ SL-04); absent = the line's group heading proposed as a tag, if any. */
  const [rowTags, setRowTags] = React.useState<Record<string, string[]>>({})
  /** Optional description per skill read [REQ SL-02, IM-04]; empty until the program writes one. */
  const [rowDescriptions, setRowDescriptions] = React.useState<Record<string, string>>({})
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const targets = React.useMemo(() => importTargets(state.skills), [state.skills])
  const library: LibrarySkill[] = React.useMemo(
    () => (target && target !== NEW_LIBRARY ? state.skills.filter((k) => k.specialty === target).map((k) => ({ id: k.id, name: k.name, configured: k.configured })) : []),
    [state.skills, target],
  )
  const isNewList = target === NEW_LIBRARY
  const targetLabel = isNewList ? newLibraryName.trim() || `a new group of ${skillNounPlural()}` : TARGET_LABEL[target] ?? ""

  const text = React.useMemo(() => (phase === "review" || phase === "done" ? sourceText ?? buildSampleText(scale) : ""), [phase, scale, sourceText])
  /** Split, merge and added entries [REQ IM-05], applied over the reading so the file's own lines stay as read. */
  const [edits, setEdits] = React.useState<ReviewEdits>(NO_EDITS)
  const review = React.useMemo(() => (text ? applyReviewEdits(buildReview(text, library), edits, library) : null), [text, library, edits])
  const resolved = React.useMemo(
    () => (review ? resolve(review, decisions, names).map((r) => (rowCategories[r.row.id] !== undefined ? { ...r, section: rowCategories[r.row.id] || null } : r)) : []),
    [review, decisions, names, rowCategories],
  )
  const tagsOf = React.useCallback((row: { id: string; group: string | null }): string[] => rowTags[row.id] ?? (row.group ? [row.group] : []), [rowTags])
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
    setRowCategories({})
    setRowTags({})
    setRowDescriptions({})
    setEdits(NO_EDITS)
  }, [])

  const splitRow = React.useCallback((rowId: string, parts: string[]) => {
    if (parts.length < 2) return
    setEdits((e) => ({ ...e, splits: { ...e.splits, [rowId]: parts } }))
  }, [])
  const mergeRow = React.useCallback((rowId: string, intoId: string) => {
    if (rowId === intoId) return
    setEdits((e) => ({ ...e, merges: { ...e.merges, [rowId]: intoId } }))
  }, [])
  const unsplitRow = React.useCallback((rowId: string) => {
    setEdits((e) => {
      const splits = { ...e.splits }
      delete splits[rowId]
      return { ...e, splits }
    })
  }, [])
  const unmergeRow = React.useCallback((rowId: string) => {
    setEdits((e) => {
      const merges = { ...e.merges }
      delete merges[rowId]
      return { ...e, merges }
    })
  }, [])
  const addEntry = React.useCallback((name: string, section: string | null) => {
    const clean = name.trim()
    if (!clean) return
    setEdits((e) => ({ ...e, added: [...e.added, { id: `n${e.added.length + 1}`, name: clean, section }] }))
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
    setEdits(NO_EDITS)
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
    setEdits(NO_EDITS)
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
  const setRowCategory = React.useCallback((rowId: string, category: string) => setRowCategories((m) => ({ ...m, [rowId]: category })), [])
  const setTagsFor = React.useCallback((rowId: string, tags: string[]) => setRowTags((m) => ({ ...m, [rowId]: tags })), [])
  // The file's own description is the proposal (REQ IM-04); an edit here wins, and an emptied one stays empty.
  const fileDescriptions = React.useMemo(() => new Map((review?.rows ?? []).filter((r) => r.description).map((r) => [r.id, r.description!])), [review])
  const descriptionOf = React.useCallback((rowId: string): string => rowDescriptions[rowId] ?? fileDescriptions.get(rowId) ?? "", [rowDescriptions, fileDescriptions])
  const setDescriptionFor = React.useCallback((rowId: string, d: string) => setRowDescriptions((m) => ({ ...m, [rowId]: d })), [])

  const bulkSuggest = React.useCallback(
    (opts: { kind?: ExceptionKind; rowIds?: ReadonlySet<string> } = {}) => { if (review) setDecisions((d) => applySuggestions(review, d, library, opts)) },
    [review, library],
  )
  const bulkLeaveOut = React.useCallback((ids: Iterable<string>) => { if (review) setDecisions((d) => leaveOut(review, d, ids)) }, [review])
  const putBack = React.useCallback((id: string) => setDecisions((d) => clearDecisions(d, id)), [])
  /** Undo for "Accept all suggestions": put back the decisions as they were before. */
  const restoreDecisions = React.useCallback((d: Decisions) => setDecisions(d), [])
  const confirm = React.useCallback(() => setPhase("done"), [])

  return {
    demo, fromPaste, hydrated, phase, setPhase, scale, fileName, fileNames, sourceText, target, setTarget, isNewList, newLibraryName, setNewLibraryName,
    batchName, setBatchName, targets, library, targetLabel, review, resolved, summary, plan, groups, left, decisions, names,
    readFiles, readText, reset: clearAll, decide, rename, bulkSuggest, bulkLeaveOut, putBack, restoreDecisions, confirm,
    tagsOf, setRowCategory, setTagsFor, descriptionOf, setDescriptionFor,
    edits, splitRow, mergeRow, unmergeRow, unsplitRow, addEntry,
  }
}

export type ImportSession = ReturnType<typeof useImportSession>
