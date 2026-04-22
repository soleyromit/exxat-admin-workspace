"use client"

import * as React from "react"
import { FontAwesomeIcon } from "../brand/font-awesome-icon"
import { useAppStore } from "@/stores/app-store"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "../ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "../ui/sidebar"
import { cn } from "../ui/utils"

type ColorTheme = "rose" | "lavender" | "sage"
type DensityMode = "comfortable" | "compact"
type ContrastMode = "default" | "high"

const COLOR_THEMES: { value: ColorTheme; label: string; swatch: string }[] = [
  { value: "rose",     label: "Exxat Prism", swatch: "oklch(0.57 0.24 342)" },
  { value: "lavender", label: "Exxat One",   swatch: "oklch(0.97 0.02 270)" },
  { value: "sage",     label: "Sage",     swatch: "oklch(0.55 0.15 155)" },
]

export function NavUser({
  user,
  isCollapsed: isCollapsedProp,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
  isCollapsed?: boolean
}) {
  const { isMobile, state } = useSidebar()
  const isCollapsed = isCollapsedProp ?? state === "collapsed"
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("light")
  const [colorTheme, setColorTheme] = React.useState<ColorTheme>("lavender")
  const [contrast, setContrast] = React.useState<ContrastMode>("default")
  const density = useAppStore((s) => s.density)
  const setDensity = useAppStore((s) => s.setDensity)
  const jobSearchBarVariant = useAppStore((s) => s.jobSearchBarVariant)
  const setJobSearchBarVariant = useAppStore((s) => s.setJobSearchBarVariant)

  // Initialize themes from localStorage
  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null
    const savedColor = localStorage.getItem("colorTheme") as ColorTheme | null
    const savedDensity = localStorage.getItem("density") as DensityMode | null
    const savedContrast = localStorage.getItem("contrast") as ContrastMode | null
    const initialTheme = savedTheme || "light"
    const initialColor = savedColor || "lavender"
    const initialContrast = savedContrast || "default"
    
    setTheme(initialTheme)
    setColorTheme(initialColor)
    setContrast(initialContrast)
    applyTheme(initialTheme)
    applyColorTheme(initialColor)
    applyContrast(initialContrast)
    if (savedDensity === "compact") setDensity("compact")
  }, [setDensity])

  // Apply light/dark theme to document
  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    const root = document.documentElement
    
    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      if (systemTheme === "dark") {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    } else if (newTheme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    
    localStorage.setItem("theme", newTheme)
  }

  // Apply color theme class to document
  const applyColorTheme = (newColor: ColorTheme) => {
    const root = document.documentElement
    // Remove all theme classes
    root.classList.remove("theme-lavender", "theme-sage", "theme-rose")
    root.classList.add(`theme-${newColor}`)
    localStorage.setItem("colorTheme", newColor)
  }

  // Handle light/dark change
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  // Apply high contrast mode
  const applyContrast = (mode: ContrastMode) => {
    const root = document.documentElement
    if (mode === "high") {
      root.setAttribute("data-contrast", "high")
    } else {
      root.setAttribute("data-contrast", "off")
    }
    localStorage.setItem("contrast", mode)
  }

  // Handle color theme change
  const handleColorThemeChange = (newColor: string) => {
    const color = newColor as ColorTheme
    setColorTheme(color)
    applyColorTheme(color)
  }

  // Handle contrast change
  const handleContrastChange = (newContrast: string) => {
    const mode = newContrast as ContrastMode
    setContrast(mode)
    applyContrast(mode)
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              isActive={false}
              className={cn(
                "group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-0",
                "data-[state=open]:!bg-transparent data-[state=open]:!text-sidebar-foreground data-[state=open]:ring-1 data-[state=open]:ring-sidebar-border",
                isCollapsed && "justify-center"
              )}
            >
              <Avatar className={`h-8 w-8 rounded-lg ${isCollapsed ? "mx-auto" : ""}`}>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">SJ</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </div>
                  <FontAwesomeIcon name="anglesUpDown" weight="regular" className="ml-auto size-4" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg z-[100]"
            side={isCollapsed ? "right" : "bottom"}
            align="start"
            sideOffset={isCollapsed ? 8 : 4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">SJ</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <FontAwesomeIcon name="starChristmas" className="h-4 w-4" />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <FontAwesomeIcon name="badgeCheck" className="h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FontAwesomeIcon name="creditCard" className="h-4 w-4" />
                Billing
              </DropdownMenuItem>

              {/* Light / Dark / System */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {theme === "light" && <FontAwesomeIcon name="sun" className="h-4 w-4" />}
                  {theme === "dark" && <FontAwesomeIcon name="moon" className="h-4 w-4" />}
                  {theme === "system" && <FontAwesomeIcon name="monitor" className="h-4 w-4" />}
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={theme} onValueChange={(value) => handleThemeChange(value as "light" | "dark" | "system")}>
                    <DropdownMenuRadioItem value="light">
                      <FontAwesomeIcon name="sun" className="h-4 w-4 mr-2" />
                      Light
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark">
                      <FontAwesomeIcon name="moon" className="h-4 w-4 mr-2" />
                      Dark
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system">
                      <FontAwesomeIcon name="monitor" className="h-4 w-4 mr-2" />
                      System
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Color Theme */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FontAwesomeIcon name="palette" className="h-4 w-4" />
                  Color
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={colorTheme} onValueChange={handleColorThemeChange}>
                    {COLOR_THEMES.map((ct) => (
                      <DropdownMenuRadioItem key={ct.value} value={ct.value}>
                        <span
                          className="inline-block h-3.5 w-3.5 rounded-full mr-2 border border-border"
                          style={{ backgroundColor: ct.swatch }}
                        />
                        {ct.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* High Contrast — accessibility for low vision */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FontAwesomeIcon name="circleHalfStroke" className="h-4 w-4" />
                  Contrast
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={contrast} onValueChange={handleContrastChange}>
                    <DropdownMenuRadioItem value="default">
                      <FontAwesomeIcon name="circle" className="h-4 w-4 mr-2" />
                      Default
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="high">
                      <FontAwesomeIcon name="circleHalfStroke" className="h-4 w-4 mr-2" />
                      High contrast
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Density — Comfortable / Compact (for Windows 125% / enterprise) */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FontAwesomeIcon name="compress" className="h-4 w-4" />
                  Density
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={density} onValueChange={(v) => setDensity(v as DensityMode)}>
                    <DropdownMenuRadioItem value="comfortable">
                      <FontAwesomeIcon name="square" className="h-4 w-4 mr-2" />
                      Comfortable
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="compact">
                      <FontAwesomeIcon name="compress" className="h-4 w-4 mr-2" />
                      Compact
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Jobs > Search bar */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FontAwesomeIcon name="briefcase" className="h-4 w-4" />
                  Jobs
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <FontAwesomeIcon name="magnifyingGlass" className="h-4 w-4" />
                      Search bar
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={jobSearchBarVariant} onValueChange={(v) => setJobSearchBarVariant(v as "default" | "animated")}>
                        <DropdownMenuRadioItem value="default">
                          <FontAwesomeIcon name="wrapText" className="h-4 w-4 mr-2" />
                          Static placeholder
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="animated">
                          <FontAwesomeIcon name="sparkles" className="h-4 w-4 mr-2" />
                          Animated suggestions
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <FontAwesomeIcon name="logOut" className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
