"use client"

/**
 * LeoSidebarDrillInPanel — body rendered inside `SidebarDrillIn` when
 * the user is on `/<product>/leo`. Replaces the default `SidebarDrillInItems`
 * (which renders a static `NavLinkItem[]`) with a Leo-specific stack:
 *
 *   • Search input — filters recents inline (no commit, no network)
 *   • "New chat" button — resets the canvas via `dispatchLeoNewChat()`
 *   • Recents list — newest first, click to re-ask, X to delete
 *
 * Recents are persisted per product (`lib/leo-recents.ts`); search is
 * session-only. The panel is rendered in expanded sidebar mode only —
 * icon-collapsed mode keeps the Ask Leo nav glyph as the affordance.
 */

import * as React from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { dispatchLeoNewChat } from "@/components/leo-landing-client"
import { SidebarDrillInSearchField } from "@/components/sidebar/sidebar-drill-in-search-field"
import { useLeoRecents, formatLeoRecentTime } from "@/lib/leo-recents"
import { cn } from "@/lib/utils"

export function LeoSidebarDrillInPanel() {
  const { recents, remove } = useLeoRecents()
  const [filter, setFilter] = React.useState("")
  const filterRef = React.useRef<HTMLInputElement>(null)
  const { state } = useSidebar()
  const expanded = state === "expanded"

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return recents
    return recents.filter((r) => r.prompt.toLowerCase().includes(q))
  }, [recents, filter])

  // Icon-collapsed mode — search becomes a menu icon; new chat stays icon-only too.
  if (!expanded) {
    return (
      <>
        <SidebarDrillInSearchField
          id="leo-recents-search"
          inputRef={filterRef}
          value={filter}
          onChange={setFilter}
          label="Search recents"
          placeholder="Search recents"
        />
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <SidebarMenuItem>
                <SidebarMenuButton
                  type="button"
                  tooltip="New chat"
                  onClick={() => {
                    dispatchLeoNewChat()
                    setFilter("")
                  }}
                >
                  <i
                    className="fa-light fa-pen-to-square size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span>New chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </>
    )
  }

  return (
    <>
      <SidebarDrillInSearchField
        id="leo-recents-search"
        inputRef={filterRef}
        value={filter}
        onChange={setFilter}
        label="Search recent prompts"
        placeholder="Search recents"
      />
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="px-1 pb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full justify-start gap-2 text-xs"
            onClick={() => {
              dispatchLeoNewChat()
              setFilter("")
            }}
          >
            <i className="fa-light fa-pen-to-square text-xs" aria-hidden="true" />
            New chat
          </Button>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Recents list — hidden in icon-collapsed mode. */}
      {expanded ? (
      <SidebarGroup className="py-0">
        <SidebarGroupLabel
          id="leo-recents-heading"
          className="text-xs font-medium uppercase tracking-wide px-2 text-sidebar-section-label"
        >
          Recent
        </SidebarGroupLabel>
        <SidebarGroupContent>
          {filtered.length === 0 ? (
            <p className="m-0 p-3 text-xs text-muted-foreground">
              {recents.length === 0
                ? "Your Leo chats on this device will appear here."
                : "No matches."}
            </p>
          ) : (
            <SidebarMenu className="gap-0.5" aria-labelledby="leo-recents-heading">
              {filtered.map((row) => (
                <LeoRecentRow
                  key={row.id}
                  prompt={row.prompt}
                  timestamp={row.at}
                  onSelect={() => dispatchLeoNewChat() /* placeholder: open thread */}
                  onRemove={() => remove(row.id)}
                />
              ))}
            </SidebarMenu>
          )}
        </SidebarGroupContent>
      </SidebarGroup>
      ) : null}
    </>
  )
}

function LeoRecentRow({
  prompt,
  timestamp,
  onSelect,
  onRemove,
}: {
  prompt: string
  timestamp: number
  onSelect: () => void
  onRemove: () => void
}) {
  const label = prompt.length > 64 ? `${prompt.slice(0, 64)}…` : prompt
  return (
    <SidebarMenuItem className="group/leo-recent flex items-center gap-0.5">
      <SidebarMenuButton
        type="button"
        onClick={onSelect}
        tooltip={prompt}
        className={cn("flex-1 min-w-0")}
      >
        <i
          className="fa-light fa-message-lines size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0 truncate text-start">
          <span className="truncate text-xs text-sidebar-foreground">{label}</span>
          <span className="truncate text-xs leading-tight text-muted-foreground">
            {formatLeoRecentTime(timestamp)}
          </span>
        </span>
      </SidebarMenuButton>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Delete "${label}" from recents`}
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="size-6 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/leo-recent:opacity-100 focus-visible:opacity-100"
          >
            <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          Delete
        </TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  )
}
