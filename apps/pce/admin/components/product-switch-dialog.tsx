"use client"

/**
 * Switching apps, resolved where the press happened.
 *
 * A product can be licensed for some programs and not others, so entering one can
 * find that the program you were just in does not exist there. That question used
 * to be asked by the destination: the switch went through, the app opened, and a
 * full page stood in front of it asking which program. The page is a fine answer
 * for someone who typed the URL, and the wrong one here, because pressing "Exxat
 * One" in a menu is not a request to be taken somewhere and interviewed.
 *
 * So the switch owns it. One dialog, three states, off the scope status that
 * already exists:
 *
 *   `open`   the program carries. It names where it is going and goes.
 *   `choose` it cannot carry. Ask with a blocking copy of the school selector
 *            (`ScopeSwitcherPanel` — school header + Change + program rows with
 *            glyphs), inline so nothing opens under the overlay — then open on
 *            an explicit press.
 *   `none`   nothing is licensed there, and the switch does not happen.
 *
 * The opening state is held for {@link MIN_OPENING_MS} after the work is done.
 * A deliberate wait: the point of naming the program is that someone reads it, and
 * a switch that resolves in 80ms would flash a sentence nobody can catch. It
 * replaces `ProductSwitchOverlay` for switcher-initiated switches, which said
 * "Switching product" and named neither the app nor the program.
 *
 * Not every way into a product comes through here. The products home cards carry
 * their own licence-filtered picker, so the program is chosen on the card and
 * there is nothing left to ask, and a typed URL still meets the full-page chooser
 * (`RequireProductScope`), because a dialog floating over a page that cannot
 * render yet is worse than a page that owns the question.
 */

import * as React from "react"
import { Link } from "react-router"

import { ProductTileArt } from "@/components/product-app-mark"
import { ScopeSwitcherPanel } from "@/components/scope-switcher-menu"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useProduct, type Product } from "@/contexts/product-context"
import { useProductSwitch } from "@/contexts/product-route-sync"
import {
  ProductSwitchContext,
  type PendingSwitch,
} from "@/contexts/product-switch-context"
import { useActiveScope, type ActiveScope } from "@/hooks/use-active-scope"
import { PRODUCTS_HOME_PATH } from "@/lib/post-auth-landing"
import { getProductBrand } from "@/lib/product-brand"
import { PRODUCT_TILE_CLASS, productTileStyle } from "@/lib/product-glyph"
import { productLabel } from "@/lib/product-home"
import type { ScopeChild, ScopeConfig, ScopeParent } from "@/lib/scope-switcher"
import { useAppStore } from "@/stores/app-store"

/** How long the opening state stays after the switch finishes. */
const MIN_OPENING_MS = 600

/** Stable, so the close effect does not re-run on every render of a dialog with no provider. */
const NOTHING_PENDING = () => {}

/** Whether a destination config includes this school / program pair. */
function licensesPair(config: ScopeConfig, parentId: string, childId: string): boolean {
  const parent = config.parents.find(p => p.id === parentId)
  if (!parent) return false
  return config.childrenOf(parent).some(c => c.id === childId)
}

export function ProductSwitchProvider({ children }: { children: React.ReactNode }) {
  const { product: active, activeCustomIndex } = useProduct()
  const switchProduct = useProductSwitch()
  const [pending, setPending] = React.useState<PendingSwitch | null>(null)

  const request = React.useCallback(
    (product: Product, customIndex?: number) => {
      // Pressing the app you are already in changes no scope, so there is nothing
      // to ask and nothing to announce: it is a way back to that app's dashboard.
      const same =
        product === active && (customIndex === undefined || customIndex === activeCustomIndex)
      if (same) {
        switchProduct(product, customIndex)
        return
      }
      setPending({ product, customIndex })
    },
    [active, activeCustomIndex, switchProduct],
  )

  const cancel = React.useCallback(() => setPending(null), [])

  const value = React.useMemo(
    () => ({ pending, request, cancel }),
    [cancel, pending, request],
  )

  return (
    <ProductSwitchContext.Provider value={value}>{children}</ProductSwitchContext.Provider>
  )
}

