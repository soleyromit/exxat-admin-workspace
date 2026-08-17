"use client"

/**
 * Live preview for ModeSwitchSearchBar — catalog detail + Design OS docs.
 */

import * as React from "react"

import { LibraryAskSearchBar } from "@/components/library-ask-search-bar"
import { LibraryBasicSearchBar } from "@/components/library-basic-search-bar"
import { ModeSwitchSearchBar } from "@/components/mode-switch-search-bar"
import { createDedicatedSearchRecentsController } from "@/lib/dedicated-search-recents"
import {
  createLibraryBasicSearchRecentsController,
  formatLibraryBasicSearchLabel,
} from "@/lib/library-basic-search-recents"
import type { LibraryItemType, LibraryLevel } from "@/lib/mock/library"
import type { LibrarySearchMode } from "@/hooks/use-library-search-mode"

const PLACEHOLDERS = [
  "Find pharmacology items for week 3",
  "Short answer questions about vital signs",
  "Hard multiple choice on infection control",
] as const

const catalogLeoRecents = createDedicatedSearchRecentsController(
  "catalog-mode-switch-search",
)

const catalogBasicRecents = createLibraryBasicSearchRecentsController({
  storageKey: "exxat-ds.catalog.basic-search.recents.v1",
  eventName: "exxat-catalog-basic-search-recents",
})

const DEMO_BASIC_RECENTS = [
  {
    keyword: "vital signs",
    type: "multiple_choice" as const,
    difficulty: "hard" as const,
  },
  {
    keyword: "infection control",
    type: "short_answer" as const,
    difficulty: "" as const,
  },
  {
    keyword: "",
    type: "true_false" as const,
    difficulty: "easy" as const,
  },
]

const SEEDED_QUESTION = "Find hard multiple choice on vital signs"

function ModeSwitchSearchBarDemo({
  seeded = false,
  searchDelayMs = 1200,
}: {
  /** Start in Leo mode with a question already typed, ready to send. */
  seeded?: boolean
  searchDelayMs?: number
}) {
  const [mode, setMode] = React.useState<LibrarySearchMode>(
    seeded ? "leo" : "basic",
  )
  const [keyword, setKeyword] = React.useState(seeded ? "vital signs" : "")
  const [type, setType] = React.useState<LibraryItemType | "">(
    seeded ? "multiple_choice" : "",
  )
  const [difficulty, setDifficulty] = React.useState<LibraryLevel | "">(
    seeded ? "hard" : "",
  )
  const [leoValue, setLeoValue] = React.useState(seeded ? SEEDED_QUESTION : "")
  const [lastAction, setLastAction] = React.useState<string | null>(null)
  const [searching, setSearching] = React.useState(false)

  React.useEffect(() => {
    if (catalogBasicRecents.read().length > 0) return
    for (const row of [...DEMO_BASIC_RECENTS].reverse()) {
      catalogBasicRecents.record(row)
    }
  }, [])

  const runWithOptionalDelay = React.useCallback(
    (done: () => void) => {
      setSearching(true)
      window.setTimeout(() => {
        setSearching(false)
        done()
      }, searchDelayMs)
    },
    [searchDelayMs],
  )

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 py-2">
      <ModeSwitchSearchBar
        mode={mode}
        onModeChange={setMode}
        basic={(footer) => (
          <LibraryBasicSearchBar
            keyword={keyword}
            type={type}
            difficulty={difficulty}
            onKeywordChange={setKeyword}
            onTypeChange={setType}
            onDifficultyChange={setDifficulty}
            onSubmit={(next) => {
              runWithOptionalDelay(() => {
                setLastAction(
                  `Basic search: ${formatLibraryBasicSearchLabel(next)}`,
                )
              })
            }}
            recents={catalogBasicRecents}
            searching={searching && mode === "basic"}
            footer={footer}
          />
        )}
        leo={(footer) => (
          <LibraryAskSearchBar
            value={leoValue}
            onChange={setLeoValue}
            onSubmit={(message) => {
              runWithOptionalDelay(() => {
                setLastAction(`Leo search: ${message}`)
              })
            }}
            placeholders={PLACEHOLDERS}
            recents={catalogLeoRecents}
            onRecentSelect={(query) => {
              setLeoValue(query)
              setLastAction(`Leo recent: ${query}`)
            }}
            searching={searching && mode === "leo"}
            footer={footer}
          />
        )}
      />
      {lastAction ? (
        <p className="text-center text-xs text-muted-foreground" role="status">
          {lastAction}
        </p>
      ) : null}
    </div>
  )
}

export function ModeSwitchSearchBarPreview() {
  return <ModeSwitchSearchBarDemo />
}

/**
 * The searching state, run on demand: the question is already typed, so sending
 * it plays the wash start to finish and then returns the bar to rest. The
 * question stays in the pill throughout, which is what the wash is running on.
 *
 * Not pinned on. A thinking animation that never resolves reads as decoration,
 * and it hides the half of the state that matters most, which is how the bar
 * comes back.
 */
export function ModeSwitchSearchBarSearchingPreview() {
  return <ModeSwitchSearchBarDemo seeded searchDelayMs={3200} />
}
