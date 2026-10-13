"use client"

/**
 * Student View (prototype page, parity card P-11) = S-12 Course skills (contract S-12-student-course-skills.md).
 * Layout is Sankalp's: a "Viewing as student / Clinical course" card, an "Awaiting preceptor evaluation" strip, the
 * "Show only skills I have sent for review" row, a "Mapped to this course" card with one row per skill, a collapsible
 * "Other skills" card and a sticky selection bar. Send for review and the history open as 1024px DIALOGS (C-4).
 * Behaviour is unchanged: mapping is expectation, not eligibility (CM-05); evidence from any course counts (CM-07);
 * unconfigured and inactive skills are never shown (IM-09, SL-11); status text comes from the ONE display flag (OD-03).
 * OD-14 (drafts) is not built.
 */
import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { PageHeader } from "@exxatdesignux/ui/components/ui/page-header"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { ProgressCell } from "@exxatdesignux/ui/components/data-views/table-cells"
import type { Id } from "@/lib/domain/types"
import { buttons, studentLocal as local, surface } from "@/lib/copy"
import { modelNames, offeringTitle, r5 } from "@/lib/copy/r5-student-preceptor"
import { courseSkills, roleLabel, studentCourses, type CourseSkillRow } from "@/lib/store"
import { useActions } from "@/lib/store/react"
import { EmptyState, SkillStatusBadge } from "@/components/skills"
import { isConfigured } from "@/lib/engine"
import { useActingStudent, useMounted } from "./helpers"
import { SkillProgressBlock } from "./skill-progress"
import { SendDialog, type SentInfo } from "./send-dialog"
import { HistoryDialog } from "./history-dialog"

function SkillRow({ row, offeringId, studentId, db, selected, onToggle, showRequirement, onHistory }: { row: CourseSkillRow; offeringId: Id; studentId: Id; db: ReturnType<typeof useActingStudent>["db"]; selected: boolean; onToggle: () => void; showRequirement: boolean; onHistory: () => void }) {
  const name = row.skill.name
  const headId = `row-${row.skill.id}`
  const t = row.progress.total
  const achieved = row.progress.evaluation.state === "achieved"
  const needed = t.needed ?? Math.max(t.have, 1)
  const noun = t.noun === "demonstrations" ? "demonstrations" : "qualifying evaluations"
  void offeringId
  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex items-start gap-1 px-2 py-3 sm:px-4">
        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
          <Checkbox checked={selected} onCheckedChange={onToggle} aria-label={`Select ${name}`} aria-describedby={headId} />
        </label>
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id={headId} className="text-sm font-medium text-foreground">
                {name}
              </h3>
              {showRequirement && row.requirement ? <Badge variant={row.requirement === "mandatory" ? "outline" : "secondary"}>{row.requirement === "mandatory" ? r5.pill.mandatory : r5.pill.nonMandatory}</Badge> : null}
              {!showRequirement ? <Badge variant="secondary">{r5.pill.unmapped}</Badge> : null}
              <SkillStatusBadge state={row.progress.evaluation.state} />
              {row.waitingCount > 0 ? <Badge variant="outline">{r5.pill.openCount(row.waitingCount)}</Badge> : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="w-36 shrink-0 overflow-hidden" aria-hidden="true">
                <ProgressCell value={Math.min(t.have, needed)} max={needed} tone={achieved ? "success" : "warning"} label={false} />
              </div>
              <span className="text-foreground">{`${t.have} / ${t.needed ?? t.have} ${noun}`}</span>
              {isConfigured(row.skill) ? <span>{`· ${modelNames[row.skill.model.kind]}`}</span> : null}
            </div>
            {row.achievedCanRequestAgain ? <p className="text-xs text-muted-foreground">{r5.achievedNote}</p> : null}
            <SkillProgressBlock db={db} studentId={studentId} progress={row.progress} hideTotal />
          </div>
          {row.sentCount > 0 ? (
            <Button type="button" variant="ghost" size="sm" className="min-h-11 self-start" onClick={onHistory}>
              <i className="fa-light fa-clock-rotate-left" aria-hidden="true" />
              {r5.viewHistory(row.sentCount)}
            </Button>
          ) : null}
        </div>
      </div>
    </li>
  )
}

