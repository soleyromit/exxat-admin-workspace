"use client"

/**
 * Products home — `/home/<variant>` (Storefront, Focus, Spotlight, Launcher).
 *
 * Bare `/home` redirects to the last preferred layout. Each approach is its
 * own link so you can bookmark, share, or open one without flipping a setting
 * first. Visiting a layout URL also updates the preference (`setHomeVariant`).
 *
 *   Storefront — the launcher first, then the featured product, then the
 *                shelves. What the app-store model is for: your library above
 *                the store, not behind it.
 *   Focus      — the launcher and nothing else, with the shelves one click away
 *                behind a disclosure.
 *   Spotlight  — one live mosaic that leads with what is waiting rather than
 *                what exists. Lives in `spotlight-home.tsx`.
 *   Launcher   — icon grid of owned apps plus the rest of the catalog inline.
 *
 * Your App uses the shared `OwnedProductTile` (bordered scope picker + Open) on
 * the shared `ownedGridClassName`, so it breaks to the same columns as the shelf
 * underneath it rather than stacking two-up above a three-up shelf.
 * Shelf / featured cards still follow the app-store model: surface opens the
 * marketing page, a separate control starts or opens the product.
 */

import * as React from "react"
import { useLocation, useNavigate } from "react-router"

import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { Button } from "@/components/ui/button"
import { MarketingBanner } from "@/components/ui/marketing-banner"
import { usePersistedState } from "@exxatdesignux/ui/lib/persisted-state"
import { cn } from "@/lib/utils"
import { useProduct } from "@/contexts/product-context"
import { useProductSwitch } from "@/contexts/product-route-sync"
import { useActiveScope } from "@/hooks/use-active-scope"
import {
  homeVariantFromPathname,
  setHomeVariant,
  useHomeVariant,
  type HomeVariant,
} from "@/hooks/use-home-variant"
import { getLoginSession } from "@/lib/login-session"
import { NAV_USER } from "@/lib/mock/navigation"
import { buildProductHomeInventory, type ProductHomeCard } from "@/lib/product-home"

import { ProductIllustration } from "./product-illustration"
import {
  FEATURED_DISMISSED_KEY,
  FEATURED_PRODUCT,
  firstName,
  HomeDirectorySection,
  NoProductsCard,
  ownedGridClassName,
  OwnedProductTile,
  WhatsNewSection,
  type HomeBodyProps,
} from "./product-home-parts"
import { LauncherHome } from "./launcher-home"
import { ProductShelves } from "./product-shelves"
import { SectionHeading } from "./section-heading"
import { SpotlightHome } from "./spotlight-home"

/**
 * Identity row.
 *
 * `size` is the difference between the two variants: the storefront wants this
 * out of the way so the launcher can own the fold, while the focus variant has
 * nothing else at the top and can afford the full greeting.
 */
function HomeGreeting({
  workspaceName,
  size,
}: {
  workspaceName: string
  size: "compact" | "large"
}) {
  const large = size === "large"

  // No avatar. It was decorative — the name is in the heading it sat beside,
  // and the utility bar already carries the one avatar that opens the account
  // menu, so this was a second face on the page that did nothing.
  return (
    <header className="flex min-w-0 flex-col gap-1">
      <h1
        className={cn("font-heading font-semibold tracking-tight", large ? "text-4xl" : "text-3xl")}
      >
        Welcome back, {firstName(NAV_USER.name)}
      </h1>
      <p className={cn("text-muted-foreground", large ? "text-base" : "text-sm")}>
        {workspaceName} · Choose where you want to work today.
      </p>
    </header>
  )
}

/**
 * Diagonal wash, lighting the band across rather than sitting on one flat
 * fill. Was mixed per-product from the featured product's own brand colour;
 * flattened to the DS's own `--accent` -> `--card` pair (fixed, pre-verified
 * contrast against `--foreground`) so the wash strength no longer depends on
 * an unverifiable runtime colour-mix of whichever product happens to be
 * featured. Same idea as the shelf covers' `brandWash`, a stop longer because
 * the band is much wider.
 */
