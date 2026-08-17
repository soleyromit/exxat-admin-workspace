"use client"

/**
 * Peek at one question without leaving the bank.
 *
 * A coordinator scanning the library asks "is this the item I want?" far more
 * often than "let me edit this item". A route answers the second question and
 * charges the first one a page load plus a way back; a rail answers the first
 * one in place, with the list still on screen to compare against and to step
 * through. Editing is the second question, so it stays out of the rail and
 * escalates to the full editor.
 *
 * The rail is non-modal and dismisses on a click anywhere in the hub, except on
 * another row: rows carry `railTriggerProps` so a second click retargets the
 * rail instead of closing it and making the user click twice.
 */

import * as React from "react"
import {
  FloatingSheetPanel,
  FloatingSheetPanelBody,
  FloatingSheetPanelContent,
  FloatingSheetPanelFooter,
  FloatingSheetPanelHeader,
  FloatingSheetPanelToolbar,
} from "@/lib/floating-sheet-panel"
import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import { LibraryQuestionDetailBody } from "@/components/library-question-detail"
import type { LibraryItem } from "@/lib/mock/library"
import type { LibraryFolder } from "@/lib/mock/library-folders"

export interface LibraryRecordRailProps {
  /** The question to describe. `null` closes the rail. */
  question: LibraryItem | null
  folders: LibraryFolder[]
  onOpenChange: (open: boolean) => void
  /** Step within the rows the hub is currently showing. Omit at either end. */
  onPrevious?: () => void
  onNext?: () => void
  /** Where this record sits in that set, e.g. `3 of 24`. */
  positionLabel?: string
  /**
   * Leave the rail for the full editor. Omitted until the bank workflow is
   * connected, and the footer then shows the same disabled affordance the tree
   * pane does, so the escalation stays visible instead of silently missing.
   */
  onEditQuestion?: (question: LibraryItem) => void
}

export function LibraryRecordRail({
  question,
  folders,
  onOpenChange,
  onPrevious,
  onNext,
  positionLabel,
  onEditQuestion,
}: LibraryRecordRailProps) {
  // The rail keeps describing the last question through its close animation;
  // dropping to an empty panel mid-slide reads as a glitch.
  const [shown, setShown] = React.useState(question)
  if (question && question !== shown) setShown(question)

  return (
    <FloatingSheetPanel open={question != null} onOpenChange={onOpenChange}>
      <FloatingSheetPanelContent contentSlot="library-record-rail" size="sm">
        <FloatingSheetPanelToolbar
          onPrevious={onPrevious}
          onNext={onNext}
          previousLabel="Previous question"
          nextLabel="Next question"
        />
        {shown ? (
          <>
            <FloatingSheetPanelHeader
              title={shown.stem}
              titleClassName="line-clamp-3 text-base leading-snug"
              subtitle={
                positionLabel ? `${shown.questionId} · ${positionLabel}` : shown.questionId
              }
            />
            <FloatingSheetPanelBody>
              <LibraryQuestionDetailBody question={shown} folders={folders} />
            </FloatingSheetPanelBody>
            <FloatingSheetPanelFooter>
              {onEditQuestion ? (
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onEditQuestion(shown)}
                >
                  <i className="fa-light fa-pencil text-xs leading-none" aria-hidden="true" />
                  Edit question
                </Button>
              ) : (
                <Tip label="Opens the full editor when your bank workflow is connected.">
                  <span className="inline-flex">
                    <Button type="button" size="sm" className="gap-1.5" disabled>
                      <i className="fa-light fa-pencil text-xs leading-none" aria-hidden="true" />
                      Edit question
                    </Button>
                  </span>
                </Tip>
              )}
            </FloatingSheetPanelFooter>
          </>
        ) : null}
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}
