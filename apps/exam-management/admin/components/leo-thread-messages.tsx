"use client"

import * as React from "react"

import { Avatar, AvatarFallback, AvatarImage, AvatarLeoAssistant } from "@/components/ui/avatar"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
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
}

function LeoThinkingMarker() {
  return (
    <Marker role="status" aria-live="polite">
      <MarkerIcon>
        <i className="fa-light fa-spinner-third fa-spin text-xs" aria-hidden="true" />
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

  return (
    <Message>
      <MessageAvatar>
        <AvatarLeoAssistant />
      </MessageAvatar>
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

/**
 * Shared Leo conversation transcript — Message / Bubble / Marker / MessageScroller.
 * Used by the Ask Leo rail and the focused Leo landing canvas.
 */
export function LeoThreadMessages({
  messages,
  isThinking: _isThinking,
  emptyState,
  className,
  contentClassName,
  maxWidthClassName = "max-w-none",
  ariaLabel = "Conversation with Leo",
}: LeoThreadMessagesProps) {
  const isEmpty = messages.length === 0

  return (
    <MessageScrollerProvider autoScroll scrollPreviousItemPeek={48}>
      <MessageScroller className={cn("min-h-0 flex-1", className)}>
        <MessageScrollerViewport
          className={cn(
            "scroll-smooth px-4 pb-4 pt-3",
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
                  scrollAnchor={message.role === "user"}
                >
                  <LeoThreadTurn message={message} />
                </MessageScrollerItem>
              ))
            )}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        {!isEmpty ? <MessageScrollerButton direction="end" /> : null}
      </MessageScroller>
    </MessageScrollerProvider>
  )
}
