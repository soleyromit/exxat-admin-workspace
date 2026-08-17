"use client"

import { Button } from "@/components/ui/button"
import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom"
import { cn } from "@/lib/utils"

export interface ExamLockQuestionNavProps {
  onPrevious: () => void
  onNext: () => void
  disablePrevious?: boolean
  disableNext?: boolean
  className?: string
}

/** Previous / next footer for one-question-at-a-time exam delivery. Sticky except at ≥200% zoom. */
export function ExamLockQuestionNav({
  onPrevious,
  onNext,
  disablePrevious = false,
  disableNext = false,
  className,
}: ExamLockQuestionNavProps) {
  const reflowZoom = useSidebarReflowZoom()

  return (
    <footer
      className={cn(
        "shrink-0 border-t border-border pt-4 pb-4",
        !reflowZoom &&
          "sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
      aria-label="Question navigation"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={disablePrevious}
          onClick={onPrevious}
        >
          <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disableNext}
          onClick={onNext}
        >
          Next
          <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
        </Button>
      </div>
    </footer>
  )
}
