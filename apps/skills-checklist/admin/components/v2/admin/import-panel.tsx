"use client"

import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { ToggleGroup, ToggleGroupItem } from "@exxatdesignux/ui/components/ui/toggle-group"
import { SkillsFileUpload, readTextFile } from "@/components/skills"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { ADMIN_ID, useAdminRun } from "@/components/v2/admin/use-admin"
import { EditSkillDialog } from "@/components/v2/admin/edit-skill-dialog"
import { extractFileOnServer } from "@/lib/import-ai/client-api"
import { createImportedSkills, type NewSkill } from "@/lib/v2/admin-actions"
import { NO_CATEGORY, proposeFromText, type ImportProposal, type ProposedSkill } from "@/lib/v2/import"
import { useV2State } from "@/lib/v2/react"

type Decision = "accepted" | "rejected"
const SAMPLE_URL = "/v2/sample-skills-checklist.pdf"
const ACCEPT = ".pdf,.txt,.md,.csv,.docx,.xlsx"

const READ_ERRORS: Record<string, string> = {
  unreadable: "We could not read text from this file. It may be a scanned image. Paste the list into a text file, or use a text or Word file.",
  too_large: "This file is too large. Split it into smaller files and import them one at a time.",
  unsupported: "This file type is not supported. Use a PDF, text, Word or spreadsheet file.",
  empty: "The file has no text in it. Check that you chose the right file.",
  unavailable: "The file reader is not available right now. Use a text file instead, or try again in a moment.",
}

interface Source {
  name: string
  proposal: ImportProposal
}

