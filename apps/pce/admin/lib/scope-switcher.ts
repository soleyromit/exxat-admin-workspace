/**
 * Product-aware scope config for school/program (Prism family) and
 * site/location (One — Sites). Shared by sidebar `TeamSwitcher` and
 * `UtilityBarSchoolSwitcher`.
 *
 * Two layers. The **hierarchy** says what shape a product's scope has, school
 * and program or site and location. The **grant** (`scopeGrantFor`) says which
 * of those a given product is licensed for, because a school can buy Clinical
 * Education for every program and Exam Management for one.
 *
 * `parents` and `childrenOf` are always the licensed set, so every surface that
 * reads a config, the sidebar switcher, the utility bar, the home card pickers,
 * the chooser, narrows to what the product actually serves without knowing that
 * entitlement exists.
 */

import type { Product } from "@/contexts/product-context"
import {
  NAV_LOCATION_DEFAULT,
  NAV_PROGRAM_DEFAULT,
  NAV_SCHOOL_DEFAULT,
  NAV_SCHOOLS,
  NAV_SITE_DEFAULT,
  NAV_SITES,
  type NavSchool,
  type NavSite,
} from "@/lib/mock/navigation"
import { scopeGrantFor } from "@/lib/mock/scope-entitlement"

export interface ScopeParent {
  id: string
  name: string
  logo: string
  initials: string
}

export interface ScopeChild {
  id: string
  name: string
}

/**
 * Which hierarchy this product is scoped by. Read this rather than comparing a
 * config by identity: a licensed product gets a derived config object, so `===`
 * against a shared constant answers "unrestricted", not "school-scoped".
 */
export type ScopeFamily = "school" | "site"

export interface ScopeConfig {
  family: ScopeFamily
  /** Selectable parents. Already narrowed to what this product is licensed for. */
  parents: ReadonlyArray<ScopeParent>
  /**
   * The workspace's own school / site, for naming the workspace on surfaces that
   * are not inside a product yet (the home greeting). **Not** a selection
   * default: it can name a school this product is not licensed for, so never
   * resolve an active scope from it. `parents` is the licensed set.
   */
  defaultParent: ScopeParent
  /** Companion to `defaultParent`, same caveat. */
  defaultChild: ScopeChild
  /** Licensed children under a parent. */
  childrenOf: (parent: ScopeParent) => ReadonlyArray<ScopeChild>
  /** Singular noun for the child scope ("Program", "Location"). */
  childNoun: string
  /** Font Awesome glyph suffix for child rows. */
  childIcon: string
  /** Aria suffix for the trigger ("Switch school or program", …). */
  ariaSuffix: string
  /**
   * Aria suffix when the scope cannot be switched (`isScopeFixed`). Says what the
   * two names are, since a trigger that only shows a logo has no other way to.
   */
  fixedAriaSuffix: string
  /** Sub-view label ("Select school", "Select site"). */
  parentSelectLabel: string
  /** Prompt when nothing is selected yet ("Choose a program"). */
  choosePrompt: string
}

const SCHOOL_PROGRAM_SCOPE: ScopeConfig = {
  family: "school",
  parents: NAV_SCHOOLS,
  defaultParent: NAV_SCHOOL_DEFAULT,
  defaultChild: NAV_PROGRAM_DEFAULT,
  childrenOf: parent => (parent as NavSchool).programs,
  childNoun: "Program",
  childIcon: "graduation-cap",
  ariaSuffix: "Switch school or program",
  fixedAriaSuffix: "Your school and program",
  parentSelectLabel: "Select school",
  choosePrompt: "Choose a program",
}

const SITE_LOCATION_SCOPE: ScopeConfig = {
  family: "site",
  parents: NAV_SITES,
  defaultParent: NAV_SITE_DEFAULT,
  defaultChild: NAV_LOCATION_DEFAULT,
  childrenOf: parent => (parent as NavSite).locations,
  childNoun: "Location",
  childIcon: "location-dot",
  ariaSuffix: "Switch site or location",
  fixedAriaSuffix: "Your site and location",
  parentSelectLabel: "Select site",
  choosePrompt: "Choose a location",
}

/**
 * Which hierarchy a product is scoped by.
 *
 * The Exxat One in the switcher is `exxat-one-schools`, so it lands here as a
 * school and a program like Clinical Education, and a coordinator's program can
 * carry between the two. `exxat-one-sites` is the same partnership from the site's
 * desk and keeps brands, sites and locations, as does Personnel, a roster of
 * people *at* sites that a program does not narrow.
 */
function hierarchyForProduct(product: Product): ScopeConfig {
  return product === "exxat-one-sites" || product === "exxat-personnel"
    ? SITE_LOCATION_SCOPE
    : SCHOOL_PROGRAM_SCOPE
}

/**
 * One derived config per restricted product, kept for the life of the tab.
 *
 * `useActiveScope` memoises on config identity and passes it down as a dep, so a
 * fresh object per call would invalidate every consumer on every render.
 */
const derived = new Map<Product, ScopeConfig>()

function narrow(base: ScopeConfig, product: Product): ScopeConfig {
  const grant = scopeGrantFor(product)
  if (!grant) return base

  const cached = derived.get(product)
  if (cached) return cached

  // Sets once per product rather than a list scan per child, since `childrenOf`
  // runs on every render of every switcher.
  const licensedByParent = new Map(
    Object.entries(grant).map(([parentId, childIds]) => [parentId, new Set(childIds)]),
  )

  const childrenOf = (parent: ScopeParent): ReadonlyArray<ScopeChild> => {
    const licensed = licensedByParent.get(parent.id)
    if (!licensed) return []
    return base.childrenOf(parent).filter(child => licensed.has(child.id))
  }

  const config: ScopeConfig = {
    ...base,
    // A parent with no licensed children is not offered at all: picking it would
    // land on a school the product cannot open.
    parents: base.parents.filter(parent => childrenOf(parent).length > 0),
    childrenOf,
  }

  derived.set(product, config)
  return config
}

export function scopeConfigForProduct(product: Product): ScopeConfig {
  return narrow(hierarchyForProduct(product), product)
}

/**
 * Whether this product is scoped to a school and program rather than a site.
 *
 * Read by anything that only makes sense inside a program: a student view exists
 * for a school product and not for a site one, so the products home offers "open
 * as a student" on these cards only. Derived from the hierarchy rather than a
 * second list of product ids, so a product registered into the school family gets
 * the answer right without being added anywhere else.
 */
export function isSchoolScopedProduct(product: Product): boolean {
  return scopeConfigForProduct(product).family === "school"
}
