'use client'
import { useQB } from './qb-state'
import { ManageAccessDialog } from './qb-manage-access'

export function QBLayoutInner({ children }: { children: React.ReactNode }) {
  const { closeAllOverlays, collaboratorsModalFolderId } = useQB()

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative' }}
      onClick={closeAllOverlays}
    >
      {children}
      {collaboratorsModalFolderId && <ManageAccessDialog key={collaboratorsModalFolderId} />}
    </div>
  )
}
