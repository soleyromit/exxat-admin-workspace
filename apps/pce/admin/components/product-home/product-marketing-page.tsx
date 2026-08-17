"use client"

/**
 * Per-product marketing page — `/home/:productSlug`. One scrolling page whose
 * only job is to get an interested reader to act: Open it if they have it,
 * Book a demo if they do not.
 *
 * Shell-global on purpose. Its main audience is someone who does *not* have
 * the product, so it cannot live under `/prism/*` or `/one-sites/*` — routing
 * there would push the app into a product context the user is not entitled to
 * and drag the scope chrome with it.
 *
 * ## Bands, not a column
 *
 * The page is built from full-bleed bands that alternate plain and tinted
 * surfaces, each with its own centred content column. Read as one narrow
 * column on one flat surface it looked like a document about a product; the
 * bands give it chapters, which is most of what separates a marketing site
 * from a settings page. `PrimaryPageTemplate` is therefore given
 * `max-w-none` + no padding, and every band handles its own gutters.
 *
 * Section order, and why:
 *   0. Promo — dismissible, above everything, so it reads as workspace news
 *      rather than a claim the product is making about itself.
 *   1. Hero — brand band: name, one-line pitch, the action, and a cropped
 *      screenshot rising into the bottom edge so the reader sees the thing
 *      before they read about it.
 *   2. Proof — the logo rail and the scale numbers, its own chapter right
 *      after the pitch. Tried folding this into the hero (same glance as the
 *      pitch); it crowded the one thing the hero has to be unambiguous about
 *      (the name, the action) and read as busy rather than convincing —
 *      pulled it back out to a beat of its own.
 *   3. How it works — three steps. The shape of the work, which a capability
 *      list never tells you.
 *   4. Features — alternating rows pairing one benefit with one screenshot.
 *      This used to be two sections (a caption gallery and a card grid) that
 *      said the same things twice in two different shapes.
 *   5. Voice — one customer quote.
 *   6. Questions — the four things a buyer asks, absorbing what used to be a
 *      bare "Details" spec table dropped into a sales page.
 *   7. Works well with — curated peer products from `pairsWith` on the catalog
 *      entry, so a buyer sees the bundle without returning to All products.
 *   8. Closing action — repeats the CTA so a reader who scrolled is not sent
 *      back up to act.
 *
 * Access requests confirm inline; no toast (`exxat-no-toast`).
 */

import * as React from "react"
import { Link, useParams } from "react-router"

import { useAskLeoPageContext } from "@/components/ask-leo-context"
import { ProductArt } from "@/components/product-app-mark"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { AvatarInitials } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MarketingBanner } from "@/components/ui/marketing-banner"
import { StatusBadge } from "@/components/ui/status-badge"
import { initialsFromDisplayName } from "@/lib/initials-from-name"
import { logoDevUrl } from "@/lib/logo-dev"
import {
  socialProofFor,
  type ProductPromo,
  type ProductProofProgram,
  type ProductSocialProof,
  type ProductTestimonial,
} from "@/lib/mock/product-social-proof"
import { useProduct } from "@/contexts/product-context"
import { useProductSwitch } from "@/contexts/product-route-sync"
import { useScopeSwitcher } from "@/components/scope-switcher-menu"
import type {
  ProductCatalogEntry,
  ProductScreen,
  ProductStage,
} from "@/lib/mock/product-catalog"
import {
  findProductHomeCard,
  pairedProductHomeCards,
  type ProductHomeCard,
} from "@/lib/product-home"
import { cn } from "@/lib/utils"

import {
  MarketingLeoInvite,
  marketingLeoSuggestions,
} from "./marketing-leo-invite"
import { BetaAccessAction } from "./product-beta-access"
import { ProductScopePicker } from "./product-scope-picker"
import { ProductShelves } from "./product-shelves"

const BACK_TO_HOME = { label: "All products", href: "/home" }

/** Brand wash used by the hero and the closing band. */
function brandWash(brandColor: string, from: number, to: number, angle = "135deg") {
  // Mixed toward `transparent`, never toward a surface token — `--card` is a
  // pink-tinted white, and mixing into it drags every product's hue toward
  // pink (One's indigo landed at hue 344 that way).
  return `linear-gradient(${angle},
    color-mix(in oklch, ${brandColor} ${from}%, transparent) 0%,
    color-mix(in oklch, ${brandColor} ${to}%, transparent) 100%)`
}

/** Flat top-of-hero tint, for the strip painted behind the breadcrumb. */
function brandTint(brandColor: string, amount: number) {
  return `color-mix(in oklch, ${brandColor} ${amount}%, transparent)`
}

