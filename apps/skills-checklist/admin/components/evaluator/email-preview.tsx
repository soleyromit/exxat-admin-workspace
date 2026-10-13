"use client"

import * as React from "react"
import { PageFrame } from "@/components/skills/page-header"
import { Label } from "@exxatdesignux/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@exxatdesignux/ui/components/ui/select"
import { useDb } from "@/lib/store/react"
import { roleLabel } from "@/lib/store"
import { buildEvaluationRequestEmail } from "./email"

/** Demo program name: the sample data has no program entity (the email takes it as input). */
const SAMPLE_PROGRAM = "Nursing program"

/**
 * Dev-only page: renders the S-18 email for a seeded link so subject, plain-text part and HTML part can be reviewed in the
 * app. It sends nothing. The HTML part is shown in a sandboxed frame.
 */
export function EmailPreview() {
  const db = useDb()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const links = db.links
  const [token, setToken] = React.useState<string>("")
  const chosen = links.find((l) => l.token === token) ?? links[0]

  const email = React.useMemo(() => {
    if (!chosen) return null
    const subs = chosen.submissionIds.map((id) => db.submissions.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s)
    const first = subs[0]
    if (!first) return null
    const student = db.students.find((s) => s.id === first.studentId)
    const off = db.offerings.find((o) => o.id === first.offeringId)
    const names = subs.map((s) => db.skills.find((k) => k.id === s.skillId)?.name ?? "").filter(Boolean)
    const origin = typeof window === "undefined" ? "" : window.location.origin
    return buildEvaluationRequestEmail({
      programName: SAMPLE_PROGRAM,
      studentName: student?.name ?? "",
      courseCode: off?.code,
      evaluatorName: chosen.evaluator.name,
      evaluatorEmail: chosen.evaluator.email,
      roleLabel: roleLabel(db, chosen.evaluator.roleId),
      skillNames: names,
      performedIn: first.performedIn,
      settingName: db.clinicalSettings.find((x) => x.id === first.clinicalSettingId)?.name ?? null,
      locationName: db.locations.find((x) => x.id === first.locationId)?.name ?? null,
      url: `${origin}/e/${chosen.token}`,
    })
  }, [chosen, db])

  if (!mounted) return null
  return (
    <PageFrame title="Evaluation request email" subtitle="Preview of the S-18 template for a sample link. Nothing is sent. Sample data only.">
      <div className="flex max-w-md flex-col gap-1.5">
        <Label htmlFor="email-link">Sample request</Label>
        <Select value={chosen?.token ?? ""} onValueChange={setToken}>
          <SelectTrigger id="email-link" aria-label="Sample request">
            <SelectValue placeholder="No requests in the sample data" />
          </SelectTrigger>
          <SelectContent>
            {links.map((l) => (
              <SelectItem key={l.token} value={l.token}>
                {`${l.evaluator.name} (${roleLabel(db, l.evaluator.roleId)}), ${l.submissionIds.length} ${l.submissionIds.length === 1 ? "skill" : "skills"}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {email ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="email-text" className="flex flex-col gap-2">
            <h2 id="email-text" className="text-base font-semibold text-foreground">
              Plain text part
            </h2>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">From</dt>
              <dd>{`${email.from.displayName} (sender address set by the platform owner)`}</dd>
              <dt className="text-muted-foreground">To</dt>
              <dd>{`${email.to.name} <${email.to.email}>`}</dd>
              <dt className="text-muted-foreground">Subject</dt>
              <dd>{email.subject}</dd>
            </dl>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground">{email.text}</pre>
          </section>
          <section aria-labelledby="email-html" className="flex flex-col gap-2">
            <h2 id="email-html" className="text-base font-semibold text-foreground">
              HTML part
            </h2>
            <iframe title="HTML part of the email" sandbox="" srcDoc={email.html} className="h-[640px] w-full rounded-md border border-border bg-background" />
          </section>
        </div>
      ) : null}
    </PageFrame>
  )
}
