'use client'

import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Badge,
  Separator,
} from '@exxat/ds/packages/ui/src'

type Notification = {
  id: number
  type: 'feature' | 'offer'
  title: string
  body: string
  date: string
  read: boolean
}

const NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'feature', title: 'QB AI Gap Analysis shipped', body: 'AI gap analysis is now live in Exam Management v2.4', date: '2026-05-14', read: false },
  { id: 2, type: 'feature', title: 'PCE Master List views', body: 'New entity list views for all placement types in PCE v3.1', date: '2026-05-05', read: false },
  { id: 3, type: 'offer', title: 'Upgrade Learning Contracts', body: 'Add Learning Contracts to your subscription — 3 months free trial.', date: '2026-05-01', read: true },
  { id: 4, type: 'offer', title: 'FaaS 2.0 early access', body: 'Join the FaaS 2.0 beta and shape the form builder experience.', date: '2026-04-20', read: true },
]

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function NotificationsPopover() {
  const [open, setOpen] = useState(false)
  const unread = NOTIFICATIONS.filter(n => !n.read).length

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
              variant="default"
              className="rounded absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none flex items-center justify-center"
              style={{ backgroundColor: 'var(--destructive)', color: 'white', border: 'none' }}
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
        <Separator />
        <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
          {NOTIFICATIONS.map((n, i) => (
            <div key={n.id}>
              <div
                className="flex items-start gap-3 px-4 py-3"
                style={{ backgroundColor: !n.read ? 'var(--muted)' : undefined }}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5"
                  style={{
                    backgroundColor: n.type === 'feature' ? 'var(--brand-tint)' : 'var(--portal-amber-bg)',
                    color: n.type === 'feature' ? 'var(--brand-color)' : 'var(--portal-amber-fg)',
                  }}
                >
                  {n.type === 'feature' ? (
                    <i className="fa-light fa-sparkles text-xs" aria-hidden="true" />
                  ) : (
                    <i className="fa-light fa-tag text-xs" aria-hidden="true" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-sm font-semibold leading-snug">{n.title}</span>
                  <span className="text-xs text-muted-foreground leading-snug">{n.body}</span>
                  <span className="text-xs text-muted-foreground mt-0.5">{formatDate(n.date)}</span>
                </div>
                {!n.read && (
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0 mt-1.5"
                    style={{ backgroundColor: 'var(--brand-color)' }}
                    aria-hidden="true"
                  />
                )}
              </div>
              {i < NOTIFICATIONS.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
