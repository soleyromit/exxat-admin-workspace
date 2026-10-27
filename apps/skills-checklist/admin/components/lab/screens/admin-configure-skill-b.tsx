"use client"

/**
 * Configure a skill, option set 2 "One page" (template T3 form, full width per D-X30). The same five parts as set 1 on one
 * page, with a sticky row of section anchors at the top, the live Preview panel beside the page from 1280 px and the rule
 * sentence in the footer below that. Tests whether an expert re-configuring a skill moves faster without steps.
 * Save model (decision D-X31): "Save draft" in the footer keeps the edits without changing the skill's status; Close asks before
 * leaving with unsaved edits. The last section, Check (decision D-X32, layout "checklist"), answers the same four questions as
 * set 1: the issue summary, one row per part with a done or to-fix glyph and Edit (scrolls up to it), who it affects, and the two
 * views (in the Preview panel from 1280 px, inline below). "Save configuration" ("Save changes" on a configured skill) stays
 * disabled, with its reason, until nothing is missing; after saving the page becomes the receipt.
 *
 * URL: ?skill= · ?section=check (opens at Check) · ?change=sample · ?state=loading. Listens for `lab:reset`.
 */
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { FormPage, StickyFooter } from "@/components/lab/layout"
import { CONFIGURE_STEPS, configureStepHead, outcomesLabel, saveLabRule, type ConfigureStepId, type PublishMode, type RuleIssue } from "@/lib/lab/configure"
import { DEMO_TODAY, IDS } from "@/lib/v2/seed-core"
import { useV2Store } from "@/lib/v2/react"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { SECTION_BODY, type SectionProps } from "@/components/lab/configure/fields"
import { ConfigSection } from "@/components/lab/configure/section"
import { RuleFooterSummary, RulePreviewAside } from "@/components/lab/configure/live-panel"
import { EVIDENCE_CHOICE_MISSING, needsEvidenceChoice, useLiveImpact } from "@/components/lab/configure/impact"
import { ConfigureReceiptPage, DecisionPanel, PeopleSee, saveBlockedReason, SetupSummary, useMinWidth, WhoItAffects } from "@/components/lab/configure/check"
import { BulkApplySheet, CopyFromDialog } from "@/components/lab/configure/bulk-apply"
import { ConfigureLoading, ConfigureNotFound, LeaveButton, SkillTitle } from "@/components/lab/configure/shell"
import { focusField, useConfigure } from "@/components/lab/configure/use-configure"

const anchor = (id: ConfigureStepId) => `cfg-sec-${id}`

function scrollToSection(id: ConfigureStepId) {
  const el = document.getElementById(anchor(id))
  if (!el) return
  el.scrollIntoView({ block: "start" })
  const h = document.getElementById(`${anchor(id)}-title`)
  h?.focus({ preventScroll: true })
}

