"use client"

/**
 * Configure a skill, option set 3 "Many at once" (template T3 form; 02 section 4.7). The rule is ONE editable sentence at the
 * top, after a compact model choice; everything that does not fit a sentence folds into Collapsibles below. Works for one
 * skill or several (?skills=a,b,c from the library bulk bar "Configure together") [REQ IM-14]. The footer says what the
 * sentence will touch; the one primary opens the impact check in a dialog, where Publish lives.
 *
 * URL: ?skill= or ?skills=a,b,c · ?impact=open · ?change=sample · ?state=loading. Listens for `lab:reset`.
 */
import { RulePreviewAside } from "@/components/lab/configure/live-panel"
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@exxatdesignux/ui/components/ui/dialog"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@exxatdesignux/ui/components/ui/table"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { FormPage, StickyFooter, ValidationSummary } from "@/components/lab/layout"
import { bulkImpact, carriedNotes, hasNeed, HOW_MANY_LABEL, outcomesLabel, settingNote, type LabRule, type PublishMode, type RuleIssue } from "@/lib/lab/configure"
import type { V2State } from "@/lib/v2/types"
import { skillById } from "@/lib/v2/evidence-index"
import { fmt } from "@/lib/v2/format"
import { countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { ModelSection, OutcomesSection, ProposedBadge, SignOffSection, type SectionProps } from "@/components/lab/configure/fields"
import { EVIDENCE_CHOICE_MISSING, EvidenceChoice, PublishDialog, PublishedNotice, useLiveImpact } from "@/components/lab/configure/impact"
import { SentenceBuilder } from "@/components/lab/configure/sentence-builder"
import { CancelButton, ConfigureLoading, ConfigureNotFound, LIBRARY_HREF, SkillSubtitle } from "@/components/lab/configure/shell"
import { focusField, useConfigure } from "@/components/lab/configure/use-configure"

/** Sections that live in the folded details. Issues in them open their fold before focus moves there. */
const IN_OUTCOMES = (i: RuleIssue) => i.section === "outcomes" && !["cfg-qualifying"].includes(i.field)
const IN_SIGNERS = (i: RuleIssue) => i.section === "signoff"

function Fold({ title, open, onOpenChange, children }: { title: string; open: boolean; onOpenChange: (o: boolean) => void; children: React.ReactNode }) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="border-t border-border pt-3">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="-ms-2 w-full justify-between" aria-expanded={open}>
          <span className="text-sm font-medium text-foreground">{title}</span>
          <i className={`fa-light ${open ? "fa-chevron-up" : "fa-chevron-down"} text-xs`} aria-hidden="true" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4 pb-2">{children}</CollapsibleContent>
    </Collapsible>
  )
}

