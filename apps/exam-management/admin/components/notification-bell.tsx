"use client"

/**
 * NotificationBell — shell utility-bar trigger + panel.
 *
 * Backed by mock data (`lib/mock/notifications.ts`) until a real
 * notifications feed/backend exists. Local read/unread state only —
 * nothing persists across reloads.
 */

import * as React from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { MOCK_NOTIFICATIONS, type NotificationItem } from "@/lib/mock/notifications"

const VARIANT_DOT_CLASS: Record<NotificationItem["variant"], string> = {
  info: "bg-primary",
  success: "bg-[var(--insight-severity-success,theme(colors.green.500))]",
  warning: "bg-[var(--insight-severity-warning)]",
}

export function NotificationBell({ className }: { className?: string }) {
  const [items, setItems] = React.useState<NotificationItem[]>(MOCK_NOTIFICATIONS)
  const [open, setOpen] = React.useState(false)
  const unreadCount = items.filter(item => !item.read).length

  function markAllRead() {
    setItems(prev => prev.map(item => ({ ...item, read: true })))
  }

  function markRead(id: string) {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, read: true } : item)))
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={
                unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
              }
              className={cn("relative", className)}
            >
              <i className="fa-light fa-bell text-sm" aria-hidden="true" />
              {unreadCount > 0 ? (
                <Badge
                  variant="count"
                  className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Notifications</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-medium text-primary hover:underline"
            >
              Mark all as read
            </button>
          ) : null}
        </div>
        <div className="h-px bg-border" />
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        ) : (
          <ScrollArea className="max-h-80" viewportLabel="Notifications list">
            <ul className="flex flex-col p-1">
              {items.map(item => (
                <li key={item.id}>
                  <NotificationRow item={item} onRead={() => markRead(item.id)} />
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationRow({ item, onRead }: { item: NotificationItem; onRead: () => void }) {
  const content = (
    <div
      className={cn(
        "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        !item.read && "bg-sidebar-accent/40",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-1.5 size-1.5 shrink-0 rounded-full",
          item.read ? "bg-transparent" : VARIANT_DOT_CLASS[item.variant],
        )}
      />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{item.title}</span>
        <span className="text-xs text-muted-foreground">{item.description}</span>
        <span className="text-2xs text-muted-foreground">{item.timestamp}</span>
      </span>
    </div>
  )

  if (item.href) {
    return (
      <Link to={item.href} onClick={onRead} className="block">
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onRead} className="block w-full">
      {content}
    </button>
  )
}
