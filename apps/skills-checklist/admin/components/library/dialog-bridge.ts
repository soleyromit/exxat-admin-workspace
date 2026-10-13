"use client"

/**
 * The URL contract between the Skills Library page and the Add skill / Configure / Import dialogs
 * (`components/configure/dialog-host.tsx`, mounted by `components/library/library-page.tsx`):
 *
 *   /skills/library?dialog=add
 *   /skills/library?dialog=configure&skill=<skillId>
 *   /skills/library?dialog=import
 *
 * The openers always change the URL; the host reads it and opens the dialog in place. The old full-page routes
 * (skills/new, skills/[id]/configure, import) are redirects to these URLs.
 */
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ROUTES } from "@/lib/skills-routes"

export type LibraryDialogName = "add" | "configure" | "import"

export const LIBRARY_PATH = ROUTES.skills

/** The library route. Every tab lives on it (?tab=), so a dialog opens in place on whichever tab the admin is on. */
const LIBRARY_ROUTES: string[] = [ROUTES.skills]

/** Event-time path: the library route currently shown, else the Skills library (read from window so no hook is needed). */
export function currentLibraryPath(): string {
  if (typeof window === "undefined") return LIBRARY_PATH
  const here = window.location.pathname
  return LIBRARY_ROUTES.includes(here) ? here : LIBRARY_PATH
}

export interface LibraryDialogState {
  dialog: LibraryDialogName | null
  skillId: string | null
}

/** Which dialog the URL asks for. */
export function useLibraryDialogState(): LibraryDialogState {
  const params = useSearchParams()
  const raw = params?.get("dialog") ?? ""
  const dialog = raw === "add" || raw === "configure" || raw === "import" ? raw : null
  return { dialog, skillId: dialog === "configure" ? (params?.get("skill") ?? null) : null }
}

export interface LibraryDialogs {
  openAddSkill: () => void
  openConfigure: (skillId: string) => void
  openImport: () => void
  /** Drops `dialog` and `skill` from the URL, keeping every other query key (filters, tab). */
  close: () => void
}

export function useLibraryDialogs(): LibraryDialogs {
  const router = useRouter()
  const params = useSearchParams()
  const query = params?.toString() ?? ""

  const withDialog = React.useCallback(
    (dialog: LibraryDialogName | null, skillId?: string) => {
      const sp = new URLSearchParams(query)
      sp.delete("dialog")
      sp.delete("skill")
      if (dialog) sp.set("dialog", dialog)
      if (dialog === "configure" && skillId) sp.set("skill", skillId)
      const q = sp.toString()
      const base = currentLibraryPath()
      return q ? `${base}?${q}` : base
    },
    [query],
  )

  return React.useMemo<LibraryDialogs>(
    () => ({
      openAddSkill: () => router.push(withDialog("add")),
      openConfigure: (skillId) => router.push(withDialog("configure", skillId)),
      openImport: () => router.push(withDialog("import")),
      close: () => router.replace(withDialog(null), { scroll: false }),
    }),
    [router, withDialog],
  )
}
