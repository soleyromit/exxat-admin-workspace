"use client"

import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { HorizontalScrollRegion } from "@/components/ui/horizontal-scroll-region"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FILTER_LIST_SEARCH_THRESHOLD } from "@exxatdesignux/ui/lib/filter-list-search-threshold"

export interface PageBreadcrumbMenuOption {
  id: string
  label: string
  href?: string
  onSelect?: () => void
  selected?: boolean
}

export interface PageBreadcrumbTrailItem {
  label: string
  href?: string
  /** Peer options — renders a switcher instead of a static link or label. */
  menu?: PageBreadcrumbMenuOption[]
  menuAriaLabel?: string
}

export interface PageBreadcrumbBackProps {
  /** Destination label (e.g. "Question hub") — shown after the back icon. */
  label: string
  href: string
  className?: string
}

export interface PageBreadcrumbTrailProps {
  /** Linkable ancestors (e.g. Question hub). */
  items?: PageBreadcrumbTrailItem[]
  /**
   * Final segment in the trail. Omit when the current page is the `PageHeader`
   * `<h1>` — use ancestors-only above the title (no duplicate label).
   */
  currentPage?: string
  /** Switch among peer records on the current page segment (detail routes). */
  currentPageMenu?: PageBreadcrumbMenuOption[]
  currentPageMenuAriaLabel?: string
  /**
   * `header` — SiteHeader: ancestors + `currentPage` on one line.
   * `content` — ancestors only, above `PageHeader` title.
   */
  variant?: "header" | "content"
  className?: string
}

function BreadcrumbMenuOptionMarker({ selected }: { selected?: boolean }) {
  return selected ? (
    <i className="fa-solid fa-check size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
  ) : (
    <span className="size-4 shrink-0" aria-hidden="true" />
  )
}

function RecordMenuTriggerButton({
  label,
  menuAriaLabel,
  isCurrentPage,
  variant = "breadcrumb",
  ...props
}: React.ComponentProps<"button"> & {
  label: string
  menuAriaLabel?: string
  isCurrentPage?: boolean
  variant?: "breadcrumb" | "title"
}) {
  return (
    <button
      type="button"
      aria-current={isCurrentPage ? "page" : undefined}
      aria-label={menuAriaLabel ?? `Switch ${label}`}
      aria-haspopup="menu"
      className={cn(
        variant === "title"
          ? "inline-flex max-w-full min-w-0 items-center gap-2.5 rounded-md py-0.5 text-left font-inherit text-inherit outline-none hover:text-interactive-hover-foreground focus-visible:ring-2 focus-visible:ring-ring"
          : cn(
              "inline-flex max-w-[min(100%,16rem)] min-h-8 items-center gap-1 rounded-md px-0.5 font-sans text-sm leading-none outline-none",
              "hover:text-interactive-hover-foreground focus-visible:ring-2 focus-visible:ring-ring",
              isCurrentPage ? "font-medium text-foreground" : "text-muted-foreground",
            ),
      )}
      {...props}
    >
      <span className={variant === "title" ? "min-w-0 text-left" : "truncate"}>{label}</span>
      <i
        className={cn(
          "fa-light fa-chevron-down shrink-0 opacity-70",
          variant === "title" ? "ms-0.5 text-sm" : "text-xs",
        )}
        aria-hidden="true"
      />
    </button>
  )
}

/** @deprecated internal alias */
function BreadcrumbMenuTriggerButton(props: React.ComponentProps<typeof RecordMenuTriggerButton>) {
  return <RecordMenuTriggerButton {...props} />
}

