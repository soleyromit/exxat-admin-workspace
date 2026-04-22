import Link from "next/link"
import { NewPlacementForm } from "@/components/new-placement-form"
import { SidebarAutoCollapse } from "@/components/sidebar-auto-collapse"
import { PrimaryPageTemplate } from "@/components/templates/primary-page-template"

export default function NewPlacementPage() {
  return (
    <PrimaryPageTemplate
      beforeSiteHeader={<SidebarAutoCollapse />}
      bodyClassName="overflow-y-auto"
      maxWidthClassName="max-w-3xl"
      contentClassName="px-8 pt-10 pb-32"
    >
      <Link
        href="/data-list"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-interactive-hover-foreground transition-colors mb-5 group"
        aria-label="Back to placements list"
      >
        <i className="fa-light fa-arrow-left text-xs transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
        Back
      </Link>
      <h1
        className="text-[2.25rem] font-semibold tracking-tight leading-none text-foreground mb-8"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        New placement
      </h1>
      <NewPlacementForm />
    </PrimaryPageTemplate>
  )
}
