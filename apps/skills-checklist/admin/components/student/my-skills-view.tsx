"use client"

/**
 * S-15 My skills (contract S-15-student-my-skills.md). One record per skill across every course (SH-06, CM-07, AE-05).
 * [INFER] The requirements ask only for narrowing one skill's record to a course (SH-06); a cross-course overview page is
 * derived from SH-06 and CM-07. It is read-only and isolated in this file plus two routes so it can be removed whole.
 * Summary labels come from the ONE display flag (OD-03 open): the engine's four states are stored and counted; the flag
 * only chooses whether "No evidence yet" and "Evidence does not qualify" are shown separately or merged as "Not met".
 */
import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import type { Id } from "@/lib/domain/types"
import type { SkillState } from "@/lib/engine"
import { buttons, statusLabel, surface } from "@/lib/copy"
import { mySkills, offeringLabel, studentCourses, type MySkillRow } from "@/lib/store"
import { EmptyState, PageFrame, SkillStatusBadge } from "@/components/skills"
import { usePrefs } from "@/lib/store/react"
import { STUDENT_ROUTES } from "@/lib/skills-routes"
import { studentLocal as local } from "@/lib/copy"
import { useActingStudent, useMounted } from "./helpers"
import { SkillProgressBlock } from "./skill-progress"

const s15 = surface.s15
const ALL = "all"
const STATES: SkillState[] = ["noEvidence", "evidenceDoesNotQualify", "partial", "achieved"]

