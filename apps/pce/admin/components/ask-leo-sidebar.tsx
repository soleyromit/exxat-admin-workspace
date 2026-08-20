"use client"

/**
 * AskLeoSidebar — app-wide right sidebar for the AI assistant.
 * Mirrors the left sidebar behavior: slides in/out with a toggle button.
 * Lives in the (app) layout so it persists across all pages.
 */

import * as React from "react"
import { useLocation } from "react-router-dom"
import { useProduct } from "@/contexts/product-context"
import { productSlug } from "@/stores/app-store"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AskLeoComposer } from "@/components/ask-leo-composer"
import { LeoThreadMessages } from "@/components/leo-thread-messages"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from "@/components/ui/sidebar"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  ASK_LEO_PANEL_WIDTH_DEFAULT,
  ASK_LEO_PANEL_WIDTH_KEY,
  NestedSecondaryPanelShell,
} from "@/components/templates/nested-secondary-panel-shell"
import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom"
import { ASK_LEO_GENERIC_SUGGESTIONS, getAskLeoRouteContext } from "@/lib/ask-leo-route-context"
import { NAV_USER } from "@/lib/mock/navigation"
import { useLeoThread } from "@/lib/use-leo-thread"
import { AskLeoShortcutKbds, useAskLeo } from "@/components/ask-leo-context"
import { AskLeoViewToggle } from "@/components/ask-leo-view-toggle"

// React.lazy + Suspense for the chart bundle.
// PR-6. Same call-site shape (`<LeoIcon />`) — Suspense boundary is internal.
const LeoIconLazy = React.lazy(() =>
  import("@/components/ui/leo-icon").then(m => ({ default: m.LeoIcon })),
)

function LeoIcon(props: React.ComponentProps<typeof LeoIconLazy>) {
  return (
    <React.Suspense
      fallback={<div className="size-20" aria-hidden="true" />}
    >
      <LeoIconLazy {...props} />
    </React.Suspense>
  )
}

function isLeoLandingPath(pathname: string, leoHref: string) {
  return pathname === leoHref || pathname.startsWith(`${leoHref}/`)
}

/**
 * Right-rail Ask Leo — same shell as {@link NestedSecondaryPanelShell} / library secondary nav.
 * Sits beside `SidebarInset` in the app row (not inside the main inset card).
 */
export function AskLeoSidebar() {
  const { open, setOpen, consumePendingComposerPrompt, pageContext } = useAskLeo()
  const { setOpen: setSidebarOpen, isMobile } = useSidebar()
  const reflowZoom = useSidebarReflowZoom()
  const navFlyout = isMobile || reflowZoom
  const { pathname } = useLocation()
  const { product } = useProduct()
  const leoHref = `/${productSlug(product)}/leo`
  const isOnLeoLanding = isLeoLandingPath(pathname, leoHref)
  const [composerValue, setComposerValue] = React.useState("")
  const [composerExpanded, setComposerExpanded] = React.useState(false)
  const composerTextareaRef = React.useRef<HTMLTextAreaElement>(null)
  const {
    messages: threadMessages,
    isThinking,
    send,
    stop,
    reset,
  } = useLeoThread()
  const routeContext = React.useMemo(() => getAskLeoRouteContext(pathname), [pathname])

  const suggestions =
    pageContext?.suggestions && pageContext.suggestions.length > 0
      ? pageContext.suggestions
      : routeContext.suggestions ?? []

  const suggestionChips =
    suggestions.length > 0 ? suggestions : ASK_LEO_GENERIC_SUGGESTIONS

  const appendUserTurn = React.useCallback(
    (text: string) => {
      send(text)
    },
    [send],
  )

  React.useEffect(() => {
    if (!open) {
      reset()
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
  }, [open, consumePendingComposerPrompt, reset])

  // Collapse main sidebar when Ask Leo opens, expand when it closes
  const prevOpen = React.useRef(open)
  React.useEffect(() => {
    if (open && !prevOpen.current) setSidebarOpen(false)
    if (!open && prevOpen.current) setSidebarOpen(true)
    prevOpen.current = open
  }, [open, setSidebarOpen])

  if (isOnLeoLanding) {
    return null
  }

  return (
    <>
      {navFlyout && open ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-background/60"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <NestedSecondaryPanelShell
        open={open}
        compact={false}
        overlay={navFlyout ? (isMobile ? "mobile" : "desktop") : false}
        side="right"
        dataSlot="ask-leo-panel"
        widthPersistKey={ASK_LEO_PANEL_WIDTH_KEY}
        widthDefault={ASK_LEO_PANEL_WIDTH_DEFAULT}
        aria-label="Ask Leo — AI assistant"
        contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="flex min-h-0 flex-1 flex-col">
        {/* Header — title row + view menu + close */}
        <div className="flex shrink-0 flex-col gap-2 border-b border-sidebar-border/50 px-3 pb-3 pt-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-center gap-2 min-w-0">
                <i className="fa-duotone fa-solid fa-star-christmas text-brand shrink-0" aria-hidden="true" />
                <h2 className="font-heading m-0 truncate text-lg font-semibold tracking-tight leading-tight text-sidebar-foreground">
                  Ask Leo
                </h2>
                <StatusBadge status="beta" size="xs" className="shrink-0" />
              </div>
              <p className="text-xs leading-snug text-sidebar-foreground/60">
                Powered by AI · responses may vary
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <AskLeoViewToggle />
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="icon-button-chrome inline-flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          </div>
        </div>

        <LeoThreadMessages
          messages={threadMessages}
          isThinking={isThinking}
          emptyState={
            <div className="flex flex-col items-center gap-4">
              <LeoIcon variant="interactive" size="xl" />
              <ul
                className="m-0 flex list-none flex-wrap justify-center gap-2 p-0"
                aria-label="Suggested prompts"
              >
                {suggestionChips.map((q, i) => (
                  <li
                    key={`${i}-${q.slice(0, 24)}`}
                    className="max-w-full list-none"
                  >
                    <Badge asChild variant="prompt">
                      <button
                        type="button"
                        onClick={() => appendUserTurn(q)}
                        className="inline-flex min-h-8 w-full max-w-full cursor-pointer text-start text-xs leading-snug transition-colors hover:bg-interactive-hover"
                      >
                        <span className="line-clamp-4 px-3 py-2">{q}</span>
                      </button>
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          }
        />

        <div className="shrink-0 border-t border-sidebar-border/40 bg-[var(--secondary-panel-bg)] px-3 pb-4 pt-3 sm:pb-5">
          <AskLeoComposer
            ref={composerTextareaRef}
            value={composerValue}
            onChange={setComposerValue}
            onSubmit={appendUserTurn}
            onExpandedChange={setComposerExpanded}
            isAnalyzing={isThinking}
            onStop={stop}
            placeholder="Ask Leo anything…"
          />
        </div>
        </div>
      </NestedSecondaryPanelShell>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle button — can be placed anywhere (e.g. in SiteHeader or floating)
// ─────────────────────────────────────────────────────────────────────────────

export function AskLeoToggle({ className }: { className?: string }) {
  const { toggle, open } = useAskLeo()
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={open ? "Close Ask Leo" : "Ask Leo"}
          onClick={toggle}
          className={cn(
            open && "bg-brand/10 text-brand hover:bg-brand/15 hover:text-brand",
            className,
          )}
        >
          <i className="fa-duotone fa-solid fa-star-christmas text-sm text-brand" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex flex-wrap items-center gap-1.5">
        <span>{open ? "Close Ask Leo" : "Ask Leo"}</span>
        <AskLeoShortcutKbds />
      </TooltipContent>
    </Tooltip>
  )
}
