"use client"

/**
 * AskLeoComposer — adapted from @blocks-so/ai-01 (AI chat composer).
 * Uses Exxat tokens (bg-card, border-border, etc.) and Font Awesome instead of Tabler.
 */

import * as React from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface AskLeoComposerProps {
  value: string
  onChange: (value: string) => void
  /** Called with trimmed message after send (composer clears afterward). */
  onSubmit?: (message: string) => void
  placeholder?: string
  /**
   * When non-empty and the field is empty (single-line / collapsed), cycles these as an overlaid hint
   * with a soft crossfade. Native `placeholder` is suppressed while the overlay shows.
   */
  animatedPlaceholders?: string[]
  /** Milliseconds between animated placeholder phrases. Default 4200. */
  animatedPlaceholderIntervalMs?: number
  /**
   * When `2`, animated hints can wrap to two lines instead of a single truncated line (e.g. example hub queries).
   * Default `1` matches the original pill composer behavior.
   */
  animatedPlaceholderMaxLines?: 1 | 2
  /**
   * `attachments` — plus menu + file picker (default). `ai-mark` — Leo-style icon only (e.g. question bank hub).
   */
  leadingSlot?: "attachments" | "ai-mark"
  /** Accessible name for the textarea (paired with `htmlFor`). */
  inputLabel?: string
  /** `aria-label` on the submit control when the field has text. */
  submitButtonAriaLabel?: string
  /**
   * `send` — paper plane (chat / Ask Leo). `search` — magnifying glass (question bank hub + dedicated search).
   */
  submitAppearance?: "send" | "search"
  /** Lets the parent swap pill vs card chrome when the field grows (multiline / long text). */
  onExpandedChange?: (expanded: boolean) => void
  className?: string
}

