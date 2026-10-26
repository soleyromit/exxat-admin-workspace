"use client"

/**
 * Student Log a skill, variant A: one form per sitting (recommended).
 * Tests: does one form per sitting (skills, where, details, self-rating only where switched on), saved to the device first, with a
 * single next step "Send for evaluation", get a skill logged in under a minute and stop the v2 split between Log and Requests?
 * Regions (form budget 5): header · what you did (picker) · where and when · rate yourself (only when on) · this entry (save).
 * [REQ ST-02, ST-04..ST-07, ST-10, ST-11, SC-13, SC-15; COMP rec 9: device first, nothing lost]
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { FieldError } from "@exxatdesignux/ui/components/ui/field"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"
import { EmptyBlock, Student2Frame, type Student2Ctx } from "@/components/lab/student2/frame"
import { DetailsFields, SelectedSkills, SelfEvalFields, SkillPicker, WhereField } from "@/components/lab/student2/log-parts"
import { SectionTitle } from "@/components/lab/student/parts"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { skillById } from "@/lib/v2/evidence-index"
import { aNoun, countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { shortDate } from "@/lib/lab/student"
import { detailErrors, pickRows, selfEvalEnabled, student2Href, whereChoices, type DetailValues } from "@/lib/lab/student2"

export function StudentLogA() {
  return (
    <Student2Frame
      title={`Log ${aNoun()}`}
      empty={(c) => <EmptyBlock title={`No ${skillNounPlural()} open yet`} body={`Your program has not set up ${skillNounPlural()} to log. Check back after it publishes them.`} action={{ label: "Back to My progress", href: student2Href("home", {}, c.studentId) }} />}
      loading={<FormSkeleton />}
    >
      {(ctx) => <LogForm ctx={ctx} />}
    </Student2Frame>
  )
}

export function FormSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-12" aria-hidden="true">
      <div className="flex flex-col gap-5 lg:col-span-8">
        <Skeleton className="h-80" />
        <Skeleton className="h-44" />
      </div>
      <Skeleton className="h-56 lg:col-span-4" />
    </div>
  )
}

const unitOf = (location: string | null) => (location && location.includes(",") ? location.split(",").slice(1).join(",").trim() : "")

function LogForm({ ctx }: { ctx: Student2Ctx }) {
  const { state: s, model: m, studentId, offline, param } = ctx
  const rows = React.useMemo(() => pickRows(s, m), [s, m])
  const where = React.useMemo(() => whereChoices(s, studentId), [s, studentId])
  const [skills, setSkills] = React.useState<string[]>(() => (param("skill") ?? "").split(",").filter((id) => rows.some((r) => r.id === id)))
  const [whereVal, setWhere] = React.useState(where[0]?.value ?? "")
  const chosen = where.find((w) => w.value === whereVal)
  const [details, setDetails] = React.useState<DetailValues>(() => ({ date: DEMO_TODAY, unit: unitOf(where[0]?.location ?? null), case: "" }))
  const [ratings, setRatings] = React.useState<Record<string, string>>({})
  const [tried, setTried] = React.useState(false)
  const [saved, setSaved] = React.useState<{ ids: string[]; clinical: boolean } | null>(null)

  const toggle = (id: string) => {
    setSaved(null)
    setSkills((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]))
  }
  const onWhere = (v: string) => {
    setWhere(v)
    const w = where.find((x) => x.value === v)
    if (w?.location) setDetails((d) => ({ ...d, unit: unitOf(w.location) || d.unit }))
  }
  const errors = detailErrors(details)
  const selfIds = skills.filter((id) => selfEvalEnabled(skillById(s, id)))
  const skillError = skills.length === 0 ? `Pick at least one ${skillNoun()}.` : null
  const save = () => {
    setTried(true)
    if (skillError || Object.keys(errors).length > 0 || !chosen) return
    setSaved({ ids: skills, clinical: chosen.setting === "clinical" })
  }
  const reset = () => {
    setSkills([])
    setRatings({})
    setSaved(null)
    setTried(false)
  }

  return (
    <form className="grid gap-5 lg:grid-cols-12" noValidate onSubmit={(e) => { e.preventDefault(); save() }} data-student-lab="log-A">
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
        <Card className="gap-0 py-0" data-region="what">
          <CardContent className="flex flex-col gap-3 py-4">
            <SectionTitle id="what-h" count={skills.length || undefined}>What you did</SectionTitle>
            <SelectedSkills s={s} ids={skills} onRemove={toggle} />
            <SkillPicker rows={rows} selected={skills} onToggle={toggle} />
            {tried && skillError ? <FieldError>{skillError}</FieldError> : null}
          </CardContent>
        </Card>
        <Card className="gap-0 py-0" data-region="where">
          <CardContent className="flex flex-col gap-4 py-4">
            <WhereField choices={where} value={whereVal} onChange={onWhere} />
            <DetailsFields values={details} onChange={(id, v) => setDetails((d) => ({ ...d, [id]: v }))} errors={errors} showErrors={tried} />
          </CardContent>
        </Card>
        {selfIds.length > 0 ? (
          <Card className="gap-0 py-0" data-region="self">
            <CardContent className="py-4">
              <SelfEvalFields s={s} ids={selfIds} values={ratings} onChange={(id, v) => setRatings((r) => ({ ...r, [id]: v }))} />
            </CardContent>
          </Card>
        ) : null}
      </div>
      <div className="lg:col-span-4">
        <Card className="gap-0 py-0 lg:sticky lg:top-4" data-region="save">
          <CardContent className="flex flex-col gap-3 py-4">
            <SectionTitle>This entry</SectionTitle>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">{skills.length === 1 ? skillNoun().replace(/^./, (c) => c.toUpperCase()) : skillNounPlural().replace(/^./, (c) => c.toUpperCase())}</dt>
              <dd className="text-foreground">{skills.length ? countSkills(skills.length) : "None yet"}</dd>
              <dt className="text-muted-foreground">Where</dt>
              <dd className="truncate text-foreground">{chosen?.label ?? "Not chosen"}</dd>
              <dt className="text-muted-foreground">Date</dt>
              <dd className="text-foreground">{details.date ? shortDate(details.date) : "Not set"}</dd>
              {selfIds.length > 0 ? (
                <>
                  <dt className="text-muted-foreground">Self-rating</dt>
                  <dd className="text-foreground">{`${selfIds.filter((id) => ratings[id]).length} of ${selfIds.length}`}</dd>
                </>
              ) : null}
            </dl>
            {saved ? (
              <div className="flex flex-col gap-3">
                <LocalBanner variant="success" title="Saved on this device">
                  {offline ? `${countSkills(saved.ids.length)} queued. They send when you reconnect.` : `${countSkills(saved.ids.length)} synced to your record.`}
                </LocalBanner>
                {saved.clinical ? (
                  <Button asChild variant="default" size="default" className="w-full max-sm:h-11">
                    <Link href={student2Href("request-signoff", { skills: saved.ids.join(",") }, studentId)}>Send for evaluation</Link>
                  </Button>
                ) : null}
                <Button type="button" variant={saved.clinical ? "ghost" : "outline"} size="sm" onClick={reset}>{`Log another ${skillNoun()}`}</Button>
              </div>
            ) : (
              <Button type="submit" variant="default" size="default" className="w-full max-sm:h-11">Save</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
