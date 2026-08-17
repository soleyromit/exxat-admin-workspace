"use client"

/**
 * Active school > program (or brand > site > location) selection for a product.
 *
 * The utility bar's scope switcher used to hold this in component state, which
 * meant the choice died on reload and nothing else could read it. The products
 * home needs to both show and set the scope before the user has even entered
 * the product, so the selection has to live somewhere both surfaces share.
 *
 * `usePersistedState` is deliberately not used here: it only syncs across
 * browser *tabs*, so two hook instances in the same document would hold
 * independent copies of the same key and drift apart the moment one of them
 * wrote. This is a small external store instead — one snapshot per key, every
 * subscriber notified on write — with the same storage envelope shape so it
 * can move to `usePersistedState` if that ever gains in-page sync.
 *
 * Persisted per product: Prism's school is not One — Sites' brand, and the two
 * scope hierarchies do not even have the same shape.
 *
 * ## One rule: the program never changes without an explicit press
 *
 * A product is licensed for some programs and not others (`scopeGrantFor`), so
 * entering one can find that the program you were just in does not exist there.
 * The old answer was to quietly substitute a default, which meant a coordinator
 * could read a different cohort's records believing they had carried their
 * context across. Resolution now has three outcomes:
 *
 *   `open`   — there is a licensed scope and no question about which. Either the
 *              one this product last showed (when the program you left is also
 *              licensed here), or the one this session last chose anywhere in
 *              this hierarchy when it is licensed here too, or, for a session
 *              that has never chosen at all, the workspace's own program.
 *   `choose` — licensed scopes exist but none of them is the program you left,
 *              or this product has no memory that can open. Nothing renders until
 *              a press — including when there is only one option, and including
 *              when this product still remembers a *different* licensed program
 *              (restoring that memory would silently move them).
 *   `none`   — nothing licensed here. A dead end rather than a default, and a
 *              signal that product and scope entitlement disagree.
 *
 * The hazard is a **change**, so a session with nothing to change from is not
 * asked: on a first ever visit the workspace's own school and program open, which
 * is what the app has always shown. The question only appears once this session
 * has chosen something that the destination cannot honour.
 *
 * Two records back this, and the split matters:
 *
 *   `<slug>:scope`       what this product last showed you. Written on arrival
 *                        too, so a product does not drift between visits.
 *   `scope-last:<family>` what you last *chose*, across products. Only a press
 *                        writes it, which is what makes it safe to inherit from.
 *
 * A session that does not choose its own scope (`isScopeFixed`, a student
 * enrolled in one program at one school) is never asked. It has one scope, so
 * resolution is a licence check: their program, or nothing.
 */

import * as React from "react"

import { getStorageItem, setStorageItem } from "@exxatdesignux/ui/lib/persisted-state"

import type { Product } from "@/contexts/product-context"
import {
  scopeConfigForProduct,
  type ScopeChild,
  type ScopeConfig,
  type ScopeFamily,
  type ScopeParent,
} from "@/lib/scope-switcher"
import { productPersistKey, useAppStore } from "@/stores/app-store"
import { isScopeFixed } from "@/lib/workspace-role"

const SCOPE_VERSION = 1

interface StoredScope {
  parentId: string
  childId: string
}

const listeners = new Set<() => void>()
/** One canonical object per key so `getSnapshot` stays referentially stable. */
const snapshots = new Map<string, StoredScope>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

function readScope(key: string): StoredScope | null {
  const cached = snapshots.get(key)
  if (cached) return cached

  const raw = getStorageItem(key)
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      (parsed as { v?: number }).v === SCOPE_VERSION
    ) {
      const data = (parsed as { d?: unknown }).d
      if (
        typeof data === "object" &&
        data !== null &&
        typeof (data as StoredScope).parentId === "string" &&
        typeof (data as StoredScope).childId === "string"
      ) {
        snapshots.set(key, data as StoredScope)
        return data as StoredScope
      }
    }
  } catch {
    // Unparseable payload — treat as absent and let the defaults win.
  }
  return null
}

function writeScope(key: string, value: StoredScope) {
  snapshots.set(key, value)
  setStorageItem(key, JSON.stringify({ v: SCOPE_VERSION, d: value }))
  for (const listener of listeners) listener()
}

/**
 * Where a hierarchy's most recent choice lives, across products.
 *
 * Not product-namespaced on purpose, and the one exception to the rule that
 * scope state is per product: it is the record of what this person last worked
 * in, which is exactly the thing a first visit to a neighbouring product should
 * be able to inherit.
 */
function familyKey(family: ScopeFamily): string {
  return `scope-last:${family}`
}

/** What a product can do with the scope it was asked for. */
export type ScopeStatus = "open" | "choose" | "none"

export interface ActiveScope {
  config: ScopeConfig
  status: ScopeStatus
  /** Null unless `status` is `"open"`. */
  parent: ScopeParent | null
  /** Null unless `status` is `"open"`. */
  child: ScopeChild | null
  /**
   * The parent to open the chooser on when `status` is `"choose"` — the school
   * this session last worked in, when the product is licensed for it, so a
   * coordinator whose program moved does not have to find their school again.
   */
  suggestedParent: ScopeParent | null
  /** Also moves the child to the new parent's first licensed option. */
  selectParent: (parent: ScopeParent) => void
  selectChild: (child: ScopeChild) => void
  /**
   * Both halves at once, for the chooser: before the first press there is no
   * parent for a child to hang on, and the row that was pressed names both.
   */
  selectScope: (parent: ScopeParent, child: ScopeChild) => void
}

