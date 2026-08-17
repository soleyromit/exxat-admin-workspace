"use client"

/**
 * Profile-menu switch for Library Basic vs Leo search (standing preference).
 */

import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LIBRARY_SEARCH_MODES,
  setLibrarySearchMode,
  useLibrarySearchMode,
  type LibrarySearchMode,
} from "@/hooks/use-library-search-mode"

export function LibrarySearchModeMenu() {
  const mode = useLibrarySearchMode()
  const active = LIBRARY_SEARCH_MODES.find((option) => option.id === mode)

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
        Library search
        <span className="ms-auto pe-1 text-xs text-muted-foreground">
          {active?.label}
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-64">
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value) =>
            setLibrarySearchMode(value as LibrarySearchMode)
          }
        >
          {LIBRARY_SEARCH_MODES.map((option) => (
            <DropdownMenuRadioItem
              key={option.id}
              value={option.id}
              className="items-start gap-2 py-2"
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs leading-snug text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
