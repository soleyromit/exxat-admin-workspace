"use client"

/**
 * Rule change impact, variant A: counts first (template T3 form). Outside the setup flow; set 1 shows the same content as
 * configure step 5. The rule now and after, one headline figure, the before and after table, the students grouped by move with
 * the shared reason said once per group (J7), the open evidence choice with nothing preselected, one primary, Save changes (decision D-X31: no publish stage).
 * URL: ?skill= · ?change=none shows no edit · ?state=loading. Opens on the sample stricter rule.
 */
import * as React from "react"
import { FormPage, StickyFooter } from "@/components/lab/layout"
import { HOW_MANY_LABEL, ruleSentence, type PublishMode } from "@/lib/lab/configure"
import { EVIDENCE_CHOICE_MISSING, EvidenceChoice, ImpactSummary, needsEvidenceChoice, useLiveImpact } from "@/components/lab/configure/impact"
import { ConfigureLoading, ConfigureNotFound, SkillSubtitle } from "@/components/lab/configure/shell"
import { focusField, useConfigure } from "@/components/lab/configure/use-configure"
import { ConfigureReceiptPage } from "@/components/lab/configure/check"

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
      subtitle={<SkillSubtitle state={m.state} skill={skill} />}
      footer={
        <StickyFooter
          secondary={{ label: "Edit how many times", href: editHref }}
          primary={{ label: m.current ? "Save changes" : "Save configuration", onClick: publish }}
        />
      }
    >
      {(
        // Two columns once the page is wider than 64rem (D-X30): the rule and the decision on the left, who changes on the right.
        <div className="flex flex-col gap-8 @min-[64rem]:grid @min-[64rem]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @min-[64rem]:items-start @min-[64rem]:gap-x-10">
          <div className="flex min-w-0 flex-col gap-8">
          <section aria-labelledby="ri-rule" className="flex flex-col gap-3">
            <h2 id="ri-rule" className="text-base font-semibold text-foreground">
              {HOW_MANY_LABEL}
            </h2>
            <RuleDiff current={m.current ? ruleSentence(m.current) : null} after={ruleSentence(m.rule)} />          </section>
          {choice ? <EvidenceChoice value={mode} onChange={setMode} error={tried && !mode ? EVIDENCE_CHOICE_MISSING : undefined} /> : null}
          </div>
          <section aria-labelledby="ri-who" className="flex min-w-0 flex-col gap-3">
            <h2 id="ri-who" className="text-base font-semibold text-foreground">
              Who changes
            </h2>
            <ImpactSummary current={m.current} impact={impact} lead="counts" />
          </section>
        </div>
      )}
    </FormPage>
  )
}