export const AskLeoComposer = React.forwardRef<HTMLTextAreaElement, AskLeoComposerProps>(
  function AskLeoComposer(
    {
      value,
      onChange,
      onSubmit,
      placeholder = "Ask Leo anything…",
      className,
      onExpandedChange,
      animatedPlaceholders,
      animatedPlaceholderIntervalMs = 4200,
      animatedPlaceholderMaxLines = 1,
      leadingSlot = "attachments",
      inputLabel = "Message to Leo",
      submitButtonAriaLabel = "Send message",
      submitAppearance = "send",
    },
    forwardedRef,
  ) {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const reduceMotion = useReducedMotion()
    const fieldId = React.useId()
    const phrases = React.useMemo(
      () => (animatedPlaceholders ?? []).map(s => s.trim()).filter(Boolean),
      [animatedPlaceholders],
    )
    const [phraseIndex, setPhraseIndex] = React.useState(0)
    const showAnimatedPlaceholder = phrases.length > 0 && !value.trim() && !isExpanded

    React.useEffect(() => {
      if (!showAnimatedPlaceholder) return
      const id = window.setInterval(() => {
        setPhraseIndex(i => (i + 1) % phrases.length)
      }, animatedPlaceholderIntervalMs)
      return () => window.clearInterval(id)
    }, [showAnimatedPlaceholder, phrases.length, animatedPlaceholderIntervalMs])

    React.useEffect(() => {
      if (!showAnimatedPlaceholder) setPhraseIndex(0)
    }, [showAnimatedPlaceholder])

    const reportedExpandedRef = React.useRef<boolean | undefined>(undefined)
    React.useEffect(() => {
      if (reportedExpandedRef.current === isExpanded) return
      reportedExpandedRef.current = isExpanded
      onExpandedChange?.(isExpanded)
    }, [isExpanded, onExpandedChange])
    const innerRef = React.useRef<HTMLTextAreaElement>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const setTextareaRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node
        if (typeof forwardedRef === "function") {
          forwardedRef(node)
        } else if (forwardedRef) {
          ;(forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
        }
      },
      [forwardedRef],
    )

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
      const trimmed = value.trim()
      if (!trimmed) return
      onSubmit?.(trimmed)
      onChange("")
      setIsExpanded(false)
      if (innerRef.current) {
        innerRef.current.style.height = "auto"
      }
    }

    function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      onChange(e.target.value)
      if (innerRef.current) {
        innerRef.current.style.height = "auto"
        innerRef.current.style.height = `${innerRef.current.scrollHeight}px`
      }
      setIsExpanded(e.target.value.length > 100 || e.target.value.includes("\n"))
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(e as unknown as React.FormEvent)
      }
    }

    return (
      <div className={cn("min-w-0 w-full", className)}>
        <form onSubmit={handleSubmit} className="group/composer min-w-0 w-full" noValidate>
          <label htmlFor={fieldId} className="sr-only">
            {inputLabel}
          </label>
          {leadingSlot === "attachments" ? (
            <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={() => {}} />
          ) : null}

          <div
            className={cn(
              "min-w-0 w-full cursor-text overflow-hidden border border-[color:var(--control-border)] bg-card transition-[border-radius,padding] duration-200 ease-out",
              isExpanded
                ? "rounded-2xl px-2 py-2 shadow-none grid [grid-template-columns:minmax(0,1fr)] [grid-template-rows:auto_1fr_auto] [grid-template-areas:'header'_'primary'_'footer']"
                : "rounded-full px-1 py-0.5 shadow-none grid [grid-template-columns:auto_minmax(0,1fr)_auto] [grid-template-rows:minmax(0,auto)] [grid-template-areas:'header_header_header'_'leading_primary_trailing'_'._footer_.']",
            )}
          >
            <div
              className={cn("flex min-h-0 min-w-0 w-full items-center overflow-x-hidden", {
                "px-0.5 py-1": isExpanded,
                "px-0.5 py-0": !isExpanded,
              })}
              style={{ gridArea: "primary" }}
            >
              <div className="relative max-h-52 min-h-0 min-w-0 flex-1 overflow-y-auto">
                <Textarea
                  id={fieldId}
                  ref={setTextareaRef}
                  value={value}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={showAnimatedPlaceholder ? " " : placeholder}
                  autoComplete="off"
                  className={cn(
                    "min-h-0 min-w-0 w-full max-w-full resize-none rounded-none border-0 bg-transparent p-0 text-sm leading-5 text-foreground shadow-none placeholder:text-muted-foreground focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 md:text-sm dark:bg-transparent",
                    !isExpanded && "min-h-[1.25rem] py-0",
                    showAnimatedPlaceholder && "placeholder:text-transparent",
                  )}
                  rows={1}
                />
                {showAnimatedPlaceholder ? (
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-x-0 top-0 flex overflow-hidden",
                      animatedPlaceholderMaxLines === 2
                        ? "min-h-[2.5rem] items-start"
                        : "min-h-[1.25rem] items-center",
                    )}
                    aria-hidden="true"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={phraseIndex}
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reduceMotion ? 0 : -3 }}
                        transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          "block w-full text-start text-sm leading-5 text-muted-foreground",
                          animatedPlaceholderMaxLines === 2
                            ? "line-clamp-2 whitespace-normal break-words"
                            : "truncate",
                        )}
                      >
                        {phrases[phraseIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                ) : null}
              </div>
            </div>

            <div className={cn("flex shrink-0 items-center", { hidden: isExpanded })} style={{ gridArea: "leading" }}>
              {leadingSlot === "ai-mark" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      tabIndex={0}
                      role="img"
                      aria-label="AI search"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-brand outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <i
                        className="fa-light fa-star-christmas text-base text-[color:var(--brand-color-dark)] dark:text-[color:var(--brand-color-light)]"
                        aria-hidden="true"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6} className="text-xs">
                    AI search
                  </TooltipContent>
                </Tooltip>
              ) : (
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 rounded-full hover:bg-accent"
                          aria-label="Add attachments"
                        >
                          <i className="fa-light fa-plus text-base text-muted-foreground" aria-hidden="true" />
                        </Button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6} className="max-w-xs text-xs">
                      Add photos, files, and more
                    </TooltipContent>
                  </Tooltip>

                  <DropdownMenuContent align="start" className="max-w-xs rounded-2xl p-1.5">
                    <DropdownMenuGroup className="space-y-1">
                      <DropdownMenuItem
                        className="flex items-center gap-2 rounded-md"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <i className="fa-light fa-paperclip w-4 shrink-0 text-center opacity-60" aria-hidden="true" />
                        Add photos &amp; files
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 rounded-md" onClick={() => {}}>
                        <i className="fa-light fa-robot w-4 shrink-0 text-center opacity-60" aria-hidden="true" />
                        Agent mode
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 rounded-md" onClick={() => {}}>
                        <i
                          className="fa-light fa-magnifying-glass w-4 shrink-0 text-center opacity-60"
                          aria-hidden="true"
                        />
                        Deep Research
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div
              className="flex shrink-0 items-center gap-1"
              style={{ gridArea: isExpanded ? "footer" : "trailing" }}
            >
              <div className="ms-auto flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                      aria-label="Record audio message"
                    >
                      <i className="fa-light fa-microphone text-base" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={6} className="text-xs">
                    Record audio message
                  </TooltipContent>
                </Tooltip>

                {value.trim() ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="submit"
                        size="icon"
                        className="size-8 shrink-0 rounded-full"
                        aria-label={submitButtonAriaLabel}
                      >
                        <i
                          className={cn(
                            "text-base",
                            submitAppearance === "search" ? "fa-light fa-magnifying-glass" : "fa-light fa-paper-plane-top",
                          )}
                          aria-hidden="true"
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6} className="text-xs">
                      {submitButtonAriaLabel}
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
            </div>
          </div>
        </form>
      </div>
    )
  },
)
