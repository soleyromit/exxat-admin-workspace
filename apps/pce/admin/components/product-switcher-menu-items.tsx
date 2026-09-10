"use client"

/**
 * Body of the product switcher menu — shared by the sidebar trigger
 * (`ProductLogoButton` in `sidebar/app-sidebar.tsx`) and the utility bar
 * trigger (`UtilityBarProductSwitcher`).
 *
 * One list used to run top to bottom with a single "Switch product" label on
 * it, which said nothing about the difference between the products this
 * workspace pays for and the six it does not. The reader had to already know.
 * The menu now splits on entitlement, in the same groups and the same words the
 * products home uses, so the two surfaces tell one story.
 *
 * Entitlement decides where a row goes *and* what it does. Owned products
 * switch. Unowned ones open their marketing page, because switching into a
 * product nobody here has bought answers a question they did not ask.
 *
 * Both triggers render this so the groups, order, and copy cannot drift apart.
 */

import * as React from "react"
import { Link } from "react-router"

import { ProductSwitcherMenuRowLabel } from "@/components/exxat-product-logo"
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { StatusBadge } from "@/components/ui/status-badge"
import { ProductArt } from "@/components/product-app-mark"
import { useRequestProductSwitch } from "@/contexts/product-switch-context"
import { useProduct } from "@/contexts/product-context"
import {
  catalogStageRank,
  findCatalogEntry,
  isProductEntitled,
} from "@/lib/mock/product-catalog"
import {
  NEUTRAL_TILE_CLASS,
  TILE_GLYPH_SIZE_CLASS,
  TILE_MARK_SIZE_CLASS,
} from "@/lib/product-glyph"
import { orderedDirectoryLaunchSummaries, productHomeSlug } from "@/lib/product-home"
import {
  expandSwitcherProducts,
  type SwitcherProductEntry,
} from "@/lib/product-switcher-catalog"
import { cn } from "@/lib/utils"
import { canReadDirectory, isWorkspaceAdmin } from "@/lib/workspace-role"
import type { CustomProductBrand } from "@/stores/app-store"

/**
 * Wider than `SHELL_IDENTITY_MENU_SURFACE_CLASS`, which this menu used to share
 * with the scope switcher.
 *
 * That width is sized for a menu whose rows are a name and nothing else. These
 * rows carry a glyph tile, a product name, a stage badge, and a count or a
 * tick, and at 18rem the two longest names — "Surveys & Course Evaluations" and
 * "Student & Program Success" — wrapped to a second line to make room for the
 * badge beside them. Wrapping is the right fallback and it stays as one, but it
 * should not be the resting state for a quarter of the list.
 *
 * The cap still keeps the menu inside the viewport at Windows 125–150% display
 * scaling, where the CSS viewport shrinks without `visualViewport.scale`
 * changing.
 */
export const PRODUCT_SWITCHER_MENU_SURFACE_CLASS =
  "w-84 max-w-[min(100vw-2rem,21rem)]" as const

/** Custom products are authored by this workspace, so they are owned by definition. */
function isEntitledEntry(entry: SwitcherProductEntry): boolean {
  if (entry.customIndex !== undefined) return true
  return isProductEntitled(entry.id)
}

function entryKey(entry: SwitcherProductEntry): string {
  return entry.customIndex !== undefined ? `${entry.id}-${entry.customIndex}` : entry.id
}

/** A custom product has no catalog entry, so it has no stage to be promoted by. */
function stageRankOf(entry: SwitcherProductEntry): number {
  return catalogStageRank(
    entry.customIndex === undefined ? findCatalogEntry(entry.id)?.stage : undefined,
  )
}

/**
 * A product you own: selecting it switches you into it.
 *
 * Scope and stage sit right of the name; the tick is the only thing pinned to
 * the far edge, so "which one am I in" is answered by looking down one column
 * rather than reading each row.
 */
