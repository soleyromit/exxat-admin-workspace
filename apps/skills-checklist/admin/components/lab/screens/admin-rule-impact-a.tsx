"use client"

/**
 * Rule change impact, variant A: counts first (template T3 form). Outside the setup flow; set 1 shows the same content as
 * configure step 5. The rule now and after, one headline figure, the before and after table, the students grouped by move with
 * the shared reason said once per group (J7), the open evidence choice with nothing preselected, one primary, Save changes (decision D-X31: no publish stage).
 * "Preview after you save" shows both views under the new rule, together [REQ SC-19].
 * URL: ?skill= · ?change=none shows no edit · ?state=loading. Opens on the sample stricter rule.
 */
import { TYPE } from "@/components/lab/type-scale"
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { FormPage, StickyFooter } from "@/components/lab/layout"
import { HOW_MANY_LABEL, ruleSentence, type LabRule, type PublishMode } from "@/lib/lab/configure"
import { EVIDENCE_CHOICE_MISSING, EvidenceChoice, ImpactSummary, needsEvidenceChoice, useLiveImpact } from "@/components/lab/configure/impact"
import { ConfigureLoading, ConfigureNotFound } from "@/components/lab/configure/shell"
import { focusField, useConfigure } from "@/components/lab/configure/use-configure"
import { ConfigureReceiptPage } from "@/components/lab/configure/check"
import { EvaluatorPreview, StudentPreview } from "@/components/lab/configure/live-panel"

/**
 * Both previews under the new rule, shown open in the supporting column (2026-10-30 review: the collapsed panel left the lower
 * page empty, and SC-19 asks to review everything asked of the student and the evaluator together). The same previews as
 * configure's Check step.
 */
function BothViews({ skillName, rule }: { skillName: string; rule: LabRule }) {
  return (
    <section aria-labelledby="ri-views" className="flex flex-col gap-3" data-both-views>
      <h2 id="ri-views" className={TYPE.section}>Preview after you save</h2>
      <div className="grid grid-cols-1 gap-4 @min-[40rem]:grid-cols-2">
        <section className="flex flex-col gap-2" aria-label="Student sees">
          <h3 className={TYPE.label}>Student sees</h3>
          <StudentPreview skillName={skillName} rule={rule} />
        </section>
        <section className="flex flex-col gap-2" aria-label="Evaluator sees">
          <h3 className={TYPE.label}>Evaluator sees</h3>
          <EvaluatorPreview skillName={skillName} rule={rule} />
        </section>
      </div>
    </section>
  )
}

export function RuleDiff({ current, after }: { current: string | null; after: string }) {
  return (
    <dl className="grid grid-cols-[4rem_1fr] gap-x-3 gap-y-2 text-sm" data-rule-diff>
      <dt className="text-muted-foreground">Now</dt>
      <dd className="text-foreground">{current ?? "Not configured"}</dd>
      <dt className="text-muted-foreground">After</dt>
      <dd className="font-medium text-foreground">{after}</dd>
    </dl>
  )
}

export function AdminRuleImpactA() {
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
        // Who changes is the hero (2026-10-30 review: the before/after table floated mid-page over an empty lower 40%): it
        // leads on the left, wider, with the named students open under the counts. The rule now and after, the evidence
        // decision and both previews are the supporting column on the right. One column below 64rem (D-X30).
        <div className="@container flex flex-col gap-8 @min-[64rem]:grid @min-[64rem]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @min-[64rem]:items-start @min-[64rem]:gap-x-10" data-impact-hero>
          <section aria-labelledby="ri-who" className="flex min-w-0 flex-col gap-3">
            <h2 id="ri-who" className={TYPE.section}>
              Who changes
            </h2>
            <ImpactSummary current={m.current} impact={impact} lead="counts" namesOpen />
          </section>
          <div className="flex min-w-0 flex-col gap-8">
            <section aria-labelledby="ri-rule" className="flex flex-col gap-3">
              <h2 id="ri-rule" className={TYPE.section}>
                {HOW_MANY_LABEL}
              </h2>
              <RuleDiff current={m.current ? ruleSentence(m.current) : null} after={ruleSentence(m.rule)} />
            </section>
            {choice ? <EvidenceChoice value={mode} onChange={setMode} error={tried && !mode ? EVIDENCE_CHOICE_MISSING : undefined} /> : null}
            <BothViews skillName={skill.name} rule={m.rule} />
          </div>
        </div>
      )}
    </FormPage>
  )
}
