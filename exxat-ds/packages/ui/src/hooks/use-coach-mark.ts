"use client"

import * as React from "react"

/* ═══════════════════════════════════════════════════════════════════════════
   useCoachMark — Flow & single-step coach-mark state manager
   ═══════════════════════════════════════════════════════════════════════════
   Handles:
     • Multi-step flows (next / prev / skip / complete)
     • Single coach marks (show / dismiss)
     • Per-step CSS selector targeting — scrolls element into view
     • localStorage persistence so dismissed marks don't reappear
     • Delay before first show (avoids layout flash)
   ═══════════════════════════════════════════════════════════════════════════ */

const STORAGE_PREFIX = "exxat-coach-mark:"

export interface CoachMarkStep {
  /** Unique key — also used for localStorage persistence */
  id: string
  /** CSS selector for the target element this step attaches to */
  target: string
  /** Popover placement side for this step */
  side?: "top" | "bottom" | "left" | "right"
  /** Popover alignment for this step */
  align?: "start" | "center" | "end"
  /** Title shown in the coach mark */
  title: string
  /** Body text / description */
  description: string
  /** Optional image URL shown above the content */
  image?: string
  /** Image alt text (required when image is provided) */
  imageAlt?: string
}

/** Fired on `window` when any coach flow completes (skip or last step). `detail.flowId` is the completed flow. */
export const COACH_MARK_FLOW_COMPLETED_EVENT = "exxat-coach-mark-flow-completed" as const

export interface UseCoachMarkOptions {
  /** Unique ID for the entire flow (used as localStorage key) */
  flowId: string
  /** Steps in order — single-item array for a standalone coach mark */
  steps: CoachMarkStep[]
  /** Delay in ms before the coach mark appears (default 500) */
  delay?: number
  /** Called when the entire flow is completed or skipped */
  onComplete?: () => void
  /** If true, always show even if previously dismissed (dev mode) */
  force?: boolean
  /**
   * When false, the auto-open timer does not run (e.g. until the user switches to a view where the target exists).
   * Default true.
   */
  enabled?: boolean
  /**
   * If set, auto-open only runs after this flow id is dismissed (localStorage) or completes (same-tab via
   * `COACH_MARK_FLOW_COMPLETED_EVENT`). Used to run a follow-up tour after another flow finishes.
   */
  dependsOnDismissedFlowId?: string
}

export interface CoachMarkState {
  /** Whether the coach mark is currently visible */
  isOpen: boolean
  /** Current step index (0-based) */
  currentStep: number
  /** Total number of steps */
  totalSteps: number
  /** The current step data */
  step: CoachMarkStep | null
  /** The resolved target element for the current step */
  targetEl: HTMLElement | null
  /** Virtual anchor rect for Radix positioning */
  anchorRect: { x: number; y: number; width: number; height: number } | null
  /** Whether this is a multi-step flow */
  isFlow: boolean
  /** Whether we're on the first step */
  isFirst: boolean
  /** Whether we're on the last step */
  isLast: boolean
  /** Advance to the next step (or complete if last) */
  next: () => void
  /** Go back to the previous step */
  prev: () => void
  /** Skip/dismiss the entire flow */
  skip: () => void
  /** Programmatically open the coach mark */
  open: () => void
  /** Reset the flow (clears persistence and starts over) */
  reset: () => void
}

function isDismissed(flowId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${flowId}`) === "dismissed"
  } catch {
    return false
  }
}

function setDismissed(flowId: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${flowId}`, "dismissed")
  } catch {
    /* storage full or blocked — silently ignore */
  }
}

