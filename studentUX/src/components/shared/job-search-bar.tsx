"use client";

import * as React from "react";
import { InputGroupInput } from "../ui/input-group";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { Popover, PopoverAnchor, PopoverContent } from "../ui/popover";
import { useIsMobile } from "../ui/use-mobile";
import { cn } from "../ui/utils";

const PLACEHOLDER = "Job title, Site, Specialty, benefits, Keyword";

const DEFAULT_SUGGESTIONS = [
  "Physical therapy jobs",
  "Pediatric Outpatient Jobs",
  "Loan reimbursement",
  "Sports Medicine",
  "Orthopedic jobs",
];

/** Categorized suggestions: job title, benefits, keyword, site/company */
export type SuggestionCategory = "jobTitle" | "benefits" | "keyword" | "siteOrCompany";

export interface SuggestionGroup {
  category: SuggestionCategory;
  label: string;
  items: string[];
}

/** Natural search phrases — how students would type */
const DEFAULT_SUGGESTION_GROUPS: SuggestionGroup[] = [
  {
    category: "jobTitle",
    label: "Job titles",
    items: [
      "Physical therapy jobs",
      "Nurse practitioner jobs",
      "Pediatric NP positions",
    ],
  },
  {
    category: "benefits",
    label: "Benefits",
    items: [
      "Loan forgiveness jobs",
      "Relocation assistance",
      "Remote or flexible schedule",
    ],
  },
  {
    category: "keyword",
    label: "Keywords",
    items: [
      "Inpatient jobs",
      "Outpatient primary care",
      "Behavioral health",
    ],
  },
  {
    category: "siteOrCompany",
    label: "Sites & companies",
    items: [
      "Johns Hopkins jobs",
      "Mayo Clinic",
      "Kaiser Permanente",
    ],
  },
];

/** Flat list for backward compatibility / animated placeholder */
const SEARCH_SUGGESTIONS = DEFAULT_SUGGESTION_GROUPS.flatMap((g) => g.items);

const ROTATION_INTERVAL_MS = 3000;

function filterSuggestions(query: string, list: string[]): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((s) => s.toLowerCase().includes(q));
}

const MAX_ITEMS_PER_GROUP = 3;

function filterSuggestionGroups(query: string, groups: SuggestionGroup[]): SuggestionGroup[] {
  const q = query.trim().toLowerCase();
  return groups
    .map((g) => ({
      ...g,
      items: q ? g.items.filter((s) => s.toLowerCase().includes(q)) : g.items,
    }))
    .filter((g) => g.items.length > 0)
    .map((g) => ({ ...g, items: g.items.slice(0, MAX_ITEMS_PER_GROUP) }));
}

export interface JobSearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchLocation?: string;
  onSearchLocationChange?: (value: string) => void;
  className?: string;
  /** When "animated", shows rotating placeholder suggestions like "Try Physical therapy job" */
  placeholderVariant?: "default" | "animated";
  /** Custom suggestions for animated variant (prefixed with "Try ") */
  placeholderSuggestions?: string[];
  /** Categorized suggestions for popover (default: DEFAULT_SUGGESTION_GROUPS) */
  suggestionGroups?: SuggestionGroup[];
}

