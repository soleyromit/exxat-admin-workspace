"use client"

/**
 * Spotlight — the third home layout.
 *
 * ## Why it is shaped nothing like the other two
 *
 * Storefront and Focus are both single columns you read top to bottom: a
 * greeting, then sections, then cards. They differ only in how much catalog
 * they show. A third variant built the same way is a rearrangement, not a third
 * answer, so this one changes the geometry and the interaction model together.
 *
 * **Split canvas.** The page is two halves that do different jobs and never
 * interleave. The left is you and your day and stays put; the right is
 * everything Exxat could be to you and scrolls past it. Nothing on the left is
 * marketing and nothing on the right is a task, which is the separation the
 * other two layouts blur by stacking both in one column.
 *
 * **Search is the palette, not a field on the page.** This layout used to open
 * with a jump field that filtered your products, the record hubs, and the catalog
 * in place, with Leo as the last result. It is gone. The shell already carries one
 * search surface on every route, reachable here from the utility bar or ⌘K, and a
 * second one on a single page splits the answer to "where do I search" by which
 * page you happen to be on.
 *
 * ## Everything is type
 *
 * Nothing on the page is allowed a border, a fill, or a shadow. Products, record
 * hubs, and the whole catalog are set as type on the page background, separated by
 * space and hairlines rather than by boxes, and they earn contrast only on hover.
 * Colour is rationed the same way: each product's hue survives at the size of its
 * mark and nowhere else.
 *
 * This is what makes the layout scan in one pass. Ten bordered cards give the eye
 * ten equal entry points and no answer to "where do I start"; two columns of type
 * under one heading give it the heading.
 *
 * ## Why this shape and not a prettier grid
 *
 * The 2026 Gravyty survey of 1,058 enrolled US students: 58% say consumer apps
 * reset what they expect from institutional software, 85% have hit a concrete
 * friction point, and the most common one is "couldn't find what I needed and
 * gave up". They rank finishing a task in one place, personalisation, and
 * visible status above everything else. A catalog answers none of that. A field
 * plus live state answers all three.
 *
 * ## Everything on it is real
 *
 * No invented counts and no fake recents. The waiting list reads the
 * `needsAttention` numbers from `adminObjectSummaries()` that the other two
 * layouts discard, and the promoted product takes one stat from the same
 * social-proof mock the marketing page uses.
 */

import * as React from "react"
import { Link, useNavigate } from "react-router"

import { Button } from "@/components/ui/button"
import { MarketingBanner } from "@/components/ui/marketing-banner"
import { StatusBadge } from "@/components/ui/status-badge"
import { usePersistedState } from "@exxatdesignux/ui/lib/persisted-state"
import { OPEN_AS_LABEL } from "@/lib/login-session"
import { adminObjectSummaries, type AdminObjectSummary } from "@/lib/mock/admin-directory"
import { NAV_USER } from "@/lib/mock/navigation"
import type { ProductHomeCard } from "@/lib/product-home"
import { BetaAccessAction } from "./product-beta-access"
import { ProductIllustration } from "./product-illustration"
import { cn } from "@/lib/utils"
import { canReadDirectory } from "@/lib/workspace-role"

import {
  FEATURED_DISMISSED_KEY,
  FEATURED_PRODUCT,
  firstName,
  greetingForHour,
  NoProductsCard,
  openableDoors,
  ProductMarkTile,
  ProductScopeLine,
  useOpenAsIdentity,
  WhatsNewSection,
  type HomeBodyProps,
} from "./product-home-parts"

/**
 * The one row shape this layout has.
 *
 * All three lists — your products, the directory, the catalog — are the same
 * object at three sizes: a mark, a name that stretches its own hit area across
 * the whole row, and an arrow that always marks the row as a door. They sit
 * between hairlines rather than inside cards, which is what lets nine of them
 * read as an index instead of nine things competing to be clicked.
 *
 * The fill and the rule both bleed 12px past the type on either side, so the
 * mark never sits flush against the edge of its own highlight while the names
 * still line up with the section label above them. Deliberately untransitioned:
 * the same fill is the row's focus indicator, and fading a focus indicator in
 * delays the one piece of feedback a keyboard user is waiting on
 * (`no-transitioned-focus-ring`).
 */