function OwnedProductRow({
  entry,
  current,
  previewCustomBrand,
  onSelect,
}: {
  entry: SwitcherProductEntry
  current: boolean
  previewCustomBrand?: CustomProductBrand
  onSelect: () => void
}) {
  return (
    <DropdownMenuItem
      onClick={onSelect}
      className="items-center gap-2 py-1.5"
      aria-selected={current}
      aria-label={entry.label}
    >
      <ProductSwitcherMenuRowLabel
        product={entry.id}
        previewCustomBrand={previewCustomBrand}
        label={entry.label}
      />
      {entry.scope ? (
        <span className="shrink-0 text-xs font-medium text-muted-foreground" aria-hidden="true">
          {entry.scope}
        </span>
      ) : null}
      {current ? (
        <i className="fa-solid fa-check ms-auto shrink-0 text-xs text-brand dark:text-brand-color-light" aria-hidden="true" />
      ) : null}
    </DropdownMenuItem>
  )
}

/**
 * A product you do not own: selecting it opens what it is, not the thing itself.
 *
 * These rows used to switch, which dropped you inside an unfamiliar product with
 * no explanation of what it did or how to get it — the answer to "what is
 * Accreditation" is a page that already exists at `/home/<slug>`, and this is
 * the only place in the shell that asks the question. The arrow says the row
 * leaves the menu rather than changing what you are in, since every other row
 * here does the opposite.
 */
function CatalogProductRow({ entry }: { entry: SwitcherProductEntry }) {
  // Custom products have no catalog entry, and no stage to report either.
  const stage = entry.customIndex === undefined ? findCatalogEntry(entry.id)?.stage : undefined

  return (
    <DropdownMenuItem asChild className="group items-center gap-2 py-1.5">
      <Link
        to={`/home/${productHomeSlug(entry.id, entry.customIndex)}`}
        // The stage is repeated here because `aria-label` replaces the row's
        // contents rather than adding to them, so the NEW and BETA badges stop
        // being announced the moment this attribute exists.
        aria-label={`${entry.label}${stage ? `, ${stage}` : ""}. Learn what it does`}
      >
        <ProductSwitcherMenuRowLabel product={entry.id} label={entry.label} />
        {stage ? <StatusBadge status={stage} size="sm" className="shrink-0" /> : null}
        <i
          className="fa-light fa-arrow-right ms-auto shrink-0 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100"
          aria-hidden="true"
        />
      </Link>
    </DropdownMenuItem>
  )
}

/**
 * Group heading.
 *
 * Title only. Each group used to carry a line explaining itself ("Included in
 * your plan.", "Maintained once."), which is three sentences of chrome in a
 * menu whose whole job is to be scanned, restating what the heading and the
 * grouping already say.
 */
function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
      {children}
    </DropdownMenuLabel>
  )
}

/**
 * Administrator and the shared record hubs.
 *
 * These are not campus apps and never appear in Your App, but they are what
 * every app in that group reads from, and the switcher is where someone goes
 * when they want to be somewhere else. Leaving them out of the one menu that
 * lists every destination meant the only way to reach them was to already be
 * on the home page.
 *
 * Same heading and same order as the Campus home Workspace section, so the two
 * surfaces tell one story. Personnel Management is site-scoped and is not a
 * Workspace row.
 */
/**
 * Icon for a row that goes somewhere rather than opening an app.
 *
 * No tile, because these are not products and should not look like one, but the
 * same footprint a tile takes, so every label in the menu starts on the same
 * vertical line instead of one row stepping left.
 *
 * Same glyph size as the tiled rows below. The tile is what says "product"; a
 * smaller glyph as well would step the icon column twice for one distinction.
 */
function UtilityIcon({ icon }: { icon: string }) {
  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center" aria-hidden="true">
      <i className={cn("fa-light text-muted-foreground", TILE_GLYPH_SIZE_CLASS, icon)} />
    </span>
  )
}

