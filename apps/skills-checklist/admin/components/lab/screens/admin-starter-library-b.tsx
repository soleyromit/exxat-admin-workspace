"use client"

/**
 * Admin starting points, variant B: a gallery of cards, browsed by discipline, each previewing its sections in place.
 *
 * PENDING-ROMIT, flagged: REQ SL-01 says Prism ships no skills library. LEDGER D-X5 keeps these only as editable starting
 * points the program owns: a copy, owned and edited by the program, sharing no evidence or versions with the starting point,
 * arriving not configured. Variant A asks "which list" in a table; B asks "which discipline, and what does the list look like"
 * by showing the categories on each card before any click. Demo state: ?state=empty.
 *
 * Template T1 list (skill-setup-journey 01): header with the ownership fact as the subtitle and one outline action
 * (Import), banner only after a copy, then the discipline switch and the card grid (one region, LEDGER D-X21). No filled
 * button on the page; the preview panel's "Use as a starting point" is the one primary when it is open. The open decision
 * is a lab note (screens.json labNotes), not page content.
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { FloatingSheetPanel, FloatingSheetPanelBody, FloatingSheetPanelContent, FloatingSheetPanelFooter, FloatingSheetPanelHeader } from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { PageFrame } from "@/components/skills/page-header"
import { EmptyBlock } from "@/components/lab/empty-block"
import { LINK_IN_TABLE } from "@/components/lab/link-styles"
import { CopyDialog, StartingPointPreview, type CopyResult } from "@/components/lab/import/starter-copy"
import { useV2State } from "@/lib/v2/react"
import { IMPORT_GROUPING, sectionsOf, startingPoints, type StartingPoint } from "@/lib/lab/import"
import { LaterTitle } from "@/components/lab/import/sample-badge"
import { countSkills, skillNounPlural } from "@/lib/lab/terms"

const SECTIONS_ON_CARD = 4

export function AdminStarterLibraryB() {
  const params = useSearchParams()
  const empty = params?.get("state") === "empty"
  const state = useV2State()
  const points = React.useMemo(() => (empty ? [] : startingPoints()), [empty])
  const router = useRouter()
  const pathname = usePathname()
  // The open preview lives in the URL (?preview=id): the card title is a plain link, so each card carries no extra button.
  const openId = params?.get("preview") ?? null
  const hrefFor = React.useCallback((id: string | null) => {
    const q = new URLSearchParams(params?.toString() ?? "")
    if (id) q.set("preview", id)
    else q.delete("preview")
    return `${pathname}?${q.toString()}`
  }, [params, pathname])
  const setOpenId = (id: string | null) => router.replace(hrefFor(id), { scroll: false })
  const [confirming, setConfirming] = React.useState<StartingPoint | null>(null)
  const [done, setDone] = React.useState<CopyResult | null>(null)
  const [disc, setDisc] = React.useState("all")
  const open = points.find((p) => p.id === openId) ?? null
  const disciplines = React.useMemo(() => [...new Set(points.map((p) => p.discipline))].sort((a, b) => points.filter((p) => p.discipline === b).length - points.filter((p) => p.discipline === a).length || a.localeCompare(b)), [points])

  return (
    <PageFrame
      title={<LaterTitle>Starting points</LaterTitle>}
      subtitle="Example lists to copy and edit. Your program owns the copy."
      actions={<Button asChild variant="outline" size="sm"><Link href="/lab/admin/import-ai-review">{`Import ${skillNounPlural()}`}</Link></Button>}
    >
      <div className="flex flex-col gap-4" data-starter-lab="B" data-page-type="list">
        {done ? (
          <LocalBanner variant="success" title={`${countSkills(done.copied)} copied to ${done.target}`} dismissible onDismiss={() => setDone(null)} action={{ label: "Open the library", href: "/lab/admin/skills-library" }}>
            Each is not configured yet.
          </LocalBanner>
        ) : null}
        {points.length === 0 ? (
          <EmptyBlock title="No starting points are offered" body="Bring in the list you already have instead." action={{ label: `Import ${skillNounPlural()}`, href: "/lab/admin/import-ai-review" }} />
        ) : (
          <section aria-label="Starting points" className="flex flex-col gap-3">
            <ViewSegmentedControl<string>
              aria-label="Discipline"
              value={disc}
              onValueChange={(v) => setDisc(v)}
              options={[{ value: "all", label: `All ${points.length}` }, ...disciplines.map((d) => ({ value: d, label: `${d} ${points.filter((p) => p.discipline === d).length}` }))]}
            />
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-discipline={disc}>
              {points.filter((p) => disc === "all" || p.discipline === disc).map((p) => <PointCard key={p.id} point={p} href={hrefFor(p.id)} />)}
            </ul>
          </section>
        )}
      </div>

      <FloatingSheetPanel open={!!open} onOpenChange={(o) => { if (!o) setOpenId(null) }}>
        <FloatingSheetPanelContent size="md">
          {open ? (
            <>
              <FloatingSheetPanelHeader title={open.label} subtitle={`${countSkills(open.skills.length)} in ${sectionsOf(open).length} ${IMPORT_GROUPING.categories}`} onClose={() => setOpenId(null)} />
              <FloatingSheetPanelBody className="px-4 pb-4"><StartingPointPreview point={open} /></FloatingSheetPanelBody>
              <FloatingSheetPanelFooter className="flex justify-end gap-2">
                <Button type="button" variant="default" size="default" onClick={() => { setConfirming(open); setOpenId(null) }}>Use as a starting point</Button>
              </FloatingSheetPanelFooter>
            </>
          ) : null}
        </FloatingSheetPanelContent>
      </FloatingSheetPanel>
      <CopyDialog point={confirming} skills={state.skills} onClose={() => setConfirming(null)} onCopied={setDone} />
    </PageFrame>
  )
}

function PointCard({ point, href }: { point: StartingPoint; href: string }) {
  const sections = sectionsOf(point)
  const counts = sections.map((s) => ({ s, n: point.skills.filter((k) => k.section === s).length }))
  return (
    <li className="flex">
      <Card className="flex w-full flex-col" data-starting-point={point.id}>
        <CardHeader className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">{point.discipline}</span>
          <CardTitle className="text-base"><Link href={href} scroll={false} className={LINK_IN_TABLE}>{point.label}</Link></CardTitle>
          <p className="text-sm tabular-nums text-muted-foreground">{`${countSkills(point.skills.length)} in ${sections.length} ${sections.length === 1 ? IMPORT_GROUPING.category.toLowerCase() : IMPORT_GROUPING.categories}`}</p>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-2">
          <ul className="flex flex-col gap-1" aria-label={`${IMPORT_GROUPING.category} list of ${point.label}`}>
            {counts.slice(0, SECTIONS_ON_CARD).map(({ s, n }) => (
              <li key={s} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-muted-foreground">{s}</span>
                <span className="tabular-nums text-muted-foreground">{n}</span>
              </li>
            ))}
            {sections.length > SECTIONS_ON_CARD ? <li className="text-xs text-muted-foreground">{`and ${sections.length - SECTIONS_ON_CARD} more`}</li> : null}
          </ul>
        </CardContent>
        {/* No button per card: the title link opens the preview sheet, which carries "Use as a starting point". */}
      </Card>
    </li>
  )
}