type StudentCourse = ReturnType<typeof studentCourses>[number]

/** Newest academic year first, so the default course is the current one. */
function newestFirst(courses: StudentCourse[]): StudentCourse[] {
  return [...courses].sort((a, b) => (a.offering.academicYear < b.offering.academicYear ? 1 : a.offering.academicYear > b.offering.academicYear ? -1 : 0))
}

/** [PROTO] "NURS 350 \u2014 Clinical Practicum". When the same course appears in two terms the term is added so the options differ [INFER]. */
export function courseOptionLabel(c: StudentCourse, all: StudentCourse[]): string {
  const base = offeringTitle(c.offering.code, c.offering.name)
  const dup = all.some((x) => x.offering.id !== c.offering.id && x.offering.code === c.offering.code && x.offering.name === c.offering.name)
  return dup ? `${base} (${c.label.split(", ").pop()})` : base
}

/** The page: picks the course from ?course=, falling back to the student's current (newest) course. */
export function StudentView({ initialSendOpen = false }: { initialSendOpen?: boolean }) {
  const params = useSearchParams()
  const { db, studentId } = useActingStudent()
  const mounted = useMounted()
  const courses = newestFirst(studentCourses(db, studentId))
  const wanted = params?.get("course") ?? ""
  const sendFromUrl = initialSendOpen || params?.get("send") === "1"
  const offeringId = courses.find((c) => c.offering.id === wanted)?.offering.id ?? courses[0]?.offering.id ?? ""
  if (!mounted) return <CourseSkillsView offeringId={offeringId} initialSendOpen={sendFromUrl} />
  if (!offeringId) {
    return (
      <div className="flex flex-col gap-4 pb-6">
        <div className="px-6 pt-5"><PageHeader title={r5.page.title} subtitle={r5.page.subtitle} className="px-0 pt-0 pb-0 lg:px-0 lg:pt-0 lg:pb-0" /></div>
        <div className="px-6">
          <EmptyState icon="fa-list-check" title="No courses with skills" />
        </div>
      </div>
    )
  }
  return <CourseSkillsView key={`${studentId}:${offeringId}`} offeringId={offeringId} initialSendOpen={sendFromUrl} />
}

