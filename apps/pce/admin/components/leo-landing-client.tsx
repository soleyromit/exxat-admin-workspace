"use client"

/**
 * LeoLandingClient — body of the per-product Leo route (`/<product>/leo`).
 *
 * Two modes on the same canvas, driven by `messages.length`:
 *   1. Empty   — vertically-centered hero (greeting + composer + tiny chip rail).
 *   2. Thread  — chat-style conversation, composer pinned at the bottom.
 *
 * Recents are PERSISTED and surfaced in the sidebar drill-in
 * (`LeoSidebarDrillInPanel`) — not on the canvas. Sticky back trail lives in
 * `SiteHeader` on `LeoPage`; the canvas is the conversation surface.
 *
 * The `AskLeoSidebar` Sheet stays mounted at the app shell for ⌘⌥K +
 * inline KPI/chart quick-asks. Those are ephemeral and do NOT push to
 * recents (only landing submissions do, per the brief).
 */

import * as React from "react"
import { useLocation } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { AskLeoComposer } from "@/components/ask-leo-composer"
import { AskLeoViewToggle } from "@/components/ask-leo-view-toggle"
import { LeoThreadMessages } from "@/components/leo-thread-messages"
import { LeoSidebarToggle } from "@/components/leo-page-chrome"
import { useLeoThread } from "@/lib/use-leo-thread"
import { useLeoRecents } from "@/lib/leo-recents"
import { NAV_USER } from "@/lib/mock/navigation"
import { cn } from "@/lib/utils"

const LeoIconLazy = React.lazy(() =>
  import("@/components/ui/leo-icon").then((m) => ({ default: m.LeoIcon })),
)

function LeoIcon(props: React.ComponentProps<typeof LeoIconLazy>) {
  return (
    <React.Suspense fallback={<div className="size-16" aria-hidden="true" />}>
      <LeoIconLazy {...props} />
    </React.Suspense>
  )
}

/**
 * Three chips only — picked to bias the user toward action, not feature
 * discovery. Capability discovery moved out of the canvas per user
 * feedback ("too much").
 */
const HERO_CHIPS = [
  "What needs my attention today?",
  "Find students missing immunization docs",
  "Draft a status note to a preceptor",
]

const NEW_CHAT_EVENT = "exxat:leo:new-chat"

/**
 * Imperative trigger fired by the sidebar drill-in's "New chat" button —
 * the landing listens and resets its thread without round-tripping through
 * URL state. Keeps the canvas the source of truth for thread membership.
 */
export function dispatchLeoNewChat() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(NEW_CHAT_EVENT))
}

export interface LeoLandingClientProps {
  /** URL slug of the active product — applied to the canvas as a data hook. */
  productSlug: string
}

