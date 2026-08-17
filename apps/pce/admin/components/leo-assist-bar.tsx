"use client"

/**
 * Contextual rewrite bar — Leo attached to the field being edited.
 *
 * Shares the Leo search-bar pill and its thinking wash, but the job is
 * different: the search bar finds records, this one writes or changes the text
 * already in front of the user.
 *
 * One intent, two content states:
 *   empty  — nothing written yet, so Leo drafts from a description.
 *   filled — there is text, so Leo rewrites it. Quick actions live in the
 *            overflow menu; undo / redo sit after it once Leo has written.
 *
 * Scope is a third axis, independent of both: with `selection` set, Leo sees
 * only that span and the result is spliced back into place. Undo still restores
 * the whole field, so a scoped rewrite is no harder to take back than any other.
 *
 * The bar owns the undo / redo stack for Leo's writes only. Typing by the user
 * is not tracked, so undo always means "put back what Leo replaced".
 *
 * @see components/ask-leo-composer.tsx
 * @see components/leo-assist-field.tsx — selection scope and the collapsed form
 */

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { AskLeoButton } from "@/components/ask-leo-button"
import { AskLeoComposer } from "@/components/ask-leo-composer"
import { useLeoAmbience } from "@/components/leo-ambience-context"
import { searchBarShellClassName } from "@/components/search-bar-shell"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Kbd } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

/** Which content state the field is in. Drives copy, actions, and placeholder. */
export type LeoAssistMode = "generate" | "rewrite"

export interface LeoAssistAction {
  id: string
  /** Button or menu label. Also the instruction when `instruction` is omitted. */
  label: string
  /** FontAwesome name without the style prefix, e.g. `fa-wand-magic-sparkles`. */
  icon?: string
  /** Sent to Leo when the label is too terse to act on. */
  instruction?: string
}

/** A span of the field Leo has been narrowed to. */
export interface LeoAssistSelection {
  start: number
  end: number
  text: string
}

export interface LeoAssistRequest {
  mode: LeoAssistMode
  /** What the user asked for, typed or from an action. */
  instruction: string
  /**
   * The text in scope when the request is made: the selected span when there
   * is one, the whole field otherwise, empty in generate mode.
   */
  text: string
  /** The span in scope, or null when Leo is working on the whole field. */
  selection: LeoAssistSelection | null
}

export interface LeoAssistBarProps {
  /** The text Leo works on. Controlled by the host field. */
  text: string
  onTextChange: (next: string) => void
  /**
   * Runs the request and resolves with the new text **for the scope it was
   * given**: the replacement for the span when `request.selection` is set, the
   * whole field otherwise. The bar does the splicing, so a host never has to
   * reason about offsets. Reject to surface an inline error; the bar never
   * writes on a rejection, so the undo stack stays truthful.
   */
  onRun: (request: LeoAssistRequest) => Promise<string>
  /**
   * Narrows Leo to a span of `text`. Everything outside it is left alone, byte
   * for byte, which is the whole reason a user selects before asking.
   */
  selection?: LeoAssistSelection | null
  /** What the scope chip calls the narrowed span. */
  scopeLabel?: string
  /**
   * Renders as a single button until the user asks for Leo. For forms where a
   * bar per field would be ten bars, and for fields the user mostly types in
   * unaided.
   */
  collapsible?: boolean
  /** Controlled open state. Leave unset to let the bar own it. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Label on the collapsed trigger. */
  collapsedLabel?: string
  /** Offered once the field has content. All entries live in the overflow. */
  actions?: readonly LeoAssistAction[]
  /** Offered while the field is empty. All entries live in the overflow. */
  emptyActions?: readonly LeoAssistAction[]
  /** Names the field Leo is editing, for screen readers. */
  fieldLabel?: string
  /** Rotating example instructions for the filled state. */
  examples?: readonly string[]
  /** Rotating example instructions for the empty state. */
  emptyExamples?: readonly string[]
  /**
   * Fires when Leo starts and stops. Hosts use it to lock the field and the
   * rest of the form, so nothing is edited underneath a run in flight.
   */
  onRunningChange?: (running: boolean) => void
  disabled?: boolean
  className?: string
}

const MODE_COPY: Record<
  LeoAssistMode,
  { placeholder: string; inputLabel: string; submitLabel: string }
> = {
  generate: {
    placeholder: "Describe what to write",
    inputLabel: "Describe what Leo should write",
    submitLabel: "Write with Leo",
  },
  rewrite: {
    placeholder: "Describe your change",
    inputLabel: "Describe a change for Leo",
    submitLabel: "Rewrite with Leo",
  },
}

