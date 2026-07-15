// ─────────────────────────────────────────────────────────────────────────────
// Mock data — Notifications
// Centralized sample feed for the shell utility bar's notification bell.
// No backend/data model yet — wire a real feed here when one exists.
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationVariant = "info" | "success" | "warning"

export interface NotificationItem {
  id: string
  title: string
  description: string
  /** Relative, human-readable — swap for real timestamps once there's a feed. */
  timestamp: string
  read: boolean
  variant: NotificationVariant
  /** Optional deep link — clicking the row navigates here when present. */
  href?: string
}

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "New placement request",
    description: "A student submitted a placement request awaiting your review.",
    timestamp: "10m ago",
    read: false,
    variant: "info",
    href: "/data-list",
  },
  {
    id: "notif-2",
    title: "Compliance document approved",
    description: "Immunization record for a pending student was verified.",
    timestamp: "1h ago",
    read: false,
    variant: "success",
    href: "/data-list",
  },
  {
    id: "notif-3",
    title: "Evaluation overdue",
    description: "A site evaluation is 3 days past its due date.",
    timestamp: "3h ago",
    read: false,
    variant: "warning",
    href: "/data-list",
  },
  {
    id: "notif-4",
    title: "Weekly digest ready",
    description: "Your program's weekly activity summary is available.",
    timestamp: "Yesterday",
    read: true,
    variant: "info",
  },
  {
    id: "notif-5",
    title: "New site added",
    description: "A coordinator added a new clinical site to your program.",
    timestamp: "2 days ago",
    read: true,
    variant: "success",
  },
]

export function unreadNotificationCount(items: NotificationItem[] = MOCK_NOTIFICATIONS): number {
  return items.filter(item => !item.read).length
}
