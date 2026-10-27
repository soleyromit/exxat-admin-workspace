"use client"

/**
 * One "Filter" control for the skills library (REQ SL-10: filterable by category and tag; name and status are the search and
 * the tabs). One category and one tag at a time, like the report filters, held in the URL (?cat=, ?tag=) so a filtered
 * library can be shared and survives Back. DS Popover + Command; the trigger names how many filters are on, and each
 * applied filter is removed by choosing it again or with "Clear filters". Shared by library A, B and C.
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@exxatdesignux/ui/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { filterOptions, type LibraryFilter, type LibraryRow } from "@/lib/lab/library"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function useLibraryFilter(): [LibraryFilter, (f: Partial<LibraryFilter>) => void] {
  const router = useRouter()
  const pathname = usePathname() ?? ""
  const params = useSearchParams()
  const cat = params?.get("cat") ?? null
  const tag = params?.get("tag") ?? null
  // One replace for both keys, so "Clear filters" never loses one to a stale URL.
  const set = React.useCallback((f: Partial<LibraryFilter>) => {
    const q = new URLSearchParams(window.location.search)
    for (const k of ["cat", "tag"] as const) {
      if (!(k in f)) continue
      const v = f[k]
      if (v) q.set(k, v)
      else q.delete(k)
    }
    const s = q.toString()
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false })
  }, [pathname, router])
  return [React.useMemo(() => ({ cat, tag }), [cat, tag]), set]
}

/** "Filter" or "Filter: Nutrition, Patient safety": what is applied is readable on the trigger itself. */
export function filterLabel(f: LibraryFilter): string {
  const on = [f.cat, f.tag].filter(Boolean)
  return on.length ? `Filter: ${on.join(", ")}` : "Filter"
}

function Check({ on }: { on: boolean }) {
  return <i className={`fa-light fa-check w-4 text-xs ${on ? "" : "invisible"}`} aria-hidden="true" />
}

export function LibraryFilterMenu({ rows, value, onChange }: { rows: readonly LibraryRow[]; value: LibraryFilter; onChange: (f: Partial<LibraryFilter>) => void }) {
  const [open, setOpen] = React.useState(false)
  const opts = React.useMemo(() => filterOptions(rows), [rows])
  const on = !!(value.cat || value.tag)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="max-w-72" data-library-filter aria-label={on ? `${filterLabel(value)}. Change filters` : "Filter by category or tag"}>
          <span className="truncate">{filterLabel(value)}</span>
          <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Find a category or tag" aria-label="Find a category or tag" />
          <CommandList className="max-h-80">
            <CommandEmpty>No category or tag matches.</CommandEmpty>
            {/* Clear first when something is applied; tags (a short list) before the long category list. */}
            {on ? (
              <>
                <CommandGroup>
                  <CommandItem value="__clear" onSelect={() => { onChange({ cat: null, tag: null }); setOpen(false) }}>Clear filters</CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            ) : null}
            <CommandGroup heading="Tag">
              {opts.tags.length ? opts.tags.map((t) => (
                <CommandItem key={`t-${t.name}`} value={`tag ${t.name}`} onSelect={() => onChange({ tag: value.tag === t.name ? null : t.name })} aria-selected={value.tag === t.name}>
                  <Check on={value.tag === t.name} />
                  <span className="min-w-0 flex-1 truncate">{t.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{t.count}</span>
                </CommandItem>
              )) : <p className="px-2 py-1.5 text-sm text-muted-foreground">No tags yet.</p>}
            </CommandGroup>
            <CommandGroup heading="Category">
              {opts.categories.map((c) => (
                <CommandItem key={`c-${c.name}`} value={`category ${c.name}`} onSelect={() => onChange({ cat: value.cat === c.name ? null : c.name })} aria-selected={value.cat === c.name}>
                  <Check on={value.cat === c.name} />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{c.count}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
