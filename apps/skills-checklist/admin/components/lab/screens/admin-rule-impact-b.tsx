"use client"

/**
 * Rule change impact, variant B: people first (template T3 form). A leads with counts; B leads with the students, grouped by the
 * move they make (for example Achieved to In progress), each group stating what its students share ONCE ("All 14 need 1 more in
 * Inpatient"), then the rule diff, the open evidence choice (never preselected) and what each role sees after publish
 * [REQ AE-02, SC-19]. Same data as A: computeImpact over the real evidence index.
 * URL: ?skill= · ?change=none shows no edit · ?state=loading.
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { FormPage, StickyFooter } from "@/components/lab/layout"
import { affectedStudentLine, HOW_MANY_LABEL, ruleSentence, type Impact, type LabRule, type PublishMode } from "@/lib/lab/configure"
import { skillNoun } from "@/lib/lab/terms"
import { shortDate } from "@/lib/v2/format"
import { DEMO_TODAY } from "@/lib/v2/seed-core"
import { AttemptExample, EVIDENCE_CHOICE_MISSING, EvidenceChoice, ImpactSummary, needsEvidenceChoice, useLiveImpact } from "@/components/lab/configure/impact"
import { ConfigureLoading, ConfigureNotFound } from "@/components/lab/configure/shell"
import { focusField, useConfigure } from "@/components/lab/configure/use-configure"
import { ConfigureReceiptPage } from "@/components/lab/configure/check"
import { RuleDiff } from "./admin-rule-impact-a"

const DATE_LABEL = shortDate(DEMO_TODAY)

function RolePreview({ impact, skillName, rule, mode }: { impact: Impact | null; skillName: string; rule: LabRule; mode: PublishMode | null }) {
  const [open, setOpen] = React.useState(false)
  const first = impact?.changed[0] ?? null
  const studentLine = mode === "new-only" ? "Nothing changes for students now. Later evaluations use the new rule." : first ? affectedStudentLine(skillName, rule, first, DATE_LABEL) : "No student's status changes."
  const lines: Array<{ role: string; icon: string; text: string }> = [
    { role: first && mode !== "new-only" ? `Student, for example ${first.name}` : "Students", icon: "fa-user-graduate", text: studentLine },
    { role: "Evaluators", icon: "fa-user-doctor", text: "See the form as configured on their next request. They never see the rule." },
    { role: "Reviewers", icon: "fa-clipboard-check", text: "Completed evaluations stay as recorded. Nothing returns to the approval queue." },
  ]
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t border-border pt-3" data-role-preview>
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="-ms-2 w-full justify-between" aria-expanded={open}>
          <span className="text-sm font-medium text-foreground">What each role sees after saving</span>
          <i className={`fa-light ${open ? "fa-chevron-up" : "fa-chevron-down"} text-xs`} aria-hidden="true" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <ul className="flex flex-col gap-3">
          {lines.map((l) => (
            <li key={l.role} className="flex gap-3">
              <i className={`fa-light ${l.icon} mt-0.5 w-4 text-sm text-muted-foreground`} aria-hidden="true" />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{l.role}</span>
                <span className="text-sm text-muted-foreground">{l.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AdminRuleImpactB() {
  const m = useConfigure({ defaultSample: true })
  const impact = useLiveImpact(m.state, m.skill, m.current, m.rule)
  const [mode, setMode] = React.useState<PublishMode | null>(null)
  const [tried, setTried] = React.useState(false)
  if (!m.ready) return <ConfigureLoading title="Rule change" />
  if (!m.skill) return <ConfigureNotFound skillId={m.skillId} />
  const skill = m.skill
  if (m.saved) return <ConfigureReceiptPage state={m.state} skill={skill} result={m.saved} layout="sheet" nextSkill={m.nextSkill} />
  const choice = needsEvidenceChoice(m.current, impact)
  const editHref = `/lab/admin/configure-skill?skill=${encodeURIComponent(m.skillId)}&change=sample&step=rule`

  const publish = () => {
    if (choice && !mode) {
      setTried(true)
      requestAnimationFrame(() => focusField("cfg-mode"))
      return
    }
    m.save(choice ? mode : null)
  }

  return (
    <FormPage
      title={skill.name}
      footer={
        <StickyFooter
          secondary={{ label: "Edit how many times", href: editHref }}
          primary={{ label: m.current ? "Save changes" : "Save configuration", onClick: publish }}
        />
      }
    >
      {(
        // Two columns once the page is wider than 64rem (D-X30): who changes and the decision on the left, the rule and what
        // each role sees on the right.
        <div className="flex flex-col gap-8 @min-[64rem]:grid @min-[64rem]:grid-cols-2 @min-[64rem]:items-start @min-[64rem]:gap-x-10">
          <div className="flex min-w-0 flex-col gap-8">
          <ImpactSummary current={m.current} impact={impact} lead="people" />
          {choice ? <EvidenceChoice value={mode} onChange={setMode} error={tried && !mode ? EVIDENCE_CHOICE_MISSING : undefined} /> : null}
          </div>
          <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="ri-b-rule" className="flex flex-col gap-3 border-t border-border pt-6 @min-[64rem]:border-t-0 @min-[64rem]:pt-0">
            <h2 id="ri-b-rule" className={TYPE.section}>
              {`${HOW_MANY_LABEL} on this ${skillNoun()}`}
            </h2>
            <RuleDiff current={m.current ? ruleSentence(m.current) : null} after={ruleSentence(m.rule)} />
            <AttemptExample rule={m.rule} impact={impact} />
          </section>
          {m.current ? <RolePreview impact={impact} skillName={skill.name} rule={m.rule} mode={mode} /> : null}
          </div>
        </div>
      )}
    </FormPage>
  )
}
