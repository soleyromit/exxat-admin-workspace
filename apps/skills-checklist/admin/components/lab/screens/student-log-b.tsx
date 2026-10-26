"use client"

/**
 * Student Log a skill, variant B: shift log (named alternative).
 * Tests: does adding each skill the moment it happens (one search, place from the placement) and finishing details later, then
 * sending the ready ones together, fit a busy shift better than a form per sitting?
 * Regions (list budget 4): header · add what you just did · on this device (entries with details and sync state) · ready to send.
 * Every entry is on the device from the moment it is added and shows queued, synced or conflict [COMP rec 9].
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { DetailsFields, SelfEvalFields, SkillPicker, TOUCH_ROW } from "@/components/lab/student2/log-parts"
import { SyncBadge } from "@/components/lab/student2/sync-parts"
import { SectionTitle } from "@/components/lab/student/parts"
import { FormSkeleton } from "./student-log-a"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { shortDate } from "@/lib/v2/format"
import { personById, skillById, submissionsOfStudent } from "@/lib/v2/evidence-index"
import { syncStateOf } from "@/lib/v2/sync"
import type { SyncState } from "@/lib/v2/types"
import { aNoun, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { PRACTICE_LINE, detailErrors, pickRows, selfEvalEnabled, student2Href, whereChoices, type DetailValues } from "@/lib/lab/student2"

export function StudentLogB() {
  return (
    <Student2Frame
      title={`Log ${aNoun()}`}
      empty={(c) => <EmptyBlock title={`No ${skillNounPlural()} open yet`} body={`Your program has not set up ${skillNounPlural()} to log. Check back after it publishes them.`} action={{ label: "Back to My progress", href: student2Href("home", {}, c.studentId) }} />}
      loading={<FormSkeleton />}
    >
      {(ctx) => <ShiftLog ctx={ctx} />}
    </Student2Frame>
  )
}

interface ShiftRow {
  key: string
  skillId: string
  name: string
  where: string
  clinical: boolean
  at: string
  details: DetailValues
  rating: string
  sync: SyncState
  requestTo: string | null
  fresh: boolean
}

const unitOf = (location: string | null) => (location && location.includes(",") ? location.split(",").slice(1).join(",").trim() : location ?? "")
/** 24 h, the one canonical time format (consistency audit item 8). */
const time = (iso: string) => (iso.length > 10 ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }) : "")

