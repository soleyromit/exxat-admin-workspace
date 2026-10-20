"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { Checkbox } from "@exxatdesignux/ui/components/ui/checkbox"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { fmtDay } from "@/components/v2/outcomes/version-timeline"
import { BTN } from "@/components/v2/preceptor/evaluation-form"
import { statusLabel, STATUS_TONE } from "@/components/v2/director/verification-pages"
import { V2Grid, v2col } from "@/components/v2/v2-grid"
import { downloadBytes, fileSlug } from "@/lib/v2/download"
import { checkPdf, signPdf, type CheckResult, type SignedContent } from "@/lib/v2/pdf"
import { cohortReportContent, studentReportContent } from "@/lib/v2/report-docs"
import {
  ALL,
  appliedFilters,
  behindPace,
  categoriesOf,
  explainFilters,
  heatmap,
  NO_FILTERS,
  PACE_MARGIN,
  raterRows,
  removeFilter,
  reportSummary,
  SCALE,
  SETTING_LABEL,
  skillStats,
  SMALL_NUMBERS,
  studentSkillRows,
  TERM,
  termDaysGone,
  termShare,
  type CellState,
  type PaceRow,
  type RaterRow,
  type ReportFilters,
  type SkillStat,
  type StudentSkillRow,
} from "@/lib/v2/reports"
import { useV2Hydrated, useV2State } from "@/lib/v2/react"
import type { RoleId, Setting } from "@/lib/v2/types"
import { verificationRows, type VerificationRow } from "@/lib/v2/verification"

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** The heatmap scale, light to dark, from tokens only. Never red. Every cell also carries a symbol and words. */
const SCALE_CLASS: Record<0 | 1 | 2 | 3, string> = {
  0: "bg-background text-foreground",
  1: "bg-muted text-foreground",
  2: "bg-brand-tint text-foreground",
  3: "bg-brand text-brand-foreground",
}

const CELL_ICON: Record<CellState, string> = {
  achieved: "fa-solid fa-circle-check",
  half: "fa-light fa-circle-half-stroke",
  some: "fa-light fa-circle-dot",
  attempted: "fa-light fa-circle-minus",
  none: "fa-light fa-circle",
}

const CELL_WORD: Record<CellState, string> = { achieved: "Achieved", half: "Half or more", some: "Some", attempted: "Not met yet", none: "Not started" }

const STATE_TONE: Record<CellState, { tone: "success" | "info" | "warning" | "neutral"; icon: string }> = {
  achieved: { tone: "success", icon: "fa-circle-check" },
  half: { tone: "info", icon: "fa-circle-half-stroke" },
  some: { tone: "info", icon: "fa-circle-dot" },
  attempted: { tone: "warning", icon: "fa-circle-minus" },
  none: { tone: "neutral", icon: "fa-circle" },
}

type TabId = "heatmap" | "pace" | "skills" | "raters" | "students"

const TAB_LABEL: Record<TabId, string> = { heatmap: "Heatmap", pace: "Behind pace", skills: "Skills and raters", raters: "Rater comparison", students: "Student table" }

interface Done {
  name: string
  pages: number
  hash: string
  fileHash: string
}

