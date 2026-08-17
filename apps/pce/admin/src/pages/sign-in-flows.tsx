import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { SignInFlowsClient } from "@/components/builder/sign-in-flows-client"
import { PRODUCTS_HOME_PATH } from "@/lib/post-auth-landing"

/**
 * Sign-in flow builder, mounted at `/builder/sign-in-flows`.
 *
 * Under `/builder` rather than a product root because a flow is not owned by any
 * one product: a single flow decides which product you end up in. The shell drops
 * the product sidebar here to match (`lib/sign-in-flows-shell.ts`), so the one
 * crumb goes up to the products home — where every route to this page starts —
 * rather than to whichever dashboard the store happened to remember.
 */
export default function SignInFlowsPage() {
  return (
    <PrimaryPageTemplate
      // A canvas needs room. The branch fan grows horizontally with the number of
      // options, and at reading width four branches would be four slivers.
      maxWidthClassName="max-w-6xl"
      contentClassName="px-8 pt-10 pb-32"
      siteHeader={{
        breadcrumbs: [{ label: "Home", href: PRODUCTS_HOME_PATH }],
        title: "Sign-in flows",
      }}
    >
      <SignInFlowsClient />
    </PrimaryPageTemplate>
  )
}
