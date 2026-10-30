"use client"

/**
 * The way back from a dashboard drill list, above the title (anatomy A3, Romit 2026-10-30: "why did you add this?" about the body
 * breadcrumb). The shell breadcrumb carries the path, so the page no longer repeats it in the body with the count; the count is
 * said once, in the title. Shown below md only: on desktop the shell crumb already says the way back.
 */
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"

export function DrillBack({ href, label = "Dashboard" }: { href: string; label?: string }) {
  return (
    // Phones only: from md up the shell breadcrumb already leads back, and it is hidden below md (D-L8b review 2026-10-30).
    <Button asChild variant="ghost" size="sm" className="-ms-2 self-start text-muted-foreground md:hidden" data-drill-back>
      <Link href={href}>
        <i className="fa-light fa-arrow-left" aria-hidden="true" />
        {label}
      </Link>
    </Button>
  )
}
