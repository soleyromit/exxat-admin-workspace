"use client"

/**
 * AskLeoSidebar — app-wide right sidebar for the AI assistant.
 * Mirrors the left sidebar behavior: slides in/out with a toggle button.
 * Lives in the (app) layout so it persists across all pages.
 */

import * as React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AskLeoComposer } from "@/components/ask-leo-composer"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from "@/components/ui/sidebar"
import { StatusBadge } from "@/components/ui/status-badge"
import { AiThinkingOverlay } from "@/components/ui/ai-thinking-surface"
import { useAltKeyLabel, useModKeyLabel } from "@/hooks/use-mod-key-label"
import { ASK_LEO_GENERIC_SUGGESTIONS, getAskLeoRouteContext } from "@/lib/ask-leo-route-context"
import { isEditableTarget } from "@/lib/editable-target"
import { NAV_USER } from "@/lib/mock/navigation"

/** shadcn Avatar + AvatarFallback (required); icon matches header — no photo asset. */
function LeoAvatar({ className }: { className?: string }) {
  return (
    <Avatar size="sm" className={cn("mt-0.5 shrink-0", className)}>
      <AvatarFallback className="bg-brand/15 p-0">
        <span className="sr-only">Leo</span>
        <i className="fa-duotone fa-solid fa-star-christmas text-xs text-brand" aria-hidden="true" />
      </AvatarFallback>
    </Avatar>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Context — share open state with any page (e.g. "Ask Leo" buttons on cards)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Page context that pages register with `useAskLeoPageContext` so Leo knows
 * what the user is currently looking at. Title is shown in the welcome
 * bubble; `suggestions` replace the generic prompt list when present; and
 * `data` is an opaque payload the downstream API call can echo back.
 */
export interface AskLeoPageContext {
  /** Human-readable page name, e.g. "Placements" or "Compliance dashboard". */
  title: string
  /** Optional one-line description ("42 active placements, 3 pending review"). */
  description?: string
  /** Page-specific starter prompts — replace the generic 4 when provided. */
  suggestions?: string[]
  /** Arbitrary payload handed to the assistant API at send time. */
  data?: Record<string, unknown>
}

interface AskLeoContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  /** Open the sidebar and prefill the composer (e.g. command palette AI suggestions). */
  openWithPrompt: (prompt: string) => void
  /** Internal — AskLeoSidebar consumes pending text when opening. */
  consumePendingComposerPrompt: () => string | null
  /** Current page context (or null if no page has registered one). */
  pageContext: AskLeoPageContext | null
  /** Register/replace the current page's context. */
  setPageContext: (ctx: AskLeoPageContext | null) => void
}

const AskLeoContext = React.createContext<AskLeoContextValue>({
  open: false,
  setOpen: () => {},
  toggle: () => {},
  openWithPrompt: () => {},
  consumePendingComposerPrompt: () => null,
  pageContext: null,
  setPageContext: () => {},
})

export function useAskLeo() {
  return React.useContext(AskLeoContext)
}

/**
 * Pages call this at the top of their client component to tell Leo what
 * surface the user is on. Unregisters on unmount (so route changes clear
 * stale context). Memoize `ctx` to avoid update loops — use `React.useMemo`.
 *
 * @example
 *   useAskLeoPageContext(React.useMemo(() => ({
 *     title: "Placements",
 *     description: `${rows.length} rows, ${filters.active} filters active`,
 *     suggestions: [
 *       "Summarize placements ending this month",
 *       "Which sites are at capacity?",
 *     ],
 *   }), [rows.length, filters.active]))
 */
export function useAskLeoPageContext(ctx: AskLeoPageContext | null) {
  const { setPageContext } = React.useContext(AskLeoContext)
  React.useEffect(() => {
    setPageContext(ctx)
    return () => setPageContext(null)
  }, [ctx, setPageContext])
}

export function AskLeoProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [pageContext, setPageContext] = React.useState<AskLeoPageContext | null>(null)
  const toggle = React.useCallback(() => setOpen(v => !v), [])
  const pendingComposerPromptRef = React.useRef<string | null>(null)

  const openWithPrompt = React.useCallback((prompt: string) => {
    pendingComposerPromptRef.current = prompt
    setOpen(true)
  }, [])

  const consumePendingComposerPrompt = React.useCallback(() => {
    const p = pendingComposerPromptRef.current
    pendingComposerPromptRef.current = null
    return p
  }, [])

  const value = React.useMemo(
    () => ({ open, setOpen, toggle, openWithPrompt, consumePendingComposerPrompt, pageContext, setPageContext }),
    [open, toggle, openWithPrompt, consumePendingComposerPrompt, pageContext],
  )

  /** ⌘⌥K / Ctrl+Alt+K — avoids browser ⌘⇧N (incognito), ⌘⇧O (bookmarks), and Ctrl+Alt+L (lock on some Linux). */
  React.useEffect(() => {
    function onGlobalKeyDown(e: KeyboardEvent) {
      if (!e.altKey || (!e.metaKey && !e.ctrlKey)) return
      if (e.key.toLowerCase() !== "k") return
      if (isEditableTarget(e.target)) return
      e.preventDefault()
      toggle()
    }
    document.addEventListener("keydown", onGlobalKeyDown)
    return () => document.removeEventListener("keydown", onGlobalKeyDown)
  }, [toggle])

  return (
    <AskLeoContext.Provider value={value}>
      {children}
    </AskLeoContext.Provider>
  )
}

type LeoThreadMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  /** Assistant-only: show thinking animation until the reply is applied. */
  pending?: boolean
}

function mockAssistantReply(userText: string): string {
  return `Thanks — I received: “${userText.slice(0, 120)}${userText.length > 120 ? "…" : ""}”. Wire your assistant API here to return a real answer.`
}

const LEO_REPLY_DELAY_MS = 3500

/** Three-dot typing indicator shown next to Leo's avatar while a reply is pending. */
function LeoThinkingStatus() {
  return (
    <span role="status" aria-live="polite" className="inline-flex items-center gap-1">
      <span className="sr-only">Leo is thinking</span>
      <span
        aria-hidden
        className="inline-block size-1.5 rounded-full bg-brand/70 [animation:leo-typing-dot_1.2s_ease-in-out_infinite]"
      />
      <span
        aria-hidden
        className="inline-block size-1.5 rounded-full bg-brand/70 [animation:leo-typing-dot_1.2s_ease-in-out_0.2s_infinite]"
      />
      <span
        aria-hidden
        className="inline-block size-1.5 rounded-full bg-brand/70 [animation:leo-typing-dot_1.2s_ease-in-out_0.4s_infinite]"
      />
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar component
// ─────────────────────────────────────────────────────────────────────────────

export function AskLeoSidebar() {
  const { open, setOpen, consumePendingComposerPrompt, pageContext } = useAskLeo()
  const { setOpen: setSidebarOpen } = useSidebar()
  const [composerValue, setComposerValue] = React.useState("")
  const [composerExpanded, setComposerExpanded] = React.useState(false)
  const [threadMessages, setThreadMessages] = React.useState<LeoThreadMessage[]>([])
  const composerTextareaRef = React.useRef<HTMLTextAreaElement>(null)
  const conversationScrollRef = React.useRef<HTMLDivElement>(null)
  const pendingReplyTimeoutsRef = React.useRef<number[]>([])

  const clearPendingReplyTimeouts = React.useCallback(() => {
    pendingReplyTimeoutsRef.current.forEach(clearTimeout)
    pendingReplyTimeoutsRef.current = []
  }, [])
  const pathname = usePathname()
  const routeContext = React.useMemo(() => getAskLeoRouteContext(pathname), [pathname])
  const isThinking = threadMessages.some((m) => m.pending)

  const pageTitle = pageContext?.title ?? routeContext.title
  const pageDescription = pageContext?.description ?? routeContext.description
  const suggestions =
    pageContext?.suggestions && pageContext.suggestions.length > 0
      ? pageContext.suggestions
      : routeContext.suggestions ?? []

  const suggestionChips =
    suggestions.length > 0 ? suggestions : ASK_LEO_GENERIC_SUGGESTIONS

  const appendUserTurn = React.useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const userId = crypto.randomUUID()
    const asstId = crypto.randomUUID()
    setThreadMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: trimmed },
      { id: asstId, role: "assistant", content: "", pending: true },
    ])
    const tid = window.setTimeout(() => {
      setThreadMessages((prev) =>
        prev.map((m) =>
          m.id === asstId && m.role === "assistant"
            ? { ...m, content: mockAssistantReply(trimmed), pending: false }
            : m,
        ),
      )
      pendingReplyTimeoutsRef.current = pendingReplyTimeoutsRef.current.filter((t) => t !== tid)
    }, LEO_REPLY_DELAY_MS)
    pendingReplyTimeoutsRef.current.push(tid)
  }, [])

  React.useEffect(() => {
    if (!open) return
    const el = conversationScrollRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
  }, [threadMessages, open])

  React.useEffect(() => {
    if (!open) {
      clearPendingReplyTimeouts()
      setThreadMessages([])
      setComposerValue("")
      return
    }
    const pending = consumePendingComposerPrompt()
    if (pending !== null) {
      setComposerValue(pending)
      queueMicrotask(() => composerTextareaRef.current?.focus())
    } else {
      setComposerValue("")
    }
  }, [open, consumePendingComposerPrompt, clearPendingReplyTimeouts])

  React.useEffect(() => () => clearPendingReplyTimeouts(), [clearPendingReplyTimeouts])

  // Collapse main sidebar when Ask Leo opens, expand when it closes
  const prevOpen = React.useRef(open)
  React.useEffect(() => {
    if (open && !prevOpen.current) setSidebarOpen(false)
    if (!open && prevOpen.current) setSidebarOpen(true)
    prevOpen.current = open
  }, [open, setSidebarOpen])

  return (
    <aside
      aria-label="Ask Leo — AI assistant"
      data-state={open ? "open" : "closed"}
      className={cn(
        "flex flex-col overflow-hidden",
        "transition-[width,margin,opacity] duration-200 ease-linear",
        open
          // Viewport-tall panel + `sticky` so document scrolling stays on the main column; thread
          // scrolls inside `role="log"`. (Do not lock the app shell with `overflow-hidden` / `h-svh`.)
          ? "relative sticky top-2 w-80 shrink-0 self-start m-2 ml-0 h-[calc(100dvh-1.25rem)] max-h-[calc(100dvh-1.25rem)] min-h-0 overflow-hidden rounded-xl border border-sidebar-border/80 shadow-[0_18px_48px_-16px_rgba(15,23,42,0.2),0_8px_20px_-10px_rgba(15,23,42,0.12)] ring-1 ring-sidebar-border dark:shadow-[0_22px_56px_-12px_rgba(0,0,0,0.5),0_10px_28px_-12px_rgba(0,0,0,0.35)]"
          : // Closed: collapse height — opacity-0/invisible still participate in layout and were
            // stretching the app row to ~100svh, leaving empty scroll + gray below the main inset.
            "h-0 min-h-0 shrink overflow-hidden border-0 p-0 m-0 min-w-0 w-0 max-w-0 opacity-0 pointer-events-none"
      )}
      style={
        open
          ? {
              background:
                "linear-gradient(180deg, color-mix(in oklch, var(--brand-color) 4%, var(--background)) 0%, color-mix(in oklch, var(--brand-color) 8%, var(--background)) 100%)",
            }
          : undefined
      }
    >
      <AiThinkingOverlay active={open && isThinking} />
      {/* min-w only when open — avoids flex min-width:auto stealing width / hit-testing when closed */}
      <div
        className={cn(
          "relative z-[1] flex min-h-0 min-w-0 flex-1 flex-col",
          open ? "min-w-[320px]" : "hidden min-w-0 w-0"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 px-4 py-3 shrink-0">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <i className="fa-duotone fa-solid fa-star-christmas text-brand shrink-0" aria-hidden="true" />
              <h1
                className="m-0 text-lg font-semibold tracking-tight leading-tight text-sidebar-foreground truncate"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Ask Leo
              </h1>
              <StatusBadge status="beta" size="xs" className="shrink-0" />
            </div>
            <p className="text-[11px] leading-snug text-sidebar-foreground/60">
              Powered by AI · responses may vary
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Close Ask Leo"
              >
                <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex max-w-xs flex-wrap items-center gap-1.5 text-xs">
              <span>Close Ask Leo</span>
              <AskLeoShortcutKbds />
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Conversation scrolls; composer sits in a footer strip so the pill can “float” above the bottom inset. */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            ref={conversationScrollRef}
            className={cn(
              "min-h-0 flex-1 scroll-smooth overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 py-4 [-webkit-overflow-scrolling:touch]",
              threadMessages.length === 0 && "flex items-center justify-center",
            )}
            role="log"
            aria-label="Conversation with Leo"
            aria-live="polite"
          >
            <div className={cn("flex flex-col gap-4", threadMessages.length === 0 && "w-full items-center")}>
              {threadMessages.length === 0 ? (
                <>
                  <i
                    aria-hidden="true"
                    className="fa-duotone fa-solid fa-star-christmas text-brand text-3xl [animation:leo-chip-in_520ms_cubic-bezier(0.22,1,0.36,1)_both]"
                  />
                  <ul className="m-0 flex list-none flex-wrap justify-center gap-2 p-0" aria-label="Suggested prompts">
                  {suggestionChips.map((q, i) => (
                    <li
                      key={`${i}-${q.slice(0, 24)}`}
                      className="max-w-full list-none [animation:leo-chip-in_420ms_cubic-bezier(0.22,1,0.36,1)_both]"
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      <Badge
                        asChild
                        variant="outline"
                        className="h-auto min-h-8 max-w-full items-stretch whitespace-normal rounded-4xl border-border/90 bg-card px-0 py-0 font-normal text-card-foreground shadow-sm transition-transform duration-150 hover:-translate-y-0.5 dark:border-border dark:bg-card"
                      >
                        <button
                          type="button"
                          onClick={() => appendUserTurn(q)}
                          className="inline-flex min-h-8 w-full max-w-full cursor-pointer text-start text-xs leading-snug transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground dark:hover:bg-sidebar-accent/40"
                        >
                          <span className="line-clamp-4 px-3 py-2">{q}</span>
                        </button>
                      </Badge>
                    </li>
                  ))}
                </ul>
                </>
              ) : (
                threadMessages.map((m) =>
                  m.role === "user" ? (
                    <div key={m.id} className="flex flex-row-reverse gap-3">
                      <Avatar size="sm" className="mt-0.5 shrink-0">
                        <AvatarImage src={NAV_USER.avatar} alt="" />
                        <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
                          {NAV_USER.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 max-w-[min(100%,18rem)] rounded-lg rounded-tr-sm bg-primary px-3 py-2.5 text-start text-sm leading-relaxed text-primary-foreground shadow-sm">
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    <div key={m.id} className="flex gap-3">
                      <LeoAvatar />
                      <div className="min-w-0 flex-1 pt-0.5 text-start text-sm leading-relaxed text-sidebar-foreground">
                        {m.pending ? (
                          <LeoThinkingStatus />
                        ) : (
                          <p className="m-0">{m.content}</p>
                        )}
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          </div>

          <div className="shrink-0 bg-gradient-to-t from-sidebar/85 via-sidebar/25 to-transparent px-3 pb-4 pt-6 sm:pb-5">
            <div
              className={cn(
                "mx-1 border border-border/80 bg-card/95 shadow-[0_22px_56px_-14px_rgba(15,23,42,0.28),0_10px_28px_-10px_rgba(15,23,42,0.18),0_2px_8px_-2px_rgba(15,23,42,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-card/92 dark:border-border/55 dark:shadow-[0_24px_64px_-12px_rgba(0,0,0,0.62),0_12px_32px_-12px_rgba(0,0,0,0.42),0_4px_12px_-4px_rgba(0,0,0,0.35)]",
                composerExpanded ? "rounded-2xl p-1.5" : "rounded-full px-1 py-1",
              )}
            >
              <AskLeoComposer
                ref={composerTextareaRef}
                value={composerValue}
                onChange={setComposerValue}
                onSubmit={appendUserTurn}
                onExpandedChange={setComposerExpanded}
                placeholder="Ask Leo anything…"
                className="[&_form>div]:rounded-none [&_form>div]:border-0 [&_form>div]:bg-transparent [&_form>div]:shadow-none"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle button — can be placed anywhere (e.g. in SiteHeader or floating)
// ─────────────────────────────────────────────────────────────────────────────

/** Keyboard shortcut hint for tooltips (⌘⌥K / Ctrl+Alt+K). */
export function AskLeoShortcutKbds({ className }: { className?: string }) {
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()
  return (
    <KbdGroup className={className}>
      <Kbd>{mod}</Kbd>
      <Kbd>{alt}</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  )
}

export function AskLeoToggle({ className }: { className?: string }) {
  const { toggle, open } = useAskLeo()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={toggle}
          className={cn("gap-1.5", open && "bg-brand/10 border-brand/30 text-brand", className)}
        >
          <i className="fa-duotone fa-solid fa-star-christmas text-xs text-brand" aria-hidden="true" />
          Ask Leo
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex flex-wrap items-center gap-1.5">
        <span>{open ? "Close Ask Leo" : "Ask Leo"}</span>
        <AskLeoShortcutKbds />
      </TooltipContent>
    </Tooltip>
  )
}