const INDEX_ROW =
  "group relative flex min-w-0 gap-3 px-3 hover:bg-muted/40 focus-within:bg-muted/40"

/**
 * Hairline-separated stack. The rule is what replaces the card border.
 *
 * Pulled out by the row's own padding, so the rules and the hover fills share
 * one pair of edges instead of the fill sitting 12px proud of the rule above
 * it, which reads as a misalignment rather than as emphasis.
 */
const INDEX_LIST = "-mx-3 flex list-none flex-col divide-y divide-border p-0"

/**
 * The affordance, not the control.
 *
 * The row's whole surface is already the button, so a second focusable arrow
 * beside it would be a duplicate tab stop to the same destination.
 */
const ROW_ARROW =
  "fa-light fa-arrow-right shrink-0 text-xs text-muted-foreground transition-transform group-hover:translate-x-0.5"

/**
 * Stretches a row's name across the row.
 *
 * `py-1.5 -my-1.5` is WCAG 2.5.8: the measured target is this element's own
 * box, not the pseudo-element covering the row, and a bare 14px text line is an
 * 18px target. The padding takes it past 24px; the negative margin keeps the
 * row the height it was. 6px rather than 4 because the scope picker on a
 * product row paints over the bottom of this box, and at 4px the part left
 * unobscured measured 23.5.
 */
const STRETCHED =
  "block w-full py-1.5 -my-1.5 text-start outline-none after:absolute after:inset-0 after:content-[''] focus-visible:ring-3 focus-visible:ring-ring/50"

/* ── Left canvas ──────────────────────────────────────────────────────────── */

/**
 * A section label. Small, sentence case, no rule under it.
 *
 * Named `SectionLabel`, not `Label`: the DS `Label` is a form field label, and a
 * local component sharing that name reads as the primitive to the next person in
 * this file (and to `exxat-ds-check`, which is what flagged it).
 */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-medium text-muted-foreground">{children}</h2>
}

/**
 * A product this workspace owns, as a line of type.
 *
 * No border and no fill, so two products read as two entries rather than two
 * competing panels. The mark is the only colour on the row; the arrow stays
 * muted so it marks the door without competing with the name.
 */
