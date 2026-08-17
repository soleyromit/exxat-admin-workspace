"use client"

/**
 * Pieces every products-home variant is built from.
 *
 * The variants disagree about layout and agree about vocabulary: they all
 * draw a product's mark the same way, state scope the same way, and say the
 * same thing when the workspace has no products. Those live here so a fourth
 * variant is a layout decision rather than a copy-and-paste of the third.
 *
 * What deliberately does *not* live here, still: `SpotlightProductTile` —
 * that variant draws its own row shape. `OwnedProductTile` is shared by
 * Storefront, Focus, and Launcher so Your App is one card everywhere.
 */

import * as React from "react"
import { Link, useNavigate } from "react-router"

import { badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  HorizontalScrollControls,
  HorizontalScrollViewport,
  useHorizontalScrollAffordances,
} from "@/components/ui/horizontal-scroll-region"
import { MarketingBanner } from "@/components/ui/marketing-banner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useScopeSwitcher } from "@/components/scope-switcher-menu"
import { usePersistedState } from "@exxatdesignux/ui/lib/persisted-state"
import type { Product } from "@/contexts/product-context"
import { adminObjectSummaries } from "@/lib/mock/admin-directory"
import {
  openableIdentities,
  openAs,
  OPEN_AS_LABEL,
  type WorkspaceRole,
} from "@/lib/login-session"
import {
  LEO_WINDOW_COVER_IMAGE,
  LEO_WINDOW_PREVIEW_IMAGE,
  type ProductWhatsNewItem,
} from "@/lib/mock/product-catalog"
import {
  PRODUCT_TILE_CLASS,
  PRODUCT_TILE_SIZES,
  productTileStyle,
  type ProductTileSize,
} from "@/lib/product-glyph"
import { ProductTileArt } from "@/components/product-app-mark"
import {
  collectWhatsNewUpdates,
  whatsNewUpdateId,
  type ProductHomeCard,
} from "@/lib/product-home"
import { isSchoolScopedProduct } from "@/lib/scope-switcher"
import { STUDENT_HOME_PATH } from "@/lib/student-shell"
import { cn } from "@/lib/utils"
import { canReadDirectory } from "@/lib/workspace-role"

import { LeoIcon } from "@/components/ui/leo-icon"

import { ProductScopePicker } from "./product-scope-picker"
import { SectionHeading } from "./section-heading"
import { WhatsNewLeoAmbience } from "./whats-new-leo-ambience"

/** Shared by every variant body, so the page can hand all three the same bag. */
export interface HomeBodyProps {
  owned: ProductHomeCard[]
  available: ProductHomeCard[]
  workspaceName: string
  onOpen: (card: ProductHomeCard) => void
  /**
   * Whether the sign-in that opened this session asked for these sections. A
   * flag rather than an empty list, because empty means something else on this
   * page: no owned products draws "no apps yet", and that would be a lie told
   * about a workspace that has them.
   */
  showYourApp: boolean
  showMoreFromExxat: boolean
}

/**
 * Dismissal is per device and not product-scoped, so the key stays shell-global.
 * Shared across variants: dismissing the promotion is a statement about the
 * promotion, not about the layout you happened to be in when you made it.
 */
export const FEATURED_DISMISSED_KEY = "home-featured-dismissed"

/**
 * Which unowned product gets the promoted slot, in whichever variant has one.
 *
 * Named rather than derived. The rule used to be "whatever is newest", which
 * sounds objective and is not: a `New` chip means the product shipped recently,
 * while the promoted slot is a decision about what this workspace should look at
 * next, and those come apart the moment two products carry a stage. Marketing
 * owns this line; callers fall back to the first available product so the slot
 * cannot render empty if the named product ever becomes part of the plan.
 */
export const FEATURED_PRODUCT: Product = "exxat-exam-management"

export function firstName(full: string): string {
  return full.split(/\s+/)[0] ?? full
}

