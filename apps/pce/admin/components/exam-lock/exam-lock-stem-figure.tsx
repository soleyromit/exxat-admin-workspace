"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"

import type { ExamLockStemMedia } from "./exam-lock-delivery-types"

export interface ExamLockStemFigureProps {
  media: ExamLockStemMedia
  className?: string
}

/** Full-viewport figure viewer — solid surface, native dialog focus trap. */
function ExamLockStemFigureViewer({
  media,
  fullscreenSrc,
  open,
  onClose,
}: {
  media: ExamLockStemMedia
  fullscreenSrc: string
  open: boolean
  onClose: () => void
}) {
  const dialogRef = React.useRef<HTMLDialogElement>(null)

  React.useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
      return
    }
    if (dialog.open) dialog.close()
  }, [open])

  if (typeof document === "undefined") return null

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-label={media.alt}
      className="fixed inset-0 z-[200] m-0 hidden h-dvh max-h-dvh w-full max-w-none flex-col border-0 bg-surface-1 p-0 backdrop:bg-transparent open:flex"
      onClose={onClose}
      onCancel={event => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2">
        {media.caption ? (
          <p className="min-w-0 text-xs text-muted-foreground">{media.caption}</p>
        ) : (
          <span className="sr-only">{media.alt}</span>
        )}
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Close
          <KbdGroup className="ml-1.5">
            <Kbd variant="bare">Esc</Kbd>
          </KbdGroup>
        </Button>
      </div>
      <div className="min-h-0 flex-1 p-4 sm:p-6">
        <img
          src={fullscreenSrc}
          alt={media.alt}
          className="size-full object-contain"
          decoding="async"
        />
      </div>
    </dialog>,
    document.body,
  )
}

/** Student-facing stem figure with expand / full-viewport viewer. */
export function ExamLockStemFigure({ media, className }: ExamLockStemFigureProps) {
  const [viewerOpen, setViewerOpen] = React.useState(false)
  const fullscreenSrc = media.fullscreenSrc ?? media.src
  const openViewerLabel = `View full size: ${media.alt}`

  const openViewer = React.useCallback(() => {
    setViewerOpen(true)
  }, [])

  const closeViewer = React.useCallback(() => {
    setViewerOpen(false)
  }, [])

  return (
    <>
      <figure
        className={cn(
          "group/figure relative overflow-hidden rounded-2 border border-border bg-muted/20",
          className,
        )}
      >
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full cursor-zoom-in justify-start rounded-none p-0 text-start ring-offset-background focus-visible:ring-offset-2"
          onClick={openViewer}
          aria-label={openViewerLabel}
        >
          <img
            src={media.src}
            alt=""
            aria-hidden="true"
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </Button>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-2">
          <Tip side="left" label="View full size">
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="pointer-events-auto icon-button-chrome shadow-sm"
              aria-label={openViewerLabel}
              onClick={event => {
                event.stopPropagation()
                openViewer()
              }}
            >
              <i className="fa-light fa-expand text-xs" aria-hidden="true" />
            </Button>
          </Tip>
        </div>
        {media.caption ? (
          <figcaption className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
            {media.caption}
          </figcaption>
        ) : null}
      </figure>

      <ExamLockStemFigureViewer
        media={media}
        fullscreenSrc={fullscreenSrc}
        open={viewerOpen}
        onClose={closeViewer}
      />
    </>
  )
}
