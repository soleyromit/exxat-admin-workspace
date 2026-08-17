"use client"

/**
 * A long-form field with Leo attached.
 *
 * Two ways in, because they answer different questions:
 *   whole field — the collapsed Leo button under the field. "Write this for me."
 *   selection   — pick a span, a Leo chip appears beside it. "Fix this bit."
 *
 * The chip is the contextual affordance and floats at the selection, but the
 * bar itself docks under the field rather than in a second popover. One bar
 * means one undo stack: a scoped rewrite is still there to take back after the
 * user has clicked away and the selection is long gone.
 *
 * @see components/leo-assist-bar.tsx — the bar, its scope, and its history
 * @see lib/textarea-selection-rect.ts — how the chip finds the selection
 */

import * as React from "react"

import {
  LeoAssistBar,
  type LeoAssistAction,
  type LeoAssistBarProps,
  type LeoAssistSelection,
} from "@/components/leo-assist-bar"
import { AskLeoButton } from "@/components/ask-leo-button"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { getTextareaSelectionRect } from "@/lib/textarea-selection-rect"
import { cn } from "@/lib/utils"

export interface LeoAssistFieldProps {
  label: string
  value: string
  onValueChange: (next: string) => void
  onRun: LeoAssistBarProps["onRun"]
  /** Offered once the span in scope has content. */
  actions?: readonly LeoAssistAction[]
  /** Offered while the span in scope is empty. */
  emptyActions?: readonly LeoAssistAction[]
  examples?: readonly string[]
  emptyExamples?: readonly string[]
  placeholder?: string
  /** Height at rest, in rows. */
  minRows?: number
  /** Grows to here, then scrolls. */
  maxRows?: number
  disabled?: boolean
  className?: string
}

/** Long enough that the user has stopped dragging, short enough to feel live. */
const SELECTION_SETTLE_MS = 180