/**
 * Time-of-day greeting for the variants that lead with one.
 *
 * Shared rather than duplicated per variant, so "Good morning" doesn't drift
 * into "Welcome back" on one page and stay put on another.
 */
export function greetingForHour(hour: number): string {
  if (hour < 5) return "Still up"
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

/**
 * Square mark tile for launcher cards — the switcher row's footprint at `md`.
 *
 * `lg` exists for the More from Exxat card, where the mark heads its own column
 * beside a title and a two-line tagline. The size is one prop rather than a
 * `className` the caller sizes by hand because the art inside has to grow with the
 * tile: a bigger tile alone is the coverage problem in `PRODUCT_TILE_SIZES`.
 */
export function ProductMarkTile({
  card,
  className,
  size = "md",
}: {
  card: ProductHomeCard
  className?: string
  size?: ProductTileSize
}) {
  return (
    <span
      aria-hidden
      // The mark is white on the brand colour at a measured 3:1, so the tile
      // keeps its ink inside rows that repaint their descendants when
      // highlighted. See `DropdownMenuItem` in the package.
      data-fixed-ink=""
      style={productTileStyle(card.brandColor)}
      className={cn(PRODUCT_TILE_CLASS, size !== "md" && PRODUCT_TILE_SIZES[size].footprint, className)}
    >
      <ProductTileArt product={card.product} size={size} />
    </span>
  )
}

/** The scope pill, or the line that stands in for it on unscoped products. */
export function ProductScopeLine({
  card,
  variant,
  className,
}: {
  card: ProductHomeCard
  variant: "inline" | "card" | "compact"
  className?: string
}) {
  const scope = useScopeSwitcher(card.product, card.customIndex)

  if (!card.scoped) {
    return (
      <p
        className={cn(
          "flex min-w-0 items-center text-muted-foreground",
          variant === "card" ? "px-1 py-2 text-sm" : "px-1.5 py-1 text-xs",
          className,
        )}
      >
        <i className="fa-light fa-globe me-1.5 text-[0.85em]" aria-hidden="true" />
        Whole workspace
      </p>
    )
  }

  return (
    <ProductScopePicker
      scope={scope}
      variant={variant}
      className={cn(variant !== "card" && "text-xs", className)}
    />
  )
}

/** Dismissal is keyed per update, not per product, so a later release re-earns the badge. */
const WHATS_NEW_SEEN_KEY = "home-whats-new-seen"

/**
 * One `seen` list, shared by every `WhatsNewBadge` and the `WhatsNewSection`
 * digest on a page instead of each calling `usePersistedState` on its own.
 *
 * `usePersistedState` only syncs *across tabs* (the browser's own `storage`
 * event never fires in the tab that made the write) — two independent calls
 * to it with the same key inside *one* document drift the moment either one
 * writes, same as the reason `FEATURED_DISMISSED_KEY` is owned in one place
 * per variant. A product card's badge and the digest row for that same
 * update are the same fact rendered twice, so dismissing one has to be seen
 * by the other on the same click, not after a reload — hence a context that
 * owns the list once per page instead of prop-drilling `seen`/`dismiss`
 * through every card component between the two.
 */
const WhatsNewContext = React.createContext<{
  seen: string[]
  dismiss: (id: string) => void
} | null>(null)

/**
 * Mounted once in `App`, above the shell.
 *
 * It used to wrap only the `/home` body, which was enough while the page was the
 * only place this list was read. The utility bar's What's new button reads it too
 * and mounts in a different subtree, so the provider has to sit above both or the
 * two subtrees each keep their own copy.
 */
export function WhatsNewProvider({ children }: { children: React.ReactNode }) {
  const [seen, setSeen] = usePersistedState<string[]>(WHATS_NEW_SEEN_KEY, [])
  const dismiss = React.useCallback(
    (id: string) => setSeen(prev => (prev.includes(id) ? prev : [...prev, id])),
    [setSeen],
  )
  const value = React.useMemo(() => ({ seen, dismiss }), [seen, dismiss])
  return <WhatsNewContext.Provider value={value}>{children}</WhatsNewContext.Provider>
}

/**
 * Falls back to an unshared instance outside a provider, rather than throwing.
 *
 * The fallback is for isolated renders (catalog previews, tests) that mount a
 * badge without the shell around it. In the app the provider is always above,
 * which is what lets an update dismissed in the utility bar stop nagging from
 * the product tiles and the digest in the same paint.
 */
export function useWhatsNewSeen() {
  const context = React.useContext(WhatsNewContext)
  const [localSeen, setLocalSeen] = usePersistedState<string[]>(
    context ? "" : WHATS_NEW_SEEN_KEY,
    [],
  )
  if (context) return context
  return {
    seen: localSeen,
    dismiss: (id: string) => setLocalSeen(prev => (prev.includes(id) ? prev : [...prev, id])),
  }
}

/**
 * "New" flag for an owned product with a recent change worth calling out.
 *
 * A `Popover`, not a `Tooltip` — the update is a sentence of real content
 * (`card.whatsNew[0].body`) plus a dismiss action, and a tooltip vanishes the
 * moment a mouse or keyboard user reaches for either. The trigger is a plain
 * button styled with `badgeVariants` rather than `Badge` itself: `Badge`
 * renders a `span` (or, via `asChild`, wants to *be* the one interactive
 * element), and this one has to be a real, focusable, `aria-label`-carrying
 * control that Radix can also anchor the popover to.
 *
 * Dismissal is keyed to *this* update's own text, not just the product's
 * slug — so if `whatsNew` ever changes to describe a later release, the
 * badge reappears instead of staying silently dismissed for a change nobody
 * has actually seen.
 */
export function WhatsNewBadge({
  card,
  className,
}: {
  card: ProductHomeCard
  className?: string
}) {
  const { seen, dismiss: markSeen } = useWhatsNewSeen()
  const [open, setOpen] = React.useState(false)
  // Only the newest entry — see the "newest first" note on
  // `ProductCatalogEntry.whatsNew`. Older, still-unseen entries stay
  // reachable in the `/home` digest (`WhatsNewSection`) without also
  // queuing up behind this tile's one badge.
  const whatsNew = card.whatsNew?.[0]
  const updateId = whatsNew ? whatsNewUpdateId(card.slug, whatsNew.title) : null

  if (!whatsNew || !updateId || seen.includes(updateId)) return null

  function dismiss() {
    markSeen(updateId!)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          aria-label={`New in ${card.label}: ${whatsNew.title}. Show details.`}
          className={cn(
            badgeVariants({ variant: "default" }),
            "h-auto px-2 py-0.5 text-2xs",
            className,
          )}
        >
          New
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-4">
        <div className="flex flex-col gap-2">
          <p className="text-2xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
            New in {card.label}
          </p>
          <p className="text-sm font-semibold leading-snug">{whatsNew.title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{whatsNew.body}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-1 self-start"
            onClick={dismiss}
          >
            Got it
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * The recent-changes digest — one `MarketingBanner` per unseen update across
 * every owned product, in one place instead of buried in whichever card
 * happens to carry a `WhatsNewBadge`.
 *
 * `MarketingBanner layout="hero"` — the same primitive `PromoStrip`
 * (`product-marketing-page.tsx`) already uses for "here is one thing, act on
 * it" copy, rather than a bespoke card. A dedicated card would have to
 * reinvent the eyebrow/title/body/action rhythm the hero layout already
 * gets right, and would drift from it the first time either one changed
 * without the other (`exxat-reuse-before-custom`).
 *
 * `tone="surface"` plus an inline border tint. Most cards keep a soft
 * product-colour wash (`whatsNewWash`) and a component screenshot. Only
 * **New Ask Leo** drops the wash, wraps in `WhatsNewLeoAmbience` (one brand
 * thinking wash, no cursor field), and shows the interactive Leo mark —
 * every other Leo-titled update still uses its component image.
 *
 * Shares `WHATS_NEW_SEEN_KEY` with `WhatsNewBadge`: dismissing an update here
 * (the banner's own built-in dismiss control) also clears its badge on the
 * product card, and the reverse, because they are the same fact shown twice,
 * not two separate things to dismiss.
 *
 * Renders nothing once every update is seen — an empty "What's new" heading
 * sitting above the product grid every single day is worse than the section
 * simply not existing on the days there is nothing to say.
 *
 * A horizontal scroll strip, not a stacked list — this digest is *across
 * every owned product*, so a workspace with a full catalog can have a dozen
 * unseen updates on one day. Stacking full-width hero banners would push the
 * product grid below the fold; a fixed-width row scrolls instead. Prev/next
 * chevrons live in the section header (not beside the tall cards) and only
 * appear once there is enough to scroll.
 *
 * Each banner carries both actions the update needs directly — `Try it`
 * opens the product itself, `Register for webinar` flips to a disabled
 * "You're registered" once clicked (`MarketingBannerAction`'s own
 * `disabled` state, built for exactly this "can only be taken once" case) —
 * so there is no second click-through to a detail sheet repeating the same
 * two buttons.
 *
 * Two `mediaFit`s, picked per update by `ProductWhatsNewItem.visual`.
 * `"contain"` (default, `visual: "component"`) frames the shot like the
 * floating window or KPI card it is a screenshot *of* — capped height,
 * rounded border, its own shadow — sitting beside the copy at a size that
 * reads as one component, not stretched to stand in for the whole product.
 * `"cover"` (`visual: "cover"`) drops the two-column split and lets the
 * screenshot fill the whole card behind a scrim, for an update that *is* a
 * whole screen rather than one component on it. `compactDescription` clamps
 * the copy to two lines for the same reason a table row does not grow to
 * fit its longest cell — one long update should not make its card taller
 * than its neighbours in the same scrolling row.
 *
 * `ProductWhatsNewItem.image` overrides the product's own screenshot
 * (`entry.screens[0]`, the fallback below). **New Ask Leo** is the exception:
 * it skips the still and uses live brand wash + Leo mark instead.
 */
function whatsNewWash(color: string): string {
  return `linear-gradient(135deg,
    color-mix(in oklch, ${color} 14%, transparent) 0%,
    color-mix(in oklch, ${color} 5%, transparent) 55%,
    transparent 100%)`
}

/** Only the Ask Leo launch card — not every Leo-titled update. */
function isNewAskLeoWhatsNew(item: ProductWhatsNewItem): boolean {
  return (
    item.image === LEO_WINDOW_COVER_IMAGE ||
    /^new\s+ask\s+leo\b/i.test(item.title.trim())
  )
}

export function WhatsNewSection({
  owned,
  onOpen,
  className,
}: {
  owned: ProductHomeCard[]
  onOpen: (card: ProductHomeCard) => void
  className?: string
}) {
  const { seen, dismiss } = useWhatsNewSeen()
  const [webinarRequested, setWebinarRequested] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  )
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const { canScrollLeft, canScrollRight, overflowing, scrollPrev, scrollNext } =
    useHorizontalScrollAffordances(scrollRef)

  const seenIds = React.useMemo(() => new Set(seen), [seen])
  const updates = collectWhatsNewUpdates(owned)
    .filter(update => !seenIds.has(update.id))
    .map(({ id, card, item }) => ({ id, card, whatsNew: item }))

  if (updates.length === 0) return null

  return (
    <section
      aria-labelledby="whats-new-heading"
      className={cn("flex flex-col gap-3", className)}
    >
      <SectionHeading
        id="whats-new-heading"
        title={"What\u2019s new"}
        actions={
          overflowing ? (
            <HorizontalScrollControls
              ariaLabel="What's new"
              canScrollLeft={canScrollLeft}
              canScrollRight={canScrollRight}
              onScrollPrev={scrollPrev}
              onScrollNext={scrollNext}
            />
          ) : null
        }
      />
      <HorizontalScrollViewport
        ref={scrollRef}
        label="What's new"
        className="items-stretch py-0.5"
      >
        <ul className="flex shrink-0 list-none gap-4 p-0">
          {updates.map(({ id, card, whatsNew }) => {
            const askLeo = isNewAskLeoWhatsNew(whatsNew)
            // New Ask Leo: live mark + one-shot wash. Every other card (including
            // Leo smart import / Leo assessment) keeps its component screenshot.
            const imageSrc = askLeo
              ? undefined
              : (whatsNew.image === LEO_WINDOW_COVER_IMAGE
                  ? LEO_WINDOW_PREVIEW_IMAGE
                  : (whatsNew.image ?? card.entry?.screens[0]?.src))
            const borderColor = `color-mix(in oklch, ${card.brandColor} 24%, transparent)`
            // Leo mark must stay in the hero column (`contain`). `cover` would
            // paint it as a full-bleed background behind the copy.
            const mediaFit: "cover" | "contain" =
              askLeo || whatsNew.visual !== "cover" ? "contain" : "cover"
            const banner = (
              <MarketingBanner
                layout="hero"
                tone="surface"
                title={whatsNew.title}
                eyebrow={`New in ${card.label}`}
                eyebrowIcon={card.icon}
                media={
                  askLeo ? (
                    <LeoIcon variant="interactive" size="lg" />
                  ) : imageSrc ? (
                    <img
                      src={imageSrc}
                      alt=""
                      className={
                        mediaFit === "cover"
                          ? "size-full object-cover object-center"
                          : // `contain` is a single component (a floating Leo
                            // window, one KPI card), not the whole screen — it
                            // reads as *a* component sitting beside the copy
                            // only capped and framed like the floating window
                            // it is, not stretched to bleed like a full-screen
                            // photo would be.
                            "max-h-28 w-auto rounded-lg border border-border object-contain shadow-md lg:max-h-32"
                      }
                    />
                  ) : undefined
                }
                mediaFit={mediaFit}
                compact
                compactDescription
                primaryAction={{ label: "Try it", onClick: () => onOpen(card) }}
                secondaryAction={{
                  label: webinarRequested.has(id) ? "You\u2019re registered" : "Register for webinar",
                  disabled: webinarRequested.has(id),
                  onClick: () => setWebinarRequested(prev => new Set(prev).add(id)),
                }}
                dismissible
                onDismiss={() => dismiss(id)}
                className={
                  askLeo
                    ? "h-full overflow-hidden border-0 bg-transparent shadow-none"
                    : "h-full overflow-hidden"
                }
                style={
                  askLeo
                    ? undefined
                    : { backgroundImage: whatsNewWash(card.brandColor), borderColor }
                }
              >
                {whatsNew.body}
              </MarketingBanner>
            )
            return (
              <li key={id} className="w-[30rem] shrink-0 list-none sm:w-[34rem]">
                {askLeo ? (
                  <WhatsNewLeoAmbience className="h-full" style={{ borderColor }}>
                    {banner}
                  </WhatsNewLeoAmbience>
                ) : (
                  banner
                )}
              </li>
            )
          })}
        </ul>
      </HorizontalScrollViewport>
    </section>
  )
}

/**
 * Directory — People, Courses, and Personnel as one row of chips.
 *
 * Shared by every `/home` variant that renders Directory in the reading
 * order (Storefront, Focus, Launcher) instead of each drawing its own
 * version — the one row here reused counts among the fixes this pass makes,
 * not a fourth style to keep in sync by hand. Spotlight is the one variant
 * that does not call this: its Directory lives in a sticky rail beside the
 * catalog rather than the reading order, and reads better as the same
 * hairline list (`WaitingRow`, `spotlight-home.tsx`) its "Your App" column
 * already uses than as a row of chips squeezed into a narrow column.
 *
 * `variant="outline"` — a visible border reads as "this is a control" before
 * the pointer arrives, unlike a translucent fill alone, which only reads as
 * clickable once the cursor is already on it. No count beside the label:
 * Directory here is a set of destinations to open, not a dashboard of
 * totals, and a coordinator who wants "how many" already has that on the
 * People/Courses/Personnel hub itself.
 *
 * Everyone but a student, on `canReadDirectory` rather than the console's own
 * predicate: these are the rosters a coordinator works from all day, so gating
 * them on administering the workspace left faculty unable to look up the people
 * they place. A student is the floor, because a student who could open them would
 * be reading their whole cohort. The gate sits inside the component so all three
 * variants that render it inherit it, rather than three call sites each
 * remembering to ask.
 */
export function HomeDirectorySection() {
  const objects = React.useMemo(() => adminObjectSummaries(), [])
  if (!canReadDirectory()) return null

  return (
    <section className="flex flex-col gap-3">
      <SectionHeading title="Directory" />
      <ul className="flex list-none flex-wrap items-center gap-2 p-0">
        {objects.map(object => (
          <li key={object.id}>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full bg-muted/25 font-medium hover:bg-muted/50"
            >
              <Link to={object.href}>
                <i className={cn("fa-light text-sm", object.icon)} aria-hidden="true" />
                {object.label}
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * The identities this card should offer, or none for the ordinary single door.
 *
 * Two conditions, and both are about honesty rather than taste. The session has
 * to hold more than one identity, which only a sign-in can grant. And the product
 * has to be scoped to a school and program, because "as a student" means a
 * student *of a program* — a site product has no student view to open, so its
 * card keeps one Open.
 */
export function openableDoors(card: ProductHomeCard): WorkspaceRole[] {
  if (card.href || !isSchoolScopedProduct(card.product)) return []
  return openableIdentities()
}

/**
 * One door, or one per identity when the person holds two.
 *
 * Every other card on this page has exactly one action, and this is the one place
 * that is wrong: someone who is both a student in the program and staff in it is
 * looking at a fork, not a door. Hiding the second branch behind a menu on the
 * first would mean the identity you got was the default nobody chose, which is
 * the bug this replaces.
 *
 * Both buttons stay `outline`, at equal weight. Neither identity is the
 * recommended one — only the person reaching for the card knows which they are
 * today — and promoting one to `default` would answer the question the card is
 * asking. They wrap rather than shrink, so the labels never truncate to `Open
 * as…` on a narrow card.
 *
 * Each accessible name carries the product, because a two-column grid of these
 * would otherwise read out as several identical pairs of "Open as student" with
 * nothing to tell them apart. The visible words are a prefix of the spoken ones,
 * so voice control still matches what is on screen.
 */
function OpenDoors({
  card,
  doors,
  onOpen,
}: {
  card: ProductHomeCard
  doors: WorkspaceRole[]
  onOpen: (card: ProductHomeCard, role: WorkspaceRole) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {doors.map(role => (
        <Button
          key={role}
          type="button"
          variant="outline"
          className="min-w-[9rem] flex-1"
          aria-label={`Open as ${OPEN_AS_LABEL[role]} in ${card.label}`}
          onClick={() => onOpen(card, role)}
        >
          Open as {OPEN_AS_LABEL[role]}
          <i className="fa-light fa-arrow-right text-sm" aria-hidden="true" />
        </Button>
      ))}
    </div>
  )
}

/**
 * Take one of the doors: become that identity, then go where it leads.
 *
 * The write happens before the navigation, not after, because the page being
 * opened reads the role while it renders — the chrome asks whether scope is a
 * picker, and the shell asks whether the console answers at all.
 *
 * A student goes to the student home rather than into the product's dashboard.
 * That is the whole difference between the two doors: staff open a program, and a
 * student opens their own placements, which is a different page rather than a
 * dimmer version of the same one.
 *
 * Exported so the Spotlight variant's own tile can offer the same pair without
 * re-deriving any of it.
 */
export function useOpenAsIdentity(
  onOpen: (card: ProductHomeCard) => void,
): (card: ProductHomeCard, role: WorkspaceRole) => void {
  const navigate = useNavigate()
  return React.useCallback(
    (card: ProductHomeCard, role: WorkspaceRole) => {
      openAs(role)
      if (role === "student") {
        navigate(STUDENT_HOME_PATH)
        return
      }
      onOpen(card)
    },
    [navigate, onOpen],
  )
}

/**
 * The grid the three card variants lay `OwnedProductTile` out on.
 *
 * Shared for the same reason the tile is: Storefront, Focus, and Launcher each
 * drew this grid by hand, so a column rule added to one silently disagreed with
 * the other two on the same page width.
 *
 * The rule follows `ProductShelves` below the fold, count and all, so "Your App"
 * and "More from Exxat" break to the same number of columns rather than stacking
 * two-up above a three-up shelf. Including the exception: **four** cards stay
 * two-by-two, because three-then-one reads as a card that failed to load.
 *
 * Under three cards the grid itself is capped — one or two tiles must not stretch
 * across the full reading column just because the shelf below uses three tracks.
 * Cap widths sit near one / two of the three-up tile widths at `xl`.
 *
 * Three columns from `xl` rather than the shelf's `lg`. A tile is denser than a
 * marketing card, since it carries a school and program picker and a full-width
 * `Open` under the name, and at `lg` three of them land near 300px, where the
 * scope line truncates. At 1280 they land near 400px, which is what a shelf card
 * gets at the same width.
 */
export function ownedGridClassName(count: number): string {
  return cn(
    "grid list-none gap-4 p-0",
    count === 1 && "max-w-md",
    count === 2 && "max-w-3xl sm:grid-cols-2",
    count >= 3 && "sm:grid-cols-2",
    count >= 3 && count !== 4 && "xl:grid-cols-3",
  )
}

/**
 * Launcher tile — an owned product as a door rather than a row.
 *
 * Shared by Storefront, Focus, and Launcher: a small grid of equal, bordered
 * cards. The product mark carries the brand colour; the card surface stays
 * plain so the bordered scope picker and outline Open read as the controls.
 *
 * Border, shadow, and a full-width outline `Open` button, not a stretched
 * link over a flat fill — a flat fill only reads as clickable once the
 * pointer is already on it, and this card is the one every buyer decision
 * on `/home` ultimately routes through.
 */
export function OwnedProductTile({
  card,
  onOpen,
}: {
  card: ProductHomeCard
  onOpen: (card: ProductHomeCard) => void
}) {
  const doors = openableDoors(card)
  const openAsIdentity = useOpenAsIdentity(onOpen)

  return (
    <li className="min-w-0 list-none">
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <ProductMarkTile card={card} />
            <h3 className="min-w-0 truncate text-base font-semibold tracking-tight">
              {card.label}
            </h3>
          </div>

          <ProductScopeLine card={card} variant="card" className="mt-auto" />

          {doors.length > 1 ? (
            <OpenDoors card={card} doors={doors} onOpen={openAsIdentity} />
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => onOpen(card)}
            >
              Open
              <i className="fa-light fa-arrow-right text-sm" aria-hidden="true" />
            </Button>
          )}
        </CardContent>
      </Card>
    </li>
  )
}

export function NoProductsCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      <p className="text-sm font-medium">No products yet</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Your workspace has no Exxat products enabled. An administrator can add one from
        Settings.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link to="/settings/organization">Open organization settings</Link>
      </Button>
    </div>
  )
}
