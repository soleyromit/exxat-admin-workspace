"use client"

/**
 * Evaluation settings I, "Master-detail" (Proposed, D-EM1116-f; contract ADMIN-D3 "round 5 variants"). Romit 2026-11-16 on G's dialog:
 * "is this the best ui you got, where you are showing a popup?"
 *
 * The methods are a column on the left of the same page and the chosen method's editor sits inline on the right: no navigation and no popup,
 * and another method is one click away (spatial memory, comparison). The first method is open when the URL names none; `?method=<id|new>` opens
 * another. Choosing another method, a tab or New method with unsaved changes asks first. Below 768px it is the list, then the detail on its own
 * page with the back icon. The save bar appears once there is something to save.
 */
import * as React from "react"
import Link from "next/link"
import { useIsMobile } from "@exxatdesignux/ui/hooks/use-mobile"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { PageFrame } from "@/components/skills/page-header"
import { TYPE } from "@/components/lab/type-scale"
import { StickyFooter } from "@/components/lab/layout/sticky-footer"
import { BackTitle } from "@/components/lab/shared/return-link"
import { ResultBanner, type ResultBannerValue } from "@/components/lab/shared/result-banner"
import { RowMenu } from "@/components/lab/shared/row-menu"
import { UnsavedChangesGuard } from "@/components/lab/shared/unsaved-guard"
import { ProgramPreviewDialog } from "@/components/lab/configure/settings-dialogs"
import { EditorColumns, LoadingBlock, MethodDraft, NEW, NoMethods, ProblemsLink, SETTINGS_TITLE, SettingsHome, TypeLine, TypeTiles, useAskDiscard, useMethodActions, useMethodNav, useOpenMethod, withCarried, type MethodModel } from "@/components/lab/methods/method-parts"
import { LAB_MODEL_LABEL } from "@/lib/lab/configure"
import { methodsOf, type EvaluationMethod } from "@/lib/lab/methods"
import { useV2State } from "@/lib/v2/react"

const ROW = "flex min-h-11 min-w-0 items-start justify-between gap-3 rounded-[var(--radius)] px-3 py-2 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-muted"

/** The master: every method by name, its type under it, and how many skills use it. The open one is marked, not bold. */
function MethodList({ methods, selected, adding, hrefOf }: { methods: EvaluationMethod[]; selected: string | null; adding: boolean; hrefOf: (id: string) => string }) {
  return (
    <nav aria-label="Methods" className="flex min-w-0 flex-col gap-1" data-region="methods" data-method-list>
      {adding ? (
        <div className={ROW} aria-current="page" data-method-row={NEW}>
          <span className="min-w-0 break-words">New method</span>
        </div>
      ) : null}
      {methods.map((x) => (
        <Link key={x.id} href={hrefOf(x.id)} scroll={false} className={ROW} aria-current={selected === x.id ? "page" : undefined} data-method-row={x.id}>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="min-w-0 break-words text-foreground">{x.name}</span>
            <span className={TYPE.meta}>{x.rule.model ? LAB_MODEL_LABEL[x.rule.model] : "Not set up"}</span>
          </span>
          <span className={cn(TYPE.meta, "shrink-0 pt-0.5 tabular-nums")} aria-label={`${x.skillIds.length} ${x.skillIds.length === 1 ? "skill" : "skills"}`}>{x.skillIds.length}</span>
        </Link>
      ))}
    </nav>
  )
}

