"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { V2Grid, v2col, type V2Col } from "@/components/v2/v2-grid"
import { PERSONAS } from "@/lib/lab/personas"
import { builtVariants, screenHref, screensFor, screenKey, screenStatus, type ScreenDef } from "@/lib/lab/screens"
import { flowHref, flowsForPersona, mainSteps, resolveStep, stepScreen, type FlowDef, type FlowStep } from "@/lib/lab/flows"
import { lettersOutsideSets, variantCounts } from "@/lib/lab/links"
import { MARQUEE, NOT_READY, PRESENT_WALKTHROUGHS, marqueeHref } from "@/lib/lab/present"
import { withNoun } from "@/lib/lab/terms"
import { useTerms } from "@/components/lab/library/use-terms"
import { ToggleSwitch } from "@exxatdesignux/ui/components/ui/toggle-switch"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { usePresent } from "@/components/lab/lab-bar/present"

import { LINK_IN_TABLE as LINK } from "@/components/lab/link-styles"

const screenColumns = [
  v2col<ScreenDef>("screen", "Screen", 280, (s) => <Link className={LINK} href={screenHref(s.persona, s.slug)}>{s.title}</Link>),
  v2col<ScreenDef>("tier", "Tier", 80, (s) => <Badge variant={s.tier === 1 ? "default" : "outline"}>{s.tier}</Badge>),
  v2col<ScreenDef>("variants", "Variants", 220, (s) => (
    <span className="flex flex-wrap gap-1.5">
      {s.variants.map((v) => (
        <Link key={v.id} href={screenHref(s.persona, s.slug, v.id)} aria-label={`${s.title}, variant ${v.id}${v.file ? "" : ", planned"}`}>
          <Badge variant={v.file ? "secondary" : "outline"}>{v.id}{v.id === s.recommended ? " (rec.)" : ""}</Badge>
        </Link>
      ))}
      <VariantCount s={s} />
    </span>
  )),
  v2col<ScreenDef>("built", "Built", 110, (s) => `${builtVariants(s).length} of ${s.variants.length}`),
  v2col<ScreenDef>("status", "Status", 110, (s) => <Badge variant={screenStatus(s) === "built" ? "default" : "outline"}>{screenStatus(s) === "built" ? "Built" : "Planned"}</Badge>),
]

/** The same counts the lab bar shows: variants reached by the option sets, and the "+n" outside them. */
function VariantCount({ s }: { s: ScreenDef }) {
  const c = variantCounts(screenKey(s), s.variants.map((v) => v.id))
  if (!c.inFlow) return <span className="text-xs text-muted-foreground" data-variant-count>Not in a flow</span>
  return <span className="text-xs text-muted-foreground" data-variant-count>{c.outside ? `${c.inSets} in the sets, ${c.outside} more` : `${c.inSets} in the sets`}</span>
}

/** Rows are steps, one column per option set; each cell links to that step in that set and shows the variant it renders. */
function flowColumns(flow: FlowDef): V2Col<FlowStep>[] {
  return [
    v2col<FlowStep>("step", "Step", 220, (st) => {
      const n = mainSteps(flow).findIndex((x) => x.id === st.id) + 1
      return (
        <span className="flex flex-col">
          <span className="font-medium text-foreground">{st.side ? st.label : `${n}. ${st.label}`}</span>
          {st.side ? <span className="text-xs text-muted-foreground">Side step</span> : null}
        </span>
      )
    }),
    v2col<FlowStep>("screen", "Screen", 220, (st) => {
      const s = stepScreen(st)
      return s ? <Link className={LINK} href={screenHref(s.persona, s.slug)}>{s.title}</Link> : <span className="text-muted-foreground">Missing</span>
    }),
    ...flow.sets.map((set) =>
      v2col<FlowStep>(`set-${set.id}`, `Set ${set.id} ${set.label}`, 150, (st) => {
        const r = resolveStep(flow.id, st.id, set.id)
        if (!r) return null
        return (
          <Link href={flowHref(flow.id, st.id, set.id)} aria-label={`${st.label}, set ${set.id} ${set.label}, variant ${r.variant.id}${r.planned ? ", planned" : ""}`}>
            <Badge variant={r.planned ? "outline" : "secondary"}>{r.variant.id}{r.planned ? ", planned" : ""}</Badge>
          </Link>
        )
      }),
    ),
  ]
}

/** Variants of this flow's screens that no set reaches (the admin dashboard's C, D and E), so none is hidden. */
function OutsideSets({ flow }: { flow: FlowDef }) {
  const seen = new Set<string>()
  const rows = flow.steps.flatMap((st) => {
    const s = stepScreen(st)
    if (!s || seen.has(st.screen)) return []
    seen.add(st.screen)
    const letters = lettersOutsideSets(st.screen, s.variants.map((v) => v.id))
    return letters.length ? [{ s, letters }] : []
  })
  if (!rows.length) return null
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground" data-outside-sets>
      <span>Outside the sets</span>
      {rows.map(({ s, letters }) => letters.map((l) => (
        <Link key={`${s.slug}-${l}`} className={LINK} href={screenHref(s.persona, s.slug, l)} title={s.variants.find((v) => v.id === l)?.question}>{`${s.title} ${l}`}</Link>
      )))}
    </p>
  )
}