function featuredWash(): string {
  return `linear-gradient(135deg,
    var(--accent) 0%,
    var(--card) 55%,
    var(--card) 100%)`
}

/**
 * Featured strip, in the spirit of an app store's front page: one product gets
 * the top slot instead of the grid treating all of them as equals.
 *
 * It features an *unowned* product, because a product the workspace already has
 * does not need selling and already sits one section above with an Open button.
 *
 * This is the DS `MarketingBanner` in its `hero` layout rather than a bespoke
 * band — same primitive the product marketing pages use for their promo strip,
 * so the dismiss affordance, action chrome, and heading type come from one
 * place. The product's own brand colour rides in on the wash and the artwork;
 * everything keyed to `--brand-color` stays on the theme brand the DS audited.
 *
 * Kept off the louder `tone="gradient"`: gradient puts light copy on
 * `--brand-color-dark` / `-deep`, and deriving those per product would stake AA
 * contrast on whatever colour the next product ships with.
 */
function FeaturedProduct({
  card,
  onDismiss,
}: {
  card: ProductHomeCard
  onDismiss: () => void
}) {
  const navigate = useNavigate()

  return (
    <MarketingBanner
      layout="hero"
      // `surface` rather than `tint`, because tint fills from `--brand-color`
      // and the band wants the *product's* colour there. Pointing the token at
      // the product was the old way to get that, and it handed the product hue
      // to every brand-keyed thing inside — including the `New` chip, where a
      // pale hue puts white text below 4.5:1. The colour now goes only where it
      // is wanted: this wash, the border, and the artwork.
      tone="surface"
      style={{
        backgroundImage: featuredWash(),
        borderColor: "var(--border)",
      }}
      className="shadow-sm"
      // No stage chip here, even when the featured product carries one. `New`
      // and `Beta` are how the shelf below sorts one card from the next, and a
      // banner is already the loudest thing on the page — a chip on it says
      // nothing the size and position have not said. The chip stays where it
      // does work.
      eyebrow="Featured"
      eyebrowIcon="fa-light fa-sparkles"
      title={card.label}
      // Inside the "More from Exxat" section now, so its h2 owns the banner and
      // the default h3 is the right level — the same level the shelf cards
      // below it set.
      titleAs="h3"
      // `onClick`, not `href` — the banner renders `href` as a bare anchor,
      // which would full-reload the SPA on the way to the marketing page.
      primaryAction={{ label: "Learn more", onClick: () => navigate(card.slug) }}
      // No beta opt-in here any more. The promoted product keeps its own shelf
      // card below, which already carries `BetaAccessAction`, and that state is
      // per instance — two buttons for one product would have disagreed the
      // moment either was pressed. `Learn more` also lands on a page that leads
      // with the same opt-in.
      dismissible
      onDismiss={onDismiss}
      // `media`, not `illustration`: the illustration slot wraps its child in a
      // small tinted tile, which is the right frame for a glyph and the wrong
      // one for artwork. `media` hands over the whole visual column.
      media={
        // The art draws itself with `stroke-brand` / `fill-brand`, so the one
        // subtree that does want the product hue gets the token pointed at it.
        // `contents` keeps the wrapper out of the layout the banner set up.
        <span
          className="contents"
          style={{ "--brand-color": card.brandColor } as React.CSSProperties}
        >
          <ProductIllustration product={card.product} />
        </span>
      }
    >
      {/* The tagline, not `entry.summary` — the banner sells the idea in one
          line and the detail page carries the full pitch. */}
      {card.tagline}
    </MarketingBanner>
  )
}

/**
 * Storefront — library on top, store underneath.
 *
 * The order is the whole point of the redesign. The launcher used to sit third,
 * below a greeting block and a featured banner, which is backwards for the
 * person who opens this page every morning and is gone from it in a second.
 */
