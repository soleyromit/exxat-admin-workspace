"use client"

/**
 * Library's way into Set up skills (D-L44, Proposed). Both render nothing inside the workflow itself (its step 1 is the library).
 * - SetupResumeCue: while a setup was started and not finished, one banner "Setup paused at step N of 6" with Continue setup.
 * - SetupEmptyEntry: an empty library offers one action, Set up skills; inside the workflow the library's own empty state stays.
 */
import * as React from "react"
import Link from "next/link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Card, CardContent } from "@exxatdesignux/ui/components/ui/card"
import { LocalBanner } from "@exxatdesignux/ui"
import { useEmbeddedStep } from "@/components/lab/layout/embedded"
import { TYPE } from "@/components/lab/type-scale"
import { SETUP_STEP_COUNT, SETUP_STORAGE_KEY, parseProgress, resumeStep } from "@/lib/lab/setup-wizard"
import { skillNounPlural } from "@/lib/lab/terms"
import { focusHref } from "@/lib/lab/screens"

/**
 * Set up skills is variant C of the Setup summary screen (its Review step is that summary), drawn in a focus frame. The set-aware
 * link builder would send admin/setup-result to its walkthrough step (variant A, with the sidebar), so the entry asks the registry for its focus variant.
 */
export const SETUP_HREF = focusHref("admin", "setup-result")

function useResumeStep(): number | null {
  const [n, setN] = React.useState<number | null>(null)
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETUP_STORAGE_KEY)
      setN(raw ? resumeStep(parseProgress(raw)) : null)
    } catch {
      setN(null)
    }
  }, [])
  return n
}

export function SetupResumeCue() {
  const embedded = useEmbeddedStep()
  const n = useResumeStep()
  if (embedded || n === null) return null
  return (
    <div data-region="banner" data-setup-resume>
      <LocalBanner variant="info" title={`Setup paused at step ${n} of ${SETUP_STEP_COUNT}`} action={{ label: "Continue setup", href: SETUP_HREF }}>{null}</LocalBanner>
    </div>
  )
}

export function SetupEmptyEntry({ fallback }: { fallback: React.ReactNode }) {
  const embedded = useEmbeddedStep()
  if (embedded) return <>{fallback}</>
  return (
    <Card data-region="empty" data-setup-entry>
      <CardContent className="flex flex-col items-start gap-3">
        <h2 className={TYPE.section}>{`Your ${skillNounPlural()} library is empty`}</h2>
        <Button asChild variant="default" size="sm">
          <Link href={SETUP_HREF}>{`Set up ${skillNounPlural()}`}</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