function ShiftLog({ ctx }: { ctx: Student2Ctx }) {
  const { state: s, model: m, studentId, offline, demo } = ctx
  const picks = React.useMemo(() => pickRows(s, m), [s, m])
  const where = React.useMemo(() => whereChoices(s, studentId), [s, studentId])
  const [whereVal, setWhere] = React.useState(where[0]?.value ?? "")
  const [open, setOpen] = React.useState(false)
  const [expanded, setExpanded] = React.useState<string | null>(null)

  const seeded = React.useMemo<ShiftRow[]>(() => {
    const subs = submissionsOfStudent(s, studentId)
    return s.logEntries
      .filter((e) => e.studentId === studentId)
      .map((e) => {
        const sub = subs.find((x) => x.entryIds?.includes(e.id) || x.id === e.requestId)
        const raw = syncStateOf(s, { entryId: e.id })
        const sync: SyncState = demo === "synced" ? "synced" : (demo === "queued" || demo === "offline") && raw === "synced" ? "queued" : raw
        return { key: e.id, skillId: e.skillId, name: skillById(s, e.skillId)?.name ?? skillNoun(), where: e.location ?? (e.setting === "lab" ? "Lab" : "Simulation"), clinical: e.setting === "clinical", at: e.at, details: { date: e.at.slice(0, 10), unit: unitOf(e.location), case: "" }, rating: e.rating ?? "", sync, requestTo: sub ? personById(s, sub.assignedToId)?.name ?? "an evaluator" : null, fresh: false }
      })
      .sort((a, b) => (a.at < b.at ? 1 : -1))
  }, [s, studentId, demo])
  const [added, setAdded] = React.useState<ShiftRow[]>([])
  const rows = [...added, ...seeded]

  const add = (skillId: string) => {
    const w = where.find((x) => x.value === whereVal)
    const key = `new-${added.length + 1}-${skillId}`
    setAdded((a) => [{ key, skillId, name: skillById(s, skillId)?.name ?? skillNoun(), where: w?.label ?? "", clinical: w?.setting === "clinical", at: `${DEMO_TODAY}T14:${String(10 + a.length).padStart(2, "0")}:00Z`, details: { date: DEMO_TODAY, unit: unitOf(w?.location ?? null), case: "" }, rating: "", sync: offline ? "queued" : "synced", requestTo: null, fresh: true }, ...a])
    setOpen(false)
    setExpanded(key)
  }
  const patch = (key: string, p: Partial<ShiftRow>) => setAdded((a) => a.map((r) => (r.key === key ? { ...r, ...p } : r)))

  const missing = (r: ShiftRow): string[] => {
    const out = Object.keys(detailErrors(r.details)).map((k) => (k === "date" ? "date" : k === "unit" ? "unit" : k))
    if (r.fresh && selfEvalEnabled(skillById(s, r.skillId)) && !r.rating) out.push("self-rating")
    return out
  }
  const ready = rows.filter((r) => r.clinical && !r.requestTo && r.sync !== "conflict" && missing(r).length === 0)
  const practice = rows.some((r) => !r.clinical)
  const pendingClinical = rows.some((r) => r.clinical && !r.requestTo)

  return (
    <div className="grid gap-5 lg:grid-cols-12" data-student-lab="log-B">
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
        <Card className="gap-0 py-0" data-region="add">
          <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Label htmlFor="add-skill">Add what you just did</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button id="add-skill" type="button" variant="outline" size="default" className={cn("w-full justify-start font-normal text-muted-foreground", TOUCH_ROW)} aria-haspopup="listbox">
                    <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
                    {`Search ${picks.length} ${skillNounPlural()}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-80 p-1">
                  <SkillPicker rows={picks} selected={[]} onToggle={add} autoFocus mode="add" listClassName="max-h-80" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1.5 sm:w-64">
              <Label htmlFor="add-where">Where</Label>
              <Select value={whereVal} onValueChange={setWhere}>
                <SelectTrigger id="add-where" size="sm" className={cn("w-full", TOUCH_ROW)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {where.map((w) => <SelectItem key={w.value} value={w.value}>{w.setting === "clinical" ? w.label : `${w.label}, practice`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0" data-region="device">
          <CardContent className="flex flex-col gap-1 py-4">
            <SectionTitle count={rows.length}>On this device</SectionTitle>
            {rows.length === 0 ? <p className="py-2 text-sm text-muted-foreground">{`Nothing logged yet. Add ${aNoun()} above.`}</p> : null}
            <ul className="flex flex-col divide-y divide-border">
              {rows.map((r) => {
                const need = missing(r)
                const isOpen = expanded === r.key
                return (
                  <li key={r.key} className="py-2.5">
                    <Collapsible open={isOpen} onOpenChange={(o) => setExpanded(o ? r.key : null)}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <div className="flex min-w-0 basis-full flex-col sm:basis-0 sm:flex-1">
                          <span className="truncate text-sm font-medium text-foreground">{r.name}</span>
                          <span className="truncate text-xs text-muted-foreground">{[r.where, r.at.slice(0, 10) === DEMO_TODAY ? `today ${time(r.at)}` : shortDate(r.at)].filter(Boolean).join(" · ")}</span>
                        </div>
                        <RowStatus r={r} need={need} />
                        {r.sync === "conflict" ? (
                          <Link href={student2Href("offline-sync", {}, studentId)} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Conflict on ${r.name}. Choose a version`}>
                            <SyncBadge state={r.sync} />
                          </Link>
                        ) : (
                          <SyncBadge state={r.sync} />
                        )}
                        {r.fresh ? (
                          <CollapsibleTrigger asChild>
                            <Button type="button" variant="ghost" size="icon-sm" aria-label={isOpen ? `Hide details for ${r.name}` : `Details for ${r.name}`}>
                              <i className={cn("fa-light", isOpen ? "fa-chevron-up" : "fa-chevron-down")} aria-hidden="true" />
                            </Button>
                          </CollapsibleTrigger>
                        ) : null}
                      </div>
                      <CollapsibleContent>
                        <div className="mt-3 flex flex-col gap-4 rounded-md bg-muted/40 p-3">
                          <DetailsFields idPrefix={r.key} values={r.details} onChange={(id, v) => patch(r.key, { details: { ...r.details, [id]: v } })} errors={detailErrors(r.details)} showErrors />
                          {r.clinical && selfEvalEnabled(skillById(s, r.skillId)) ? <SelfEvalFields s={s} ids={[r.skillId]} values={{ [r.skillId]: r.rating }} onChange={(_, v) => patch(r.key, { rating: v })} /> : null}
                          {!r.clinical ? <p className="text-xs text-muted-foreground">{PRACTICE_LINE}</p> : null}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-4">
        <Card className="gap-0 py-0 lg:sticky lg:top-4" data-region="send">
          <CardContent className="flex flex-col gap-3 py-4">
            <SectionTitle count={ready.length}>Ready to send</SectionTitle>
            {ready.length ? (
              <ul className="flex flex-col gap-1 text-sm text-foreground">
                {ready.slice(0, 5).map((r) => <li key={r.key} className="truncate">{r.name}</li>)}
                {ready.length > 5 ? <li className="text-muted-foreground">{`and ${ready.length - 5} more`}</li> : null}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{pendingClinical ? "Finish the details above to send." : `Clinical ${skillNounPlural()} you add appear here.`}</p>
            )}
            {ready.length > 0 ? (
              <Button asChild variant="default" size="default" className="w-full max-sm:h-11">
                <Link href={student2Href("request-signoff", { skills: [...new Set(ready.map((r) => r.skillId))].join(",") }, studentId)}>{`Send ${countSkills(ready.length)} for evaluation`}</Link>
              </Button>
            ) : null}
            {practice ? <p className="text-xs text-muted-foreground">Practice trials stay on your record and are not sent.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RowStatus({ r, need }: { r: ShiftRow; need: string[] }) {
  if (!r.clinical) return <StatusBadge label="Practice" tone="neutral" icon="fa-flask" size="sm" />
  if (r.requestTo) return <StatusBadge label={`Sent to ${r.requestTo}`} tone="neutral" icon="fa-paper-plane" size="sm" />
  if (need.length) return <StatusBadge label={`Add ${need.join(", ")}`} tone="neutral" icon="fa-pen" size="sm" />
  return <StatusBadge label="Ready" tone="neutral" icon="fa-circle-check" size="sm" />
}
