"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useLabHref } from "./page-context"

/**
 * next/link for lab screens: a string href to a lab screen ("/lab/admin/configure-skill?skill=x") is rewritten into the
 * active option set (lib/lab/links.ts), so every in-page link stays in the design the reviewer is walking. Lab files import
 * it as `Link`.
 */
export const LabLink = React.forwardRef<HTMLAnchorElement, React.ComponentProps<typeof Link>>(function LabLink({ href, ...rest }, ref) {
  const to = useLabHref()
  const resolved = typeof href === "string" ? to(href) : href
  return <Link ref={ref} href={resolved} {...rest} />
})

/** router.push / replace with the same rewrite, for buttons that navigate. */
export function useLabRouter() {
  const router = useRouter()
  const to = useLabHref()
  return React.useMemo(() => ({
    ...router,
    push: (href: string, opts?: Parameters<typeof router.push>[1]) => router.push(to(href), opts),
    replace: (href: string, opts?: Parameters<typeof router.replace>[1]) => router.replace(to(href), opts),
  }), [router, to])
}