export function JobSearchBar({
  searchQuery,
  onSearchQueryChange,
  searchLocation = "",
  onSearchLocationChange,
  className,
  placeholderVariant = "default",
  placeholderSuggestions = DEFAULT_SUGGESTIONS,
  suggestionGroups = DEFAULT_SUGGESTION_GROUPS,
}: JobSearchBarProps) {
  const isMobile = useIsMobile();
  const showLocation = !isMobile && onSearchLocationChange != null;
  const [suggestionIndex, setSuggestionIndex] = React.useState(0);
  const [isFocused, setIsFocused] = React.useState(false);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const blurTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = React.useRef<HTMLDivElement>(null);

  const suggestions = placeholderSuggestions;
  const showAnimatedPlaceholder =
    placeholderVariant === "animated" &&
    !searchQuery &&
    !isFocused &&
    suggestions.length > 0;

  const filteredSuggestionGroups = React.useMemo(
    () => filterSuggestionGroups(searchQuery, suggestionGroups),
    [searchQuery, suggestionGroups]
  );

  React.useEffect(() => {
    if (placeholderVariant !== "animated" || !showAnimatedPlaceholder) return;
    const id = setInterval(() => {
      setSuggestionIndex((i) => (i + 1) % suggestions.length);
    }, ROTATION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [placeholderVariant, showAnimatedPlaceholder, suggestions.length]);

  const handleFocus = () => {
    setIsFocused(true);
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setPopoverOpen(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    blurTimeoutRef.current = setTimeout(() => setPopoverOpen(false), 150);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSearchQueryChange(suggestion);
    setPopoverOpen(false);
  };

  React.useEffect(() => () => {
    if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open && anchorRef.current?.contains(document.activeElement)) {
      return; // Keep open if focus is still on the search input (avoids spurious close)
    }
    setPopoverOpen(open);
  };

  const handleSearchButtonClick = () => {
    setPopoverOpen(false);
    const firstInput = anchorRef.current?.querySelector<HTMLInputElement>(
      'input[type="text"]'
    );
    firstInput?.blur();
  };

  return (
    <Popover open={popoverOpen} onOpenChange={handleOpenChange} modal={false}>
      <div
        ref={anchorRef}
        data-exxat-job-search-root
        className={cn("w-full min-w-0", className)}
      >
        <PopoverAnchor asChild>
          <div
            role="search"
            data-exxat-job-search-field
            className={cn(
              "jobs-search-bar search-bar-height flex w-full min-w-0 items-center gap-2 bg-background",
              "border border-[var(--control-border)] transition-[color,box-shadow]",
              "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
              "has-[[data-slot=input-group-control]:focus]:border-ring",
              "has-[[data-slot=input-group-control]:focus]:ring-[3px]",
              "has-[[data-slot=input-group-control]:focus]:ring-ring/50",
              "overflow-visible"
            )}
            style={{ borderColor: "var(--control-border)" }}
          >
          <div className="flex min-h-0 min-w-0 flex-1 items-center gap-0">
              <span className="inline-flex shrink-0 px-1 text-brand" aria-hidden="true">
                <FontAwesomeIcon
                  name="starChristmas"
                  className="h-4 w-4 shrink-0"
                  weight="solid"
                />
              </span>
              <div className="relative flex min-h-0 min-w-0 flex-1 items-center">
                <InputGroupInput
                  type="text"
                  placeholder={placeholderVariant === "animated" ? " " : PLACEHOLDER}
                  className="h-full min-w-0 flex-1 text-sm pl-1 border-0 bg-transparent"
                  aria-label={PLACEHOLDER}
                  aria-expanded={popoverOpen}
                  aria-haspopup="listbox"
                  aria-controls="job-search-suggestions"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                {showAnimatedPlaceholder && (
                  <div
                    className="absolute inset-0 flex items-center pl-2 pointer-events-none text-sm text-muted-foreground"
                    aria-hidden
                  >
                    <span
                      key={suggestionIndex}
                      className="animate-in fade-in duration-500 slide-in-from-bottom-2"
                    >
                      Try {suggestions[suggestionIndex]}
                    </span>
                  </div>
                )}
                {searchQuery && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                        aria-label="Clear job title"
                        onClick={() => onSearchQueryChange("")}
                      >
                        <FontAwesomeIcon
                          name="x"
                          className="h-3.5 w-3.5"
                          weight="regular"
                          aria-hidden
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Clear job title</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          {showLocation && (
            <div className="ml-1 flex items-center border-l border-[var(--border-control-35)] pl-2">
              <InputGroupInput
                type="text"
                placeholder="Location"
                className="h-full text-sm w-40 flex-initial pl-3 border-0"
                aria-label="Location"
                value={searchLocation}
                onChange={(e) => onSearchLocationChange?.(e.target.value)}
              />
              {searchLocation && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                      aria-label="Clear location"
                      onClick={() => onSearchLocationChange?.("")}
                    >
                      <FontAwesomeIcon name="x" className="h-3.5 w-3.5" weight="regular" aria-hidden />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Clear location</TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
            <Button
              type="button"
              variant="default"
              size="default"
              data-exxat-job-search-submit
              className="relative z-[2] shrink-0 self-center max-md:min-h-11"
              onClick={handleSearchButtonClick}
            >
              Search
            </Button>
          </div>
        </PopoverAnchor>
      </div>
      <PopoverContent
        id="job-search-suggestions"
        role="listbox"
        className="w-[max(var(--radix-popover-trigger-width),min(480px,calc(100vw-2rem)))] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          if (anchorRef.current?.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}
      >
        <p className="text-sm font-semibold text-foreground px-4 pt-4 pb-2">
          Search suggestions
        </p>
        <ul className="py-2 pb-4" role="listbox" aria-label="Search suggestions">
          {filteredSuggestionGroups.length > 0 ? (
            filteredSuggestionGroups.flatMap((group) =>
              group.items.map((suggestion) => (
                <li key={`${group.category}-${suggestion}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={searchQuery === suggestion}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm font-normal text-foreground hover:bg-muted transition-colors text-left"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSuggestionClick(suggestion);
                    }}
                  >
                    <FontAwesomeIcon name="search" className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span>{suggestion}</span>
                  </button>
                </li>
              ))
            )
          ) : (
            <li className="px-4 py-3">
              <p className="text-sm text-muted-foreground">No suggestions match &quot;{searchQuery}&quot;</p>
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
