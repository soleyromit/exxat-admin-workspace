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

/** Add skills by copying a starter library or by importing a checklist, then see what still needs configuring. */
export function StarterLibraryPage() {
  const [banner, setBanner] = React.useState<{ text: string; skillId: string } | null>(null)
  const [status, setStatus] = React.useState("")
  const done = (text: string, skillId: string) => {
    setBanner({ text, skillId })
  }
  return (
    <PageFrame title="Skills library">
      <LiveStatus message={status} />
      {banner ? (
        <LocalBanner variant="success" title="Skills added" dismissible onDismiss={() => setBanner(null)} action={{ label: "Configure first skill", href: `/v2/admin/configure-skill?skill=${banner.skillId}` }}>
          {banner.text}
        </LocalBanner>
      ) : null}
      <PageSection title="Add skills" id="add" description="Added skills need configuring before students can use them.">
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
      <PageSection title="Library" id="library">
        <LibraryTable announce={setStatus} />
      </PageSection>
    </PageFrame>
  )
}
