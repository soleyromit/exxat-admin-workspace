"use client"

import * as React from "react"
import type { Db, Id } from "@/lib/domain/types"
import type { SkillConfigDraft } from "@/lib/store"
import type { DefinitionDraft } from "./draft"
import type { FormIssue, SectionKey } from "./issues"

/**
 * What every S-09 section needs from the editor. Sections stay presentational: they read the draft and call `setCfg` /
 * `setDef`; validation, saving and dialogs live in the editor.
 */
export interface ConfigureCtx {
  db: Db
  skillId: Id | null
  def: DefinitionDraft
  cfg: SkillConfigDraft
  setDef: (fn: (d: DefinitionDraft) => DefinitionDraft) => void
  setCfg: (fn: (c: SkillConfigDraft) => SkillConfigDraft) => void
  hasModel: boolean
  /** Errors the admin may see now: after the first Save attempt, or once the section has been blurred (P-02 timing). */
  visible: (path: string | ((p: string) => boolean)) => FormIssue[]
  /** Non-blocking notes (warnings) for a path prefix. */
  warnings: (prefix: string) => FormIssue[]
  touch: (section: SectionKey) => void
  /** Polite live-region announcement (lineage changes, "Removed from n rules"). */
  announce: (text: string) => void
  /** Last AE-07 result, shown next to the list it came from. */
  removal: { kind: "question" | "level"; n: number } | null
  setRemoval: (r: { kind: "question" | "level"; n: number } | null) => void
  /** Number of evaluations already recorded for this skill (0 for a new skill). */
  evidenceCount: number
}

const Ctx = React.createContext<ConfigureCtx | null>(null)
export const ConfigureProvider = Ctx.Provider

export function useConfigure(): ConfigureCtx {
  const c = React.useContext(Ctx)
  if (!c) throw new Error("useConfigure must be used inside the S-09 editor")
  return c
}