export function LeoAssistField({
  label,
  value,
  onValueChange,
  onRun,
  actions,
  emptyActions,
  examples,
  emptyExamples,
  placeholder,
  minRows = 6,
  maxRows = 16,
  disabled = false,
  className,
}: LeoAssistFieldProps) {
  const fieldId = React.useId()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const [selection, setSelection] = React.useState<LeoAssistSelection | null>(
    null,
  )
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null)
  const [chipVisible, setChipVisible] = React.useState(false)
  const [barOpen, setBarOpen] = React.useState(false)
  const [running, setRunning] = React.useState(false)

  // Grow with the content up to the cap, then hand the overflow to a scrollbar.
  // A field that grows forever pushes its own Leo button off the screen.
  React.useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    const style = window.getComputedStyle(el)
    const lineHeight = parseFloat(style.lineHeight) || 20
    const chrome =
      parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom) +
      parseFloat(style.borderTopWidth) +
      parseFloat(style.borderBottomWidth)
    const max = maxRows * lineHeight + chrome

    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, max)}px`
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden"
  }, [value, maxRows])

  const clearScope = React.useCallback(() => {
    setSelection(null)
    setAnchorRect(null)
    setChipVisible(false)
  }, [])

  const readSelection = React.useCallback((): LeoAssistSelection | null => {
    const el = textareaRef.current
    if (!el) return null
    const { selectionStart: start, selectionEnd: end } = el
    if (start === end) return null
    return { start, end, text: el.value.slice(start, end) }
  }, [])

  const openBarWith = React.useCallback(
    (next: LeoAssistSelection | null) => {
      setSelection(next)
      setChipVisible(false)
      setBarOpen(true)
    },
    [],
  )

  // The chip waits for the drag to stop. Raising it on every selectionchange
  // makes it chase the cursor across the paragraph the user is still selecting.
  React.useEffect(() => {
    const el = textareaRef.current
    if (!el || disabled) return

    let timer = 0

    function settle() {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        // The bar owns the scope once it is open. Re-selecting underneath it
        // would swap the target out from under the instruction being typed.
        if (barOpen) return
        const next = readSelection()
        if (!next || !textareaRef.current) {
          setChipVisible(false)
          return
        }
        setSelection(next)
        setAnchorRect(
          getTextareaSelectionRect(textareaRef.current, next.start, next.end),
        )
        setChipVisible(true)
      }, SELECTION_SETTLE_MS)
    }

    el.addEventListener("select", settle)
    el.addEventListener("mouseup", settle)
    el.addEventListener("keyup", settle)

    return () => {
      window.clearTimeout(timer)
      el.removeEventListener("select", settle)
      el.removeEventListener("mouseup", settle)
      el.removeEventListener("keyup", settle)
    }
  }, [barOpen, disabled, readSelection])

  // A chip pinned to viewport coordinates is wrong the moment anything moves.
  React.useEffect(() => {
    if (!chipVisible) return
    function reposition() {
      const el = textareaRef.current
      if (!el || !selection) return
      setAnchorRect(
        getTextareaSelectionRect(el, selection.start, selection.end),
      )
    }
    window.addEventListener("scroll", reposition, true)
    window.addEventListener("resize", reposition)
    return () => {
      window.removeEventListener("scroll", reposition, true)
      window.removeEventListener("resize", reposition)
    }
  }, [chipVisible, selection])

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // ⌘⌥L opens Leo on whatever is selected, so the chip is never the only
    // route in. ⌘⌥K is taken by the Leo panel, which is a different Leo.
    if ((event.metaKey || event.ctrlKey) && event.altKey) {
      if (event.key.toLowerCase() !== "l") return
      event.preventDefault()
      openBarWith(readSelection())
      return
    }
    if (event.key === "Escape" && chipVisible) {
      event.preventDefault()
      setChipVisible(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Field orientation="vertical">
        <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>

        <Popover open={chipVisible} onOpenChange={setChipVisible} modal={false}>
          {anchorRect ? (
            <PopoverAnchor asChild>
              <span
                aria-hidden
                className="pointer-events-none fixed"
                style={{
                  left: anchorRect.left,
                  top: anchorRect.top,
                  width: anchorRect.width,
                  height: anchorRect.height,
                }}
              />
            </PopoverAnchor>
          ) : null}

          <Textarea
            id={fieldId}
            ref={textareaRef}
            value={value}
            rows={minRows}
            placeholder={placeholder}
            disabled={disabled || running}
            onChange={(event) => {
              // Typing invalidates the offsets the scope was measured against,
              // so the scope goes rather than silently pointing at the wrong span.
              clearScope()
              onValueChange(event.target.value)
            }}
            onKeyDown={handleKeyDown}
            className="resize-none leading-relaxed"
          />

          <PopoverContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-auto border-0 bg-transparent p-0 shadow-none"
            // Taking focus would drop the selection highlight and undo the very
            // gesture that raised the chip.
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <AskLeoButton
              size="sm"
              label="Edit selection"
              tooltipLabel="Edit the selected text with Leo"
              showShortcut={false}
              animatedStar
              introduceOnMount
              // It floats over the user's own prose, so it needs a surface of its
              // own. The outline variant is translucent in dark mode, which left
              // the paragraph running straight through the label.
              className="bg-popover shadow-md dark:bg-popover dark:hover:bg-accent"
              onClick={() => openBarWith(readSelection())}
            />
          </PopoverContent>
        </Popover>
      </Field>

      <LeoAssistBar
        text={value}
        onTextChange={onValueChange}
        onRun={onRun}
        selection={selection}
        actions={actions}
        emptyActions={emptyActions}
        examples={examples}
        emptyExamples={emptyExamples}
        fieldLabel={label}
        collapsible
        open={barOpen}
        onOpenChange={(next) => {
          setBarOpen(next)
          if (!next) clearScope()
        }}
        onRunningChange={setRunning}
        disabled={disabled}
      />
    </div>
  )
}