export function AdminConfigureSkillC() {
  const params = useSearchParams()
  const many = React.useMemo(() => (params?.get("skills") ?? "").split(",").map((x) => x.trim()).filter(Boolean), [params])
  const m = useConfigure({ skillId: many[0] })
  const [showErrors, setShowErrors] = React.useState(false)
  const [outcomesOpen, setOutcomesOpen] = React.useState(false)
  const [signersOpen, setSignersOpen] = React.useState(false)
  const [checkOpen, setCheckOpen] = React.useState(params?.get("impact") === "open")
  const [manyDone, setManyDone] = React.useState<number | null>(null)
  const impact = useLiveImpact(m.state, m.skill, m.current, m.rule)

  React.useEffect(() => {
    setShowErrors(false)
    setOutcomesOpen(false)
    setSignersOpen(false)
    setManyDone(null)
  }, [m.skillId])

  const targets = React.useMemo(() => (many.length > 1 ? many.map((id) => skillById(m.state, id)).filter((k): k is NonNullable<typeof k> => !!k) : []), [many, m.state])

  if (!m.ready) return <ConfigureLoading />
  if (!m.skill) return <ConfigureNotFound skillId={m.skillId} />
  const skill = m.skill
  const isMany = targets.length > 1

  const props: SectionProps = { rule: m.rule, setRule: m.setRule, issues: m.issues, showErrors, settings: m.settings }
  const needsQuestionsFirst = (m.rule.model === "question" || m.rule.model === "scored") && m.rule.questions.filter((q) => q.trim()).length === 0
  const needsLevelsFirst = m.rule.model === "demonstration" && m.rule.levels.filter((l) => l.trim()).length < 2
  const outcomesInline = needsQuestionsFirst || needsLevelsFirst
  // While the summary lists the problems, field errors stay for screen readers only (say it once, rule L11).
  const quietErrors = showErrors && m.issues.length > 0 ? "[&_[data-slot=field-error]]:sr-only" : undefined

  const tryCheck = () => {
    setShowErrors(true)
    if (m.issues.length > 0) {
      if (m.issues.some(IN_OUTCOMES)) setOutcomesOpen(true)
      if (m.issues.some(IN_SIGNERS)) setSignersOpen(true)
      return
    }
    setCheckOpen(true)
  }

  const banner = m.published ? (
    <PublishedNotice skill={skill} result={m.published} onDismiss={m.dismissPublished} />
  ) : manyDone !== null ? (
    <div tabIndex={-1} ref={(el) => el?.focus()} className="outline-none" role="status">
      <LocalBanner variant="success" title={`${countSkills(manyDone)} published`} dismissible onDismiss={() => setManyDone(null)} action={{ label: "Open the library", href: LIBRARY_HREF }}>
        Each now uses this rule. Map them to courses from the library.
      </LocalBanner>
    </div>
  ) : showErrors && m.issues.length > 0 ? (
    <ValidationSummary title={`Fix ${m.issues.length} ${m.issues.length === 1 ? "problem" : "problems"} to publish`} issues={m.issues.map((i) => ({ fieldId: i.field, message: i.message }))} />
  ) : null

  // Footer: what the sentence touches (the sentence itself is the page, so it is not repeated here).
  // From 1400 px the single-skill count moves into the preview column (D-X29), so the footer hides it there.
  const footerSummary = isMany ? (
    <ManySummary state={m.state} ids={targets.map((t) => t.id)} rule={m.rule} />
  ) : (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground min-[1400px]:hidden">
      {impact && impact.withEvidence > 0 ? <span className="tabular-nums">{`Today ${fmt(impact.before.achieved)} of ${fmt(impact.students)} achieved`}</span> : <span>{`No evidence on this ${skillNoun()} yet.`}</span>}
      {impact?.ruleChanged && impact.changed.length > 0 ? (
        <StatusBadge label={`${impact.changed.length} students change`} tone={impact.lostAchieved > 0 ? "warning" : "neutral"} icon={impact.lostAchieved > 0 ? "fa-triangle-exclamation" : "fa-circle-info"} size="sm" />
      ) : null}
    </div>
  )

  const subtitle = isMany ? (
    <span>{`${targets.slice(0, 2).map((t) => t.name).join(", ")}${targets.length > 2 ? ` and ${targets.length - 2} more` : ""}`}</span>
  ) : (
    <SkillSubtitle state={m.state} skill={skill} />
  )

  return (
    <>
      <FormPage
        title={isMany ? `Configure ${countSkills(targets.length)}` : skill.name}
        subtitle={subtitle}
        actions={
          <div className="flex items-center gap-2">
            <CancelButton dirty={m.dirty} />
          </div>
        }
        banner={banner}
        // D-X29: what students and evaluators will see, beside the sentence from 1400 px. The sentence is the page, so the column
        // does not repeat it.
        aside={<RulePreviewAside skillName={isMany ? targets[0]?.name ?? skill.name : skill.name} rule={m.rule} impact={isMany ? null : impact} showRule={false} />}
        footer={<StickyFooter summary={footerSummary} primary={m.published || manyDone !== null ? undefined : { label: isMany ? `Check ${countSkills(targets.length)}` : "Check and publish", onClick: tryCheck }} />}
      >
        <div className={cn("flex flex-col gap-6", quietErrors)} data-region="sentence">
          <ModelSection {...props} columns={4} legend={isMany ? `How are these ${skillNounPlural()} evaluated?` : undefined} />
          {!m.rule.model ? (
            <p className="text-sm text-muted-foreground">Choose how it&apos;s judged. The sentence then shows what that choice can ask for.</p>
          ) : (
            <>
              {outcomesInline ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-foreground">{needsLevelsFirst ? "Name at least two levels first. The rule refers to them." : "Write the questions first. The rule refers to them."}</p>
                  <OutcomesSection {...props} />
                </div>
              ) : null}
              <div className="flex flex-col gap-2">
                <h2 className="text-sm font-medium text-foreground">{HOW_MANY_LABEL}</h2>
                {!hasNeed(m.rule) ? <p className="text-sm text-muted-foreground" data-empty-need>Your program sets this number. Nothing is filled in for you.</p> : null}
                <SentenceBuilder rule={m.rule} setRule={m.setRule} issues={m.issues} showErrors={showErrors} settings={m.settings} />
                <p className="text-sm text-muted-foreground">{settingNote(m.rule) || "Lab and simulation never count toward a setting minimum."}</p>
                {carriedNotes(m.rule).length ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" data-carried>
                    <span>{`Kept from the current rule: ${carriedNotes(m.rule).join(" ")}`}</span>
                    <ProposedBadge note="From an earlier prototype; still changes counts today." />
                    <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => m.setRule((r) => ({ ...r, carried: { window: null, minLevelIndex: null, simulationCapPercent: null, simulationExcluded: false } }))}>
                      Remove
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
        {m.rule.model ? (
          <div className={cn("flex flex-col gap-2", quietErrors)} data-region="details">
            {outcomesInline ? null : (
              <Fold title={outcomesLabel(m.rule.model)} open={outcomesOpen} onOpenChange={setOutcomesOpen}>
                <OutcomesSection {...props} />
              </Fold>
            )}
            <Fold title="Who signs and what the student adds" open={signersOpen} onOpenChange={setSignersOpen}>
              <SignOffSection {...props} />
            </Fold>
          </div>
        ) : null}
      </FormPage>
      {isMany ? (
        <PublishManyDialog
          open={checkOpen}
          onOpenChange={setCheckOpen}
          state={m.state}
          ids={targets.map((t) => t.id)}
          rule={m.rule}
          onPublish={() => {
            setCheckOpen(false)
            setManyDone(targets.length)
          }}
        />
      ) : (
        <PublishDialog
          open={checkOpen}
          onOpenChange={setCheckOpen}
          skill={skill}
          current={m.current}
          rule={m.rule}
          impact={impact}
          onPublish={(mode) => {
            m.publish(mode)
            setCheckOpen(false)
          }}
        />
      )}
    </>
  )
}

function ManySummary({ state, ids, rule }: { state: V2State; ids: string[]; rule: LabRule }) {
  const rows = React.useMemo(() => (rule.model ? bulkImpact(state, ids, rule) : []), [state, ids, rule])
  const inUse = rows.filter((r) => r.published)
  const students = inUse.reduce((n, r) => n + r.changed, 0)
  return (
    <p className="text-muted-foreground">
      {`Applies to ${countSkills(ids.length)}. ${inUse.length === 0 ? "None is in use yet." : `${inUse.length} in use; ${students} students change.`}`}
    </p>
  )
}

/** One check for many skills: one row per skill, and the evidence choice asked once for all (02 open point 6). */
function PublishManyDialog({ open, onOpenChange, state, ids, rule, onPublish }: { open: boolean; onOpenChange: (o: boolean) => void; state: V2State; ids: string[]; rule: LabRule; onPublish: (mode: PublishMode | null) => void }) {
  const [mode, setMode] = React.useState<PublishMode | null>(null)
  const [tried, setTried] = React.useState(false)
  React.useEffect(() => {
    if (open) {
      setMode(null)
      setTried(false)
    }
  }, [open])
  const rows = React.useMemo(() => bulkImpact(state, ids, rule), [state, ids, rule])
  const changing = rows.filter((r) => r.published && r.changed > 0)
  const choice = changing.length > 0
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{`Publish ${countSkills(ids.length)}?`}</DialogTitle>
          <DialogDescription>{choice ? `${changing.reduce((n, r) => n + r.changed, 0)} students change status across ${countSkills(changing.length)}.` : "Nobody's status changes."}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <Table containerClassName="max-h-72 overflow-y-auto rounded-md border border-border" scrollLabel={`Students who change, per ${skillNoun()}`}>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{skillNoun().charAt(0).toUpperCase() + skillNoun().slice(1)}</TableHead>
                <TableHead scope="col" className="text-end">
                  Students who change
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.skillId}>
                  <TableCell className="whitespace-normal">{r.name}</TableCell>
                  <TableCell className="text-end tabular-nums">{r.published ? r.changed : "Not in use"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {choice ? <EvidenceChoice value={mode} onChange={setMode} error={tried && !mode ? EVIDENCE_CHOICE_MISSING : undefined} /> : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" size="default" onClick={() => onOpenChange(false)}>
            Keep editing
          </Button>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => {
              if (choice && !mode) {
                setTried(true)
                requestAnimationFrame(() => focusField("cfg-mode"))
                return
              }
              onPublish(choice ? mode : null)
            }}
          >
            {`Publish ${countSkills(ids.length)}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
