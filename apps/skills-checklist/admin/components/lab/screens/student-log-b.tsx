"use client"

/**
 * Student quick entry (the former Log a skill), variant B: shift list (named alternative). Off the sidebar since 2026-10-27
 * (LEDGER D-L10); kept registered. Its rows are not yet drafts in the shared store (proposal: make each row a draft).
 * Tests: does adding each skill the moment it happens (one search, place from the placement) and finishing details later, then
 * sending the ready ones together, fit a busy shift better than a form per sitting?
 * Regions (list budget 4): header · add what you just did · on this device (entries with details and sync state) · ready to send
 * (one request per place, with the one note it carries, REQ ST-12). Lab and simulation entries are sent too (ST-05, EV-02);
 * inactive skills are not offered (SL-11); a missing location is asked for when no placement supplies it (ST-07).
 * Every entry is on the device from the moment it is added and shows queued, synced or conflict [COMP rec 9].
 */
import { CheckoffDone } from "@/components/lab/student/checkoff"
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { DetailsFields, LocationField, NoteField, SelfEvalFields, SkillPicker, TOUCH_ROW, WhereSelect } from "@/components/lab/student2/log-parts"
import { SyncBadge } from "@/components/lab/student2/sync-parts"
import { SectionTitle } from "@/components/lab/student/parts"
import { FormSkeleton } from "./student-log-a"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { shortDate } from "@/lib/v2/format"
import { personById, skillById, submissionsOfStudent } from "@/lib/v2/evidence-index"
import { syncStateOf } from "@/lib/v2/sync"
import type { SyncState } from "@/lib/v2/types"
import { aNoun, capitalize, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { PRACTICE_LINE, detailErrors, locationError, locationFor, noteError, pickRows, selfEvalEnabled, sendHandoff, student2Href, whereChoices, type DetailValues } from "@/lib/lab/student2"

export function StudentLogB() {
  return (
    <Student2Frame
      title={`Log ${aNoun()}`}
      empty={(c) => <EmptyBlock title={`No ${skillNounPlural()} open yet`} body={`Your program has not set up ${skillNounPlural()} to send. Check back once it has.`} action={{ label: "Back to My progress", href: student2Href("home", {}, c.studentId) }} />}
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
  /** The where choice it was logged against, so ready entries from one place go together in one request. */
  whereVal: string
  location: string
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
  const [location, setLocation] = React.useState("")
  const [note, setNote] = React.useState("")
  const [addTried, setAddTried] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const chosen = where.find((x) => x.value === whereVal)
  const locError = locationError(chosen, location)
  const valueFor = (setting: string, loc: string | null) => (setting === "clinical" ? where.find((w) => w.setting === "clinical" && (w.location ?? w.label) === loc)?.value ?? where.find((w) => w.setting === "clinical")?.value ?? "" : setting)

  const seeded = React.useMemo<ShiftRow[]>(() => {
    const subs = submissionsOfStudent(s, studentId)
    return s.logEntries
      .filter((e) => e.studentId === studentId)
      .map((e) => {
        const sub = subs.find((x) => x.entryIds?.includes(e.id) || x.id === e.requestId)
        const raw = syncStateOf(s, { entryId: e.id })
        const sync: SyncState = demo === "synced" ? "synced" : (demo === "queued" || demo === "offline") && raw === "synced" ? "queued" : raw
        return { key: e.id, skillId: e.skillId, name: skillById(s, e.skillId)?.name ?? skillNoun(), where: e.location ?? (e.setting === "lab" ? "Lab" : "Simulation"), whereVal: valueFor(e.setting, e.location), location: e.location ?? "", clinical: e.setting === "clinical", at: e.at, details: { date: e.at.slice(0, 10), unit: unitOf(e.location), case: "" }, rating: e.rating ?? "", sync, requestTo: sub ? personById(s, sub.assignedToId)?.name ?? "an evaluator" : null, fresh: false }
      })
      .sort((a, b) => (a.at < b.at ? 1 : -1))
  }, [s, studentId, demo]) // eslint-disable-line react-hooks/exhaustive-deps
  const [added, setAdded] = React.useState<ShiftRow[]>([])
  const rows = [...added, ...seeded]

  const add = (skillId: string) => {
    const w = where.find((x) => x.value === whereVal)
    if (locError) {
      setAddTried(true)
      setOpen(false)
      return
    }
    const key = `new-${added.length + 1}-${skillId}`
    const loc = locationFor(w, location) ?? ""
    setAdded((a) => [{ key, skillId, name: skillById(s, skillId)?.name ?? skillNoun(), where: w?.setting === "clinical" ? (w.location ?? `${w.label}, ${loc}`) : w?.label ?? "", whereVal, location: loc, clinical: w?.setting === "clinical", at: `${DEMO_TODAY}T14:${String(10 + a.length).padStart(2, "0")}:00Z`, details: { date: DEMO_TODAY, unit: unitOf(w?.location ?? null), case: "" }, rating: "", sync: offline ? "queued" : "synced", requestTo: null, fresh: true }, ...a])
    setOpen(false)
    setExpanded(key)
  }
  const patch = (key: string, p: Partial<ShiftRow>) => setAdded((a) => a.map((r) => (r.key === key ? { ...r, ...p } : r)))

  const missing = (r: ShiftRow): string[] => {
    const out = Object.keys(detailErrors(r.details)).map((k) => (k === "date" ? "date" : k === "unit" ? "unit" : k))
    if (r.fresh && selfEvalEnabled(skillById(s, r.skillId)) && !r.rating) out.push("self-rating")
    return out
  }
  const ready = rows.filter((r) => !r.requestTo && r.sync !== "conflict" && missing(r).length === 0)
  const practice = rows.some((r) => !r.clinical)
  const pending = rows.some((r) => !r.requestTo)
  // One request per place [REQ EV-05, ST-05]: entries from one placement (or the lab) go together; a lab entry never joins a
  // clinical request, because who may sign it differs (EV-02).
  const batches = React.useMemo(() => {
    const m = new Map<string, ShiftRow[]>()
    for (const r of ready) m.set(r.whereVal, [...(m.get(r.whereVal) ?? []), r])
    return [...m.entries()].map(([value, list]) => ({ value, list, label: where.find((w) => w.value === value)?.label ?? list[0].where }))
  }, [ready, where])
  const nError = noteError(note)
  const sendHref = (b: { value: string; list: ShiftRow[] }) => student2Href("request-signoff", sendHandoff({ skills: [...new Set(b.list.map((r) => r.skillId))].join(","), where: b.value, date: b.list[0].details.date, unit: b.list[0].details.unit, case: b.list[0].details.case, note, loc: b.list[0].location }), studentId)

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
            <WhereSelect id="add-where" choices={where} value={whereVal} onChange={setWhere} className="sm:w-64" />
            {chosen?.askLocation ? (
              <div className="sm:w-56">
                <LocationField id="add-location" value={location} onChange={setLocation} error={addTried ? locError : null} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="gap-0 py-0" data-region="device">
          <CardContent className="flex flex-col gap-1 py-4">
            <SectionTitle count={rows.length}>On this device</SectionTitle>
            {rows.length === 0 ? <p className="py-2 text-sm text-muted-foreground">{`Nothing added yet. Add ${aNoun()} above.`}</p> : null}
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
                          {r.fresh ? <CheckoffDone s={s} studentId={studentId} ids={[r.skillId]} /> : null}
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
                          {selfEvalEnabled(skillById(s, r.skillId)) ? <SelfEvalFields s={s} ids={[r.skillId]} values={{ [r.skillId]: r.rating }} onChange={(_, v) => patch(r.key, { rating: v })} /> : null}
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
            {batches.length === 0 ? (
              <p className="text-sm text-muted-foreground">{pending ? "Finish the details above to send." : `${capitalize(skillNounPlural())} you add appear here.`}</p>
            ) : null}
            {batches.map((b, i) => (
              <div key={b.value} className="flex flex-col gap-2" data-batch={b.value}>
                <p className="text-xs font-medium text-muted-foreground" data-viz-label>{b.label}</p>
                <ul className="flex flex-col gap-1 text-sm text-foreground">
                  {b.list.slice(0, 5).map((r) => <li key={r.key} className="truncate">{r.name}</li>)}
                  {b.list.length > 5 ? <li className="text-muted-foreground">{`and ${b.list.length - 5} more`}</li> : null}
                </ul>
                <Button asChild variant={i === 0 ? "default" : "outline"} size={i === 0 ? "default" : "sm"} className="w-full max-sm:h-11">
                  <Link href={sendHref(b)}>{`Send ${countSkills(b.list.length)} for evaluation`}</Link>
                </Button>
              </div>
            ))}
            {batches.length > 0 ? <NoteField id="log-note" value={note} onChange={setNote} error={nError} /> : null}
            {practice ? <p className="text-xs text-muted-foreground">{PRACTICE_LINE}</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function RowStatus({ r, need }: { r: ShiftRow; need: string[] }) {
  if (r.requestTo) return <StatusBadge label={`Sent to ${r.requestTo}`} tone="neutral" icon="fa-paper-plane" size="sm" />
  if (need.length) return <StatusBadge label={`Add ${need.join(", ")}`} tone="neutral" icon="fa-pen" size="sm" />
  return <StatusBadge label="Ready" tone="neutral" icon="fa-circle-check" size="sm" />
}
