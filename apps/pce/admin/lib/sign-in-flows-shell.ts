/**
 * The sign-in flow builder's route, and the fact that it belongs to no product.
 *
 * A flow decides which product you end up in, so it cannot sit inside one. The
 * URL already said that (`/builder/...`, never `/prism/...`), but the shell did
 * not: the page rendered with the active product's sidebar and a breadcrumb up to
 * that product's dashboard, so authoring the flow that grants Exxat One looked
 * like a Clinical Education feature. The sidebar is dropped here for the same
 * reason it is dropped on the products home, and with the same exception: the
 * utility bar stays, because identity, search, and sign-out still belong to the
 * person rather than to a product.
 *
 * Prototype scaffolding, like the builder itself. A workspace with one sign-in
 * flow nobody may change has no use for this route (see `SignInFlowMenuItem`,
 * which gates the door on product authoring).
 */

export const SIGN_IN_FLOWS_PATH = "/builder/sign-in-flows"

export function isSignInFlowsPath(pathname: string): boolean {
  return pathname === SIGN_IN_FLOWS_PATH || pathname.startsWith(`${SIGN_IN_FLOWS_PATH}/`)
}
