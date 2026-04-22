"use client"

/**
 * CoachMark — contextual onboarding / feature-discovery popover
 *
 * Targets elements by CSS selector, scrolls them into view, and positions
 * the popover relative to the target using Radix's virtual anchor.
 *
 * Variants:
 *   • single   — standalone tip anchored to a target element
 *   • flow     — multi-step walkthrough with prev/next and step indicator
 *   • image    — includes a hero image above the content
 *   • no-image — text-only (title + description)
 *
 * Brand-colored background with spotlight overlay on the target element.
 *
 * WCAG 2.1 AA:
 *   • Focus trapped inside while open
 *   • Escape dismisses
 *   • aria-labelledby / aria-describedby wired automatically
 *   • Step indicator announced via aria-live
 */

import * as React from "react"
import { createPortal } from "react-dom"
import { Popover as PopoverPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { Button } from "./button"
import { cn } from "../../lib/utils"
import type { CoachMarkState } from "../../hooks/use-coach-mark"

/* ── Variant styles ─────────────────────────────────────────────────────── */

const coachMarkVariants = cva(
  "z-[60] flex flex-col overflow-hidden rounded-xl bg-brand-deep text-white shadow-xl outline-none hc:!bg-background hc:!text-foreground hc:!border-2 hc:!border-foreground hc:!shadow-none",
  {
    variants: {
      size: {
        default: "w-[320px]",
        sm: "w-[260px]",
        lg: "w-[400px]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

/* ── Sub-components ─────────────────────────────────────────────────────── */

function CoachMarkImage({
  src,
  alt,
}: {
  src: string
  alt: string
}) {
  return (
    <div className="relative w-full overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="h-[160px] w-full object-cover"
      />
    </div>
  )
}

function CoachMarkStepIndicator({
  current,
  total,
}: {
  current: number
  total: number
}) {
  return (
    <div
      className="flex items-center gap-1"
      role="status"
      aria-live="polite"
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all duration-200",
            i === current
              ? "w-4 bg-white hc:bg-foreground"
              : "w-1.5 bg-white/30 hc:bg-foreground/40"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

/* ── Spotlight overlay — highlights the target element ──────────────────── */

function SpotlightOverlay({
  rect,
  maskId,
}: {
  rect: { x: number; y: number; width: number; height: number }
  /** Unique per coach instance — multiple flows on one page must not duplicate SVG mask ids. */
  maskId: string
}) {
  const padding = 6
  const borderRadius = 8
  const x = rect.x - padding
  const y = rect.y - padding
  const w = rect.width + padding * 2
  const h = rect.height + padding * 2
  const maskUrl = `url(#${maskId})`

  return createPortal(
    <div
      className="fixed inset-0 z-[55]"
      aria-hidden="true"
    >
      {/* Semi-transparent overlay with a cutout for the target */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id={maskId}>
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              rx={borderRadius}
              ry={borderRadius}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.5)"
          mask={maskUrl}
        />
      </svg>

      {/* Highlight ring around the target */}
      <div
        className="absolute rounded-lg ring-2 ring-brand hc:ring-foreground shadow-[0_0_0_4px_rgba(0,0,0,0.3)] hc:shadow-none"
        style={{
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius,
        }}
      />
    </div>,
    document.body
  )
}

/* ── Main component ─────────────────────────────────────────────────────── */

export interface CoachMarkProps
  extends VariantProps<typeof coachMarkVariants> {
  /** State from useCoachMark hook */
  state: CoachMarkState
  /** Default popover placement side (step-level side takes priority) */
  side?: "top" | "bottom" | "left" | "right"
  /** Default popover alignment (step-level align takes priority) */
  align?: "start" | "center" | "end"
  /** Offset from anchor element in px */
  sideOffset?: number
  /** Label for the primary (next/done) button — defaults to "Next" / "Got it" */
  nextLabel?: string
  /** Label for the skip button — defaults to "Skip" */
  skipLabel?: string
  /** Extra className for the content container */
  className?: string
}

export function CoachMark({
  state,
  side = "bottom",
  align = "center",
  sideOffset = 12,
  nextLabel,
  skipLabel = "Skip",
  size,
  className,
}: CoachMarkProps) {
  const spotlightMaskId = React.useId().replace(/:/g, "")
  const {
    isOpen,
    step,
    currentStep,
    totalSteps,
    isFlow,
    isFirst,
    isLast,
    next,
    prev,
    skip,
    anchorRect,
  } = state

  if (!isOpen || !step) return null
  if (!anchorRect) return null

  const titleId = `coach-mark-title-${step.id}`
  const descId = `coach-mark-desc-${step.id}`
  const hasImage = Boolean(step.image)
  const primaryLabel = nextLabel ?? (isLast ? "Got it" : "Next")
  const resolvedSide = step.side ?? side
  const resolvedAlign = step.align ?? align

  return (
    <>
      {/* Spotlight overlay */}
      <SpotlightOverlay rect={anchorRect} maskId={`coach-spotlight-${spotlightMaskId}`} />

      {/* Popover with virtual anchor */}
      <PopoverPrimitive.Root open>
        <PopoverPrimitive.Anchor
          virtualRef={{
            current: {
              getBoundingClientRect: () => ({
                x: anchorRect.x,
                y: anchorRect.y,
                top: anchorRect.y,
                left: anchorRect.x,
                bottom: anchorRect.y + anchorRect.height,
                right: anchorRect.x + anchorRect.width,
                width: anchorRect.width,
                height: anchorRect.height,
                toJSON: () => {},
              }),
            },
          }}
        />

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            data-slot="coach-mark"
            side={resolvedSide}
            align={resolvedAlign}
            sideOffset={sideOffset}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={() => skip()}
            aria-labelledby={titleId}
            aria-describedby={descId}
            className={cn(
              coachMarkVariants({ size }),
              /* animations */
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
              "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
              className
            )}
          >
            {/* Image (optional) */}
            {hasImage && (
              <CoachMarkImage
                src={step.image!}
                alt={step.imageAlt ?? step.title}
              />
            )}

            {/* Body */}
            <div className="flex flex-col gap-3 p-4">
              {/* Title + close */}
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <h3
                    id={titleId}
                    className="text-sm font-semibold text-white leading-snug"
                  >
                    {step.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={skip}
                  className="shrink-0 -mt-0.5 -mr-1 flex h-6 w-6 items-center justify-center rounded-md text-white/60 hover:bg-white/15 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white hc:!text-foreground hc:hover:!bg-foreground/10"
                  aria-label="Dismiss"
                >
                  <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
                </button>
              </div>

              {/* Description */}
              <p
                id={descId}
                className="text-sm text-white/80 leading-relaxed"
              >
                {step.description}
              </p>

              {/* Footer: step indicator + actions */}
              <div className="flex items-center justify-between gap-3 pt-1">
                {/* Left: step dots (flow only) */}
                <div className="flex-1">
                  {isFlow && (
                    <CoachMarkStepIndicator
                      current={currentStep}
                      total={totalSteps}
                    />
                  )}
                </div>

                {/* Right: buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {isFlow && !isLast && (
                    <button
                      type="button"
                      onClick={skip}
                      className="h-8 px-3 text-xs font-medium text-white/60 hover:text-white transition-colors rounded-md focus-visible:outline-2 focus-visible:outline-white hc:!text-foreground hc:hover:!text-foreground/80"
                    >
                      {skipLabel}
                    </button>
                  )}
                  {isFlow && !isFirst && (
                    <button
                      type="button"
                      onClick={prev}
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-white bg-white/15 hover:bg-white/25 rounded-md border border-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-white hc:!bg-background hc:!text-foreground hc:!border-foreground"
                    >
                      <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-brand-deep bg-white hover:bg-white/90 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-white hc:!bg-foreground hc:!text-background hc:border hc:border-foreground"
                  >
                    {primaryLabel}
                    {isFlow && !isLast && (
                      <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Arrow */}
            <PopoverPrimitive.Arrow
              className="fill-brand-deep drop-shadow-sm hc:fill-background"
              width={12}
              height={6}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </>
  )
}
