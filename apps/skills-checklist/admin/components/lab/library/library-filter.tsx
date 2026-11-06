"use client"

/**
 * One Filters button for the skills library with removable chips below (REQ SL-10; map D1): category, tag, configuration, came from, on no list and different number; name
 * and status are the search and the tabs. Show them on the Add several banner adds one more, reachable only from there and removed by its chip.
 * One value each, like the report filters, held in the URL (?cat=, ?tag=, ?config=, ?different=1, ?added=, ?from=, ?nolist=1) so a
 * filtered library can be shared and survives Back. DS Popover + Command. Shared by library A, B and C.
 */
import * as React from "react"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@exxatdesignux/ui/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import { CONFIGURATION_META, CONFIGURATION_ORDER, filterOptions, isConfiguration, type LibraryFilter, type LibraryRow } from "@/lib/lab/library"
import { pushPageUrl } from "@/components/lab/shared/unsaved-guard"
import { capitalize, skillListsNoun } from "@/lib/lab/terms"
import { usePathname, useSearchParams } from "next/navigation"

export const NO_FILTER: LibraryFilter = { cat: null, tag: null, config: null, different: false, added: null, from: null, noList: false }

export function useLibraryFilter(): [LibraryFilter, (f: Partial<LibraryFilter>, how?: { push?: boolean }) => void] {
  const pathname = usePathname() ?? ""
  const params = useSearchParams()
  const cat = params?.get("cat") ?? null
  const tag = params?.get("tag") ?? null
  const rawConfig = params?.get("config")
  const config = isConfiguration(rawConfig) ? rawConfig : null
  const different = params?.get("different") === "1"
  const added = params?.get("added") ?? null
  const from = params?.get("from") ?? null
  const noList = params?.get("nolist") === "1"
  // One replace for all keys, so "Clear filters" never loses one to a stale URL.
  // `push`: a filter a banner applied for the admin, so Back returns to the whole list.
  const set = React.useCallback((f: Partial<LibraryFilter>, how?: { push?: boolean }) => {
    const q = new URLSearchParams(window.location.search)
    for (const k of ["cat", "tag", "config", "added", "from"] as const) {
      if (!(k in f)) continue
      const v = f[k]
      if (v) q.set(k, v)
      else q.delete(k)
    }
    if ("different" in f) { if (f.different) q.set("different", "1"); else q.delete("different") }
    if ("noList" in f) { if (f.noList) q.set("nolist", "1"); else q.delete("nolist") }
    const s = q.toString()
    const to = s ? `${pathname}?${s}` : pathname
    if (how?.push) pushPageUrl(to)
    // No trip to the server: the filter only reaches client components (see useUrlParam in library-chrome.tsx).
    else window.history.replaceState(null, "", to)
  }, [pathname])
  return [React.useMemo(() => ({ cat, tag, config, different, added, from, noList }), [cat, tag, config, different, added, from, noList]), set]
}

export const anyFilterOn = (f: LibraryFilter): boolean => !!(f.cat || f.tag || f.config || f.different || f.added || f.from || f.noList)

/** How many filters are on, for the button. */
export function filterLabel(f: LibraryFilter): string {
  const n = [f.cat, f.tag, f.config, f.different, f.added, f.from, f.noList].filter(Boolean).length
  return n ? `Filters (${n})` : "Filters"
}

function Check({ on }: { on: boolean }) {
  return <i className={`fa-light fa-check w-4 text-xs ${on ? "" : "invisible"}`} aria-hidden="true" />
}

export function LibraryFilterMenu({ rows, value, onChange }: { rows: readonly LibraryRow[]; value: LibraryFilter; onChange: (f: Partial<LibraryFilter>) => void }) {
  const [open, setOpen] = React.useState(false)
  const opts = React.useMemo(() => filterOptions(rows), [rows])
  const on = anyFilterOn(value)
  const countOf = (c: LibraryRow["configuration"]) => rows.filter((r) => r.configuration === c).length
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="max-w-72" data-library-filter aria-label={on ? `${filterLabel(value)}. Change filters` : "Filters"}>
          <span className="truncate">{filterLabel(value)}</span>
          <i className="fa-light fa-chevron-down text-xs" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Find a filter" aria-label="Find a filter" />
          <CommandList className="max-h-80">
            <CommandEmpty>No filter matches.</CommandEmpty>
            {on ? (
              <>
                <CommandGroup>
                  <CommandItem value="__clear" onSelect={() => { onChange(NO_FILTER); setOpen(false) }}>Clear filters</CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            ) : null}
            <CommandGroup heading="Configuration">
              {CONFIGURATION_ORDER.map((c) => (
                <CommandItem key={c} value={`configuration ${CONFIGURATION_META[c].label}`} onSelect={() => onChange({ config: value.config === c ? null : c })} aria-selected={value.config === c}>
                  <Check on={value.config === c} />
                  <span className="min-w-0 flex-1 truncate">{CONFIGURATION_META[c].label}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{countOf(c)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Times needed">
              <CommandItem value="times different number" onSelect={() => onChange({ different: !value.different })} aria-selected={!!value.different}>
                <Check on={!!value.different} />
                <span className="min-w-0 flex-1 truncate">Different number</span>
                <span className="text-xs tabular-nums text-muted-foreground">{rows.filter((r) => r.timesDiffer).length}</span>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Came from">
              {opts.sources.map((c) => (
                <CommandItem key={`s-${c.name}`} value={`came from ${c.name}`} onSelect={() => onChange({ from: value.from === c.name ? null : c.name })} aria-selected={value.from === c.name}>
                  <Check on={value.from === c.name} />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{c.count}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading={capitalize(skillListsNoun())}>
              <CommandItem value="skill lists on no list" onSelect={() => onChange({ noList: !value.noList })} aria-selected={!!value.noList}>
                <Check on={!!value.noList} />
                <span className="min-w-0 flex-1 truncate">On no list</span>
                <span className="text-xs tabular-nums text-muted-foreground">{rows.filter((r) => !r.onLists).length}</span>
              </CommandItem>
            </CommandGroup>
            {/* Tags (a short list) before the long category list. */}
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

/** The filters that are on, each removable alone. */
export function LibraryFilterChips({ value, onChange }: { value: LibraryFilter; onChange: (f: Partial<LibraryFilter>) => void }) {
  const chips: Array<{ label: string; clear: Partial<LibraryFilter> }> = [
    ...(value.added ? [{ label: "Added together", clear: { added: null } }] : []),
    ...(value.config ? [{ label: CONFIGURATION_META[value.config].label, clear: { config: null } }] : []),
    ...(value.different ? [{ label: "Different number", clear: { different: false } }] : []),
    ...(value.from ? [{ label: value.from, clear: { from: null } }] : []),
    ...(value.noList ? [{ label: "On no list", clear: { noList: false } }] : []),
    ...(value.tag ? [{ label: value.tag, clear: { tag: null } }] : []),
    ...(value.cat ? [{ label: value.cat, clear: { cat: null } }] : []),
  ]
  if (!chips.length) return null
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Filters on" data-filter-chips>
      {chips.map((c) => (
        <li key={c.label}>
          <Badge variant="outline" className="gap-1 pe-0.5">
            {c.label}
            <Button type="button" variant="ghost" size="icon-xs" aria-label={`Remove filter ${c.label}`} onClick={() => onChange(c.clear)}>
              <i className="fa-light fa-xmark" aria-hidden="true" />
            </Button>
          </Badge>
        </li>
      ))}
    </ul>
  )
}