function SectionNav({ active, labels, counts }: { active: ConfigureStepId; labels: Record<ConfigureStepId, string>; counts: Partial<Record<ConfigureStepId, number>> }) {
  return (
    <nav aria-label="Sections" className="sticky top-0 z-10 -mx-1 border-b border-border bg-background px-1 py-2" data-region="section-nav">
      <ul className="flex gap-1 overflow-x-auto">
        {CONFIGURE_STEPS.map((s) => (
          <li key={s.id} className="shrink-0">
            <Button asChild variant="ghost" size="sm" className={cn("gap-2", active === s.id && "bg-muted text-foreground")}>
              <a
                href={`#${anchor(s.id)}`}
                aria-current={active === s.id ? "location" : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection(s.id)
                }}
              >
                {labels[s.id]}
                {counts[s.id] ? <Badge variant="outline">{`${counts[s.id]} to fix`}</Badge> : null}
              </a>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function AdminConfigureSkillB() {
  const m = useConfigure()
  const store = useV2Store()
  const params = useSearchParams()
  const askedSection = params?.get("section")
  const [showErrors, setShowErrors] = React.useState(false)
  const [mode, setMode] = React.useState<PublishMode | null>(null)
  const [modeTried, setModeTried] = React.useState(false)
  const [copyOpen, setCopyOpen] = React.useState(false)
  const [bulkOpen, setBulkOpen] = React.useState(false)
  const [note, setNote] = React.useState<string | null>(null)
  const [active, setActive] = React.useState<ConfigureStepId>("model")
  const impact = useLiveImpact(m.state, m.skill, m.current, m.rule)
  // From 1280 px the decision panel takes the side column while Check is in view; below that it sits inside Check. One render.
  const wide = useMinWidth(1280)

  React.useEffect(() => {
    setShowErrors(false)
    setNote(null)
    setMode(null)
    setModeTried(false)
  }, [m.skillId])

  const ready = m.ready && !!m.skill
  React.useEffect(() => {
    if (!ready) return
    const els = CONFIGURE_STEPS.map((s) => document.getElementById(anchor(s.id))).filter((x): x is HTMLElement => !!x)
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (vis) setActive(vis.target.id.replace("cfg-sec-", "") as ConfigureStepId)
      },
      { rootMargin: "0px 0px -60% 0px" },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [ready])

  // Check in view (any part of it in the top 70% of the viewport): drives the side column swap to the decision panel.
  const [checkInView, setCheckInView] = React.useState(false)
  React.useEffect(() => {
    if (!ready) return
    const el = document.getElementById(anchor("check"))
    if (!el) return
    const io = new IntersectionObserver(([e]) => setCheckInView(!!e?.isIntersecting), { rootMargin: "0px 0px -30% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [ready])
  React.useEffect(() => {
    if (checkInView) setShowErrors(true)
  }, [checkInView])

  React.useEffect(() => {
    if (ready && askedSection === "check") requestAnimationFrame(() => scrollToSection("check"))
  }, [ready, askedSection])
  // Field errors show once the admin reaches Check (or opened the page there): the page is read top to bottom first.
  React.useEffect(() => {
    if (active === "check") setShowErrors(true)
  }, [active])

  if (!m.ready) return <ConfigureLoading />
  if (!m.skill) return <ConfigureNotFound skillId={m.skillId} />
  const skill = m.skill
  if (m.saved) return <ConfigureReceiptPage state={m.state} skill={skill} result={m.saved} layout="checklist" nextSkill={m.nextSkill} />

  const choice = needsEvidenceChoice(m.current, impact)
  const counts: Partial<Record<ConfigureStepId, number>> = {}
  if (showErrors) for (const i of m.issues) counts[i.section] = (counts[i.section] ?? 0) + 1
  const labels = Object.fromEntries(CONFIGURE_STEPS.map((s) => [s.id, s.id === "outcomes" ? outcomesLabel(m.rule.model) : s.label])) as Record<ConfigureStepId, string>
  const props: SectionProps = { rule: m.rule, setRule: m.setRule, issues: m.issues, showErrors, settings: m.settings, legendHidden: true }

  const save = () => {
    if (m.issues.length > 0) return
    if (choice && !mode) {
      setModeTried(true)
      scrollToSection("check")
      requestAnimationFrame(() => focusField("cfg-mode"))
      return
    }
    m.save(choice ? mode : null)
  }
  const goToIssue = (i: RuleIssue) => {
    setShowErrors(true)
    requestAnimationFrame(() => focusField(i.field))
  }
  const blocked = saveBlockedReason(m.issues, choice, mode)
  const onCheck = checkInView || active === "check"
  const decisions = (
    <DecisionPanel
      issues={m.issues}
      onFix={goToIssue}
      choiceAsked={choice}
      mode={mode}
      onMode={setMode}
      modeError={modeTried && !mode ? EVIDENCE_CHOICE_MISSING : undefined}
      affects={<WhoItAffects state={m.state} skill={skill} current={m.current} rule={m.rule} impact={impact} mode={mode} lead="people" />}
    />
  )

  // The issue summary lives in Check (question 2), not under the title, so the page does not say it twice.
  const banner = note ? (
    <LocalBanner variant="info" dismissible onDismiss={() => setNote(null)}>
      {note}
    </LocalBanner>
  ) : null

  return (
    <>
      <FormPage
        title={<SkillTitle state={m.state} skill={skill} />}
        actions={
          <div className="flex items-center gap-2">
            <LeaveButton dirty={m.dirty} skillId={skill.id} onSaveDraft={() => m.saveDraft(active)} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="More actions">
                  <i className="fa-light fa-ellipsis" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setCopyOpen(true)}>{`Copy from another ${skillNoun()}`}</DropdownMenuItem>
                <DropdownMenuItem disabled={!m.rule.model} onSelect={() => setBulkOpen(true)}>{`Apply to other ${skillNounPlural()}`}</DropdownMenuItem>
                {m.draft ? <DropdownMenuItem onSelect={() => m.discardDraft()}>Discard draft</DropdownMenuItem> : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        banner={banner}
        // D-X29/D-X30: the live preview panel beside the page from 1280 px; Check uses it too (its own tabs are narrow only).
        // Layout "checklist" (redesign 2026-10-27): while Check is in view the side column becomes the sticky decision panel.
        aside={onCheck && wide ? decisions : <RulePreviewAside skillName={skill.name} rule={m.rule} impact={impact} onSeeChange={() => scrollToSection("check")} />}
        footer={
          <StickyFooter
            summary={<RuleFooterSummary skillName={skill.name} rule={m.rule} impact={impact} onSeeChange={() => scrollToSection("check")} asideWide />}
            context={m.draft && !m.dirty ? "Draft saved." : undefined}
            secondary={{ label: "Save draft", onClick: () => m.saveDraft(active) }}
            primary={{ label: m.current ? "Save changes" : "Save configuration", onClick: save, disabled: !!blocked, disabledReason: blocked }}
          />
        }
      >
        <SectionNav active={active} labels={labels} counts={counts} />
        {CONFIGURE_STEPS.map((s, i) => {
          const head = configureStepHead(s.id, m.rule.model, m.issues.length === 0)
          return (
            // One section style for every part (Romit 2026-10-27, "need a good and proper content hierarchy"): numbered
            // question title, one optional fact line, the fields. The short label stays in the anchor row above.
            <ConfigSection key={s.id} n={i + 1} first={i === 0} id={anchor(s.id)} title={head.title} lead={head.lead}>
              {s.id === "check" ? (
                // Layout "checklist": the review table of choices; the decision panel (to fix, the evidence choice, who it
                // affects) is the side column from 1280 px and sits first here below that; the two views follow.
                <div className="@container flex flex-col gap-6" data-check-layout="checklist">
                  {wide ? null : decisions}
                  <SetupSummary rule={m.rule} current={m.current} issues={m.issues} layout="checklist" onEdit={(step) => scrollToSection(step)} />
                  {m.rule.model ? <PeopleSee skillName={skill.name} rule={m.rule} /> : null}
                </div>
              ) : (
                SECTION_BODY[s.id](props)
              )}
            </ConfigSection>
          )
        })}
      </FormPage>
      <CopyFromDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        state={m.state}
        skillId={m.skillId}
        onCopy={(rule, name) => {
          m.setRule(rule)
          setNote(`Copied from ${name}. Check each section before saving.`)
        }}
      />
      <BulkApplySheet
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        state={m.state}
        skillId={m.skillId}
        rule={m.rule}
        blocked={m.issues.length > 0}
        onApplied={(x) => {
          // Saved to each skill picked, each with its own rule version (decision D-X31) [REQ IM-14].
          const at = `${DEMO_TODAY}T${new Date().toISOString().slice(11, 19)}Z`
          store.update((s) => x.ids.reduce((acc, id) => {
            const r = saveLabRule(acc, id, m.rule, { at, byId: IDS.ross, mode: "reapply" })
            return r.ok && r.written ? r.state : acc
          }, s))
          setNote(`Configuration saved to ${x.skills} ${x.skills === 1 ? skillNoun() : skillNounPlural()}. They are configured and can be mapped.${x.configured ? ` ${x.configured} were already configured; ${x.students} students changed status.` : ""}`)
        }}
      />
    </>
  )
}
