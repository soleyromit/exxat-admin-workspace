"use client"

/**
 * Evaluation settings N, "Describe in words" (a spike; Proposed, D-EM1116-g; contract ADMIN-D3 "round 6 variants").
 * Romit 2026-11-16, after choosing G: "is that all the options you have considered?"
 *
 * A method page with two views of one method side by side: a box of plain words and the structured form. Typing a description ("3 levels,
 * preceptor or faculty, self-evaluation first") and pressing Fill in the form fills the form from it. The reader is local and deterministic
 * (`lib/lab/method-words.ts`): no network, no model. It fills only what the words state, lists that under "Filled in" and lists what it could
 * not use under "Not used"; it never guesses a name, what moves a student forward or who evaluates [REQ SC-02, SC-03, SC-16].
 *
 * The form is always on the page and is the only thing Save reads: the description is a way to fill it, the form is the review, and a banner
 * says so after every fill. Edit (`?method=<id>`) opens with the saved method already in words, so a tweak can be typed or ticked. The words
 * follow the form while they are not being typed in. A description that names another type asks before it rebuilds [REQ SC-09]; filling
 * again over hand edits asks first. The list is the table of G.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Textarea } from "@exxatdesignux/ui/components/ui/textarea"
import { Field, FieldError, FieldLabel } from "@exxatdesignux/ui/components/ui/field"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@exxatdesignux/ui/components/ui/alert-dialog"
import { PageFrame } from "@/components/skills/page-header"
import { TYPE } from "@/components/lab/type-scale"
import { StickyFooter } from "@/components/lab/layout/sticky-footer"
import { LabLocalBanner as LocalBanner } from "@/components/lab/lab-bar/lab-banner"
import { BackTitle } from "@/components/lab/shared/return-link"
import { ResultBanner, type ResultBannerValue } from "@/components/lab/shared/result-banner"
import { UnsavedChangesGuard } from "@/components/lab/shared/unsaved-guard"
import { ProgramPreviewDialog } from "@/components/lab/configure/settings-dialogs"
import { EditorColumns, LoadingBlock, MethodDraft, MethodsTable, NEW, NoMethods, ProblemsLink, SETTINGS_TITLE, SettingsHome, TypeLine, TypeTiles, useAskDiscard, useMethodNav, useOpenMethod, withCarried, type MethodModel } from "@/components/lab/methods/method-parts"
import { LAB_MODEL_LABEL } from "@/lib/lab/configure"
import { describeMethod, parseMethodWords, type ParsedWords } from "@/lib/lab/method-words"
import { methodsOf, type EvaluationMethod } from "@/lib/lab/methods"
import { useV2State } from "@/lib/v2/react"
import { inSentence } from "@/lib/lab/terms"

const EXAMPLE = "3 levels, preceptor or faculty, self-evaluation first"

function Words({ m }: { m: MethodModel }) {
  const { rule } = m
  const described = React.useMemo(() => describeMethod(rule), [rule])
  const ruleKey = JSON.stringify(rule)
  const [words, setWords] = React.useState(described)
  /** The words and the form as they last agreed. While the words are untouched since, they follow the form. */
  const synced = React.useRef({ words: described, rule: ruleKey })
  const typed = words !== synced.current.words
  React.useEffect(() => {
    if (typed || synced.current.rule === ruleKey) return
    synced.current = { words: described, rule: ruleKey }
    setWords(described)
  }, [typed, described, ruleKey])
  const [result, setResult] = React.useState<Pick<ParsedWords, "filled" | "unused"> | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [ask, setAsk] = React.useState<{ kind: "type" | "edits"; parsed: ParsedWords } | null>(null)

  const apply = (parsed: ParsedWords) => {
    setAsk(null)
    m.setRule(() => parsed.rule)
    setResult({ filled: parsed.filled, unused: parsed.unused })
    // The typed words stand: they now say what the form holds.
    synced.current = { words, rule: JSON.stringify(parsed.rule) }
  }
  const fill = () => {
    if (!words.trim()) { setError("Describe the method first."); return }
    const parsed = parseMethodWords(words, rule)
    if (!parsed.type) { setError("Say what the evaluator picks: levels, two outcomes, questions or a score."); setResult(null); return }
    setError(null)
    // Another type rebuilds the method [REQ SC-09]; hand edits made since the words were typed would be replaced. Both ask first.
    if (m.settled && m.saved?.model && parsed.type !== rule.model) { setAsk({ kind: "type", parsed }); return }
    if (rule.model && ruleKey !== synced.current.rule) { setAsk({ kind: "edits", parsed }); return }
    apply(parsed)
  }
  return (
    <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4" data-region="words">
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="method-words">Describe the method</FieldLabel>
        <Textarea id="method-words" rows={7} value={words} placeholder={`For example: ${EXAMPLE}`} aria-invalid={error ? true : undefined} aria-describedby={error ? "method-words-error" : undefined} onChange={(e) => { setWords(e.target.value); if (error) setError(null) }} />
        {error ? <FieldError id="method-words-error">{error}</FieldError> : null}
      </Field>
      <div className="flex justify-start">
        <Button type="button" variant="outline" size="sm" onClick={fill} data-fill-form>{rule.model ? "Update the form" : "Fill in the form"}</Button>
      </div>
      {/* What was understood and what was not, said once after each fill and read out politely. */}
      <div aria-live="polite" className="flex min-w-0 flex-col gap-4" data-fill-result>
        {result ? (
          <>
            <div className="flex min-w-0 flex-col gap-1.5">
              <p className={TYPE.helper}>Filled in</p>
              <ul className="flex min-w-0 flex-col gap-1 text-sm" data-filled>
                {result.filled.map((f, i) => (
                  <li key={`${f}-${i}`} className="flex min-w-0 items-baseline gap-2"><i className="fa-light fa-check shrink-0 text-xs text-muted-foreground" aria-hidden="true" /><span className="min-w-0 break-words">{f}</span></li>
                ))}
              </ul>
            </div>
            {result.unused.length ? (
              <div className="flex min-w-0 flex-col gap-1.5">
                <p className={TYPE.helper}>Not used</p>
                <ul className="flex min-w-0 flex-col gap-1 text-sm" data-unused>
                  {result.unused.map((u, i) => (
                    <li key={`${u}-${i}`} className="flex min-w-0 items-baseline gap-2"><i className="fa-light fa-circle-exclamation shrink-0 text-xs text-[var(--status-badge-warning-fg)]" aria-hidden="true" /><span className="min-w-0 break-words">{`"${u}"`}</span></li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
      <AlertDialog open={ask !== null} onOpenChange={(o) => { if (!o) setAsk(null) }}>
        <AlertDialogContent data-fill-question={ask?.kind}>
          <AlertDialogHeader>
            <AlertDialogTitle>{ask?.kind === "type" && ask.parsed.type ? `Switch to ${inSentence(LAB_MODEL_LABEL[ask.parsed.type])}?` : "Fill in the form again?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {ask?.kind === "type" && rule.model
                ? `The description names another type. Switching removes what ${inSentence(LAB_MODEL_LABEL[rule.model])} holds and what moves a student forward.`
                : "What you changed in the form by hand is replaced by the description."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{ask?.kind === "type" && rule.model ? `Keep ${inSentence(LAB_MODEL_LABEL[rule.model])}` : "Keep the form"}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (ask) apply(ask.parsed) }}>{ask?.kind === "type" ? "Switch" : "Fill in again"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Editor({ m, backHref, onLeave }: { m: MethodModel; backHref: string; onLeave: () => void }) {
  const [changing, setChanging] = React.useState(false)
  const discard = useAskDiscard()
  const { rule, method } = m
  const showBar = !method || m.dirty
  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" data-page-type="form" data-method-page>
      <PageFrame title={<BackTitle href={backHref} label={`Back to ${SETTINGS_TITLE}`}>{method ? method.name : "New method"}</BackTitle>} className="flex-1" actions={rule.model ? <ProgramPreviewDialog draft={withCarried(rule)} /> : undefined}>
        <div className="grid min-w-0 flex-1 items-start gap-x-8 gap-y-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <Words m={m} />
          {/* The form: always here, filled or not, and the only thing Save reads. */}
          <div className="@container flex min-w-0 flex-col gap-6 lg:border-s lg:border-border lg:ps-8" data-region="method" aria-label="The form">
            {m.dirty && rule.model ? <LocalBanner variant="info" data-review-banner>Check each field before you save. Only the form is saved.</LocalBanner> : null}
            {m.settled ? (
              <div className="flex min-w-0 flex-col gap-3">
                <TypeLine m={m} changing={changing} onToggle={() => setChanging((v) => !v)} labelled />
                {changing ? <TypeTiles m={m} /> : null}
              </div>
            ) : <TypeTiles m={m} />}
            {rule.model ? <EditorColumns m={m} /> : null}
          </div>
        </div>
        {showBar ? (
          <StickyFooter
            context={<span aria-live="assertive" aria-atomic="true"><ProblemsLink m={m} /></span>}
            secondary={{ label: "Cancel", onClick: () => discard.ask(m.dirty, () => { m.reset(); onLeave() }) }}
            primary={{ label: method ? "Save method" : "Create method", onClick: () => { m.save() } }}
          />
        ) : null}
      </PageFrame>
      <UnsavedChangesGuard dirty={m.dirty} onDiscard={m.reset} />
      {discard.question}
    </div>
  )
}

export function AdminEvaluationSettingsN() {
  const state = useV2State()
  const nav = useMethodNav()
  const { open, missing, hydrated } = useOpenMethod(nav.id)
  const [banner, setBanner] = React.useState<ResultBannerValue | null>(null)
  const count = React.useMemo(() => methodsOf(state).length, [state])
  if (nav.id && !hydrated) return <div className="p-6"><LoadingBlock /></div>
  if (open) {
    const method: EvaluationMethod | null = open === NEW ? null : open
    return (
      <>
        {banner ? <ResultBanner banner={banner} onDismiss={() => setBanner(null)} /> : null}
        <MethodDraft key={method?.id ?? NEW} method={method} onSaved={(b, id) => { setBanner(b); if (id) nav.close() }}>
          {(m) => <Editor m={m} backHref={nav.href(null)} onLeave={nav.close} />}
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