function clearDismissed(flowId: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${flowId}`)
  } catch {
    /* ignore */
  }
}

/** Exported for the Settings page — list all coach mark keys in localStorage */
export function getAllCoachMarkKeys(): string[] {
  if (typeof window === "undefined") return []
  const keys: string[] = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        keys.push(key.replace(STORAGE_PREFIX, ""))
      }
    }
  } catch { /* ignore */ }
  return keys
}

/** Exported for the Settings page — reset a specific flow */
export function resetCoachMarkFlow(flowId: string) {
  clearDismissed(flowId)
}

/** Exported for the Settings page — reset ALL coach marks */
export function resetAllCoachMarks() {
  if (typeof window === "undefined") return
  try {
    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) toRemove.push(key)
    }
    toRemove.forEach((k) => localStorage.removeItem(k))
  } catch { /* ignore */ }
}

export function useCoachMark({
  flowId,
  steps,
  delay = 500,
  onComplete,
  force = false,
  enabled = true,
  dependsOnDismissedFlowId,
}: UseCoachMarkOptions): CoachMarkState {
  const [isOpen, setIsOpen] = React.useState(false)
  const [currentStep, setCurrentStep] = React.useState(0)
  const [targetEl, setTargetEl] = React.useState<HTMLElement | null>(null)
  const [anchorRect, setAnchorRect] = React.useState<{
    x: number; y: number; width: number; height: number
  } | null>(null)

  const [prereqMet, setPrereqMet] = React.useState(() => {
    if (!dependsOnDismissedFlowId) return true
    return isDismissed(dependsOnDismissedFlowId)
  })

  React.useEffect(() => {
    if (!dependsOnDismissedFlowId) {
      setPrereqMet(true)
      return
    }
    setPrereqMet(isDismissed(dependsOnDismissedFlowId))
  }, [dependsOnDismissedFlowId])

  React.useEffect(() => {
    if (!dependsOnDismissedFlowId) return
    const handler = (e: Event) => {
      const d = (e as CustomEvent<{ flowId?: string }>).detail
      if (d?.flowId === dependsOnDismissedFlowId) setPrereqMet(true)
    }
    window.addEventListener(COACH_MARK_FLOW_COMPLETED_EVENT, handler as EventListener)
    return () => window.removeEventListener(COACH_MARK_FLOW_COMPLETED_EVENT, handler as EventListener)
  }, [dependsOnDismissedFlowId])

  const totalSteps = steps.length
  const isFlow = totalSteps > 1
  const step = steps[currentStep] ?? null
  const isFirst = currentStep === 0
  const isLast = currentStep === totalSteps - 1

  /* Auto-show after delay (unless previously dismissed) */
  React.useEffect(() => {
    if (enabled === false) return
    if (dependsOnDismissedFlowId && !prereqMet) return
    if (!force && isDismissed(flowId)) return
    const timer = setTimeout(() => setIsOpen(true), delay)
    return () => clearTimeout(timer)
  }, [flowId, delay, force, enabled, dependsOnDismissedFlowId, prereqMet])

  /* Resolve target element + scroll into view when step changes.
     Retries: toolbar controls (e.g. last tour step on “Properties”) often mount after layout;
     a single query was easy to miss → no anchorRect → coach UI vanished on that step. */
  React.useEffect(() => {
    if (!isOpen || !step?.target) {
      return
    }

    let cancelled = false
    const timeouts: ReturnType<typeof setTimeout>[] = []
    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms)
      timeouts.push(id)
      return id
    }

    setAnchorRect(null)
    setTargetEl(null)

    let attempts = 0
    const maxAttempts = 30
    const intervalMs = 100

    const tryResolve = () => {
      if (cancelled) return
      const el = document.querySelector<HTMLElement>(step.target)
      if (!el) {
        attempts += 1
        if (attempts < maxAttempts) schedule(tryResolve, intervalMs)
        return
      }

      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })

      schedule(() => {
        if (cancelled) return
        const rect = el.getBoundingClientRect()
        setAnchorRect({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        })
        setTargetEl(el)
      }, 350)
    }

    schedule(tryResolve, 100)

    return () => {
      cancelled = true
      timeouts.forEach(clearTimeout)
    }
  }, [isOpen, step?.target, currentStep])

  /* Re-measure on scroll/resize while open */
  React.useEffect(() => {
    if (!isOpen || !targetEl) return

    const measure = () => {
      if (!targetEl.isConnected) return
      const rect = targetEl.getBoundingClientRect()
      setAnchorRect({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      })
    }

    window.addEventListener("scroll", measure, { passive: true, capture: true })
    window.addEventListener("resize", measure, { passive: true })
    return () => {
      window.removeEventListener("scroll", measure, true)
      window.removeEventListener("resize", measure)
    }
  }, [isOpen, targetEl])

  const complete = React.useCallback(() => {
    setIsOpen(false)
    setTargetEl(null)
    setAnchorRect(null)
    setDismissed(flowId)
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(COACH_MARK_FLOW_COMPLETED_EVENT, { detail: { flowId } }),
      )
    }
    onComplete?.()
  }, [flowId, onComplete])

  const next = React.useCallback(() => {
    if (isLast) {
      complete()
    } else {
      setCurrentStep((s) => s + 1)
    }
  }, [isLast, complete])

  const prev = React.useCallback(() => {
    setCurrentStep((s) => Math.max(0, s - 1))
  }, [])

  const skip = React.useCallback(() => {
    complete()
  }, [complete])

  const open = React.useCallback(() => {
    setCurrentStep(0)
    setIsOpen(true)
  }, [])

  const reset = React.useCallback(() => {
    clearDismissed(flowId)
    setCurrentStep(0)
    setIsOpen(true)
  }, [flowId])

  return {
    isOpen,
    currentStep,
    totalSteps,
    step,
    targetEl,
    anchorRect,
    isFlow,
    isFirst,
    isLast,
    next,
    prev,
    skip,
    open,
    reset,
  }
}
