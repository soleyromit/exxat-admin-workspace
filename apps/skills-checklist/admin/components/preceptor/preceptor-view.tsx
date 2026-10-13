"use client"

/**
 * Preceptor Evaluation (prototype page, parity card P-12), inside the shell. Copy is the prototype's.
 * The "Evaluations sent" mailbox lists links that are neither superseded nor submitted; "Open link" opens the same
 * EvaluatorForm the real link route renders, INLINE on this page (embedded). C-6 [PROTO]: on this demo page the form shows
 * the criteria line and, after submit, the Progress/Status table, behind the pref `evaluatorSeesProgress` (default ON).
 * The real shell-free link /e/[token] never reads that pref and stays OFF until OD-17 is decided (EV-01, OD-17).
 */
import * as React from "react"
import { PageHeader } from "@exxatdesignux/ui/components/ui/page-header"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@exxatdesignux/ui/components/ui/card"
import { EvaluatorForm } from "@/components/evaluator/evaluator-form"
import { offeringTitle, preceptor } from "@/lib/copy/r5-student-preceptor"
import { useDb, usePrefs } from "@/lib/store/react"
import { EmptyState } from "@/components/skills"

function useMounted(): boolean {
  const [m, setM] = React.useState(false)
  React.useEffect(() => setM(true), [])
  return m
}

export function PreceptorView() {
  const db = useDb()
  const { evaluatorSeesProgress } = usePrefs()
  const roleName = (id: string) => db.roles.find((r) => r.id === id)?.label ?? id
  const mounted = useMounted()
  const [open, setOpen] = React.useState<string | null>(null)

  const sent = React.useMemo(() => {
    return db.links
      .filter((l) => !l.supersededAt && (!l.submittedAt || l.token === open))
      .map((l) => {
        const subs = l.submissionIds.map((id) => db.submissions.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s)
        const first = subs[0]
        const student = first ? db.students.find((s) => s.id === first.studentId) : undefined
        const offering = first ? db.offerings.find((o) => o.id === first.offeringId) : undefined
        const skills = subs.map((s) => db.skills.find((k) => k.id === s.skillId)?.name).filter((n): n is string => !!n)
        return { link: l, student, offering, skills }
      })
      .filter((r) => r.student)
      .sort((a, b) => (a.link.createdAt < b.link.createdAt ? 1 : -1))
  }, [db, open])

  const header = <div className="px-6 pt-5"><PageHeader title={preceptor.title} subtitle={preceptor.subtitle} className="px-0 pt-0 pb-0 lg:px-0 lg:pt-0 lg:pb-0" /></div>
  if (!mounted) return null

  if (open) {
    return (
      <div className="flex flex-col gap-4 pb-6">
        {header}
        <div className="px-6">
          <EvaluatorForm token={open} embedded showProgress={evaluatorSeesProgress} onBack={() => setOpen(null)} />
        </div>
      </div>
    )
  }

  const visible = sent.filter((r) => !r.link.submittedAt)

  return (
    <div className="flex flex-col gap-4 pb-6">
      {header}
      <div className="px-6">
      <Card>
        <CardHeader>
          <CardTitle asChild className="text-sm">
            <h2>{preceptor.sent.title}</h2>
          </CardTitle>
          <CardDescription>{preceptor.sent.body}</CardDescription>
        </CardHeader>
        <CardContent>
          {visible.length === 0 ? (
            <EmptyState icon="fa-envelope" title={preceptor.sent.empty} description={preceptor.sent.emptyBody} />
          ) : (
            <ul className="divide-y divide-border">
              {visible.map(({ link, student, offering, skills }) => (
                <li key={link.token} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{student?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {preceptor.sent.row(offering ? offeringTitle(offering.code, offering.name) : "", link.createdAt.slice(0, 10), link.evaluator.name, roleName(link.evaluator.roleId))}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      {skills.map((n) => (
                        <Badge key={n} variant="outline">
                          {n}
                        </Badge>
                      ))}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={() => setOpen(link.token)}>
                    {preceptor.sent.open}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