/** What Leo is told to do. The label is the fallback when it says it plainly. */
function instructionFor(action: LeoAssistAction) {
  return action.instruction ?? action.label
}

const GHOST_ICON_BTN =
  "icon-button-chrome size-9 shrink-0 rounded-full hover:bg-accent hover:text-interactive-hover-foreground"

/**
 * The two widths the bar lives at, in pixels rather than utilities because the
 * open gesture animates between them.
 *
 * The collapsed width is the pill's own resting height, so the trigger is not a
 * button that happens to be round: it is the pill closed down to a circle. The
 * shell keeps a 25px radius, which at 50px tall *is* a circle, so the frame the
 * user clicks is the frame that grows.
 */
const BAR_COLLAPSED_PX = 50
const BAR_OPEN_PX = 448

/**
 * The open gesture is a reveal, not a resize. The pill is already at its full
 * width behind the circle, so moving the clip edge shows more of a box that
 * never changes shape, and the browser never has to lay the page out again
 * mid-animation. The radius matches the circle so the moving edge stays a cap
 * rather than a straight cut.
 *
 * The settled shape reaches past the box on every side. Left at the border the
 * clip would shave off the focus ring and the working wash.
 */
const CLIP_RADIUS_PX = BAR_COLLAPSED_PX / 2
const CLIP_COLLAPSED = `inset(0px ${BAR_OPEN_PX - BAR_COLLAPSED_PX}px 0px 0px round ${CLIP_RADIUS_PX}px)`
const CLIP_OPEN = `inset(0px 0px 0px 0px round ${CLIP_RADIUS_PX}px)`
const CLIP_SETTLED = `inset(-64px -64px -64px -64px round ${CLIP_RADIUS_PX}px)`

