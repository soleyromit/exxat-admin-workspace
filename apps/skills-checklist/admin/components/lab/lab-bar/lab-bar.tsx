"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@exxatdesignux/ui/components/ui/toggle-group"
import { viewSegmentedButtonClass, viewSegmentedToolbarClass } from "@exxatdesignux/ui/components/ui/view-segmented-control"
import { Tooltip, TooltipContent, TooltipTrigger } from "@exxatdesignux/ui/components/ui/tooltip"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@exxatdesignux/ui/components/ui/sheet"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { DsUsedList, dsUsedCount } from "@/components/lab/ds-used-panel"
import { flowsForPersona, mainSteps } from "@/lib/lab/flows"
import { PERSONA_BY_ID } from "@/lib/lab/personas"
import type { PersonaId } from "@/lib/lab/screens"
import { PersonaRadioItems, personaTarget } from "./persona-switcher"
import { useLabBar, type LabBarModel, type LabBarProps } from "./use-lab-bar"
import { PresentControls, usePresent } from "./present"
import { useWalkthrough } from "./walkthrough-controls"
import type { Scenario } from "./scenarios"

/**
 * The only lab chrome (03-lab-architecture.md section 4, redesigned 2026-10-26 from Romit's screenshot): one calm 40 px row
 * in three clusters separated by space and a thin divider, not a row of equal pills.
 *
 *   LEFT   context, quiet ghost text: persona (short name, full name in the tooltip) and flow.
 *   CENTER the journey: previous and next as icon buttons (tooltip names the step), the CURRENT step in medium weight,
 *          "Step 2 of 4" muted and one dot per step (current filled, click to jump).
 *   RIGHT  the option set as a compact segmented control (numbers, the active set named in full; each option has a tooltip
 *          with the set's name and summary), "+n" more variants only when a screen has variants outside the sets, then three
 *          icon buttons: Scenario, What this tests, Components (with a small count).
 * Only the active set and the current step are emphasised; everything else is ghost.
 *
 * Widths follow the bar's own width (container queries; the staff sidebar takes part of the viewport):
 *   72 rem and up (1440 with the sidebar): everything above. Below 72 rem: no "Step n of m" text and no dots. Below 48 rem:
 *   persona and flow fold into one "Admin · Watch the cohort" menu and the active set shows its number only. Below 40 rem: [flow menu] [‹ 2/4 ›] [1 2 3] [overflow],
 *   44 px targets, and the row grows to 44 px so they fit.
 */
export function LabBar(props: LabBarProps) {
  // Present mode (granola 2026-10-26): the bar is never shown to the client; only a small exit control remains.
  const { present } = usePresent()
  // A walkthrough step (lib/lab/walkthrough.ts) carries its presenter control in the utility bar instead (lab-frame).
  const walkthrough = useWalkthrough()
  if (walkthrough) return null
  return present ? <PresentControls /> : <WorkingBar {...props} />
}

function WorkingBar(props: LabBarProps) {
  const m = useLabBar(props)
  const [drawer, setDrawer] = React.useState(false)
  const barRef = React.useRef<HTMLDivElement>(null)
  const openDrawer = () => setDrawer(true)
  // The drawer opens from a button or from a menu item that unmounts, so focus returns to the visible trigger on close.
  const returnFocus = () => {
    const bar = barRef.current
    const candidates = bar ? Array.from(bar.querySelectorAll<HTMLElement>("[data-lab-components], [data-lab-overflow]")) : []
    candidates.find((el) => el.offsetParent !== null)?.focus()
  }
  return (
    <div ref={barRef} role="region" aria-label="Design lab controls" data-lab-chrome data-lab-bar className="@container w-full shrink-0 border-b border-border bg-muted/30">
      <div className="flex h-10 min-w-0 items-center gap-2 px-3 text-xs @max-[40rem]:h-11 @max-[40rem]:gap-1 @max-[40rem]:px-1">
        <ContextCluster m={m} />
        <Divider />
        <JourneyCluster m={m} />
        <Divider />
        <OptionsCluster m={m} openDrawer={openDrawer} />
      </div>
      <ComponentsDrawer m={m} open={drawer} onOpenChange={setDrawer} onClosed={returnFocus} />
    </div>
  )
}

