/**
 * Which scopes a product is licensed for.
 *
 * Product entitlement (`isProductEntitled`) answers whether a workspace has
 * Exam Management at all. This answers the question underneath it: *where*. A
 * school buys Clinical Education for every program and Exam Management for one,
 * which is the normal shape of these contracts and the reason a program can
 * exist in one product and not its neighbour.
 *
 * Without this the model asserts that every school-scoped product has every
 * program, so switching products could only ever land you somewhere valid, and
 * the scope picker offered programs the destination does not serve.
 *
 * A product absent from this map is licensed for **every** scope, which keeps
 * the map short and makes the restriction the thing you have to write down.
 * Swap for the entitlement API alongside `isProductEntitled`.
 */

import type { Product } from "@/contexts/product-context"

/** Parent id (school / site) to the child ids licensed under it. */
export type ScopeGrant = Readonly<Record<string, readonly string[]>>

/**
 * The restricted products. Ids match `NAV_SCHOOLS` / `NAV_SITES`.
 *
 * Clinical Education is deliberately **not** here: it is the app every workspace
 * lives in, it is licensed for every program, and it is the baseline the other
 * cases are measured against.
 *
 * Exxat One is here, but it keeps `som` (Medicine), the workspace default. That
 * split matters and is the whole reason its grant looks the way it does. When
 * Exxat One was licensed for nothing, the app most people open second rested on
 * "Choose a program" before anyone had pressed anything. Keeping the default
 * program means it still opens straight into Medicine from a cold start, while
 * dropping one program means a coordinator standing in Public Health is asked —
 * a licence gap in the app pair people actually switch between, rather than only
 * in the add-ons.
 *
 * The add-ons carry one shape each, so every case is reachable in the dogfood app
 * by granting that product from a sign-in flow alongside Clinical Education and
 * switching between the two:
 *
 * - **Exam Management** serves one program, and it is not the workspace default,
 *   so the destination has exactly one option and it is still a change.
 * - **Accreditation** serves two, neither of them the workspace default, so the
 *   switch is a genuine two-way choice with nothing to infer from.
 * - **Compliance** serves two of Johns Hopkins' three programs and all of Mayo's,
 *   so the same switch offers a real choice at one school and none at the other.
 *
 * `som` (Medicine) is the workspace default, so leaving it out of a grant is what
 * makes that product ask rather than open.
 */
const SCOPE_GRANTS: Partial<Record<Product, ScopeGrant>> = {
  // Public Health is the program Exxat One does not serve. Nursing stays because
  // it is the only program Exam Management has, and taking it away here would
  // leave that pair with no program in common at all, which is a different case
  // from the one this grant exists to show.
  "exxat-one-schools": { jhu: ["som", "son"], mayo: ["md", "bms"] },
  "exxat-exam-management": { jhu: ["son"] },
  "exxat-accreditation": { jhu: ["son", "sph"] },
  "exxat-compliance": { jhu: ["son", "sph"], mayo: ["md", "bms"] },
}

/** The grant for a product, or `undefined` when it is licensed everywhere. */
export function scopeGrantFor(product: Product): ScopeGrant | undefined {
  return SCOPE_GRANTS[product]
}
