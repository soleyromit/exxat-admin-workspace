"use client"

/**
 * The flow canvas: a sign-in flow drawn as a diagram you read top to bottom.
 *
 * Why a canvas at all. The previous builder rendered a flow as nested cards, so
 * every branch was a setting you had to click into and open one at a time. That
 * is the well-documented failure of card-stack builders: control flow becomes a
 * hidden property, and a four-branch flow looks like a pile of cards to hunt
 * through. On a canvas control flow is *spatial* — a fork is a fork you can see
 * without opening anything.
 *
 * Why auto-layout rather than draggable nodes. Positions are derived from the
 * flow, never stored. Free-form dragging buys arrangements nobody needs, and buys
 * them at the price of saved coordinates that go stale the moment a step is
 * inserted, plus diagrams whose meaning depends on where someone left a box.
 * Salesforce reached the same conclusion and recommends auto-layout by default.
 *
 * Why no graph library. Auto-layout means positions come from the DOM, so the
 * connectors are CSS rules on laid-out elements rather than computed SVG paths.
 * That keeps the diagram responsive, keeps DOM order equal to flow order (so Tab
 * walks the flow), and keeps a heavyweight dependency out of the workspace for one
 * prototype surface.
 *
 * Accessibility. A diagram of boxes and lines is unreadable without sight, so the
 * same structure ships as prose from `describeFlowForScreenReaders`, every line is
 * `aria-hidden`, and every node is a real button in flow order.
 */

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  AUTH_METHOD_LABEL,
  IDENTIFIER_SUBJECT_LABEL,
  alwaysAuthenticates,
  describeConditions,
  describeFlowForScreenReaders,
  describeOutcome,
  flowSession,
  reachesEnd,
  sessionEffects,
  type DryRunStatus,
  type FlowStep,
  type LoginFlowDefinition,
} from "@/lib/login-flow"

/** What the properties pane is editing. */
export type CanvasSelection =
  | { kind: "flow" }
  | { kind: "step"; stepId: string }
  | { kind: "option"; stepId: string; optionId: string }
  /** The end of the flow: which apps the session gets, and what home shows. */
  | { kind: "session" }

const STEP_ICON: Record<string, string> = {
  password: "fa-light fa-key",
  sso: "fa-light fa-shield-check",
  choice: "fa-light fa-split",
}

// ── Primitives ──────────────────────────────────────────────────────────────

/** A vertical run of line with an optional insert button on it. */
function Connector({ onInsert, label }: { onInsert?: () => void; label?: string }) {
  return (
    <div className="relative flex flex-col items-center">
      <span className="h-4 w-px bg-border" aria-hidden="true" />
      {label ? (
        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {label}
        </span>
      ) : null}
      {onInsert ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="my-1 size-6 rounded-full"
              onClick={onInsert}
              aria-label="Insert a step here"
            >
              <i className="fa-light fa-plus text-xs" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Insert a step here</TooltipContent>
        </Tooltip>
      ) : null}
      <span className="h-4 w-px bg-border" aria-hidden="true" />
    </div>
  )
}

/** Start and end caps, so the flow has a visible beginning and end. */
function TerminalPill({ label, icon }: { label: string; icon: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
      <i className={icon} aria-hidden="true" />
      {label}
    </span>
  )
}

const DRY_RUN_CHIP: Record<DryRunStatus, { label: string; className: string } | null> = {
  runs: null,
  skipped: {
    label: "Skipped",
    className: "border-border bg-muted text-muted-foreground",
  },
  depends: {
    label: "Depends on an answer",
    className: "border-chip-4/30 bg-chip-4/15 text-foreground",
  },
}

function NodeCard({
  title,
  subtitle,
  icon,
  selected,
  status,
  locked,
  onSelect,
}: {
  title: string
  subtitle?: string | null
  icon: string
  selected?: boolean
  status?: DryRunStatus
  locked?: boolean
  onSelect?: () => void
}) {
  const chip = status ? DRY_RUN_CHIP[status] : null

  const body = (
    <>
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand-ink"
      >
        <i className={icon} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col text-start">
        <span className="truncate text-sm font-medium">{title}</span>
        {subtitle ? (
          <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </span>
      {chip ? (
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
            chip.className,
          )}
        >
          {chip.label}
        </span>
      ) : null}
    </>
  )

  const shell = cn(
    "flex w-full items-center gap-3 rounded-lg border bg-card p-3 shadow-xs transition-colors",
    selected ? "border-brand ring-3 ring-ring/40" : "border-border",
    status === "skipped" && "opacity-55",
  )

  if (locked || !onSelect) {
    return (
      <div className={cn(shell, "border-dashed bg-muted/30 shadow-none")}>
        {body}
        {/* Decorative. Why this node is locked is written in its subtitle rather
            than hidden in a tooltip, so it reads without a pointer and without an
            `aria-label` on a span, which ARIA prohibits. */}
        {locked ? (
          <i className="fa-light fa-lock shrink-0 text-muted-foreground" aria-hidden="true" />
        ) : null}
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        shell,
        "h-auto font-normal hover:border-brand/50 hover:bg-accent",
      )}
    >
      {body}
    </Button>
  )
}

