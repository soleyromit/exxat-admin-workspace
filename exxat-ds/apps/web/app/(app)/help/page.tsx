import Link from "next/link"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"
import { Button } from "@/components/ui/button"

const HELP_CENTER = "https://help.exxat.com/hc/en-us"

export default function HelpPage() {
  return (
    <PrimaryPageTemplate
      siteHeader={{
        breadcrumbs: [{ label: "Dashboard", href: "/dashboard" }],
        title: "Get help",
      }}
    >
      <div className="px-4 py-8 pb-16 lg:px-6 max-w-xl">
        <h1 className="sr-only">Get help</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Browse articles and guides in the Exxat Help Center, or adjust app preferences in Settings.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <a href={HELP_CENTER} target="_blank" rel="noopener noreferrer">
              Open Help Center
              <i className="fa-light fa-arrow-up-right ms-2 text-xs" aria-hidden="true" />
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/settings#appearance">App settings</Link>
          </Button>
        </div>
      </div>
    </PrimaryPageTemplate>
  )
}
