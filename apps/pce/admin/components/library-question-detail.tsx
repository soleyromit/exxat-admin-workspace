"use client"

/**
 * One description of a library question, for every host that shows one.
 *
 * The tree view's right pane and the hub's peek rail both answer "what is this
 * question?", and they used to answer it in different files. Only the frame
 * differs — the tree pane has a sticky header with its own actions, the rail has
 * `FloatingSheetPanelToolbar` and `FloatingSheetPanelHeader` — so the frame stays
 * with each host and the fields live here.
 *
 * Hosts supply the scrolling; this returns the stack of sections only.
 */

import * as React from "react"
import { LIST_HUB_INSPECTOR_CHIP_SHELL } from "@/components/list-hub-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"
import type { LibraryItem, LibraryLevel } from "@/lib/mock/library"
import type { LibraryFolder } from "@/lib/mock/library-folders"
import { formatDateUS } from "@/lib/date-filter"
import {
  deriveBloomLevel,
  deriveLastEditedLine,
  deriveQuestionItemCode,
  deriveTags,
  QUESTION_TYPE_ABBREV,
} from "@/lib/mock/library-inspector"
import { initialsFromDisplayName } from "@/lib/initials-from-name"

export const DIFFICULTY_LABEL: Record<LibraryLevel, string> = {
  easy: "Low",
  medium: "Normal",
  hard: "High",
}