export function LeoAssistBar({
  text,
  onTextChange,
  onRun,
  actions,
  emptyActions,
  fieldLabel,
  examples,
  emptyExamples,
  onRunningChange,
  selection,
  scopeLabel = "Selection",
  collapsible = false,
  open: openProp,
  onOpenChange,
  collapsedLabel = "Edit with Leo",
  disabled = false,
  className,
}: LeoAssistBarProps) {
  const { previewThinking } = useLeoAmbience()
  const reducedMotion = useReducedMotion() ?? false
  /** True once the open gesture has finished and the pill is at full width. */
  const [settled, setSettled] = React.useState(false)

  const rootRef = React.useRef<HTMLDivElement>(null)
  const [draft, setDraft] = React.useState("")
  const [running, setRunning] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [menuOpen, setMenuOpen] = React.useState(false)

  // Leo's writes only. `past` holds what the text was before each one.
  const [past, setPast] = React.useState<string[]>([])
  const [future, setFuture] = React.useState<string[]>([])

  const runIdRef = React.useRef(0)

  const onRunningChangeRef = React.useRef(onRunningChange)
  React.useEffect(() => {
    onRunningChangeRef.current = onRunningChange
  })
  React.useEffect(() => {
    onRunningChangeRef.current?.(running)
  }, [running])

  // A collapsed range is not a scope: clicking into a field to place the caret
  // would otherwise narrow Leo to nothing and leave him unable to write.
  const scope =
    selection && selection.end > selection.start ? selection : null
  const scopedText = scope ? scope.text : text

  const mode: LeoAssistMode = scopedText.trim() ? "rewrite" : "generate"
  const copy = MODE_COPY[mode]
  const modeActions = (mode === "rewrite" ? actions : emptyActions) ?? []
  const modeExamples = mode === "rewrite" ? examples : emptyExamples

  const canUndo = past.length > 0
  const canRedo = future.length > 0
  const busy = running || previewThinking
  const locked = disabled || running

  const [openState, setOpenState] = React.useState(false)
  const open = !collapsible || (openProp ?? openState)

  const setOpen = React.useCallback(
    (next: boolean) => {
      setOpenState(next)
      onOpenChange?.(next)
    },
    [onOpenChange],
  )

  // The user asked for the bar, so the bar takes the caret. Without this the
  // expand costs a second click before anything can be typed.
  React.useEffect(() => {
    if (!collapsible || !open) return
    rootRef.current?.querySelector("textarea")?.focus()
  }, [collapsible, open])

  // Closing arms the next open gesture: the pill has to start clipped again or
  // it would appear at full width inside a 50px frame.
  React.useEffect(() => {
    if (!open) setSettled(false)
  }, [open])

  function applyWrite(next: string) {
    setPast(stack => [...stack, text])
    setFuture([])
    onTextChange(next)
  }

  function undo() {
    if (!canUndo) return
    const previous = past[past.length - 1]
    setPast(stack => stack.slice(0, -1))
    setFuture(stack => [text, ...stack])
    onTextChange(previous)
  }

  function redo() {
    if (!canRedo) return
    const next = future[0]
    setFuture(stack => stack.slice(1))
    setPast(stack => [...stack, text])
    onTextChange(next)
  }

  // A stopped or superseded run must not write into the field, so both
  // outcomes go through a run-id check before touching state.
  function settle(runId: number, next: string) {
    if (runIdRef.current !== runId) return
    applyWrite(next)
    setDraft("")
  }

  function fail(runId: number) {
    if (runIdRef.current !== runId) return
    setError("Leo could not finish that. Try again.")
  }

  async function run(instruction: string) {
    if (locked || !instruction.trim()) return
    const runId = ++runIdRef.current
    // Pinned for the duration: the user can drag a new selection while Leo
    // thinks, and the result belongs to the span that was asked about.
    const target = scope
    setRunning(true)
    setError(null)
    try {
      const result = await onRun({
        mode,
        instruction,
        text: scopedText,
        selection: target,
      })
      settle(
        runId,
        target
          ? text.slice(0, target.start) + result + text.slice(target.end)
          : result,
      )
    } catch {
      fail(runId)
    } finally {
      if (runIdRef.current === runId) setRunning(false)
    }
  }

  function stop() {
    runIdRef.current += 1
    setRunning(false)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    // Escape is the way back out of the expanded bar. It only closes once the
    // instruction is empty, so a half-typed thought is never thrown away by a
    // keystroke the user meant for a menu.
    if (event.key === "Escape" && collapsible && !running) {
      if (draft) {
        event.preventDefault()
        setDraft("")
        return
      }
      event.preventDefault()
      setOpen(false)
      return
    }
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "z") {
      return
    }
    if (locked) return
    event.preventDefault()
    if (event.shiftKey) redo()
    else undo()
  }

  /**
   * History rides after the more menu, once Leo has written.
   *
   * Undo and redo are always two separate buttons (never one control that
   * flips). They appear together after the first Leo write; the inactive side
   * stays visible and disabled so the pair does not read as a toggle.
   */
  const historyActions =
    !running && (canUndo || canRedo) ? (
      <>
        {/* Actions act on the instruction; history acts on the field. */}
        {modeActions.length > 0 ? (
          <span
            aria-hidden
            className="mx-0.5 h-5 w-px shrink-0 bg-[color:var(--control-border)]"
          />
        ) : null}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={locked || !canUndo}
              className={GHOST_ICON_BTN}
              aria-label="Undo Leo's last edit"
              onClick={undo}
            >
              <i
                className="fa-light fa-arrow-rotate-left leading-none"
                aria-hidden="true"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={6}
            className="flex items-center gap-1.5 text-xs"
          >
            Undo Leo&apos;s last edit <Kbd>⌘Z</Kbd>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={locked || !canRedo}
              className={GHOST_ICON_BTN}
              aria-label="Redo Leo's edit"
              onClick={redo}
            >
              <i
                className="fa-light fa-arrow-rotate-right leading-none"
                aria-hidden="true"
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={6}
            className="flex items-center gap-1.5 text-xs"
          >
            Redo Leo&apos;s edit <Kbd>⇧⌘Z</Kbd>
          </TooltipContent>
        </Tooltip>
      </>
    ) : null

  // All quick actions (Polish, etc.) live in the overflow so the instruction
  // keeps its width. Undo / redo follow once Leo has written.
  const menuButton =
    modeActions.length > 0 && !running ? (
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={locked}
                className={GHOST_ICON_BTN}
                aria-label="More Leo actions"
              >
                <i
                  className="fa-light fa-ellipsis-vertical text-lg leading-none"
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6} className="text-xs">
            More Leo actions
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="min-w-48">
          {modeActions.map(action => (
            <DropdownMenuItem
              key={action.id}
              onSelect={() => run(instructionFor(action))}
            >
              {action.icon ? (
                <i
                  className={`fa-light ${action.icon} w-4 shrink-0 text-center`}
                  aria-hidden="true"
                />
              ) : null}
              {action.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    ) : null

  const closeButton =
    collapsible && !running ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={GHOST_ICON_BTN}
            aria-label="Close Leo"
            onClick={() => setOpen(false)}
          >
            <i className="fa-light fa-xmark leading-none" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          sideOffset={6}
          className="flex items-center gap-1.5 text-xs"
        >
          Close Leo <Kbd>Esc</Kbd>
        </TooltipContent>
      </Tooltip>
    ) : null

  const inlineActions = (
    <>
      {menuButton}
      {historyActions}
      {closeButton}
    </>
  )

  const bar = (
    <div
      ref={rootRef}
      className="flex max-w-none flex-col items-start gap-1.5"
      onKeyDown={handleKeyDown}
    >
      {/* One line of fact about the blast radius. Without it a scoped rewrite
          and a whole-field rewrite look identical right up until the field
          changes under the user. */}
      {scope ? (
        <span className="flex items-center gap-1.5 rounded-full border border-[color:var(--control-border)] bg-muted/40 px-2.5 py-0.5 text-xs text-muted-foreground">
          <i
            className="fa-light fa-i-cursor text-[color:var(--brand-color)]"
            aria-hidden="true"
          />
          {scopeLabel}, {scope.text.length} characters
        </span>
      ) : null}
      {/* The bar is sized on its own terms. Taking its width from the field
          would let a narrow field squeeze the instruction down to nothing.
          Wider than it was when history lived outside the pill: undo, redo and
          close now share the row with the instruction, and the instruction is
          the part that must not be the one to give up its width. */}
      <div className="shrink-0" style={{ width: BAR_OPEN_PX }}>
        <AskLeoComposer
            value={draft}
            onChange={setDraft}
            onSubmit={run}
            placeholder={copy.placeholder}
            animatedPlaceholders={
              modeExamples ? [...modeExamples] : undefined
            }
            animatedPlaceholderIntervalMs={4800}
            leadingSlot="ai-mark"
            inputLabel={
              fieldLabel
                ? `${copy.inputLabel}. Field: ${fieldLabel}`
                : copy.inputLabel
            }
            submitButtonAriaLabel={copy.submitLabel}
            isAnalyzing={running}
            onStop={stop}
            inlineActions={inlineActions}
            // The instruction here is a short phrase typed while the user is
            // already at the keyboard editing the field. Dictation would take
            // the same corner as the overflow for a gesture nobody makes.
            dictationDisabled
            searchBarAmbience
            composerShellClassName={searchBarShellClassName(
              // Half the resting height, not `rounded-full`. At one row the two
              // are identical, but a stadium recomputes its radius as the pill
              // grows, and by four rows the curve is eating the first and last
              // lines of the instruction.
              "rounded-[25px]! shadow-xs! border-[color:var(--control-border)]!",
              busy
                ? "border-[color:color-mix(in_oklch,var(--brand-color)_45%,var(--control-border))]! bg-card/70! shadow-sm! ring-2 ring-brand/15!"
              : undefined,
          )}
        />
      </div>

      {error ? (
        <p className="text-xs text-destructive-ink" role="alert">
          {error}
        </p>
      ) : null}

      <span role="status" aria-live="polite" className="sr-only">
        {running ? "Leo is working" : ""}
      </span>
    </div>
  )

  if (!collapsible) return <div className={cn("w-max", className)}>{bar}</div>

  return (
    // One grid cell holds both states, so the pill grows out of the circle's
    // own footprint rather than appearing beside it and shoving the form.
    <div className={cn("grid w-max justify-items-start", className)}>
      <div className="[grid-area:1/1]" hidden={open}>
        <AskLeoButton
          size="lg"
          iconOnly
          starSize="sm"
          label={collapsedLabel}
          tooltipLabel={
            fieldLabel ? `${collapsedLabel}. Field: ${fieldLabel}` : collapsedLabel
          }
          // ⌘⌥K belongs to the Leo panel. This button opens a different Leo, so
          // claiming that chord in its tooltip would teach the wrong gesture.
          showShortcut={false}
          animatedStar
          disabled={disabled}
          onClick={() => setOpen(true)}
          // Same size, radius, border and surface as the pill's resting shell.
          // The swap at the first frame of the gesture has to be invisible, or
          // the circle reads as one control handing off to another.
          className="size-[50px] rounded-full border-[color:var(--control-border)] bg-card shadow-xs"
        />
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="bar"
            className="[grid-area:1/1]"
            // Not width, and not a scale either: animating width relaid out the
            // page every frame, and scaling would stretch the instruction text
            // on the way out. Moving the clip edge keeps the pill at its own
            // size and its own type size, and simply uncovers more of it.
            initial={{ clipPath: CLIP_COLLAPSED }}
            animate={{ clipPath: settled ? CLIP_SETTLED : CLIP_OPEN }}
            exit={{ clipPath: CLIP_COLLAPSED }}
            onAnimationComplete={() => setSettled(true)}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.26, ease: [0.22, 1, 0.36, 1] }
            }
          >
            {bar}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

