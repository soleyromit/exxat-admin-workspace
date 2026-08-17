"use client"

/**
 * The marketing half of the products home — everything Exxat makes that this
 * workspace does not have yet.
 *
 * One grid, not two shelves. The split used to be "live today" against "still
 * being built", which mattered while half the catalog was a promise; now every
 * product exists, and putting cards on separate shelves by ship state would
 * divide them on a distinction the reader can no longer act on. What survives
 * from that idea is the badge: the one or two products with something to say
 * about their stage say it on their own card, and everyone else is quiet.
 *
 * Betas do lead the grid (`catalogStageRank`), which is a different claim from
 * shelving them: within one list they are the only cards carrying something to do
 * today, since `BetaAccessAction` is an opt-in this workspace can take and every
 * other card is a sales conversation.
 *
 * The covers carry the same per-product art the featured banner uses —
 * window-chrome UI vignettes of the job each product does, in that product's
 * own brand colour. Same primitive across shelf and featured.
 *
 * Shared by both home variants: the storefront shows it inline, the focus
 * variant keeps it behind a disclosure.
 */

import { Link } from "react-router"

import { StatusBadge } from "@/components/ui/status-badge"
import { cn } from "@/lib/utils"
import type { ProductHomeCard } from "@/lib/product-home"

import { BetaAccessAction } from "./product-beta-access"
import { ProductIllustration } from "./product-illustration"
import { ProductMarkTile } from "./product-home-parts"

/**
 * Marketing card — a product the workspace does not have.
 *
 * The title's stretched pseudo-element covers the whole card, so the "Learn
 * more" line at the bottom is plain text with an arrow that moves on hover: it
 * reads as an affordance without adding a second tab stop to the same
 * destination. A beta product earns the one exception — its opt-in does
 * something the card surface cannot, so it is a real button, lifted above the
 * stretched link.
 */
function AvailableProductCard({ card, wide }: { card: ProductHomeCard; wide?: boolean }) {
  return (
    <li className="min-w-0 list-none">
      <article
        className={cn(
          "group relative flex h-full overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-shadow focus-within:shadow-md hover:shadow-md",
          wide ? "flex-col sm:flex-row" : "flex-col",
        )}
      >
        {/* The art is drawn with `stroke-brand` / `fill-brand`, which resolve
            `--brand-color` — the *theme's* brand, pink for everyone. Pointing
            the token at this card's colour is what makes seven drawings look
            like seven products instead of seven pink ones. */}
        <div
          className={cn(
            "relative flex items-center justify-center px-6 py-4",
            wide ? "aspect-16/7 sm:aspect-auto sm:w-2/5" : "aspect-16/7",
          )}
          style={{ "--brand-color": card.brandColor } as React.CSSProperties}
        >
          <ProductIllustration product={card.product} />
        </div>

        <div
          className={cn(
            "flex flex-1 flex-col gap-1.5 p-5",
            wide && "sm:justify-center sm:p-8",
          )}
        >
          {/* Badge beside the name, not floated over the artwork. Every other
              place a stage is shown — the switcher, the spotlight index — reads
              it as part of the name, and a chip in the cover's top corner also
              inherited the card's `--brand-color` override, which drops a pale
              "New" below 4.5:1 against its own white label.

              h3 sits directly under the section's h2. The shelf used to be split
              into "Available now" / "In build" sub-headings, and the cards hung
              an h4 off those; with the split gone, h4 skips a level. */}
          {/* Two columns, mark and copy, rather than the mark inline with the
              title and the tagline starting back at the padding edge. That put two
              left edges in one block: the title began 42px in and the sentence
              under it did not, so the block read as ragged instead of as a column.

              Mark stays top-aligned with the title so a wrapped name plus
              tagline does not float the tile in the middle of the block.
              Stage rides as a flex sibling of the name (not glued to the last
              wrapped word), and the tagline uses `text-pretty` so it does not
              orphan a final word under a long product name. */}
          <div className="flex min-w-0 items-start gap-3">
            {/* The mark the product will wear once the workspace owns it: same
                tile as Your App and the switcher row, so a card the buyer reads
                today is recognisable in the switcher tomorrow. It sits in the
                copy column rather than on the cover because the cover overrides
                `--brand-color`, and anything tinted by that override lands under
                4.5:1 — the reason the stage badge moved down here too. */}
            <ProductMarkTile card={card} size="lg" className="mt-0.5" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h3 className="min-w-0 text-base font-semibold leading-snug">
                <Link
                  to={`/home/${card.slug}`}
                  className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 after:absolute after:inset-0 after:content-['']"
                >
                  <span className="min-w-0">{card.label}</span>
                  {card.stage ? (
                    <StatusBadge status={card.stage} size="sm" className="shrink-0" />
                  ) : null}
                </Link>
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {card.tagline}
              </p>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
            <p
              aria-hidden
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground"
            >
              Learn more
              <i className="fa-light fa-arrow-right text-xs transition-transform group-hover:translate-x-0.5" />
            </p>
            {card.stage === "beta" ? (
              // `relative` lifts it out of the stretched link's reach — without
              // it the pseudo-element covering the card would swallow the click
              // and quietly navigate instead.
              <BetaAccessAction label={card.label} className="relative" />
            ) : null}
          </div>
        </div>
      </article>
    </li>
  )
}

export function ProductShelves({
  cards,
  className,
  id,
}: {
  cards: ProductHomeCard[]
  className?: string
  /** For the focus variant's disclosure to point `aria-controls` at. */
  id?: string
}) {
  if (cards.length === 0) return null

  return (
    // The grid follows the count instead of the count rattling around in a
    // fixed grid: a lone card goes wide and horizontal rather than sitting in a
    // row that looks like it failed to load, and four cards go two-by-two
    // rather than three-then-one-orphan.
    <ul
      id={id}
      className={cn(
        "grid list-none gap-5 p-0",
        cards.length >= 2 && "sm:grid-cols-2",
        cards.length >= 3 && cards.length !== 4 && "lg:grid-cols-3",
        className,
      )}
    >
      {cards.map(card => (
        <AvailableProductCard key={card.slug} card={card} wide={cards.length === 1} />
      ))}
    </ul>
  )
}
