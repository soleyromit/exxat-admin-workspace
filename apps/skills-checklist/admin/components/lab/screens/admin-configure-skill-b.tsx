"use client"

/**
 * Configure a skill, option set 2 "One page" (template T3 form; 02 section 4.6). The same five parts as set 1 on one 720 px
 * page, with a sticky row of section anchors at the top and the live rule sentence in the sticky footer. Tests whether an
 * expert re-configuring a skill moves faster without steps. Copy from another skill and apply to other skills sit in the
 * title overflow, not in the page. Errors show after the first Publish, summarised under the title with focus links.
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
import { FormPage, StickyFooter, ValidationSummary } from "@/components/lab/layout"
import { CONFIGURE_STEPS, outcomesLabel, type ConfigureStepId, type PublishMode } from "@/lib/lab/configure"
import { skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { SECTION_BODY, type SectionProps } from "@/components/lab/configure/fields"
import { RuleFooterSummary, RulePreviewAside } from "@/components/lab/configure/live-panel"
import { CheckPanel, EVIDENCE_CHOICE_MISSING, needsEvidenceChoice, PublishedNotice, useLiveImpact } from "@/components/lab/configure/impact"
import { BulkApplySheet, CopyFromDialog } from "@/components/lab/configure/bulk-apply"
import { CancelButton, ConfigureLoading, ConfigureNotFound, SkillSubtitle } from "@/components/lab/configure/shell"
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

  React.useEffect(() => {
    if (ready && askedSection === "check") requestAnimationFrame(() => scrollToSection("check"))
  }, [ready, askedSection])

  if (!m.ready) return <ConfigureLoading />
  if (!m.skill) return <ConfigureNotFound skillId={m.skillId} />
  const skill = m.skill

  const choice = needsEvidenceChoice(m.current, impact)
  const counts: Partial<Record<ConfigureStepId, number>> = {}
  if (showErrors) for (const i of m.issues) counts[i.section] = (counts[i.section] ?? 0) + 1
  const labels = Object.fromEntries(CONFIGURE_STEPS.map((s) => [s.id, s.id === "outcomes" ? outcomesLabel(m.rule.model) : s.id === "check" ? "Check and publish" : s.label])) as Record<ConfigureStepId, string>
  const props: SectionProps = { rule: m.rule, setRule: m.setRule, issues: m.issues, showErrors, settings: m.settings }

  const publish = () => {
    if (m.issues.length > 0) {
      setShowErrors(true)
      return
    }
    if (choice && !mode) {
      setModeTried(true)
      scrollToSection("check")
      requestAnimationFrame(() => focusField("cfg-mode"))
      return
    }
    m.publish(choice ? mode : null)
  }

  const banner = m.published ? (
    <PublishedNotice skill={skill} result={m.published} onDismiss={m.dismissPublished} />
  ) : showErrors && m.issues.length > 0 ? (
    <ValidationSummary title={`Fix ${m.issues.length} ${m.issues.length === 1 ? "problem" : "problems"} to publish`} issues={m.issues.map((i) => ({ fieldId: i.field, message: i.message }))} />
  ) : note ? (
    <LocalBanner variant="info" dismissible onDismiss={() => setNote(null)}>
      {note}
    </LocalBanner>
  ) : null

  return (
    <>
      <FormPage
        title={skill.name}
        subtitle={<SkillSubtitle state={m.state} skill={skill} />}
        actions={
          <div className="flex items-center gap-2">
            <CancelButton dirty={m.dirty} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="More actions">
                  <i className="fa-light fa-ellipsis" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setCopyOpen(true)}>{`Copy from another ${skillNoun()}`}</DropdownMenuItem>
                <DropdownMenuItem disabled={!m.rule.model} onSelect={() => setBulkOpen(true)}>{`Apply to other ${skillNounPlural()}`}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
        banner={banner}
        // D-X29/D-X30: the live preview panel beside the page from 1280 px; Check uses it too (its own tabs are narrow only).
        aside={<RulePreviewAside skillName={skill.name} rule={m.rule} impact={impact} onSeeChange={() => scrollToSection("check")}  />}
        footer={
          <StickyFooter
            summary={<RuleFooterSummary skillName={skill.name} rule={m.rule} impact={impact} onSeeChange={() => scrollToSection("check")} asideWide />}
            context={m.published ? "No unpublished changes." : undefined}
            primary={m.published ? undefined : { label: "Publish", onClick: publish }}
          />
        }
      >
        <SectionNav active={active} labels={labels} counts={counts} />
        {!m.current ? <LocalBanner variant="info">{`Students cannot send this ${skillNoun()} and it cannot be mapped until it is published.`}</LocalBanner> : null}
        {CONFIGURE_STEPS.map((s) => (
          <section
            key={s.id}
            id={anchor(s.id)}
            aria-labelledby={`${anchor(s.id)}-title`}
            // While the summary lists the problems, field errors stay for screen readers only (say it once, rule L11).
            className={cn("flex scroll-mt-16 flex-col gap-4", showErrors && m.issues.length > 0 && "[&_[data-slot=field-error]]:sr-only")}
          >
            <h2 id={`${anchor(s.id)}-title`} tabIndex={-1} className="text-base font-semibold text-foreground outline-none">
              {labels[s.id]}
            </h2>
            {s.id === "check" ? (
              m.published ? null : (
                <CheckPanel previewColumn={false} skill={skill} current={m.current} rule={m.rule} impact={impact} mode={mode} onMode={setMode} modeError={modeTried && !mode ? EVIDENCE_CHOICE_MISSING : undefined} />
              )
            ) : (
              SECTION_BODY[s.id](props)
            )}
          </section>
        ))}
      </FormPage>
      <CopyFromDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        state={m.state}
        skillId={m.skillId}
        onCopy={(rule, name) => {
          m.setRule(rule)
          setNote(`Copied from ${name}. Check each section before publishing.`)
        }}
      />
      <BulkApplySheet
        open={bulkOpen}
        onOpenChange={setBulkOpen}
        state={m.state}
        skillId={m.skillId}
        rule={m.rule}
        onApplied={(x) => setNote(`Configuration applied to ${x.skills} ${x.skills === 1 ? skillNoun() : skillNounPlural()}.${x.inUse ? ` ${x.inUse} were in use; ${x.students} students changed status.` : ""}`)}
      />
    </>
  )
}
