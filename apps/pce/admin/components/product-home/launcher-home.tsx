"use client"

/**
 * Launcher — every app you own as its own card, with the rest of the catalog
 * and your directory records below it.
 *
 * The fourth `/home` variant. Storefront sells from bordered rows; Spotlight
 * reads as a hairline-divided index; Focus is a row of doors — and Launcher's
 * "Your App" section draws that same door (`OwnedProductTile`, shared with
 * Focus in `product-home-parts.tsx`) rather than a bespoke icon-only cell.
 * An earlier pass here drew flat, borderless grid cells in the style of an OS
 * app launcher (macOS Launchpad, the M365 waffle) — closer to the pattern the
 * doc comment cited, but a flat fill only reads as clickable once the pointer
 * is already on it, and a whole page whose job is "which door do I open"
 * cannot afford a card that does not look like a door until it is touched.
 * Focus's bordered card, its own brand-coloured top wash, and an explicit
 * `Open` button solve exactly that, so Launcher now uses it unchanged.
 *
 * The two variants still differ — not in what a card looks like, but in what
 * sits around it. Focus shows only the doors, with everything else behind a
 * disclosure; Launcher composes the doors with an always-visible Directory
 * row and an inline (never collapsed) `ProductShelves` cross-sell grid below
 * them, so the grouping itself — not the card style — is what tells the
 * reader "these three sections answer three different questions".
 *
 * There is no filter field. A filter earns its keep once scrolling costs more
 * than reading — real workspaces here own on the order of two to six apps, so
 * a search input would be the first control on the page solving a problem
 * that does not exist yet.
 *
 * "More from Exxat" sits last, after What's new — Directory stays next to
 * Your App (workspace records beside the apps that own them), then the digest,
 * then products you do not have yet.
 *
 * The page still opens on the same greeting every other variant leads with
 * (`greetingForHour`). Administrator arrives as an ordinary card from
 * `buildProductHomeInventory` (role-gated in `adminCard`) — the reason the
 * launcher model was worth adding in the first place: elsewhere an admin had
 * to look for the console in the Directory row, beside records instead of
 * beside apps.
 *
 * What this variant still leaves out: activity. "What is waiting" is
 * Spotlight's job, and doing it here would make this a second Spotlight with
 * smaller tiles.
 *
 * "Your App", "Directory", and "More from Exxat" all set their heading with
 * the shared `SectionHeading` — the same one Storefront and the "What's new"
 * digest use. An earlier version of this page gave every label here its own
 * small-caps register instead, which looked deliberate in isolation and then
 * read as a fourth, disagreeing heading style the moment "What's new" (shared
 * by every variant, unstyled per page) sat directly above it.
 */

import * as React from "react"

import { NAV_USER } from "@/lib/mock/navigation"

import {
  firstName,
  greetingForHour,
  HomeDirectorySection,
  NoProductsCard,
  OwnedProductTile,
  ownedGridClassName,
  WhatsNewSection,
  type HomeBodyProps,
} from "./product-home-parts"
import { ProductShelves } from "./product-shelves"
import { SectionHeading } from "./section-heading"

export function LauncherHome({
  owned,
  available,
  workspaceName,
  onOpen,
  showYourApp,
  showMoreFromExxat,
}: HomeBodyProps) {
  // Read once, like Spotlight: the clock is not state this page reacts to, and
  // re-reading it during render would make the heading depend on when React
  // happened to call it.
  const [greeting] = React.useState(() => greetingForHour(new Date().getHours()))

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {greeting}, {firstName(NAV_USER.name)}
        </h1>
        <p className="text-sm text-muted-foreground">{workspaceName}</p>
      </header>

      {!showYourApp ? null : owned.length === 0 ? (
        <NoProductsCard />
      ) : (
        <section className="flex flex-col gap-3">
          <SectionHeading id="launcher-your-app-heading" title="Your App" />
          <ul
            aria-labelledby="launcher-your-app-heading"
            className={ownedGridClassName(owned.length)}
          >
            {owned.map(card => (
              <OwnedProductTile key={card.slug} card={card} onOpen={onOpen} />
            ))}
          </ul>
        </section>
      )}

      <HomeDirectorySection />

      <WhatsNewSection owned={owned} onOpen={onOpen} />

      {showMoreFromExxat && available.length > 0 ? (
        <section className="flex flex-col gap-3">
          <SectionHeading title="More from Exxat" />
          <ProductShelves cards={available} />
        </section>
      ) : null}
    </div>
  )
}
