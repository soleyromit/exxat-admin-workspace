"use client"

import * as React from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  ComponentDocImportSection,
  DesignSystemDocArticle,
} from "@/components/design-system/component-doc-shell"
import { ComponentDocDetails } from "@/components/design-system/component-doc-details"
import {
  DesignSystemPreviewSections,
  designSystemHasLivePreview,
} from "@/components/design-system/design-system-previews"
import {
  resolveComponentDocSpec,
} from "@/lib/design-system/component-doc-resolve"
import { getComponentDocSpec } from "@/lib/design-system/component-docs"
import {
  getDesignSystemChildEntries,
  getDesignSystemEntry,
  type DesignSystemRegistryEntry,
} from "@/lib/design-system/registry"
import { DS_DOC_BODY, DS_DOC_BODY_EMPHASIS, DS_DOC_SECTION_TITLE } from "@/lib/design-system/doc-typography"
import { cn } from "@/lib/utils"
import { useProductDashboardHref } from "@/contexts/product-route-sync"

function PreviewPlaceholder({ entry }: { entry: DesignSystemRegistryEntry }) {
  return (
    <div
      className={cn(
        "flex min-h-[12rem] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border",
        "bg-muted/10 px-6 py-10 text-center",
      )}
    >
      <i className="fa-light fa-cube text-2xl text-muted-foreground" aria-hidden="true" />
      <p className={DS_DOC_BODY_EMPHASIS}>Example preview</p>
      <p className={cn("max-w-md", DS_DOC_BODY)}>
        Skeleton slot for <span className={DS_DOC_BODY_EMPHASIS}>{entry.name}</span>. Wire live
        demos here.
      </p>
    </div>
  )
}

export function DesignSystemDocPage({ entry }: { entry: DesignSystemRegistryEntry }) {
  const dashboardHref = useProductDashboardHref()
  const productBase = dashboardHref.replace(/\/dashboard$/, "")
  const componentDoc = getComponentDocSpec(entry.slug)
  const hasLivePreview = designSystemHasLivePreview(entry.slug)
  const childEntries = getDesignSystemChildEntries(entry.slug)
  const skeletonDoc = React.useMemo(
    () => resolveComponentDocSpec(entry, childEntries, componentDoc),
    [componentDoc, entry, childEntries],
  )
  const relatedImports = [
    { label: entry.name, path: entry.importPath },
    ...childEntries.map((child) => ({ label: child.name, path: child.importPath })),
    ...(componentDoc?.extraImports ?? []),
  ]

  return (
    <DesignSystemDocArticle>
      {hasLivePreview ? (
        <DesignSystemPreviewSections slug={entry.slug} />
      ) : (
        <PreviewPlaceholder entry={entry} />
      )}

      <ComponentDocDetails spec={skeletonDoc} />

      <ComponentDocImportSection rows={relatedImports} sourcePath={entry.sourcePath} />

      {entry.routeSuffix ? (
        <section className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to={`${productBase}${entry.routeSuffix}`}>Open live example</Link>
          </Button>
        </section>
      ) : null}
    </DesignSystemDocArticle>
  )
}

export function DesignSystemNotFound({ slug }: { slug: string }) {
  const known = getDesignSystemEntry(slug)
  if (known) return null
  return (
    <DesignSystemDocArticle className="max-w-lg text-center">
      <h1 className="text-lg font-semibold text-foreground">Not in registry</h1>
      <p className={cn("mt-2", DS_DOC_BODY)}>
        No registry entry for <code className="font-mono text-sm">{slug}</code>.
      </p>
      <Button type="button" variant="outline" size="sm" className="mt-4" asChild>
        <Link to="..">Back to index</Link>
      </Button>
    </DesignSystemDocArticle>
  )
}
