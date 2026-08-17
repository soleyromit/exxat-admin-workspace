"use client"

/**
 * Design OS — Focus workflow template showcase.
 * Demonstrates `FocusWorkflowTemplate` + `PageHeader` actions (same slot as New question).
 */

import * as React from "react"

import { FocusWorkflowTemplate } from "@/components/templates/focus-workflow-template"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Shortcut } from "@/components/ui/dropdown-menu"
import { useProductDashboardHref } from "@/contexts/product-route-sync"

const SHOWCASE_SUBTITLE =
  "Full-page shell with no sidebars — open from Tokens & themes via the header action. Centered content, SiteHeader back trail, and PageHeader actions for create flows."

export function FocusWorkflowShowcaseClient() {
  const dashboardHref = useProductDashboardHref()
  const tokensHref = dashboardHref.replace(/\/dashboard$/, "/tokens-themes")
  const [saved, setSaved] = React.useState(false)

  const handleSave = React.useCallback(() => {
    setSaved(true)
  }, [])

  return (
    <>
      <Shortcut keys="Enter" onInvoke={handleSave} />
      <FocusWorkflowTemplate
        title="Focus workflow"
        subtitle={SHOWCASE_SUBTITLE}
        back={{ href: tokensHref, label: "Tokens & themes", ariaLabel: "Back to Tokens & themes" }}
        siteHeader={{
          breadcrumbs: [
            { label: "Dashboard", href: dashboardHref },
            { label: "Tokens & themes", href: tokensHref },
            { label: "Focus workflow" },
          ],
          title: "Focus workflow",
        }}
        actions={
          <>
            <Button type="button" variant="outline" size="lg">
              Cancel
              <KbdGroup className="ms-1.5">
                <Kbd variant="bare">Esc</Kbd>
              </KbdGroup>
            </Button>
            <Button type="button" size="lg" onClick={handleSave}>
              {saved ? "Saved" : "Save example"}
              <KbdGroup className="ms-1.5">
                <Kbd variant="bare">⏎</Kbd>
              </KbdGroup>
            </Button>
          </>
        }
      >
        <div className="space-y-6 pb-10">
          <section className="rounded-2 border border-border bg-card p-6">
            <h2 className="text-base font-semibold text-foreground">When to use</h2>
            <ul className="mt-3 list-disc space-y-2 ps-5 text-sm text-muted-foreground">
              <li>Multi-step create / edit flows that deserve the full viewport</li>
              <li>Tasks where hub sidebars would compete with the primary job</li>
              <li>Inspector splits — compose `NewFocusTemplate` `form-inspector` on top of this shell</li>
            </ul>
          </section>
          <section className="rounded-2 border border-dashed border-border bg-muted/20 p-6">
            <p className="text-sm text-muted-foreground">
              Drop your form, wizard steps, or builder cards here. Register new routes in{" "}
              <code className="font-mono text-xs text-foreground">lib/focus-workflow.ts</code> so
              the shell hides both sidebars automatically.
            </p>
          </section>
        </div>
      </FocusWorkflowTemplate>
    </>
  )
}
