"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import {
  DESIGN_SYSTEM_DOC_ARTICLE,
  DESIGN_SYSTEM_EXAMPLE_CANVAS,
  DESIGN_SYSTEM_EXAMPLE_INNER,
  DESIGN_SYSTEM_EXAMPLE_INNER_WIDE,
} from "@/lib/design-system/component-doc-shell"
import { DS_DOC_BODY, DS_DOC_CODE, DS_DOC_SECTION_TITLE, DS_DOC_SUBSECTION_TITLE } from "@/lib/design-system/doc-typography"
import { cn } from "@/lib/utils"

export function DesignSystemDocArticle({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <article className={cn(DESIGN_SYSTEM_DOC_ARTICLE, className)}>{children}</article>
}

export function DesignSystemExampleCanvas({
  children,
  wide = false,
}: {
  children: React.ReactNode
  /** Use full article width for HubTable / DataTable previews */
  wide?: boolean
}) {
  return (
    <div className={DESIGN_SYSTEM_EXAMPLE_CANVAS}>
      <div className={wide ? DESIGN_SYSTEM_EXAMPLE_INNER_WIDE : DESIGN_SYSTEM_EXAMPLE_INNER}>
        {children}
      </div>
    </div>
  )
}

function ImportPathRow({ label, path }: { label: string; path: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(path)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [path])

  return (
    <li className="group flex flex-col gap-0.5">
      <span className={DS_DOC_SUBSECTION_TITLE}>{label}</span>
      <div className="flex min-w-0 items-start gap-2">
        <code className={cn("min-w-0 flex-1 break-all", DS_DOC_CODE)}>{path}</code>
        <Tip side="left" label={copied ? "Copied" : "Copy import"}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-6 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            onClick={() => void handleCopy()}
            aria-label={copied ? "Copied" : `Copy import for ${label}`}
          >
            <i
              className={cn(copied ? "fa-solid fa-check" : "fa-light fa-copy", "text-sm")}
              aria-hidden="true"
            />
          </Button>
        </Tip>
      </div>
    </li>
  )
}

export function ComponentDocImportSection({
  rows,
  sourcePath,
}: {
  rows: { label: string; path: string }[]
  sourcePath?: string
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className={DS_DOC_SECTION_TITLE}>Import</h2>
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <ImportPathRow key={`${row.label}:${row.path}`} label={row.label} path={row.path} />
        ))}
      </ul>
      {sourcePath ? (
        <p className={DS_DOC_BODY}>
          Source: <code className={DS_DOC_CODE}>{sourcePath}</code>
        </p>
      ) : null}
    </section>
  )
}
