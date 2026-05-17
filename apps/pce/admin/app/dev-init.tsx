'use client'
import { useEffect } from 'react'
export function DevInit() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    import('./dev-updates').then(m => m.initDevUpdates())
  }, [])
  return null
}
