// S-08 import (IM-01..IM-14). The source is interpreted as a PROPOSAL: nothing enters the library until the
// admin confirms (IM-05, IM-13). Interpretation here is deliberately simple and deterministic (delimiters and
// headings); there is no accuracy claim (docs/ux/09 §1). The optional AI assist lives in lib/import-ai and fills the same proposal. Unread lines keep their original text (IM-08).
import type { Db, Id, ImportBatch, ImportInterpretationMeta, ImportRow, Skill, UnreadLine } from "@/lib/domain/types"
import { idsFrom } from "@/lib/domain/ids"
import { BULLET, classifyByRules, splitNameDescription } from "@/lib/import-ai/rules"
import type { InterpretationResult } from "@/lib/import-ai/types"
import { norm, skillHasEvidence } from "../derive"
import { fail, ok, type ActionCtx, type Result } from "../result"

export interface ProposeImportInput {
  text: string
  sourceName: string
  sourceKind: "paste" | "file"
  /** Read comma-separated columns (name, description, category). Defaults to true for a source named "*.csv". */
  columns?: boolean
  /** The first non-blank line is a header row: it is skipped without being reported. Line numbers still count it (IM-08). */
  skipHeader?: boolean
  /** How the batch was read. Set to "ai-fallback" when the AI reading was asked for and was not available. */
  interpretation?: ImportInterpretationMeta
}

export { splitNameDescription }

interface Parsed {
  rows: Array<Omit<ImportRow, "id" | "match">>
  unread: Array<Omit<UnreadLine, "id">>
}

/**
 * Pure interpretation of the source text by RULES only (the standard reader). Stage 1 of the AI assist is the same classifier
 * (lib/import-ai/rules.ts), so every line the rules settle reads exactly as before. Blank lines are ignored; everything else is
 * a row or an unread line.
 */
export function interpretSource(input: ProposeImportInput): Parsed {
  const rows: Parsed["rows"] = []
  const unread: Parsed["unread"] = []
  for (const it of classifyByRules(input)) {
    if (it.kind === "unread") unread.push({ text: it.raw, reason: it.reason, location: it.location })
    else if (it.kind === "skill" || it.kind === "ambiguous") {
      rows.push({ include: true, name: it.name, description: it.description, categoryName: it.categoryName, sourceRef: it.raw, duplicateChoice: "skip" })
    }
  }
  return { rows, unread }
}

function matchOf(db: Db, name: string, otherRows: ImportRow[]): ImportRow["match"] {
  const n = norm(name)
  const existing = db.skills.find((s) => norm(s.name) === n)
  void otherRows
  return existing ? { status: "duplicate", existingSkillId: existing.id } : { status: "new" }
}

type ProposedRow = Omit<ImportRow, "id" | "match">

function buildBatch(db: Db, input: ProposeImportInput, parsed: { rows: ProposedRow[]; unread: Array<Omit<UnreadLine, "id">> }, ctx: ActionCtx, interpretation: ImportInterpretationMeta | undefined): Result<{ batchId: Id }> {
  const ids = idsFrom(db)
  const seen = new Set<string>()
  const rows: ImportRow[] = parsed.rows.map((r) => {
    const n = norm(r.name)
    const repeated = seen.has(n)
    seen.add(n)
    return {
      ...r,
      id: ids.next("row"),
      // A name repeated inside the same source starts excluded so it is not created twice by accident.
      include: repeated ? false : r.include,
      match: matchOf(db, r.name, []),
    }
  })
  const batch: ImportBatch = {
    id: ids.next("imp"),
    sourceKind: input.sourceKind,
    sourceName: input.sourceName,
    createdAt: ctx.now,
    status: "review",
    createCategories: rows.some((r) => r.categoryName !== null),
    rows,
    unread: parsed.unread.map((u) => ({ ...u, id: ids.next("unr") })),
    ...(interpretation ? { interpretation } : {}),
    createdSkillIds: [],
    createdCategoryIds: [],
  }
  return ok({ ...db, seq: ids.seq(), importBatches: [...db.importBatches, batch] }, { batchId: batch.id })
}

/** IM-01..IM-04, IM-06..IM-08: build a batch in `review`. NOTHING is created (IM-05, IM-13). */
export function proposeImport(db: Db, input: ProposeImportInput, ctx: ActionCtx): Result<{ batchId: Id }> {
  if (!input.text.trim()) return fail("invalid", "Nothing to read.", { fields: { text: "required" } })
  return buildBatch(db, input, interpretSource(input), ctx, input.interpretation)
}

/**
 * The same proposal, filled from the optional AI reading (lib/import-ai). It still opens a draft in `review` and creates nothing;
 * duplicates against the library are computed here, in the browser, so no library data ever leaves it (IM-05, IM-13).
 */
