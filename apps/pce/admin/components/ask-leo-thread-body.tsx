"use client"

/**
 * The Ask Leo conversation itself — transcript, starter cards, composer.
 *
 * Extracted from `AskLeoSidebar` when Leo gained a second shell (the floating
 * window). Both shells render this, so the two views cannot drift: one empty
 * state, one composer, one set of route-seeded starters.
 *
 * Header chrome is deliberately *not* here. The two shells need different
 * controls — the window adds a drag handle and a minimise button — and the
 * header is the one part that legitimately differs. The two pieces both headers
 * need are exported alongside the body: `AskLeoIdentity` and
 * `AskLeoNewChatButton`.
 *
 * Thread state lives here rather than in a provider, which means switching
 * shells starts a fresh conversation. That matches how panel → full screen has
 * always behaved, and the panel already resets on close.
 *
 * Ambience is not here either. It belongs to `LeoAmbientSurface`, which the
 * full-screen route mounts as well — a layer only these two shells could reach
 * is a layer full screen was always going to be missing.
 *
 * @see components/ask-leo-sidebar.tsx — docked rail
 * @see components/ask-leo-window.tsx — floating window
 * @see components/leo-ambient-surface.tsx — the shared ambience
 */

import * as React from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

import { AskLeoComposer } from "@/components/ask-leo-composer"
import { useAskLeo } from "@/components/ask-leo-context"
import {
  LeoAmbientSurface,
  LeoComposerVeil,
} from "@/components/leo-ambient-surface"
import { useLeoAmbience } from "@/components/leo-ambience-context"
import { LeoThreadMessages } from "@/components/leo-thread-messages"
import { StatusBadge } from "@/components/ui/status-badge"
import { LeoIcon } from "@/components/ui/leo-icon"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ASK_LEO_GENERIC_SUGGESTIONS,
  getAskLeoRouteContext,
} from "@/lib/ask-leo-route-context"
import { dispatchLeoNewChat, useLeoNewChat } from "@/lib/leo-new-chat"
import { useLeoThread } from "@/lib/use-leo-thread"
import { cn } from "@/lib/utils"

/**
 * Identity block shared by both shells: mark, name, beta status, and the
 * "responses may vary" disclosure that has to appear wherever Leo answers.
 */
export function AskLeoIdentity({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <div className="flex min-w-0 items-center gap-2">
        <i
          className="fa-duotone fa-solid fa-star-christmas shrink-0 text-brand"
          aria-hidden="true"
        />
        <h2 className="font-heading m-0 truncate text-lg font-semibold leading-tight tracking-tight text-sidebar-foreground">
          Ask Leo
        </h2>
        <StatusBadge status="beta" size="xs" className="shrink-0" />
      </div>
      <p className="text-xs leading-snug text-sidebar-foreground/60">
        Powered by AI · responses may vary
      </p>
    </div>
  )
}

/**
 * New chat, for either shell's header. Hidden until there is something to
 * clear, so an untouched panel is not offering to reset itself.
 *
 * Same icon and wording as the sidebar drill-in's New chat, and the same
 * mechanism — one event, whichever shell is mounted hears it.
 */
export function AskLeoNewChatButton() {
  const { threadActive } = useAskLeo()
  if (!threadActive) return null
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={dispatchLeoNewChat}
          className="icon-button-chrome size-8 hover:bg-sidebar-accent"
          aria-label="New chat"
        >
          <i className="fa-light fa-pen-to-square text-xs" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs text-xs">
        New chat. Clears this conversation.
      </TooltipContent>
    </Tooltip>
  )
}

