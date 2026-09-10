"use client";

/**
 * UtilityBarSlot — persistent shell row for global utility actions
 * (Search, Notifications, What's new, Help, Onboarding, Ask Leo, Profile, and
 * the product switcher on the compact full-width bar).
 *
 * Compact is the only shell. Responsive density (`useUtilityBarCompact`):
 *   Comfort (≥768px, not reflow-zoom): full action set on the bar.
 *   Dense (≤767px or reflow): Search / What's new / Help / Onboarding collapse
 *   into More; Notifications and Ask Leo stay pinned; school avatar stays on
 *   the bar (no program name); profile stays on the bar.
 *
 * Settings lives in the profile menu as "Workspace settings" (same URL the
 * former gear used). Onboarding is on the Comfort bar as an icon, and under
 * More on Dense. Program name stays out of the bar (tooltip / menu only).
 *
 * On the pages that belong to no product — the products home and the sign-in flow
 * builder — the bar drops to the brand mark plus the genuinely global actions,
 * because everything else here needs a product to act on.
 */

import * as React from "react";
import { Link, useLocation } from "react-router";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useModKeyLabel } from "@/hooks/use-mod-key-label";
import { useScrollStuck } from "@/hooks/use-scroll-stuck";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom";
import { AskLeoLauncher } from "@exxatdesignux/ui/components/shell/ask-leo-launcher";
import { usePageHeaderScrollActionsSlotRef } from "@exxatdesignux/ui/components/shell/page-header-scroll-actions";
import { requestOpenCommandMenu } from "@/components/command-menu";
import { useCompactHeaderSlotRef } from "@/components/compact-header-slot";
import { AskLeoShortcutKbds, useAskLeo } from "@/components/ask-leo-context";
import { ExxatProductMark } from "@/components/exxat-product-logo";
import { NotificationBell } from "@/components/notification-bell";
import { UtilityUserMenu } from "@/components/utility-user-menu";
import { UtilityBarProductSwitcher } from "@/components/utility-bar-product-switcher";
import { UtilityBarSchoolSwitcher } from "@/components/utility-bar-school-switcher";
import {
  UtilityBarWhatsNew,
  UtilityBarWhatsNewInMore,
} from "@/components/utility-bar-whats-new";
import { useUtilityBarPageChrome } from "@/components/utility-bar-page-chrome";
import {
  PageBreadcrumbTrail,
  PageRecordMenuSwitcher,
  type PageBreadcrumbMenuOption,
  type PageBreadcrumbTrailItem,
} from "@/components/page-breadcrumb-trail";
import { useShellLayout } from "@/contexts/shell-layout-context";
import {
  hasFlushSidebar,
  isCompactShell,
  isFullWidthUtilityBar,
} from "@/lib/shell-layout";
import { isProductsHomePath } from "@/lib/product-home";
import { isSignInFlowsPath } from "@/lib/sign-in-flows-shell";
import { cn } from "@/lib/utils";
import { utilityBarActionButtonClass } from "@/components/utility-bar-chrome";

export const OPEN_SUPPORT_CHAT_EVENT = "exxat:open-support-chat";

export function requestOpenSupportChat() {
  window.dispatchEvent(new CustomEvent(OPEN_SUPPORT_CHAT_EVENT));
}

const SUPPRESS_UTILITY_BAR_PATHS: ReadonlyArray<string> = [
  "/builder/onboarding",
];

/**
 * Which registry entry supplies the mark on pages with no product. The choice is
 * cosmetic — the round mark is brand-level and every product registers the same
 * corporate pink gradient for it — but naming the flagship keeps the mark off
 * whatever product the store happens to still be holding from the last session.
 */
const WORKSPACE_BRAND_MARK_PRODUCT = "exxat-prism" as const;

function useUtilityBarCompact() {
  const isMobile = useIsMobile();
  const reflowZoom = useSidebarReflowZoom();
  return isMobile || reflowZoom;
}

