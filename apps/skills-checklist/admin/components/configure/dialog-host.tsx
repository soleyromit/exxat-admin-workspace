"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ImportDialog } from "@/components/import/import-dialog"
import { currentLibraryPath, useLibraryDialogs, useLibraryDialogState } from "@/components/library/dialog-bridge"
import { AddSkillDialog } from "./add-skill-dialog"
import { ConfigureWizardDialog } from "./wizard-dialog"

/**
 * Mounts the three prototype dialogs on the Skills Library page from the URL contract owned by `components/library/dialog-bridge.ts`:
 *
 *   ?dialog=add                  Add a skill (672px)
 *   ?dialog=configure&skill=<id> the 3-step configure wizard (1024px)
 *   ?dialog=import               Import skills (1024px): input then review
 *
 * Rendered once by the library page. After an import the host leaves
 * `?imported=<batchId>` on the URL: the library shows the "Added n skills ..." and "n skills have not been configured" banners from it.
 */
export function LibraryDialogHost() {
  const { dialog, skillId } = useLibraryDialogState()
  const dialogs = useLibraryDialogs()
  const router = useRouter()
  const params = useSearchParams()

  const replaceWith = React.useCallback(
    (mutate: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(params?.toString() ?? "")
      sp.delete("dialog")
      sp.delete("skill")
      mutate(sp)
      const q = sp.toString()
      { const base = currentLibraryPath(); router.replace(q ? `${base}?${q}` : base, { scroll: false }) }
    },
    [params, router],
  )

  return (
    <>
      <AddSkillDialog
        open={dialog === "add"}
        onOpenChange={(o) => {
          if (!o) dialogs.close()
        }}
        onConfigure={(id) => replaceWith((sp) => {
          sp.set("dialog", "configure")
          sp.set("skill", id)
        })}
      />
      <ConfigureWizardDialog
        open={dialog === "configure" && !!skillId}
        skillId={skillId}
        onOpenChange={(o) => {
          if (!o) dialogs.close()
        }}
      />
      <ImportDialog
        open={dialog === "import"}
        onOpenChange={(o) => {
          if (!o) dialogs.close()
        }}
        onImported={(info) => replaceWith((sp) => sp.set("imported", info.batchId))}
      />
    </>
  )
}