/** Opening tint of the hero gradient — the header strip has to match it exactly. */
const HERO_WASH_FROM = 22
const HERO_WASH_TO = 5

/**
 * One full-bleed chapter of the page.
 *
 * The band spans the whole inset and holds the gutters; the content inside it
 * is centred at a readable width. That split is the whole trick — a tinted
 * section that stops at the text column reads as a card someone forgot to
 * finish, while the same tint running edge to edge reads as a chapter.
 */
function Band({
  tone = "plain",
  brandColor,
  washAngle,
  className,
  innerClassName,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  tone?: "plain" | "muted" | "brand"
  brandColor?: string
  /**
   * Direction of the brand wash. The hero runs it vertically so its top edge is
   * one flat colour the whole way across — that edge has to line up with the
   * strip painted behind the transparent breadcrumb, and a diagonal gradient
   * would only match at the left corner.
   */
  washAngle?: string
  /** Classes for the centred column inside the band, not the band itself. */
  innerClassName?: string
}) {
  return (
    <section
      {...props}
      style={
        tone === "brand" && brandColor
          ? {
              backgroundImage: brandWash(
                brandColor,
                HERO_WASH_FROM,
                HERO_WASH_TO,
                washAngle,
              ),
              ...props.style,
            }
          : props.style
      }
      className={cn(
        "px-6 sm:px-10",
        tone === "muted" && "bg-muted/40",
        className,
      )}
    >
      <div className={cn("mx-auto w-full max-w-5xl", innerClassName)}>{children}</div>
    </section>
  )
}

/** Eyebrow + heading, the cadence every band below the hero opens with. */
function BandHeading({
  eyebrow,
  title,
  lede,
  className,
  id,
}: {
  eyebrow: string
  title: string
  lede?: string
  className?: string
  id?: string
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
        {eyebrow}
      </p>
      {/* Ivy on section headings and the hero only — body copy stays in the UI
          face, per the type rules for this page. */}
      <h2
        id={id}
        className="font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-[2.5rem]"
      >
        {title}
      </h2>
      {lede ? (
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground text-balance">
          {lede}
        </p>
      ) : null}
    </div>
  )
}

/** Open (with scope) for owned products, request access otherwise. */
function ProductAction({
  card,
  size = "default",
}: {
  card: ProductHomeCard
  size?: "default" | "lg"
}) {
  const switchProduct = useProductSwitch()
  const scope = useScopeSwitcher(card.product, card.customIndex)
  const [requested, setRequested] = React.useState(false)

  if (!card.entitled) {
    const bookDemo = requested ? (
      // Inline status, not a toast — the confirmation belongs next to the
      // control that caused it, and has to survive scrolling away.
      <p
        role="status"
        className="inline-flex w-fit items-center gap-2 rounded-lg bg-success-soft px-3 py-2 text-sm"
      >
        <i className="fa-light fa-circle-check text-success" aria-hidden="true" />
        Demo requested. Someone from Exxat will reach out to schedule.
      </p>
    ) : (
      <Button
        type="button"
        size={size}
        // Second billing behind the beta opt-in, on its own where there is none.
        variant={card.stage === "beta" ? "outline" : "default"}
        onClick={() => setRequested(true)}
        className="w-fit"
      >
        Book a demo
        <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
      </Button>
    )

    // A beta is asking for users, not for a purchase order, so switching it on
    // leads and the sales conversation stands beside it for anyone who would
    // rather be walked through it first. Booking one does not retract the other:
    // both stay on the page, each answering with its own confirmation.
    return card.stage === "beta" ? (
      <div className="flex flex-wrap items-center justify-center gap-3">
        <BetaAccessAction label={card.label} size={size} variant="default" />
        {bookDemo}
      </div>
    ) : (
      bookDemo
    )
  }

  // Button first, scope under it. Side by side they read as a pair of equal
  // controls — and they were not even the same height, a 60px card trigger
  // against a 44px button. Stacked, the CTA is unambiguously the thing to
  // press and the scope is what it says about where you will land.
  return (
    <div className="inline-flex flex-col items-center gap-2.5">
      <Button
        type="button"
        size={size}
        className="w-fit shrink-0"
        onClick={() => switchProduct(card.product, card.customIndex)}
      >
        Open {card.label}
        <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
      </Button>
      {card.scoped ? <ProductScopePicker scope={scope} variant="inline" /> : null}
    </div>
  )
}

