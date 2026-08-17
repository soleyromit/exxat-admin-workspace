"use client"

/**
 * Shared identity-menu content — rendered from TWO places once the compact
 * shell lands: the packaged AppSidebar's footer identity menu (via
 * AppShellSlotsProvider's userMenuPreferences/userMenuConsoleItems slots)
 * and the utility bar's avatar menu (SiteHeader). Kept as standalone,
 * self-contained rows (each reads usePce()/useRouter() itself) so both
 * hosts can render the exact same behavior without prop threading.
 *
 * Ported from the old components/app-sidebar.tsx NavUser extraMenuItems
 * (role toggle + Appearance + Demo account) during the compact-shell
 * migration — do not drop role toggle or Demo account when touching this
 * file, both are relied on for QA/demo walkthroughs.
 */

import * as React from "react"
import { useRouter } from "@/lib/next-compat"
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SettingsAppearanceCard } from "@/components/settings-appearance-card"
import { usePce } from "@/components/pce/pce-state"
import { NAV_FACULTY } from "@/lib/pce-nav"

const FACULTY_LANDING = NAV_FACULTY[0]?.url ?? "/my-surveys"
const ADMIN_LANDING = "/analytics"

/** Role toggle + Appearance — one separator-delimited preference group. */
export function AccountPreferencesMenu() {
  const { user, toggleRole } = usePce()
  const router = useRouter()
  const [appearanceOpen, setAppearanceOpen] = React.useState(false)

  function handleToggleRole() {
    const goingToFaculty = user.role === "admin"
    toggleRole()
    router.push(goingToFaculty ? FACULTY_LANDING : ADMIN_LANDING)
  }

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleToggleRole}>
        <i className="fa-light fa-arrows-rotate" aria-hidden="true" />
        Switch to {user.role === "admin" ? "Faculty" : "Admin"} view
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setAppearanceOpen(true)}>
        <i className="fa-light fa-paintbrush" aria-hidden="true" />
        Appearance
      </DropdownMenuItem>

      <Sheet open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <SheetContent
          side="right"
          className="w-full data-[side=right]:sm:max-w-2xl overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Appearance</SheetTitle>
            <SheetDescription>
              Theme, contrast, text size, and brand. Saved in this browser.
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6">
            <SettingsAppearanceCard />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

/** Demo account switcher — each account is a distinct dashboard term-card scenario. */
export function DemoAccountMenuItem() {
  const { accountId, accounts, switchAccount } = usePce()

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <i className="fa-light fa-user-group" aria-hidden="true" />
        Demo account
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-w-[20rem]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Term-card scenarios
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup value={accountId} onValueChange={switchAccount}>
          {accounts.map(a => (
            <DropdownMenuRadioItem key={a.id} value={a.id} className="items-start">
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{a.name}</span>
                <span className="text-xs text-muted-foreground">{a.blurb}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