export function UtilityBarSlot() {
  const location = useLocation();
  const { variant } = useShellLayout();
  const fullWidth = isFullWidthUtilityBar(variant);
  const compact = useUtilityBarCompact();
  const pageChrome = useUtilityBarPageChrome();
  const backMode = pageChrome.mode === "back";
  const breadcrumbMode = pageChrome.mode === "breadcrumb";
  const detailChromeMode = backMode || breadcrumbMode;
  if (
    SUPPRESS_UTILITY_BAR_PATHS.some((path) =>
      location.pathname.startsWith(path),
    )
  )
    return null;

  // Two pages sit outside every product: the products home, and the sign-in flow
  // builder that decides which product you land in. On both, most of this bar has
  // nothing to act on — search scopes to a product, Ask Leo belongs
  // to one, the scope picker needs one, and the sidebar toggle would toggle a
  // sidebar that is not rendered — and a switcher trigger reading "Clinical
  // Education" would name a context the page is not in. On `/home` onboarding
  // stays off the bar; What's new stays on the bar via the megaphone. Notifications,
  // Help, and support chat stay global.
  const withoutProduct =
    isProductsHomePath(location.pathname) ||
    isSignInFlowsPath(location.pathname);
  const onProductsHome = isProductsHomePath(location.pathname);

  // Compact is this same bar with the page's breadcrumb dropped into the middle
  // of it, which is what lets `SiteHeader` stop drawing a second row. Not on the
  // product-less pages: those have no breadcrumb to show and no sidebar to
  // anchor it to. Back / breadcrumb mode owns the leading cluster instead of
  // the middle slot.
  const showBreadcrumb =
    isCompactShell(variant) && !withoutProduct && !detailChromeMode;

  const askLeoControl = <AskLeoUtilityControl showLabel={!compact} />;

  // No overflow-x-hidden on the bar: that forces overflow-y to auto and clips
  // breadcrumb descenders inside the 42px row. Truncation lives on flex children.
  const barHeightClass =
    "relative flex h-(--shell-utility-bar-height) min-h-(--shell-utility-bar-height) min-w-0 shrink-0 items-center gap-1";

  if (backMode) {
    return (
      <nav
        aria-label="Page back"
        data-slot="utility-bar"
        data-utility-bar-chrome="back"
        data-utility-bar-density={compact ? "dense" : "comfort"}
        className={cn(
          barHeightClass,
          fullWidth
            ? "z-50 w-full bg-sidebar pe-2"
            : "z-40 mx-2 mb-1.5 py-1 md:mb-2",
        )}
      >
        <UtilityBarBackLeadingCluster
          href={pageChrome.href}
          label={pageChrome.label}
          scrollTitle={pageChrome.scrollTitle}
          scrollTitleMenu={pageChrome.scrollTitleMenu}
          scrollTitleMenuAriaLabel={pageChrome.scrollTitleMenuAriaLabel}
        />
        <UtilityBarDetailTrailingCluster askLeoControl={askLeoControl} />
      </nav>
    );
  }

  if (breadcrumbMode) {
    return (
      <nav
        aria-label="Page breadcrumb"
        data-slot="utility-bar"
        data-utility-bar-chrome="breadcrumb"
        data-utility-bar-density={compact ? "dense" : "comfort"}
        className={cn(
          barHeightClass,
          fullWidth
            ? "z-50 w-full bg-sidebar pe-2"
            : "z-40 mx-2 mb-1.5 py-1 md:mb-2",
        )}
      >
        <UtilityBarBreadcrumbLeadingCluster
          items={pageChrome.items}
          currentPage={pageChrome.currentPage}
          currentPageMenu={pageChrome.currentPageMenu}
          currentPageMenuAriaLabel={pageChrome.currentPageMenuAriaLabel}
        />
        <UtilityBarDetailTrailingCluster askLeoControl={askLeoControl} />
      </nav>
    );
  }

  return (
    <nav
      aria-label="Global utilities"
      data-slot="utility-bar"
      data-utility-bar-density={compact ? "dense" : "comfort"}
      className={cn(
        // Actions stay shrink-0; breadcrumb + product yield width first.
        barHeightClass,
        fullWidth
          ? /* z-50: above [data-app-shell-row] (z-40) so a mis-offset fixed
             sidebar cannot paint over breadcrumbs / product chrome. Ask Leo
             floating windows sit at z-[55] so they can overlap this bar. */
            cn("z-50 w-full bg-sidebar", compact ? "pe-2" : "pe-2 sm:pe-3")
          : "z-40 mx-2 mb-1.5 py-1 md:mb-2",
      )}
    >
      {fullWidth && !withoutProduct ? (
        <UtilityBarLeadingCluster
          compactDensity={compact}
          markOnly={compact}
          showBreadcrumbDivider={showBreadcrumb}
        />
      ) : null}
      {withoutProduct ? <WorkspaceBrandMark /> : null}

      {showBreadcrumb ? <UtilityBarBreadcrumbSlot dense={compact} /> : null}

      {/* Always pin actions + identity to the trailing edge. Dense used to cap
          the breadcrumb and omit ms-auto, which parked free space after profile
          (especially at 200% reflow zoom). */}
      <div className="relative z-[1] ms-auto flex min-w-0 shrink-0 items-center gap-1">
        <div className="flex shrink-0 items-center gap-1">
          {withoutProduct ? (
            <>
              <NotificationBell className={utilityBarActionButtonClass} />
              <UtilityBarWhatsNew className={utilityBarActionButtonClass} />
              {onProductsHome ? null : <OnboardingTrigger />}
              <HelpTrigger />
              <SupportChatTrigger />
            </>
          ) : compact ? (
            <>
              <NotificationBell className={utilityBarActionButtonClass} />
              <UtilityBarWhatsNewInMore>
                {({ menuItem, unseenCount }) => (
                  <UtilityBarMoreMenu
                    whatsNewItem={menuItem}
                    whatsNewUnseen={unseenCount}
                  />
                )}
              </UtilityBarWhatsNewInMore>
              {askLeoControl}
            </>
          ) : (
            <>
              <SearchTrigger />
              <NotificationBell className={utilityBarActionButtonClass} />
              <UtilityBarWhatsNew className={utilityBarActionButtonClass} />
              <HelpTrigger />
              <SupportChatTrigger />
              <OnboardingTrigger />
              {askLeoControl}
            </>
          )}
        </div>

        <div className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
        <div className="flex min-w-0 shrink-0 items-center gap-1">
          {fullWidth && !withoutProduct ? (
            <UtilityBarSchoolSwitcher
              compact={compact || isCompactShell(variant)}
              showProgram={false}
            />
          ) : null}
          <UtilityUserMenu />
        </div>
      </div>
    </nav>
  );
}

