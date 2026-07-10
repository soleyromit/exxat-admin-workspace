'use client'

import { useState, useEffect } from 'react'

export const FLOATING_SHEET_CHROME_CLASS = 'rounded-lg border border-border bg-card shadow-lg'

export function floatingSheetWidthClass(compact: boolean): string {
  return compact ? 'w-64' : 'w-80'
}

export function useCompactFloatingSheet(): boolean {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    setCompact(mq.matches)
    const handler = (e: MediaQueryListEvent) => setCompact(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return compact
}
