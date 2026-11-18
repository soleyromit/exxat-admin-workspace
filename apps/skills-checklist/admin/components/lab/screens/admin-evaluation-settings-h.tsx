"use client"

/**
 * Evaluation settings H, "Live preview editor" (Proposed, D-EM1116-f; contract ADMIN-D3 "round 5 variants"). Romit 2026-11-16 on G's dialog:
 * "is this the best ui you got, where you are showing a popup?"
 *
 * A method opens on its own page, not in a dialog. Settings sit on the left; on the right the evaluator's and the student's forms are redrawn
 * from the draft as it is typed, for one example skill (recognition over recall, immediate feedback; the width is filled by what the settings
 * produce) [REQ SC-17, SC-19]. The list is the table of G; a row opens the page at `?method=<id>`; `?method=new` starts with the four types only
 * [REQ SC-02]. The save bar appears once there is something to save. In a page narrower than 58rem one pane shows at a time: Settings or Preview.
 */
import * as React from "react"
import { ViewSegmentedControl } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageFrame } from "@/components/skills/page-header"
import { StickyFooter } from "@/components/lab/layout/sticky-footer"
import { BackTitle } from "@/components/lab/shared/return-link"
import { ResultBanner, type ResultBannerValue } from "@/components/lab/shared/result-banner"
import { UnsavedChangesGuard } from "@/components/lab/shared/unsaved-guard"
import { ProgramPreview } from "@/components/lab/configure/program-preview"
import { CheckOffField, LoadingBlock, MethodDraft, MethodsTable, NEW, NameFields, NeedsField, NoMethods, ProblemsLink, RolesField, SETTINGS_TITLE, SettingsHome, TypeBody, TypeLine, TypeTiles, useAskDiscard, useMethodNav, useOpenMethod, withCarried, type MethodModel } from "@/components/lab/methods/method-parts"
import { methodsOf, type EvaluationMethod } from "@/lib/lab/methods"
import { useV2State } from "@/lib/v2/react"

type Pane = "settings" | "preview"
const PANES = [{ value: "settings", label: "Settings" }, { value: "preview", label: "Preview" }] as const

function Editor({ m, backHref, onLeave }: { m: MethodModel; backHref: string; onLeave: () => void }) {
  const [changing, setChanging] = React.useState(false)
  const [pane, setPane] = React.useState<Pane>("settings")
  const discard = useAskDiscard()
  const { rule, method } = m
  const showBar = !method || m.dirty
  return (
    <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" data-page-type="form" data-method-page>
      <PageFrame title={<BackTitle href={backHref} label={`Back to ${SETTINGS_TITLE}`}>{method ? method.name : "New method"}</BackTitle>} className="@container flex-1">
        {rule.model ? (
          <div className="@[58rem]:hidden">
            <ViewSegmentedControl<Pane> aria-label="Show" value={pane} onValueChange={setPane} options={PANES} />
          </div>
        ) : null}
        <div className={cn("grid min-w-0 flex-1 items-start justify-start gap-x-8 gap-y-6", rule.model ? "@[58rem]:grid-cols-[minmax(0,46rem)_minmax(20rem,30rem)]" : "grid-cols-1")}>
          <div className={cn("flex min-w-0 flex-col gap-6", pane === "preview" && rule.model && "@max-[58rem]:hidden")} data-region="method">
            {m.settled ? null : <TypeTiles m={m} />}
            {rule.model ? (
              <>
                <NameFields m={m} />
                {/* The type is a fact among the fields, under its own label: nothing sits under the title. The four tiles wait behind Change type. */}
                {m.settled ? (
                  <div className="flex min-w-0 flex-col gap-3">
                    <TypeLine m={m} changing={changing} onToggle={() => setChanging((v) => !v)} labelled />
                    {changing ? <TypeTiles m={m} /> : null}
                  </div>
                ) : null}
                <TypeBody m={m} />
                <div className="grid min-w-0 gap-6 sm:grid-cols-2" data-region="evaluation">
                  <RolesField m={m} />
                  <NeedsField m={m} />
                </div>
                <CheckOffField m={m} />
              </>
            ) : null}
          </div>
          {rule.model ? (
            // A picture of the result: the forms are inert, only "Evaluator | Student" and the example can be changed.
            <aside className={cn("min-w-0 rounded-[var(--radius)] bg-muted p-4 @[58rem]:sticky @[58rem]:top-4", pane === "settings" && "@max-[58rem]:hidden")} aria-label="Preview, read only" data-live-preview>
              <ProgramPreview draft={withCarried(rule)} />
            </aside>
          ) : null}
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

export function AdminEvaluationSettingsH() {
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