interface ResolvedScope {
  parent: ScopeParent
  child: ScopeChild
}

/** The stored pair, if both halves are still licensed. */
function resolve(config: ScopeConfig, stored: StoredScope | null): ResolvedScope | null {
  if (!stored) return null
  const parent = config.parents.find(p => p.id === stored.parentId)
  if (!parent) return null
  const child = config.childrenOf(parent).find(c => c.id === stored.childId)
  return child ? { parent, child } : null
}

/**
 * The workspace's own school and program, when this product is licensed for it.
 *
 * The only scope that opens without having been chosen. Justified by what it is:
 * not a guess among several, but the one pair the whole workspace is named after,
 * and the pair every surface showed before scope was licensed at all. If a
 * product does not serve it there is no second guess, the question gets asked.
 */
function workspaceDefault(config: ScopeConfig): ResolvedScope | null {
  return resolve(config, {
    parentId: config.defaultParent.id,
    childId: config.defaultChild.id,
  })
}

export function useActiveScope(product: Product, customIndex?: number): ActiveScope {
  const config = React.useMemo(() => scopeConfigForProduct(product), [product])
  const customProducts = useAppStore(s => s.customProducts)
  const activeCustomIndex = useAppStore(s => s.activeCustomIndex)

  const key = React.useMemo(
    () =>
      productPersistKey(
        product,
        "scope",
        customProducts,
        customIndex ?? activeCustomIndex,
      ),
    [product, customProducts, customIndex, activeCustomIndex],
  )

  const lastKey = familyKey(config.family)

  const stored = React.useSyncExternalStore(
    subscribe,
    () => readScope(key),
    () => null,
  )
  const last = React.useSyncExternalStore(
    subscribe,
    () => readScope(lastKey),
    () => null,
  )

  // A session that cannot choose its scope has exactly one, so there is nothing
  // to remember and nothing to ask: their program, or this product does not serve
  // them. Read here rather than at the switchers because it changes what
  // resolution *means*, not just how the trigger looks.
  const fixed = isScopeFixed()

  // A stored id goes stale when the licensed set changes underneath it, or when
  // it was written by a product licensed for more than this one is, so neither
  // record is trusted without being resolved against what is licensed here.
  const mine = React.useMemo(
    () => (fixed ? null : resolve(config, stored)),
    [config, fixed, stored],
  )

  const { open, adopted } = React.useMemo(() => {
    if (fixed) return { open: workspaceDefault(config), adopted: null }

    // When this session last chose a program in this hierarchy and the
    // destination does not license it, ask — even if this product still
    // remembers a different licensed program. Restoring that memory would
    // silently move them out of the program they were just in.
    if (last) {
      const inherited = resolve(config, last)
      if (!inherited) return { open: null, adopted: null }
    }

    if (mine) return { open: mine, adopted: null }

    // Chosen next door and licensed here: still a choice this person made, so
    // it opens rather than asking them to make it twice.
    const inherited = resolve(config, last)
    if (inherited) return { open: inherited, adopted: inherited }

    // Nothing chosen anywhere yet, so nothing to change from.
    if (!last) {
      const first = workspaceDefault(config)
      if (first) return { open: first, adopted: first }
    }

    return { open: null, adopted: null }
  }, [config, fixed, last, mine])

  // What a product shows is written down as its own, so it does not drift: without
  // this, changing program in Prism would silently move the program Compliance
  // shows next time, and a first visit would re-derive on every load.
  React.useEffect(() => {
    if (!adopted) return
    writeScope(key, { parentId: adopted.parent.id, childId: adopted.child.id })
  }, [adopted, key])

  const status: ScopeStatus = open
    ? "open"
    : // A fixed session is never asked, so an unlicensed program is a dead end
      // rather than a list of programs that are not theirs.
      fixed || config.parents.length === 0
      ? "none"
      : "choose"

  const suggestedParent = React.useMemo(() => {
    if (open || !last) return null
    return config.parents.find(p => p.id === last.parentId) ?? null
  }, [config, last, open])

  const write = React.useCallback(
    (value: StoredScope) => {
      writeScope(key, value)
      writeScope(lastKey, value)
    },
    [key, lastKey],
  )

  const selectParent = React.useCallback(
    (next: ScopeParent) => {
      const firstChild = config.childrenOf(next)[0]
      // No licensed child means the parent should not have been offered, so
      // there is nothing to write rather than a scope nobody can open.
      if (!firstChild) return
      write({ parentId: next.id, childId: firstChild.id })
    },
    [config, write],
  )

  const selectChild = React.useCallback(
    (next: ScopeChild) => {
      // Before the first press there is no parent to hang a child on, so the
      // chooser sends the pair through `selectScope` instead.
      if (!open) return
      write({ parentId: open.parent.id, childId: next.id })
    },
    [open, write],
  )

  const selectScope = React.useCallback(
    (parent: ScopeParent, child: ScopeChild) => {
      write({ parentId: parent.id, childId: child.id })
    },
    [write],
  )

  return {
    config,
    status,
    parent: open?.parent ?? null,
    child: open?.child ?? null,
    suggestedParent,
    selectParent,
    selectChild,
    selectScope,
  }
}
