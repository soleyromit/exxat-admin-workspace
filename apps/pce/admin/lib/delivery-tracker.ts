/**
 * Design OS delivery tracker — registry seed + local UI-delivery overlay.
 *
 * Package inventory is always `DESIGN_SYSTEM_REGISTRY_ENTRIES` (tokens,
 * components, patterns, templates, examples). Editable fields (delivery
 * status, comment, Storybook URL) live in a product-namespaced localStorage
 * overlay so the registry stays the read-only source of truth.
 */

import type { MetricItem } from "@/components/key-metrics"
import {
  DESIGN_SYSTEM_REGISTRY_ENTRIES,
  DESIGN_SYSTEM_TIER_LABEL,
  type DesignSystemDocStatus,
  type DesignSystemTier,
} from "@/lib/design-system/registry"

/** Package UI surface tiers — excludes agent-context rules / skills / agents. */
export const DELIVERY_TRACKER_PACKAGE_TIERS = [
  "token",
  "component",
  "pattern",
  "template",
  "example",
] as const satisfies readonly DesignSystemTier[]

export type DeliveryTrackerPackageTier =
  (typeof DELIVERY_TRACKER_PACKAGE_TIERS)[number]

export type UiDeliveryStatus = "not_started" | "in_progress" | "delivered"

export const UI_DELIVERY_LABEL: Record<UiDeliveryStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  delivered: "Delivered",
}

export const PACKAGE_DOC_STATUS_LABEL: Record<DesignSystemDocStatus, string> = {
  live: "Live",
  skeleton: "Skeleton",
  catalog: "Catalog",
  planned: "Planned",
}

export interface DeliveryOverlayEntry {
  delivery: UiDeliveryStatus
  comment: string
  storybookUrl: string
  updatedAt: string
}

export interface DeliveryOverlayBundle {
  v: 1
  bySlug: Record<string, DeliveryOverlayEntry>
}

export interface DeliveryTrackerRow extends Record<string, unknown> {
  id: string
  name: string
  tier: DeliveryTrackerPackageTier
  tierLabel: string
  group: string
  packageStatus: DesignSystemDocStatus
  packageStatusLabel: string
  importPath: string
  delivery: UiDeliveryStatus
  deliveryLabel: string
  comment: string
  storybookUrl: string
  updatedAt: string
}

const OVERLAY_SUFFIX = "delivery-overlay:v1"

export function deliveryOverlayStorageKey(persistKey: string): string {
  return `exxat-ds:${persistKey}:${OVERLAY_SUFFIX}`
}

function emptyOverlay(): DeliveryOverlayBundle {
  return { v: 1, bySlug: {} }
}

export function loadDeliveryOverlay(persistKey: string): DeliveryOverlayBundle {
  if (typeof window === "undefined") return emptyOverlay()
  try {
    const raw = window.localStorage.getItem(deliveryOverlayStorageKey(persistKey))
    if (!raw) return emptyOverlay()
    const parsed = JSON.parse(raw) as DeliveryOverlayBundle
    if (parsed?.v !== 1 || typeof parsed.bySlug !== "object" || !parsed.bySlug) {
      return emptyOverlay()
    }
    return parsed
  } catch {
    return emptyOverlay()
  }
}

export function saveDeliveryOverlay(
  persistKey: string,
  bundle: DeliveryOverlayBundle,
): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(
    deliveryOverlayStorageKey(persistKey),
    JSON.stringify(bundle),
  )
}

function normalizeOverlayEntry(
  partial: Partial<DeliveryOverlayEntry> | undefined,
): DeliveryOverlayEntry {
  const delivery =
    partial?.delivery === "delivered" ||
    partial?.delivery === "in_progress" ||
    partial?.delivery === "not_started"
      ? partial.delivery
      : "not_started"
  return {
    delivery,
    comment: typeof partial?.comment === "string" ? partial.comment : "",
    storybookUrl:
      typeof partial?.storybookUrl === "string" ? partial.storybookUrl.trim() : "",
    updatedAt: typeof partial?.updatedAt === "string" ? partial.updatedAt : "",
  }
}