function RecordMenuSegment({
  label,
  menu,
  menuAriaLabel,
  isCurrentPage = false,
  variant = "breadcrumb",
}: {
  label: string
  menu: PageBreadcrumbMenuOption[]
  menuAriaLabel?: string
  isCurrentPage?: boolean
  variant?: "breadcrumb" | "title"
}) {
  const navigate = useNavigate()
  const searchable = menu.length > FILTER_LIST_SEARCH_THRESHOLD
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  React.useEffect(() => {
    if (!open) setSearch("")
  }, [open])

  const filteredMenu = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return menu
    return menu.filter(option => option.label.toLowerCase().includes(query))
  }, [menu, search])

  const selectOption = React.useCallback(
    (option: PageBreadcrumbMenuOption) => {
      if (option.href) navigate(option.href)
      else option.onSelect?.()
      setOpen(false)
    },
    [navigate],
  )

  if (searchable) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <RecordMenuTriggerButton
            label={label}
            menuAriaLabel={menuAriaLabel}
            isCurrentPage={isCurrentPage}
            variant={variant}
          />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-0">
          <div className="border-b border-border px-2 py-1.5">
            <div className="relative">
              <i
                className="fa-light fa-magnifying-glass pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                placeholder="Search…"
                value={search}
                onChange={event => setSearch(event.target.value)}
                className={cn("h-8 ps-7 text-xs", search ? "pe-8" : "pe-2")}
                autoFocus
                aria-label={menuAriaLabel ?? `Search ${label}`}
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="icon-button-chrome absolute end-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
          <div
            role="menu"
            aria-label={menuAriaLabel ?? `Switch ${label}`}
            className="max-h-[min(24rem,70vh)] overflow-y-auto py-1"
          >
            {filteredMenu.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">No matches.</p>
            ) : (
              filteredMenu.map(option => (
                <button
                  key={option.id}
                  type="button"
                  role="menuitem"
                  onClick={() => selectOption(option)}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-start text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:outline-none"
                >
                  <BreadcrumbMenuOptionMarker selected={option.selected} />
                  <span className="min-w-0 truncate">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <RecordMenuTriggerButton
          label={label}
          menuAriaLabel={menuAriaLabel}
          isCurrentPage={isCurrentPage}
          variant={variant}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[min(24rem,70vh)] overflow-y-auto">
        {menu.map(option => (
          <DropdownMenuItem
            key={option.id}
            className="gap-2"
            onSelect={option.onSelect}
            asChild={option.href != null ? true : undefined}
          >
            {option.href != null ? (
              <Link to={option.href}>
                <BreadcrumbMenuOptionMarker selected={option.selected} />
                <span className="min-w-0 truncate">{option.label}</span>
              </Link>
            ) : (
              <>
                <BreadcrumbMenuOptionMarker selected={option.selected} />
                <span className="min-w-0 truncate">{option.label}</span>
              </>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** BreadcrumbMenuSegment — peer record switcher for trail segments. */
function BreadcrumbMenuSegment(props: React.ComponentProps<typeof RecordMenuSegment>) {
  return <RecordMenuSegment {...props} />
}

/**
 * Page `<h1>` record switcher — same search/popover menu as breadcrumbs, sized for
 * `PageHeader` titles on detail routes.
 */
export function PageTitleRecordSwitcher(
  props: Omit<React.ComponentProps<typeof RecordMenuSegment>, "variant" | "isCurrentPage">,
) {
  return (
    <h1
      className="line-clamp-2 min-w-0 overflow-hidden break-words text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl font-heading"
      suppressHydrationWarning
    >
      <RecordMenuSegment {...props} variant="title" isCurrentPage />
    </h1>
  )
}

function BreadcrumbTrailSegment({
  crumb,
  isCurrentPage = false,
}: {
  crumb: Pick<PageBreadcrumbTrailItem, "label" | "href" | "menu" | "menuAriaLabel">
  isCurrentPage?: boolean
}) {
  if (crumb.menu?.length) {
    return (
      <BreadcrumbMenuSegment
        label={crumb.label}
        menu={crumb.menu}
        menuAriaLabel={crumb.menuAriaLabel}
        isCurrentPage={isCurrentPage}
      />
    )
  }

  if (isCurrentPage) {
    return (
      <BreadcrumbPage className="inline-flex items-center font-sans text-sm font-medium leading-none whitespace-nowrap">
        {crumb.label}
      </BreadcrumbPage>
    )
  }

  if (crumb.href) {
    return (
      <BreadcrumbLink asChild>
        <Link
          to={crumb.href}
          className="inline-flex items-center font-sans text-sm leading-none text-muted-foreground"
        >
          {crumb.label}
        </Link>
      </BreadcrumbLink>
    )
  }

  return (
    <span className="inline-flex items-center font-sans text-sm leading-none text-muted-foreground">
      {crumb.label}
    </span>
  )
}

/**
 * Single-step back nav — back icon + parent destination (no chevron trail).
 * Use in `SiteHeader` for focused child routes (composer, wizard) where the
 * page `<h1>` is the current title.
 */
export function PageBreadcrumbBack({ label, href, className }: PageBreadcrumbBackProps) {
  return (
    <Breadcrumb className={cn("min-w-0", className)}>
      <BreadcrumbList className="gap-1.5 font-sans tracking-normal">
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbLink asChild>
            <Link
              to={href}
              className="group inline-flex min-w-0 max-w-full items-center gap-1.5 font-sans text-sm text-muted-foreground hover:text-interactive-hover-foreground"
              aria-label={`Back to ${label}`}
            >
              <i
                className="fa-light fa-arrow-left shrink-0 text-xs transition-transform group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              <span className="truncate">{label}</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/**
 * Product breadcrumb trail — one component for SiteHeader and in-page shells.
 * Uses shadcn `Breadcrumb` primitives with Exxat site-header typography.
 *
 * For back-icon + parent label only, use {@link PageBreadcrumbBack}.
 */
const EMPTY_BREADCRUMB_ITEMS: PageBreadcrumbTrailItem[] = []

export function PageBreadcrumbTrail({
  items = EMPTY_BREADCRUMB_ITEMS,
  currentPage,
  currentPageMenu,
  currentPageMenuAriaLabel,
  variant = "content",
  className,
}: PageBreadcrumbTrailProps) {
  const isHeader = variant === "header"
  const trailItems = items ?? EMPTY_BREADCRUMB_ITEMS

  const list = (
    <BreadcrumbList
      className={cn(
        "h-8 items-center gap-1.5 font-sans tracking-normal",
        isHeader && "w-max flex-nowrap whitespace-nowrap",
      )}
    >
      {trailItems.map((crumb, i) => (
        <React.Fragment key={`${crumb.label}-${i}`}>
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbTrailSegment crumb={crumb} />
          </BreadcrumbItem>
          {(currentPage != null || i < trailItems.length - 1) && (
            <BreadcrumbSeparator className="shrink-0 text-muted-foreground [&>i]:text-xs" />
          )}
        </React.Fragment>
      ))}
      {currentPage != null ? (
        <BreadcrumbItem className="shrink-0">
          <BreadcrumbTrailSegment
            crumb={{
              label: currentPage,
              menu: currentPageMenu,
              menuAriaLabel: currentPageMenuAriaLabel,
            }}
            isCurrentPage
          />
        </BreadcrumbItem>
      ) : null}
    </BreadcrumbList>
  )

  return (
    <Breadcrumb
      className={cn("min-w-0", className)}
      aria-label="Breadcrumb"
    >
      {isHeader ? (
        <HorizontalScrollRegion
          ariaLabel="Breadcrumb"
          alignEnd
          className="min-w-0"
          scrollClassName="flex items-center"
        >
          {list}
        </HorizontalScrollRegion>
      ) : (
        list
      )}
    </Breadcrumb>
  )
}
