"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"

export interface QuestionBankPageHeaderProps {
  questionCount: number
  onNewQuestion: () => void
  onExport: () => void
  showMetrics: boolean
  onToggleMetrics: () => void
  showTitleBlock?: boolean
}

export function QuestionBankPageHeader({
  questionCount,
  onNewQuestion,
  onExport,
  showMetrics,
  onToggleMetrics,
  showTitleBlock = true,
}: QuestionBankPageHeaderProps) {
  const [moreOpen, setMoreOpen] = React.useState(false)
  const countLine = `${questionCount} ${questionCount === 1 ? "question" : "questions"} · Last updated now`

  return (
    <PageHeader
      title="Question bank"
      subtitle={countLine}
      showTitleBlock={showTitleBlock}
      actions={(
        <div className="flex items-center gap-2" role="group" aria-label="Question bank actions">
          <Tip side="bottom" label="Create a new question (demo)">
            <Button type="button" size="lg" onClick={onNewQuestion}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              New question
            </Button>
          </Tip>
          <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
            <Tip side="bottom" label="More actions">
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="aspect-square px-0"
                  aria-label="More actions"
                >
                  <i className="fa-light fa-ellipsis text-base" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </Tip>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={() => {
                  setMoreOpen(false)
                  onExport()
                }}
              >
                <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onToggleMetrics}>
                <i
                  className={`fa-light ${showMetrics ? "fa-eye-slash" : "fa-eye"}`}
                  aria-hidden="true"
                />
                {showMetrics ? "Hide metric section" : "Show metric section"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    />
  )
}
