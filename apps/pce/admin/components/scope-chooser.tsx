"use client"

/**
 * What a product shows before it will show anything else: which program.
 *
 * Reached when this session has chosen a scope somewhere and the product it just
 * opened is not licensed for it (`useActiveScope` → `"choose"`). The alternative
 * was to substitute a program quietly, which is how a coordinator ends up reading
 * a cohort that is not the one they think they are looking at.
 *
 * A state of the page, not a dialog over it. A dialog would be sitting on top of
 * the dashboard whose data is exactly what has not been established yet, and the
 * shell around it stays: the switcher, the way back to the products home, and the
 * product's own name all still answer "where am I" while the question is open.
 *
 * It renders at the URL the switch already lands on rather than a route of its
 * own, so the address stays the thing the person asked for and a reload does not
 * lose it.
 *
 * One press per row and no confirm step, because the press *is* the confirmation
 * (`exxat-ux-discovery-protocol` P3). Even when a product serves exactly one
 * program, that one row is still shown: opening it unasked would change the
 * program out from under a session that chose a different one.
 */

import * as React from "react"
import { Link } from "react-router"

import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ScopeChoiceList } from "@/components/scope-choice-list"
import type { Product } from "@/contexts/product-context"
import { useActiveScope } from "@/hooks/use-active-scope"
import { productLabel } from "@/lib/product-home"
import { PRODUCTS_HOME_PATH } from "@/lib/post-auth-landing"
import type { ScopeChild, ScopeParent } from "@/lib/scope-switcher"

export function ScopeChooser({ product }: { product: Product }) {
  const { config, status, suggestedParent, selectScope } = useActiveScope(product)
  const [opening, setOpening] = React.useState<string | null>(null)
  const name = productLabel(product)

  const pick = React.useCallback(
    (parent: ScopeParent, child: ScopeChild) => {
      // The row that was pressed holds a spinner while the product mounts behind
      // it, so a press that takes a beat reads as work rather than a dead button.
      setOpening(child.id)
      selectScope(parent, child)
    },
    [selectScope],
  )

  const count = React.useMemo(
    () => config.parents.reduce((total, parent) => total + config.childrenOf(parent).length, 0),
    [config],
  )

  const noun = config.childNoun.toLowerCase()

  if (status === "none") {
    return (
      <ChooserFrame>
        <PageHeader title={`No ${noun}s in ${name}`} />
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">
            {`Your account is not in a ${noun} that ${name} covers. Ask your administrator to add one, or open another app.`}
          </p>
          <Button asChild variant="outline">
            <Link to={PRODUCTS_HOME_PATH}>
              <i className="fa-light fa-arrow-left" aria-hidden="true" />
              Your apps
            </Link>
          </Button>
        </div>
      </ChooserFrame>
    )
  }

  return (
    <ChooserFrame>
      <PageHeader
        title={config.choosePrompt}
        subtitle={`${name} · ${count} ${count === 1 ? noun : `${noun}s`}`}
      />
      <ScopeChoiceList
        config={config}
        onPick={pick}
        busyChildId={opening}
        suggestedParentId={suggestedParent?.id ?? null}
      />
    </ChooserFrame>
  )
}

/**
 * Centred in the page rather than stacked at the top of it.
 *
 * A hub's content starts under its header because there is a lot of it. Here
 * there are two or three rows, and putting them where a hub's title bar sits
 * reads as a page whose body failed to load. Centred, the same rows read as the
 * one thing being asked.
 */
function ChooserFrame({ children }: { children: React.ReactNode }) {
  return (
    <PrimaryPageTemplate maxWidthClassName="max-w-2xl">
      <div className="flex min-h-[55vh] flex-col justify-center gap-6">{children}</div>
    </PrimaryPageTemplate>
  )
}
