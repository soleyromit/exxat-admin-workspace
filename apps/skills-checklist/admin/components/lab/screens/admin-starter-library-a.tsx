"use client"

/**
 * Admin starting points (v2 "starter libraries"), variant A: a small gallery, since there are a handful and an admin picks by recognising a discipline. Each card says what it holds and shows its first
 * categories; Preview opens the skills in a non-modal FloatingSheetPanel, with Copy: a real copy into the library that the program owns (D-L130). The Add menu's Bulk upload is the other way in.
 *
 * PENDING-ROMIT: REQ SL-01 says Prism ships no skills library. LEDGER D-X5 keeps these only as editable starting points the
 * program owns: a copy, sharing no evidence or versions, arriving not configured. That note is a lab note (screens.json
 * labNotes, the lab bar tooltip), never page copy. Demo state: ?state=empty (no starting points offered).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelHeader, FloatingSheetPanelWorkflowFooter } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { PageFrame } from "@/components/skills/page-header"
import { EmptyBlock } from "@/components/lab/empty-block"
import { StartingPointPreview } from "@/components/lab/import/starter-copy"
import { IMPORT_GROUPING, sectionsOf, startingPoints, type StartingPoint } from "@/lib/lab/import"
import { LaterTitle } from "@/components/lab/import/sample-badge"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { addSkillsToStore, draftToSkill, EMPTY_DRAFT, normName } from "@/lib/lab/library"
import { useV2State, useV2Store } from "@/lib/v2/react"
import { IDS } from "@/lib/v2/seed-core"
import { ensureVocab } from "@/lib/v2/vocabulary"
import { countSkills } from "@/lib/lab/terms"
import { TYPE } from "@/components/lab/type-scale"

const DISCIPLINE_ICON: Record<string, string> = { Nursing: "fa-user-nurse", Radiography: "fa-x-ray", "Surgical technology": "fa-scalpel", Paramedic: "fa-truck-medical" }
const IMPORT_HREF = "/lab/admin/import-ai-review"

function PointCard({ point, onPreview }: { point: StartingPoint; onPreview: () => void }) {
  const sections = sectionsOf(point)
  const shown = sections.slice(0, 3)
  const more = sections.length - shown.length
  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-lg border border-border p-4" data-starter-card>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand"><i className={`fa-light ${DISCIPLINE_ICON[point.discipline] ?? "fa-book-medical"}`} aria-hidden="true" /></span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <h2 className={TYPE.card}>{point.label}</h2>
          <span className="text-sm tabular-nums text-muted-foreground">{`${countSkills(point.skills.length)}, ${sections.length} ${IMPORT_GROUPING.categories}`}</span>
        </span>
      </div>
      <p className="line-clamp-2 min-w-0 flex-1 text-sm text-muted-foreground" title={sections.join(", ")} data-starter-categories>{`${shown.join(", ")}${more ? `, and ${more} more` : ""}`}</p>
      <div><Button type="button" variant="outline" size="sm" aria-label={`Preview ${point.label}`} onClick={onPreview}>Preview</Button></div>
    </li>
  )
}

export function AdminStarterLibraryA() {
  const params = useSearchParams()
  const empty = params?.get("state") === "empty"
  const points = React.useMemo(() => (empty ? [] : startingPoints()), [empty])
  const [openId, setOpenId] = React.useState<string | null>(null)
  const open = points.find((p) => p.id === openId) ?? null
  const to = useLabHref()
  const router = useRouter()
  const store = useV2Store()
  const skills = useV2State().skills
  const [copied, setCopied] = React.useState<{ label: string; n: number } | null>(null)
  // Names already in the library are left alone: the program's own skill and its evidence stay as they are [REQ IM-06].
  const known = React.useMemo(() => new Set(skills.map((k) => normName(k.name))), [skills])
  const fresh = open ? open.skills.filter((k) => !known.has(normName(k.name))) : []
  const repeats = open ? open.skills.length - fresh.length : 0
  const copy = () => {
    if (!open || !fresh.length) return
    const at = new Date().toISOString()
    const stamp = Date.now().toString(36)
    const added = fresh.map((k, i) => draftToSkill({ ...EMPTY_DRAFT, name: k.name, category: k.section, section: k.section }, `sk-start-${stamp}-${i}`))
    store.update((st) => addSkillsToStore(ensureVocab(st, "categories", [...new Set(fresh.map((k) => k.section))], IDS.ross, at), added, IDS.ross, at, { id: `batch-${stamp}`, kind: "starter-library", label: open.label }))
    setCopied({ label: open.label, n: added.length })
    setOpenId(null)
  }

  return (
    <PageFrame
      title={<LaterTitle>Starting points</LaterTitle>}
      actions={<Button asChild variant="outline" size="sm"><Link href={IMPORT_HREF}>Bulk upload</Link></Button>}
    >
      <div className="flex flex-col gap-4" data-starter-lab="A" data-page-type="list">
        {copied ? <LocalBanner variant="success" title={`${countSkills(copied.n)} copied to the library from ${copied.label}.`} action={{ label: "Open the library", onClick: () => router.push(to("admin/skills-library", {})) }}>They are yours to change there.</LocalBanner> : null}
        {points.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Starting points">
            {points.map((p) => <PointCard key={p.id} point={p} onPreview={() => setOpenId(p.id)} />)}
          </ul>
        ) : <EmptyBlock title="No starting points are offered" action={{ label: "Bulk upload", href: IMPORT_HREF }} />}
      </div>

      <FloatingSheetPanel open={!!open} onOpenChange={(o) => { if (!o) setOpenId(null) }}>
        <FloatingSheetPanelContent size="md">
          {open ? (
            <>
              <FloatingSheetPanelHeader title={open.label} subtitle={`${countSkills(open.skills.length)} in ${sectionsOf(open).length} ${IMPORT_GROUPING.categories}`} onClose={() => setOpenId(null)} />
              <FloatingSheetPanelBody className="flex flex-col gap-4 px-4 pb-4">
                <p className="text-sm text-muted-foreground" data-starter-copy-note>
                  {fresh.length ? `The copy is yours to change. Nothing stays linked to this starting point.` : `All of these are already in your library.`}
                  {fresh.length && repeats ? ` ${countSkills(repeats)} already in your library ${repeats === 1 ? "is" : "are"} skipped.` : ""}
                </p>
                <StartingPointPreview point={open} />
              </FloatingSheetPanelBody>
              <FloatingSheetPanelWorkflowFooter cancelLabel="Close" onCancel={() => setOpenId(null)} primaryLabel={fresh.length ? `Copy ${countSkills(fresh.length)}` : "Copy"} primaryDisabled={!fresh.length} onPrimary={copy} primaryIconClassName="fa-light fa-copy text-xs" />
            </>
          ) : null}
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
    </PageFrame>
  )
}
