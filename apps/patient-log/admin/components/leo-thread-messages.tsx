"use client"

/**
 * Shared Leo conversation transcript — Message / Bubble / Marker / MessageScroller.
 * Used by the Ask Leo rail, floating window, and focused Leo landing canvas.
 *
 * Scroll behaviors (shadcn MessageScroller): turn anchoring, live-edge autoScroll,
 * last-anchor open, circular jump buttons, and a vertical transcript outline
 * driven by useMessageScrollerVisibility + Marker jump rows.
 */

import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { LeoIcon } from "@/components/ui/leo-icon"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScroller,
  useMessageScrollerVisibility,
} from "@/components/ui/message-scroller"
import type { LeoThreadMessage } from "@/lib/use-leo-thread"
import { NAV_USER } from "@/lib/mock/navigation"
import { cn } from "@/lib/utils"

export interface LeoThreadMessagesProps {
  messages: LeoThreadMessage[]
  isThinking?: boolean
  /** Center content when the thread is empty (hero, suggestion chips). */
  emptyState?: React.ReactNode
  className?: string
  contentClassName?: string
  /** Wider max width for the landing canvas. */
  maxWidthClassName?: string
  ariaLabel?: string
  /**
   * Vertical tick rail + Marker outline for jumping between user turns.
   * Defaults on when the thread has at least two user anchors.
   */
  transcriptOutline?: boolean
}

function LeoThinkingMarker() {
  return (
    <Marker role="status" aria-live="polite">
      {/* The star's own `working` gesture instead of a generic spinner. A spinner
          says "a process is running"; the turning, pulsing star says *Leo* is the
          one working, and it is the same motion the launcher and the toggle show
          while busy — one vocabulary for one state. `size-5` because the star is
          20px at its smallest and the slot defaults to 16px. */}
      <MarkerIcon className="size-5">
        <LeoIcon variant="ambient" size="xs" state="working" />
      </MarkerIcon>
      <MarkerContent className="shimmer font-medium">Leo is thinking…</MarkerContent>
    </Marker>
  )
}

