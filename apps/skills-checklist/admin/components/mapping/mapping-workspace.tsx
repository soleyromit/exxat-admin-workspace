"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { ButtonSegmentedControl } from "@exxatdesignux/ui/components/ui/button-segmented-control"
import { Card } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox, CheckboxLabel } from "@exxatdesignux/ui/components/ui/checkbox"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { Input } from "@exxatdesignux/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { EmptyState, RequirementPill } from "@/components/skills"
import { criteriaParts, listOfferings, mapSkill, norm, offeringMapping, setRequirement, skillHasEvidence, unmapSkill, type MappingRow, type OfferingFilters, type OfferingRow } from "@/lib/store"
import { useActions, useDb } from "@/lib/store/react"
import type { Db, Id, Requirement, Term } from "@/lib/domain/types"
import { ROUTES } from "@/lib/skills-routes"
import { alsoMappedList, modelBadge, offeringMeta, offeringTitle, protoCriteria, protoMapping as pm, termYear } from "@/lib/copy"
import { surface } from "@/lib/copy"
import { PageBody } from "./page-body"

const ALL = "all"
const TERMS: Term[] = ["Fall", "Spring", "Summer"]

interface Filters {
  q: string
  cohort: string
  term: string
  year: string
  prof: string
  skill: string
}

/** The prototype opens with the current academic year selected (parity P-09 shot 100). "all" in the URL means All years. */
function latestYear(db: Db): string {
  return [...new Set(db.offerings.map((o) => o.academicYear))].sort().pop() ?? ALL
}

function readFilters(sp: URLSearchParams, defaultYear: string): Filters {
  return { q: sp.get("q") ?? "", cohort: sp.get("cohort") ?? ALL, term: sp.get("term") ?? ALL, year: sp.get("year") ?? defaultYear, prof: sp.get("prof") ?? ALL, skill: sp.get("skill") ?? "" }
}

function toQuery(f: Filters, defaultYear: string): string {
  const p = new URLSearchParams()
  if (f.q) p.set("q", f.q)
  if (f.cohort !== ALL) p.set("cohort", f.cohort)
  if (f.term !== ALL) p.set("term", f.term)
  if (f.year !== defaultYear) p.set("year", f.year)
  if (f.prof !== ALL) p.set("prof", f.prof)
  if (f.skill) p.set("skill", f.skill)
  const s = p.toString()
  return s ? `?${s}` : ""
}

function SearchField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <i className="fa-light fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground" aria-hidden="true" />
      <Input aria-label={label} placeholder={label} value={value} onChange={(e) => onChange(e.target.value)} className="pl-8" />
    </div>
  )
}

/**
 * S-10 / P-09: the prototype's two-column card. Left: "Clinical course offerings" with the four filters and a search;
 * right: "Skills mapped" for the selected offering (first offering selected by default). Mapping expresses EXPECTATION,
 * never eligibility (CM-05). Ticking a skill maps it as Mandatory (prototype default, conflict C-3); the segmented
 * control flips it. Filters and the S-04 entry mode (`?skill=`) live in the URL, the selected offering in the path.
 * OD-01 is OPEN: there is no carry-forward control and no copy about carrying mappings between terms.
 */
