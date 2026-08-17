"use client"

/**
 * UtilityBarWhatsNew — release updates, either for the product the user is in or
 * across every product they own.
 *
 * A `Popover`, not a `DropdownMenu`: each update is a sentence of prose plus one
 * action, not a list of commands, which is the same reason `WhatsNewBadge` on
 * the product tiles picked a popover.
 *
 * On the narrow utility bar the icon folds into **More** (`UtilityBarWhatsNewMenuItem`
 * + shared panel). Desktop keeps the megaphone icon.
 *
 * Reads and writes the seen list through `useWhatsNewSeen`, so an update
 * dismissed here also clears its badge on the product tile and its row in the
 * `/home` digest. Those are the same fact shown three times, not three things
 * to dismiss.
 *
 * Notes are filtered by role before they are counted (`visibleWhatsNew`), so a
 * student is not told about bulk cohort overrides and a coordinator is not told
 * about their own timesheet. Cross-product news like Ask Leo is untagged and
 * reaches both.
 *
 * `scope="workspace"` is what the products home mounts. The button used to be
 * left off that page because the digest below already carried the same notes,
 * but the digest disappears once every note is read, which left the one page
 * about all your products as the only page with no way to look back at what
 * shipped. In that mode the panel spans products, so each row names the product
 * it came from and the heading drops the product name it cannot claim.
 */

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useWhatsNewSeen } from "@/components/product-home/product-home-parts"
import { useProduct } from "@/contexts/product-context"
import { findCatalogEntry } from "@/lib/mock/product-catalog"
import {
  buildProductHomeInventory,
  collectWhatsNewUpdates,
  productHomeSlug,
  productLabel,
  visibleWhatsNew,
  whatsNewUpdateId,
} from "@/lib/product-home"
import { cn } from "@/lib/utils"

/**
 * `whatsNew` is newest first. Four is what fits without the popover becoming a
 * changelog page; older entries stay in the `/home` digest.
 *
 * The cap is per panel, not per product, so in workspace mode a fifth note in a
 * fourth product is not counted either. Counting notes the panel will not show
 * would put a number on the button that reading it never clears.
 */
const MAX_VISIBLE_UPDATES = 4

/** What scope a row's update belongs to, flattened for rendering. */
interface PanelUpdate {
  id: string
  title: string
  body: string
  /** Product this came from. Set in workspace mode only, where rows span products. */
  source?: string
}

interface WhatsNewModel {
  updates: PanelUpdate[]
  unseen: PanelUpdate[]
  heading: string
  dismiss: (id: string) => void
  seenIds: Set<string>
}

function useWhatsNewModel(scope: "product" | "workspace"): WhatsNewModel | null {
  const { product, customProducts, hiddenProducts } = useProduct()
  const { seen, dismiss } = useWhatsNewSeen()

  const updates = React.useMemo<PanelUpdate[]>(() => {
    if (scope === "workspace") {
      // Owned only. Marketing a product's release notes to someone who cannot
      // open it is the "available" half of the home's job, not this button's.
      const { owned } = buildProductHomeInventory(customProducts, hiddenProducts)
      return collectWhatsNewUpdates(owned)
        .slice(0, MAX_VISIBLE_UPDATES)
        .map(({ id, card, item }) => ({
          id,
          title: item.title,
          body: item.body,
          source: card.label,
        }))
    }

    const slug = productHomeSlug(product)
    // Workspace mode gets its filtering from the cards it reads; product mode
    // reads the catalog directly, so it asks for itself.
    return visibleWhatsNew(findCatalogEntry(product)?.whatsNew)
      .slice(0, MAX_VISIBLE_UPDATES)
      .map(item => ({
        id: whatsNewUpdateId(slug, item.title),
        title: item.title,
        body: item.body,
      }))
  }, [scope, product, customProducts, hiddenProducts])

  return React.useMemo(() => {
    if (updates.length === 0) return null
    const seenIds = new Set(seen)
    const unseen = updates.filter(update => !seenIds.has(update.id))
    const heading =
      scope === "workspace"
        ? "What\u2019s new"
        : `What\u2019s new in ${productLabel(product)}`
    return { updates, unseen, heading, dismiss, seenIds }
  }, [updates, seen, dismiss, scope, product])
}

