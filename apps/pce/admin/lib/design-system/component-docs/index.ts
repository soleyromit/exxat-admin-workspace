import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import { TOKEN_COMPONENT_DOCS } from "@/lib/design-system/component-docs/tokens"

/**
 * Auto-register every `component-docs/*.tsx` file that exports a `*ComponentDoc`.
 * tokens.tsx is excluded — it builds TOKEN_COMPONENT_DOCS separately.
 */
const docModules = import.meta.glob<Record<string, ComponentDocSpec>>(
  "./*.tsx",
  { eager: true },
)

function collectComponentDocs(): Record<string, ComponentDocSpec> {
  const map: Record<string, ComponentDocSpec> = {}

  for (const [path, mod] of Object.entries(docModules)) {
    if (path.endsWith("/tokens.tsx") || path.endsWith("/index.ts")) continue
    for (const value of Object.values(mod)) {
      if (
        value &&
        typeof value === "object" &&
        "slug" in value &&
        "sections" in value &&
        typeof (value as ComponentDocSpec).slug === "string"
      ) {
        const spec = value as ComponentDocSpec
        map[spec.slug] = spec
      }
    }
  }

  return map
}

const COMPONENT_DOC_BY_SLUG: Record<string, ComponentDocSpec> = {
  ...collectComponentDocs(),
  ...TOKEN_COMPONENT_DOCS,
}

export function getComponentDocSpec(slug: string): ComponentDocSpec | undefined {
  return COMPONENT_DOC_BY_SLUG[slug]
}

export function hasComponentDocSpec(slug: string): boolean {
  return slug in COMPONENT_DOC_BY_SLUG
}

export function listComponentDocSlugs(): string[] {
  return Object.keys(COMPONENT_DOC_BY_SLUG)
}