const NARROW_TARGET = "@max-[40rem]:size-11"

function Divider() {
  return <span aria-hidden="true" className="h-5 w-px shrink-0 bg-border @max-[40rem]:hidden" />
}

function Tip({ label, children }: { label: React.ReactNode; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-80">{label}</TooltipContent>
    </Tooltip>
  )
}

const chevronDown = <i className="fa-light fa-chevron-down text-xs text-muted-foreground" aria-hidden="true" />

// ---------------------------------------------------------------------------------------------------------------- left

function FlowRadioItems({ m }: { m: LabBarModel }) {
  const flows = flowsForPersona(m.persona)
  if (!flows.length) return <DropdownMenuItem disabled>No flow for this persona</DropdownMenuItem>
  return (
    <DropdownMenuRadioGroup value={m.flow?.id ?? ""} onValueChange={m.chooseFlow}>
      {flows.map((f) => <DropdownMenuRadioItem key={f.id} value={f.id} className="min-h-9">{f.title}</DropdownMenuRadioItem>)}
    </DropdownMenuRadioGroup>
  )
}

function ContextCluster({ m }: { m: LabBarModel }) {
  const router = useRouter()
  const persona = PERSONA_BY_ID[m.persona]
  const pick = (id: PersonaId) => router.push(personaTarget(id, m.onFlowRoute))
  const flowTitle = m.flow?.title ?? "Choose a flow"
  return (
    <div className="flex shrink-0 items-center gap-1" data-lab-context>
      {/* 48 rem and up: persona, then flow. */}
      <div className="hidden items-center gap-1 @3xl:flex">
        <DropdownMenu>
          <Tip label={`Viewing as ${persona.label}`}>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" aria-label={`View as ${persona.label}. Switch persona`} className="gap-1.5" data-lab-persona>
                <i className="fa-light fa-user text-xs text-muted-foreground" aria-hidden="true" />
                {persona.short}
              </Button>
            </DropdownMenuTrigger>
          </Tip>
          <DropdownMenuContent align="start" sideOffset={8} className="w-64">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">View as</DropdownMenuLabel>
            <PersonaRadioItems value={m.persona} onPick={pick} />
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" aria-label={`Flow: ${flowTitle}. Choose a flow`} className={cn("gap-1.5", m.flow ? "" : "text-muted-foreground")} data-lab-flow>
              {flowTitle}
              {chevronDown}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={8} className="w-64">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Flows</DropdownMenuLabel>
            <FlowRadioItems m={m} />
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/lab">All screens</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Below 48 rem: one menu. */}
      <div className="flex @3xl:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" aria-label={`${persona.label}, ${flowTitle}. Change persona or flow`} className="gap-1.5 @max-[40rem]:h-11" data-lab-context-menu>
              <span className="@max-[40rem]:hidden">{`${persona.short} · ${m.flow?.title ?? "No flow"}`}</span>
              <span className="@[40rem]:hidden">{m.flow?.short ?? persona.short}</span>
              {chevronDown}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={8} className="max-h-[70vh] w-72 overflow-y-auto">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">View as</DropdownMenuLabel>
            <PersonaRadioItems value={m.persona} onPick={pick} />
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Flow</DropdownMenuLabel>
            <FlowRadioItems m={m} />
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="min-h-9"><Link href="/lab">All screens</Link></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// -------------------------------------------------------------------------------------------------------------- center

function JourneyCluster({ m }: { m: LabBarModel }) {
  if (!m.flow || !m.step || !m.nav) {
    return <p className="min-w-0 flex-1 truncate text-center text-muted-foreground">{m.screen?.title ?? ""}</p>
  }
  const { prev, next, index, total } = m.nav
  const step = m.step
  const steps = mainSteps(m.flow)
  const position = step.side ? (step.tag ?? "Side step") : `Step ${index} of ${total}`
  return (
    <nav aria-label="Journey" className="flex min-w-0 flex-1 items-center justify-center gap-1" data-lab-journey>
      <StepArrow m={m} target={prev} dir="prev" />
      <span className="flex min-w-0 items-baseline gap-2 px-1" data-lab-step={step.id}>
        <span className="whitespace-nowrap font-medium text-foreground @max-[40rem]:hidden" aria-current="step">{step.label}</span>
        <span className={cn("whitespace-nowrap tabular-nums text-muted-foreground", step.side ? "@max-[40rem]:hidden" : "hidden @6xl:inline")}>{position}</span>
        <span className="whitespace-nowrap font-medium tabular-nums text-foreground @[40rem]:hidden" aria-label={`${step.label}, ${position.toLowerCase()}`}>{step.side ? (step.tag ?? "Side") : `${index}/${total}`}</span>
      </span>
      <ol className="hidden items-center @6xl:flex" aria-label="Steps" data-lab-dots>
        {steps.map((s, i) => {
          const here = s.id === step.id || (!!step.side && s.id === step.after)
          return (
            <li key={s.id}>
              <Tip label={`Step ${i + 1}: ${s.label}`}>
                <Link href={m.stepHref(s.id)} aria-label={`Step ${i + 1}: ${s.label}`} aria-current={s.id === step.id ? "step" : undefined} className="grid size-5 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span aria-hidden="true" className={cn("block rounded-full", here ? "size-2 bg-foreground" : "size-1.5 bg-muted-foreground/50")} />
                </Link>
              </Tip>
            </li>
          )
        })}
      </ol>
      <StepArrow m={m} target={next} dir="next" />
    </nav>
  )
}

function StepArrow({ m, target, dir }: { m: LabBarModel; target?: { id: string; label: string }; dir: "prev" | "next" }) {
  const chevron = <i className={`fa-light fa-chevron-${dir === "prev" ? "left" : "right"} text-xs`} aria-hidden="true" />
  const name = dir === "prev" ? "Previous" : "Next"
  if (!target) {
    return <Button type="button" variant="ghost" size="icon-sm" disabled aria-label={`${name} step: none`} className={NARROW_TARGET} data-lab-step-link={dir}>{chevron}</Button>
  }
  return (
    <Tip label={`${name}: ${target.label}`}>
      <Button asChild variant="ghost" size="icon-sm" className={NARROW_TARGET}>
        <Link href={m.stepHref(target.id)} aria-label={`${name} step: ${target.label}`} data-lab-step-link={dir}>{chevron}</Link>
      </Button>
    </Tip>
  )
}

// --------------------------------------------------------------------------------------------------------------- right

function OptionsCluster({ m, openDrawer }: { m: LabBarModel; openDrawer: () => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1" data-lab-options>
      {m.outside ? <span className="hidden whitespace-nowrap px-1 text-muted-foreground @5xl:inline" data-lab-outside>{`Variant ${m.outside} (outside the sets)`}</span> : null}
      <SetControl m={m} />
      <div className="hidden items-center gap-1 @[40rem]:flex">
        <MoreVariants m={m} />
        <ScenarioMenu m={m} />
        <QuestionTip m={m} />
        <ComponentsButton m={m} onOpen={openDrawer} />
      </div>
      <div className="flex @[40rem]:hidden">
        <OverflowMenu m={m} openDrawer={openDrawer} />
      </div>
    </div>
  )
}

/**
 * The option set (or, off a flow, the variant) as a compact segmented control: DS ToggleGroup in the DS segmented-control
 * styling (`viewSegmentedToolbarClass`, `viewSegmentedButtonClass`), so the active set reads like any view switch, with a
 * tooltip per option. Inactive options show their number; the active one is named in full from 48 rem.
 */
function SetControl({ m }: { m: LabBarModel }) {
  if (m.options.length < 2) return <span className="whitespace-nowrap px-1 text-muted-foreground">Single layout</span>
  const groupName = m.flow ? "Option set" : "Design variant"
  const about = (value: string) => (m.flow ? m.flow.sets.find((s) => s.id === value)?.summary : m.screen?.variants.find((v) => v.id === value)?.question)
  return (
    <ToggleGroup
      type="single"
      value={m.current}
      onValueChange={(v) => { if (v) m.chooseOption(v) }}
      aria-label={groupName}
      className={cn(viewSegmentedToolbarClass(), "shrink-0 gap-0.5")}
      data-lab-set-switch
    >
      {m.options.map((o) => {
        const active = o.value === m.current
        const full = `${o.label}${o.planned ? ", planned" : ""}`
        const text = about(o.value)
        return (
          <Tip key={o.value} label={<span className="flex flex-col gap-0.5"><span className="font-medium">{m.flow ? `Set ${full}` : full}</span>{text ? <span className="opacity-80">{text}</span> : null}</span>}>
            <ToggleGroupItem
              value={o.value}
              aria-label={full}
              className={cn(
                viewSegmentedButtonClass(active),
                // The segmented look in every state, no brand fill: only the active option is emphasised.
                "h-8 min-w-8 justify-center border-0 data-[state=on]:border-0 data-[state=on]:bg-background data-[state=on]:text-foreground @max-[40rem]:h-11 @max-[40rem]:min-w-11",
              )}
            >
              {active && !m.flow ? <span className="hidden @3xl:inline">Variant&nbsp;</span> : null}
              <span>{o.value}</span>
              {active && m.flow ? <span className="hidden @3xl:inline">&nbsp;{o.name}</span> : null}
            </ToggleGroupItem>
          </Tip>
        )
      })}
    </ToggleGroup>
  )
}

function MoreVariantItems({ m }: { m: LabBarModel }) {
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Outside the option sets</DropdownMenuLabel>
      {m.extraVariants.map((v) => (
        <DropdownMenuItem key={v.id} asChild className="min-h-9">
          <Link href={m.extraHref(v.id)} aria-current={m.variant?.id === v.id ? "page" : undefined} className="flex flex-col items-start gap-0.5">
            <span className="font-medium text-foreground">{`Variant ${v.id}${m.variant?.id === v.id ? ", showing" : ""}`}</span>
            <span className="text-xs text-muted-foreground">{v.question}</span>
          </Link>
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  )
}

/** Variants of this screen that no option set reaches (the admin dashboard's C, D and E): a small "+n" after the sets. */
function MoreVariants({ m }: { m: LabBarModel }) {
  if (!m.extraVariants.length) return null
  const letters = m.extraVariants.map((v) => v.id).join(", ")
  return (
    <DropdownMenu>
      <Tip label={`More variants: ${letters}`}>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="sm" aria-label={`More variants: ${letters}`} className="tabular-nums" data-lab-more-variants>
            {`+${m.extraVariants.length}`}
          </Button>
        </DropdownMenuTrigger>
      </Tip>
      <DropdownMenuContent align="end" sideOffset={8} className="w-80">
        <MoreVariantItems m={m} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ScenarioItems({ m }: { m: LabBarModel }) {
  const groups = (["States", "Data"] as const).map((g) => [g, m.scenarios.filter((s) => s.group === g)] as const).filter(([, list]) => list.length)
  return (
    <>
      {groups.map(([g, list], i) => (
        <DropdownMenuGroup key={g}>
          {i > 0 ? <DropdownMenuSeparator /> : null}
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{g}</DropdownMenuLabel>
          {list.map((s: Scenario) => <DropdownMenuItem key={s.label} onSelect={() => m.runScenario(s)} className="min-h-9">{s.label}</DropdownMenuItem>)}
        </DropdownMenuGroup>
      ))}
    </>
  )
}

function ScenarioMenu({ m }: { m: LabBarModel }) {
  if (!m.scenarios.length) return null
  return (
    <DropdownMenu>
      <Tip label="Scenario: demo states and sample data">
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Scenario" data-lab-scenario>
            <i className="fa-light fa-flask" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
      </Tip>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64">
        <ScenarioItems m={m} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The lines the question tooltip (and the overflow menu) carry. */
export function questionLines(m: Pick<LabBarModel, "question" | "isRecommended" | "notes" | "setSummary" | "flow" | "options" | "current">): string[] {
  const lines: string[] = []
  if (m.flow && m.setSummary) lines.push(`Set ${m.options.find((o) => o.value === m.current)?.label ?? m.current}: ${m.setSummary}.`)
  if (m.question) lines.push(m.question)
  if (m.isRecommended && m.options.length > 1) lines.push("Recommended")
  lines.push(...m.notes)
  return lines
}

function QuestionTip({ m }: { m: LabBarModel }) {
  const lines = questionLines(m)
  if (!lines.length) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="What this option tests" data-lab-question>
          <i className="fa-light fa-circle-info" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end" className="max-w-80">
        <div className="flex flex-col gap-1" data-lab-question-content>
          {lines.map((l, i) => <p key={i} className={i === 0 ? "" : "opacity-80"}>{l}</p>)}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function ComponentsButton({ m, onOpen }: { m: LabBarModel; onOpen: () => void }) {
  if (!m.key) return null
  const n = dsUsedCount(m.key)
  return (
    <Tip label={n === null ? "Design system components (not scanned)" : `Design system components on this page: ${n}`}>
      <Button type="button" variant="ghost" size="sm" onClick={onOpen} aria-haspopup="dialog" aria-label={`Components${n !== null ? `, ${n}` : ""}`} className="gap-1 px-1.5" data-lab-components>
        <i className="fa-light fa-layer-group" aria-hidden="true" />
        {n !== null ? <Badge variant="secondary" className="h-4 min-w-4 px-1 text-xs tabular-nums">{n}</Badge> : null}
      </Button>
    </Tip>
  )
}

function ComponentsDrawer({ m, open, onOpenChange, onClosed }: { m: LabBarModel; open: boolean; onOpenChange: (v: boolean) => void; onClosed: () => void }) {
  if (!m.key) return null
  const n = dsUsedCount(m.key)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" size="md" data-lab-chrome data-lab-components-drawer onCloseAutoFocus={(e) => { e.preventDefault(); onClosed() }}>
        <SheetHeader>
          <SheetTitle>Design system components on this page</SheetTitle>
          <SheetDescription>{n === null ? "Not scanned yet." : `${n} components, from the gate scan.`}</SheetDescription>
        </SheetHeader>
        <div className="overflow-y-auto px-4 pb-6">
          <DsUsedList screenKey={m.key} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Below 40 rem: more variants, scenario, the question and components in one menu. */
function OverflowMenu({ m, openDrawer }: { m: LabBarModel; openDrawer: () => void }) {
  const lines = questionLines(m)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="More lab controls" className={NARROW_TARGET} data-lab-overflow>
          <i className="fa-light fa-ellipsis" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="max-h-[70vh] w-72 overflow-y-auto">
        {m.extraVariants.length ? (
          <>
            <MoreVariantItems m={m} />
            <DropdownMenuSeparator />
          </>
        ) : null}
        {m.scenarios.length ? (
          <>
            <ScenarioItems m={m} />
            <DropdownMenuSeparator />
          </>
        ) : null}
        {lines.length ? (
          <div className="flex flex-col gap-1 px-2 py-1.5 text-xs text-muted-foreground" data-lab-question-content>
            <p className="font-medium text-foreground">What this option tests</p>
            {lines.map((l, i) => <p key={i}>{l}</p>)}
          </div>
        ) : null}
        {m.key ? <DropdownMenuItem onSelect={openDrawer} className="min-h-11">Design system components</DropdownMenuItem> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