function WorkspaceRows() {
  const { product } = useProduct()
  const records = React.useMemo(() => orderedDirectoryLaunchSummaries(), [])
  const showAdmin = isWorkspaceAdmin()
  // Everyone but a student, on the same predicate as the `/people` and `/courses`
  // routes these link to. A wider gate than the Administrator row below
  // deliberately: these are the rosters a coordinator works from, not the
  // console that configures the workspace.
  const showRecords = canReadDirectory()
  if (!showAdmin && !showRecords) return null

  return (
    <>
      <DropdownMenuSeparator />
      <GroupLabel>Workspace</GroupLabel>
      {showRecords
        ? records.map(object => (
            <DropdownMenuItem key={object.id} asChild className="items-center gap-2.5 py-1.5">
              <Link to={object.href}>
                <span className={NEUTRAL_TILE_CLASS} aria-hidden="true">
                  <i className={cn("fa-light", TILE_GLYPH_SIZE_CLASS, object.icon)} />
                </span>
                <span className="min-w-0 flex-1 truncate">{object.label}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {object.total}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        : null}
      {showAdmin ? (
        <DropdownMenuItem asChild className="items-center gap-2.5 py-1.5">
          <Link to="/admin">
            {/* Neutral tile between branded products: the console is not a product
                with an identity of its own. The console's own mark rather than a
                shield glyph — Compliance's mark is a shield, and two shields in
                one menu is one shield too many. */}
            <span className={NEUTRAL_TILE_CLASS} aria-hidden="true">
              <ProductArt
                product="exxat-admin"
                markClassName={TILE_MARK_SIZE_CLASS}
                glyphClassName={TILE_GLYPH_SIZE_CLASS}
              />
            </span>
            <span className="min-w-0 flex-1 truncate">Administrator</span>
            {product === "exxat-admin" ? (
              <i
                className="fa-solid fa-check ms-auto shrink-0 text-xs text-brand dark:text-brand-color-light"
                aria-hidden="true"
              />
            ) : null}
          </Link>
        </DropdownMenuItem>
      ) : null}
    </>
  )
}

export function ProductSwitcherMenuItems() {
  const { product, customProducts, activeCustomIndex, hiddenProducts } = useProduct()
  // Requests the switch rather than performing it: the destination may be licensed
  // for programs this one is not, and `ProductSwitchDialog` is what asks.
  const switchProduct = useRequestProductSwitch()

  const products = React.useMemo(
    () => expandSwitcherProducts(customProducts, hiddenProducts),
    [customProducts, hiddenProducts],
  )
  const owned = React.useMemo(() => products.filter(isEntitledEntry), [products])
  // Betas lead here too, on the home's rank, since the two lists carry the same
  // heading and a reader who saw one order and then the other would take them for
  // two different lists.
  const more = React.useMemo(
    () =>
      products
        .filter(p => !isEntitledEntry(p))
        .sort((a, b) => stageRankOf(a) - stageRankOf(b)),
    [products],
  )

  const isCurrentProduct = React.useCallback(
    (entry: SwitcherProductEntry) =>
      entry.id === product &&
      (entry.customIndex === undefined || entry.customIndex === activeCustomIndex),
    [activeCustomIndex, product],
  )

  return (
    <>
      {/* The way back to `/home`, at the top rather than in the footer.
          As "All apps" at the foot it read as a wider sibling of the rows above
          it, so a reader looking for their app scanned it as one more option
          and passed it. `/home` is not another app: it is the page the apps sit
          on. Named for the place it goes and put where a reader looks first for
          a way out, it stops competing with the list it introduces. */}
      <DropdownMenuItem asChild className="items-center gap-2.5 py-1.5">
        <Link to="/home">
          <UtilityIcon icon="fa-house" />
          Home
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />

      <GroupLabel>Your App</GroupLabel>
      {owned.map(entry => (
        <OwnedProductRow
          key={entryKey(entry)}
          entry={entry}
          current={isCurrentProduct(entry)}
          previewCustomBrand={
            entry.customIndex !== undefined ? customProducts[entry.customIndex] : undefined
          }
          onSelect={() => switchProduct(entry.id, entry.customIndex)}
        />
      ))}

      <WorkspaceRows />

      {more.length > 0 ? (
        <>
          <DropdownMenuSeparator />
          <GroupLabel>More from Exxat</GroupLabel>
          {more.map(entry => (
            <CatalogProductRow key={entryKey(entry)} entry={entry} />
          ))}
        </>
      ) : null}
    </>
  )
}
