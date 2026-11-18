"use client"

/**
 * Evaluation settings J, "Summary first" (Proposed, D-EM1116-f; contract ADMIN-D3 "round 5 variants"). Romit 2026-11-16 on G's dialog:
 * "is this the best ui you got, where you are showing a popup?"
 *
 * A method opens on its own page and reads as plain words in quiet blocks: its name, its type, what the evaluator picks and what moves a
 * student forward, who can evaluate, what each evaluation needs, group check-off. Each block has an Edit link that turns only that block into
 * fields, with Save and Cancel in place (progressive disclosure, task frequency: opened mostly to check; error prevention: nothing is editable
 * until asked for). Change type opens the four types and the criteria together, since a new type rebuilds them [REQ SC-09, SC-17]. A new method
 * has nothing to summarise: the four types, then every field with one Create method. The list is the table of G.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageFrame } from "@/components/skills/page-header"
import { TYPE } from "@/components/lab/type-scale"
import { StickyFooter } from "@/components/lab/layout/sticky-footer"
import { BackTitle } from "@/components/lab/shared/return-link"
import { ResultBanner, type ResultBannerValue } from "@/components/lab/shared/result-banner"
import { UnsavedChangesGuard } from "@/components/lab/shared/unsaved-guard"
import { CHECKOFF_GRANT_LABEL } from "@/components/lab/configure/fields"
import { ProgramPreviewDialog } from "@/components/lab/configure/settings-dialogs"
import { focusField } from "@/components/lab/configure/use-configure"
import { CheckOffField, EditorColumns, LoadingBlock, MethodDraft, MethodsTable, NEEDS, NEEDS_LABEL, NEW, NameFields, NeedsField, NoMethods, ProblemsLink, ROLES_LABEL, RolesField, SETTINGS_TITLE, SettingsHome, TypeBody, TypeTiles, UsedBy, checkOffCountsAs, useAskDiscard, useMethodNav, useOpenMethod, withCarried, type MethodModel } from "@/components/lab/methods/method-parts"
import { LAB_MODEL_LABEL, ROLE_LABEL, ROLES, countsFromIndex, ruleAllowsCheckOff, type LabRule } from "@/lib/lab/configure"
import { checkOffLevelIndex } from "@/lib/lab/checkoff-rules"
import { passChip } from "@/lib/lab/rule-path"
import { methodsOf, type EvaluationMethod } from "@/lib/lab/methods"
import { useV2State } from "@/lib/v2/react"
import { inSentence } from "@/lib/lab/terms"

type BlockId = "name" | "type" | "picks" | "who" | "needs" | "checkoff"

/** The block a problem lives in, so a failed Save can open it. */
function blockOf(field: string): BlockId {
  if (field.startsWith("cfg-role")) return "who"
  if (field.startsWith("cfg-checkoff")) return "checkoff"
  if (field === "cfg-self" || field === "cfg-feedback" || field === "cfg-approval") return "needs"
  if (field === "cfg-model") return "type"
  return "picks"
}

const PICKS_LABEL: Record<NonNullable<LabRule["model"]>, string> = { demonstration: "Levels", binary: "Outcomes", question: "Questions", scored: "Questions" }
const SHOWN = 6

/** Whether an answer moves a student forward: glyph and word, neutral (it is a fact, not a warning). */
function Moves({ yes }: { yes: boolean }) {
  return yes ? (
    <span className="flex shrink-0 items-center gap-1.5 text-sm text-foreground"><i className="fa-light fa-check" aria-hidden="true" />Moves forward</span>
  ) : (
    <span className="shrink-0 text-sm text-muted-foreground">Does not</span>
  )
}

/** What the evaluator picks and what moves a student forward, as text [REQ SC-17]. */
function PicksSummary({ rule }: { rule: LabRule }) {
  if (rule.model === "demonstration" || rule.model === "binary") {
    const from = rule.model === "demonstration" ? countsFromIndex(rule) : null
    const rows = rule.model === "demonstration"
      ? rule.levels.map((l, i) => ({ label: l.trim(), yes: from !== null && i >= from })).filter((r) => r.label).reverse()
      : rule.outcomeLabels.map((l, i) => ({ label: l.trim(), yes: rule.qualifyingLabel === i })).filter((r) => r.label)
    return (
      <ul className="flex max-w-xl flex-col" data-picks-summary>
        {rows.map((r) => (
          <li key={r.label} className="flex min-h-8 items-center justify-between gap-4 text-sm">
            <span className="min-w-0 break-words">{r.label}</span>
            <Moves yes={r.yes} />
          </li>
        ))}
      </ul>
    )
  }
  const questions = rule.questions.map((q) => q.trim()).filter(Boolean)
  const pass = passChip(rule)?.text
  return (
    <div className="flex max-w-xl flex-col gap-3" data-picks-summary>
      <ol className="flex list-decimal flex-col gap-1 ps-5 text-sm">
        {questions.slice(0, SHOWN).map((q, i) => <li key={i} className="break-words">{q}</li>)}
      </ol>
      {questions.length > SHOWN ? <p className={TYPE.helper}>{`and ${questions.length - SHOWN} more`}</p> : null}
      {rule.model === "scored" ? <p className="text-sm">{`Each scored 1 to ${rule.scaleMax}`}</p> : null}
      <p className="text-sm">{pass ? `Moves forward when: ${inSentence(pass)}` : "What moves a student forward is not set"}</p>
    </div>
  )
}

