"use client"

/** Command menu for v2: search the current role's pages, or switch role. Opens from the utility bar Search button or the chord. */
import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@exxatdesignux/ui/components/ui/command"
import { OPEN_COMMAND_MENU_EVENT } from "@/components/shell/skills-nav-palette"
import { NAV_ROWS, ROLES, roleForPath } from "@/lib/v2/roles"

export function V2CommandMenu() {
  const router = useRouter()
  const rows = NAV_ROWS[roleForPath(usePathname() ?? "") ?? "admin"]
  const [open, setOpen] = React.useState(false)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener("keydown", onKey)
    window.addEventListener(OPEN_COMMAND_MENU_EVENT, onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(OPEN_COMMAND_MENU_EVENT, onOpen)
    }
  }, [])
  const go = (href: string) => {
    setOpen(false)
    router.push(href)
  }
  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Go to a page" overlayClassName="bg-transparent">
      <Command loop label="Search pages" className="bg-popover p-0">
        <div className="flex h-12 items-center gap-2 border-b border-border/50 px-4">
          <CommandInput variant="palette" aria-label="Search pages" placeholder="Search pages" />
        </div>
        <CommandList className="max-h-[min(640px,72vh)] py-2">
          <CommandEmpty>No pages match.</CommandEmpty>
          <CommandGroup heading="Pages">
            {rows.map((r) => (
              <CommandItem key={r.key} value={r.title} onSelect={() => go(r.url)}>
                {r.title}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Roles">
            {ROLES.map((r) => (
              <CommandItem key={r.id} value={r.label} onSelect={() => go(r.home)}>
                {r.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
