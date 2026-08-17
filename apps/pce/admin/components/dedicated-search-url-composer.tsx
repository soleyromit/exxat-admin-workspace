"use client"

import * as React from "react"
import { useNavigate } from "react-router"
import { AskLeoComposer } from "@/components/ask-leo-composer"
import { cn } from "@/lib/utils"
import type { DedicatedSearchRecentsController } from "@/lib/dedicated-search-recents"

export interface DedicatedSearchUrlComposerProps {
  /** Serialized `URLSearchParams` for the active route (stable string from parent). */
  searchParamsKey: string
  /** Base path for `router.replace` (no query). */
  replacePath: string
  /**
   * Merge submitted text into the next query string. Hub supplies domain rules
   * (e.g. preserve `scope=` / toggles while updating `q=`).
   */
  patchSearchParams: (current: URLSearchParams, submittedText: string) => URLSearchParams
  /** Optional — record a successful non-empty submission (e.g. recents). */
  onRecordSubmission?: (trimmed: string) => void
  /** When set, focus on the composer shows recent queries in a popover. */
  recents?: Pick<DedicatedSearchRecentsController, "read" | "clear" | "eventName">
  /** `hero` — centered landing; `default` — inset under a list header. */
  layout?: "default" | "hero"
  animatedPlaceholders: readonly string[] | string[]
  animatedPlaceholderIntervalMs?: number
  animatedPlaceholderMaxLines?: 1 | 2
  placeholder?: string
  inputLabel?: string
  submitAppearance?: "search" | "send"
  submitButtonAriaLabel?: string
  /** Screen-reader-only instructions for the field (not the sole format hint). */
  srOnlyDescription: React.ReactNode
  composerClassName?: string
}

type ComposerBodyProps = Omit<DedicatedSearchUrlComposerProps, "searchParamsKey"> & {
  qFromUrl: string
  searchParamsKey: string
}

function DedicatedSearchUrlComposerBody({
  qFromUrl,
  searchParamsKey,
  replacePath,
  patchSearchParams,
  onRecordSubmission,
  recents,
  layout = "default",
  animatedPlaceholders,
  animatedPlaceholderIntervalMs = 4800,
  animatedPlaceholderMaxLines = 2,
  placeholder = "Search…",
  inputLabel = "Search",
  submitAppearance = "search",
  submitButtonAriaLabel = "Run search",
  srOnlyDescription,
  composerClassName,
}: ComposerBodyProps) {
  const navigate = useNavigate()
  const [value, setValue] = React.useState(qFromUrl)

  const onSubmit = React.useCallback(
    (message: string) => {
      const trimmed = message.trim()
      if (trimmed) onRecordSubmission?.(trimmed)
      const next = patchSearchParams(new URLSearchParams(searchParamsKey), trimmed)
      const qs = next.toString()
      navigate(qs ? `${replacePath}?${qs}` : replacePath, { replace: true })
    },
    [onRecordSubmission, patchSearchParams, replacePath, navigate, searchParamsKey],
  )

  const onRecentSelect = React.useCallback(
    (query: string) => {
      setValue(query)
      onSubmit(query)
    },
    [onSubmit],
  )

  return (
    <div className={cn(layout === "hero" ? "min-w-0" : "px-4 pb-3 lg:px-6")}>
      <p className="sr-only">{srOnlyDescription}</p>
      <AskLeoComposer
        value={value}
        onChange={setValue}
        onSubmit={onSubmit}
        // The query lives in the URL after submit, so the field has to keep
        // showing it. Clearing would leave the bar empty over its own results.
        clearOnSubmit={false}
        animatedPlaceholders={[...animatedPlaceholders]}
        animatedPlaceholderIntervalMs={animatedPlaceholderIntervalMs}
        animatedPlaceholderMaxLines={animatedPlaceholderMaxLines}
        leadingSlot="ai-mark"
        inputLabel={inputLabel}
        submitAppearance={submitAppearance}
        submitButtonAriaLabel={submitButtonAriaLabel}
        placeholder={placeholder}
        shellMaxWidth={layout === "hero" ? "2xl" : "full"}
        className={composerClassName}
        searchRecents={
          recents
            ? {
                recents,
                onSelect: onRecentSelect,
              }
            : undefined
        }
      />
    </div>
  )
}

/**
 * AI-styled composer that updates the URL via `router.replace` — does not open Ask Leo.
 */
export function DedicatedSearchUrlComposer({
  searchParamsKey,
  ...rest
}: DedicatedSearchUrlComposerProps) {
  const sp = React.useMemo(() => new URLSearchParams(searchParamsKey), [searchParamsKey])
  const qFromUrl = sp.get("q") ?? ""

  return (
    <DedicatedSearchUrlComposerBody
      key={searchParamsKey}
      qFromUrl={qFromUrl}
      searchParamsKey={searchParamsKey}
      {...rest}
    />
  )
}
