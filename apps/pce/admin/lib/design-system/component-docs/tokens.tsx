import * as React from "react"

import {
  DesignSystemTokenCategoryPreview,
  L0SlotNamingExplainer,
} from "@/components/design-system/token-doc-preview"
import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import { getDesignSystemEntry } from "@/lib/design-system/registry"
import { listTokenDocSlugs } from "@/lib/design-system/token-doc-registry"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
) {
  return { ...section, children }
}

const TOKEN_DOC_SHARED: Pick<
  ComponentDocSpec,
  "anatomy" | "guidelines" | "accessibility" | "extraImports"
> = {
  anatomy: [
    {
      part: "hooks-index.json",
      description: "Single source of truth for token names, namespaces, categories, and theme values.",
    },
    {
      part: "globals.css",
      description: "Runtime CSS custom properties mapped from the index (import path on this page).",
    },
    {
      part: "var(--name)",
      description: "Always reference tokens by custom property — never hardcode hex in product UI.",
    },
  ],
  guidelines: {
    do: [
      "Read L1 semantic colors first, then L0 --exxat-* aliases on the same page.",
      "Use L0 --exxat-* and documented semantic aliases from this index.",
      "Scope charts, tables, and interactive states to the matching token family.",
      "Open Tokens & themes for search, namespace filters, and board views across the full catalog.",
    ],
    dont: [
      "Do not paste raw OKLCH or hex literals when a token exists in this index.",
      "Do not fork a one-off --my-feature-color in app CSS.",
      "Do not ship deprecated tokens in new surfaces (see Deprecated filter in the hub).",
      "Do not treat ink-1 / surface-1 numbers as arbitrary — they are emphasis and elevation slots.",
    ],
  },
  accessibility: [
    "Verify light and dark theme values meet contrast requirements for text and interactive states.",
    "Do not rely on color alone; pair semantic color tokens with labels or icons.",
    "Typography tokens enforce a 12px floor for chart ticks and dense UI copy.",
  ],
  extraImports: [
    { label: "Token index", path: "@exxatdesignux/ui/tokens/hooks-index.json" },
    { label: "Tokens hub", path: "@/components/tokens-themes-client" },
  ],
}

function buildColorSystemDoc(entry: NonNullable<ReturnType<typeof getDesignSystemEntry>>): ComponentDocSpec {
  return {
    slug: "tokens-colors",
    summary: entry.description,
    sections: [
      ex({ id: "l1-semantic", title: "Step 1 · Semantic colors (L1)" }, <DesignSystemTokenCategoryPreview slug="tokens-colors" />),
      ex(
        { id: "l0-aliases", title: "Step 2 · Exxat aliases (L0)" },
        <>
          <L0SlotNamingExplainer />
          <DesignSystemTokenCategoryPreview slug="tokens-aliases" showIntro={false} showL0Naming={false} />
        </>,
      ),
    ],
    ...TOKEN_DOC_SHARED,
    relatedSlugs: ["tokens-aliases", "tokens-themes-hub", "rule-token-discipline"],
  }
}

function buildAliasOnlyDoc(entry: NonNullable<ReturnType<typeof getDesignSystemEntry>>): ComponentDocSpec {
  return {
    slug: "tokens-aliases",
    summary: entry.description,
    sections: [
      ex(
        {
          id: "tokens",
          title: "",
          bare: true,
        },
        <DesignSystemTokenCategoryPreview slug="tokens-aliases" showL0Naming />,
      ),
    ],
    ...TOKEN_DOC_SHARED,
    relatedSlugs: ["tokens-colors", "tokens-themes-hub", "rule-token-discipline"],
  }
}

function buildTokenComponentDoc(slug: string): ComponentDocSpec | undefined {
  const entry = getDesignSystemEntry(slug)
  if (!entry) return undefined

  if (slug === "tokens-colors") return buildColorSystemDoc(entry)
  if (slug === "tokens-aliases") return buildAliasOnlyDoc(entry)

  return {
    slug,
    summary: entry.description,
    sections: [
      ex(
        {
          id: "tokens",
          title: "",
          bare: true,
        },
        <DesignSystemTokenCategoryPreview slug={slug} />,
      ),
    ],
    ...TOKEN_DOC_SHARED,
    relatedSlugs: ["tokens-themes-hub", "rule-token-discipline"],
  }
}

export const TOKEN_COMPONENT_DOCS: Record<string, ComponentDocSpec> = Object.fromEntries(
  listTokenDocSlugs()
    .map((slug) => {
      const doc = buildTokenComponentDoc(slug)
      return doc ? ([slug, doc] as const) : null
    })
    .filter((row): row is [string, ComponentDocSpec] => row !== null),
)