export function DetailSection({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("min-w-0", className)}>
      <h3 className="mb-2 text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

export function InspectorSectionTitle({
  children,
  id,
}: {
  children: React.ReactNode
  id?: string
}) {
  return (
    <p
      id={id}
      className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
    >
      {children}
    </p>
  )
}

const FIELD_ROW_CLASS = "grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3 gap-y-0.5"

export interface LibraryQuestionDetailBodyProps {
  question: LibraryItem
  /** Used to name the question's parent folder. */
  folders: LibraryFolder[]
  className?: string
}

export function LibraryQuestionDetailBody({
  question,
  folders,
  className,
}: LibraryQuestionDetailBodyProps) {
  const parentFolder = folders.find(f => f.id === question.folderId)
  const folderLeafName = parentFolder?.name ?? "None"
  const itemCode = deriveQuestionItemCode(question)
  const bloom = deriveBloomLevel(question)
  const tags = deriveTags(question)
  const createdBy = question.createdBy ?? question.author
  const creatorInitials = initialsFromDisplayName(createdBy)
  const createdAtLabel = formatDateUS(question.createdAt ?? question.updatedAt)
  const lastEditedLine = deriveLastEditedLine(question)
  const versionLabel = question.version ?? "v1"

  return (
    <div className={cn("flex flex-col gap-5 p-4", className)}>
      <dl className="space-y-2.5 text-sm">
        <div className={FIELD_ROW_CLASS}>
          <dt className="text-muted-foreground">Bloom&apos;s</dt>
          <dd className="font-medium text-foreground">{bloom}</dd>
        </div>
        <div className={FIELD_ROW_CLASS}>
          <dt className="text-muted-foreground">Difficulty</dt>
          <dd className="font-medium text-foreground">{DIFFICULTY_LABEL[question.difficulty]}</dd>
        </div>
        <div className={FIELD_ROW_CLASS}>
          <dt className="text-muted-foreground">Type</dt>
          <dd className="font-medium text-foreground">{QUESTION_TYPE_ABBREV[question.type]}</dd>
        </div>
        <div className={FIELD_ROW_CLASS}>
          <dt className="text-muted-foreground">Folder</dt>
          <dd className="min-w-0 font-medium text-foreground">{folderLeafName}</dd>
        </div>
        <div className={cn(FIELD_ROW_CLASS, "items-center")}>
          <dt className="text-muted-foreground">Code</dt>
          <dd>
            <span className="inline-flex rounded-md border border-rose-200/90 bg-rose-50 px-2 py-0.5 font-mono text-xs font-medium leading-none text-rose-950 shadow-sm dark:border-rose-500/35 dark:bg-rose-950/45 dark:text-rose-50">
              {itemCode}
            </span>
          </dd>
        </div>
      </dl>

      {tags.length > 0 ? (
        <div>
          <InspectorSectionTitle>Tags</InspectorSectionTitle>
          <div className="flex flex-wrap gap-2" role="list" aria-label="Question tags">
            {tags.map(raw => {
              const label = raw.replace(/^#/, "").trim()
              return (
                <Badge
                  key={label}
                  variant="outline"
                  role="listitem"
                  className={cn(
                    LIST_HUB_INSPECTOR_CHIP_SHELL,
                    "border-border/60 bg-muted/15 font-normal text-foreground",
                  )}
                >
                  #{label}
                </Badge>
              )
            })}
          </div>
        </div>
      ) : null}

      <Separator className="bg-border/60" />

      <section className="min-w-0">
        <InspectorSectionTitle>Creator &amp; history</InspectorSectionTitle>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-pink-500/15 text-xs font-semibold text-pink-950 dark:bg-pink-500/25 dark:text-pink-50"
              aria-hidden
            >
              {creatorInitials}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Created by</p>
              <p className="font-medium leading-snug text-foreground">{createdBy}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{createdAtLabel}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last edited</p>
            <p className="font-medium text-foreground">{lastEditedLine}</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-sm">
              <span className="text-muted-foreground">Version </span>
              <span className="font-medium tabular-nums text-foreground">{versionLabel}</span>
            </p>
            <Tip label="Version history opens when connected to your CMS.">
              <span className="inline-flex">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto gap-1 p-0 text-xs font-normal"
                  disabled
                >
                  Version history
                  <i
                    className="fa-light fa-chevron-right text-xs leading-none opacity-70"
                    aria-hidden="true"
                  />
                </Button>
              </span>
            </Tip>
          </div>
        </div>
      </section>

      <Separator className="bg-border/60" />

      <section className="min-w-0">
        <InspectorSectionTitle>Usage</InspectorSectionTitle>
        <dl className="space-y-2 text-sm">
          <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3">
            <dt className="text-muted-foreground">Used in</dt>
            <dd className="font-medium text-foreground">
              {question.examUsageCount != null ? `${question.examUsageCount} exams` : "None"}
            </dd>
          </div>
          <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3">
            <dt className="text-muted-foreground">PBI</dt>
            <dd className="font-semibold tabular-nums text-foreground">
              {question.pbi != null ? question.pbi.toFixed(2) : "None"}
            </dd>
          </div>
          <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3">
            <dt className="text-muted-foreground">Avg score</dt>
            <dd className="font-medium text-foreground">
              {question.avgScoreCorrectPct != null
                ? `${question.avgScoreCorrectPct}% correct`
                : "None"}
            </dd>
          </div>
          <div className="grid grid-cols-[minmax(5.5rem,auto)_minmax(0,1fr)] gap-x-3">
            <dt className="text-muted-foreground">Last used</dt>
            <dd className="font-medium text-foreground">{question.lastUsedLabel ?? "Never"}</dd>
          </div>
        </dl>
      </section>

      {question.type === "multiple_choice" && question.options && question.options.length > 0 ? (
        <>
          <Separator className="bg-border/60" />
          <DetailSection title="Answer choices">
            <ul className="flex flex-col gap-2" aria-label="Multiple choice options">
              {question.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx)
                const isCorrect = Boolean(opt.isCorrect)
                return (
                  <li
                    key={`${question.id}-opt-${idx}`}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                      isCorrect
                        ? "border-emerald-500/40 bg-emerald-500/10 shadow-[inset_0_0_0_1px] shadow-emerald-500/15"
                        : "border-border/50 bg-muted/10",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold tabular-nums",
                        isCorrect
                          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100"
                          : "border-border/60 bg-background text-muted-foreground",
                      )}
                    >
                      {letter}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 leading-snug",
                        isCorrect ? "font-medium text-foreground" : "text-foreground/90",
                      )}
                    >
                      {opt.text}
                    </span>
                    {isCorrect ? (
                      <span className="flex shrink-0 items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <i
                          className="fa-light fa-circle-check text-xs leading-none"
                          aria-hidden="true"
                        />
                        <span className="sr-only">Correct answer</span>
                      </span>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </DetailSection>
        </>
      ) : null}

      {question.type === "true_false" ? (
        <>
          <Separator className="bg-border/60" />
          <DetailSection title="Response format">
            <p className="rounded-lg border border-border/50 bg-muted/10 p-3 text-xs leading-relaxed text-muted-foreground">
              Learners choose <span className="font-medium text-foreground">True</span> or{" "}
              <span className="font-medium text-foreground">False</span>. No options list is shown
              in the bank preview.
            </p>
          </DetailSection>
        </>
      ) : null}

      {question.type === "short_answer" ? (
        <>
          <Separator className="bg-border/60" />
          <DetailSection title="Response format">
            <p className="rounded-lg border border-border/50 bg-muted/10 p-3 text-xs leading-relaxed text-muted-foreground">
              Free-text response; grading rules and sample answers are managed when the question is
              edited in the full editor.
            </p>
          </DetailSection>
        </>
      ) : null}
    </div>
  )
}
