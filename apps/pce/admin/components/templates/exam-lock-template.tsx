"use client"

/**
 * ExamLockTemplate — locked assessment shell (exam / proctored delivery).
 *
 * Brand-tint canvas (`bg-sidebar`) + transparent `ExamLockAppHeader` + inset main card
 * (`rounded-xl`, margin, shadow) — same elevation rhythm as the DS sidebar-inset shell.
 *
 * Hides workspace chrome via `App.tsx` + `SidebarAutoCollapse`.
 *
 * Reference: `@/components/exam-lock` + `components/exam-lock-showcase-client.tsx` (Design OS).
 */

import * as React from "react"

import { ExamLockAppHeader, type ExamLockLearnerIdentity } from "@/components/exam-lock/exam-lock-app-header"
import { SidebarAutoCollapse } from "@/components/sidebar"
import { useScrollStuck } from "@/hooks/use-scroll-stuck"
import { useSidebarReflowZoom } from "@/hooks/use-sidebar-reflow-zoom"
import { cn } from "@/lib/utils"

export type { ExamLockLearnerIdentity }

export interface ExamLockTemplateProps {
  /** Exam title — rendered as the page `<h1>` in the lock app header. */
  title: string
  /** Optional descriptor below the title (omit for exam lock delivery). */
  subtitle?: React.ReactNode
  /** Answered-question progress — flush at the top of the main card. */
  progress?: React.ReactNode
  /** When true, warns on tab close / refresh via `beforeunload`. */
  sessionActive: boolean
  /** After submit — replaces body with a no-navigation confirmation screen. */
  submitted?: boolean
  /** Optional timer node (right-aligned in the app header). */
  timer?: React.ReactNode
  /** Keyboard, calculator, settings — rendered before timer / submit. */
  headerToolbar?: React.ReactNode
  /** Right-aligned header actions (default: none — caller supplies Submit in `headerActions`). */
  headerActions?: React.ReactNode
  /** Learner identity — avatar at the far right of the app header. */
  learner?: ExamLockLearnerIdentity
  /**
   * Soft session notices (sync lag, non-blocking hints) below the header.
   * Hard integrity pauses use `interruption` + `useExamLockSessionController`.
   */
  sessionAlert?: React.ReactNode
  /** Pause surface behind the question card — revealed when the card slides down. */
  interruption?: React.ReactNode
  /** When true, the question card slides down to reveal `interruption`. */
  sessionPaused?: boolean
  /** Applied to the scrollable body below the header (e.g. display mode classes). */
  surfaceClassName?: string
  maxWidthClassName?: string
  bodyClassName?: string
  contentClassName?: string
  /** Custom submitted screen; default copy is exam-safe (no links). */
  submittedContent?: React.ReactNode
  children: React.ReactNode
}

function DefaultSubmittedScreen({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div
        className="mb-4 flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand"
        aria-hidden
      >
        <i className="fa-solid fa-circle-check text-2xl font-heading" aria-hidden="true" />
      </div>
      <h2
        className="text-2xl font-semibold tracking-tight text-foreground font-heading"
             >
        Exam submitted
      </h2>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Your answers for <span className="font-medium text-foreground">{title}</span> were
        recorded. You may close this window. There is no return path to the workspace from
        this session.
      </p>
      <p className="mt-6 text-xs text-muted-foreground" role="status">
        If you need assistance, contact your program coordinator. Do not use the browser Back
        button.
      </p>
    </div>
  )
}

/** Inset main card — mirrors the DS sidebar-inset surface; outer `p-2` on the shell owns the gutter when active. */
const EXAM_LOCK_MAIN_CARD_CLASS =
  "relative flex min-h-0 min-w-0 flex-1 flex-col self-stretch overflow-x-hidden bg-background outline-none"

export function ExamLockTemplate({
  title,
  subtitle,
  progress,
  sessionActive,
  submitted = false,
  timer,
  headerToolbar,
  headerActions,
  learner,
  sessionAlert,
  interruption,
  sessionPaused = false,
  surfaceClassName,
  maxWidthClassName = "max-w-5xl",
  bodyClassName,
  contentClassName,
  submittedContent,
  children,
}: ExamLockTemplateProps) {
  React.useEffect(() => {
    if (!sessionActive || submitted) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [sessionActive, submitted])

  const reflowZoom = useSidebarReflowZoom()
  const containLayout = sessionActive && !submitted && !reflowZoom
  const isStuck = useScrollStuck()
  const showPauseSurface = sessionPaused && interruption != null && !submitted

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sidebar p-2">
      <SidebarAutoCollapse />
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {!submitted ? (
          <div
            className={cn(
              "sticky top-0 z-30 shrink-0 rounded-t-xl transition-[background-color,box-shadow]",
              isStuck ? "border-b border-border bg-sidebar shadow-sm" : "bg-transparent",
            )}
          >
            <ExamLockAppHeader
              title={title}
              subtitle={subtitle}
              timer={timer}
              headerToolbar={headerToolbar}
              headerActions={headerActions}
              learner={learner}
              sessionPaused={showPauseSurface}
            />
            {sessionAlert ? (
              <div className="px-4 pb-2 md:px-5" role="region" aria-label="Session status">
                {sessionAlert}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <main
            id="main-content"
            tabIndex={-1}
            className={cn(
              EXAM_LOCK_MAIN_CARD_CLASS,
              "absolute inset-0 overflow-hidden rounded-xl bg-background shadow-sm",
              showPauseSurface && "ring-2 ring-inset ring-border/60",
              containLayout && !showPauseSurface ? "min-h-0" : "",
              !containLayout && !showPauseSurface ? "overflow-y-auto" : "",
              bodyClassName,
            )}
          >
            {showPauseSurface ? (
              <div className="absolute inset-0 z-0" aria-hidden={false}>
                {interruption}
              </div>
            ) : null}
            <div
              aria-hidden={showPauseSurface || undefined}
              className={cn(
                "relative z-10 flex min-h-0 min-w-0 flex-1 flex-col bg-background will-change-transform transition-transform duration-500 ease-out motion-reduce:transition-none",
                showPauseSurface &&
                  "pointer-events-none translate-y-full motion-reduce:translate-y-full",
                containLayout && !showPauseSurface ? "min-h-0 overflow-hidden" : "",
                !containLayout && !showPauseSurface ? "overflow-y-auto" : "",
              )}
            >
              {!submitted && progress ? (
                <div className="shrink-0">{progress}</div>
              ) : null}
              {submitted ? (
                <div className="sr-only">
                  <h1>{title}</h1>
                </div>
              ) : null}
              <div
                className={cn(
                  "mx-auto flex w-full min-w-0 flex-col",
                  maxWidthClassName,
                  containLayout && !showPauseSurface && "min-h-0 flex-1",
                  surfaceClassName,
                )}
              >
                <div
                  className={cn(
                    "px-6 pb-6 md:px-10",
                    containLayout && !showPauseSurface
                      ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                      : "",
                    contentClassName,
                  )}
                >
                  {submitted
                    ? (submittedContent ?? <DefaultSubmittedScreen title={title} />)
                    : children}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