export function LeoLandingClient({ productSlug }: LeoLandingClientProps) {
  const [composerValue, setComposerValue] = React.useState("")
  const composerRef = React.useRef<HTMLTextAreaElement>(null)
  const { pathname } = useLocation()
  const { push: pushRecent } = useLeoRecents()
  const greetingName = React.useMemo(() => firstName(NAV_USER.name), [])

  // Landing pushes every successful turn into recents. Sheet quick-asks
  // do NOT push (ephemeral) — see `AskLeoSidebar` which uses the same
  // hook without an `onUserTurn`.
  const handleUserTurn = React.useCallback(
    (prompt: string) => {
      pushRecent(prompt, pathname)
    },
    [pushRecent, pathname],
  )

  const { messages, isThinking, send, stop, reset } = useLeoThread({
    onUserTurn: handleUserTurn,
  })
  const isEmpty = messages.length === 0

  // Listen for "New chat" from the sidebar drill-in.
  React.useEffect(() => {
    const onNewChat = () => {
      reset()
      setComposerValue("")
      queueMicrotask(() => composerRef.current?.focus())
    }
    window.addEventListener(NEW_CHAT_EVENT, onNewChat)
    return () => window.removeEventListener(NEW_CHAT_EVENT, onNewChat)
  }, [reset])

  // Autofocus the composer on first paint so a keyboard user can type
  // immediately (P6 keyboard parity; ChatGPT / Claude / Linear pattern).
  React.useEffect(() => {
    const id = window.setTimeout(() => composerRef.current?.focus(), 50)
    return () => window.clearTimeout(id)
  }, [])

  const handleSubmit = React.useCallback(
    (prompt: string) => {
      const trimmed = prompt.trim()
      if (!trimmed) return
      send(trimmed)
      setComposerValue("")
    },
    [send],
  )

  const composerProps = {
    value: composerValue,
    onChange: setComposerValue,
    onSubmit: handleSubmit,
    isAnalyzing: isThinking,
    onStop: stop,
  } as const

  return (
    <div
      className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-background"
      data-leo-surface={productSlug}
    >
      <LeoSidebarToggle />
      <div className="pointer-events-none absolute end-0 top-0 z-50 p-3 lg:p-4">
        <AskLeoViewToggle className="pointer-events-auto" />
      </div>
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        {isEmpty ? (
          <EmptyHero
            greetingName={greetingName}
            onChipSelect={handleSubmit}
            composer={<HeroComposer ref={composerRef} {...composerProps} />}
          />
        ) : (
          <ConversationPane
            messages={messages}
            isThinking={isThinking}
            composer={
              <HeroComposer ref={composerRef} {...composerProps} size="compact" />
            }
          />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty hero
// ─────────────────────────────────────────────────────────────────────────────

function EmptyHero({
  greetingName,
  composer,
  onChipSelect,
}: {
  greetingName: string
  composer: React.ReactNode
  onChipSelect: (prompt: string) => void
}) {
  const greeting = React.useMemo(() => pickGreeting(), [])
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-12">
      <div className="flex flex-col items-center gap-6 pt-[clamp(5rem,18vh,9rem)] text-center">
        <LeoIcon
          variant="interactive"
          size="xl"
          className="[animation:leo-chip-in_520ms_cubic-bezier(0.22,1,0.36,1)_both]"
        />
        <div className="flex flex-col items-center gap-1.5">
          <h1
            className="m-0 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl font-heading"
                     >
            {greeting}, {greetingName}.
          </h1>
          <p className="text-sm leading-snug text-muted-foreground">
            What's on your mind?
          </p>
        </div>
      </div>

      <div className="mt-6 w-full">{composer}</div>

      <ul
        className="m-0 mt-6 flex list-none flex-wrap justify-center gap-2 p-0"
        aria-label="Suggested prompts"
      >
        {HERO_CHIPS.map((q, i) => (
          <li
            key={q}
            className="max-w-full list-none [animation:leo-chip-in_420ms_cubic-bezier(0.22,1,0.36,1)_both]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <Badge
              asChild
              variant="prompt"
              className="transition-transform duration-150 hover:-translate-y-0.5"
            >
              <button
                type="button"
                onClick={() => onChipSelect(q)}
                className="inline-flex min-h-8 w-full max-w-full cursor-pointer text-start text-xs leading-snug text-foreground transition-colors hover:bg-interactive-hover hc:hover:bg-background"
              >
                <span className="line-clamp-2 px-3 py-2 text-foreground">{q}</span>
              </button>
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversation pane (after first turn)
// ─────────────────────────────────────────────────────────────────────────────

function ConversationPane({
  messages,
  isThinking,
  composer,
}: {
  messages: ReturnType<typeof useLeoThread>["messages"]
  isThinking: boolean
  composer: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <LeoThreadMessages
        messages={messages}
        isThinking={isThinking}
        maxWidthClassName="max-w-2xl"
        contentClassName="gap-5 pb-40 pt-8"
        className="absolute inset-0"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-6 pt-10">
        <div
          className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-t from-background via-background/80 to-transparent"
          aria-hidden="true"
        />
        <div className="pointer-events-auto relative z-[1] mx-auto w-full max-w-2xl">
          {composer}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Composer chrome — wraps `AskLeoComposer` in a Leo-themed card
// ─────────────────────────────────────────────────────────────────────────────

const HeroComposer = React.forwardRef<
  HTMLTextAreaElement,
  {
    value: string
    onChange: (v: string) => void
    onSubmit: (v: string) => void
    isAnalyzing?: boolean
    onStop?: () => void
    /** `default` (hero) / `compact` (conversation footer). */
    size?: "default" | "compact"
  }
>(function HeroComposer(
  { value, onChange, onSubmit, isAnalyzing, onStop, size = "default" },
  ref,
) {
  return (
    <AskLeoComposer
      ref={ref}
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      isAnalyzing={isAnalyzing}
      onStop={onStop}
      placeholder="Ask Leo anything…"
      inputLabel="Ask Leo"
      submitButtonAriaLabel="Send to Leo"
      shellMaxWidth="2xl"
      className={size === "compact" ? "max-w-full" : undefined}
    />
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function firstName(full: string): string {
  return full.split(/\s+/)[0] ?? full
}

function pickGreeting(): string {
  if (typeof window === "undefined") return "Hi"
  const h = new Date().getHours()
  if (h < 5) return "Working late"
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  if (h < 21) return "Good evening"
  return "Good night"
}
