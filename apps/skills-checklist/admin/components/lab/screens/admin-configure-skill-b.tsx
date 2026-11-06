"use client"

/**
 * Configure a skill or several (map D1c, D4): the full page for one skill, the bulk page from the Library selection bar with two or more rows. URL: ?skill= or ?skills=a,b,c. Both listen for `lab:reset`.
 */
import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SkillsLibraryTablePage } from "./admin-skills-library-a"
import { ConfigureManyPage } from "@/components/lab/configure/many-page"
import { ConfigureOneSkillPage } from "@/components/lab/configure/one-skill-page"
import { ConfigureLoading, LIBRARY_HREF } from "@/components/lab/configure/shell"
import { parseSkillIds } from "@/lib/lab/configure-many"

/**
 * ?skills=a,b,c (the Library selection bar) is the several-skills page; ?skill= is the Configure one skill page (map D1c, D-L115). With no skill named: a path that still has this stop stays on the Library, its panel open from the URL; otherwise the plain Library.
 */
export function AdminConfigureSkillB() {
  const params = useSearchParams()
  const pathname = usePathname() ?? ""
  const ids = parseSkillIds(params?.get("skills"))
  if (ids.length > 1) return <ConfigureManyPage ids={ids} />
  const skillId = ids[0] ?? params?.get("skill") ?? null
  if (skillId) return <ConfigureOneSkillPage skillId={skillId} />
  if (pathname.startsWith("/lab/flow/")) return <SkillsLibraryTablePage />
  return <OpenInLibrary skillId={null} />
}

/** To the plain Library, whichever design opened this link; only which program it is on travels with it. */
function OpenInLibrary({ skillId }: { skillId: string | null }) {
  const router = useRouter()
  const program = useSearchParams()?.get("program")
  React.useEffect(() => {
    const q = new URLSearchParams()
    if (skillId) q.set("skill", skillId)
    if (program) q.set("program", program)
    const s = q.toString()
    router.replace(s ? `${LIBRARY_HREF}?${s}` : LIBRARY_HREF)
  }, [skillId, program, router])
  return <ConfigureLoading />
}
