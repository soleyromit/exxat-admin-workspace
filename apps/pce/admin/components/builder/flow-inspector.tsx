"use client"

/**
 * The inspector: config for the selected canvas node, in a floating tool window.
 *
 * Why a window and not a docked panel. A docked pane permanently spends a fifth of
 * the width whether or not you are configuring anything, and it squeezes the canvas
 * precisely when the canvas needs room, since a branch fan grows sideways with the
 * number of branches. `FloatingWindow` is non-modal, so the canvas stays live and
 * full width underneath: you can click one node, read the fields, then click the
 * next node without closing anything, and you can drag the window off whatever it
 * happens to be covering.
 *
 * Why it steals focus on open. The window is portaled to the end of the document,
 * so its fields sit after the entire page in tab order. Without moving focus, the
 * keyboard path from "activate a node" to "edit that node" would be a long Tab
 * journey, which is not keyboard parity (P6). Activating a node is an unambiguous
 * request to configure it, so focus follows the request.
 */

import * as React from "react"

import {
  FloatingWindow,
  defaultFloatingWindowRect,
  type FloatingWindowRect,
  type FloatingWindowViewport,
} from "@/components/ui/floating-window"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { CanvasSelection } from "@/components/builder/flow-canvas"
import {
  FlowProperties,
  deleteTarget,
  selectionLabel,
} from "@/components/builder/flow-properties"
import type { LoginFlowDefinition } from "@/lib/login-flow"
import { usePersistedState } from "@exxatdesignux/ui/lib/persisted-state"

/**
 * Where the window sits is a workspace habit, not a property of any one flow, so
 * the key is shell-scoped and unnamespaced like the other chrome preferences.
 */
const INSPECTOR_RECT_KEY = "shell:sign-in-flow-inspector-rect"

const INSPECTOR_WIDTH = 380
const INSPECTOR_HEIGHT = 560

function defaultInspectorRect(viewport: FloatingWindowViewport): FloatingWindowRect {
  // Bottom right rather than centre right: the canvas spine stays visible either
  // way, but centring it lands the window on the toolbar's Save buttons, and a
  // window that opens on top of Save is a window people fight before they use.
  return defaultFloatingWindowRect(viewport, {
    width: INSPECTOR_WIDTH,
    height: INSPECTOR_HEIGHT,
    anchor: "bottom-right",
  })
}

export function FlowInspector({
  flow,
  selection,
  onChangeFlow,
  onSelect,
}: {
  flow: LoginFlowDefinition
  selection: CanvasSelection
  onChangeFlow: (next: LoginFlowDefinition) => void
  onSelect: (selection: CanvasSelection) => void
}) {
  const [storedRect, setStoredRect] = usePersistedState<FloatingWindowRect | null>(
    INSPECTOR_RECT_KEY,
    null,
  )
  const bodyRef = React.useRef<HTMLDivElement>(null)

  const label = selectionLabel(flow, selection)
  const removal = deleteTarget(flow, selection)
  const open = label !== null

  const close = React.useCallback(() => onSelect({ kind: "flow" }), [onSelect])

  // Key the focus effect on what is selected, not on `open`, so clicking straight
  // from one node to another lands you in the new node's first field rather than
  // leaving focus on the field you were in for the previous one.
  const selectionKey =
    selection.kind === "flow"
      ? null
      : selection.kind === "session"
        ? "session"
        : `${selection.stepId}:${selection.kind === "option" ? selection.optionId : ""}`

  React.useEffect(() => {
    if (!selectionKey) return
    const first = bodyRef.current?.querySelector<HTMLElement>(
      "input, select, textarea, button:not([disabled])",
    )
    first?.focus()
  }, [selectionKey])

  if (!open) return null

  return (
    <FloatingWindow
      open
      rect={storedRect}
      onRectChange={setStoredRect}
      defaultRect={defaultInspectorRect}
      minWidth={320}
      minHeight={280}
      aria-label={`Configure ${label.title}`}
      dataSlot="sign-in-flow-inspector"
      cornerSnap={false}
      gripAriaLabel="Drag to move the inspector. Arrow keys nudge, Alt with arrow keys resizes."
      gripTooltip="Drag to move · arrows nudge · Alt + arrows resize"
      onEscape={close}
      title={
        <div className="flex min-w-0 flex-col">
          <h2 className="font-heading m-0 truncate text-base leading-tight font-semibold tracking-tight">
            {label.title}
          </h2>
          <p className="m-0 truncate text-xs text-muted-foreground">{label.meta}</p>
        </div>
      }
      toolbar={
        <>
          {removal ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={Boolean(removal.disabledReason)}
                  aria-label={removal.label}
                  onClick={() => {
                    onChangeFlow(removal.next)
                    onSelect(removal.nextSelection)
                  }}
                >
                  <i className="fa-light fa-trash text-xs" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {removal.disabledReason ?? removal.label}
              </TooltipContent>
            </Tooltip>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Close the inspector"
                onClick={close}
              >
                <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Close
            </TooltipContent>
          </Tooltip>
        </>
      }
    >
      {/* `FloatingWindow` clips its children rather than scrolling them, so the
          scroll container is the consumer's job. `min-h-0` is the load-bearing
          part: without it a flex child refuses to shrink below its content and
          overflows the window instead of scrolling inside it. */}
      <div
        ref={bodyRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
      >
        <FlowProperties
          flow={flow}
          selection={selection}
          onChangeFlow={onChangeFlow}
          onSelect={onSelect}
        />
      </div>
    </FloatingWindow>
  )
}
