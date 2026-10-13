// Stage 3: ASSEMBLY. Code decides; the model's answers are inputs, never actions (docs/build/typesafe-import-design.md §2.5).
// Pure. Rules are final for the lines they settled; the model is consulted only for ambiguous lines. Nothing here creates
// anything: the result fills the same review-state proposal the standard reader fills (IM-05, IM-13).
import type { ImportCueReason, ImportInterpretationMeta } from "@/lib/domain/types"
import { BULLET, type RuleItem } from "./rules"
import { IMPORT_THRESHOLDS } from "./thresholds"
import type { CandidateAnswer, ImportRowProposal, InterpretationResult, UnreadLineProposal } from "./types"

const lineText = (raw: string) => raw.trim().replace(BULLET, "").trim()
const headingText = (raw: string) => lineText(raw).replace(/[:：]$/, "").trim()

type Thresholds = typeof IMPORT_THRESHOLDS

/** What to do with one ambiguous line, from the model's kind answer. */
export type KindVerdict = "skill" | "skill-cue" | "heading" | "unread-heading" | "unread-uncertain" | "unread-unrecognised"

export function kindVerdict(a: CandidateAnswer["kind"], T: Thresholds = IMPORT_THRESHOLDS): KindVerdict {
  const sure = a.confidence >= T.confidence
  if (a.skill >= T.skillReview && a.skill >= a.section_heading && a.skill >= a.other) {
    return a.skill >= T.skillAccept && sure ? "skill" : "skill-cue"
  }
  if (a.section_heading >= T.headingReview && a.section_heading >= a.other) {
    return a.section_heading >= T.headingAccept && sure ? "heading" : "unread-heading"
  }
  return sure ? "unread-unrecognised" : "unread-uncertain"
}

export function assembleInterpretation(
  items: RuleItem[],
  answers: Map<number, CandidateAnswer>,
  meta: ImportInterpretationMeta,
  T: Thresholds = IMPORT_THRESHOLDS,
): InterpretationResult {
  const rows: ImportRowProposal[] = []
  const unread: UnreadLineProposal[] = []
  let category: string | null = null
  let prev: ImportRowProposal | null = null
  let pendingDisagree = false

  const addCue = (row: ImportRowProposal, reason: ImportCueReason) => {
    const reasons = new Set(row.cue?.reasons ?? [])
    reasons.add(reason)
    row.cue = { reasons: [...reasons] }
  }
  const push = (row: ImportRowProposal) => {
    if (pendingDisagree) {
      addCue(row, "rulesAndModelDisagree")
      pendingDisagree = false
    }
    rows.push(row)
    prev = row
    return row
  }

  for (const it of items) {
    if (it.kind === "category") {
      category = it.categoryName
      prev = null
      pendingDisagree = false
      // A rule-made ALL-CAPS heading the model reads as a skill is flagged on its first row, never overridden (the rules win).
      const audit = it.by === "allcaps" ? answers.get(it.n) : undefined
      if (audit && audit.kind.skill >= T.skillAccept && audit.kind.confidence >= T.confidence) pendingDisagree = true
      continue
    }
    if (it.kind === "unread") {
      unread.push({ text: it.raw, reason: it.reason, location: it.location })
      prev = null
      continue
    }
    if (it.kind === "skill") {
      push({ name: it.name, description: it.description, categoryName: it.categoryName, sourceRef: it.raw, line: it.n, origin: "rules" })
      continue
    }

    // ---- ambiguous: the model's turn
    const ans = answers.get(it.n)
    if (!ans) {
      // No answer for a line we asked about: keep it as a skill and ask the admin to look (never silently drop).
      const row = push({ name: it.name, description: it.description, categoryName: category, sourceRef: it.raw, line: it.n, origin: "model" })
      addCue(row, "lowSkillConfidence")
      continue
    }
    const verdict = kindVerdict(ans.kind, T)

    // Detail: a line that only adds to the skill directly above joins that skill's description (a verbatim span).
    if (ans.detail !== undefined && prev && ans.detail >= T.detailMerge && !verdict.startsWith("heading") && verdict !== "heading") {
      const p: ImportRowProposal = prev
      p.description = [p.description, lineText(it.raw)].filter(Boolean).join(" ")
      p.sourceRef = `${p.sourceRef} + ${it.raw}`
      continue
    }

    if (verdict === "heading") {
      category = headingText(it.raw) || category
      prev = null
      continue
    }
    if (verdict === "unread-heading") {
      unread.push({ text: it.raw, reason: "heading", location: it.location })
      prev = null
      continue
    }
    if (verdict === "unread-uncertain" || verdict === "unread-unrecognised") {
      unread.push({ text: it.raw, reason: verdict === "unread-uncertain" ? "uncertain" : "unrecognised", location: it.location })
      prev = null
      continue
    }

    // skill, with or without the cue
    let cat = category
    const reasons: ImportCueReason[] = []
    if (verdict === "skill-cue") reasons.push("lowSkillConfidence")
    if (ans.category && ans.category.confidence >= T.categoryConfidence && ans.category.heading !== null) {
      const same = (category ?? "").trim().toLowerCase() === ans.category.heading.trim().toLowerCase()
      if (!same) {
        cat = ans.category.heading
        reasons.push("categoryUncertain")
      }
    }
    if (ans.detail !== undefined && prev && ans.detail >= T.detailCue && ans.detail < T.detailMerge) reasons.push("maybeDetail")
    const row = push({ name: it.name, description: it.description, categoryName: cat, sourceRef: it.raw, line: it.n, origin: "model" })
    for (const r of reasons) addCue(row, r)
  }
  return { rows, unread, meta }
}
