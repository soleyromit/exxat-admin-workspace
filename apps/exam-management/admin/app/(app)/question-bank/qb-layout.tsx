'use client'
import { useQB } from './qb-state'

export function QBLayoutInner({ children }: { children: React.ReactNode }) {
  const { closeAllOverlays } = useQB()

  return (
    <div
      className="qb-content-wrapper"
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowX: 'hidden', overflowY: 'auto', position: 'relative' }}
      onClick={closeAllOverlays}
    >
      {children}
    </div>
  )
}
