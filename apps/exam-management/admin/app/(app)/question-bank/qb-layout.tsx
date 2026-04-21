'use client'
import { useQB } from './qb-state'
import { ManageAccessDialog } from './qb-manage-access'

export function QBLayoutInner({ children }: { children: React.ReactNode }) {
  const { closeAllOverlays } = useQB()

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative' }}
      onClick={closeAllOverlays}
    >
      {children}
      <ManageAccessDialog />
    </div>
  )
}