/** Upload a checklist, review what was proposed beside the source lines, then create the accepted skills in one step (IM-01 to IM-09, IM-13). */
export function ImportPanel({ onCreated }: { onCreated: (message: string, firstSkillId: string) => void }) {
  const state = useV2State()
  const run = useAdminRun()
  const [phase, setPhase] = React.useState<"idle" | "reading">("idle")
  const [error, setError] = React.useState<string | null>(null)
  const [source, setSource] = React.useState<Source | null>(null)
  const [decisions, setDecisions] = React.useState<Record<string, Decision | undefined>>({})
  const [edits, setEdits] = React.useState<Record<string, NewSkill>>({})
  const [editing, setEditing] = React.useState<ProposedSkill | null>(null)
  const [createError, setCreateError] = React.useState<string | null>(null)

  const lastFile = React.useRef<File | null>(null)
  const read = async (file: File) => {
    lastFile.current = file
    setError(null)
    setCreateError(null)
    setPhase("reading")
    try {
      const ext = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? ""
      let text: string | null = null
      if (["txt", "md", "csv"].includes(ext)) text = await readTextFile(file)
      else {
        const out = await extractFileOnServer(file)
        if (!out.ok) {
          setError(READ_ERRORS[out.error])
          return
        }
        text = out.text
      }
      if (!text || !text.trim()) {
        setError(READ_ERRORS.empty)
        return
      }
      const proposal = proposeFromText(text, state)
      if (proposal.skills.length === 0) {
        setError("We read the file but found no numbered or bulleted skills. Add a number or a dash in front of each skill, or paste the list in that form.")
        return
      }
      setSource({ name: file.name, proposal })
      setDecisions({})
      setEdits({})
    } catch {
      setError(READ_ERRORS.unavailable)
    } finally {
      setPhase("idle")
    }
  }

  const useSample = async () => {
    setError(null)
    try {
      const res = await fetch(SAMPLE_URL)
      if (!res.ok) throw new Error("missing")
      const blob = await res.blob()
      await read(new File([blob], "sample-skills-checklist.pdf", { type: "application/pdf" }))
    } catch {
      setError("The sample checklist could not be loaded. Choose your own file instead.")
    }
  }

  const valuesOf = (p: ProposedSkill): NewSkill => edits[p.id] ?? { name: p.name, category: p.category === NO_CATEGORY ? "" : p.category, description: p.description }
  const accepted = source ? source.proposal.skills.filter((p) => decisions[p.id] === "accepted") : []
  const n = accepted.length

  const create = () => {
    if (!source) return
    const r = run((s, at) => createImportedSkills(s, accepted.map(valuesOf), source.name, ADMIN_ID, at))
    if (!r.ok) {
      setCreateError(r.error)
      return
    }
    onCreated(`${r.created} ${r.created === 1 ? "skill" : "skills"} created from ${source.name}. They are not configured yet, so they cannot be mapped to a course until you configure them.`, r.state.batches[r.state.batches.length - 1].skillIds[0])
    setSource(null)
    setDecisions({})
    setEdits({})
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Choose your checklist</CardTitle>
          <CardDescription>Use the list you already have. No template or column order is needed. Skills are proposed for your review, and nothing is created until you confirm.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3" aria-busy={phase === "reading"}>
          <div className="flex flex-wrap items-start gap-3">
            <SkillsFileUpload id="v2-import-file" label="Choose a PDF or text file" accept={ACCEPT} disabled={phase === "reading"} fileName={source?.name ?? null} onFile={read} />
            <Button type="button" variant="outline" size="default" disabled={phase === "reading"} onClick={useSample}>
              Use the sample checklist
            </Button>
          </div>
          {phase === "reading" ? (
            <p role="status" className="text-sm text-muted-foreground">
              Reading the file
            </p>
          ) : null}
          {error ? (
            <LocalBanner variant="error" title="The file could not be read" retry={lastFile.current ? { label: "Read the file again", onClick: () => void read(lastFile.current as File) } : undefined} dismissible onDismiss={() => setError(null)}>
              {error}
            </LocalBanner>
          ) : null}
        </CardContent>
      </Card>

      {source ? (
        <section aria-labelledby="proposal-heading" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h3 id="proposal-heading" className="text-base font-semibold text-foreground">
                {`${source.proposal.skills.length} proposed skills from ${source.name}`}
              </h3>
              <p className="text-sm text-muted-foreground">Each proposal sits beside the line it came from. Accept, edit or reject each one. Categories are taken from the headings above the skills.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => setDecisions(Object.fromEntries(source.proposal.skills.map((p) => [p.id, "accepted" as const])))}
              >
                {`Accept all ${source.proposal.skills.length}`}
              </Button>
              <Button type="button" variant="outline" size="default" onClick={() => setDecisions({})}>
                Clear decisions
              </Button>
            </div>
          </div>
          <V2Grid<ProposedSkill>
            caption="Proposed skills with their source lines"
            rows={source.proposal.skills}
            id={(p) => p.id}
            columns={[
              v2col<ProposedSkill>("decision", "Decision", 190, (p) => (
                <span className="flex flex-col items-start gap-1">
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    aria-label={`Decision for ${valuesOf(p).name}`}
                    value={decisions[p.id] ?? ""}
                    onValueChange={(v) => setDecisions((d) => ({ ...d, [p.id]: (v || undefined) as Decision | undefined }))}
                  >
                    <ToggleGroupItem value="accepted" aria-label={`Accept ${valuesOf(p).name}`}>
                      Accept
                    </ToggleGroupItem>
                    <ToggleGroupItem value="rejected" aria-label={`Reject ${valuesOf(p).name}`}>
                      Reject
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <span className="text-xs text-muted-foreground">{decisions[p.id] === "accepted" ? "Accepted" : decisions[p.id] === "rejected" ? "Rejected" : "Not decided yet"}</span>
                </span>
              )),
              v2col<ProposedSkill>("proposal", "Proposed skill", 330, (p) => {
                const v = valuesOf(p)
                return (
                  <span className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">{v.name}</span>
                    <span className="text-xs text-muted-foreground">{v.category || NO_CATEGORY}</span>
                    {v.description ? <span className="text-xs text-muted-foreground">{v.description}</span> : null}
                    {p.duplicateOf ? <Badge variant="outline" className="mt-1 w-fit">{`Repeats ${p.duplicateOf}`}</Badge> : null}
                  </span>
                )
              }),
              v2col<ProposedSkill>("source", "Source line", 340, (p) => (
                <span className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{`Line ${p.line}`}</span>
                  <q className="font-mono text-xs text-foreground">{p.sourceText}</q>
                </span>
              )),
              v2col<ProposedSkill>("edit", "Edit", 110, (p) => (
                <Button type="button" variant="outline" size="sm" aria-label={`Edit ${valuesOf(p).name}`} onClick={() => setEditing(p)}>
                  Edit
                </Button>
              )),
            ]}
          />
          {source.proposal.unread.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{`Not picked up (${source.proposal.unread.length} ${source.proposal.unread.length === 1 ? "line" : "lines"})`}</CardTitle>
                <CardDescription>These lines were not read as skills. They are shown as written so nothing disappears quietly. Add any skill you need after you create the others.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1 text-sm">
                  {source.proposal.unread.map((u) => (
                    <li key={u.line} className="flex gap-3">
                      <span className="w-14 shrink-0 text-xs text-muted-foreground">{`Line ${u.line}`}</span>
                      <q className="font-mono text-xs text-foreground">{u.text}</q>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
          {createError ? (
            <LocalBanner variant="error" title="Skills were not created" retry={{ label: "Create the skills again", onClick: create }} dismissible onDismiss={() => setCreateError(null)}>
              {createError}
            </LocalBanner>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-3">
            {n === 0 ? (
              <p id="create-reason" className="text-sm text-muted-foreground">
                Accept at least one proposed skill to create it.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">They are created without an evaluation model. You configure each one next.</p>
            )}
            <Button type="button" variant="default" size="default" disabled={n === 0} aria-describedby={n === 0 ? "create-reason" : undefined} onClick={create}>
              {`Create ${n} ${n === 1 ? "skill" : "skills"}`}
            </Button>
          </div>
          <EditSkillDialog
            open={editing !== null}
            onOpenChange={(o) => !o && setEditing(null)}
            title="Edit proposed skill"
            description="Change what will be created. The source line stays as written."
            initial={editing ? valuesOf(editing) : { name: "", category: "", description: "" }}
            onSave={(v) => {
              if (!editing) return null
              if (!v.name.trim()) return "Enter a name for the skill."
              setEdits((e) => ({ ...e, [editing.id]: v }))
              return null
            }}
          />
        </section>
      ) : null}
    </div>
  )
}