function StorefrontHome({
  owned,
  available,
  workspaceName,
  onOpen,
  showYourApp,
  showMoreFromExxat,
}: HomeBodyProps) {
  const featured =
    available.find(card => card.product === FEATURED_PRODUCT) ?? available[0]

  // Dismissal is owned here rather than inside the banner because
  // `usePersistedState` only syncs across tabs, so two instances of the hook in
  // one document would drift the moment one of them wrote.
  const [dismissed, setDismissed] = usePersistedState(FEATURED_DISMISSED_KEY, false, {
    debounceMs: 0,
  })
  const showFeatured = Boolean(featured) && !dismissed

  return (
    <div className="flex flex-col gap-10">
      <HomeGreeting workspaceName={workspaceName} size="compact" />

      {!showYourApp ? null : owned.length === 0 ? (
        <NoProductsCard />
      ) : (
        <section className="flex flex-col gap-4">
          <SectionHeading title="Your App" />
          <ul className={ownedGridClassName(owned.length)}>
            {owned.map(card => (
              <OwnedProductTile key={card.slug} card={card} onOpen={onOpen} />
            ))}
          </ul>
        </section>
      )}

      <HomeDirectorySection />

      <WhatsNewSection owned={owned} onOpen={onOpen} />

      {/* The banner belongs to the store, not between the store and your own
          products. Sitting above the heading it read as a third top-level
          section and pushed "More from Exxat" below the fold; inside, it is
          plainly the loudest card on the shelf it was pulled out of. */}
      {showMoreFromExxat && available.length > 0 ? (
        <section className="flex flex-col gap-6">
          <SectionHeading title="More from Exxat" />
          {showFeatured && featured ? (
            <FeaturedProduct card={featured} onDismiss={() => setDismissed(true)} />
          ) : null}
          {/* Every available product, the promoted one included. It used to be
              held out while the banner showed, which made dismissing the banner
              change what the grid contained — so the shelf was a different
              length depending on a preference about a promo, and the product
              being promoted was the one you could not find in the list of
              products. The banner is an ad for a card that is still there. */}
          <ProductShelves cards={available} />
        </section>
      ) : null}
    </div>
  )
}

/**
 * Focus — the launcher, and a way to see the rest if you want it.
 *
 * The shelves expand in place rather than moving to their own route: this is a
 * preference about how much of the page you want to see, not a different
 * destination, and a route would put a Back button in the way of a person who
 * only wanted a glance.
 *
 * No measure of its own. It used to hold itself to `max-w-3xl` inside the page's
 * own cap, on the argument that "focus" meant a narrow column, which in practice
 * meant it ignored the page width entirely: at 1280 it drew a 768px column with
 * 500px of empty page around it, and its What's new strip clipped a card the other
 * three had room for. What makes this variant focused is that everything except
 * your apps is behind a disclosure, not that it is thin.
 */
function FocusHome({
  owned,
  available,
  workspaceName,
  onOpen,
  showYourApp,
  showMoreFromExxat,
}: HomeBodyProps) {
  const [expanded, setExpanded] = React.useState(false)

  return (
    <div className="flex w-full flex-col gap-10">
      <HomeGreeting workspaceName={workspaceName} size="large" />

      {!showYourApp ? null : owned.length === 0 ? (
        <NoProductsCard />
      ) : (
        <section>
          <h2 className="sr-only">Your App</h2>
          <ul className={ownedGridClassName(owned.length)}>
            {owned.map(card => (
              <OwnedProductTile key={card.slug} card={card} onOpen={onOpen} />
            ))}
          </ul>
        </section>
      )}

      <HomeDirectorySection />

      <WhatsNewSection owned={owned} onOpen={onOpen} />

      {showMoreFromExxat && available.length > 0 ? (
        <section className="flex flex-col gap-6 border-t border-border pt-6">
          <h2 className="sr-only">More from Exxat</h2>
          <Button
            type="button"
            variant="ghost"
            aria-expanded={expanded}
            aria-controls="home-more-from-exxat"
            onClick={() => setExpanded(open => !open)}
            className="group h-auto w-full items-center justify-between gap-3 rounded-lg p-1 text-start font-normal"
          >
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium">
                {available.length} more products from Exxat
              </span>
              <span className="text-sm text-muted-foreground">
                All available today, on the workspace you already have.
              </span>
            </span>
            <i
              className={cn(
                "fa-light fa-chevron-down shrink-0 text-sm text-muted-foreground transition-transform group-hover:text-foreground",
                expanded && "rotate-180",
              )}
              aria-hidden="true"
            />
          </Button>

          {/* Unmounted rather than hidden: seven cards of line art is real work
              for the browser, and the point of this variant is that you are not
              paying for the storefront you did not ask for. */}
          {expanded ? <ProductShelves id="home-more-from-exxat" cards={available} /> : null}
        </section>
      ) : null}
    </div>
  )
}

