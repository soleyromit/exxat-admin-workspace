// Pure form logic for S-16: draft answers, completeness, what is still needed, and draft persistence.
// No React, no I/O besides the injected storage. The evaluator never changes how a skill is evaluated (EV-03): a draft
// only holds ANSWERS keyed by the program's own question, level and label ids.
import type { ModelConfig, Responses } from "@/lib/engine"
import { responseErrors } from "@/lib/store"

export interface AnswerDraft {
  labelId?: "a" | "b"
  answers: Record<string, boolean>
  scores: Record<string, number>
  levelId?: string
  comment: string
}
export type Drafts = Record<string, AnswerDraft>

export const emptyDraft = (): AnswerDraft => ({ answers: {}, scores: {}, comment: "" })

/** Builds a Responses value of the model's kind from whatever has been answered so far. */
export function toResponses(model: ModelConfig, d: AnswerDraft): Responses {
  switch (model.kind) {
    case "binary":
      return { kind: "binary", labelId: d.labelId as "a" | "b" }
    case "question":
      return { kind: "question", answers: d.answers }
    case "scored":
      return { kind: "scored", scores: d.scores }
    case "demonstration":
      return { kind: "demonstration", levelId: d.levelId as string }
  }
}

/** Keys of the answers still missing, using the store's own completeness check (one rule for every respondent). */
export function missingKeys(model: ModelConfig, d: AnswerDraft): string[] {
  return Object.keys(responseErrors(model, toResponses(model, d)))
}

export interface ItemLike {
  submissionId: string
  skillName: string
  model: ModelConfig
  commentRule: "optional" | "mandatory"
}

export interface Issue {
  submissionId: string
  target: "answers" | "comment"
  /** First missing answer key, when target is "answers". */
  key?: string
}

export interface Summary {
  total: number
  answered: number
  issues: Issue[]
  remaining: Array<{ submissionId: string; kind: "answers" | "comment"; skillName: string }>
  complete: boolean
}

export function summarise(items: ItemLike[], drafts: Drafts): Summary {
  const issues: Issue[] = []
  const remaining: Summary["remaining"] = []
  let answered = 0
  for (const it of items) {
    const d = drafts[it.submissionId] ?? emptyDraft()
    const missing = missingKeys(it.model, d)
    if (missing.length === 0) answered += 1
    else {
      issues.push({ submissionId: it.submissionId, target: "answers", key: missing[0] })
      remaining.push({ submissionId: it.submissionId, kind: "answers", skillName: it.skillName })
    }
    if (it.commentRule === "mandatory" && !d.comment.trim()) {
      issues.push({ submissionId: it.submissionId, target: "comment" })
      remaining.push({ submissionId: it.submissionId, kind: "comment", skillName: it.skillName })
    }
  }
  return { total: items.length, answered, issues, remaining, complete: issues.length === 0 }
}

// ------------------------------------------------------------------ draft persistence [INFER]
// REQ is silent on autosave; the contract proposes it for the evaluator persona. With no account the only honest place
// is this device. The key holds the (sensitive) token, so it is removed on submit. cross-cutting L-7 stays an open question.

export const draftKey = (token: string) => `skills.evaluator.draft.${token}`

export interface DraftStorage {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
  removeItem(k: string): void
}

const isBool = (v: unknown): v is boolean => typeof v === "boolean"
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)

/** Reads a saved draft and keeps only entries that belong to this request and have the right shape. */
export function loadDrafts(storage: DraftStorage | null, token: string, submissionIds: string[]): Drafts {
  if (!storage) return {}
  try {
    const raw = storage.getItem(draftKey(token))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const out: Drafts = {}
    for (const id of submissionIds) {
      const p = parsed?.[id] as Partial<AnswerDraft> | undefined
      if (!p || typeof p !== "object") continue
      const d = emptyDraft()
      if (p.labelId === "a" || p.labelId === "b") d.labelId = p.labelId
      if (typeof p.levelId === "string") d.levelId = p.levelId
      if (typeof p.comment === "string") d.comment = p.comment
      for (const [k, v] of Object.entries(p.answers ?? {})) if (isBool(v)) d.answers[k] = v
      for (const [k, v] of Object.entries(p.scores ?? {})) if (isNum(v)) d.scores[k] = v
      out[id] = d
    }
    return out
  } catch {
    return {}
  }
}

/** True when saved, false when storage refused (the form shows a quiet "Not saved" with a retry). */
export function saveDrafts(storage: DraftStorage | null, token: string, drafts: Drafts): boolean {
  if (!storage) return false
  try {
    storage.setItem(draftKey(token), JSON.stringify(drafts))
    return true
  } catch {
    return false
  }
}

export function clearDrafts(storage: DraftStorage | null, token: string) {
  try {
    storage?.removeItem(draftKey(token))
  } catch {
    /* nothing to clear */
  }
}
