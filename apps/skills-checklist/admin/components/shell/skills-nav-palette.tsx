"use client"

/**
 * Command menu (⌘K): navigation entries from docs/ux/03 §6, using the DS Command primitives. Opens from the
 * utility bar's Search button or the chord. Entries follow the same visibility rule as the sidebar (SC-15).
 */
import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@exxatdesignux/ui/components/ui/command"
import { ROUTES, STUDENT_ROUTES, PREVIEW_ROUTES } from "@/lib/skills-routes"
import { useDb } from "@/lib/store/react"
import { reviewNavVisible } from "@/lib/store"

export const OPEN_COMMAND_MENU_EVENT = "skills:open-command-menu"
export function requestOpenCommandMenu() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_COMMAND_MENU_EVENT))
}

export function CommandMenu() {
  const router = useRouter()
  const db = useDb()
  const [open, setOpen] = React.useState(false)
  const showReview = reviewNavVisible(db)

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

  const admin: Array<[string, string]> = [
    ["Home", ROUTES.home],
    ["Attainment", ROUTES.attainment],
    ["Kits", ROUTES.kits],
    ["Skills", ROUTES.skills],
    ["Import skills", ROUTES.import],
    ["Add skill", ROUTES.skillNew],
    ["Courses", ROUTES.courses],
    ...(showReview ? ([["Reviews", ROUTES.reviews]] as Array<[string, string]>) : []),
  ]
  const other: Array<[string, string]> = [
    ["Switch to student view", STUDENT_ROUTES.courses],
    ["My skills (student view)", STUDENT_ROUTES.mySkills],
    ["Switch to evaluator view", PREVIEW_ROUTES.preceptor],
    ["Sample data and display options", ROUTES.devState],
  ]

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Go to a page" overlayClassName="bg-transparent">
      {/* The DS CommandDialog renders only the dialog frame: the cmdk root must be supplied here (as PCE's palette does),
          or CommandInput/CommandList have no store and the page crashes on open. */}
      <Command loop label="Go to a page" className="bg-popover p-0">
        <div className="flex h-12 items-center gap-2 border-b border-border/50 px-4">
          <CommandInput variant="palette" aria-label="Go to a page" placeholder="Go to a page" />
        </div>
        <CommandList className="max-h-[min(640px,72vh)] py-2">
          <CommandEmpty>No pages match.</CommandEmpty>
          <CommandGroup heading="Pages">
            {admin.map(([label, href]) => (
              <CommandItem key={href} value={label} onSelect={() => go(href)}>
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Switch view">
            {other.map(([label, href]) => (
              <CommandItem key={href} value={label} onSelect={() => go(href)}>
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
