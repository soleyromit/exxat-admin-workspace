import type { NavLinkItem } from "@exxatdesignux/ui/components/shell"
import { allKnownUrls, NAV_ROWS, type NavRowDef } from "@/lib/v2/roles"
import { approvalsBadge, evaluatorRequestsBadge, unsentRequestsBadge } from "@/lib/v2/selectors"
import type { RoleId, V2State } from "@/lib/v2/types"

const icon = (name: string, solid = false) => <i className={`${solid ? "fa-solid" : "fa-light"} fa-${name}`} aria-hidden="true" />

function badgeFor(row: NavRowDef, state: V2State, actorId: string): number {
  if (row.badge === "approvals") return approvalsBadge(state)
  if (row.badge === "evaluator-requests") return evaluatorRequestsBadge(state, actorId)
  if (row.badge === "unsent-requests") return unsentRequestsBadge(state)
  return 0
}

/** Sidebar rows for a v2 role (contract section 3). A count badge is set only when it is above 0. */
export function buildV2Nav(role: RoleId, state: V2State, actorId: string): NavLinkItem[] {
  return NAV_ROWS[role].map((r) => {
    const n = badgeFor(r, state, actorId)
    return { key: `v2-${role}-${r.key}`, title: r.title, url: r.url, icon: icon(r.icon), iconActive: icon(r.icon, true), ...(n > 0 ? { badge: n } : {}) }
  })
}

export function allV2Urls(): string[] {
  return allKnownUrls()
}