function checkOffSummary(rule: LabRule): string {
  if (!ruleAllowsCheckOff(rule)) return "Off"
  if (rule.model === "demonstration") {
    const level = rule.levels[checkOffLevelIndex(rule.levels, rule.checkOff?.levelIndex)]?.trim()
    return level ? `On. ${CHECKOFF_GRANT_LABEL} ${inSentence(level)}.` : "On"
  }
  if (rule.model === "scored" && typeof rule.checkOff?.score === "number") return `On. ${CHECKOFF_GRANT_LABEL} a score of ${rule.checkOff.score}.`
  if (rule.model === "scored") return "On"
  return `On. ${CHECKOFF_GRANT_LABEL} ${checkOffCountsAs(rule)}.`
}

/** One quiet block: a muted label, the value as text, and the link that turns it into fields. While editing, the fields carry their own labels. */
function Block({ id, label, action = "Edit", editing, onEdit, children, fields, bar }: {
  id: BlockId
  label: string
  action?: string
  editing: boolean
  onEdit: () => void
  /** The value, as text. */
  children: React.ReactNode
  fields: React.ReactNode
  /** Save and Cancel, in place. A block whose Save sits in the next block (Type) passes none. */
  bar?: React.ReactNode
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2 border-b border-border py-4 first:pt-0 last:border-b-0" aria-labelledby={`block-${id}`} data-block={id} data-editing={editing || undefined}>
      <div className={cn("flex items-baseline justify-between gap-3", editing && "sr-only")}>
        <p id={`block-${id}`} className={TYPE.helper}>{label}</p>
        {editing ? null : (
          <Button type="button" variant="link" size="sm" className="h-auto min-h-6 shrink-0 px-0 py-0.5 font-normal" onClick={onEdit} aria-label={`${action}: ${label}`} data-edit-block={id}>{action}</Button>
        )}
      </div>
      {editing ? <div className="@container flex min-w-0 flex-col gap-4">{fields}{bar}</div> : <div className="min-w-0 text-sm text-foreground">{children}</div>}
    </section>
  )
}

function Summary({ m, backHref }: { m: MethodModel; backHref: string }) {
  const [editing, setEditing] = React.useState<BlockId | null>(null)
  const discard = useAskDiscard()
  const { rule, method } = m
  if (!method || !rule.model) return null
  // One block at a time: another Edit with unsaved work asks first, then starts from what is saved.
  const start = (b: BlockId) => discard.ask(m.dirty, () => { m.reset(); setEditing(b) })
  const cancel = () => { m.reset(); setEditing(null) }
  const save = () => {
    const r = m.save()
    if (r === "name" && editing !== "name") setEditing("name")
    if (r === "rule" && m.issues[0]) {
      // A problem outside the open block (a new type leaves the check-off level behind): open where it lives. The draft stays.
      const b = blockOf(m.issues[0].field)
      const field = m.issues[0].field
      if (b !== editing && !(editing === "type" && b === "picks")) { setEditing(b); requestAnimationFrame(() => requestAnimationFrame(() => focusField(field))) }
    }
  }
  const bar = (
    <div className="flex flex-wrap items-center gap-2" data-block-bar>
      <Button type="button" variant="default" size="sm" onClick={save} data-save-method>Save</Button>
      <Button type="button" variant="outline" size="sm" onClick={cancel}>Cancel</Button>
      <span aria-live="assertive" aria-atomic="true"><ProblemsLink m={m} /></span>
    </div>
  )
  const picksOpen = editing === "picks" || editing === "type"
  const roles = ROLES.filter((r) => rule.evaluatorRoles.includes(r))
  const needs = NEEDS.filter((n) => rule[n.key])
  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" data-page-type="detail" data-method-page>
      <PageFrame title={<BackTitle href={backHref} label={`Back to ${SETTINGS_TITLE}`}>{method.name}</BackTitle>} className="flex-1" actions={<ProgramPreviewDialog draft={withCarried(rule)} />}>
        <div className="grid min-w-0 items-start lg:grid-cols-[minmax(0,1fr)_22rem]" data-method-summary>
          <div className="flex min-w-0 flex-col lg:pe-8">
            {/* The name is the page's title, said once: this block reads the description and opens both fields. */}
            <Block id="name" label="Name and description" editing={editing === "name"} onEdit={() => start("name")} fields={<NameFields m={m} />} bar={bar}>
              {method.description ? <p className="break-words">{method.description}</p> : <p className="text-muted-foreground">No description</p>}
            </Block>
            <Block id="type" label="Type" action="Change type" editing={editing === "type"} onEdit={() => start("type")} fields={<TypeTiles m={m} />}>
              <p className="flex flex-wrap items-center gap-x-2">
                <span data-type-name>{LAB_MODEL_LABEL[rule.model]}</span>
                <span className="text-muted-foreground" aria-hidden="true">·</span>
                <span className="text-muted-foreground"><UsedBy method={method} linked={!m.dirty} /></span>
              </p>
            </Block>
            <Block id="picks" label={PICKS_LABEL[rule.model]} editing={picksOpen} onEdit={() => start("picks")} fields={<TypeBody m={m} />} bar={bar}>
              <PicksSummary rule={rule} />
            </Block>
          </div>
          <div className="flex min-w-0 flex-col max-lg:border-t max-lg:border-border max-lg:pt-4 lg:border-s lg:border-border lg:ps-8">
            <Block id="who" label={ROLES_LABEL} editing={editing === "who"} onEdit={() => start("who")} fields={<RolesField m={m} />} bar={bar}>
              {roles.length ? <ul className="flex flex-col gap-1">{roles.map((r) => <li key={r}>{ROLE_LABEL[r]}</li>)}</ul> : <p className="text-muted-foreground">Nobody yet</p>}
            </Block>
            <Block id="needs" label={NEEDS_LABEL} editing={editing === "needs"} onEdit={() => start("needs")} fields={<NeedsField m={m} />} bar={bar}>
              {needs.length ? <ul className="flex flex-col gap-1">{needs.map((n) => <li key={n.id}>{n.label}</li>)}</ul> : <p className="text-muted-foreground">Only the evaluator&apos;s answer</p>}
            </Block>
            <Block id="checkoff" label="Group check-off" editing={editing === "checkoff"} onEdit={() => start("checkoff")} fields={<CheckOffField m={m} />} bar={bar}>
              <p className="break-words" data-checkoff-summary>{checkOffSummary(rule)}</p>
            </Block>
          </div>
        </div>
      </PageFrame>
      <UnsavedChangesGuard dirty={m.dirty} onDiscard={() => { m.reset(); setEditing(null) }} />
      {discard.question}
    </div>
  )
}

