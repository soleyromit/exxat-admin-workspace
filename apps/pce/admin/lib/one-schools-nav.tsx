/**
 * Exxat One — Schools primary nav.
 *
 * Self-contained on purpose. `lib/mock/navigation.tsx` is app-owned in consumer
 * apps, so `exxat-ui upgrade` may never overwrite it; this module is
 * package-owned and auto-ported instead, and the consumer registers it with one
 * line. See `packages/ui/bin/upgrade-one-schools-wiring.mjs`.
 */
import type { NavLinkItem, NavPrimaryLayout } from "@/lib/mock/navigation"

function homeItem(slug: string): NavLinkItem {
  return {
    key: "home",
    title: "Home",
    url: `/${slug}/dashboard`,
    icon: <i className="fa-light fa-house" aria-hidden="true" />,
    iconActive: <i className="fa-solid fa-house" aria-hidden="true" />,
  }
}

function hubItem(
  slug: string,
  key: string,
  title: string,
  segment: string,
  iconClass: string,
  iconActiveClass: string,
): NavLinkItem {
  return {
    key,
    title,
    url: `/${slug}/${segment}`,
    icon: <i className={iconClass} aria-hidden="true" />,
    iconActive: <i className={iconActiveClass} aria-hidden="true" />,
  }
}

/**
 * Exxat One primary nav, school side — the coordinator looking *out* at partners:
 * find availability, apply for it, then run what came back.
 */
export function buildOneSchoolsNavLayout(slug: string): NavPrimaryLayout {
  return {
    preamble: [
      homeItem(slug),
      hubItem(
        slug,
        "explore-availability",
        "Explore & apply",
        "explore-availability",
        "fa-light fa-magnifying-glass-location",
        "fa-solid fa-magnifying-glass-location",
      ),
      hubItem(
        slug,
        "wishlist-responses",
        "Wishlist Responses",
        "wishlist-responses",
        "fa-light fa-heart",
        "fa-solid fa-heart",
      ),
    ],
    sections: [
      {
        key: "activities",
        label: "Activities",
        items: [
          hubItem(
            slug,
            "activities-dashboard",
            "Dashboard",
            "activities-dashboard",
            "fa-light fa-gauge-high",
            "fa-solid fa-gauge-high",
          ),
          hubItem(
            slug,
            "activities-requests",
            "Requests",
            "activities-requests",
            "fa-light fa-inbox",
            "fa-solid fa-inbox",
          ),
          hubItem(
            slug,
            "activities-schedules",
            "Schedules",
            "activities-schedules",
            "fa-light fa-calendar-days",
            "fa-solid fa-calendar-days",
          ),
        ],
      },
    ],
    epilogue: [
      hubItem(slug, "reports", "Reports", "reports", "fa-light fa-chart-line-up", "fa-solid fa-chart-line-up"),
    ],
  }
}

/** Route segments for Exxat One school-side hub shells (excludes dashboard). */
export const ONE_SCHOOLS_HUB_SEGMENTS = [
  "explore-availability",
  "wishlist-responses",
  "activities-dashboard",
  "activities-requests",
  "activities-schedules",
] as const
