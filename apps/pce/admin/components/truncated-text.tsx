'use client'

import { useCallback, useRef, useState, type CSSProperties } from 'react'
import { Tip } from '@exxatdesignux/ui'

interface TruncatedTextProps {
  /** The full text. Doubles as the tooltip label unless `label` overrides it. */
  children: string
  className?: string
  style?: CSSProperties
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** Tooltip label when it should read differently from the visible text. */
  label?: string
}

/**
 * Text that truncates, and reveals the full value on hover AND keyboard focus —
 * but only when it is actually clipped.
 *
 * Two things this exists to get right:
 *
 * 1. **The tooltip is conditional.** A tooltip on a name that already fits is
 *    noise — it tells the reader what they can already read. So we measure
 *    (scrollWidth > clientWidth) and only then wrap in `Tip`. Names that fit
 *    stay inert, with no tab stop and no hover target.
 * 2. **It is not a native `title`.** `title` never fires on keyboard focus, so
 *    the full value would be hover-only — the truncated text is information,
 *    and information behind hover alone is unreachable for keyboard users.
 *    `Tip` fires on both, and the clipped span takes a tab stop to receive it.
 *
 * The observer is attached via a callback ref rather than an effect on purpose:
 * flipping `clipped` remounts the span (bare vs. inside `Tip`), and an effect
 * keyed on the text would keep observing the old, detached node.
 */
export function TruncatedText({ children, className, style, side = 'top', label }: TruncatedTextProps) {
  const [clipped, setClipped] = useState(false)
  const observer = useRef<ResizeObserver | null>(null)

  const measureRef = useCallback((el: HTMLSpanElement | null) => {
    observer.current?.disconnect()
    if (!el) return
    // +1 absorbs sub-pixel rounding, which otherwise reports a snug fit as clipped.
    const measure = () => setClipped(el.scrollWidth > el.clientWidth + 1)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    observer.current = ro
  }, [])

  const text = (
    <span
      ref={measureRef}
      className={`block truncate ${className ?? ''}`}
      style={style}
      tabIndex={clipped ? 0 : undefined}
    >
      {children}
    </span>
  )

  if (!clipped) return text

  return (
    <Tip label={label ?? children} side={side}>
      {text}
    </Tip>
  )
}
