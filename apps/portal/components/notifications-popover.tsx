'use client'

// Two-tier notification hub per Kunal (May 14): a workspace tier (updates to
// products this program uses, profile upgrades) and a global Exxat tier
// (new-product recommendations and offers). Types: feature | offer |
// recommendation | profile.

import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Badge,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@exxatdesignux/ui'

type Notification = {
  id: number
  type: 'feature' | 'offer' | 'recommendation' | 'profile'
  scope: 'workspace' | 'exxat'
  title: string
  body: string
  date: string
  read: boolean
}

const NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'feature', scope: 'workspace', title: 'QB AI Gap Analysis shipped', body: 'AI gap analysis is now live in Exam Management v2.4', date: '2026-05-14', read: false },
  { id: 2, type: 'feature', scope: 'workspace', title: 'Term workspace for Surveys & Course Evaluations', body: 'New Table ⇄ Board term workspace shipped in Surveys & Course Evaluations v3.1', date: '2026-05-05', read: false },
  { id: 3, type: 'profile', scope: 'workspace', title: 'Finish your workspace profile', body: 'Add your program details so releases and resources match your setup.', date: '2026-04-28', read: true },
  { id: 4, type: 'recommendation', scope: 'exxat', title: 'Pair Exam Management with Compliance', body: 'Programs like yours track exam eligibility against clearances — the two connect out of the box.', date: '2026-05-08', read: true },
  { id: 5, type: 'offer', scope: 'exxat', title: 'Clinical & Experiential Education early access', body: 'Join the early-access list for placements, preceptors, and experiential hours tracking.', date: '2026-05-01', read: true },
  { id: 6, type: 'offer', scope: 'exxat', title: 'Accreditation Management preview', body: 'Preview self-study assembly and evidence collection ahead of launch.', date: '2026-04-20', read: true },
]

const TYPE_META: Record<Notification['type'], { icon: string; bg: string; fg: string }> = {
  feature:        { icon: 'fa-sparkles',   bg: 'var(--brand-tint)',       fg: 'var(--brand-color)' },
  offer:          { icon: 'fa-tag',        bg: 'var(--portal-amber-bg)',  fg: 'var(--portal-amber-fg)' },
  recommendation: { icon: 'fa-lightbulb',  bg: 'var(--brand-tint)',       fg: 'var(--brand-color)' },
  profile:        { icon: 'fa-user-pen',   bg: 'var(--muted)',            fg: 'var(--muted-foreground)' },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function NotificationList({ items }: { items: Notification[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
        <i className="fa-light fa-bell-slash text-2xl text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
      </div>
    )
  }
  return (
    <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
      {items.map((n, i) => {
        const meta = TYPE_META[n.type]
        return (
          <div key={n.id}>
            <div
              className="flex items-start gap-3 px-4 py-3"
              style={{ backgroundColor: !n.read ? 'var(--muted)' : undefined }}
            >
              <div
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: meta.bg, color: meta.fg }}
              >
                <i className={`fa-light ${meta.icon} text-xs`} aria-hidden="true" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold leading-snug">{n.title}</span>
                <span className="text-xs leading-snug text-muted-foreground">{n.body}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">{formatDate(n.date)}</span>
              </div>
              {!n.read && (
                <span
                  className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: 'var(--brand-color)' }}
                  aria-hidden="true"
                />
              )}
            </div>
            {i < items.length - 1 && <Separator />}
          </div>
        )
      })}
    </div>
  )
}

export function NotificationsPopover() {
  const [open, setOpen] = useState(false)
  const unread = NOTIFICATIONS.filter((n) => !n.read).length
  const workspace = NOTIFICATIONS.filter((n) => n.scope === 'workspace')
  const exxat = NOTIFICATIONS.filter((n) => n.scope === 'exxat')
  const unreadIn = (items: Notification[]) => items.filter((n) => !n.read).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
          className="relative"
        >
          <i className="fa-light fa-bell text-base" aria-hidden="true" />
          {unread > 0 && (
            <Badge
              variant="destructive"
              className="rounded absolute -top-1 -right-1 h-4 min-w-4 px-1 text-xs leading-none flex items-center justify-center"
            >
              {unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 && (
            <span className="text-xs text-muted-foreground">{unread} unread</span>
          )}
        </div>
        <Tabs defaultValue="workspace">
          <div className="border-b border-border px-4">
            <TabsList variant="line" className="gap-0">
              <TabsTrigger value="workspace">
                Your workspace{unreadIn(workspace) > 0 && ` (${unreadIn(workspace)})`}
              </TabsTrigger>
              <TabsTrigger value="exxat">From Exxat</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="workspace" className="mt-0">
            <NotificationList items={workspace} />
          </TabsContent>
          <TabsContent value="exxat" className="mt-0">
            <NotificationList items={exxat} />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