export function ProductSwitchDialog() {
  // Mounted by the same shell as the provider, so the fallbacks only cover a shell
  // that renders one without the other, where there is nothing pending to show.
  const requests = React.useContext(ProductSwitchContext)
  const pending = requests?.pending ?? null
  const cancel = requests?.cancel ?? NOTHING_PENDING
  const switchProduct = useProductSwitch()
  const switching = useAppStore(s => s.productSwitching)
  const { product: active } = useProduct()

  // Program you are leaving — the open scope of the app still under you, not
  // `scope-last` alone. First-visit adoption writes product scope without writing
  // the family record, and trusting only `scope-last` let the destination open
  // its own remembered program while skipping the ask.
  const source = useActiveScope(active)
  const scope = useActiveScope(pending?.product ?? active, pending?.customIndex)

  const left =
    source.parent && source.child
      ? { parent: source.parent, child: source.child }
      : null
  const leftCarries = left ? licensesPair(scope.config, left.parent.id, left.child.id) : null
  // Ask when the app you are leaving has a program the destination does not
  // serve — even if the destination would otherwise open (`"open"` from its own
  // memory). Also ask when the destination itself resolves to `"choose"`.
  const mustAsk =
    pending !== null &&
    ((left !== null && leftCarries === false) || scope.status === "choose")

  // The moment of the press, for the minimum dwell. Set on commit and cleared on
  // close, so it doubles as "the scope is written, this is going through".
  const [committedAt, setCommittedAt] = React.useState<number | null>(null)
  const busy = committedAt !== null

  // Named at commit (carry or pick), so Opening still shows the pair if the
  // destination scope re-resolves while navigation is in flight.
  const [openingWhere, setOpeningWhere] = React.useState<string | null>(null)

  const close = React.useCallback(() => {
    setCommittedAt(null)
    setOpeningWhere(null)
    cancel()
  }, [cancel])

  const commit = React.useCallback(
    (where: string | null) => {
      if (!pending) return
      setOpeningWhere(where)
      setCommittedAt(Date.now())
      switchProduct(pending.product, pending.customIndex)
    },
    [pending, switchProduct],
  )

  const selectDestScope = scope.selectScope
  const destStatus = scope.status
  const destParent = scope.parent
  const destChild = scope.child

  // Carry the program you left, or open when there was nothing to ask about.
  // Never auto-commit while `mustAsk` — that path used to flash Opening with the
  // destination's own memory.
  React.useEffect(() => {
    if (!pending || busy || mustAsk) return

    if (left && leftCarries) {
      selectDestScope(left.parent, left.child)
      commit(`${left.parent.name} · ${left.child.name}`)
      return
    }

    if (destStatus === "open" && destParent && destChild) {
      commit(`${destParent.name} · ${destChild.name}`)
    }
  }, [
    busy,
    commit,
    destChild,
    destParent,
    destStatus,
    left,
    leftCarries,
    mustAsk,
    pending,
    selectDestScope,
  ])

  // Close once the switch has landed *and* the message has been up long enough to
  // read. Either can be the last to arrive, so both are waited on.
  React.useEffect(() => {
    if (committedAt === null || switching) return
    const remaining = MIN_OPENING_MS - (Date.now() - committedAt)
    if (remaining <= 0) {
      close()
      return
    }
    const timer = window.setTimeout(close, remaining)
    return () => window.clearTimeout(timer)
  }, [close, committedAt, switching])

  if (!pending) return null

  const name = productLabel(pending.product)
  const showsOpening = busy || (!mustAsk && scope.status === "open")
  // Choosing is a hard stop: the page behind stays unreachable until a program
  // is pressed or the close control / Esc backs out. Outside click never
  // dismisses — that would look like an accidental miss of a nested menu.
  const blockingChoice = mustAsk && !busy

  return (
    <Dialog
      open
      onOpenChange={next => {
        if (!next && !busy) cancel()
      }}
      modal
    >
      <DialogContent
        // Above a running coach mark, which sits at z-[60] over a z-[55] scrim so a
        // tour can point at the shell. Dialogs live at z-50, and the first-run
        // dashboard tour is exactly the moment someone tries the switcher, so
        // without this the tour covers the question and takes the clicks. A switch
        // that was asked for outranks a tour that was not.
        className="z-[70] sm:max-w-lg"
        overlayClassName="z-[65]"
        showCloseButton={!busy}
        aria-busy={busy || undefined}
        // Radix's own opt-out, for the one state that has no description to point
        // at: a product with no scope to name while it opens. The key has to be
        // absent, not undefined, everywhere else, or it would override those too.
        {...(showsOpening && !openingWhere && !(scope.parent && scope.child)
          ? { "aria-describedby": undefined }
          : null)}
        onEscapeKeyDown={event => {
          if (busy) event.preventDefault()
        }}
        onInteractOutside={event => {
          if (busy || blockingChoice) event.preventDefault()
        }}
        onPointerDownOutside={event => {
          if (busy || blockingChoice) event.preventDefault()
        }}
      >
        {showsOpening ? (
          <Opening
            name={name}
            where={
              openingWhere ??
              (scope.parent && scope.child
                ? `${scope.parent.name} · ${scope.child.name}`
                : null)
            }
          />
        ) : (
          <SwitchScope
            name={name}
            product={pending.product}
            scope={scope}
            onPick={(parent, child) => {
              scope.selectScope(parent, child)
              commit(`${parent.name} · ${child.name}`)
            }}
            onCancel={cancel}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/** School and program under the title, because a switch can cross either. */
function Opening({ name, where }: { name: string; where: string | null }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{`Opening ${name}`}</DialogTitle>
        {where ? <DialogDescription>{where}</DialogDescription> : null}
      </DialogHeader>
      <div className="flex items-center justify-center py-6">
        <i
          className="fa-light fa-spinner-third fa-spin text-xl text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </>
  )
}

/**
 * Blocking program chooser: the utility-bar school selector, in the dialog.
 * Same school header + Change + program glyphs; no nested dropdown under the
 * overlay. Outside click does not dismiss; Esc / close still backs out.
 */
function SwitchScope({
  name,
  product,
  scope,
  onPick,
  onCancel,
}: {
  name: string
  product: Product
  scope: ActiveScope
  onPick: (parent: ScopeParent, child: ScopeChild) => void
  onCancel: () => void
}) {
  const { config } = scope
  const noun = config.childNoun.toLowerCase()

  if (scope.status === "none") {
    return <NoScope name={name} noun={noun} onCancel={onCancel} />
  }

  const count = config.parents.reduce(
    (total, parent) => total + config.childrenOf(parent).length,
    0,
  )

  return (
    <>
      <DialogHeader className="gap-3 sm:text-start">
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden
            data-fixed-ink=""
            style={productTileStyle(
              getProductBrand(product)?.brandColor ?? "var(--brand-color)",
            )}
            className={PRODUCT_TILE_CLASS}
          >
            <ProductTileArt product={product} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <DialogTitle>{config.choosePrompt}</DialogTitle>
            <DialogDescription>
              {`${name} does not include the ${noun} you were in. Pick one of ${count} ${count === 1 ? noun : `${noun}s`} to open.`}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <ScopeSwitcherPanel
        config={config}
        suggestedParentId={scope.suggestedParent?.id ?? null}
        onPick={onPick}
        className="max-h-[min(60vh,28rem)] overflow-y-auto"
      />
    </>
  )
}

function NoScope({
  name,
  noun,
  onCancel,
}: {
  name: string
  noun: string
  onCancel: () => void
}) {
  const { product } = useProduct()

  return (
    <>
      <DialogHeader>
        <DialogTitle>{`No ${noun}s in ${name}`}</DialogTitle>
        <DialogDescription>
          {`Your account is not in a ${noun} that ${name} covers. Ask your administrator to add one, or stay in ${productLabel(product)}.`}
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" asChild>
          <Link to={PRODUCTS_HOME_PATH}>Your apps</Link>
        </Button>
        <Button onClick={onCancel}>{`Stay in ${productLabel(product)}`}</Button>
      </div>
    </>
  )
}