export function proposeImportInterpreted(db: Db, input: Omit<ProposeImportInput, "interpretation"> & { interpreted: InterpretationResult }, ctx: ActionCtx): Result<{ batchId: Id }> {
  if (!input.text.trim()) return fail("invalid", "Nothing to read.", { fields: { text: "required" } })
  const { interpreted } = input
  return buildBatch(
    db,
    input,
    {
      rows: interpreted.rows.map((r) => ({
        include: true,
        name: r.name,
        description: r.description,
        categoryName: r.categoryName,
        sourceRef: r.sourceRef,
        duplicateChoice: "skip",
        origin: r.origin,
        ...(r.cue ? { cue: r.cue } : {}),
      })),
      unread: interpreted.unread,
    },
    ctx,
    interpreted.meta,
  )
}

// ---- review edits (IM-05: edit, rename, merge, split, discard, add)

const inReview = (db: Db, id: Id) => {
  const b = db.importBatches.find((x) => x.id === id)
  return b && b.status === "review" ? b : undefined
}
const putBatch = (db: Db, b: ImportBatch): Db => ({ ...db, importBatches: db.importBatches.map((x) => (x.id === b.id ? b : x)) })

export interface ImportRowPatch {
  include?: boolean
  name?: string
  description?: string
  categoryName?: string | null
  duplicateChoice?: ImportRow["duplicateChoice"]
}

export function updateImportRow(db: Db, batchId: Id, rowId: Id, patch: ImportRowPatch): Result<{ rowId: Id }> {
  const b = inReview(db, batchId)
  if (!b) return fail("notFound", "This import is not open for review.")
  const row = b.rows.find((r) => r.id === rowId)
  if (!row) return fail("notFound", "Row not found.")
  if (patch.name !== undefined && !patch.name.trim()) return fail("invalid", "A skill needs a name.", { fields: { name: "required" } })
  if (patch.duplicateChoice === "replace" && row.match.status === "duplicate" && skillHasEvidence(db, row.match.existingSkillId)) {
    return fail("replaceHasEvidence", "Replace is not available: this skill already has evidence.")
  }
  const next: ImportRow = { ...row, ...patch, name: patch.name === undefined ? row.name : patch.name.trim() } as ImportRow
  if (patch.name !== undefined) next.match = matchOf(db, next.name, b.rows)
  return ok(putBatch(db, { ...b, rows: b.rows.map((r) => (r.id === rowId ? next : r)) }), { rowId })
}

export function setImportCreateCategories(db: Db, batchId: Id, value: boolean): Result {
  const b = inReview(db, batchId)
  if (!b) return fail("notFound", "This import is not open for review.")
  return ok(putBatch(db, { ...b, createCategories: value }), undefined)
}

/** Bulk include or exclude (docs/ux/09 S-08 bulk actions). */
export function setImportRowsIncluded(db: Db, batchId: Id, rowIds: Id[], include: boolean): Result {
  const b = inReview(db, batchId)
  if (!b) return fail("notFound", "This import is not open for review.")
  const set = new Set(rowIds)
  return ok(putBatch(db, { ...b, rows: b.rows.map((r) => (set.has(r.id) ? { ...r, include } : r)) }), undefined)
}

/** IM-05 merge: the first row survives (optionally renamed), descriptions are joined, the others are removed. */
export function mergeImportRows(db: Db, batchId: Id, rowIds: Id[], name?: string): Result<{ rowId: Id }> {
  const b = inReview(db, batchId)
  if (!b) return fail("notFound", "This import is not open for review.")
  const picked = b.rows.filter((r) => rowIds.includes(r.id))
  if (picked.length < 2) return fail("invalid", "Choose at least two rows to merge.")
  const [first, ...rest] = picked
  const merged: ImportRow = {
    ...first,
    name: (name ?? first.name).trim() || first.name,
    description: [first.description, ...rest.map((r) => r.description)].filter(Boolean).join(" "),
    sourceRef: [first.sourceRef, ...rest.map((r) => r.sourceRef)].join(" + "),
  }
  merged.match = matchOf(db, merged.name, b.rows)
  const drop = new Set(rest.map((r) => r.id))
  return ok(putBatch(db, { ...b, rows: b.rows.filter((r) => !drop.has(r.id)).map((r) => (r.id === first.id ? merged : r)) }), { rowId: first.id })
}

/** IM-05 split: one row becomes several; the first keeps the description. */
export function splitImportRow(db: Db, batchId: Id, rowId: Id, names: string[]): Result<{ rowIds: Id[] }> {
  const b = inReview(db, batchId)
  if (!b) return fail("notFound", "This import is not open for review.")
  const row = b.rows.find((r) => r.id === rowId)
  if (!row) return fail("notFound", "Row not found.")
  const clean = names.map((n) => n.trim()).filter(Boolean)
  if (clean.length < 2) return fail("invalid", "Enter at least two names.")
  const ids = idsFrom(db)
  const parts: ImportRow[] = clean.map((n, i) => ({
    ...row,
    id: i === 0 ? row.id : ids.next("row"),
    name: n,
    description: i === 0 ? row.description : "",
    match: matchOf(db, n, b.rows),
  }))
  const rows = b.rows.flatMap((r) => (r.id === rowId ? parts : [r]))
  return ok({ ...putBatch(db, { ...b, rows }), seq: ids.seq() }, { rowIds: parts.map((p) => p.id) })
}