export function MySkillsView() {
  const { db, studentId } = useActingStudent()
  const { skillStatusDisplay } = usePrefs()
  const mounted = useMounted()
  const [course, setCourse] = React.useState<string>(ALL)
  const [category, setCategory] = React.useState<string>(ALL)
  const [status, setStatus] = React.useState<string>(ALL)
  const [search, setSearch] = React.useState("")

  const courses = React.useMemo(() => studentCourses(db, studentId), [db, studentId])
  const myOfferingIds = React.useMemo(() => new Set(courses.map((c) => c.offering.id)), [courses])

  const model = React.useMemo(() => {
    const rows = mySkills(db, studentId)
    const mappedIds = new Set(db.offeringSkillMaps.filter((m) => myOfferingIds.has(m.offeringId)).map((m) => m.skillId))
    // Show: a skill with evidence (even if unmapped, CM-05) or one mapped to a course of the student ("No evidence yet").
    const visible = rows.filter((r) => r.attempts > 0 || mappedIds.has(r.skill.id))
    const main = visible.filter((r) => !r.inactiveWithEvidence)
    const inactive = visible.filter((r) => r.inactiveWithEvidence)
    const evidenceCourses = (skillId: Id) => Array.from(new Set(db.submissions.filter((s) => s.studentId === studentId && s.skillId === skillId).map((s) => s.offeringId)))
    return { main, inactive, mappedIds, evidenceCourses }
  }, [db, studentId, myOfferingIds])

  if (!mounted) {
    return (
      <div aria-busy="true" aria-label={local.loading} className="flex flex-col gap-3 px-4 py-6 sm:px-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  const stateOf = (r: MySkillRow): SkillState => r.progress?.evaluation.state ?? "noEvidence"
  const counts: Record<SkillState, number> = { noEvidence: 0, evidenceDoesNotQualify: 0, partial: 0, achieved: 0 }
  for (const r of model.main) counts[stateOf(r)] += 1 // the RECORD's counts: filters never change them
  const total = model.main.length

  const q = search.trim().toLowerCase()
  const filtered = model.main.filter((r) => {
    if (q && !r.skill.name.toLowerCase().includes(q)) return false
    if (category !== ALL && r.skill.categoryId !== category) return false
    if (status !== ALL && stateOf(r) !== status) return false
    if (course !== ALL) {
      const hasEvidence = model.evidenceCourses(r.skill.id).includes(course)
      const mapped = db.offeringSkillMaps.some((m) => m.offeringId === course && m.skillId === r.skill.id)
      if (!hasEvidence && !mapped) return false
    }
    return true
  })
  const anyFilter = q !== "" || category !== ALL || status !== ALL || course !== ALL
  const clear = () => {
    setCourse(ALL)
    setCategory(ALL)
    setStatus(ALL)
    setSearch("")
  }
  const summary =
    skillStatusDisplay === "four"
      ? local.summaryA(counts.achieved, total, counts.partial, counts.evidenceDoesNotQualify, counts.noEvidence)
      : local.summaryB(counts.achieved, total, counts.partial, counts.noEvidence + counts.evidenceDoesNotQualify)
  const categories = db.categories.filter((c) => model.main.some((r) => r.skill.categoryId === c.id))
  const noMappings = model.main.length > 0 && model.mappedIds.size === 0
  const mandatoryIn = (skillId: Id) => courses.filter((c) => db.offeringSkillMaps.some((m) => m.offeringId === c.offering.id && m.skillId === skillId && m.requirement === "mandatory")).length

  return (
    <PageFrame title={s15.title} subtitle={s15.subtitle}>

      {model.main.length === 0 && model.inactive.length === 0 ? (
        <EmptyState icon="fa-list-check" title={s15.empty} />
      ) : (
        <>
          <p aria-live="polite" className="text-sm font-medium text-foreground">
            {summary}
          </p>
          {noMappings ? <p className="text-sm text-muted-foreground">{local.noMappings}</p> : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5 sm:col-span-4 sm:max-w-sm">
              <Label htmlFor="my-search">Search skills</Label>
              <Input id="my-search" type="search" className="min-h-11" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="my-course">Course</Label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger id="my-course" className="min-h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{s15.allCourses}</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.offering.id} value={c.offering.id}>
                      {offeringLabel(c.offering)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="my-category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="my-category" className="min-h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="my-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="my-status" className="min-h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {STATES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {statusLabel(st, skillStatusDisplay)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-start gap-2" role="status">
              <p className="text-sm text-foreground">{local.noMatchFilters}</p>
              {anyFilter ? (
                <Button type="button" variant="link" size="sm" className="min-h-11 px-0" onClick={clear}>
                  {buttons.clear}
                </Button>
              ) : null}
            </div>
          ) : (
            <ul>
              {filtered.map((r) => {
                const ev = model.evidenceCourses(r.skill.id)
                const mand = mandatoryIn(r.skill.id)
                return (
                  <li key={r.skill.id} className="flex flex-col gap-2 border-b border-border py-3 last:border-b-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-medium text-foreground">{r.skill.name}</h2>
                      <SkillStatusBadge state={stateOf(r)} />
                    </div>
                    {r.progress ? <SkillProgressBlock db={db} studentId={studentId} progress={r.progress} /> : null}
                    {ev.length > 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {local.coursesWithEvidence}: {ev.map((id) => db.offerings.find((o) => o.id === id)).filter(Boolean).map((o) => `${o!.code} ${o!.term} ${o!.academicYear.slice(0, 4)}`).join(", ")}
                      </p>
                    ) : null}
                    {mand > 0 ? <p className="text-sm text-muted-foreground">{local.mandatoryIn(mand, courses.length)}</p> : null}
                    <div className="flex flex-wrap gap-x-4">
                      {r.attempts > 0 ? (
                        <Button asChild variant="link" size="sm" className="min-h-11 px-0">
                          <Link href={STUDENT_ROUTES.mySkill(r.skill.id)}>{buttons.viewHistory(r.attempts)}</Link>
                        </Button>
                      ) : null}
                      {firstCourseFor(db, myOfferingIds, r, course) ? (
                        <Button asChild variant="link" size="sm" className="min-h-11 px-0">
                          <Link href={`${STUDENT_ROUTES.courseSkills(firstCourseFor(db, myOfferingIds, r, course)!)}&skills=${r.skill.id}`}>{local.sendThisSkill}</Link>
                        </Button>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {model.inactive.length > 0 ? (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button size="default" type="button" variant="ghost" className="min-h-11">
                  {s15.inactiveGroup} ({model.inactive.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex flex-col gap-2">
                <LocalBanner variant="info">{local.inactiveNote}</LocalBanner>
                <ul>
                  {model.inactive.map((r) => (
                    <li key={r.skill.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 last:border-b-0">
                      <span className="text-base text-foreground">{r.skill.name}</span>
                      <Button asChild variant="link" size="sm" className="min-h-11 px-0">
                        <Link href={STUDENT_ROUTES.mySkill(r.skill.id)}>{buttons.viewHistory(r.attempts)}</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </>
      )}
    </PageFrame>
  )
}

/** "Send for review" returns to S-12 for a relevant course: the filtered course, else the course the skill is mapped in. */
function firstCourseFor(db: ReturnType<typeof useActingStudent>["db"], myOfferingIds: Set<Id>, r: MySkillRow, course: string): Id | null {
  if (!r.skill.active || r.inactiveWithEvidence) return null
  if (course !== ALL && myOfferingIds.has(course)) return course
  const mapped = db.offeringSkillMaps.find((m) => m.skillId === r.skill.id && myOfferingIds.has(m.offeringId))
  if (mapped) return mapped.offeringId
  return db.submissions.find((s) => s.skillId === r.skill.id && myOfferingIds.has(s.offeringId))?.offeringId ?? null
}
