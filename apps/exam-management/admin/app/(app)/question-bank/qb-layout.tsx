'use client'
import { useQB } from './qb-state'
import { ManageAccessDialog } from './qb-manage-access'

export function QBLayoutInner({ children }: { children: React.ReactNode }) {
  const { closeAllOverlays, collaboratorsModalFolderId } = useQB()

  return (
    <div
      className="qb-content-wrapper"
      style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflowX: 'hidden', overflowY: 'auto', position: 'relative' }}
      onClick={closeAllOverlays}
    >
      {children}
      {collaboratorsModalFolderId && <ManageAccessDialog key={collaboratorsModalFolderId} />}
    </div>
  )
}
