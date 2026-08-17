"use client"

/**
 * Design reference previews for the Ask Leo button family.
 *
 * Previews pass a no-op `onClick` so browsing the catalog does not open the
 * real Ask Leo sidebar. `AskLeoToggle` keeps its live behavior because the
 * shell trigger has no override hook.
 */

import * as React from "react"

import { AskLeoButton } from "@/components/ask-leo-button"
import { AskLeoToggle } from "@/components/ask-leo-sidebar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LeoIcon, type LeoIconMotionState } from "@/components/ui/leo-icon"
import { utilityBarActionButtonClass } from "@/components/utility-bar-chrome"

const noop = () => {}

function PreviewRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

export function AskLeoButtonSizePreview() {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-10">
      <PreviewRow label="size sm (chart card header)">
        <AskLeoButton size="sm" onClick={noop} />
      </PreviewRow>
      <PreviewRow label="size lg (page header action)">
        <AskLeoButton size="lg" onClick={noop} />
      </PreviewRow>
    </div>
  )
}

export function AskLeoButtonStarPreview() {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-10">
      <PreviewRow label="Static duotone glyph">
        <AskLeoButton size="sm" animatedStar={false} onClick={noop} />
        <AskLeoButton size="lg" animatedStar={false} onClick={noop} />
      </PreviewRow>
      <PreviewRow label="Animated LeoIcon star">
        <AskLeoButton size="sm" animatedStar onClick={noop} />
        <AskLeoButton size="lg" animatedStar onClick={noop} />
      </PreviewRow>
    </div>
  )
}

export function AskLeoButtonIconOnlyPreview() {
  return (
    <PreviewRow label="Icon only, accessible name from ariaLabel">
      <AskLeoButton size="sm" iconOnly ariaLabel="Ask Leo about this chart" onClick={noop} />
      <AskLeoButton size="lg" iconOnly ariaLabel="Ask Leo about this record" onClick={noop} />
    </PreviewRow>
  )
}

export function AskLeoButtonStatePreview() {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-10">
      <PreviewRow label="Default">
        <AskLeoButton size="sm" onClick={noop} />
      </PreviewRow>
      <PreviewRow label="Busy, label swaps to busyLabel">
        <AskLeoButton size="sm" aria-busy busyLabel="Drafting" onClick={noop} />
      </PreviewRow>
      <PreviewRow label="Disabled">
        <AskLeoButton size="sm" disabled onClick={noop} />
      </PreviewRow>
    </div>
  )
}

export function AskLeoButtonRouteActionPreview() {
  return (
    <PreviewRow label="Route-local action, no sidebar shortcut in the tooltip">
      <AskLeoButton
        size="sm"
        label="Draft with Leo"
        showShortcut={false}
        tooltipLabel="Draft an answer from the question stem"
        onClick={noop}
      />
      <AskLeoButton
        size="lg"
        label="Explain this trend"
        showShortcut={false}
        onClick={noop}
      />
    </PreviewRow>
  )
}

const MOTION_STATES: { state: LeoIconMotionState; hint: string }[] = [
  { state: "rest", hint: "Still — chrome does not loop" },
  { state: "invited", hint: "Hover or focus, one-shot" },
  { state: "working", hint: "Loops while Leo answers" },
  { state: "answered", hint: "Resolution beat, one-shot" },
]

export function LeoMotionStatePreview() {
  const [state, setState] = React.useState<LeoIconMotionState>("rest")
  // Bumped on every press so re-selecting the current state replays it —
  // `invited` and `answered` are one-shots and hold their final frame.
  const [replay, setReplay] = React.useState(0)
  const active = MOTION_STATES.find(s => s.state === state)!
  // Remounting is what replays the gesture: a fresh mount starts from
  // `initial="rest"` and animates into `state`.
  const runKey = `${state}-${replay}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {MOTION_STATES.map(({ state: value }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={state === value ? "default" : "outline"}
            onClick={() => {
              setState(value)
              setReplay(n => n + 1)
            }}
          >
            {value}
          </Button>
        ))}
      </div>

      <Card className="flex-row items-center gap-6 p-6">
        <span className="inline-flex size-10 items-center justify-center [--leo-icon-fill:var(--brand-color)]">
          <LeoIcon key={`lg-${runKey}`} variant="ambient" size="lg" state={state} />
        </span>
        <span className="inline-flex size-5 items-center justify-center [--leo-icon-fill:var(--brand-color)]">
          <LeoIcon key={`xs-${runKey}`} variant="ambient" size="xs" state={state} />
        </span>
        <p className="text-sm text-muted-foreground">{active.hint}</p>
      </Card>
    </div>
  )
}

export function AskLeoTogglePreview() {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-10">
      <PreviewRow label="Utility bar, labelled">
        <AskLeoToggle showLabel className={utilityBarActionButtonClass} />
      </PreviewRow>
      <PreviewRow label="Utility bar, icon only (compact rail)">
        <AskLeoToggle className={utilityBarActionButtonClass} />
      </PreviewRow>
    </div>
  )
}