/**
 * Sticky action bar, shown once the reader has scrolled across the hero.
 *
 * Docked to the *top* of the content column, directly under the site
 * header, not the bottom — the bottom edge sits right where the page's own
 * closing-CTA band already lives, so a bottom-docked bar spent its whole
 * visible life overlapping page copy instead of framing it. `absolute
 * inset-x-0 top-0`, not `sticky top-0` — `PrimaryPageTemplate`'s `<main>`
 * clips its content with `overflow-hidden` (for the rounded shell corners)
 * one level above the *actual* scrolling element, so a `sticky` descendant
 * never finds a scroll container to stick within and just sits in normal
 * flow, silently never pinning. `<main>` is `position: relative`, already
 * starts below the site header, and is sized to the visible content column
 * (sidebar excluded, viewport height, not scroll height), so anchoring
 * `absolute` to *it* pins the bar right under the header without depending
 * on a `sticky` context this shell doesn't offer here. Always in the DOM
 * (see the doc comment at the call site for why); `visible` toggles
 * `inert` + opacity.
 */
function StickyProductAction({ card, visible }: { card: ProductHomeCard; visible: boolean }) {
  return (
    <div
      inert={!visible}
      className={cn(
        "absolute inset-x-0 top-0 z-30 border-b border-border bg-background/95 px-6 py-3 backdrop-blur transition-opacity duration-200 supports-[backdrop-filter]:bg-background/80 sm:px-10",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-xs ring-1 ring-foreground/5"
            aria-hidden="true"
          >
            <span
              className="inline-flex text-(--product-glyph)"
              style={{ "--product-glyph": card.brandColor } as React.CSSProperties}
            >
              <ProductArt
                product={card.product}
                markClassName="size-[1.125rem]"
                glyphClassName="text-base"
              />
            </span>
          </div>
          <p className="min-w-0 truncate text-sm font-semibold tracking-tight">{card.label}</p>
        </div>
        <ProductAction card={card} />
      </div>
    </div>
  )
}

/**
 * Promo strip above the hero. Dismissible and remembered for the session only —
 * an offer the reader waved away should not follow them to the next product
 * page, but it also should not be gone forever after one reload.
 */
function PromoStrip({
  promo,
  onBookDemo,
}: {
  promo: ProductPromo
  onBookDemo: () => void
}) {
  const [dismissed, setDismissed] = React.useState(false)
  if (dismissed) return null
  return (
    <MarketingBanner
      layout="hero"
      tone="tint"
      eyebrow={promo.eyebrow}
      eyebrowIcon="fa-light fa-sparkles"
      title={promo.title}
      // One action. Booking a demo is the page's only ask, so the banner sends
      // the reader to the hero control rather than offering a second button
      // with the same words on it — and the confirmation stays in one place.
      primaryAction={{ label: "Book a demo", onClick: onBookDemo }}
      dismissible
      onDismiss={() => setDismissed(true)}
    >
      {/* Inline only — the banner wraps children in a paragraph. */}
      {promo.body}
    </MarketingBanner>
  )
}

/**
 * One mark in the logo rail — a flat wordmark row (exxat.com's own "Trusted
 * by" strip: full-width logos at their native aspect ratio, divided by
 * hairlines, no card, no crop), not an avatar chip. `Avatar`/`AvatarImage`
 * were the wrong primitive here: they force a 1:1 `object-cover` crop, which
 * is exactly what turned wide wordmarks (a university seal *and* its name)
 * into cropped squares. A plain `img` at `object-contain` keeps each logo's
 * real proportions instead.
 *
 * `logoDevUrl` is the same brand-image API the school/site scope switcher
 * already uses for real customer logos (`lib/mock/navigation.tsx`); it is
 * pointed at real institutions here (`lib/mock/product-social-proof.ts`),
 * not invented ones, so the mark it returns is a genuine logo.
 *
 * Logo only, no name label — the mark is the whole point of a "who trusts
 * this" rail, and a caption under nine marks reads as a legend explaining
 * itself. The name still reaches assistive tech via the `<li>`'s
 * `aria-label`; the image itself is `aria-hidden`.
 */
function ProofLogo({ program }: { program: ProductProofProgram }) {
  const [broken, setBroken] = React.useState(false)
  const showMark = Boolean(program.domain) && !broken
  return (
    <li
      aria-label={program.name}
      className="flex h-9 shrink-0 items-center px-7 first:ps-0 last:pe-0 sm:h-11 sm:px-9"
    >
      {showMark ? (
        <img
          src={logoDevUrl(program.domain!)}
          alt=""
          aria-hidden="true"
          referrerPolicy="no-referrer"
          className="h-full w-auto max-w-28 object-contain sm:max-w-36"
          onError={() => setBroken(true)}
        />
      ) : (
        // Internal products (design-os's own proof band) have no domain to
        // fetch a mark for, and a broken fetch falls back the same way —
        // both stay a plain monogram rather than a missing image.
        <span aria-hidden="true" className="text-sm font-semibold text-muted-foreground">
          {program.initials ?? program.name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </li>
  )
}

/**
 * The logo rail and the proof numbers, its own chapter right after the hero.
 *
 * A plain band, not the hero's brand wash — evidence is corroboration, not
 * part of the pitch itself, and giving it a flat surface of its own is what
 * lets the hero stay about one thing (the name, the action) instead of
 * getting busy with a nine-mark logo row and four stats before the reader
 * has even decided whether to keep reading.
 */
function ProofBand({
  proof,
  /**
   * A beta names its cohort rather than its customer base. Same content
   * either way — every product page gets proof; only the claim it can
   * honestly make changes.
   */
  stage,
}: {
  proof: ProductSocialProof
  stage?: ProductStage
}) {
  const beta = stage === "beta"

  return (
    <Band className="py-14 sm:py-16" aria-labelledby="proof-heading">
      <div className="flex w-full flex-col items-center gap-7">
        <h2 id="proof-heading" className="sr-only">
          {beta ? "Who is running the beta, and at what scale" : "Who uses it, and at what scale"}
        </h2>

        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
            {beta ? "Running the beta" : "Already running on Exxat"}
          </p>
          {/* `divide-x` draws the hairline between items (skipping the very
              first); each `ProofLogo`'s own `px-*` (skipping its own edges)
              supplies the space around it, so the rule lands centered in
              the gap instead of flush against either logo. */}
          <ul className="flex list-none flex-wrap items-center justify-center gap-y-3 divide-x divide-border p-0">
            {proof.programs.map(item => (
              <ProofLogo key={item.name} program={item} />
            ))}
          </ul>
        </div>

        <dl className="grid w-full max-w-3xl grid-cols-2 gap-x-6 gap-y-6 border-t border-border pt-7 sm:grid-cols-4">
          {proof.stats.map(stat => (
            <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="flex flex-col items-center gap-1">
                <span className="text-4xl font-semibold tracking-tight tabular-nums">
                  {stat.value}
                </span>
                <span className="text-xs leading-snug text-muted-foreground text-balance">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Band>
  )
}

const HONORIFIC = /^(dr|prof|mr|mrs|ms|mx)\.?\s+/i

/** One quote. A carousel asks the reader to work for evidence we chose for them. */
function Testimonial({
  testimonial,
  brandColor,
}: {
  testimonial: ProductTestimonial
  brandColor: string
}) {
  return (
    <Band className="py-16 sm:py-20">
      <figure
        style={{ backgroundImage: brandWash(brandColor, 14, 4) }}
        className="flex flex-col items-center gap-7 rounded-3xl px-7 py-12 text-center sm:px-14 sm:py-16"
      >
        <i
          className="fa-solid fa-quote-left text-3xl text-foreground/15"
          aria-hidden="true"
        />
        {/* Set large and centred: this is the one place on the page where
            someone other than us is talking, so it gets the room to be heard. */}
        <blockquote className="max-w-3xl font-heading text-2xl leading-snug text-balance sm:text-[1.75rem]">
          {testimonial.quote}
        </blockquote>
        <figcaption className="flex items-center gap-3">
          {/* Decorative by default — the name is right beside it in text. The
              honorific is stripped first: the helper takes the first and last
              word, so "Dr. Halima Bright" monogrammed as DB. */}
          <AvatarInitials
            initials={initialsFromDisplayName(testimonial.name.replace(HONORIFIC, ""))}
            className="size-10"
          />
          <div className="flex flex-col text-left">
            <span className="text-sm font-medium">{testimonial.name}</span>
            <span className="text-sm text-muted-foreground">
              {testimonial.role}, {testimonial.institution}
            </span>
          </div>
        </figcaption>
      </figure>
    </Band>
  )
}

/**
 * One benefit beside one screenshot, sides flipping down the page.
 *
 * The frame shows a **zoomed crop**, not the whole screen. Half a content
 * column is around 480px; a 1600px capture scaled into that is a grey mosaic
 * that proves nothing. Overflowing the image to 150% and anchoring it top-left
 * keeps the UI at a size where a reader can see what it is, and cropping is
 * what a marketing site does with a screenshot anyway.
 */
function FeatureRow({
  highlight,
  screen,
  brandColor,
  flip,
}: {
  highlight: ProductCatalogEntry["highlights"][number]
  screen: ProductScreen
  brandColor: string
  flip: boolean
}) {
  return (
    <li className="grid list-none items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div className={cn("flex flex-col items-start gap-4", flip && "lg:order-2")}>
        <span
          aria-hidden
          style={{
            backgroundColor: `oklch(from ${brandColor} l c h / 12%)`,
            color: brandColor,
          }}
          className="inline-flex size-11 items-center justify-center rounded-xl"
        >
          <i className={cn(highlight.icon, "text-lg")} />
        </span>
        <h3 className="text-xl font-semibold tracking-tight text-balance">
          {highlight.title}
        </h3>
        <p className="text-base leading-relaxed text-muted-foreground">{highlight.body}</p>
      </div>

      <figure className={cn("flex flex-col gap-3", flip && "lg:order-1")}>
        <div
          style={{ borderColor: `color-mix(in oklch, ${brandColor} 18%, transparent)` }}
          className="aspect-[4/3] overflow-hidden rounded-2xl border bg-muted/20 shadow-sm"
        >
          <img
            src={screen.src}
            alt={screen.alt}
            loading="lazy"
            decoding="async"
            width={1600}
            height={1000}
            className="w-[150%] max-w-none"
          />
        </div>
        <figcaption className="text-sm leading-snug text-muted-foreground">
          {screen.caption}
        </figcaption>
      </figure>
    </li>
  )
}

/**
 * The things a buyer asks, answered from the catalog rather than from a
 * per-product script. Derived answers cannot drift out of date the way a
 * hand-written FAQ does the first time a scope or a ship date changes.
 */
function questionsFor(card: ProductHomeCard, entry?: ProductCatalogEntry) {
  const questions: { q: string; a: string }[] = []

  if (entry) {
    questions.push({
      q: "Who is it for?",
      a: `Built around the ${entry.persona}. Everyone else — students, faculty, clinical partners — sees only the part of the record that belongs to them.`,
    })
  }

  questions.push({
    q: "Where does it run?",
    a: (entry?.scoped ?? card.scoped)
      ? `${entry?.scopeLabel ?? card.scopeLabel}. Records, filters, and saved views stay inside the scope you pick, so two programs in the same school never see each other's work.`
      : "Workspace-wide. There is no school or program to choose — everyone in the workspace sees the same thing.",
  })

  // Privacy / HIPAA / FERPA — buyers ask before they book. Design OS is a
  // builder catalog, not a student record system, so it gets a different answer.
  if (card.product === "exxat-design-os") {
    questions.push({
      q: "How is privacy handled?",
      a: "Design OS is the component and pattern catalog for your workspace. It does not store student education records or clinical health information. Access follows your workspace roles.",
    })
  } else {
    questions.push({
      q: "How do you handle privacy, HIPAA, and FERPA?",
      a: "Student education records are handled under FERPA. Clinical and clearance data is handled with HIPAA-minded controls. Access is role-scoped so coordinators, faculty, students, and site partners only see what their job requires. Records stay inside the school or program (or brand and site) scope you pick.",
    })
  }

  questions.push({
    q: card.entitled ? "We have it. How do we start?" : "How do we get it?",
    a: card.entitled
      ? "It is already in your plan. Choose a scope at the top of this page and open it — your workspace admin decides who on the team can see what."
      : card.stage === "beta"
        ? `${card.label} is in beta: turn it on for one program, use it for real, and tell us what breaks. It is supported and your data is kept, but parts of it will change while you are in there. Book a demo instead if you would rather be walked through it first.`
        : `${card.label} is not part of your plan yet. Book a demo and someone from Exxat will walk your program through it and sort out licensing.`,
  })

  questions.push({
    q: "How does it fit with the rest of Exxat?",
    a: "One login, one workspace, one set of records. Every product reads the same students, sites, and scopes, so nothing has to be exported from one and imported into another.",
  })

  return questions
}

export function ProductMarketingPage() {
  const { productSlug = "" } = useParams()
  const { customProducts, hiddenProducts } = useProduct()

  const card = React.useMemo(
    () => findProductHomeCard(productSlug, customProducts, hiddenProducts),
    [productSlug, customProducts, hiddenProducts],
  )

  // Declared before the not-found branch so hook order stays stable.
  const actionRef = React.useRef<HTMLDivElement>(null)
  const heroSectionRef = React.useRef<HTMLElement>(null)
  const closingActionRef = React.useRef<HTMLDivElement>(null)
  const [showStickyAction, setShowStickyAction] = React.useState(false)

  // Pair-product (and any slug change) reuses this route — the scroll parent
  // keeps its offset, so without this jump the next page opens mid-band.
  const slug = card?.slug
  React.useLayoutEffect(() => {
    // Guard on the slug, not the card: the card object is a fresh identity every
    // render, so depending on it would re-run this jump on unrelated renders.
    if (!slug) return
    const from = heroSectionRef.current
    let node: HTMLElement | null = from
    while (node) {
      const { overflowY } = getComputedStyle(node)
      if (
        (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
        node.scrollHeight > node.clientHeight
      ) {
        node.scrollTo({ top: 0, behavior: "auto" })
        return
      }
      node = node.parentElement
    }
    window.scrollTo({ top: 0, behavior: "auto" })
  }, [slug])

  // Sticky bar shows once the reader has scrolled across the *whole* hero
  // band — not just its action row, which sits well above the hero's own
  // screenshot and would fire this early, popping the bar in while the hero
  // is still mostly on screen — and hides again once the closing band's copy
  // of the same action arrives, so the reader never faces two "Book a demo"
  // controls at once.
  React.useEffect(() => {
    const heroNode = heroSectionRef.current
    const closingNode = closingActionRef.current
    if (!heroNode || !closingNode) return

    let heroVisible = true
    let closingVisible = false
    const update = () => setShowStickyAction(!heroVisible && !closingVisible)

    const heroObserver = new IntersectionObserver(([observed]) => {
      heroVisible = observed.isIntersecting
      update()
    })
    const closingObserver = new IntersectionObserver(([observed]) => {
      closingVisible = observed.isIntersecting
      update()
    })
    heroObserver.observe(heroNode)
    closingObserver.observe(closingNode)
    return () => {
      heroObserver.disconnect()
      closingObserver.disconnect()
    }
  }, [card?.slug])

  const scrollToAction = React.useCallback(() => {
    const node = actionRef.current
    if (!node) return
    node.scrollIntoView({ behavior: "smooth", block: "center" })
    // Move focus too, or the banner's CTA strands keyboard users at the top
    // of a page that visually jumped somewhere else.
    node.querySelector<HTMLElement>("button, a")?.focus({ preventScroll: true })
  }, [])

  const askLeoPageContext = React.useMemo(() => {
    if (!card) return null
    return {
      title: card.label,
      suggestions: marketingLeoSuggestions(card.label),
    }
  }, [card])
  useAskLeoPageContext(askLeoPageContext)

  if (!card) {
    return (
      <PrimaryPageTemplate
        maxWidthClassName="max-w-3xl"
        contentClassName="px-6 pb-20 pt-10 sm:px-8"
        siteHeader={{ back: BACK_TO_HOME, documentTitle: "Product not found" }}
      >
        <div className="flex flex-col items-start gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Product not found
          </h1>
          <p className="text-sm text-muted-foreground">
            There is no Exxat product at this address. It may have been renamed, or
            hidden for this workspace.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/home">Back to all products</Link>
          </Button>
        </div>
      </PrimaryPageTemplate>
    )
  }

  const { entry } = card
  const proof = socialProofFor(card.product)
  const heroShot = entry?.screens[0]
  const representativeGallery = entry?.screens.some(screen => screen.representative) ?? false
  const pairedCards = pairedProductHomeCards(card, customProducts, hiddenProducts)

  // Each benefit takes the screenshot at its own index. Products that have
  // shipped more screens than benefits (or fewer) are normal: the leftovers
  // fall into the compact grid below rather than repeating a frame or
  // stranding one in a row of its own.
  const paired = (entry?.highlights ?? []).flatMap((highlight, index) => {
    const screen = entry?.screens[index]
    return screen ? [{ highlight, screen }] : []
  })
  const unpaired = (entry?.highlights ?? []).filter((_, index) => !entry?.screens[index])
  const questions = questionsFor(card, entry)

  return (
    <PrimaryPageTemplate
      // The bands are full-bleed and hold their own gutters, so the template's
      // centred column would only fight them.
      maxWidthClassName="max-w-none"
      contentClassName="p-0"
      // The hero band starts at the top of the page, so an opaque breadcrumb
      // strip would slice the colour off above it. The header goes transparent
      // and the canvas paints the hero's opening tint behind it — flat, because
      // the hero's gradient is vertical and its first row is this exact colour.
      siteHeader={{
        back: BACK_TO_HOME,
        documentTitle: card.label,
        transparent: true,
        // Entitlement lives in the chrome, not the pitch — the hero stays name
        // + CTA. Outline on the brand wash needs a translucent fill or it vanishes.
        trailing: (
          <Badge
            variant={card.entitled ? "secondary" : "outline"}
            className={cn(
              "h-5 px-2 text-xs font-normal",
              !card.entitled && "bg-background/70",
            )}
          >
            {card.entitled ? "Included in your plan" : "Not in your plan"}
          </Badge>
        ),
      }}
      pageCanvas={
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-(--header-height) rounded-t-xl"
          style={{ backgroundColor: brandTint(card.brandColor, HERO_WASH_FROM) }}
        />
      }
    >
      <div className="flex flex-col">
        {/* 0 — Promo. Above the hero so it reads as workspace news rather than
            a claim the product itself is making. */}
        {proof?.promo ? (
          <Band className="pt-6">
            <PromoStrip promo={proof.promo} onBookDemo={scrollToAction} />
          </Band>
        ) : null}

        {/* 1 — Hero. Landing-page shape: the pitch is centred over a brand
            field, and the product's first screenshot rises into the bottom of
            the band so the reader sees the thing before they read about it. */}
        <Band
          ref={heroSectionRef}
          tone="brand"
          brandColor={card.brandColor}
          washAngle="to bottom"
          className="overflow-hidden pt-10 sm:pt-12"
          innerClassName="flex flex-col"
        >
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            {/* Full colour even when the workspace does not own it. Entitlement
                is in the site header; greying the mark on the page whose job
                is to sell the product argues against itself. */}
            <div className="flex size-16 items-center justify-center rounded-2xl bg-background/70 shadow-sm ring-1 ring-foreground/5">
              <span
                className="inline-flex text-(--product-glyph)"
                style={{ "--product-glyph": card.brandColor } as React.CSSProperties}
              >
                <ProductArt
                  product={card.product}
                  markClassName="size-9"
                  glyphClassName="text-3xl"
                />
              </span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                <h1 className="font-heading text-[2.75rem] leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
                  {card.label}
                </h1>
                {card.stage ? <StatusBadge status={card.stage} size="md" /> : null}
              </div>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground text-balance sm:text-xl">
                {card.tagline}
              </p>
            </div>
            <div ref={actionRef} className="flex flex-col items-center">
              <ProductAction card={card} size="lg" />
            </div>
          </div>

          {/* The shot rises into the band edge. No white fade overlay and no
              fold-cue arrow — both read as a bar cutting the product UI. */}
          {heroShot ? (
            // Hidden on phones: at 430px the crop is an unreadable grey smudge
            // that costs a scroll and proves nothing.
            <div className="relative mx-auto mt-4 hidden w-full max-w-4xl sm:block">
              <div className="relative -mb-px overflow-hidden rounded-t-2xl border-x border-t border-foreground/8 bg-card shadow-[var(--shadow-sheet-panel)]">
                <img
                  src={heroShot.src}
                  alt=""
                  aria-hidden="true"
                  width={1600}
                  height={1000}
                  className="block max-h-[min(32rem,60vh)] w-full object-cover object-top"
                />
              </div>
            </div>
          ) : null}
        </Band>

        <MarketingLeoInvite
          key={card.slug}
          productLabel={card.label}
          slug={card.slug}
        />

        {/* 2 — Proof. Its own beat right after the pitch — see the file doc
            comment's section-order note. */}
        {proof ? <ProofBand proof={proof} stage={card.stage} /> : null}

        {/* Sticky action bar. `absolute`, so its DOM position doesn't matter
            for placement — it always docks under the header at the top of
            `<main>` (see the component's own doc comment for why
            `absolute` over `sticky`, and why top over bottom, here). Kept
            mounted rather than conditionally rendered on `showStickyAction`
            so `inert` can drive show/hide without a mount/unmount flicker;
            toggling `display` via mount would also replay the opacity
            transition from a cold start every time. */}
        <StickyProductAction card={card} visible={showStickyAction} />

        {entry ? (
          <>
            {/* 3 — How it works. Three steps, numbered, with the summary as the
                lede — the shape of the work before the list of parts. */}
            <Band className="py-16 sm:py-20" aria-labelledby="how-it-works">
              <div className="flex scroll-mt-6 flex-col gap-10">
                <BandHeading
                  id="how-it-works"
                  eyebrow="How it works"
                  title={`What running ${card.label} looks like`}
                  lede={entry.summary}
                />
                <ol className="grid list-none gap-8 p-0 sm:grid-cols-3 sm:gap-6">
                  {entry.steps.map((step, index) => (
                    <li key={step.title} className="flex flex-col gap-3">
                      {/* The rule carries the sequence at a glance; the numeral
                          is for anyone reading rather than scanning. */}
                      <div
                        aria-hidden
                        style={{
                          backgroundColor: `oklch(from ${card.brandColor} l c h / 45%)`,
                        }}
                        className="h-0.5 w-full rounded-full"
                      />
                      <span
                        style={{ color: card.brandColor }}
                        className="text-sm font-semibold tabular-nums"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-base font-semibold tracking-tight">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </Band>

            {/* 4 — Features. One benefit, one screenshot, sides alternating. */}
            <Band tone="muted" className="py-16 sm:py-20" aria-labelledby="features">
              <div className="flex flex-col gap-14">
                <BandHeading
                  id="features"
                  eyebrow="What you get"
                  title={
                    representativeGallery
                      ? "Built on surfaces you can already see"
                      : "The parts you will use every week"
                  }
                  // Says out loud that the frames are stand-ins. Without it they
                  // read as this product's finished UI.
                  lede={
                    representativeGallery
                      ? `The frames below are real Exxat surfaces from the shared shell rather than captures of ${card.label} itself — same primitives, same behaviour, different records.`
                      : undefined
                  }
                />

                {paired.length > 0 ? (
                  <ul className="flex list-none flex-col gap-16 p-0">
                    {paired.map((row, index) => (
                      <FeatureRow
                        key={row.highlight.title}
                        highlight={row.highlight}
                        screen={row.screen}
                        brandColor={card.brandColor}
                        flip={index % 2 === 1}
                      />
                    ))}
                  </ul>
                ) : null}

                {unpaired.length > 0 ? (
                  <ul
                    className={cn(
                      "grid list-none gap-4 p-0",
                      unpaired.length % 3 === 0 ? "sm:grid-cols-3" : "sm:grid-cols-2",
                    )}
                  >
                    {unpaired.map(highlight => (
                      <li
                        key={highlight.title}
                        className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-6"
                      >
                        <span
                          aria-hidden
                          style={{
                            backgroundColor: `oklch(from ${card.brandColor} l c h / 12%)`,
                            color: card.brandColor,
                          }}
                          className="inline-flex size-10 items-center justify-center rounded-xl"
                        >
                          <i className={cn(highlight.icon, "text-base")} />
                        </span>
                        <h3 className="text-[0.9375rem] leading-tight font-semibold">
                          {highlight.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {highlight.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Band>
          </>
        ) : (
          <Band className="py-16 sm:py-20">
            <div className="flex flex-col gap-4">
              <BandHeading eyebrow="What it is" title="A product built for your workspace" />
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                This is a custom product configured for your workspace. It inherits
                Clinical Education's navigation and scope, with your own branding.
              </p>
            </div>
          </Band>
        )}

        {/* 5 — One voice that is not ours. */}
        {proof ? (
          <Testimonial testimonial={proof.testimonial} brandColor={card.brandColor} />
        ) : null}

        {/* 6 — Questions. What used to be a three-row spec table, asked the way
            a buyer actually asks it. */}
        <Band tone="muted" className="py-16 sm:py-20" aria-labelledby="questions">
          <div className="flex flex-col gap-10">
            <BandHeading id="questions" eyebrow="Before you ask" title="Questions we get" />
            <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
              {questions.map(item => (
                <div key={item.q} className="flex flex-col gap-2">
                  <dt className="text-base font-semibold tracking-tight">{item.q}</dt>
                  <dd className="text-sm leading-relaxed text-muted-foreground">{item.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Band>

        {/* 7 — Works well with. Curated peers before the closing ask. */}
        {pairedCards.length > 0 ? (
          <Band className="py-16 sm:py-20" aria-labelledby="works-well-with">
            <div className="flex flex-col gap-10">
              <BandHeading
                id="works-well-with"
                eyebrow="Works well with"
                title={`Pair ${card.label} with these`}
              />
              <ProductShelves cards={pairedCards} />
            </div>
          </Band>
        ) : null}

        {/* 8 — Closing action, so a reader who scrolled does not go back up */}
        <Band tone="brand" brandColor={card.brandColor} className="py-16 sm:py-20">
          <div ref={closingActionRef} className="flex flex-col items-center gap-7 text-center">
            <div className="flex flex-col items-center gap-3">
              <p className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {card.entitled
                  ? `Ready to work in ${card.label}?`
                  : `Want ${card.label} for your program?`}
              </p>
              <p className="max-w-lg text-base text-muted-foreground text-balance">
                {card.entitled
                  ? "Pick a scope and pick up where you left off."
                  : "Book a demo and someone from Exxat will walk your program through it."}
              </p>
            </div>
            <ProductAction card={card} size="lg" />
          </div>
        </Band>
      </div>
    </PrimaryPageTemplate>
  )
}