export function ProductHomePage() {
  const { product, customProducts, hiddenProducts } = useProduct()
  const switchProduct = useProductSwitch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const preferred = useHomeVariant()
  const fromPath = homeVariantFromPathname(pathname)
  // Explicit layout routes always win; preference is only for `/home` redirect.
  const variant: HomeVariant = fromPath ?? preferred

  React.useEffect(() => {
    if (fromPath && fromPath !== preferred) {
      setHomeVariant(fromPath)
    }
  }, [fromPath, preferred])

  // No product is selected on this page, so there is no product scope to read.
  // The workspace name is the one piece of scope that holds regardless of which
  // product the user picks next.
  const workspaceName = useActiveScope(product).config.defaultParent.name

  const { owned, available } = React.useMemo(
    () => buildProductHomeInventory(customProducts, hiddenProducts),
    [customProducts, hiddenProducts],
  )

  const handleOpen = React.useCallback(
    (card: ProductHomeCard) => {
      // An `href` card is a console with one destination and no dashboard of
      // its own (Administrator), so it navigates rather than switching product.
      if (card.href) {
        navigate(card.href)
        return
      }
      // The shared switch helper sets product context and lands on the
      // product's dashboard, which is what the routing rule requires.
      switchProduct(card.product, card.customIndex)
    },
    [navigate, switchProduct],
  )

  // Read on render rather than held in state: the record is written by the
  // sign-in page one navigation earlier, so it cannot change while this page is
  // mounted, and reading it live keeps a stale copy from outliving a log out.
  const session = getLoginSession()

  const body: HomeBodyProps = {
    owned,
    available,
    workspaceName,
    onOpen: handleOpen,
    showYourApp: session.showYourApp,
    showMoreFromExxat: session.showMoreFromExxat,
  }

  return (
    <PrimaryPageTemplate
      // One measure for all four variants, at 80rem — exactly a 1280 viewport, so
      // the commonest laptop width fills instead of paying margin to a cap it is
      // already under. Nothing narrower than 1280 was ever capped, so this is a
      // change at one width and above, and past 1280 the page still stops growing:
      // every variant has prose on it (a greeting, a status line, a tagline under
      // each product) and a 1900px measure is not readable.
      //
      // It used to be `5xl` here and `6xl` for Spotlight, on the argument that the
      // other three are stacks of full-width rows and get worse as they widen.
      // What the extra 256px actually buys them is columns, not line length: the
      // shelf grid goes from three ~320px cards to three ~400px ones, and the rows
      // that do run full width carry a name, a scope, and a control rather than a
      // paragraph. Same constant the wide hub views use
      // (`LIST_PAGE_VIEW_FRAME_MAX_WIDE`).
      maxWidthClassName="max-w-7xl"
      contentClassName="px-6 pb-24 pt-12 sm:px-8"
    >
      {/* No `WhatsNewProvider` here. It moved up to `App` so the utility bar's
          What's new button shares this page's `seen` list; a second provider
          here would shadow it for the page body and put the drift back. */}
      {variant === "spotlight" ? (
        <SpotlightHome {...body} />
      ) : variant === "launcher" ? (
        <LauncherHome {...body} />
      ) : variant === "focus" ? (
        <FocusHome {...body} />
      ) : (
        <StorefrontHome {...body} />
      )}
    </PrimaryPageTemplate>
  )
}