export function ReportsPage({ role }: { role: RoleId }) {
  const s = useV2State()
  const hydrated = useV2Hydrated()
  const [f, setF] = React.useState<ReportFilters>(NO_FILTERS)
  const [tab, setTab] = React.useState<TabId>("heatmap")
  const [focusSkill, setFocusSkill] = React.useState<string | null>(null)
  const [studentId, setStudentId] = React.useState("")
  const [done, setDone] = React.useState<Done | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [check, setCheck] = React.useState<{ name: string; result: CheckResult } | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const hm = heatmap(s, f)
  const sum = reportSummary(s, f)
  const applied = appliedFilters(f)
  const conflict = explainFilters(f)
  const behind = behindPace(s)
  const stats = skillStats(s, f)
  const raters = raterRows(s, f)
  const cats = categoriesOf(s)
  const rowsAll = studentSkillRows(s, f)
  const rows = focusSkill ? rowsAll.filter((r) => r.skillId === focusSkill) : rowsAll
  const vrows = new Map(verificationRows(s).map((r) => [r.studentId, r]))
  const clinicalSettings = s.course.clinicalSettings
  const chosenStudent = s.people.find((p) => p.id === studentId)
  const noEvidence = sum.observations === 0

  if (!hydrated && hm.rows.length === 0) return <PageFrame title="Cohort reports"><p role="status" className="text-sm text-muted-foreground">Opening the reports</p></PageFrame>

  const set = (patch: Partial<ReportFilters>) => {
    setF((cur) => ({ ...cur, ...patch }))
    setDone(null)
  }

  const download = async (content: SignedContent | null, file: string) => {
    setError(null)
    if (!content) {
      setError("Choose a student first.")
      return
    }
    try {
      const signed = await signPdf(content)
      downloadBytes(file, "application/pdf", signed.bytes)
      setDone({ name: file, pages: signed.pages, hash: signed.hash, fileHash: signed.fileHash })
    } catch {
      setError("The PDF could not be made in this browser. Try again, or open the page in a current version of Chrome, Edge, Firefox or Safari.")
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setCheck({ name: file.name, result: await checkPdf(new Uint8Array(await file.arrayBuffer())) })
    } catch {
      setCheck({ name: file.name, result: { ok: false, reason: "unreadable", message: "This file could not be read." } })
    }
  }

  const link = (id: string, label: string) => (
    <Link href={`/v2/${role}/verification/${id}`} aria-label={`Open the record of ${label}`} className="rounded-sm font-medium text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {label}
    </Link>
  )

  const figures: Array<[string, string, string]> = [
    ["Students in the cohort", String(sum.students), "students"],
    ["Mandatory skills achieved", `${sum.mandatoryAchievedPct}%`, "achieved"],
    ["Students behind pace", String(sum.behind), "behind"],
    ["Skills with one evaluator", String(sum.singleRaterSkills), "single"],
    ["Evidence from simulation", `${sum.simulationShare}%`, "sim"],
  ]

  return (
    <PageFrame title="Cohort reports" subtitle={`${s.course.code}, ${s.course.term}, ${s.course.cohort}. Counted evidence only. Open a name to read the evidence behind a figure.`}>
      <div className="flex flex-col gap-6" data-reports={role}>
        <Card size="sm">
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-5" aria-label="Report summary">
              {figures.map(([label, value, key]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-2xl font-semibold tabular-nums text-foreground" data-figure={key}>{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <PageSection title="Filters" id="filters" description="Filters re-scope the evidence first, then every figure is recalculated from what is left.">
          <div className="flex flex-wrap items-end gap-4" role="group" aria-label="Report filters">
            <div className="flex flex-col gap-1">
              <Label htmlFor="flt-category">Category</Label>
              <Select value={f.category} onValueChange={(v) => set({ category: v })}>
                <SelectTrigger id="flt-category" className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All categories</SelectItem>
                  {cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="flt-setting">Setting</Label>
              <Select value={f.setting} onValueChange={(v) => set({ setting: v as ReportFilters["setting"] })}>
                <SelectTrigger id="flt-setting" className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All settings</SelectItem>
                  {(["clinical", "lab", "simulation"] as Setting[]).map((x) => <SelectItem key={x} value={x}>{SETTING_LABEL[x]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="flt-clinical">Clinical setting</Label>
              <Select value={f.clinicalSetting} onValueChange={(v) => set({ clinicalSetting: v })}>
                <SelectTrigger id="flt-clinical" className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All clinical settings</SelectItem>
                  {clinicalSettings.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex min-h-(--control-height-touch) items-center gap-2">
              <Checkbox id="flt-mandatory" checked={f.mandatoryOnly} onCheckedChange={(v) => set({ mandatoryOnly: v === true })} />
              <Label htmlFor="flt-mandatory" className="text-sm font-normal">Mandatory skills only</Label>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters applied" data-applied-filters>
            {applied.length === 0 ? <span className="text-sm text-muted-foreground">No filters applied. Showing every published skill the course maps.</span> : null}
            {applied.map((a) => (
              <Button key={a.key} type="button" variant="outline" size="sm" aria-label={`Remove filter ${a.label}`} data-remove-filter={a.key} onClick={() => set(removeFilter(f, a.key))}>
                {a.label}
                <i className="fa-light fa-xmark" aria-hidden="true" />
              </Button>
            ))}
            {applied.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => set(NO_FILTERS)}>Clear filters</Button>
            ) : null}
          </div>
          {conflict ? (
            <LocalBanner variant="warning" title="These filters cannot match any evidence" data-filter-conflict>
              <p>{conflict}</p>
              <Button type="button" variant="outline" size="lg" className={`${BTN} mt-2`} onClick={() => set({ clinicalSetting: ALL })}>Clear the clinical setting filter</Button>
            </LocalBanner>
          ) : noEvidence ? (
            <LocalBanner variant="info" title="No counted evidence for these filters" data-filter-empty>
              Remove a filter to see more. Every figure below reads zero because nothing counted matches.
            </LocalBanner>
          ) : null}
        </PageSection>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)}>
          <div className="flex flex-col gap-1 md:hidden">
            <Label htmlFor="report-view">Report view</Label>
            <Select value={tab} onValueChange={(v) => setTab(v as TabId)}>
              <SelectTrigger id="report-view" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TAB_LABEL) as TabId[]).map((id) => <SelectItem key={id} value={id}>{id === "pace" ? `${TAB_LABEL[id]} (${behind.length})` : TAB_LABEL[id]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <TabsList variant="line" aria-label="Report views" className="hidden rounded-md focus-visible:ring-3 focus-visible:ring-ring/50 md:inline-flex">
            <TabsTrigger value="heatmap">{TAB_LABEL.heatmap}</TabsTrigger>
            <TabsTrigger value="pace">{`${TAB_LABEL.pace} (${behind.length})`}</TabsTrigger>
            <TabsTrigger value="skills">{TAB_LABEL.skills}</TabsTrigger>
            <TabsTrigger value="raters">{TAB_LABEL.raters}</TabsTrigger>
            <TabsTrigger value="students">{TAB_LABEL.students}</TabsTrigger>
          </TabsList>

          <TabsContent value="heatmap" className="flex flex-col gap-3 rounded-md pt-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <p className="text-sm text-muted-foreground">Each cell is a student&apos;s progress against the skill&apos;s own rule. The words and symbol in the cell say the same as the shade. The Student table tab lists every cell in words.</p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Scale">
              {(["none", "attempted", "some", "half", "achieved"] as CellState[]).map((st) => (
                <li key={st} className="flex items-center gap-2">
                  <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-border ${SCALE_CLASS[SCALE[st]]}`}><i className={`${CELL_ICON[st]} text-xs`} aria-hidden="true" /></span>
                  <span className="text-foreground">{CELL_WORD[st]}</span>
                </li>
              ))}
            </ul>
            {hm.skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published skill matches these filters.</p>
            ) : (
              <Table scrollLabel="Heatmap of students by skills" data-heatmap>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col" className="min-w-40">Student</TableHead>
                    {hm.skills.map((r) => (
                      <TableHead key={r.skill.id} scope="col" className="min-w-28 whitespace-normal align-bottom">
                        <span className="block text-foreground">{r.skill.name}</span>
                        <span className="block text-xs font-normal text-muted-foreground">{r.level === "mandatory" ? "Mandatory" : "Optional"}</span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hm.rows.map((r) => (
                    <TableRow key={r.student.id} data-heat-row={r.student.id}>
                      <TableHead scope="row" className="font-medium">{link(r.student.id, r.student.name)}</TableHead>
                      {r.cells.map((c) => (
                        <TableCell key={c.skillId} className={SCALE_CLASS[SCALE[c.state]]} data-cell-state={c.state}>
                          <span className="flex items-center gap-1.5 text-xs">
                            <i className={CELL_ICON[c.state]} aria-hidden="true" />
                            <span>{c.text}</span>
                          </span>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="pace" className="flex flex-col gap-3 rounded-md pt-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <p className="text-sm text-muted-foreground" data-pace-basis>
              {`The term runs ${fmtDay(`${TERM.start}T00:00:00Z`)} to ${fmtDay(`${TERM.end}T00:00:00Z`)}. ${termDaysGone()} days have passed (${Math.round(termShare() * 100)}%), so a student should have collected about that share of the evaluations the mandatory rules ask for. A student is behind when they are more than ${PACE_MARGIN} ${plural(PACE_MARGIN, "evaluation", "evaluations")} short. The requirements do not define pace; this is the prototype's reading.`}
            </p>
            <V2Grid<PaceRow>
              caption="Students behind the expected pace"
              rows={behind}
              id={(r) => r.studentId}
              selectable={false}
              emptyText="No student is behind the expected pace."
              columns={[
                v2col<PaceRow>("student", "Student", 170, (r) => link(r.studentId, r.name)),
                v2col<PaceRow>("achieved", "Mandatory skills achieved", 190, (r) => `${r.achieved} of ${r.total}`),
                v2col<PaceRow>("collected", "Evaluations collected", 170, (r) => `${r.collected} of ${r.needed}`),
                v2col<PaceRow>("expected", "Expected by now", 140, (r) => String(r.expected)),
                v2col<PaceRow>("short", "Short by", 100, (r) => <StatusBadge label={`${r.behindBy} ${plural(r.behindBy, "evaluation", "evaluations")}`} tone="warning" icon="fa-circle-minus" size="sm" />),
                v2col<PaceRow>("open", "Open mandatory skills", 320, (r) => r.open.map((o) => `${o.name} (${o.counted} of ${o.need})`).join("; ") || "None"),
                v2col<PaceRow>("verified", "Program verification", 200, (r) => <VerifyBadge row={vrows.get(r.studentId)} />),
              ]}
            />
          </TabsContent>

          <TabsContent value="skills" className="flex flex-col gap-3 rounded-md pt-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <p className="text-sm text-muted-foreground">Observations are counted evaluations of any outcome. A skill is flagged when it has two or more observations and one evaluator behind all of them. That is not wrong, but one person&apos;s judgement carries the whole skill.</p>
            <V2Grid<SkillStat>
              caption="Observations and distinct evaluators by skill"
              rows={stats}
              id={(r) => r.skill.id}
              selectable={false}
              emptyText="No published skill matches these filters."
              columns={[
                v2col<SkillStat>("skill", "Skill", 230, (r) => <span className="font-medium text-foreground">{r.skill.name}</span>),
                v2col<SkillStat>("level", "In this course", 130, (r) => (r.level === "mandatory" ? "Mandatory" : "Optional")),
                v2col<SkillStat>("obs", "Observations", 130, (r) => String(r.observations)),
                v2col<SkillStat>("raters", "Distinct evaluators", 280, (r) => (r.raters.length === 0 ? "None yet" : `${r.raters.length}: ${r.raters.map((x) => `${x.name} (${x.count})`).join(", ")}`)),
                v2col<SkillStat>("flag", "Flag", 170, (r) => (r.singleRater ? <StatusBadge label="One evaluator" tone="warning" icon="fa-user" size="sm" /> : r.raters.length === 0 ? "No evidence" : "More than one")),
                v2col<SkillStat>("sim", "Simulation share", 170, (r) => (r.observations === 0 ? "No evidence" : `${r.simulationShare}% (${r.simulation} of ${r.observations})`)),
                v2col<SkillStat>("ach", "Students achieved", 150, (r) => `${r.achieved} of ${r.students}`),
                v2col<SkillStat>("open", "Evidence", 150, (r) => (
                  <Button type="button" variant="link" size="sm" className="h-auto p-0" aria-label={`Show the students for ${r.skill.name}`} onClick={() => { setFocusSkill(r.skill.id); setTab("students") }}>Show students</Button>
                )),
              ]}
            />
          </TabsContent>

          <TabsContent value="raters" className="flex flex-col gap-3 rounded-md pt-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <p className="text-sm text-muted-foreground" data-rater-note>{`Met rate is the share of an evaluator's counted evaluations that were Met. "Against all" is the gap, in points, to the rate for every evaluator together. A gap is not a judgement: evaluators see different students, skills and settings. Rows under ${SMALL_NUMBERS} evaluations are marked.`}</p>
            <V2Grid<RaterRow>
              caption="Rater comparison"
              rows={raters}
              id={(r) => r.id}
              selectable={false}
              emptyText="No counted evidence for these filters."
              columns={[
                v2col<RaterRow>("name", "Evaluator", 190, (r) => <span className="font-medium text-foreground">{r.name}</span>),
                v2col<RaterRow>("role", "Role", 220, (r) => r.role),
                v2col<RaterRow>("n", "Evaluations", 120, (r) => String(r.evaluations)),
                v2col<RaterRow>("met", "Met", 90, (r) => String(r.met)),
                v2col<RaterRow>("notmet", "Not met", 100, (r) => String(r.notMet)),
                v2col<RaterRow>("notyet", "Not yet", 100, (r) => String(r.notYet)),
                v2col<RaterRow>("rate", "Met rate", 100, (r) => `${r.metRate}%`),
                v2col<RaterRow>("vs", "Against all evaluators", 190, (r) => `${r.vsAll > 0 ? "+" : ""}${r.vsAll} points`),
                v2col<RaterRow>("stu", "Students", 100, (r) => String(r.students)),
                v2col<RaterRow>("note", "Note", 200, (r) => (r.small ? <StatusBadge label="Small numbers, read with care" tone="neutral" icon="fa-circle-info" size="sm" /> : "")),
              ]}
            />
          </TabsContent>

          <TabsContent value="students" className="flex flex-col gap-3 rounded-md pt-3 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <p className="text-sm text-muted-foreground">The heatmap in words, one row for each student and skill. Open a name to read the evidence.</p>
            {focusSkill ? (
              <div className="flex flex-wrap items-center gap-2" data-skill-focus>
                <Button type="button" variant="outline" size="sm" aria-label={`Remove filter Skill: ${stats.find((x) => x.skill.id === focusSkill)?.skill.name ?? ""}`} onClick={() => setFocusSkill(null)}>
                  {`Skill: ${stats.find((x) => x.skill.id === focusSkill)?.skill.name ?? ""}`}
                  <i className="fa-light fa-xmark" aria-hidden="true" />
                </Button>
              </div>
            ) : null}
            <V2Grid<StudentSkillRow>
              caption="Every student and skill, in words"
              rows={rows}
              id={(r) => r.id}
              selectable={false}
              emptyText="No student has evidence for these filters."
              columns={[
                v2col<StudentSkillRow>("student", "Student", 170, (r) => link(r.studentId, r.student)),
                v2col<StudentSkillRow>("skill", "Skill", 240, (r) => r.skill),
                v2col<StudentSkillRow>("level", "In this course", 130, (r) => (r.level === "mandatory" ? "Mandatory" : "Optional")),
                v2col<StudentSkillRow>("status", "Status", 200, (r) => <StatusBadge label={r.status} tone={STATE_TONE[r.state].tone} icon={STATE_TONE[r.state].icon} size="sm" />),
                v2col<StudentSkillRow>("obs", "Observations", 120, (r) => String(r.observations)),
                v2col<StudentSkillRow>("raters", "Evaluators", 110, (r) => String(r.raters)),
                v2col<StudentSkillRow>("sim", "Simulation", 110, (r) => String(r.simulation)),
              ]}
            />
          </TabsContent>
        </Tabs>

        <PageSection title="Signed PDF" id="pdf" description="A PDF carries the filters that produced it and a signature block. The page can check the file again later.">
          <div role="status" aria-live="polite" className="flex flex-col gap-2">
            {done ? (
              <LocalBanner variant="success" title="PDF downloaded" data-pdf-done data-pdf-hash={done.hash} data-pdf-file-hash={done.fileHash}>
                <p>{`${done.name}, ${done.pages} ${plural(done.pages, "page", "pages")}.`}</p>
                <p className="font-mono text-xs break-all">{`Content hash ${done.hash}`}</p>
                <p className="font-mono text-xs break-all">{`File hash ${done.fileHash}`}</p>
              </LocalBanner>
            ) : null}
          </div>
          {error ? <LocalBanner variant="error" title="No PDF was made">{error}</LocalBanner> : null}
          <div className="flex flex-wrap items-end gap-4">
            <Button type="button" variant="default" size="lg" className={BTN} disabled={hm.rows.length === 0} data-download="cohort" onClick={() => download(cohortReportContent(s, f, new Date().toISOString()), `cohort-skills-report-${fileSlug(s.course.code, s.course.term)}.pdf`)}>
              Download cohort PDF
            </Button>
            <div className="flex flex-col gap-1">
              <Label htmlFor="pdf-student">Student</Label>
              <Select value={studentId} onValueChange={(v) => { setStudentId(v); setError(null) }}>
                <SelectTrigger id="pdf-student" className="w-56"><SelectValue placeholder="Choose a student" /></SelectTrigger>
                <SelectContent>
                  {hm.rows.map((r) => <SelectItem key={r.student.id} value={r.student.id}>{r.student.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" size="lg" className={BTN} data-download="student" onClick={() => download(studentReportContent(s, studentId, f, new Date().toISOString()), `skills-report-${fileSlug(chosenStudent?.name ?? "student")}.pdf`)}>
              {chosenStudent ? `Download PDF for ${chosenStudent.name}` : "Download PDF for one student"}
            </Button>
          </div>
          <Card size="sm">
            <CardContent className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-foreground">What the signature proves</span>
              <p className="text-muted-foreground" data-signature-note>This file has not changed since it was signed here. It does not prove who made it. This is a prototype: it signs with a demo key that ships with the page, so anyone can recompute it. A real deployment signs with the program&apos;s private key. Confidential concerns, student self-ratings and notes, and evaluator feedback text are never in a report.</p>
            </CardContent>
          </Card>
        </PageSection>

        <PageSection title="Check a PDF" id="check" description="Choose a PDF made here. The page rebuilds it from the content it carries and compares every byte.">
          <input ref={fileRef} id="check-file" type="file" accept="application/pdf,.pdf" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = "" }} />
          <div>
            <Button type="button" variant="outline" size="lg" className={BTN} data-check-open onClick={() => fileRef.current?.click()}>
              Choose a PDF to check
            </Button>
          </div>
          <div role="status" aria-live="polite" className="flex flex-col gap-2">
            {check ? (
              check.result.ok ? (
                <LocalBanner variant="success" title="This file is unchanged" data-check-result="ok">
                  <p>{`${check.name} matches what was signed: ${check.result.content.title}, ${check.result.content.subject} Made ${check.result.content.generatedAt.slice(0, 10)}.`}</p>
                  <p className="font-mono text-xs break-all">{`Content hash ${check.result.hash}`}</p>
                  <p>This does not show who made it. See What the signature proves above.</p>
                </LocalBanner>
              ) : (
                <LocalBanner variant="warning" title="This file does not pass the check" data-check-result={check.result.reason}>
                  {`${check.name}. ${check.result.message}`}
                </LocalBanner>
              )
            ) : null}
          </div>
        </PageSection>
      </div>
    </PageFrame>
  )
}

function VerifyBadge({ row }: { row: VerificationRow | undefined }) {
  if (!row) return <span>Not on record</span>
  const t = STATUS_TONE[row.status]
  return <StatusBadge label={statusLabel(row.status, row.version)} tone={t.tone} icon={t.icon} size="sm" />
}
