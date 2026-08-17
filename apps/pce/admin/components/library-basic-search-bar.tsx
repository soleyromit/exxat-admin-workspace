"use client"

/**
 * Airbnb-style Basic search pill for the Library hub:
 * Keyword | Type | Difficulty | Search
 *
 * One row at every width. When space runs out, segment content compresses
 * (full → mid → compact) instead of overflowing past the pill border.
 */

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SEARCH_BAR_ROW_HEIGHT,
  searchBarShellClassName,
} from "@/components/search-bar-shell"
import { SearchRecentsPopover } from "@/components/search-recents-popover"
import { Tip } from "@exxatdesignux/ui/components/tip"
import {
  formatLibraryBasicSearchLabel,
  normalizeLibraryBasicSearchSnapshot,
  type LibraryBasicSearchRecentsController,
  type LibraryBasicSearchSnapshot,
} from "@/lib/library-basic-search-recents"
import { cn } from "@/lib/utils"
import type { LibraryItemType, LibraryLevel } from "@/lib/mock/library"

const TYPE_OPTIONS: { value: LibraryItemType | ""; label: string }[] = [
  { value: "", label: "Any type" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "true_false", label: "True / false" },
  { value: "short_answer", label: "Short answer" },
]

const DIFFICULTY_OPTIONS: { value: LibraryLevel | ""; label: string }[] = [
  { value: "", label: "Any difficulty" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

type BarTier = "full" | "mid" | "compact"

const BAR_TIER_FULL_MIN = 640
const BAR_TIER_MID_MIN = 460

function useBarTier(ref: React.RefObject<HTMLElement | null>): BarTier {
  const [tier, setTier] = React.useState<BarTier>("full")

  React.useLayoutEffect(() => {
    const node = ref.current
    if (!node || typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0
      setTier(
        width >= BAR_TIER_FULL_MIN
          ? "full"
          : width >= BAR_TIER_MID_MIN
            ? "mid"
            : "compact",
      )
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])

  return tier
}

function BarDivider() {
  return (
    <span
      aria-hidden
      className="h-6 w-px shrink-0 bg-input/60 transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
    />
  )
}

const SEGMENT_CLASSNAME = cn(
  SEARCH_BAR_ROW_HEIGHT,
  "min-w-0 max-w-[14rem] shrink grow-0 justify-between gap-2 rounded-full bg-transparent px-3 text-start font-normal dark:bg-transparent aria-expanded:shadow-xs",
)

function SegmentBody({
  icon,
  label,
  value,
  active,
  tier,
}: {
  icon: string
  label: string
  value: string
  active: boolean
  tier: BarTier
}) {
  return (
    <>
      <span className="flex min-w-0 items-center gap-2">
        <i
          className={cn(
            "fa-light shrink-0 text-sm",
            icon,
            active ? "text-brand" : "text-muted-foreground",
          )}
          aria-hidden
        />
        {tier === "compact" ? null : (
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            {label}
          </span>
        )}
        {tier === "full" ? (
          <span
            className={cn(
              "min-w-0 truncate text-sm",
              active ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {value}
          </span>
        ) : active ? (
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            1
          </Badge>
        ) : null}
      </span>
      {tier === "compact" ? null : (
        <i
          className="fa-light fa-chevron-down shrink-0 text-xs text-muted-foreground"
          aria-hidden
        />
      )}
    </>
  )
}

function FacetSegment({
  label,
  valueLabel,
  icon,
  active,
  tier,
  disabled,
  children,
}: {
  label: string
  valueLabel: string
  icon: string
  active: boolean
  tier: BarTier
  disabled?: boolean
  children: React.ReactNode
}) {
  const ariaLabel = active ? `${label}: ${valueLabel}` : label
  const trigger = (
    <PopoverTrigger asChild>
      <Button
        type="button"
        variant="ghost"
        aria-label={ariaLabel}
        disabled={disabled}
        className={SEGMENT_CLASSNAME}
      >
        <SegmentBody
          icon={icon}
          label={label}
          value={valueLabel}
          active={active}
          tier={tier}
        />
      </Button>
    </PopoverTrigger>
  )

  return (
    <Popover>
      {tier === "compact" && !disabled ? (
        <Tip label={ariaLabel}>{trigger}</Tip>
      ) : (
        trigger
      )}
      <PopoverContent align="start" className="w-56 p-1">
        {children}
      </PopoverContent>
    </Popover>
  )
}

export interface LibraryBasicSearchBarProps {
  keyword: string
  type: LibraryItemType | ""
  difficulty: LibraryLevel | ""
  onKeywordChange: (value: string) => void
  onTypeChange: (value: LibraryItemType | "") => void
  onDifficultyChange: (value: LibraryLevel | "") => void
  onSubmit: (next: LibraryBasicSearchSnapshot) => void
  /** Structured Basic recents (keyword + facets). Opens from keyword focus or empty Search. */
  recents?: Pick<
    LibraryBasicSearchRecentsController,
    "read" | "clear" | "eventName" | "record"
  >
  /** In-flight search. Locks the bar and shows a Searching control. */
  searching?: boolean
  footer?: React.ReactNode
}

export function LibraryBasicSearchBar({
  keyword,
  type,
  difficulty,
  onKeywordChange,
  onTypeChange,
  onDifficultyChange,
  onSubmit,
  recents,
  searching = false,
  footer,
}: LibraryBasicSearchBarProps) {
  // `keyword` is what the last search ran on; `draft` is what the user has
  // typed since. They part company as soon as a key is pressed, so the draft
  // cannot simply read the prop. When the prop moves on its own, the draft
  // catches up here rather than in an effect: an effect would paint one frame
  // of the old keyword first, and that frame is the one the user sees blink.
  const [draft, setDraft] = React.useState(keyword)
  const [searchedKeyword, setSearchedKeyword] = React.useState(keyword)
  if (keyword !== searchedKeyword) {
    setSearchedKeyword(keyword)
    setDraft(keyword)
  }

  const barRef = React.useRef<HTMLDivElement>(null)
  const tier = useBarTier(barRef)
  const compact = tier === "compact"

  const [recentsOpen, setRecentsOpen] = React.useState(false)
  const [recentItems, setRecentItems] = React.useState<LibraryBasicSearchSnapshot[]>(
    [],
  )

  React.useEffect(() => {
    if (!recents) return
    const sync = () => setRecentItems(recents.read())
    sync()
    window.addEventListener(recents.eventName, sync)
    return () => window.removeEventListener(recents.eventName, sync)
  }, [recents])

  const typeLabel =
    TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "Any type"
  const difficultyLabel =
    DIFFICULTY_OPTIONS.find((o) => o.value === difficulty)?.label ??
    "Any difficulty"

  const currentSnapshot = React.useCallback((): LibraryBasicSearchSnapshot => {
    return {
      keyword: draft.trim(),
      type,
      difficulty,
    }
  }, [draft, type, difficulty])

  const hasActiveQuery = React.useCallback(() => {
    return Boolean(normalizeLibraryBasicSearchSnapshot(currentSnapshot()))
  }, [currentSnapshot])

  const runSearch = React.useCallback(
    (next: LibraryBasicSearchSnapshot) => {
      if (searching) return
      const snapshot = normalizeLibraryBasicSearchSnapshot(next)
      if (!snapshot) return
      setDraft(snapshot.keyword)
      onKeywordChange(snapshot.keyword)
      onTypeChange(snapshot.type)
      onDifficultyChange(snapshot.difficulty)
      recents?.record(snapshot)
      onSubmit(snapshot)
      setRecentsOpen(false)
    },
    [
      onDifficultyChange,
      onKeywordChange,
      onSubmit,
      onTypeChange,
      recents,
      searching,
    ],
  )

  const openRecents = React.useCallback(() => {
    if (searching || !recents || recentItems.length === 0) return
    setRecentsOpen(true)
  }, [recents, recentItems.length, searching])

  const searchIcon = searching ? (
    <i
      className="fa-light fa-spinner-third fa-spin"
      aria-hidden
    />
  ) : (
    <i className="fa-light fa-magnifying-glass" aria-hidden />
  )

  const searchButton = compact ? (
    <Tip label={searching ? "Searching" : "Search"}>
      <Button
        type="button"
        size="icon"
        disabled={searching}
        aria-busy={searching || undefined}
        aria-label={searching ? "Searching" : "Search"}
        className={cn(
          "aspect-square shrink-0 rounded-full",
          SEARCH_BAR_ROW_HEIGHT,
        )}
        onClick={() => {
          if (searching) return
          if (!hasActiveQuery()) {
            openRecents()
            return
          }
          runSearch(currentSnapshot())
        }}
      >
        {searchIcon}
      </Button>
    </Tip>
  ) : (
    <Button
      type="button"
      disabled={searching}
      aria-busy={searching || undefined}
      className={cn("shrink-0 rounded-full px-5", SEARCH_BAR_ROW_HEIGHT)}
      onClick={() => {
        if (searching) return
        if (!hasActiveQuery()) {
          openRecents()
          return
        }
        runSearch(currentSnapshot())
      }}
    >
      {searchIcon}
      {searching ? "Searching" : "Search"}
    </Button>
  )

  const form = (
    <form
      className={searchBarShellClassName(
        "group flex w-full min-w-0 items-center gap-0.5 overflow-hidden",
      )}
      aria-busy={searching || undefined}
      onSubmit={(event) => {
        event.preventDefault()
        if (searching) return
        if (!hasActiveQuery()) {
          openRecents()
          return
        }
        runSearch(currentSnapshot())
      }}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1 rounded-full ps-3 pe-1 transition-colors focus-within:bg-interactive-hover",
          SEARCH_BAR_ROW_HEIGHT,
          compact ? "min-w-24" : "min-w-32",
        )}
      >
        <label htmlFor="library-basic-search-keyword" className="sr-only">
          Keyword
        </label>
        <input
          id="library-basic-search-keyword"
          type="text"
          value={draft}
          disabled={searching}
          // Status belongs on the submit control, not in the field. The field
          // shows the keyword being searched, or what a keyword would be.
          placeholder={
            tier === "full" ? "Words in the question or its name" : "Search"
          }
          onChange={(event) => setDraft(event.target.value)}
          onFocus={() => {
            if (!draft.trim()) openRecents()
          }}
          onClick={() => {
            if (!draft.trim()) openRecents()
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-70 md:text-sm"
        />
        {draft && !searching ? (
          <Tip label="Clear keyword">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Clear keyword"
              className="shrink-0 rounded-full"
              onClick={() => {
                setDraft("")
                onKeywordChange("")
              }}
            >
              <i className="fa-light fa-xmark" aria-hidden />
            </Button>
          </Tip>
        ) : null}
      </div>

      <BarDivider />

      <FacetSegment
        label="Type"
        valueLabel={typeLabel}
        icon="fa-shapes"
        active={Boolean(type)}
        tier={tier}
        disabled={searching}
      >
        {TYPE_OPTIONS.map((option) => (
          <Button
            key={option.value || "any-type"}
            type="button"
            variant="ghost"
            className={cn(
              "h-auto w-full items-center justify-start rounded-md px-2 py-1.5 text-left text-sm font-normal hover:bg-interactive-hover",
              option.value === type && "bg-interactive-hover font-medium",
            )}
            onClick={() => onTypeChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </FacetSegment>

      <BarDivider />

      <FacetSegment
        label="Difficulty"
        valueLabel={difficultyLabel}
        icon="fa-signal"
        active={Boolean(difficulty)}
        tier={tier}
        disabled={searching}
      >
        {DIFFICULTY_OPTIONS.map((option) => (
          <Button
            key={option.value || "any-difficulty"}
            type="button"
            variant="ghost"
            className={cn(
              "h-auto w-full items-center justify-start rounded-md px-2 py-1.5 text-left text-sm font-normal hover:bg-interactive-hover",
              option.value === difficulty && "bg-interactive-hover font-medium",
            )}
            onClick={() => onDifficultyChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </FacetSegment>

      {searchButton}
    </form>
  )

  return (
    <div ref={barRef} className="flex w-full min-w-0 flex-col gap-2">
      {recents && recentItems.length > 0 ? (
        <SearchRecentsPopover
          open={searching ? false : recentsOpen}
          onOpenChange={setRecentsOpen}
          items={recentItems.map(formatLibraryBasicSearchLabel)}
          onSelect={(_label, index) => {
            const snapshot = recentItems[index]
            if (snapshot) runSearch(snapshot)
          }}
          onClear={() => recents.clear()}
          anchor={form}
        />
      ) : (
        form
      )}
      {footer}
    </div>
  )
}
