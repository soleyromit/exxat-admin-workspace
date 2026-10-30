"use client"

/**
 * Configure a skill, option set 3 "Many at once" (template T3 form, full width per D-X30). Four numbered sections in one style
 * (2026-10-27): how it is judged, what the evaluator records, when it counts (for Approved or not, the rule is ONE editable
 * sentence plus a list of conditions), who signs. Works for one
 * skill or several (?skills=a,b,c from the library bulk bar "Configure together") [REQ IM-14].
 *
 * Save model (decision D-X31): "Save draft" keeps a single skill's edits without changing its status; Close asks before leaving
 * with unsaved edits. "Check" replaces the sentence with the Check view on the same page (decision D-X32, layout "ledger": built
 * for many skills): the issue summary, the setup in three compact columns with Edit (back to the sentence, the fold open), one
 * row per skill with its status now and after saving and the students who change (the impact groups for one skill), then the
 * two views side by side. "Save configuration" (or "Save n skills", "Save changes") writes the rule to every skill; the page then
 * becomes the receipt.
 *
 * URL: ?skill= or ?skills=a,b,c · ?impact=open (opens Check) · ?change=sample · ?state=loading. Listens for `lab:reset`.
 */
import { RulePreviewAside } from "@/components/lab/configure/live-panel"
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { FormPage, StickyFooter, ValidationSummary } from "@/components/lab/layout"
import { bulkImpact, configureStepHead, hasNeed, leftToConfigure, ruleMeaning, saveLabRuleToMany, type LabRule, type PublishMode, type RuleIssue, type SetupGroup } from "@/lib/lab/configure"
import { buildLibrary } from "@/lib/lab/library"
import type { V2State } from "@/lib/v2/types"
import { skillById } from "@/lib/v2/evidence-index"
import { fmt } from "@/lib/v2/format"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { useV2Store } from "@/lib/v2/react"
import { countSkills, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { ModelSection, OutcomesSection, RuleSection, SignOffSection, WithMeaning, type SectionProps } from "@/components/lab/configure/fields"
import { ConfigSection } from "@/components/lab/configure/section"
import { EVIDENCE_CHOICE_MISSING, needsEvidenceChoice, useLiveImpact } from "@/components/lab/configure/impact"
import { CheckSection, ConfigureReceiptPage, EvidenceDecision, ManyLedger, openDecisions, PeopleSee, Readiness, ReceiptFooter, saveBlockedReason, SavedBanner, SetupSummary, WhoItAffects } from "@/components/lab/configure/check"
import { BulkApplySheet, bulkAppliedNote, CopyFromDialog } from "@/components/lab/configure/bulk-apply"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { SentenceBuilder } from "@/components/lab/configure/sentence-builder"
import { ConfigureLoading, ConfigureNotFound, LeaveButton, SkillTitle } from "@/components/lab/configure/shell"
import { focusField, useConfigure } from "@/components/lab/configure/use-configure"

export function AdminConfigureSkillC() {
  const params = useSearchParams()
  const many = React.useMemo(() => (params?.get("skills") ?? "").split(",").map((x) => x.trim()).filter(Boolean), [params])
  const m = useConfigure({ skillId: many[0] })
  const store = useV2Store()
  const [showErrors, setShowErrors] = React.useState(false)
  const [checking, setChecking] = React.useState(params?.get("impact") === "open")
  const [mode, setMode] = React.useState<PublishMode | null>(null)
  const [modeTried, setModeTried] = React.useState(false)
  const [manyDone, setManyDone] = React.useState<{ ids: string[]; rule: LabRule } | null>(null)
  const [copyOpen, setCopyOpen] = React.useState(false)
  const [bulkOpen, setBulkOpen] = React.useState(false)
  const [note, setNote] = React.useState<string | null>(null)
  const impact = useLiveImpact(m.state, m.skill, m.current, m.rule)

  React.useEffect(() => {
    setShowErrors(false)
    setManyDone(null)
    setMode(null)
    setModeTried(false)
  }, [m.skillId])

  const targets = React.useMemo(() => (many.length > 1 ? many.map((id) => skillById(m.state, id)).filter((k): k is NonNullable<typeof k> => !!k) : []), [many, m.state])
  const manyRows = React.useMemo(() => (targets.length > 1 && m.rule.model ? bulkImpact(m.state, targets.map((t) => t.id), m.rule) : []), [targets, m.state, m.rule])
  const nextAfterMany = React.useMemo(() => {
    if (!manyDone) return null
    const done = new Set(manyDone.ids)
    return buildLibrary(m.state).find((r) => r.status === "not-configured" && !done.has(r.id)) ?? null
  }, [manyDone, m.state])

  if (!m.ready) return <ConfigureLoading />
  if (!m.skill) return <ConfigureNotFound skillId={m.skillId} />
  const skill = m.skill
  const isMany = targets.length > 1
  if (m.saved && !isMany) return <ConfigureReceiptPage state={m.state} skill={skill} result={m.saved} layout="ledger" nextSkill={m.nextSkill} />

  if (manyDone) {
    return (
      <FormPage
        title={`Configure ${countSkills(manyDone.ids.length)}`}
        subtitle={<span>{`${targets.slice(0, 2).map((t) => t.name).join(", ")}${targets.length > 2 ? ` and ${targets.length - 2} more` : ""}`}</span>}
        banner={<SavedBanner title={`${countSkills(manyDone.ids.length)} configured`} body="Each now uses this rule and can be mapped to courses." />}
        footer={<ReceiptFooter skillIds={manyDone.ids} nextSkill={nextAfterMany} left={leftToConfigure(m.state)} />}
      >
        <div className="@container flex flex-col gap-8" data-receipt>
          <CheckSection title="What was saved">
            <SetupSummary rule={manyDone.rule} layout="ledger" />
          </CheckSection>
          <CheckSection title="Who it reaches">
            <ManyLedger state={m.state} ids={manyDone.ids} rule={manyDone.rule} saved />
          </CheckSection>
          <PeopleSee skillName={targets[0]?.name ?? skill.name} rule={manyDone.rule} />
        </div>
      </FormPage>
    )
  }

  const props: SectionProps = { rule: m.rule, setRule: m.setRule, issues: m.issues, showErrors, settings: m.settings }
  // While the summary lists the problems, field errors stay for screen readers only (say it once, rule L11).
  const quietErrors = showErrors && m.issues.length > 0 ? "[&_[data-slot=field-error]]:sr-only" : undefined
  const choice = isMany ? manyRows.some((r) => r.configured && r.changed > 0) : needsEvidenceChoice(m.current, impact)
  const n = m.issues.length
  const blocked = saveBlockedReason(m.issues, choice, mode)
  const open = openDecisions(m.issues, choice, mode)
  const partsToFix = new Set(m.issues.map((i) => i.section)).size

  // Check always opens (redesign 2026-10-27): it is where what is left to fix is listed, each problem inside its card.
  const tryCheck = () => {
    setShowErrors(true)
    setChecking(true)
    window.scrollTo({ top: 0 })
  }
  // Edit from Check: back to the sections, focus on the part.
  const editGroup = (step: SetupGroup["step"]) => {
    setChecking(false)
    requestAnimationFrame(() => focusField(step === "model" ? "cfg-model" : step === "rule" ? "cfg-need" : step === "outcomes" ? "cfg-label-0" : "cfg-role-preceptor"))
  }
  const goToIssue = (i: RuleIssue) => {
    setChecking(false)
    setShowErrors(true)
    requestAnimationFrame(() => focusField(i.field))
  }

  const save = () => {
    if (n > 0) return
    if (choice && !mode) {
      setModeTried(true)
      requestAnimationFrame(() => focusField("cfg-mode"))
      return
    }
    if (!isMany) {
      m.save(choice ? mode : null)
      return
    }
    // Several at once [REQ IM-14]: the same rule is saved to each skill through the one-skill save path (saveLabRuleToMany), each
    // gets its own rule version. "New evidence only" is not decided, so it writes nothing (as for one skill).
    const ids = targets.map((t) => t.id)
    let written = ids
    if (mode !== "new-only") {
      const at = `${DEMO_TODAY}T${new Date().toISOString().slice(11, 19)}Z`
      store.update((s) => {
        const r = saveLabRuleToMany(s, ids, m.rule, { at, byId: IDS.ross, mode })
        written = r.written
        return r.written.length ? r.state : s
      })
    }
    setManyDone({ ids: written, rule: m.rule })
  }

  const banner = !checking && showErrors && n > 0 ? (
    <ValidationSummary title={`Fix ${n} ${n === 1 ? "problem" : "problems"} before saving`} issues={m.issues.map((i) => ({ fieldId: i.field, message: i.message }))} />
  ) : note && !checking ? (
    <LocalBanner variant="info" dismissible onDismiss={() => setNote(null)}>
      {note}
    </LocalBanner>
  ) : null

  const saveLabel = isMany ? `Save ${countSkills(targets.length)}` : m.current ? "Save changes" : "Save configuration"

  // Footer while editing: what the sentence touches (the sentence itself is the page, so it is not repeated here).
  // From 1280 px the single-skill count sits in the preview column (D-X30), so the footer hides it there.
  const footerSummary = isMany ? (
    <ManySummary state={m.state} ids={targets.map((t) => t.id)} rule={m.rule} />
  ) : (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground min-[1280px]:hidden">
      {impact && impact.withEvidence > 0 ? <span className="tabular-nums">{`Today ${fmt(impact.before.achieved)} of ${fmt(impact.students)} achieved`}</span> : <span>{`No evidence on this ${skillNoun()} yet.`}</span>}
      {impact?.ruleChanged && impact.changed.length > 0 ? (
        <StatusBadge label={`${impact.changed.length} students change`} tone={impact.lostAchieved > 0 ? "warning" : "neutral"} icon={impact.lostAchieved > 0 ? "fa-triangle-exclamation" : "fa-circle-info"} size="sm" />
      ) : null}
    </div>
  )
  const draftContext = !isMany && m.draft && !m.dirty ? "Draft saved." : undefined
  const saveDraft = isMany ? undefined : { label: "Save draft", onClick: () => m.saveDraft(checking ? "check" : null) }
  const footer = checking ? (
    <StickyFooter
      back={{ label: "Back to the rule", onClick: () => setChecking(false) }}
      context={draftContext}
      secondary={saveDraft}
      primary={{ label: saveLabel, onClick: save, disabled: !!blocked, disabledReason: blocked }}
    />
  ) : (
    <StickyFooter summary={footerSummary} context={draftContext} secondary={saveDraft} primary={{ label: isMany ? `Check ${countSkills(targets.length)}` : "Check", onClick: tryCheck }} />
  )

  const subtitle = isMany ? (
    <span>{`${targets.slice(0, 2).map((t) => t.name).join(", ")}${targets.length > 2 ? ` and ${targets.length - 2} more` : ""}`}</span>
  ) : undefined

  return (
    <>
    <FormPage
      title={isMany ? `Configure ${countSkills(targets.length)}` : <SkillTitle state={m.state} skill={skill} />}
      subtitle={subtitle}
      actions={
        <div className="flex items-center gap-2">
          <LeaveButton dirty={m.dirty} skillId={skill.id} onSaveDraft={() => m.saveDraft(checking ? "check" : null)} />
          {/* One action is a button, not a one-item menu (D-L8b, Romit 2026-10-30): several at once offers only Copy. */}
          {isMany ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setCopyOpen(true)}>{`Copy from another ${skillNoun()}`}</Button>
          ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="More actions">
                <i className="fa-light fa-ellipsis" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setCopyOpen(true)}>{`Copy from another ${skillNoun()}`}</DropdownMenuItem>
              {/* Several at once is this page's own mode (?skills=); one skill offers the same through the sheet [REQ IM-14]. */}
              {!isMany ? <DropdownMenuItem disabled={!m.rule.model} onSelect={() => setBulkOpen(true)}>{`Apply to other ${skillNounPlural()}`}</DropdownMenuItem> : null}
              {!isMany && m.draft ? <DropdownMenuItem onSelect={() => m.discardDraft()}>Discard draft</DropdownMenuItem> : null}
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      }
      banner={banner}
      // D-X30: what students and evaluators will see, beside the sentence from 1280 px. Check shows both views itself.
      // Check (SC-19): the student and evaluator views stay beside the review from 1280 px, so the admin reads what each person
      // will be asked next to who it affects, not only the impact (2026-10-30 review). Below 1280 px they follow inline.
      aside={checking ? (m.rule.model ? <PeopleSee skillName={isMany ? targets[0]?.name ?? skill.name : skill.name} rule={m.rule} /> : undefined) : <RulePreviewAside skillName={isMany ? targets[0]?.name ?? skill.name : skill.name} rule={m.rule} current={isMany ? undefined : m.current} impact={isMany ? null : impact} showRule={false} />}
      footer={footer}
    >
      {checking ? (
        // Layout "ledger" (redesign 2026-10-27): review cards, one per part, each problem inside its own card with Fix and the
        // cards with problems first; the evidence decision; who it affects (one row per skill when several); the two views.
        <div className="@container flex flex-col gap-8" data-check-layout="ledger">
          <CheckSection
            title={open > 0 ? `${partsToFix + (choice && !mode ? 1 : 0)} of ${4 + (choice ? 1 : 0)} parts need a decision` : "Every part is set"}
            badge={open === 0 ? <Readiness open={0} /> : undefined}
          >
            {/* The evidence choice is a part to decide too: first, at the width of one card. */}
            {choice ? <EvidenceDecision mode={mode} onMode={setMode} error={modeTried && !mode ? EVIDENCE_CHOICE_MISSING : undefined} /> : null}
            <SetupSummary rule={m.rule} current={isMany ? null : m.current} issues={m.issues} layout="ledger" onEdit={editGroup} onFix={goToIssue} />
          </CheckSection>
          <CheckSection title="Who it affects">
            {isMany ? (
              <ManyLedger state={m.state} ids={targets.map((t) => t.id)} rule={m.rule} />
            ) : (
              <WhoItAffects state={m.state} skill={skill} current={m.current} rule={m.rule} impact={impact} mode={mode} />
            )}
          </CheckSection>
          {m.rule.model ? <PeopleSee className="min-[1280px]:hidden" skillName={isMany ? targets[0]?.name ?? skill.name : skill.name} rule={m.rule} /> : null}
        </div>
      ) : (
        // Numbered sections, one style (Romit 2026-10-27, "need a good and proper content hierarchy"): how it is judged, what
        // the evaluator records, when it counts (the rule as one sentence plus conditions), who signs. Nothing folds.
        <div className={cn("flex flex-col gap-8", quietErrors)} data-region="sentence">
          <ConfigSection n={1} first title={isMany ? `How are these ${skillNounPlural()} judged?` : configureStepHead("model", m.rule.model).title} id="cfg-sec-model">
            <ModelSection {...props} legendHidden />
          </ConfigSection>
          {m.rule.model ? (
            <>
              <ConfigSection n={2} title={configureStepHead("outcomes", m.rule.model).title} id="cfg-sec-outcomes">
                <OutcomesSection {...props} legendHidden qualifyingInRule={m.rule.model === "binary"} />
              </ConfigSection>
              <ConfigSection n={3} title={configureStepHead("rule", m.rule.model).title} id="cfg-sec-rule">
                {m.rule.model === "binary" ? (
                  <WithMeaning meaning={ruleMeaning(m.rule)}>
                    <div className="flex flex-col gap-2">
                      {!hasNeed(m.rule) ? <p className="text-sm text-muted-foreground" data-empty-need>Your program sets this number.</p> : null}
                      <SentenceBuilder rule={m.rule} setRule={m.setRule} issues={m.issues} showErrors={showErrors} settings={m.settings} />
                    </div>
                  </WithMeaning>
                ) : (
                  <RuleSection {...props} />
                )}
              </ConfigSection>
              <ConfigSection n={4} title={configureStepHead("signoff", m.rule.model).title} lead={configureStepHead("signoff", m.rule.model).lead} id="cfg-sec-signoff">
                <SignOffSection {...props} />
              </ConfigSection>
            </>
          ) : null}
        </div>
      )}
    </FormPage>
        <CopyFromDialog
          open={copyOpen}
          onOpenChange={setCopyOpen}
          state={m.state}
          skillId={m.skillId}
          onCopy={(rule, name) => {
            m.setRule(rule)
            setChecking(false)
            setNote(`Copied from ${name}. Check the rule before saving.`)
          }}
        />
        <BulkApplySheet
          open={bulkOpen}
          onOpenChange={setBulkOpen}
          state={m.state}
          skillId={m.skillId}
          rule={m.rule}
          blocked={m.issues.length > 0}
          onApplied={(x) => setNote(bulkAppliedNote(x))}
        />

    </>
  )
}

function ManySummary({ state, ids, rule }: { state: V2State; ids: string[]; rule: LabRule }) {
  const rows = React.useMemo(() => (rule.model ? bulkImpact(state, ids, rule) : []), [state, ids, rule])
  const configured = rows.filter((r) => r.configured)
  const students = configured.reduce((n, r) => n + r.changed, 0)
  return (
    <p className="text-muted-foreground">
      {`Applies to ${countSkills(ids.length)}. ${configured.length === 0 ? "None is configured yet." : `${configured.length} already configured; ${students} students change.`}`}
    </p>
  )
}
