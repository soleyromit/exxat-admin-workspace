'use client'

/* Collaboration / delegation panel — section-level drafting rights + team toggles.
   Faithful 1:1 port of the Claude Design builder.jsx CollabPanel. */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  ToggleSwitch,
  AvatarInitials,
  Button,
  Badge,
} from '@exxatdesignux/ui'
import { FACULTY, type BuilderMeta } from '../data'

export function CollabPanel({ meta, setMeta, onClose }: {
  meta: BuilderMeta; setMeta: (fn: (m: BuilderMeta) => BuilderMeta) => void; onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Collaborators</DialogTitle>
          <DialogDescription>Manage who has access to this assessment</DialogDescription>
        </DialogHeader>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Team members</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.values(FACULTY).map(f => {
              const isOwner = meta.owner === f.id
              const on = isOwner || meta.collaborators.includes(f.id)
              return (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 0' }}>
                  <AvatarInitials size="sm" initials={f.initials} />
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{f.name}</div><div className="hint">{f.role}</div></div>
                  {isOwner
                    ? <Badge>Owner</Badge>
                    : <ToggleSwitch checked={on} onChange={() => setMeta(m => ({ ...m, collaborators: m.collaborators.includes(f.id) ? m.collaborators.filter(x => x !== f.id) : [...m.collaborators, f.id] }))} />}
                </div>
              )
            })}
          </div>
        </div>
        <DialogFooter>
          <Button variant="default" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
