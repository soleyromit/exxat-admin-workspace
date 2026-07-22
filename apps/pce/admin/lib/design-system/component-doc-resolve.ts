/**
 * Merge registry rows, full ComponentDocSpec, and UX manifest into one catalog spec.
 */

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import { isStructuredAccessibility } from "@/lib/design-system/component-doc-a11y"
import type { ComponentDocSpecAccessibility } from "@/lib/design-system/component-doc-a11y"
import { getUxManifestForEntry } from "@/lib/design-system/component-doc-ux-manifest"
import type { DesignSystemRegistryEntry } from "@/lib/design-system/registry-types"

function formatSlugLabel(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function isGenericSkeletonGuidelines(
  guidelines: ComponentDocSpec["guidelines"],
  displayName: string,
): boolean {
  if (!guidelines?.do?.length) return true
  const first = guidelines.do[0] ?? ""
  return first.startsWith(`Use ${displayName} for`)
}

export function buildSkeletonComponentDoc(
  entry: DesignSystemRegistryEntry,
  childEntries: DesignSystemRegistryEntry[],
): ComponentDocSpec {
  const displayName = entry.name || formatSlugLabel(entry.slug)
  const relatedSlugs = [
    ...(entry.parentSlug ? [entry.parentSlug] : []),
    ...childEntries.map((child) => child.slug),
  ]
  const childParts = childEntries.map((child) => ({
    part: child.name,
    description: child.description,
  }))

  return {
    slug: entry.slug,
    summary: entry.description,
    sections: [],
    anatomy: [
      { part: displayName, description: entry.description },
      ...childParts,
    ],
    guidelines: {
      do: [
        `Use ${displayName} for ${entry.group.toLowerCase()} surfaces that match the registry description.`,
        "Keep examples aligned to the design-system canvas and page rhythm.",
        "Prefer the documented import path so consuming apps share the same primitive.",
      ],
      dont: [
        "Do not duplicate this primitive with one-off local styling.",
        "Do not bypass focus, keyboard, or labeling behavior from the shared component.",
        "Do not add page-specific spacing inside the primitive. Let the page shell own layout.",
      ],
    },
    accessibility: [
      "Preserve the component's visible focus state and keyboard behavior.",
      "Provide a programmatic label for icon-only controls, triggers, and interactive rows.",
      "Do not rely on color alone to communicate state. Pair color with text, shape, or iconography.",
      "Keep disabled, loading, invalid, and selected states exposed through semantic attributes when applicable.",
    ],
    relatedSlugs,
  }
}

export function mergeUxManifest(
  entry: DesignSystemRegistryEntry,
  spec: ComponentDocSpec,
): ComponentDocSpec {
  const manifest = getUxManifestForEntry(entry)
  if (!manifest) return spec

  const displayName = entry.name || formatSlugLabel(entry.slug)
  const useManifestGuidelines =
    !spec.guidelines || isGenericSkeletonGuidelines(spec.guidelines, displayName)

  return {
    ...spec,
    ux: spec.ux ?? manifest.ux,
    guidelines: useManifestGuidelines
      ? (manifest.guidelines ?? spec.guidelines)
      : spec.guidelines,
    accessibility:
      spec.accessibility?.length && !isGenericSkeletonAccessibility(spec.accessibility)
        ? spec.accessibility
        : (manifest.accessibility ?? spec.accessibility),
  }
}

function isGenericSkeletonAccessibility(items: ComponentDocSpecAccessibility): boolean {
  if (isStructuredAccessibility(items)) return false
  if (items.length !== 4) return false
  return items[0]?.includes("visible focus state") ?? false
}

export function resolveComponentDocSpec(
  entry: DesignSystemRegistryEntry,
  childEntries: DesignSystemRegistryEntry[],
  fullSpec?: ComponentDocSpec,
): ComponentDocSpec {
  const base = fullSpec ?? buildSkeletonComponentDoc(entry, childEntries)
  return mergeUxManifest(entry, base)
}

export function hasExplicitUxCoverage(spec: ComponentDocSpec): boolean {
  return Boolean(
    spec.ux?.job ||
      spec.ux?.budgets?.length ||
      spec.ux?.whenToUse?.length ||
      (spec.guidelines?.do?.length ?? 0) >= 3,
  )
}