function WhatsNewPopoverBody({ model }: { model: WhatsNewModel }) {
  const contentRef = React.useRef<HTMLDivElement>(null)

  return (
    <PopoverContent
      ref={contentRef}
      align="end"
      tabIndex={-1}
      className="w-80 p-0"
      onOpenAutoFocus={event => {
        // "Got it" is the only focusable child, so the default lands there:
        // open the panel, press Enter, and the count is gone before a word of
        // it has been read. Park focus on the panel and let the user Tab to it.
        event.preventDefault()
        contentRef.current?.focus()
      }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-sm font-medium">{model.heading}</span>
        {model.unseen.length > 0 ? (
          <Button
            type="button"
            variant="link"
            size="xs"
            className="h-auto p-0 text-xs font-medium"
            onClick={() => {
              for (const update of model.unseen) model.dismiss(update.id)
            }}
          >
            Got it
          </Button>
        ) : null}
      </div>
      <div className="h-px bg-border" />
      <ScrollArea className="max-h-80" viewportLabel="Recent updates">
        <ul className="flex flex-col gap-1 p-1">
          {model.updates.map(update => {
            const isUnseen = !model.seenIds.has(update.id)
            return (
              <li
                key={update.id}
                className={cn(
                  "flex items-start gap-2 rounded-md px-2 py-2",
                  isUnseen && "bg-sidebar-accent/40",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    isUnseen ? "bg-primary" : "bg-transparent",
                  )}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {update.source ? (
                    // Same eyebrow the tile badge's popover uses, for the same
                    // reason: across products the title alone does not say
                    // which product changed.
                    <span className="text-2xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
                      New in {update.source}
                    </span>
                  ) : null}
                  <span className="text-sm font-semibold leading-snug">
                    {update.title}
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    {update.body}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </ScrollArea>
    </PopoverContent>
  )
}

/** Desktop / roomy bar — megaphone icon with unread count. */
export function UtilityBarWhatsNew({
  className,
  scope = "product",
}: {
  className?: string
  scope?: "product" | "workspace"
}) {
  const model = useWhatsNewModel(scope)
  const [open, setOpen] = React.useState(false)

  // Nothing shipped yet, for this product or for any owned one. An
  // always-present button with an empty panel behind it would be a promise the
  // bar cannot keep.
  if (!model) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={
                model.unseen.length > 0
                  ? `What's new, ${model.unseen.length} unread`
                  : "What's new"
              }
              className={cn("relative", className)}
            >
              <i className="fa-light fa-megaphone text-sm" aria-hidden="true" />
              {model.unseen.length > 0 ? (
                <Badge
                  variant="count"
                  className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-2xs"
                >
                  {model.unseen.length}
                </Badge>
              ) : null}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">What&apos;s new</TooltipContent>
      </Tooltip>

      <WhatsNewPopoverBody model={model} />
    </Popover>
  )
}

/**
 * Narrow bar — What's new lives only under More. Renders the menu row plus the
 * shared popover, anchored to the More trigger cluster.
 */
export function UtilityBarWhatsNewInMore({
  scope = "product",
  children,
}: {
  scope?: "product" | "workspace"
  /** More menu trigger (+ anything that should share the popover anchor). */
  children: (args: {
    menuItem: React.ReactNode
    unseenCount: number
  }) => React.ReactNode
}) {
  const model = useWhatsNewModel(scope)
  const [open, setOpen] = React.useState(false)

  const menuItem =
    model == null ? null : (
      <DropdownMenuItem
        className="gap-2"
        onSelect={event => {
          // Keep the menu from stealing focus before the popover opens.
          event.preventDefault()
          queueMicrotask(() => setOpen(true))
        }}
      >
        <i className="fa-light fa-megaphone w-4 text-center text-sm" aria-hidden="true" />
        <span className="flex-1">What&apos;s new</span>
        {model.unseen.length > 0 ? (
          <Badge variant="count" className="h-4 min-w-4 px-1 text-2xs">
            {model.unseen.length}
          </Badge>
        ) : null}
      </DropdownMenuItem>
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <span className="inline-flex">
          {children({
            menuItem,
            unseenCount: model?.unseen.length ?? 0,
          })}
        </span>
      </PopoverAnchor>
      {model ? <WhatsNewPopoverBody model={model} /> : null}
    </Popover>
  )
}