/**
 * Draws the bypass arc for a conditional step: a dashed bracket routing past the
 * node on the right. A condition is the one thing you cannot show by position
 * alone, so it gets drawn as the path the flow takes when the condition fails.
 */
function ConditionalWrap({
  when,
  children,
}: {
  when: string | null
  children: React.ReactNode
}) {
  if (!when) return <>{children}</>

  return (
    <div className="flex flex-col items-stretch">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="rounded-full border border-brand/30 bg-brand/10 px-2 py-0.5 text-xs text-brand-ink">
          Only when {when}
        </span>
        <span className="text-xs text-muted-foreground">otherwise skipped</span>
      </div>
      {/* The bypass: a dashed bracket routing past the node on the right. A
          condition is the one thing position alone cannot show, so it is drawn as
          the path the flow takes when the condition fails. */}
      <div className="relative pe-8">
        <span
          aria-hidden="true"
          className="absolute inset-y-0 end-0 w-6 rounded-e-lg border-y border-e border-dashed border-border"
        />
        {children}
      </div>
    </div>
  )
}

/**
 * The fan under a choice step: one branch per option, drawn as a rail and stems.
 * This is the whole reason for a canvas. A branch is visible here without opening
 * anything, which is precisely what a stack of cards cannot do.
 */
function BranchFan({
  flow,
  step,
  selection,
  onSelect,
}: {
  flow: LoginFlowDefinition
  step: Extract<FlowStep, { kind: "choice" }>
  selection: CanvasSelection
  onSelect: (selection: CanvasSelection) => void
}) {
  const last = step.options.length - 1

  return (
    <div className="flex flex-col items-stretch">
      {/* Stem from the choice node down to the rail, or the fan reads as a
          separate diagram that happens to sit underneath. */}
      <span aria-hidden="true" className="mx-auto h-4 w-px bg-border" />
      <div className="flex items-stretch">
        {step.options.map((option, index) => {
          const shown = describeConditions(option.showWhen, flow)
          const selected =
            selection.kind === "option" &&
            selection.stepId === step.id &&
            selection.optionId === option.id

          return (
            <div key={option.id} className="relative flex min-w-0 flex-1 flex-col px-1 pt-6">
              {/* Horizontal rail: half-width at the ends so it starts and stops at
                  the outer stems rather than overhanging the fan. */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-0 h-px bg-border",
                  step.options.length === 1
                    ? "hidden"
                    : index === 0
                      ? "start-1/2 end-0"
                      : index === last
                        ? "start-0 end-1/2"
                        : "inset-x-0",
                )}
              />
              {/* Stem down into the branch card. */}
              <span
                aria-hidden="true"
                className="absolute top-0 start-1/2 h-6 w-px bg-border"
              />

              <Button
                type="button"
                variant="ghost"
                onClick={() => onSelect({ kind: "option", stepId: step.id, optionId: option.id })}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "h-auto flex-col items-start gap-1 rounded-lg border bg-card p-2 text-start font-normal hover:border-brand/50 hover:bg-accent",
                  selected ? "border-brand ring-3 ring-ring/40" : "border-border",
                )}
              >
                <span className="flex items-center gap-1.5">
                  <i className={cn(option.icon, "text-xs text-muted-foreground")} aria-hidden="true" />
                  <span className="truncate text-sm font-medium">{option.label}</span>
                </span>
                <span className="text-xs text-muted-foreground">{describeOutcome(option)}</span>
                {shown ? (
                  <span className="text-xs text-brand-ink">Shown when {shown}</span>
                ) : null}
              </Button>

              <div className="flex flex-1 flex-col items-center justify-end">
                <span aria-hidden="true" className="h-4 w-px bg-border" />
                {option.outcome.kind === "continue" ? (
                  <TerminalPill label="Next step" icon="fa-light fa-arrow-turn-down" />
                ) : (
                  <TerminalPill label={option.outcome.path} icon="fa-light fa-flag-checkered" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * The end of the flow, as a node you can open.
 *
 * Every flow hands the session something, and until this was selectable there was
 * nowhere to say what: which apps, and which of the home sections. The chips are
 * the same sentences the properties pane sets, so all six role flows can be read
 * off the canvas without opening any of them.
 */
function SessionNode({
  flow,
  landingApplies,
  selected,
  onSelect,
}: {
  flow: LoginFlowDefinition
  landingApplies: boolean
  selected: boolean
  onSelect: () => void
}) {
  const effects = sessionEffects(flowSession(flow), landingApplies)

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "h-auto w-full items-center gap-3 rounded-lg border bg-card p-3 font-normal shadow-xs",
        "hover:border-brand/50 hover:bg-accent",
        selected ? "border-brand ring-3 ring-ring/40" : "border-border",
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand-ink"
      >
        <i className="fa-light fa-flag-checkered" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1 text-start">
        <span className="text-sm font-medium">Signed in</span>
        {effects.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {effects.map(effect => (
              <span
                key={effect}
                className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {effect}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            The workspace as it is, with nothing hidden.
          </span>
        )}
      </span>
    </Button>
  )
}

// ── Canvas ──────────────────────────────────────────────────────────────────

export function FlowCanvas({
  flow,
  selection,
  dryRunStatuses,
  onSelect,
  onInsertAfter,
}: {
  flow: LoginFlowDefinition
  selection: CanvasSelection
  /** Per-step status when the tester has an identifier; empty otherwise. */
  dryRunStatuses: DryRunStatus[] | null
  onSelect: (selection: CanvasSelection) => void
  onInsertAfter: (index: number) => void
}) {
  return (
    <div
      role="group"
      aria-label={`Canvas for the ${flow.name} flow`}
      className="rounded-xl border border-border bg-muted/20 p-4"
    >
      {/* The diagram in words. Placed first so it is the first thing a screen
          reader meets, before the boxes it describes. */}
      <p className="sr-only">{describeFlowForScreenReaders(flow)}</p>

      <div className="mx-auto flex max-w-2xl flex-col items-center">
        <TerminalPill label="Start" icon="fa-light fa-circle-play" />
        <Connector />

        <div className="w-full">
          <NodeCard
            title={IDENTIFIER_SUBJECT_LABEL}
            subtitle="Always first. The identifier decides how someone signs in."
            icon="fa-light fa-user"
            locked
          />
        </div>

        {flow.steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <Connector onInsert={() => onInsertAfter(index)} />
            <div className="w-full">
              <ConditionalWrap when={describeConditions(step.showWhen, flow)}>
                <NodeCard
                  title={step.kind === "auth" ? AUTH_METHOD_LABEL[step.method] : "Choice"}
                  subtitle={step.kind === "choice" ? step.heading : "Signs the person in"}
                  icon={STEP_ICON[step.kind === "auth" ? step.method : "choice"]}
                  selected={selection.kind === "step" && selection.stepId === step.id}
                  status={dryRunStatuses?.[index]}
                  onSelect={() => onSelect({ kind: "step", stepId: step.id })}
                />
              </ConditionalWrap>

              {step.kind === "choice" ? (
                <BranchFan
                  flow={flow}
                  step={step}
                  selection={selection}
                  onSelect={onSelect}
                />
              ) : null}
            </div>
          </React.Fragment>
        ))}

        {reachesEnd(flow) ? (
          <>
            <Connector onInsert={() => onInsertAfter(flow.steps.length)} />
            {alwaysAuthenticates(flow) ? null : (
              <>
                <span className="inline-flex items-center gap-2 rounded-full border border-chip-4/40 bg-chip-4/15 px-3 py-1 text-xs font-medium">
                  <i className="fa-light fa-key" aria-hidden="true" />
                  Password, added as a fallback
                </span>
                <Connector />
              </>
            )}
          </>
        ) : (
          // No connector into it: every branch already landed, so a line down to
          // this node would promise a path nothing takes. The node stays, because
          // what the session gets still applies to whichever branch ran.
          <p className="mt-3 mb-2 text-xs text-muted-foreground">
            Every branch ends the flow.
          </p>
        )}

        <div className="w-full">
          <SessionNode
            flow={flow}
            landingApplies={reachesEnd(flow)}
            selected={selection.kind === "session"}
            onSelect={() => onSelect({ kind: "session" })}
          />
        </div>
      </div>
    </div>
  )
}
