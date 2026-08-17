"use client"

/**
 * Leo half of the Library mode-switch search bar — AI composer in the shared pill.
 * Double-click opens Leo appearance settings (search-bar wash / placement).
 * Searching / preview-thinking ambience paints via AskLeoComposer prefs.
 */

import * as React from "react"

import { AskLeoComposer } from "@/components/ask-leo-composer"
import { useLeoAmbience } from "@/components/leo-ambience-context"
import { searchBarShellClassName } from "@/components/search-bar-shell"
import type { DedicatedSearchRecentsController } from "@/lib/dedicated-search-recents"

export function LibraryAskSearchBar({
  value,
  onChange,
  onSubmit,
  placeholders,
  recents,
  onRecentSelect,
  searching = false,
  footer,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (message: string) => void
  placeholders: readonly string[]
  recents: Pick<DedicatedSearchRecentsController, "read" | "clear" | "eventName">
  onRecentSelect: (query: string) => void
  searching?: boolean
  footer?: React.ReactNode
}) {
  const { previewThinking } = useLeoAmbience()
  const washActive = searching || previewThinking

  return (
    <div className="flex min-w-0 flex-col gap-2 overflow-visible">
      <p className="sr-only">
        Example searches rotate in the field. Type your own request in plain language, then press
        Enter to open the library with that AI search applied to the question list. Double-click the
        bar to open Leo appearance settings for search wash and placement. This control does not
        open Ask Leo.
      </p>
      <AskLeoComposer
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        // A search bar keeps its query. Emptying on submit is chat behaviour,
        // and here it left the running search with nothing to name it.
        clearOnSubmit={false}
        animatedPlaceholders={[...placeholders]}
        animatedPlaceholderIntervalMs={4800}
        animatedPlaceholderMaxLines={2}
        leadingSlot="ai-mark"
        inputLabel="AI search"
        submitAppearance="search"
        submitButtonAriaLabel="Run AI search"
        placeholder="Search the bank…"
        isSearching={searching}
        searchBarAmbience
        composerShellClassName={searchBarShellClassName(
          // Override the default composer card radius / shadow so Basic and Leo
          // share one Airbnb pill geometry. Searching keeps a translucent fill
          // so in-bar Leo blobs read through the shell.
          "rounded-full! shadow-xs! border-[color:var(--control-border)]!",
          washActive
            ? "border-[color:color-mix(in_oklch,var(--brand-color)_45%,var(--control-border))]! bg-card/70! shadow-sm! ring-2 ring-brand/15!"
            : undefined,
        )}
        searchRecents={{
          recents,
          onSelect: onRecentSelect,
        }}
      />
      {searching ? (
        <span role="status" aria-live="polite" className="sr-only">
          Leo is searching
        </span>
      ) : null}
      {footer}
    </div>
  )
}
