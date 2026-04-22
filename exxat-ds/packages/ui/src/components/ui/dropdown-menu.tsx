"use client"

import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"

import { cn } from "../../lib/utils"

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  )
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      suppressHydrationWarning
      {...props}
    />
  )
}

function DropdownMenuContent({
  className,
  align = "start",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        className={cn("z-50 max-h-(--radix-dropdown-menu-content-available-height) w-(--radix-dropdown-menu-trigger-width) min-w-32 origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:overflow-hidden data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  shortcut,
  children,
  asChild,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
  variant?: "default" | "destructive"
  /** Visual keyboard-shortcut hint shown on the right of the item (e.g. "⌘E", "F2").
   *  Purely cosmetic — to actually bind the key, render a sibling `<Shortcut keys={…} onInvoke={…} />`
   *  in a parent that stays mounted (menu items unmount when the menu closes). */
  shortcut?: string
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      asChild={asChild}
      className={cn(
        "group/dropdown-menu-item relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:ps-7 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([data-product-logo]):not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",
        className
      )}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {children}
          {shortcut ? <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut> : null}
        </>
      )}
    </DropdownMenuPrimitive.Item>
  )
}

/** Invisible component that binds a keyboard shortcut globally while mounted.
 *  Pair with `DropdownMenuItem shortcut="⌘E"` for the visual hint. */
function Shortcut({
  keys,
  onInvoke,
  disabled,
}: {
  keys: string
  onInvoke: (e: KeyboardEvent) => void
  disabled?: boolean
}) {
  useShortcut(keys, onInvoke, disabled)
  return null
}

function useShortcut(
  keys: string,
  onInvoke: (e: KeyboardEvent) => void,
  disabled?: boolean,
) {
  const ref = React.useRef(onInvoke)
  React.useEffect(() => { ref.current = onInvoke }, [onInvoke])
  React.useEffect(() => {
    if (disabled) return
    const parsed = parseShortcut(keys)
    if (!parsed) return
    function handler(e: KeyboardEvent) {
      if (!matchesShortcut(e, parsed!)) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return
      // Skip when the user is activating an interactive control — Enter/Space on a
      // focused button, link, or role=button is already that control's native action.
      // Without this guard, a page-level `Shortcut keys="Enter"` (e.g. the wizard's
      // "submit on review") races the button's own click: the Edit / Back / Cancel
      // button runs its handler AND the window listener submits the form on the same
      // keystroke — the classic "review auto-closes when I click Edit" bug.
      if (t && (parsed!.key === "enter" || parsed!.key === " ")) {
        const role = t.getAttribute("role")
        if (
          t.tagName === "BUTTON" ||
          t.tagName === "A" ||
          t.tagName === "SELECT" ||
          role === "button" ||
          role === "link" ||
          role === "menuitem" ||
          role === "tab" ||
          role === "option" ||
          role === "checkbox" ||
          role === "radio" ||
          role === "switch" ||
          t.closest('[role="button"], [role="link"], [role="menuitem"], [role="tab"], [role="option"]')
        )
          return
      }
      // If a Radix dialog/sheet/alert-dialog is open, only fire when the event
      // originates inside it — page-level shortcuts must NOT bleed through
      // an open dialog, but in-dialog `<Shortcut>` bindings (Export, Save)
      // still need to fire.
      const openDialog = document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]') as HTMLElement | null
      if (openDialog && (!t || !openDialog.contains(t))) return
      e.preventDefault()
      e.stopPropagation()
      ref.current(e)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [keys, disabled])
}

/* --------------------------------------------------------------------------
 * Shortcut parsing + global binding
 * ------------------------------------------------------------------------ */

type ParsedShortcut = {
  meta: boolean
  ctrl: boolean
  shift: boolean
  alt: boolean
  key: string // normalized lowercase, or special like "f2", "backspace", "delete", "enter", "escape", "arrowup"…
}

function mapKey(raw: string): string {
  const p = raw.toLowerCase()
  if (raw === "⌫") return "backspace"
  if (raw === "⌦") return "delete"
  if (raw === "⏎" || p === "enter" || p === "return") return "enter"
  if (raw === "␣" || p === "space") return " "
  if (p === "esc" || p === "escape") return "escape"
  if (p === "tab") return "tab"
  if (p === "up" || raw === "↑") return "arrowup"
  if (p === "down" || raw === "↓") return "arrowdown"
  if (p === "left" || raw === "←") return "arrowleft"
  if (p === "right" || raw === "→") return "arrowright"
  return p
}

function parseShortcut(input: string): ParsedShortcut | null {
  let s = input.trim()
  if (!s) return null
  const out: ParsedShortcut = { meta: false, ctrl: false, shift: false, alt: false, key: "" }
  // Strip leading symbolic modifiers (⌘ ⌃ ⇧ ⌥) which may be glued to the key char.
  while (s.length) {
    const c = s[0]
    if (c === "⌘") { out.meta = true; s = s.slice(1) }
    else if (c === "⌃") { out.ctrl = true; s = s.slice(1) }
    else if (c === "⇧") { out.shift = true; s = s.slice(1) }
    else if (c === "⌥") { out.alt = true; s = s.slice(1) }
    else break
  }
  if (!s) return null
  // Word-style modifiers (Cmd+Shift+D, Alt P) joined by + or whitespace.
  if (/[+\s]/.test(s)) {
    for (const raw of s.split(/[+\s]+/).filter(Boolean)) {
      const p = raw.toLowerCase()
      if (raw === "⌘" || p === "cmd" || p === "meta" || p === "command") out.meta = true
      else if (raw === "⌃" || p === "ctrl" || p === "control") out.ctrl = true
      else if (raw === "⇧" || p === "shift") out.shift = true
      else if (raw === "⌥" || p === "alt" || p === "opt" || p === "option") out.alt = true
      else out.key = mapKey(raw)
    }
  } else {
    out.key = mapKey(s)
  }
  return out.key ? out : null
}

function matchesShortcut(e: KeyboardEvent, s: ParsedShortcut): boolean {
  if (e.metaKey !== s.meta) return false
  if (e.ctrlKey !== s.ctrl) return false
  if (e.altKey !== s.alt) return false
  if (e.shiftKey !== s.shift) return false
  return e.key.toLowerCase() === s.key
}


function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pe-8 ps-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:ps-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([data-product-logo]):not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span
        className="pointer-events-none absolute end-2 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <i className="fa-light fa-check" aria-hidden="true" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-1.5 rounded-md py-1 pe-8 ps-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:ps-7 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([data-product-logo]):not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute end-2 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <i className="fa-light fa-check" aria-hidden="true" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-1.5 py-1 text-xs font-medium text-muted-foreground data-inset:ps-7",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ms-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      suppressHydrationWarning
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:ps-7 data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([data-product-logo]):not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <i className="fa-light fa-chevron-right rtl:rotate-180 ms-auto" aria-hidden="true" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn("z-50 min-w-[96px] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  Shortcut,
  useShortcut,
}
