'use client'
import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export function Tooltip({ content, children, side = 'top', delay = 500 }: TooltipProps) {
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapRef = useRef<HTMLSpanElement>(null)

  const show = () => {
    timerRef.current = setTimeout(() => {
      if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect())
      setVisible(true)
    }, delay)
  }
  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
    setRect(null)
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  // Compute fixed position from rect
  let tooltipStyle: React.CSSProperties = { position: 'fixed', zIndex: 9000, pointerEvents: 'none' }
  if (rect && visible) {
    if (side === 'top') {
      tooltipStyle = { ...tooltipStyle, bottom: window.innerHeight - rect.top + 6, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' }
    } else if (side === 'bottom') {
      tooltipStyle = { ...tooltipStyle, top: rect.bottom + 6, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' }
    } else if (side === 'left') {
      tooltipStyle = { ...tooltipStyle, top: rect.top + rect.height / 2, right: window.innerWidth - rect.left + 6, transform: 'translateY(-50%)' }
    } else {
      tooltipStyle = { ...tooltipStyle, top: rect.top + rect.height / 2, left: rect.right + 6, transform: 'translateY(-50%)' }
    }
  }

  return (
    <span ref={wrapRef} style={{ display: 'inline-flex' }} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && rect && (
        <span
          style={{
            ...tooltipStyle,
            background: 'var(--foreground)',
            color: 'var(--primary-foreground)',
            fontSize: 11,
            fontWeight: 500,
            borderRadius: 6,
            padding: '3px 8px',
            whiteSpace: 'nowrap',
          }}
        >
          {content}
        </span>
      )}
    </span>
  )
}