/**
 * Where the page's breadcrumb lands in the compact shell.
 *
 * Sits between the product switcher and the action cluster, so the row reads
 * product, then location, then what you can do. `SiteHeader` portals into it
 * (`components/compact-header-slot.tsx`) and skips drawing its own row, which
 * is the whole density argument for this variant.
 *
 * Never hidden at narrow widths, even though the row is tight there. Mounting
 * the slot is what tells `SiteHeader` to stand down, so a `hidden` slot would
 * swallow the breadcrumb rather than defer it. Dense caps width and the trail
 * renders current page only; Comfort truncates the house + More + leaf pattern.
 */
function UtilityBarBreadcrumbSlot({ dense = false }: { dense?: boolean }) {
  const registerHeaderSlot = useCompactHeaderSlotRef();

  // Crumb rule lives in UtilityBarLeadingCluster (equal pad around the product).
  // This slot is only the portal target for SiteHeader.
  return (
    <div
      ref={registerHeaderSlot}
      data-compact-header-slot=""
      data-utility-bar-breadcrumb-dense={dense ? "true" : undefined}
      className="flex h-full min-h-0 min-w-0 flex-1 items-center overflow-hidden"
    />
  );
}

/**
 * Exxat mark on the pages that belong to no product.
 *
 * The leading cluster is suppressed there (no sidebar to toggle, no product to
 * name), which left the row with no brand on it at all. The mark is the one
 * piece of that cluster that still holds on a page about every product: it is
 * drawn from the brand registry, and every registered brand paints it in the
 * same corporate pink, so it says "Exxat" rather than naming a product the
 * user has not picked yet.
 *
 * Sits at the start of the row, where the product mark sits inside a product,
 * so the brand stays in one place as you move between these pages and a product.
 * Decorative, and deliberately not a link — on the products home the page it
 * would navigate to is the page it is on.
 */
