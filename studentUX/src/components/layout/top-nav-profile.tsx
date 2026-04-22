"use client";

import * as React from "react";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { useAppStore } from "@/stores/app-store";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../ui/avatar";
import { Button } from "../ui/button";
import { ProfileSettingsModal } from "../features/profile-settings-modal";
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
  DropdownMenuCheckboxItem,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type ColorTheme = "rose" | "lavender" | "sage";
type DensityMode = "comfortable" | "compact";
type ContrastMode = "default" | "high";

const COLOR_THEMES: { value: ColorTheme; label: string; swatch: string }[] = [
  { value: "rose", label: "Exxat Prism", swatch: "oklch(0.57 0.24 342)" },
  { value: "lavender", label: "Exxat One", swatch: "oklch(0.97 0.02 270)" },
  { value: "sage", label: "Sage", swatch: "oklch(0.55 0.15 155)" },
];

export function TopNavProfile({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const [theme, setTheme] = React.useState<"light" | "dark" | "system">("light");
  const [colorTheme, setColorTheme] = React.useState<ColorTheme>("lavender");
  const [contrast, setContrast] = React.useState<ContrastMode>("default");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const profileSettingsOpen = useAppStore((s) => s.profileSettingsOpen);
  const setProfileSettingsOpen = useAppStore((s) => s.setProfileSettingsOpen);
  const density = useAppStore((s) => s.density);
  const setDensity = useAppStore((s) => s.setDensity);
  const productSwitcherApproach = useAppStore((s) => s.productSwitcherApproach);
  const setProductSwitcherApproach = useAppStore((s) => s.setProductSwitcherApproach);
  const setShowProductSwitcherCoachMark = useAppStore((s) => s.setShowProductSwitcherCoachMark);
  const homeCardIllustrationSet = useAppStore((s) => s.homeCardIllustrationSet);
  const setHomeCardIllustrationSet = useAppStore((s) => s.setHomeCardIllustrationSet);
  const myJobsEmptyState = useAppStore((s) => s.myJobsEmptyState);
  const setMyJobsEmptyState = useAppStore((s) => s.setMyJobsEmptyState);
  const internshipEmptyState = useAppStore((s) => s.internshipEmptyState);
  const setInternshipEmptyState = useAppStore((s) => s.setInternshipEmptyState);
  const wishlistEmptyState = useAppStore((s) => s.wishlistEmptyState);
  const setWishlistEmptyState = useAppStore((s) => s.setWishlistEmptyState);
  const scheduleBannerType = useAppStore((s) => s.scheduleBannerType);
  const setScheduleBannerType = useAppStore((s) => s.setScheduleBannerType);
  const scheduleEmptyState = useAppStore((s) => s.scheduleEmptyState);
  const setScheduleEmptyState = useAppStore((s) => s.setScheduleEmptyState);
  const hiddenHomeSections = useAppStore((s) => s.hiddenHomeSections);
  const toggleHiddenHomeSection = useAppStore((s) => s.toggleHiddenHomeSection);
  const setHasSeenWelcome = useAppStore((s) => s.setHasSeenWelcome);
  const navigateToPage = useAppStore((s) => s.navigateToPage);
  const hideTopTabBarAndInternshipMenu = useAppStore((s) => s.hideTopTabBarAndInternshipMenu);
  const setHideTopTabBarAndInternshipMenu = useAppStore((s) => s.setHideTopTabBarAndInternshipMenu);
  const jobSearchBarVariant = useAppStore((s) => s.jobSearchBarVariant);
  const setJobSearchBarVariant = useAppStore((s) => s.setJobSearchBarVariant);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    const savedColor = localStorage.getItem("colorTheme") as ColorTheme | null;
    const savedDensity = localStorage.getItem("density") as DensityMode | null;
    const savedContrast = localStorage.getItem("contrast") as ContrastMode | null;
    const initialTheme = savedTheme || "light";
    const initialColor = savedColor || "lavender";
    const initialContrast = savedContrast || "default";

    setTheme(initialTheme);
    setColorTheme(initialColor);
    setContrast(initialContrast);
    applyTheme(initialTheme);
    applyColorTheme(initialColor);
    applyContrast(initialContrast);
    if (savedDensity === "compact") setDensity("compact");
  }, [setDensity]);

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    const root = document.documentElement;
    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.toggle("dark", systemTheme === "dark");
    } else {
      root.classList.toggle("dark", newTheme === "dark");
    }
    localStorage.setItem("theme", newTheme);
  };

  const applyColorTheme = (newColor: ColorTheme) => {
    const root = document.documentElement;
    root.classList.remove("theme-lavender", "theme-sage", "theme-rose");
    root.classList.add(`theme-${newColor}`);
    localStorage.setItem("colorTheme", newColor);
  };

  const applyContrast = (mode: ContrastMode) => {
    const root = document.documentElement;
    root.setAttribute("data-contrast", mode === "high" ? "high" : "off");
    localStorage.setItem("contrast", mode);
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleColorThemeChange = (newColor: string) => {
    const color = newColor as ColorTheme;
    setColorTheme(color);
    applyColorTheme(color);
  };

  const handleContrastChange = (newContrast: string) => {
    const mode = newContrast as ContrastMode;
    setContrast(mode);
    applyContrast(mode);
  };

  return (
    <>
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11 md:h-9 md:w-9 md:min-h-0 md:min-w-0 rounded-full p-0 shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Profile menu"
            >
              <Avatar className="h-8 w-8 rounded-full">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>AM</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Profile menu</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        className="min-w-56 rounded-lg z-[100]"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(false);
              setProfileSettingsOpen(true);
            }}
            className="flex w-full items-center gap-2 px-2 py-2 text-left text-sm rounded-md hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Open profile settings"
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>AM</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
            Product related
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              setDropdownOpen(false);
              setProfileSettingsOpen(true);
            }}
          >
            <FontAwesomeIcon name="user" className="h-4 w-4" />
            My Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FontAwesomeIcon name="fileText" className="h-4 w-4" />
            My Files
          </DropdownMenuItem>
          <DropdownMenuItem>
            <FontAwesomeIcon name="gear" className="h-4 w-4" />
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            className="bg-primary/10 focus:bg-primary/15"
            onClick={() => {
              window.location.href = "https://exxat.com/products/exxat-prism";
            }}
          >
            <FontAwesomeIcon name="grid2" className="h-4 w-4" weight="solid" />
            <span className="flex-1">
              Go to <span className="font-bold">Exxat</span>{" "}
              <span className="font-bold text-primary">Prism</span>
            </span>
            <FontAwesomeIcon name="arrowUpRight" className="h-3.5 w-3.5 ml-1" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
            Dev related
          </DropdownMenuLabel>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FontAwesomeIcon name="sliders" className="h-4 w-4" />
              Layout
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent sideOffset={4} className="min-w-[12rem]">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FontAwesomeIcon name="palette" className="h-4 w-4" />
                  Appearance
                </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                Theme
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup value={theme} onValueChange={(v) => handleThemeChange(v as "light" | "dark" | "system")}>
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
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                Color
              </DropdownMenuLabel>
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
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                Contrast
              </DropdownMenuLabel>
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
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FontAwesomeIcon name="layer-group" className="h-4 w-4" />
                  Product switcher placement
                </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={productSwitcherApproach}
                onValueChange={(v) =>
                  setProductSwitcherApproach(v as "icon-next-to-help" | "logo-area" | "logo-chevron" | "banner-ver" | "banner-top" | "header-and-banner" | "header-and-banner-inline" | "greeting-popover")
                }
              >
                <DropdownMenuRadioItem value="icon-next-to-help">
                  <FontAwesomeIcon name="circleQuestion" className="h-4 w-4 mr-2" />
                  Icon next to Help
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="logo-area">
                  <FontAwesomeIcon name="grid3x3" className="h-4 w-4 mr-2" />
                  Grid before logo
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="logo-chevron">
                  <FontAwesomeIcon name="chevronDown" className="h-4 w-4 mr-2" />
                  Chevron on logo
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="banner-ver">
                  <FontAwesomeIcon name="images" className="h-4 w-4 mr-2" />
                  Banner ver.
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="header-and-banner">
                  <FontAwesomeIcon name="bookmark" className="h-4 w-4 mr-2" />
                  Header + Banner
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="header-and-banner-inline">
                  <FontAwesomeIcon name="alignLeft" className="h-4 w-4 mr-2" />
                  Header + Banner (inline)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="banner-top">
                  <FontAwesomeIcon name="gripHorizontal" className="h-4 w-4 mr-2" />
                  Banner (top bar)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="greeting-popover">
                  <FontAwesomeIcon name="circleNodes" className="h-4 w-4 mr-2" />
                  Logo chevron + inline banner + coach mark
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              {(productSwitcherApproach === "header-and-banner" ||
                productSwitcherApproach === "header-and-banner-inline" ||
                productSwitcherApproach === "banner-top" ||
                productSwitcherApproach === "greeting-popover") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setShowProductSwitcherCoachMark(true);
                      setDropdownOpen(false);
                    }}
                  >
                    <FontAwesomeIcon name="circleInfo" className="h-4 w-4 mr-2" />
                    Show coach mark
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FontAwesomeIcon name="house" className="h-4 w-4" />
              Home
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent sideOffset={4} className="min-w-[12rem]">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FontAwesomeIcon name="images" className="h-4 w-4" />
                  Home card illustrations
                </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={homeCardIllustrationSet}
                onValueChange={(v) => setHomeCardIllustrationSet(v as "default" | "webp" | "1st-time" | "hero")}
              >
                <DropdownMenuRadioItem value="default">
                  Default (SVG)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="webp">
                  New (WebP)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="1st-time">
                  1st Time (SVG)
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="hero">
                  Hero (count left, illustration right)
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FontAwesomeIcon name="eyeOff" className="h-4 w-4" />
                  Hide sections from home
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent sideOffset={4} className="min-w-[14rem]">
                  <DropdownMenuCheckboxItem
                    checked={hiddenHomeSections.includes("cards")}
                    onCheckedChange={() => toggleHiddenHomeSection("cards")}
                  >
                    Profile & status cards
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={hiddenHomeSections.includes("todo")}
                    onCheckedChange={() => toggleHiddenHomeSection("todo")}
                  >
                    Todo / tasks
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={hiddenHomeSections.includes("quick-access")}
                    onCheckedChange={() => toggleHiddenHomeSection("quick-access")}
                  >
                    Quick Access
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={hiddenHomeSections.includes("career-opportunities")}
                    onCheckedChange={() => toggleHiddenHomeSection("career-opportunities")}
                  >
                    Career Opportunities
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={hiddenHomeSections.includes("exxat-prism-banner")}
                    onCheckedChange={() => toggleHiddenHomeSection("exxat-prism-banner")}
                  >
                    Exxat Prism banner
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={hiddenHomeSections.includes("career")}
                    onCheckedChange={() => toggleHiddenHomeSection("career")}
                  >
                    Career section
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={hiddenHomeSections.includes("career-journey")}
                    onCheckedChange={() => toggleHiddenHomeSection("career-journey")}
                  >
                    Career journey
                  </DropdownMenuCheckboxItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FontAwesomeIcon name="calendar" className="h-4 w-4" />
              Schedules
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent sideOffset={4} className="min-w-[12rem]">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FontAwesomeIcon name="bell" className="h-4 w-4" />
                  Schedule banner
                </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={scheduleBannerType}
                onValueChange={(v) => setScheduleBannerType(v as "off" | "compliance-nearing" | "payment-nearing" | "overdue")}
              >
                <DropdownMenuRadioItem value="off">
                  Off
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="compliance-nearing">
                  Compliance due soon
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="payment-nearing">
                  Payment due soon
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="overdue">
                  Overdue (payment or compliance)
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FontAwesomeIcon name="calendar" className="h-4 w-4" />
                  Schedules empty state
                </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={scheduleEmptyState}
                onValueChange={(v) => setScheduleEmptyState(v as "off" | "empty" | "school-not-on-platform")}
              >
                <DropdownMenuRadioItem value="off">
                  Off
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="empty">
                  No schedules yet
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="school-not-on-platform">
                  School not on platform
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FontAwesomeIcon name="bookOpen" className="h-4 w-4" />
                  Internship empty state
                </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={internshipEmptyState}
                onValueChange={(v) => setInternshipEmptyState(v as "placement-not-enabled" | "school-not-on-platform" | "off")}
              >
                <DropdownMenuRadioItem value="placement-not-enabled">
                  Placement not enabled
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="school-not-on-platform">
                  School not on platform
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="off">
                  Off
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuCheckboxItem
                checked={hideTopTabBarAndInternshipMenu}
                onCheckedChange={(checked) => setHideTopTabBarAndInternshipMenu(checked === true)}
              >
                <FontAwesomeIcon name="barsStaggered" className="h-4 w-4" />
                Simplified intern layout
              </DropdownMenuCheckboxItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FontAwesomeIcon name="briefcase" className="h-4 w-4" />
              Jobs
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent sideOffset={4} className="min-w-[12rem]">
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
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FontAwesomeIcon name="briefcase" className="h-4 w-4" />
                  My Jobs empty state
                </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={myJobsEmptyState}
                onValueChange={(v) => setMyJobsEmptyState(v as "off" | "page" | "section")}
              >
                <DropdownMenuRadioItem value="off">
                  Off
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="page">
                  Page level empty
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="section">
                  Section empty
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FontAwesomeIcon name="heart" className="h-4 w-4" />
              Wishlist
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent sideOffset={4} className="min-w-[12rem]">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FontAwesomeIcon name="heart" className="h-4 w-4" />
                  Wishlist empty state
                </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup
                value={wishlistEmptyState}
                onValueChange={(v) => setWishlistEmptyState(v as "off" | "no-wishlist" | "all-closed")}
              >
                <DropdownMenuRadioItem value="off">
                  Off
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="no-wishlist">
                  No wishlist
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="all-closed">
                  No open wishlist
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <FontAwesomeIcon name="sparkles" className="h-4 w-4" />
              Welcome
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent sideOffset={4} className="min-w-[12rem]">
              <DropdownMenuItem
                onClick={() => {
                  setDropdownOpen(false);
                  setHasSeenWelcome(false);
                  navigateToPage("Home");
                }}
              >
                <FontAwesomeIcon name="rotateCcw" className="h-4 w-4" />
                Reset Welcome page
              </DropdownMenuItem>
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
    <ProfileSettingsModal
      open={profileSettingsOpen}
      onOpenChange={setProfileSettingsOpen}
      user={user}
    />
    </>
  );
}
