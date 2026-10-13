import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"

/** A navigation action: the DS Button rendered as a link (text only, explicit variant and size). Home never runs an action itself. */
export function LinkButton({ href, variant = "outline", size = "sm", children, ...rest }: { href: string; variant?: "default" | "outline" | "secondary" | "ghost" | "link"; size?: "xs" | "sm" | "default" | "lg" } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Button asChild variant={variant} size={size}>
      <Link href={href} {...rest}>
        {children}
      </Link>
    </Button>
  )
}