export function buildDeliveryTrackerRows(
  overlay: DeliveryOverlayBundle,
): DeliveryTrackerRow[] {
  const packageTier = new Set<string>(DELIVERY_TRACKER_PACKAGE_TIERS)
  return DESIGN_SYSTEM_REGISTRY_ENTRIES.filter(entry =>
    packageTier.has(entry.tier),
  )
    .map(entry => {
      const tier = entry.tier as DeliveryTrackerPackageTier
      const patch = normalizeOverlayEntry(overlay.bySlug[entry.slug])
      return {
        id: entry.slug,
        name: entry.name,
        tier,
        tierLabel: DESIGN_SYSTEM_TIER_LABEL[tier],
        group: entry.group,
        packageStatus: entry.status,
        packageStatusLabel: PACKAGE_DOC_STATUS_LABEL[entry.status],
        importPath: entry.importPath,
        delivery: patch.delivery,
        deliveryLabel: UI_DELIVERY_LABEL[patch.delivery],
        comment: patch.comment,
        storybookUrl: patch.storybookUrl,
        updatedAt: patch.updatedAt,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function patchDeliveryOverlay(
  bundle: DeliveryOverlayBundle,
  slug: string,
  patch: Partial<Omit<DeliveryOverlayEntry, "updatedAt">> & {
    updatedAt?: string
  },
): DeliveryOverlayBundle {
  const prev = normalizeOverlayEntry(bundle.bySlug[slug])
  const next: DeliveryOverlayEntry = {
    ...prev,
    ...patch,
    storybookUrl:
      patch.storybookUrl !== undefined
        ? patch.storybookUrl.trim()
        : prev.storybookUrl,
    updatedAt: patch.updatedAt ?? new Date().toISOString(),
  }
  return {
    v: 1,
    bySlug: {
      ...bundle.bySlug,
      [slug]: next,
    },
  }
}

export function patchDeliveryOverlayMany(
  bundle: DeliveryOverlayBundle,
  slugs: string[],
  patch: Partial<Omit<DeliveryOverlayEntry, "updatedAt">>,
): DeliveryOverlayBundle {
  const updatedAt = new Date().toISOString()
  let next = bundle
  for (const slug of slugs) {
    next = patchDeliveryOverlay(next, slug, { ...patch, updatedAt })
  }
  return next
}

export function deliveryTrackerKpiMetrics(rows: DeliveryTrackerRow[]): MetricItem[] {
  const delivered = rows.filter(r => r.delivery === "delivered").length
  const inProgress = rows.filter(r => r.delivery === "in_progress").length
  const gap = rows.filter(r => r.delivery !== "delivered").length

  return [
    {
      id: "total",
      label: "Package items",
      value: rows.length,
      delta: "",
      trend: "neutral",
      metricVariant: "hero",
    },
    {
      id: "delivered",
      label: "Delivered",
      value: delivered,
      delta: "",
      trend: "neutral",
    },
    {
      id: "in-progress",
      label: "In progress",
      value: inProgress,
      delta: "",
      trend: "neutral",
    },
    {
      id: "gap",
      label: "Not delivered",
      value: gap,
      delta: "",
      trend: "neutral",
      trendPolarity: "lower_is_better",
    },
  ]
}

/** Plain-text snapshot for Slack / email (no toast; caller shows inline status). */
export function formatDeliveryShareSummary(rows: DeliveryTrackerRow[]): string {
  const delivered = rows.filter(r => r.delivery === "delivered")
  const inProgress = rows.filter(r => r.delivery === "in_progress")
  const notStarted = rows.filter(r => r.delivery === "not_started")

  const lines: string[] = [
    `Exxat Design OS delivery · ${rows.length} package items`,
    `Delivered: ${delivered.length} · In progress: ${inProgress.length} · Not started: ${notStarted.length}`,
    "",
  ]

  if (notStarted.length > 0) {
    lines.push("Not started")
    for (const row of notStarted) {
      lines.push(`  ${row.name} (${row.tierLabel})`)
    }
    lines.push("")
  }
  if (inProgress.length > 0) {
    lines.push("In progress")
    for (const row of inProgress) {
      const link = row.storybookUrl ? ` · ${row.storybookUrl}` : ""
      lines.push(`  ${row.name} (${row.tierLabel})${link}`)
    }
    lines.push("")
  }
  if (delivered.length > 0) {
    lines.push("Delivered")
    for (const row of delivered) {
      const link = row.storybookUrl ? ` · ${row.storybookUrl}` : ""
      lines.push(`  ${row.name} (${row.tierLabel})${link}`)
    }
  }

  return lines.join("\n").trimEnd()
}

export function exportDeliveryOverlayJson(
  persistKey: string,
  bundle: DeliveryOverlayBundle,
): string {
  return JSON.stringify(
    {
      ...bundle,
      exportedAt: new Date().toISOString(),
      persistKey,
    },
    null,
    2,
  )
}

export function parseDeliveryOverlayImport(raw: string): DeliveryOverlayBundle | null {
  try {
    const parsed = JSON.parse(raw) as Partial<DeliveryOverlayBundle>
    if (parsed?.v !== 1 || typeof parsed.bySlug !== "object" || !parsed.bySlug) {
      return null
    }
    const bySlug: Record<string, DeliveryOverlayEntry> = {}
    for (const [slug, entry] of Object.entries(parsed.bySlug)) {
      bySlug[slug] = normalizeOverlayEntry(entry)
    }
    return { v: 1, bySlug }
  } catch {
    return null
  }
}