/** IM-05 add: an entry the interpretation missed. */
export function addImportRow(db: Db, batchId: Id, input: { name: string; description?: string; categoryName?: string | null }): Result<{ rowId: Id }> {
  const b = inReview(db, batchId)
  if (!b) return fail("notFound", "This import is not open for review.")
  const name = input.name.trim()
  if (!name) return fail("invalid", "A skill needs a name.", { fields: { name: "required" } })
  const ids = idsFrom(db)
  const row: ImportRow = {
    id: ids.next("row"),
    include: true,
    name,
    description: (input.description ?? "").trim(),
    categoryName: input.categoryName ?? null,
    sourceRef: "Added by hand",
    match: matchOf(db, name, b.rows),
    duplicateChoice: "skip",
  }
  return ok({ ...putBatch(db, { ...b, rows: [...b.rows, row] }), seq: ids.seq() }, { rowId: row.id })
}

/** IM-08 follow-up: turn an unread line into a skill row, or ignore it. The original text is never lost silently. */
export function resolveUnreadLine(db: Db, batchId: Id, unreadId: Id, as: "skill" | "ignore"): Result {
  const b = inReview(db, batchId)
  if (!b) return fail("notFound", "This import is not open for review.")
  const line = b.unread.find((u) => u.id === unreadId)
  if (!line) return fail("notFound", "Line not found.")
  const rest = b.unread.filter((u) => u.id !== unreadId)
  if (as === "ignore") return ok(putBatch(db, { ...b, unread: rest }), undefined)
  const name = splitNameDescription(line.text.trim().replace(BULLET, "")).name
  const added = addImportRow(putBatch(db, { ...b, unread: rest }), batchId, { name })
  return added.ok ? ok(added.db, undefined) : added
}

export function cancelImport(db: Db, batchId: Id): Result {
  const b = inReview(db, batchId)
  if (!b) return fail("notFound", "This import is not open for review.")
  return ok(putBatch(db, { ...b, status: "cancelled" }), undefined)
}

export interface ConfirmSummary {
  created: number
  skipped: number
  replaced: number
  categoriesCreated: number
}

/**
 * IM-05, IM-09, IM-11, IM-13: only now are skills created, always UNCONFIGURED, each tied to this batch.
 * IM-06 / OD-13: Replace is refused when the existing skill already holds evidence; the admin must choose again.
 */
export function confirmImport(db: Db, batchId: Id, ctx: ActionCtx): Result<ConfirmSummary> {
  const b = inReview(db, batchId)
  if (!b) return fail("notFound", "This import is not open for review.")
  const ids = idsFrom(db)
  const skills: Skill[] = [...db.skills]
  const categories = [...db.categories]
  const createdSkillIds: Id[] = []
  const createdCategoryIds: Id[] = []
  let skipped = 0
  let replaced = 0

  const categoryFor = (name: string | null): Id | null => {
    if (!name) return null
    const n = norm(name)
    const have = categories.find((c) => norm(c.name) === n)
    if (have) return have.id
    if (!b.createCategories) return null
    const c = { id: ids.next("cat"), name: name.trim(), description: "", active: true }
    categories.push(c)
    createdCategoryIds.push(c.id)
    return c.id
  }

  for (const r of b.rows) {
    if (!r.include) continue
    if (r.match.status === "duplicate") {
      const existing = r.match.existingSkillId
      if (r.duplicateChoice === "skip") {
        skipped += 1
        continue
      }
      if (r.duplicateChoice === "replace") {
        if (skillHasEvidence(db, existing)) {
          return fail("replaceHasEvidence", "Replace is not available: this skill already has evidence.", { data: { rowId: r.id, skillId: existing } })
        }
        const i = skills.findIndex((s) => s.id === existing)
        skills[i] = { ...skills[i], description: r.description || skills[i].description, categoryId: categoryFor(r.categoryName) ?? skills[i].categoryId }
        replaced += 1
        continue
      }
    }
    const sk: Skill = {
      id: ids.next("sk"),
      name: r.name,
      description: r.description,
      categoryId: categoryFor(r.categoryName),
      tagIds: [],
      active: true,
      model: null,
      criteria: { requiredCount: null, levelMinimums: {}, settingMinimums: {} },
      requiresApproval: false,
      allowedRoles: [],
      submissionFields: [],
      evaluatorComment: "optional",
      selfEvaluation: false,
      importBatchId: b.id,
      createdAt: ctx.now,
    }
    skills.push(sk)
    createdSkillIds.push(sk.id)
  }

  const next: ImportBatch = { ...b, status: "confirmed", createdSkillIds, createdCategoryIds }
  return ok(
    { ...putBatch({ ...db, seq: ids.seq(), skills, categories }, next) },
    { created: createdSkillIds.length, skipped, replaced, categoriesCreated: createdCategoryIds.length },
  )
}