export function WorkspaceBrandMark() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center ms-2 sm:ms-3">
      <ExxatProductMark
        product={WORKSPACE_BRAND_MARK_PRODUCT}
        className="size-6"
      />
    </span>
  );
}

/**
 * Expand / collapse + product — toggle centered on the inset icon rail.
 *
 * Only mounted where a product is in context: the pages without one suppress the
 * whole cluster above, so there is no second place deciding whether the switcher
 * may name a product.
 */
export function UtilityBarLeadingCluster({
  compactDensity = false,
  markOnly = false,
  showBreadcrumbDivider = false,
}: {
  /** Mobile / high-zoom — denser product trigger so the action icons keep room. */
  compactDensity?: boolean;
  /** Dense bar: product mark only (wordmark lives in the tip + menu). */
  markOnly?: boolean;
  /** When true, draw the short crumb rule after the product with matching pad. */
  showBreadcrumbDivider?: boolean;
}) {
  const { isNavFlyout } = useSidebar();
  const { variant } = useShellLayout();
  const flush = hasFlushSidebar(variant);

  return (
    <div
      className={cn(
        // Must shrink before the action icons; shrink-0 was letting the wordmark
        // hold 16rem while notifications painted over it.
        // self-stretch: full bar height so the toggle|product rule can run edge to edge.
        "flex min-w-0 shrink items-center self-stretch",
        markOnly ? "max-w-[min(100%,11rem)]" : "max-w-[min(100%,40%)]",
        flush ? "gap-0" : "gap-0.5",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center self-stretch",
          // Match the rail's own width so the toggle shares a center line with
          // the dashboard / primary icons below it. The inset rail adds a
          // `spacing(4)` outer gap on top of `--sidebar-width-icon`; the flush
          // rail is exactly `--sidebar-width-icon` wide, so borrowing the inset
          // number there pushes the toggle 8px off its column.
          //
          // The width MUST NOT depend on expanded/collapsed state: the icon
          // column keeps the same center line in both, and a state-dependent
          // slot would slide the product switcher sideways on every toggle.
          // Flyout mode has no rail in layout, so it falls back to plain
          // leading padding.
          isNavFlyout
            ? cn(
                "justify-start",
                compactDensity || markOnly ? "ps-1.5" : "ps-2 sm:ps-3",
              )
            : flush
              ? "w-(--sidebar-width-icon) justify-center"
              : "w-[calc(var(--sidebar-width-icon)+(--spacing(4)))] justify-center",
        )}
      >
        <UtilityBarSidebarToggle />
      </div>
      <Separator
        orientation="vertical"
        className="data-[orientation=vertical]:h-auto data-[orientation=vertical]:min-h-full data-[orientation=vertical]:self-stretch data-[orientation=vertical]:w-px"
      />
      {/* Equal inset from rail rule → product → crumb rule (fixes flush-left /
          over-padded-right). Focus ring clears both separators. */}
      <div
        className={cn(
          "flex min-w-0 items-center",
          showBreadcrumbDivider ? "px-1.5" : "ps-1.5 pe-1",
        )}
      >
        <UtilityBarProductSwitcher
          compact={flush || compactDensity}
          markOnly={markOnly}
        />
      </div>
      {showBreadcrumbDivider ? (
        <Separator
          orientation="vertical"
          className="h-4 shrink-0 self-center data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
        />
      ) : null}
    </div>
  );
}

/**
 * Back mode leading cluster — same geometry as {@link UtilityBarLeadingCluster}:
 * icon slot (toggle width) · full-height rule · label (product slot).
 *
 * Record detail / focus hide the rail, but the back control still sits on the
 * icon-column center line so the chrome does not jump when entering the page.
 */