/** The detail: the open method's fields in place. The footer bleeds only through its own column. */
function Detail({ m, menu, onCancelNew }: { m: MethodModel; menu?: React.ReactNode; onCancelNew: () => void }) {
  const [changing, setChanging] = React.useState(false)
  const discard = useAskDiscard()
  const { rule, method } = m
  const tilesOpen = !m.settled || changing
  const showBar = !method || m.dirty
  const end = rule.model ? <><ProgramPreviewDialog draft={withCarried(rule)} variant="ghost" />{menu}</> : menu
  return (
    <section className="@container flex min-w-0 flex-1 flex-col gap-5" aria-label={method ? method.name : "New method"} data-method-detail>
      <TypeLine m={m} changing={changing} onToggle={() => setChanging((v) => !v)} end={end} />
      {tilesOpen ? <TypeTiles m={m} /> : null}
      {rule.model ? <EditorColumns m={m} /> : null}
      <div className="flex-1" />
      {showBar ? (
        <StickyFooter
          className="mx-0 mb-0 px-0 md:mx-0 md:px-0"
          context={<span aria-live="assertive" aria-atomic="true"><ProblemsLink m={m} /></span>}
          secondary={{ label: "Cancel", onClick: () => discard.ask(m.dirty, () => { m.reset(); if (!method) onCancelNew() }) }}
          primary={{ label: method ? "Save method" : "Create method", onClick: () => { m.save() } }}
        />
      ) : null}
      <UnsavedChangesGuard dirty={m.dirty} onDiscard={m.reset} />
      {discard.question}
    </section>
  )
}

export function AdminEvaluationSettingsI() {
  const state = useV2State()
  const nav = useMethodNav()
  const isMobile = useIsMobile()
  const [banner, setBanner] = React.useState<ResultBannerValue | null>(null)
  const [dirty, setDirty] = React.useState(false)
  const [version, setVersion] = React.useState(0)
  const discard = useAskDiscard()
  const methods = React.useMemo(() => methodsOf(state), [state])
  const fromUrl = useOpenMethod(nav.id)
  // Wide: a method is always open, the first when the URL names none. Narrow: the list first.
  const open = fromUrl.open ?? (!isMobile && fromUrl.hydrated ? methods[0] ?? null : null)
  const method: EvaluationMethod | null = open && open !== NEW ? open : null
  const actions = useMethodActions(setBanner, { edit: false, onDeleted: (id) => { if (id === nav.id) nav.close() } })
  const onSaved = (b: ResultBannerValue, id: string | null) => {
    setBanner(b)
    if (!id) return
    setVersion((v) => v + 1)
    if (id !== nav.id) nav.go(nav.href(id))
  }
  const detail = open ? (
    <MethodDraft key={`${method?.id ?? NEW}:${version}`} method={method} onSaved={onSaved} onDirty={setDirty}>
      {(m) => <Detail m={m} onCancelNew={nav.close} menu={method ? <RowMenu label={`Actions for ${method.name}`} entries={actions.entries(method)} /> : undefined} />}
    </MethodDraft>
  ) : null

  if (nav.id && !fromUrl.hydrated) return <div className="p-6"><LoadingBlock /></div>
  // Narrow, with a method open: the detail is the page, and the back icon returns to the list.
  if (isMobile && nav.id && open) {
    return (
      <div className="flex min-h-[calc(100dvh-5.5rem)] w-full flex-col" data-page-type="form" data-method-page>
        <PageFrame title={<BackTitle href={nav.href(null)} label={`Back to ${SETTINGS_TITLE}`}>{method ? method.name : "New method"}</BackTitle>} className="flex-1">
          {banner ? <ResultBanner banner={banner} onDismiss={() => setBanner(null)} /> : null}
          {detail}
        </PageFrame>
        {actions.dialog}
      </div>
    )
  }
  return (
    <>
      <SettingsHome banner={banner} setBanner={setBanner} missing={fromUrl.missing} pageType="split" guard={(then) => discard.ask(dirty, then)}>
        {methods.length || open === NEW ? (
          <div className="grid min-w-0 flex-1 items-stretch gap-y-4 md:grid-cols-[17rem_minmax(0,1fr)]">
            <div className="min-w-0 md:border-e md:border-border md:pe-4">
              <MethodList methods={methods} selected={method?.id ?? null} adding={open === NEW} hrefOf={(id) => nav.href(id)} />
            </div>
            <div className="flex min-w-0 flex-col md:ps-6">{detail}</div>
          </div>
        ) : <NoMethods href={nav.href(NEW)} />}
      </SettingsHome>
      {actions.dialog}
      {discard.question}
    </>
  )
}