function FlowSection({ flow }: { flow: FlowDef }) {
  const first = mainSteps(flow)[0]
  return (
    <PageSection id={`flow-${flow.id}`} title={flow.title}>
      {first ? (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>Walk it in</span>
          {flow.sets.map((s) => (
            <Link key={s.id} className={LINK} href={flowHref(flow.id, first.id, s.id)} title={s.summary}>
              Set {s.id} {s.label}{s.id === flow.recommendedSet ? " (recommended)" : ""}
            </Link>
          ))}
        </p>
      ) : null}
      <V2Grid<FlowStep> caption={`${flow.title} steps by option set`} rows={flow.steps} id={(s) => s.id} columns={flowColumns(flow)} />
      <OutsideSets flow={flow} />
    </PageSection>
  )
}

/** The Present switch, on the lab index only. */
function PresentSwitch() {
  const { present, setPresent } = usePresent()
  return (
    <span className="flex items-center gap-2 text-sm text-foreground">
      <span id="present-label">Present</span>
      <ToggleSwitch checked={present} onChange={setPresent} aria-labelledby="present-label" />
    </span>
  )
}

/** Present mode index: the curated marquee screens, reporting listed as not ready, no internal label. */
function MarqueeIndex() {
  useTerms()
  const { setPresent } = usePresent()
  return (
    <PageFrame
      title="Skills tracking"
      subtitle="The screens ready to walk through. Everything here is sample data."
      actions={<span className="flex items-center gap-3"><PresentSwitch /><Button type="button" variant="ghost" size="sm" onClick={() => setPresent(false)}>Exit present mode</Button></span>}
    >
      <div className="flex max-w-3xl flex-col gap-8">
        <section aria-labelledby="walkthrough-heading" className="flex flex-col gap-3">
          <h2 id="walkthrough-heading" className="text-base font-semibold text-foreground">Walk through</h2>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border" data-walkthroughs>
            {PRESENT_WALKTHROUGHS.map((w) => (
              <li key={w.href} className="flex items-center justify-between gap-3 px-4 py-3">
                <Link className={LINK} href={w.href}>{withNoun(w.label)}</Link>
                <span className="shrink-0 text-sm text-muted-foreground">{w.who}</span>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="marquee-heading" className="flex flex-col gap-3">
          <h2 id="marquee-heading" className="text-base font-semibold text-foreground">Ready to show</h2>
          <ol className="flex flex-col divide-y divide-border rounded-lg border border-border" data-marquee>
            {MARQUEE.map((m, i) => (
              <li key={`${m.flow}-${m.step}`} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="flex min-w-0 items-baseline gap-3">
                  <span className="w-5 shrink-0 text-sm tabular-nums text-muted-foreground">{i + 1}</span>
                  <Link className={LINK} href={marqueeHref(m)}>{withNoun(m.label)}</Link>
                </span>
                <span className="shrink-0 text-sm text-muted-foreground">{m.who}</span>
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="not-ready-heading" className="flex flex-col gap-3">
          <h2 id="not-ready-heading" className="text-base font-semibold text-foreground">Reporting</h2>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border" data-not-ready>
            {NOT_READY.map((m) => (
              <li key={m.label} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-muted-foreground">{m.label}</span>
                <Badge variant="outline">Not ready</Badge>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageFrame>
  )
}

export function LabIndex() {
  const { present } = usePresent()
  return present ? <MarqueeIndex /> : <WorkingIndex />
}

function WorkingIndex() {
  const router = useRouter()
  const pathname = usePathname() ?? "/lab"
  const params = useSearchParams()
  const view = params?.get("view") === "persona" ? "persona" : "flow"
  const setView = (v: string) => {
    const q = new URLSearchParams(params?.toString() ?? "")
    if (v === "persona") q.set("view", "persona")
    else q.delete("view")
    const s = q.toString()
    router.replace(s ? `${pathname}?${s}` : pathname)
  }
  return (
    <PageFrame
      title="Design lab"
      subtitle="Walk a whole job in one design direction, or open any screen on its own. Everything here is sample data."
      actions={
        <span className="flex items-center gap-3">
          {PRESENT_WALKTHROUGHS.map((w) => (
            <Button key={w.href} asChild variant="outline" size="sm"><Link href={w.href} data-walkthrough-entry>{`${w.label.split(",")[0]!} walkthrough`}</Link></Button>
          ))}
          <PresentSwitch />
        </span>
      }
    >
      <Tabs value={view} onValueChange={setView} className="flex flex-col gap-6">
        <TabsList variant="line" ariaLabel="Lab index view">
          <TabsTrigger value="flow">By flow</TabsTrigger>
          <TabsTrigger value="persona">By persona</TabsTrigger>
        </TabsList>
        <TabsContent value="flow" className="flex flex-col gap-10">
          {PERSONAS.map((p) => {
            const flows = flowsForPersona(p.id)
            if (!flows.length) return null
            return (
              <section key={p.id} aria-labelledby={`flows-${p.id}`} className="flex flex-col gap-6">
                <h2 id={`flows-${p.id}`} className="text-base font-semibold text-foreground">{p.label}</h2>
                {flows.map((f) => <FlowSection key={f.id} flow={f} />)}
              </section>
            )
          })}
        </TabsContent>
        <TabsContent value="persona" className="flex flex-col gap-8">
          {PERSONAS.map((p) => (
            <PageSection key={p.id} id={`persona-${p.id}`} title={p.label} description={p.chrome === "shell" ? "Shell with sidebar" : "Light header, no sidebar"}>
              <V2Grid<ScreenDef> caption={`${p.label} screens`} rows={screensFor(p.id)} id={screenKey} columns={screenColumns} />
            </PageSection>
          ))}
        </TabsContent>
      </Tabs>
    </PageFrame>
  )
}
