"use client"

/**
 * The global controls the DS utility bar carries between the breadcrumb and the scope switcher (same order as
 * apps/pce/admin and the starter): Search, Notifications, Help, Ask Leo. Each does something true here:
 * - Search opens the command menu.
 * - Notifications opens the panel with its real empty state (this prototype has no notification feed; evaluation
 *   requests and reviews live on their own pages, and outbound reminders are out of scope, REQ section 14).
 * - Help lists the keyboard shortcuts this shell really has.
 * - Ask Leo uses the DS launcher; Leo is not connected to Skills tracking yet, and the panel says so.
 * What's new, Chat with support and the onboarding flag are left out: they need content or a service that does
 * not exist for this product (see docs/build/ds-shell-anatomy.md for the decision).
 */
import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Kbd, KbdGroup } from "@exxatdesignux/ui/components/ui/kbd"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@exxatdesignux/ui/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@exxatdesignux/ui/components/ui/tooltip"
import { AskLeoLauncher } from "@exxatdesignux/ui/components/shell/ask-leo-launcher"
import { utilityBarActionButtonClass } from "@exxatdesignux/ui/components/shell/utility-bar-chrome"
import { useModKeyLabel } from "@exxatdesignux/ui/hooks/use-mod-key-label"
import { requestOpenCommandMenu } from "@/components/shell/skills-nav-palette"

function BarTip({ label, children }: { label: React.ReactNode; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  )
}

export function SearchTrigger() {
  const mod = useModKeyLabel()
  return (
    <BarTip
      label={
        <span className="flex items-center gap-1.5">
          Search
          <KbdGroup>
            <Kbd>{mod}</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </span>
      }
    >
      <Button type="button" variant="ghost" size="icon-sm" aria-label="Search" className={utilityBarActionButtonClass} onClick={() => requestOpenCommandMenu()}>
        <i className="fa-light fa-magnifying-glass text-sm" aria-hidden="true" />
      </Button>
    </BarTip>
  )
}

export function NotificationsTrigger() {
  return (
    <Popover>
      <BarTip label="Notifications">
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Notifications, none unread" className={utilityBarActionButtonClass}>
            <i className="fa-light fa-bell text-sm" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
      </BarTip>
      <PopoverContent align="end" sideOffset={8} className="w-80" aria-label="Notifications">
        <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
        <p className="mt-2 text-sm text-muted-foreground">Nothing new. This prototype has no notification feed.</p>
        <p className="mt-2 text-xs text-muted-foreground">Evaluation requests, reviews and attempts are on their own pages.</p>
      </PopoverContent>
    </Popover>
  )
}

export function HelpTrigger() {
  const mod = useModKeyLabel()
  return (
    <Popover>
      <BarTip label="Help">
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Help, keyboard shortcuts" className={utilityBarActionButtonClass}>
            <i className="fa-light fa-circle-question text-sm" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
      </BarTip>
      <PopoverContent align="end" sideOffset={8} className="w-72" aria-label="Help, keyboard shortcuts">
        <h2 className="text-sm font-semibold text-foreground">Keyboard shortcuts</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Search and go to a page</dt>
            <dd>
              <KbdGroup>
                <Kbd>{mod}</Kbd>
                <Kbd>K</Kbd>
              </KbdGroup>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Collapse or expand the sidebar</dt>
            <dd>
              <KbdGroup>
                <Kbd>{mod}</Kbd>
                <Kbd>B</Kbd>
              </KbdGroup>
            </dd>
          </div>
        </dl>
      </PopoverContent>
    </Popover>
  )
}

export function AskLeoControl({ showLabel }: { showLabel: boolean }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <AskLeoLauncher open={open} onToggle={() => setOpen((o) => !o)} showLabel={showLabel} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ask Leo</DialogTitle>
            <DialogDescription>Leo is not connected to Skills tracking in this prototype.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