function OwnedRow({
  card,
  onOpen,
}: {
  card: ProductHomeCard
  onOpen: (card: ProductHomeCard) => void
}) {
  // Someone holding two identities in this program is looking at a fork, so the
  // row cannot be one stretched hit area: the name goes back to being a name and
  // the two doors sit where the arrow was. Same pair the card variants offer, from
  // the same helper, so a person does not lose the choice by preferring Spotlight.
  const doors = openableDoors(card)
  const openAsIdentity = useOpenAsIdentity(onOpen)
  const forked = doors.length > 1

  return (
    <li className="min-w-0 list-none">
      <div className={cn(INDEX_ROW, "items-center py-3")}>
        <ProductMarkTile card={card} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* Wraps rather than truncates. At 320 the row has about 130px for a
              name, and a clipped product name is worse than a second line. */}
          <h3 className="flex min-w-0 items-center gap-1.5 text-sm font-medium leading-tight text-balance">
            {/* The name opens the product, and its hit area is the row. A
                button rather than a link because opening a product is a store
                write plus a redirect, not a destination — which is also why the
                arrow beside it is decoration. */}
            {forked ? (
              <span className="min-w-0">{card.label}</span>
            ) : (
              <Button
                type="button"
                variant="ghost"
                aria-label={`Open ${card.label}`}
                className={cn("h-auto justify-start rounded-none p-0 text-sm font-medium hover:bg-transparent", STRETCHED)}
                onClick={() => onOpen(card)}
              >
                {card.label}
              </Button>
            )}
          </h3>
          {/* `relative` lifts the scope picker out of the stretched button's
              reach, or the row would swallow the click and open the product. */}
          <div className="relative -ms-1.5 min-w-0">
            <ProductScopeLine card={card} variant="inline" />
          </div>
        </div>
        {forked ? (
          <div className="relative flex shrink-0 flex-wrap justify-end gap-1.5">
            {doors.map(role => (
              <Button
                key={role}
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Open as ${OPEN_AS_LABEL[role]} in ${card.label}`}
                onClick={() => openAsIdentity(card, role)}
              >
                As {OPEN_AS_LABEL[role]}
              </Button>
            ))}
          </div>
        ) : (
          <i aria-hidden className={ROW_ARROW} />
        )}
      </div>
    </li>
  )
}

/**
 * A shared record hub, as one line.
 *
 * Only the actionable half is spelled out. The total is inventory and belongs
 * in the hub; what earns a line on the home page is the number that is waiting
 * on a person (P13), which is already in the mock and which the other two
 * layouts drop.
 */
function WaitingRow({ object }: { object: AdminObjectSummary }) {
  return (
    <li className="list-none">
      <div className={cn(INDEX_ROW, "items-start py-3")}>
        <i
          className={cn(
            "fa-light mt-1 w-4 shrink-0 text-center text-sm text-muted-foreground",
            object.icon,
          )}
          aria-hidden="true"
        />
        {/* Stacked, not split left and right. Set opposite each other the two
            halves read as a table with one column of names and one of numbers,
            which is a shape that wants alignment this list does not have; under
            the name the status reads as a caption of it, and the row matches
            the name-over-tagline cadence the catalog uses. */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="min-w-0 text-sm font-medium leading-tight">
            <Link to={object.href} className={STRETCHED}>
              {object.label}
            </Link>
          </span>
          <span className="text-xs text-muted-foreground">
            {object.needsAttention > 0 ? (
              <>
                <span className="font-medium tabular-nums text-foreground">
                  {object.needsAttention}
                </span>{" "}
                {object.needsAttentionLabel}
              </>
            ) : (
              "All clear"
            )}
          </span>
        </div>
        <i aria-hidden className={cn(ROW_ARROW, "mt-1")} />
      </div>
    </li>
  )
}

/* ── Right canvas ─────────────────────────────────────────────────────────── */

/**
 * The catalog, as an index rather than a shelf.
 *
 * Hairlines instead of cards. Six bordered tiles on the right made the half of
 * the page you are not working in as loud as the half you are, which is the
 * single biggest reason the first pass did not scan. Set as an index it stays
 * completely readable and stops competing.
 */
function CatalogRow({ card }: { card: ProductHomeCard }) {
  return (
    <li className="min-w-0 list-none">
      <article className={cn(INDEX_ROW, "items-start py-4")}>
        <ProductMarkTile card={card} className="mt-0.5" />

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <h3 className="min-w-0 text-sm font-medium leading-snug">
            {/* Stage as a flex sibling of the name so a wrap does not glue BETA
                to the last word of a three-word product name. */}
            <Link
              to={card.slug}
              className={cn(STRETCHED, "inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1")}
            >
              <span className="min-w-0">{card.label}</span>
              {card.stage ? (
                <StatusBadge status={card.stage} size="sm" className="shrink-0" />
              ) : null}
            </Link>
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{card.tagline}</p>
          {/* A beta product asks for a different move than a finished one, and
              it is the same move on every layout. `relative` lifts the button
              out of the stretched link's reach, or the row would swallow the
              click and navigate instead. */}
          {card.stage === "beta" ? (
            <BetaAccessAction label={card.label} className="relative mt-1.5" />
          ) : null}
        </div>

        <i aria-hidden className={cn(ROW_ARROW, "mt-1")} />
      </article>
    </li>
  )
}

/* ── Canvas ───────────────────────────────────────────────────────────────── */

export function SpotlightHome({
  owned,
  available,
  workspaceName,
  onOpen,
  showYourApp,
  showMoreFromExxat,
}: HomeBodyProps) {
  const navigate = useNavigate()

  // Read once. The clock is not state this page reacts to, and re-reading it
  // during render would make the component's output depend on when React
  // happened to call it.
  const [greeting] = React.useState(() => greetingForHour(new Date().getHours()))

  const records = React.useMemo(() => adminObjectSummaries(), [])
  const waiting = records.reduce((sum, record) => sum + record.needsAttention, 0)

  const featured = available.find(card => card.product === FEATURED_PRODUCT) ?? available[0]
  const [dismissed, setDismissed] = usePersistedState(FEATURED_DISMISSED_KEY, false, {
    debounceMs: 0,
  })
  const showFeatured = Boolean(featured) && !dismissed

  return (
    <div className="flex flex-col gap-10">
      {/* Above both columns rather than inside the left one. In the left column
          it pushed that column's first heading down by its own height, so
          `Your App` and `More from Exxat` started on different lines and the two
          halves read as unrelated. `max-w-xl` keeps the status line to a
          readable measure instead of running the width of the page. */}
      <header className="flex max-w-xl min-w-0 flex-col gap-1.5">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {greeting}, {firstName(NAV_USER.name)}
        </h1>
        <p className="text-sm text-muted-foreground">
          {workspaceName}
          {waiting > 0 ? (
            <>
              {" · "}
              <span className="text-foreground">
                {waiting} {waiting === 1 ? "record is" : "records are"} waiting on someone
              </span>
            </>
          ) : (
            " · Nothing is waiting on you."
          )}
        </p>
      </header>

      {/* A main column and a rail, not two halves. Your apps and the rest
          of the catalog are one reading order — what you have, then what you
          could have — so they stack in the same column; the directory is a
          different kind of thing entirely (records, not products) and sits
          beside them where it can be reached without scrolling past the store.

          Placement is explicit rather than by DOM order, so the stack below
          `lg` can be products, directory, what's new, catalog — your day first,
          marketing last — while the wide screen still puts the directory level
          with the first section. The rail sticks inside the shell's own scroller
          rather than owning one, so the page keeps a single scrollbar
          (`exxat-page-scroll-ownership`).

          Not an even split: the catalog carries a banner whose headline sits
          beside artwork, and at half the page that headline broke onto two
          lines with the drawing crushed into 130px next to it. */}
      <div className="grid items-start gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {!showYourApp ? null : owned.length === 0 ? (
          <div className="min-w-0 lg:col-start-1 lg:row-start-1">
            <NoProductsCard />
          </div>
        ) : (
          <section className="flex min-w-0 flex-col gap-2 lg:col-start-1 lg:row-start-1">
            <SectionLabel>Your App</SectionLabel>
            <ul className={INDEX_LIST}>
              {owned.map(card => (
                <OwnedRow key={card.slug} card={card} onOpen={onOpen} />
              ))}
            </ul>
          </section>
        )}

        {/* Spans the main column's rows so the catalog starts under what's new
            rather than under whichever column happens to be taller — level tops,
            ragged bottoms.

            Everyone but a student, like `HomeDirectorySection` in the other three
            variants. This variant draws its own rail rather than calling that
            component, so it has to carry the same gate itself. */}
        {canReadDirectory() ? (
          <section className="flex min-w-0 flex-col gap-2 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:sticky lg:top-4">
            <SectionLabel>Directory</SectionLabel>
            <ul className={INDEX_LIST}>
              {records.map(object => (
                <WaitingRow key={object.id} object={object} />
              ))}
            </ul>
          </section>
        ) : null}

        <WhatsNewSection
          owned={owned}
          onOpen={onOpen}
          className="min-w-0 lg:col-start-1"
        />

        {showMoreFromExxat ? (
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <SectionLabel>More from Exxat</SectionLabel>

          {/* The DS promo primitive rather than a hand-built one. */}
          {showFeatured && featured ? (
            <MarketingBanner
              layout="hero"
              tone="tint"
              titleAs="h3"
              eyebrow="Featured"
              eyebrowIcon="fa-sparkles"
              title={featured.label}
              media={<ProductIllustration product={featured.product} />}
              primaryAction={{
                label: "Learn more",
                onClick: () => navigate(featured.slug),
              }}
              // No beta opt-in on the banner. The promoted product keeps its row
              // in the index below, which carries `BetaAccessAction` already,
              // and that state is per instance — two controls for one product
              // would have disagreed as soon as either was pressed.
              onDismiss={() => setDismissed(true)}
            >
              {/* Tagline only. The proof stat used to sit here behind a middot,
                  which broke across the line and left the number stranded from
                  the noun it counts. It reads properly on the page Learn more
                  goes to, which is where someone weighing the product is. */}
              {featured.tagline}
            </MarketingBanner>
          ) : null}

          {/* The promoted product keeps its row here too. Holding it out made
              dismissing the banner change the length of the index below it. */}
          <ul className={INDEX_LIST}>
            {available.map(card => (
              <CatalogRow key={card.slug} card={card} />
            ))}
          </ul>
        </section>
        ) : null}
      </div>
    </div>
  )
}