export function CourseSkillsView({ offeringId, initialSendOpen = false }: { offeringId: Id; initialSendOpen?: boolean }) {
  const router = useRouter()
  const pathname = usePathname() ?? "/student"
  const params = useSearchParams()
  const { setPrefs } = useActions()
  const { db, studentId, student } = useActingStudent()
  const mounted = useMounted()
  const [onlySent, setOnlySent] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [otherOpen, setOtherOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Set<Id>>(() => new Set((params?.get("skills") ?? "").split(",").filter(Boolean)))
  const [sendOpen, setSendOpen] = React.useState(initialSendOpen)
  const [history, setHistory] = React.useState<Id | null>(params?.get("history") ?? null)
  const [session, setSession] = React.useState(0)
  const [sent, setSent] = React.useState<SentInfo | null>(null)
  const bannerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (sent) bannerRef.current?.focus()
  }, [sent])

  const data = courseSkills(db, studentId, offeringId, { onlySent })
  const courses = newestFirst(studentCourses(db, studentId))
  const current = courses.find((c) => c.offering.id === offeringId)
  const cohort = student ? (db.cohorts.find((c) => c.id === student.cohortId)?.name ?? "") : ""
  const group = student ? (db.groups.find((g) => g.id === student.groupId)?.name ?? "") : ""

  const toggle = (id: Id) =>
    setSelected((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const header = <div className="px-6 pt-5"><PageHeader title={r5.page.title} subtitle={r5.page.subtitle} className="px-0 pt-0 pb-0 lg:px-0 lg:pt-0 lg:pb-0" /></div>

  if (!mounted) {
    return (
      <div aria-busy="true" aria-label={local.loading} className="flex flex-col gap-3 pb-6">
        {header}
        <div className="flex flex-col gap-3 px-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="flex flex-col gap-3 pb-6">
        {header}
        <div className="px-6">
          <LocalBanner variant="error" retry={{ label: buttons.retry, onClick: () => router.refresh() }}>
            {surface.s12.error}
          </LocalBanner>
        </div>
      </div>
    )
  }

  const q = search.trim().toLowerCase()
  const otherRows = q ? data.other.filter((r) => r.skill.name.toLowerCase().includes(q)) : data.other
  const otherSent = data.other.filter((r) => r.sentCount > 0).length
  const filteredToZero = onlySent && data.mapped.length === 0 && data.other.length === 0
  const selectedIds = [...selected]
  const courseLabel = current ? courseOptionLabel(current, courses) : offeringTitle(data.offering.code, data.offering.name)
  const studentLabel = (id: Id) => db.students.find((s) => s.id === id)?.name ?? id
  const unmapped = data.other.length

  return (
    <div className="flex flex-col gap-4 pb-28">
      {header}
      <div className="flex flex-col gap-4 px-6">

      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex min-w-0 flex-col gap-1.5 sm:w-56">
            <Label htmlFor="student-select" className="text-xs font-medium text-muted-foreground">
              {r5.viewing.student}
            </Label>
            <Select value={studentId} onValueChange={(id) => setPrefs({ currentStudentId: id })}>
              <SelectTrigger id="student-select" className="min-h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {db.students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {studentLabel(s.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5 sm:w-72">
            <Label htmlFor="course-select" className="text-xs font-medium text-muted-foreground">
              {r5.viewing.course}
            </Label>
            <Select value={offeringId} onValueChange={(v) => router.replace(`${pathname}?course=${v}`)}>
              <SelectTrigger id="course-select" className="min-h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.offering.id} value={c.offering.id}>
                    {courseOptionLabel(c, courses)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-0.5 pb-1 text-xs text-muted-foreground">
            <p>{r5.viewing.cohort(cohort, group)}</p>
            <p>{current && current.placements.length > 0 ? r5.viewing.placed(current.placements.map((p) => p.locationName)) : r5.viewing.noPlacement}</p>
          </div>
        </CardContent>
      </Card>

      {sent ? (
        <div ref={bannerRef} tabIndex={-1} role="status" className="outline-none">
          <LocalBanner variant="success" dismissible onDismiss={() => setSent(null)}>
            {sent.message}
          </LocalBanner>
        </div>
      ) : null}

      {data.waiting.length > 0 ? (
        <Card role="region" aria-labelledby="waiting-h">
          <CardHeader>
            <CardTitle asChild className="text-sm">
              <h2 id="waiting-h">{r5.awaiting.title}</h2>
            </CardTitle>
            <CardDescription>{r5.awaiting.count(data.waiting.length)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {data.waiting.map((w) => (
                <li key={w.submissionId}>
                  <Badge variant="outline">{r5.awaiting.chip(w.skillName, w.evaluatorName, roleLabel(db, w.roleId))}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="only-sent" className="flex min-h-11 cursor-pointer items-center gap-2 pe-3 text-sm font-normal">
            <Checkbox id="only-sent" checked={onlySent} onCheckedChange={(c) => setOnlySent(c === true)} />
            {r5.onlySent}
          </Label>
          <p className="text-xs text-muted-foreground">{r5.sentOf(data.sentCount, data.totalUsable, unmapped)}</p>
        </CardContent>
      </Card>

      {filteredToZero ? (
        <div className="flex flex-col items-start gap-2" role="status">
          <p className="text-sm text-foreground">{local.noMatch}</p>
          <Button type="button" variant="link" size="sm" className="min-h-11 px-0" onClick={() => setOnlySent(false)}>
            {buttons.clear}
          </Button>
        </div>
      ) : (
        <Card role="region" aria-labelledby="expected-h">
          <CardHeader>
            <CardTitle asChild className="text-sm">
              <h2 id="expected-h">{r5.mapped.title}</h2>
            </CardTitle>
            <CardDescription>{r5.mapped.body(courseLabel)}</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {data.mapped.length === 0 && !onlySent ? (
              <div className="px-4">
                <EmptyState icon="fa-list-check" title={surface.s12.empty} headingLevel={3} />
              </div>
            ) : (
              <ul className="border-t border-border">
                {data.mapped.map((r) => (
                  <SkillRow key={r.skill.id} row={r} offeringId={offeringId} studentId={studentId} db={db} selected={selected.has(r.skill.id)} onToggle={() => toggle(r.skill.id)} showRequirement onHistory={() => setHistory(r.skill.id)} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Collapsible open={otherOpen || q.length > 0} onOpenChange={setOtherOpen}>
        <Card role="region" aria-labelledby="other-h">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="default"
              className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal rounded-xl px-4 py-2 text-left"
              aria-expanded={otherOpen || q.length > 0}
            >
              <span className="flex flex-col gap-0.5">
                <span id="other-h" className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {r5.other.title}
                  {otherSent > 0 ? <Badge variant="outline">{r5.other.sent(otherSent)}</Badge> : null}
                </span>
                <span className="text-xs font-normal text-muted-foreground">{r5.other.body}</span>
              </span>
              <i className={`fa-light ${otherOpen || q.length > 0 ? "fa-chevron-up" : "fa-chevron-down"} text-muted-foreground`} aria-hidden="true" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-2 px-4 pb-3">
            <Label htmlFor="other-search" className="text-sm font-medium">
              {local.searchOther}
            </Label>
            <Input id="other-search" type="search" className="min-h-11" value={search} onChange={(e) => setSearch(e.target.value)} />
            {otherRows.length === 0 ? (
              <p className="text-sm text-muted-foreground" role="status">
                {local.noMatch}
              </p>
            ) : (
              <ul className="-mx-2">
                {otherRows.map((r) => (
                  <SkillRow key={r.skill.id} row={r} offeringId={offeringId} studentId={studentId} db={db} selected={selected.has(r.skill.id)} onToggle={() => toggle(r.skill.id)} showRequirement={false} onHistory={() => setHistory(r.skill.id)} />
                ))}
              </ul>
            )}
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {selectedIds.length > 0 ? (
        <div role="region" aria-label="Selection actions" className="sticky bottom-3 z-30">
          <Card>
            <CardContent className="flex items-center justify-between gap-3">
              <p aria-live="polite" className="text-sm font-medium text-foreground">
                {r5.bar.selected(selectedIds.length)}
              </p>
              <div className="flex items-center gap-2">
                <Button size="default" type="button" variant="outline" className="min-h-11" onClick={() => setSelected(new Set())}>
                  {r5.bar.clear}
                </Button>
                {/* P-08: the bar's button is the only filled primary until the dialog opens, then it becomes outline. */}
                <Button
                  size="default"
                  type="button"
                  variant={sendOpen ? "outline" : "default"}
                  className="min-h-11"
                  onClick={() => {
                    setSession((n) => n + 1)
                    setSendOpen(true)
                  }}
                >
                  <i className="fa-light fa-paper-plane" aria-hidden="true" />
                  {r5.bar.send}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {sendOpen && selectedIds.length > 0 ? (
        <SendDialog
          key={session}
          open
          onOpenChange={setSendOpen}
          offeringId={offeringId}
          skillIds={selectedIds}
          onSent={(info) => {
            setSent(info)
            setSelected(new Set())
          }}
        />
      ) : null}

      {history ? (
        <HistoryDialog
          key={history}
          skillId={history}
          offeringId={offeringId}
          onClose={() => setHistory(null)}
          onSent={(info) => setSent(info)}
        />
      ) : null}
      </div>
    </div>
  )
}
