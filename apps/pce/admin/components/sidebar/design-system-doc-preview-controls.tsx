"use client"

/**
 * Doc preview modes — color scheme + high contrast for design-system routes.
 * Renders in `SiteHeader` trailing (breadcrumb top-right), not the drill-in sidebar.
 */

import * as React from "react"
import { useTheme, type ColorScheme } from "@exxatdesignux/ui/hooks/use-color-scheme"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import { useAppTheme } from "@/hooks/use-app-theme"
import { cn } from "@/lib/utils"

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: "fa-light fa-sun" },
  { value: "dark", label: "Dark", icon: "fa-light fa-moon" },
  { value: "system", label: "System", icon: "fa-light fa-desktop" },
] as const

function themeTriggerIcon(theme: string): string {
  if (theme === "dark") return "fa-light fa-moon"
  if (theme === "light") return "fa-light fa-sun"
  return "fa-light fa-desktop"
}

export function DesignSystemDocPreviewControls({ className }: { className?: string }) {
  const { theme = "system", setTheme } = useTheme()
  const { contrast, setContrast, mounted } = useAppTheme()
  const [themeMounted, setThemeMounted] = React.useState(false)
  React.useEffect(() => setThemeMounted(true), [])

  const resolvedTheme = themeMounted ? theme : "system"
  const hcOn = mounted && contrast === "high"

  return (
    <DropdownMenu>
      <Tip label="Preview modes" side="bottom">
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn("relative shrink-0", className)}
            aria-label="Preview modes"
          >
            <i className={cn(themeTriggerIcon(resolvedTheme), "text-sm")} aria-hidden="true" />
            {hcOn ? (
              <span
                className="absolute end-1 top-1 size-1.5 rounded-full bg-brand ring-2 ring-background"
                aria-hidden="true"
              />
            ) : null}
          </Button>
        </DropdownMenuTrigger>
      </Tip>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Color scheme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={resolvedTheme}
          onValueChange={(value) => setTheme(value as ColorScheme)}
        >
          {THEME_OPTIONS.map((opt) => (
            <DropdownMenuRadioItem key={opt.value} value={opt.value}>
              <i className={cn(opt.icon, "text-xs")} aria-hidden="true" />
              {opt.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={hcOn}
          onCheckedChange={(checked) => setContrast(checked ? "high" : "normal")}
        >
          High contrast
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