/** A new method: the four types, then every field with one Create method [REQ SC-02]. */
function Create({ m, backHref, onLeave }: { m: MethodModel; backHref: string; onLeave: () => void }) {
  const discard = useAskDiscard()
  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" data-page-type="form" data-method-page>
      <PageFrame title={<BackTitle href={backHref} label={`Back to ${SETTINGS_TITLE}`}>New method</BackTitle>} className="flex-1">
        <div className="grid min-w-0 flex-1 items-start">
          <div className="@container flex min-w-0 flex-col gap-6" data-region="method-new">
            <TypeTiles m={m} />
            {m.rule.model ? <EditorColumns m={m} /> : null}
          </div>
        </div>
        <StickyFooter
          context={<ProblemsLink m={m} />}
          secondary={{ label: "Cancel", onClick: () => discard.ask(m.dirty, () => { m.reset(); onLeave() }) }}
          primary={{ label: "Create method", onClick: () => { m.save() } }}
        />
      </PageFrame>
      <UnsavedChangesGuard dirty={m.dirty} onDiscard={m.reset} />
      {discard.question}
    </div>
  )
}

export function AdminEvaluationSettingsJ() {
  const state = useV2State()
  const nav = useMethodNav()
  const { open, missing, hydrated } = useOpenMethod(nav.id)
  const [banner, setBanner] = React.useState<ResultBannerValue | null>(null)
  const [version, setVersion] = React.useState(0)
  const count = React.useMemo(() => methodsOf(state).length, [state])
  if (nav.id && !hydrated) return <div className="p-6"><LoadingBlock /></div>
  if (open) {
    const method: EvaluationMethod | null = open === NEW ? null : open
    const onSaved = (b: ResultBannerValue, id: string | null) => {
      setBanner(b)
      if (!id) return
      // The page stays: the block closes and the summary reads the saved method.
      setVersion((v) => v + 1)
      if (id !== nav.id) nav.go(nav.href(id))
    }
    return (
      <>
        {banner ? <ResultBanner banner={banner} onDismiss={() => setBanner(null)} /> : null}
        <MethodDraft key={`${method?.id ?? NEW}:${version}`} method={method} onSaved={onSaved}>
          {(m) => (method && m.saved?.model ? <Summary m={m} backHref={nav.href(null)} /> : <Create m={m} backHref={nav.href(null)} onLeave={nav.close} />)}
        </MethodDraft>
      </>
    )
  }
  return (
    <SettingsHome banner={banner} setBanner={setBanner} missing={missing}>
      {count ? <MethodsTable setBanner={setBanner} /> : <NoMethods href={nav.href(NEW)} />}
    </SettingsHome>
  )
}
