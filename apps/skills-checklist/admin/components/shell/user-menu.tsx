"use client"

/**
 * Profile menu (apps/pce/admin components/utility-user-menu.tsx anatomy): identity header, then the view switch
 * ("Switch to Faculty view" in PCE), Appearance, workspace/sample-data link. This is where persona switching lives in
 * Exxat products, instead of sibling groups in the left nav. There is no sign-in in this prototype, so there is no
 * "Log out" row and the identity is labelled as sample data.
 */
import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Avatar, AvatarFallback } from "@exxatdesignux/ui/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@exxatdesignux/ui/components/ui/dropdown-menu"
import { Kbd, KbdGroup } from "@exxatdesignux/ui/components/ui/kbd"
import { utilityBarActionButtonClass } from "@exxatdesignux/ui/components/shell/utility-bar-chrome"
import { useModKeyLabel } from "@exxatdesignux/ui/hooks/use-mod-key-label"
import { focusWalkthroughBar, setWalkthroughStepsShown, shortcutKeys } from "@/components/lab/lab-bar/walkthrough-visibility"
import { PREVIEW_ROUTES, ROUTES, STUDENT_ROUTES } from "@/lib/skills-routes"
import { VIEW_LABEL, viewForPath, type ShellView } from "@/components/shell/view"

const VIEW_HOME: Record<ShellView, string> = {
  admin: ROUTES.home,
  student: STUDENT_ROUTES.courses,
  evaluator: PREVIEW_ROUTES.preceptor,
}

/**
 * `walkthroughSteps`: passed only on a walkthrough step (lab-bar/walkthrough-controls.tsx), where the menu holds the one way back to the
 * hidden path bar, "Show walkthrough steps", with its shortcut. The product's own utility bar never passes it, so the row exists
 * nowhere else.
 */
export function UserMenu({ walkthroughSteps }: { walkthroughSteps?: { shown: boolean } } = {}) {
  const pathname = usePathname() ?? ""
  const view = viewForPath(pathname)
  const { theme, setTheme } = useTheme()
  const mac = useModKeyLabel() === "⌘"
  // Turning the bar on moves focus to it, so the menu hands focus to the bar, not back to the avatar, as it closes.
  const keepFocusOnBar = React.useRef(false)
  const others = (Object.keys(VIEW_HOME) as ShellView[]).filter((v) => v !== view)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="SU, sample user, open profile and settings menu" className={utilityBarActionButtonClass} data-walkthrough-menu-trigger={walkthroughSteps ? "" : undefined}>
          <Avatar className="size-6">
            <AvatarFallback aria-hidden="true" className="text-2xs">
              SU
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className={walkthroughSteps ? "w-80" : "w-64"}
        onCloseAutoFocus={(e) => {
          if (!keepFocusOnBar.current) return
          keepFocusOnBar.current = false
          // The open menu traps focus while the bar mounts, so the bar takes it here, as the menu lets go.
          if (focusWalkthroughBar()) e.preventDefault()
        }}
      >
        <DropdownMenuLabel className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback aria-hidden="true" className="text-xs">
              SU
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">Sample user</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{VIEW_LABEL[view]} view, sample data</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {others.map((v) => (
          <DropdownMenuItem key={v} asChild className="min-h-9 gap-2">
            <Link href={VIEW_HOME[v]}>
              <i className="fa-light fa-arrows-rotate text-muted-foreground" aria-hidden="true" />
              Switch to {VIEW_LABEL[v].toLowerCase()} view
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="min-h-9 gap-2">
            <i className="fa-light fa-paintbrush text-muted-foreground" aria-hidden="true" />
            Appearance
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        {walkthroughSteps ? (
          <DropdownMenuItem
            className="min-h-9 gap-2"
            aria-keyshortcuts="Control+Shift+?"
            data-walkthrough-steps-toggle
            onSelect={() => {
              const show = !walkthroughSteps.shown
              keepFocusOnBar.current = show
              setWalkthroughStepsShown(show)
            }}
          >
            <i className="fa-light fa-route text-muted-foreground" aria-hidden="true" />
            <span className="whitespace-nowrap">{walkthroughSteps.shown ? "Hide walkthrough steps" : "Show walkthrough steps"}</span>
            <KbdGroup className="ms-auto" aria-hidden="true">
              {shortcutKeys(mac).map((k) => <Kbd key={k}>{k}</Kbd>)}
            </KbdGroup>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild className="min-h-9 gap-2">
          <Link href={ROUTES.devState}>
            <i className="fa-light fa-database text-muted-foreground" aria-hidden="true" />
            Sample data and display options
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