function LeoThreadTurn({ message }: { message: LeoThreadMessage }) {
  if (message.role === "user") {
    return (
      <Message align="end">
        <MessageAvatar>
          <Avatar size="sm">
            <AvatarImage src={NAV_USER.avatar} alt="" />
            <AvatarFallback className="bg-secondary text-xs font-medium text-secondary-foreground">
              {NAV_USER.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <Bubble variant="default">
            <BubbleContent>{message.content}</BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    )
  }

  // No avatar on Leo's side. There is only ever one assistant in the thread and
  // its turns are already unmistakable — plain text, left-aligned, against the
  // user's filled right-aligned bubbles. The 32px avatar column bought nothing
  // and cost every answer a third of a line of width, which in a 420px window is
  // the difference between a table that fits and one that wraps.
  return (
    <Message>
      <MessageContent>
        {message.pending ? (
          <LeoThinkingMarker />
        ) : (
          <Bubble variant="ghost">
            <BubbleContent className="text-sidebar-foreground">
              {message.content}
            </BubbleContent>
          </Bubble>
        )}
      </MessageContent>
    </Message>
  )
}

function trimmedAnchorLabel(content: string) {
  return content.length > 42 ? `${content.slice(0, 39)}…` : content
}

/**
 * Vertical position rail + Marker jump menu (shadcn Transcript Outline).
 * Must render inside MessageScrollerProvider.
 */
function LeoTranscriptOutline({
  anchors,
}: {
  anchors: LeoThreadMessage[]
}) {
  const { scrollToMessage } = useMessageScroller()
  const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility()

  if (anchors.length === 0) return null

  const visibleIds = new Set(visibleMessageIds)

  return (
    <HoverCard openDelay={80} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label="Open transcript outline"
          className={cn(
            "h-9 w-9 flex-col items-center justify-center gap-1 rounded-md p-0",
            "bg-background/80 shadow-sm ring-1 ring-foreground/10 backdrop-blur-sm",
            "hover:bg-muted",
          )}
        >
          {anchors.map((message) => {
            const current = message.id === currentAnchorId
            const visible = visibleIds.has(message.id)
            return (
              <span
                key={message.id}
                data-current={current ? "true" : undefined}
                data-visible={visible ? "true" : undefined}
                className={cn(
                  "h-0.5 w-4 rounded-full bg-muted-foreground/40 transition-colors",
                  "data-[visible=true]:bg-muted-foreground/70",
                  "data-[current=true]:h-1 data-[current=true]:bg-foreground",
                )}
              />
            )
          })}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent
        align="center"
        side="left"
        sideOffset={8}
        className="flex w-64 flex-col gap-1 rounded-2xl p-1 shadow-md"
      >
        {anchors.map((message) => {
          const current = message.id === currentAnchorId
          return (
            <Marker
              key={message.id}
              asChild
              className={cn(
                "rounded-xl px-2 py-1.5 transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                current && "bg-accent text-accent-foreground",
              )}
            >
              <Button
                type="button"
                variant="ghost"
                className="h-auto w-full justify-start"
                aria-current={current ? "location" : undefined}
                onClick={() =>
                  scrollToMessage(message.id, {
                    align: "start",
                    behavior: "smooth",
                  })
                }
              >
                <MarkerIcon>
                  <i
                    className={cn(
                      "fa-light text-xs",
                      current ? "fa-location-dot" : "fa-bookmark",
                    )}
                    aria-hidden="true"
                  />
                </MarkerIcon>
                <MarkerContent className="line-clamp-1 min-w-0 text-sm text-inherit">
                  {trimmedAnchorLabel(message.content)}
                </MarkerContent>
              </Button>
            </Marker>
          )
        })}
      </HoverCardContent>
    </HoverCard>
  )
}

export function LeoThreadMessages({
  messages,
  isThinking: _isThinking,
  emptyState,
  className,
  contentClassName,
  maxWidthClassName = "max-w-none",
  ariaLabel = "Conversation with Leo",
  transcriptOutline,
}: LeoThreadMessagesProps) {
  const isEmpty = messages.length === 0
  const userAnchors = React.useMemo(
    () => messages.filter((m) => m.role === "user"),
    [messages],
  )
  const showOutline =
    transcriptOutline ?? (!isEmpty && userAnchors.length >= 2)

  return (
    <MessageScrollerProvider
      autoScroll
      defaultScrollPosition="last-anchor"
      scrollPreviousItemPeek={64}
      scrollEdgeThreshold={8}
      scrollMargin={12}
    >
      <div className={cn("relative flex min-h-0 min-w-0 flex-1 flex-col", className)}>
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport
            className={cn(
              "scroll-smooth px-4 pb-4 pt-3",
              showOutline && "pe-12",
              isEmpty && "flex flex-col items-center justify-center",
            )}
            aria-label={ariaLabel}
          >
            <MessageScrollerContent
              className={cn(
                "mx-auto w-full min-w-0",
                maxWidthClassName,
                isEmpty && "min-h-0 flex-1 items-center justify-center",
                contentClassName,
              )}
            >
              {isEmpty ? (
                emptyState
              ) : (
                messages.map((message) => (
                  <MessageScrollerItem
                    key={message.id}
                    messageId={message.id}
                    scrollAnchor={message.role === "user"}
                  >
                    <LeoThreadTurn message={message} />
                  </MessageScrollerItem>
                ))
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          {!isEmpty ? (
            <>
              <MessageScrollerButton direction="start" />
              <MessageScrollerButton direction="end" />
            </>
          ) : null}
        </MessageScroller>
        {showOutline ? (
          <div className="pointer-events-auto absolute end-1.5 top-1/2 z-20 -translate-y-1/2">
            <LeoTranscriptOutline anchors={userAnchors} />
          </div>
        ) : null}
      </div>
    </MessageScrollerProvider>
  )
}