export function MappingWorkspace({ offeringId }: { offeringId?: string }) {
  const db = useDb()
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => setReady(true), [])

  const defaultYear = latestYear(db)
  const filters = readFilters(new URLSearchParams(sp.toString()), defaultYear)
  const skillMode = filters.skill && db.skills.some((s) => s.id === filters.skill) ? db.skills.find((s) => s.id === filters.skill)! : null
  const [searchText, setSearchText] = React.useState(filters.q)

  const go = (id: string | undefined, next: Filters) => router.push(`${id ? ROUTES.courseMappingOffering(id) : ROUTES.courseMapping}${toQuery(next, defaultYear)}`)
  const setFilter = (patch: Partial<Filters>) => {
    const next = { ...filters, ...patch }
    router.replace(`${pathname}${toQuery(next, defaultYear)}`)
  }

  const query: OfferingFilters = {
    q: filters.q || undefined,
    cohortId: filters.cohort === ALL ? undefined : filters.cohort,
    term: filters.term === ALL ? undefined : (filters.term as Term),
    academicYear: filters.year === ALL ? undefined : filters.year,
    professionalYear: filters.prof === ALL ? undefined : (Number(filters.prof) as 1 | 2 | 3),
    skillId: skillMode?.id,
  }
  const offerings = listOfferings(db, query)
  const total = db.offerings.length
  const academicYears = [...new Set(db.offerings.map((o) => o.academicYear))].sort()

  // Clear resets every filter, including the year, to "All" (so the count reads "42 of 42"-style, the whole set).
  const clear = () => {
    setSearchText("")
    router.replace(`${pathname}?year=${ALL}`)
  }

  if (!ready) {
    return (
      <PageBody title={pm.title} subtitle={pm.subtitle}>
        <div aria-busy="true" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageBody>
    )
  }

  // First offering selected by default (prototype shot 100).
  const activeId = offeringId ?? offerings[0]?.offering.id
  const selected = activeId ? db.offerings.find((o) => o.id === activeId) : undefined

  return (
    <PageBody title={pm.title} subtitle={pm.subtitle}>
      {/* CM-05: the rule note is mandatory on the page (prototype info bar, two bold terms). */}
      <LocalBanner variant="info">
        {pm.banner.before}
        <strong>{pm.banner.mandatory}</strong>
        {pm.banner.middle}
        <strong>{pm.banner.nonMandatory}</strong>
        {pm.banner.after}
      </LocalBanner>

      <div className="grid gap-4 lg:h-[calc(100dvh-16rem)] lg:min-h-[32rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card className="min-h-0 gap-0 overflow-hidden py-0">
          <section aria-label={pm.offeringsHeading} className="flex h-full min-h-0 min-w-0 flex-col">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-4 py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <h2 className="text-sm font-semibold text-foreground">{skillMode ? pm.skillMode(skillMode.name, offerings.length) : pm.offeringsHeading}</h2>
                <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
                  {pm.offeringsMatch(offerings.length, total)}
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={clear}>
                {pm.clear}
              </Button>
            </div>

            <div className="flex shrink-0 flex-col gap-2 border-b border-border px-4 py-3">
              <SearchField
                label={pm.searchOfferings}
                value={searchText}
                onChange={(v) => {
                  setSearchText(v)
                  setFilter({ q: v })
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <FilterSelect label={pm.filterLabels.cohort} all={pm.all.cohort} value={filters.cohort} onChange={(v) => setFilter({ cohort: v })} options={db.cohorts.map((c) => ({ value: c.id, label: c.name }))} />
                <FilterSelect label={pm.filterLabels.year} all={pm.all.year} value={filters.year} onChange={(v) => setFilter({ year: v })} options={academicYears.map((y) => ({ value: y, label: y }))} />
                <FilterSelect label={pm.filterLabels.term} all={pm.all.term} value={filters.term} onChange={(v) => setFilter({ term: v })} options={TERMS.map((t) => ({ value: t, label: t }))} />
                <FilterSelect label={pm.filterLabels.prof} all={pm.all.prof} value={filters.prof} onChange={(v) => setFilter({ prof: v })} options={[1, 2, 3].map((y) => ({ value: String(y), label: `Year ${y}` }))} />
              </div>
            </div>

            <OfferingList db={db} rows={offerings} selectedId={activeId} skillId={skillMode?.id} onSelect={(id) => go(id, filters)} onClear={clear} />
          </section>
        </Card>

        <section aria-label="Skills mapped to the selected offering" className="min-h-0 min-w-0">
          {!activeId ? (
            <EmptyState icon="fa-list-check" title={pm.chooseOffering} description={pm.chooseOfferingBody} />
          ) : !selected ? (
            <EmptyState icon="fa-triangle-exclamation" title={pm.offeringNotFound} description={pm.chooseOfferingBody} />
          ) : (
            <MappingPanel key={selected.id} db={db} offeringId={selected.id} />
          )}
        </section>
      </div>
    </PageBody>
  )
}

function FilterSelect({ label, all, value, onChange, options }: { label: string; all: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  const id = `map-filter-${label.toLowerCase().replace(/\s+/g, "-")}`
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <FieldLabel htmlFor={id} className="text-xs font-semibold text-muted-foreground">
        {label}
      </FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} aria-label={label} size="sm" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{all}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function OfferingList({ db, rows, selectedId, skillId, onSelect, onClear }: { db: Db; rows: OfferingRow[]; selectedId?: string; skillId?: Id; onSelect: (id: string) => void; onClear: () => void }) {
  const ref = React.useRef<HTMLUListElement>(null)

  if (rows.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          icon="fa-filter"
          title={pm.noMatch}
          footer={
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              {pm.clear}
            </Button>
          }
        />
      </div>
    )
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    const buttons = Array.from(ref.current?.querySelectorAll<HTMLButtonElement>("button[data-offering]") ?? [])
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (i < 0) return
    e.preventDefault()
    buttons[Math.min(buttons.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)))]?.focus()
  }

  return (
    <ul ref={ref} onKeyDown={onKeyDown} aria-label={pm.offeringsHeading} className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto">
      {rows.map((r) => {
        const o = r.offering
        const here = skillId ? db.offeringSkillMaps.find((m) => m.offeringId === o.id && m.skillId === skillId) : undefined
        const selected = selectedId === o.id
        return (
          <li key={o.id}>
            <Button
              type="button"
              variant={selected ? "secondary" : "ghost"}
              size="default"
              data-offering={o.id}
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelect(o.id)}
              className="h-auto w-full justify-between gap-3 rounded-none px-4 py-3 text-left"
            >
              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 whitespace-normal">
                <span className="text-sm font-medium text-foreground">{offeringTitle(o)}</span>
                <span className="text-xs font-normal text-muted-foreground">{offeringMeta(o, r.cohortNames)}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {here ? <RequirementPill requirement={here.requirement} /> : null}
                <Badge variant="outline">
                  {r.mandatory} / {r.mapped}
                </Badge>
                <span className="sr-only">, {r.mandatory} mandatory of {r.mapped}</span>
              </span>
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

function MappingPanel({ db, offeringId }: { db: Db; offeringId: Id }) {
  const { run } = useActions()
  const offering = db.offerings.find((o) => o.id === offeringId)!
  const { rows, unconfiguredHidden } = offeringMapping(db, offeringId)
  const [query, setQuery] = React.useState("")
  const [saved, setSaved] = React.useState<Id | null>(null)
  const [errors, setErrors] = React.useState<Record<Id, string>>({})
  const [kept, setKept] = React.useState<Set<Id>>(new Set())

  React.useEffect(() => {
    if (!saved) return
    const t = window.setTimeout(() => setSaved(null), 3000)
    return () => window.clearTimeout(t)
  }, [saved])

  const mapped = db.offeringSkillMaps.filter((m) => m.offeringId === offeringId)
  const mandatory = mapped.filter((m) => m.requirement === "mandatory").length

  const commit = (skillId: Id, action: (d: Db) => ReturnType<typeof mapSkill> | ReturnType<typeof setRequirement> | ReturnType<typeof unmapSkill>) => {
    const r = run((d) => action(d) as never)
    if (r.ok) {
      setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== skillId)))
      setSaved(skillId)
    } else {
      setErrors((e) => ({ ...e, [skillId]: pm.notSaved }))
    }
    return r.ok
  }

  // Ticking maps the skill at once as Mandatory (prototype default, C-3); unticking unmaps it and keeps the evidence (CM-05, CM-07).
  const onToggle = (row: MappingRow, checked: boolean) => {
    const id = row.skill.id
    if (checked) {
      if (!row.requirement) commit(id, (d) => mapSkill(d, { offeringId, skillId: id }))
      return
    }
    if (row.requirement && commit(id, (d) => unmapSkill(d, { offeringId, skillId: id })) && skillHasEvidence(db, id)) setKept((k) => new Set(k).add(id))
  }

  const onRequirement = (row: MappingRow, requirement: Requirement) => {
    if (row.requirement && row.requirement !== requirement) commit(row.skill.id, (d) => setRequirement(d, { offeringId, skillId: row.skill.id, requirement }))
  }

  const needle = norm(query)
  const visible = rows.filter((r) => !needle || norm(r.skill.name).includes(needle))

  return (
    <Card className="h-full min-h-0 gap-0 overflow-hidden py-0">
      <header className="flex shrink-0 flex-col gap-0.5 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{pm.panelTitle(offering.code)}</h2>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {pm.panelSubline(offering.name, offering.term, termYear(offering), offering.professionalYear, mandatory, mapped.length - mandatory)}
        </p>
        {offering.cohortIds.length === 0 ? <p className="text-xs text-muted-foreground">{pm.emptyNoCohort}</p> : null}
      </header>
      <span role="status" aria-live="polite" className="sr-only">
        {saved ? pm.saved : ""}
      </span>

      {unconfiguredHidden > 0 && rows.length > 0 ? (
        <div className="shrink-0 border-b border-border px-4 py-3">
          <LocalBanner variant="info" action={{ label: pm.configureInLibrary, href: `${ROUTES.skills}?status=unconfigured` }}>
            {surface.s04.unconfiguredBanner(unconfiguredHidden)}
          </LocalBanner>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon="fa-list-check"
            title={pm.emptyNoSkills}
            description={unconfiguredHidden > 0 ? surface.s04.unconfiguredBanner(unconfiguredHidden) : undefined}
            footer={
              <Button asChild variant="outline" size="sm">
                <Link href={ROUTES.skills}>{pm.configureInLibrary}</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="shrink-0 border-b border-border px-4 py-3">
            <SearchField label={pm.searchSkills} value={query} onChange={setQuery} />
          </div>
          {visible.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">{pm.noSkillMatch}</p> : null}
          <ul className="flex min-h-0 flex-1 flex-col divide-y divide-border overflow-y-auto">
            {visible.map((row) => {
              const id = row.skill.id
              const isMapped = Boolean(row.requirement)
              const also = alsoMappedList(db, row.alsoMappedIn)
              return (
                <li key={id} className={`flex items-start gap-3 px-4 py-3 ${isMapped ? "bg-muted/40" : ""}`}>
                  <Checkbox id={`map-${id}`} checked={isMapped} onCheckedChange={(c) => onToggle(row, c === true)} aria-label={pm.mapSkill(row.skill.name)} className="mt-0.5" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <CheckboxLabel htmlFor={`map-${id}`} className="text-sm font-medium text-foreground">
                        {row.skill.name}
                      </CheckboxLabel>
                      <Badge variant="secondary">{modelBadge(row.skill)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{protoCriteria(criteriaParts(db, row.skill))}</p>
                    {isMapped ? (
                      <ButtonSegmentedControl
                        aria-label={pm.segmentLabel(row.skill.name)}
                        value={row.requirement as Requirement}
                        onValueChange={(v) => onRequirement(row, v)}
                        options={[
                          { value: "mandatory", label: pm.mandatory },
                          { value: "nonMandatory", label: pm.nonMandatory },
                        ]}
                      />
                    ) : null}
                    {errors[id] ? <FieldError id={`map-err-${id}`}>{errors[id]}</FieldError> : null}
                    {kept.has(id) && !isMapped ? <p className="text-xs text-muted-foreground">{pm.evidenceKept}</p> : null}
                    {also.list ? <p className="text-xs text-muted-foreground">{pm.alsoMapped(also.list, also.more)}</p> : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Card>
  )
}
