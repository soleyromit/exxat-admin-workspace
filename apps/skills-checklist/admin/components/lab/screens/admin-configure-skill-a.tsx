"use client"

/**
 * Change one skill, variant A (2026-11-02, audit fix after Romit: "I thought I was clear that I don't want so much dense text"). The
 * per-skill page in the same four sections and words as Evaluation settings (How skills are judged, What counts as achieved, How
 * many evaluations, Who signs). Only what a skill may keep for itself is editable: times needed and the minimums [REQ SC-10, SC-11],
 * and its own questions under a question or scored model [REQ SC-04]. Everything inherited from the program reads as plain values,
 * with "Change for all skills" to the Evaluation settings page. No preview, no subtext (D-L34, D-L36).
 *
 * A skill not configured yet starts from the program's settings when they exist; with none, the page points to them.
 * Save writes the rule through the same path as before (useConfigure, saveLabRule); when the change moves students who already
 * have evidence, the choice about that evidence is asked first, as a control [D-X27].
 *
 * Regions: header, sections, footer. URL: ?skill= · ?state=loading.
 */
import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { FormPage, StickyFooter } from "@/components/lab/layout"
import { CRITERIA_LABEL, HOW_MANY_LABEL, LAB_MODEL_LABEL, MODEL_STEP_LABEL, ROLE_LABEL, checkOffLine, configureStepValue, type PublishMode } from "@/lib/lab/configure"
import { programSettingsOf, resolveRule } from "@/lib/lab/program-settings"
import { OutcomesSection, RuleSection, type SectionProps } from "@/components/lab/configure/fields"
import { EVIDENCE_CHOICE_MISSING, EvidenceChoice, needsEvidenceChoice, useLiveImpact } from "@/components/lab/configure/impact"
import { ConfigureLoading, ConfigureNotFound, LeaveButton, SkillTitle } from "@/components/lab/configure/shell"
import { focusField, useConfigure } from "@/components/lab/configure/use-configure"
import { useLabHref } from "@/components/lab/lab-bar/page-context"
import { TYPE } from "@/components/lab/type-scale"
import { skillNounPlural } from "@/lib/lab/terms"

/** A read-only value row: label and value, nothing else. */
function Value({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[12rem_minmax(0,1fr)] gap-3 text-sm max-sm:grid-cols-1 max-sm:gap-0.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground" data-inherited={label}>{value}</dd>
    </div>
  )
}

function Section({ n, title, children, first }: { n: number; title: string; children: React.ReactNode; first?: boolean }) {
  const id = `one-skill-${n}`
  return (
    <section aria-labelledby={id} className={cn("flex flex-col gap-4", !first && "border-t border-border pt-6")}>
      <h2 id={id} className={cn("flex items-baseline gap-2", TYPE.section)}>
        <span className="tabular-nums text-muted-foreground" aria-hidden="true">{n}</span>
        <span>{title}</span>
      </h2>
      {children}
    </section>
  )
}

export function AdminConfigureSkillA() {
  const m = useConfigure()
  const to = useLabHref()
  const program = m.ready ? programSettingsOf(m.state)?.rule ?? null : null
  const impact = useLiveImpact(m.state, m.skill, m.current, m.rule)
  const [mode, setMode] = React.useState<PublishMode | null>(null)
  const [tried, setTried] = React.useState(false)
  const [showErrors, setShowErrors] = React.useState(false)

  // A skill not configured yet takes the program's settings as its starting point (nothing is chosen for it otherwise).
  const seeded = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!m.skill || m.current || !program || m.rule.model || seeded.current === m.skill.id) return
    seeded.current = m.skill.id
    m.setRule(() => resolveRule(program, null))
  }, [m, program])

  if (!m.ready) return <ConfigureLoading />
  if (!m.skill) return <ConfigureNotFound skillId={m.skillId} />
  const skill = m.skill
  const r = m.rule
  const props: SectionProps = { rule: r, setRule: m.setRule, issues: m.issues, showErrors, settings: m.settings, legendHidden: true }
  const allSkillsHref = to("admin/evaluation-settings")
  const choice = needsEvidenceChoice(m.current, impact)
  const ownQuestions = r.model === "question" || r.model === "scored"

  const save = () => {
    if (m.issues.length) {
      setShowErrors(true)
      requestAnimationFrame(() => focusField(m.issues[0]!.field))
      return
    }
    if (choice && !mode) {
      setTried(true)
      requestAnimationFrame(() => focusField("cfg-mode"))
      return
    }
    m.save(choice ? mode : null)
  }

  return (
    <FormPage
      title={<SkillTitle state={m.state} skill={skill} />}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={allSkillsHref}>{`Change for all ${skillNounPlural()}`}</Link>
          </Button>
          <LeaveButton dirty={m.dirty} skillId={skill.id} onSaveDraft={() => m.saveDraft(null)} />
        </div>
      }
      banner={m.saved ? <LocalBanner variant="success" dismissible onDismiss={m.dismissSaved}>Saved</LocalBanner> : undefined}
      // The one Save shows once there is something to save (no disabled control on arrival).
      footer={r.model && (m.dirty || !m.current) ? <StickyFooter primary={{ label: "Save", onClick: save }} /> : undefined}
    >
      <div className="flex flex-col gap-6" data-one-skill>
        <Section n={1} title={MODEL_STEP_LABEL} first>
          {r.model ? (
            <dl className="flex flex-col gap-2">
              <Value label="Judged by" value={LAB_MODEL_LABEL[r.model]} />
            </dl>
          ) : (
            <div>
              <Button asChild variant="default" size="sm">
                <Link href={allSkillsHref}>Set evaluation settings</Link>
              </Button>
            </div>
          )}
        </Section>
        {r.model ? (
          <>
            <Section n={2} title={CRITERIA_LABEL}>
              {ownQuestions ? (
                <OutcomesSection {...props} />
              ) : (
                <dl className="flex flex-col gap-2">
                  <Value label={r.model === "demonstration" ? "Levels" : "Outcomes"} value={(r.model === "demonstration" ? r.levels : r.outcomeLabels).map((x) => x.trim()).filter(Boolean).join(", ")} />
                  <Value label="Counts" value={configureStepValue("outcomes", r) ?? "Not set"} />
                </dl>
              )}
            </Section>
            <Section n={3} title={HOW_MANY_LABEL}>
              <RuleSection {...props} />
              <dl className="flex flex-col gap-2">
                <Value label="Group check-off" value={checkOffLine(r)} />
              </dl>
            </Section>
            <Section n={4} title="Who signs">
              <dl className="flex flex-col gap-2">
                <Value label="Student adds" value={r.studentFields.map((f) => `${f.label.trim()}${f.mandatory ? "" : " (optional)"}`).filter(Boolean).join(", ") || "Nothing"} />
                <Value label="Self-rating" value={r.selfEvaluation ? "On" : "Off"} />
                <Value label="Signs" value={r.evaluatorRoles.map((x) => ROLE_LABEL[x]).join(", ") || "Not set"} />
                <Value label="Feedback" value={r.feedbackRequired ? "Required" : "Optional"} />
                <Value label="Approval" value={r.approvalRequired ? "On" : "Off"} />
              </dl>
            </Section>
            {choice ? <EvidenceChoice value={mode} onChange={setMode} error={tried && !mode ? EVIDENCE_CHOICE_MISSING : undefined} /> : null}
          </>
        ) : null}
      </div>
    </FormPage>
  )
}