export function AskLeoThreadBody() {
  const {
    open,
    consumePendingComposerPrompt,
    pageContext,
    setBusy,
    setThreadActive,
  } = useAskLeo()
  const { previewThinking } = useLeoAmbience()
  const pathname = usePathname()
  const [composerValue, setComposerValue] = React.useState("")
  const composerTextareaRef = React.useRef<HTMLTextAreaElement>(null)
  const { messages: threadMessages, isThinking, send, stop, reset } = useLeoThread()
  const routeContext = React.useMemo(() => getAskLeoRouteContext(pathname), [pathname])
  const showThinkingChrome = isThinking || previewThinking

  const suggestions =
    pageContext?.suggestions && pageContext.suggestions.length > 0
      ? pageContext.suggestions
      : routeContext.suggestions ?? []

  const suggestionCards =
    suggestions.length > 0 ? suggestions : ASK_LEO_GENERIC_SUGGESTIONS

  const appendUserTurn = React.useCallback((text: string) => send(text), [send])

  // "New chat" lives in each shell's header, outside this component, so it
  // arrives as an event rather than a prop. Clearing the composer too: a
  // half-typed follow-up to a thread that no longer exists is just litter.
  useLeoNewChat(() => {
    reset()
    setComposerValue("")
    queueMicrotask(() => composerTextareaRef.current?.focus())
  })

  React.useEffect(() => {
    if (!open) {
      reset()
      setComposerValue("")
      return
    }
    // Only written when a prompt was actually waiting. Consuming is a one-shot
    // read, so `setComposerValue(pending ?? "")` erased the prompt the moment
    // this effect ran a second time against the same `open` — which StrictMode
    // does on every mount in dev, leaving every `openWithPrompt` entry point
    // (command menu, insight cards, home) opening an empty composer. The close
    // branch above is what clears the field, so nothing here needs to.
    const pending = consumePendingComposerPrompt()
    if (pending !== null) setComposerValue(pending)
    // Focus lands here on every open, not only prompt-seeded ones. Both shells
    // portal to the end of the body, so leaving focus where it was stranded the
    // whole surface behind every other control on the page.
    queueMicrotask(() => composerTextareaRef.current?.focus())
  }, [open, consumePendingComposerPrompt, reset])

  // Republish thinking so entry points outside this component (the floating
  // launcher) can show it. Cleared on unmount, or a shell closed mid-answer
  // would leave the launcher spinning forever.
  React.useEffect(() => {
    setBusy(isThinking)
    return () => setBusy(false)
  }, [isThinking, setBusy])

  // Same contract for "is there a thread here" — the header's New chat button
  // is outside this component and must not offer to clear an empty panel.
  const hasThread = threadMessages.length > 0
  React.useEffect(() => {
    setThreadActive(hasThread)
    return () => setThreadActive(false)
  }, [hasThread, setThreadActive])

  return (
    <LeoAmbientSurface
      active={open}
      thinking={showThinkingChrome}
      hasThread={hasThread}
    >
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        {hasThread ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <LeoThreadMessages
              messages={threadMessages}
              isThinking={isThinking}
              transcriptOutline
              contentClassName="pb-8"
            />
          </div>
        ) : (
          // Star sits in the open field between the header and the suggestions.
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4">
            <LeoIcon variant="interactive" size="xl" />
          </div>
        )}

        {/* Transparent foot — soft blur only, no opaque fill (when veil on). */}
        <div className="relative shrink-0 px-3 pb-4 pt-2 sm:pb-5">
          <LeoComposerVeil />
          <div className="relative flex flex-col gap-2.5">
            {!hasThread ? (
              <ul
                className="m-0 flex w-full list-none flex-col gap-2 p-0"
                aria-label="Suggested prompts"
              >
                {suggestionCards.map((q, i) => (
                  <li key={`${i}-${q.slice(0, 24)}`} className="list-none">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => appendUserTurn(q)}
                      className="group h-auto w-full items-start gap-2.5 rounded-xl border border-border/80 bg-card/55 p-3 text-start text-[0.8125rem] font-normal leading-snug shadow-xs backdrop-blur-md transition-[border-color,box-shadow,background-color] hover:border-brand/35 hover:bg-interactive-hover/80 hover:shadow-md"
                    >
                      <span className="flex-1">{q}</span>
                      <i
                        className="fa-light fa-arrow-right mt-[0.2rem] shrink-0 text-[0.7rem] text-muted-foreground transition-colors group-hover:text-brand"
                        aria-hidden="true"
                      />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
            <AskLeoComposer
              ref={composerTextareaRef}
              value={composerValue}
              onChange={setComposerValue}
              onSubmit={appendUserTurn}
              isAnalyzing={isThinking}
              onStop={stop}
              placeholder="Ask Leo anything…"
            />
          </div>
        </div>
      </div>
    </LeoAmbientSurface>
  )
}
