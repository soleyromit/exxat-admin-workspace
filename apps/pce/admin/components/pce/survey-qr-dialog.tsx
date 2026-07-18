'use client'

/**
 * SurveyQrDialog — the in-class distribution affordance for faculty.
 *
 * WHY THIS EXISTS (research, not a hunch): Arvind (40-yr professor) — students
 * respond ~8 of 60 by email, "previous paper-based = better: 10-min in-class
 * completion", and "extended windows don't improve participation vs. dedicated
 * class time". Faculty are the only people standing in the room, so the QR
 * belongs on THEIR surface. Project it, give the class 10 minutes, done.
 *
 * WHY IT IS SAFE (Aarti, Jun 9): post-course evaluation has exactly ONE
 * distribution channel — via Exxat Prism — because "we don't want the same
 * student taking the same survey for the same course twice". This dialog does
 * not add a channel: it renders that same Prism-authenticated deep link as
 * pixels. Students still sign in, so dedupe and completion tracking are intact.
 * It is deliberately NOT a share menu (no social, no email, no "copy public
 * link") — a multi-channel share sheet is precisely what that decision removed.
 *
 * Anonymity is unaffected: authentication identifies the responder to Prism for
 * dedupe only; identity is never stored with the response.
 *
 * Mobbin canon: Foundation "Scan with Phone" · Turo · Linktree — one code, one
 * link, copy + download. NOT GoFundMe/Deputy multi-channel share sheets.
 */

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  LocalBanner,
  Skeleton,
} from '@exxatdesignux/ui'
import type { PceSurvey } from '@/lib/pce-mock-data'
import { surveyPrismUrl } from '@/lib/pce-faculty'

export function SurveyQrDialog({
  open,
  onOpenChange,
  survey,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  survey: PceSurvey | null
}) {
  const [svg, setSvg] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [copy, setCopy] = useState<'idle' | 'done' | 'failed'>('idle')
  /** Bumping this re-runs generation — the retry affordance on the error banner. */
  const [attempt, setAttempt] = useState(0)

  const url = survey ? surveyPrismUrl(survey) : ''
  const loading = !svg && !failed

  useEffect(() => {
    if (!open || !survey) return
    let cancelled = false
    setSvg(null)
    setFailed(false)
    QRCode.toString(surveyPrismUrl(survey), {
      type: 'svg',
      margin: 1,
      errorCorrectionLevel: 'M',
    })
      .then((s) => {
        if (!cancelled) setSvg(s)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [open, survey, attempt])

  useEffect(() => {
    if (copy === 'idle') return
    const t = setTimeout(() => setCopy('idle'), 2500)
    return () => clearTimeout(t)
  }, [copy])

  if (!survey) return null

  const pending = Math.max(0, survey.enrollmentCount - survey.responseCount)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopy('done')
    } catch {
      /* Clipboard is blocked on non-HTTPS origins and by permission policy.
       * Swallowing this silently left the button reading "Copy link" with nothing
       * on the clipboard and no way to know — say so instead. The URL is on
       * screen, so the user can still act. */
      setCopy('failed')
    }
  }

  async function handleDownload() {
    if (!survey) return
    try {
      const dataUrl = await QRCode.toDataURL(url, { width: 1024, margin: 2 })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${survey.courseCode}-evaluation-qr.png`
      a.click()
    } catch {
      /* Download is a convenience — the on-screen code is still projectable. */
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan to open in Prism</DialogTitle>
          <DialogDescription>
            Project this in class so students can complete{' '}
            <strong>{survey.courseCode}</strong> now. They sign in with Prism, so
            each student can respond once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3">
          {failed ? (
            /* The code is the point of this dialog, so its failure is a real
             * error state — announced, and retryable without reopening. */
            <LocalBanner
              variant="error"
              title="Couldn’t generate the QR code"
              retry={{ label: 'Try again', onClick: () => setAttempt((a) => a + 1) }}
            >
              Use the link below instead — it opens the same evaluation.
            </LocalBanner>
          ) : (
            /* DS Card, not a rounded+bordered div — the quiet-zone surface the
               code sits on is Card chrome, so it should BE a Card. */
            <Card
              size="sm"
              role="img"
              aria-busy={loading}
              aria-label={`QR code linking to the ${survey.courseCode} evaluation in Prism`}
            >
              <CardContent>
                {svg ? (
                  <div
                    className="size-48 [&>svg]:size-full [&>svg]:block"
                    // Generated by qrcode from our own Prism URL — no user input.
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                ) : (
                  <Skeleton className="size-48" />
                )}
              </CardContent>
            </Card>
          )}

          <p className="text-xs font-mono tabular-nums text-muted-foreground break-all text-center">
            {url}
          </p>

          {/* Live standing, so the room can be told what's left to do. */}
          <p className="text-xs text-muted-foreground tabular-nums">
            {survey.responseCount} of {survey.enrollmentCount} responded ·{' '}
            {pending} still to go
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" size="default" onClick={handleDownload}>
            Download PNG
          </Button>
          <Button variant="default" size="default" onClick={handleCopy}>
            {copy === 'done' ? 'Link copied' : copy === 'failed' ? 'Couldn’t copy' : 'Copy link'}
          </Button>
        </DialogFooter>
        <span aria-live="polite" className="sr-only">
          {copy === 'done'
            ? 'Link copied to clipboard'
            : copy === 'failed'
              ? 'Couldn’t copy the link — select the address shown above instead'
              : ''}
        </span>
      </DialogContent>
    </Dialog>
  )
}
