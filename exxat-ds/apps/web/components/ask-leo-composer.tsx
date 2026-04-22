"use client"

/**
 * AskLeoComposer — adapted from @blocks-so/ai-01 (AI chat composer).
 * Uses Exxat tokens (bg-card, border-border, etc.) and Font Awesome instead of Tabler.
 */

import * as React from "react"

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
  className?: string
  /** Lets the parent swap pill vs card chrome when the field grows (multiline / long text). */
  onExpandedChange?: (expanded: boolean) => void
}

export const AskLeoComposer = React.forwardRef<HTMLTextAreaElement, AskLeoComposerProps>(
  function AskLeoComposer(
    { value, onChange, onSubmit, placeholder = "Ask Leo anything…", className, onExpandedChange },
    forwardedRef,
  ) {
    const [isExpanded, setIsExpanded] = React.useState(false)
    const fieldId = React.useId()

    React.useEffect(() => {
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
      <div className={cn("w-full", className)}>
        <form onSubmit={handleSubmit} className="group/composer w-full" noValidate>
          <label htmlFor={fieldId} className="sr-only">
            Message to Leo
          </label>
          <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={() => {}} />

          <div
            className={cn(
              "w-full cursor-text overflow-hidden border border-border/80 bg-card transition-[border-radius,padding] duration-200 ease-out",
              isExpanded
                ? "rounded-2xl px-2 py-2 shadow-none grid [grid-template-columns:1fr] [grid-template-rows:auto_1fr_auto] [grid-template-areas:'header'_'primary'_'footer']"
                : "rounded-full px-1 py-0.5 shadow-none grid [grid-template-columns:auto_1fr_auto] [grid-template-rows:minmax(0,auto)] [grid-template-areas:'header_header_header'_'leading_primary_trailing'_'._footer_.']",
            )}
          >
            <div
              className={cn("flex min-h-0 items-center overflow-x-hidden", {
                "px-0.5 py-1": isExpanded,
                "px-0.5 py-0": !isExpanded,
              })}
              style={{ gridArea: "primary" }}
            >
              <div className="max-h-52 min-h-0 flex-1 overflow-y-auto">
                <Textarea
                  id={fieldId}
                  ref={setTextareaRef}
                  value={value}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder={placeholder}
                  autoComplete="off"
                  className={cn(
                    "min-h-0 resize-none rounded-none border-0 bg-transparent p-0 text-sm leading-5 text-foreground shadow-none placeholder:text-foreground/55 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 md:text-sm dark:placeholder:text-foreground/50",
                    !isExpanded && "min-h-[1.25rem] py-0",
                  )}
                  rows={1}
                />
              </div>
            </div>

            <div className={cn("flex items-center", { hidden: isExpanded })} style={{ gridArea: "leading" }}>
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
                      <i className="fa-light fa-magnifying-glass w-4 shrink-0 text-center opacity-60" aria-hidden="true" />
                      Deep Research
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div
              className="flex items-center gap-1"
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
                      <Button type="submit" size="icon" className="size-8 shrink-0 rounded-full" aria-label="Send message">
                        <i className="fa-light fa-paper-plane-top text-base" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6} className="text-xs">
                      Send message
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
