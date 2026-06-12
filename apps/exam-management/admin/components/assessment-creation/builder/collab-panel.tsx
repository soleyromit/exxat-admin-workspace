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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  ToggleSwitch,
  AvatarInitials,
  Button,
  Badge,
  Card,
  CardContent,
} from '@exxatdesignux/ui'
import { FACULTY, type FacultyId, type Section, type BuilderMeta } from '../data'

export function CollabPanel({ meta, setMeta, sections, setSections, onClose }: {
  meta: BuilderMeta; setMeta: (fn: (m: BuilderMeta) => BuilderMeta) => void
  sections: Section[]; setSections: (fn: (s: Section[]) => Section[]) => void; onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Collaborators & delegation</DialogTitle>
          <DialogDescription>Section-level drafting rights — change anytime</DialogDescription>
        </DialogHeader>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Section delegation</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
            {sections.map(s => (
              <Card key={s.id} style={{ borderRadius: 12 }}>
              <CardContent style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div><div className="hint">{s.questions.length} questions</div></div>
                <Select value={s.owner} onValueChange={(v) => setSections(prev => prev.map(x => x.id === s.id ? { ...x, owner: v as FacultyId } : x))}>
                  <SelectTrigger style={{ width: 180 }} aria-label={`Owner for ${s.name}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FACULTY).filter(f => f.role !== 'Chairperson').map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </CardContent>
              </Card>
            ))}
          </div>
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
