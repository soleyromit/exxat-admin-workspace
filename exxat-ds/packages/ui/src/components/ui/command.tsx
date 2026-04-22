"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "../../lib/utils"
import {
  InputGroup,
  InputGroupAddon,
} from "./input-group"
import { SearchIcon, CheckIcon } from "lucide-react"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-xl! bg-popover p-1 text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  overlayClassName,
  showCloseButton: _showCloseButton = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root> & {
  title?: string
  description?: string
  className?: string
  /** Backdrop — default is invisible (no dim/blur) but still captures outside clicks for modal behavior */
  overlayClassName?: string
  showCloseButton?: boolean
}) {
  return (
    <DialogPrimitive.Root {...props}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-transparent data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
            overlayClassName,
          )}
        />
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className={cn(
            "fixed top-[max(1rem,8vh)] start-1/2 z-50 w-full max-w-[min(42rem,calc(100%-2rem))] -translate-x-1/2 rtl:translate-x-1/2 overflow-hidden rounded-xl bg-popover p-0 text-popover-foreground ring-1 ring-foreground/10 shadow-lg sm:max-w-3xl md:max-w-4xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

const CommandInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof CommandPrimitive.Input> & {
    /**
     * `palette` — flat header row (icon + field) for ⌘K dialogs; matches blocks.so command-menu-02.
     * `default` — pill `InputGroup` for embedded / library previews.
     */
    variant?: "default" | "palette"
  }
>(function CommandInput({ className, variant = "default", ...props }, ref) {
  if (variant === "palette") {
    return (
      <div data-slot="command-input-wrapper" className="min-w-0 flex-1">
        <div className="flex min-h-10 w-full items-center gap-2">
          <SearchIcon className="size-4 shrink-0 opacity-50" aria-hidden />
          <CommandPrimitive.Input
            ref={ref}
            data-slot="command-input"
            className={cn(
              // cmdk keeps DOM focus here; rows use accent fill (not rings) so this can match `Input` focus without doubling ring-on-ring with items.
              "flex h-10 w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] leading-normal text-foreground shadow-none outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus-visible:border-transparent focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            {...props}
          />
        </div>
      </div>
    )
  }

  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-8! rounded-lg! border-input/30 bg-input/30 shadow-none! *:data-[slot=input-group-addon]:ps-2!">
        <CommandPrimitive.Input
          ref={ref}
          data-slot="command-input"
          className={cn(
            "w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
})
CommandInput.displayName = "CommandInput"

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        // Match popover lists (e.g. DropdownMenuItem): accent surface for hover + cmdk selection — same ring language as sidebar rows (ring-ring) is avoided here so input + row don’t read as double focus.
        // NOTE: cmdk sets `data-selected="false"` on every item and `="true"` only on the highlighted one.
        // Tailwind v4's bare `data-selected:` variant matches attribute PRESENCE, so it applies to every
        // item — in HC mode, accent resolves to brand purple and every row looks selected. Match `=true`
        // explicitly. Also dial HC selection to a border+ring affordance so the palette stays readable
        // when only one row is truly active.
        "group/command-item relative flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden ring-ring transition-colors select-none in-data-[slot=dialog-content]:rounded-lg! data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[selected=true]:*:[svg]:text-accent-foreground hc:data-[selected=true]:ring-2 hc:data-[selected=true]:ring-ring hc:data-[selected=true]:ring-inset forced-colors:data-[selected=true]:bg-[Highlight] forced-colors:data-[selected=true]:text-[HighlightText]",
        className
      )}
      {...props}
    >
      {children}
      <CheckIcon className="ms-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ms-auto text-xs tracking-widest text-muted-foreground group-data-[selected=true]/command-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