export function UtilityBarBackLeadingCluster({
  href,
  label,
  scrollTitle,
  scrollTitleMenu,
  scrollTitleMenuAriaLabel,
}: {
  href: string;
  label: string;
  scrollTitle?: string;
  scrollTitleMenu?: React.ComponentProps<typeof PageRecordMenuSwitcher>["menu"];
  scrollTitleMenuAriaLabel?: string;
}) {
  const { isNavFlyout } = useSidebar();
  const { variant } = useShellLayout();
  const flush = hasFlushSidebar(variant);
  const isStuck = useScrollStuck();
  const showPageTitle = Boolean(scrollTitle) && isStuck;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center self-stretch",
        flush ? "gap-0" : "gap-0.5",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center self-stretch",
          isNavFlyout
            ? "justify-start ps-2 sm:ps-3"
            : flush
              ? "w-(--sidebar-width-icon) justify-center"
              : "w-[calc(var(--sidebar-width-icon)+(--spacing(4)))] justify-center",
        )}
      >
        <Button
          asChild
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(
            "shrink-0 text-sidebar-foreground",
            utilityBarActionButtonClass,
          )}
        >
          <Link to={href} aria-label={`Back to ${label}`}>
            <i className="fa-light fa-arrow-left text-sm" aria-hidden="true" />
          </Link>
        </Button>
      </div>
      {showPageTitle ? (
        <>
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-auto data-[orientation=vertical]:min-h-full data-[orientation=vertical]:self-stretch data-[orientation=vertical]:w-px"
          />
          <div className="ms-1.5 flex min-w-0 flex-1 items-center pe-1.5">
            {scrollTitleMenu?.length ? (
              <PageRecordMenuSwitcher
                label={scrollTitle!}
                menu={scrollTitleMenu}
                menuAriaLabel={scrollTitleMenuAriaLabel}
              />
            ) : (
              <span className="inline-flex min-w-0 max-w-full truncate font-sans text-sm font-medium text-foreground">
                {scrollTitle}
              </span>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * Back / breadcrumb mode trailing cluster — portaled PageHeader actions when
 * scrolled, then Ask Leo pinned as the rightmost control.
 */
function UtilityBarDetailTrailingCluster({
  askLeoControl,
}: {
  askLeoControl: React.ReactNode;
}) {
  const registerScrollActionsSlot = usePageHeaderScrollActionsSlotRef();

  return (
    <div className="ms-auto flex shrink-0 items-center gap-1 pe-0.5">
      <div
        ref={registerScrollActionsSlot}
        data-utility-bar-page-actions=""
        className="flex shrink-0 items-center gap-1 empty:hidden"
      />
      {askLeoControl}
    </div>
  );
}

/**
 * Breadcrumb mode leading cluster — ancestor trail on detail / focus chrome.
 * No icon-column spacer: the rail is hidden on these routes, so the trail
 * starts at the page inset (same leading pad as flyout Back mode).
 */
export function UtilityBarBreadcrumbLeadingCluster({
  items,
  currentPage,
  currentPageMenu,
  currentPageMenuAriaLabel,
}: {
  items?: PageBreadcrumbTrailItem[];
  currentPage?: string;
  currentPageMenu?: PageBreadcrumbMenuOption[];
  currentPageMenuAriaLabel?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center self-stretch ps-2 sm:ps-3 pe-1.5">
      <PageBreadcrumbTrail
        variant="header"
        items={items}
        currentPage={currentPage}
        currentPageMenu={currentPageMenu}
        currentPageMenuAriaLabel={currentPageMenuAriaLabel}
        className="min-w-0 flex-1"
      />
    </div>
  );
}

/** Expand / collapse primary sidebar — leading control before the product mark. */
function UtilityBarSidebarToggle() {
  const { state, isMobile } = useSidebar();
  const mod = useModKeyLabel();
  const collapsed = state === "collapsed" && !isMobile;
  const label = collapsed ? "Expand sidebar" : "Collapse sidebar";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarTrigger
          aria-label={label}
          className={cn(
            "size-8 shrink-0 text-sidebar-foreground",
            utilityBarActionButtonClass,
          )}
        />
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="flex flex-wrap items-center gap-1.5"
      >
        <span>{label}</span>
        <KbdGroup>
          <Kbd>{mod}</Kbd>
          <Kbd>B</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  );
}

export function UtilityBarMoreMenu({
  whatsNewItem = null,
  whatsNewUnseen = 0,
}: {
  /** What's new row from `UtilityBarWhatsNewInMore`; null when nothing shipped. */
  whatsNewItem?: React.ReactNode;
  whatsNewUnseen?: number;
} = {}) {
  const mod = useModKeyLabel();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={
                whatsNewUnseen > 0
                  ? `More utilities, ${whatsNewUnseen} unread in What's new`
                  : "More utilities"
              }
              className={cn(utilityBarActionButtonClass, "relative")}
            >
              <i className="fa-light fa-ellipsis text-sm" aria-hidden="true" />
              {whatsNewUnseen > 0 ? (
                <Badge
                  variant="count"
                  className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-2xs"
                >
                  {whatsNewUnseen}
                </Badge>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">More</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-52"
      >
        <DropdownMenuItem
          onClick={() => requestOpenCommandMenu()}
          className="gap-2"
        >
          <i
            className="fa-light fa-magnifying-glass w-4 text-center text-sm"
            aria-hidden="true"
          />
          <span className="flex-1">Search</span>
          <KbdGroup className="ms-auto">
            <Kbd>{mod}</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </DropdownMenuItem>
        {whatsNewItem}
        <DropdownMenuItem asChild className="gap-2">
          <Link to="/help">
            <i
              className="fa-light fa-circle-question w-4 text-center text-sm"
              aria-hidden="true"
            />
            Get Help
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={requestOpenSupportChat} className="gap-2">
          <i
            className="fa-light fa-message w-4 text-center text-sm"
            aria-hidden="true"
          />
          Chat with support
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2">
          <Link to="/builder/onboarding">
            <i
              className="fa-light fa-flag-pennant w-4 text-center text-sm"
              aria-hidden="true"
            />
            Onboarding
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SearchTrigger() {
  const mod = useModKeyLabel();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Search"
          className={utilityBarActionButtonClass}
          onClick={() => requestOpenCommandMenu()}
        >
          <i
            className="fa-light fa-magnifying-glass text-sm"
            aria-hidden="true"
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-1.5">
        <span>Search</span>
        <KbdGroup>
          <Kbd>{mod}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  );
}

/** Opens the workspace onboarding page — icon-only with Tip. */
export function OnboardingTrigger() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Onboarding"
          className={utilityBarActionButtonClass}
          asChild
        >
          <Link to="/builder/onboarding">
            <i
              className="fa-light fa-flag-pennant text-sm"
              aria-hidden="true"
            />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Onboarding</TooltipContent>
    </Tooltip>
  );
}

/**
 * Ask Leo control — labeled on Comfort; icon-only on Dense so the bar does not
 * crush.
 *
 * The chip, its arrival, and its wash are the package's (`AskLeoLauncher`); this
 * supplies the three things the package cannot know: whether Leo is open, whether
 * it is answering, and what this app's chord is.
 */
export function AskLeoUtilityControl({ showLabel }: { showLabel: boolean }) {
  const { open, busy, toggle } = useAskLeo();

  return (
    <AskLeoLauncher
      open={open}
      busy={busy}
      onToggle={toggle}
      showLabel={showLabel}
      shortcut={<AskLeoShortcutKbds />}
    />
  );
}

export function HelpTrigger() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Get Help"
          className={utilityBarActionButtonClass}
          asChild
        >
          <Link to="/help">
            <i
              className="fa-light fa-circle-question text-sm"
              aria-hidden="true"
            />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Get Help</TooltipContent>
    </Tooltip>
  );
}

export function SupportChatTrigger() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Chat with support"
          className={utilityBarActionButtonClass}
          onClick={requestOpenSupportChat}
        >
          <i className="fa-light fa-message text-sm" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Chat with support</TooltipContent>
    </Tooltip>
  );
}
