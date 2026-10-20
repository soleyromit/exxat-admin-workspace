"use client"

import * as React from "react"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@exxatdesignux/ui/components/ui/tabs"
import { PageFrame, PageSection } from "@/components/skills/page-header"
import { ImportPanel } from "@/components/v2/admin/import-panel"
import { LibraryTable } from "@/components/v2/admin/library-table"
import { LiveStatus } from "@/components/v2/admin/use-admin"
import { StarterLibrariesPanel } from "@/components/v2/admin/starter-libraries-panel"

/** Radix tab panels are focusable, so they carry the DS focus ring. */
const TAB_PANEL = "mt-4 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"

/** Scenario step 1: add skills by copying a starter library or by importing a checklist, then see what still needs configuring. */
export function StarterLibraryPage() {
  const [banner, setBanner] = React.useState<{ text: string; skillId: string } | null>(null)
  const [status, setStatus] = React.useState("")
  const done = (text: string, skillId: string) => {
    setBanner({ text, skillId })
  }
  return (
    <PageFrame title="Add skills to the library" subtitle="Copy a specialty starter list or import the checklist you already have.">
      <LiveStatus message={status} />
      {banner ? (
        <LocalBanner variant="success" title="Skills added" dismissible onDismiss={() => setBanner(null)} action={{ label: "Configure the first new skill", href: `/v2/admin/configure-skill?skill=${banner.skillId}` }}>
          {banner.text}
        </LocalBanner>
      ) : null}
      <PageSection title="Add skills" id="add" description="Both ways create skills without an evaluation model. You choose the model for each skill when you configure it.">
        <Tabs defaultValue="starter">
          <TabsList variant="line" aria-label="Ways to add skills" className="rounded-md focus-visible:ring-3 focus-visible:ring-ring/50">
            <TabsTrigger value="starter">Starter libraries</TabsTrigger>
            <TabsTrigger value="import">Import from a file</TabsTrigger>
          </TabsList>
          <TabsContent value="starter" className={TAB_PANEL}>
            <StarterLibrariesPanel onCopied={done} />
          </TabsContent>
          <TabsContent value="import" className={TAB_PANEL}>
            <ImportPanel onCreated={done} />
          </TabsContent>
        </Tabs>
      </PageSection>
      <PageSection title="Your library" id="library" description="Every skill the program holds, where it came from, and whether it still needs configuring.">
        <LibraryTable announce={setStatus} />
      </PageSection>
    </PageFrame>
  )
}
