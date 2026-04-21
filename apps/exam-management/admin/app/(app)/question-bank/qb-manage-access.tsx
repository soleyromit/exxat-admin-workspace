'use client'
import { useState } from 'react'
import { useQB } from './qb-state'
import type { AccessRole } from '@/lib/qb-types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Badge, Avatar, AvatarFallback,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxat/ds/packages/ui/src'

export function ManageAccessDialog() {
  const {
    collaboratorsModalFolderId,
    setCollaboratorsModalFolderId,
    folders,
    personas,
    currentPersona,
  } = useQB()

  const folder = folders.find(f => f.id === collaboratorsModalFolderId)

  const [roles, setRoles] = useState<Record<string, AccessRole>>(
    () => folder?.collaboratorRoles ?? Object.fromEntries(
      (folder?.collaborators ?? []).map(id => [id, 'edit' as AccessRole])
    )
  )
  const [collaborators, setCollaborators] = useState<string[]>(
    () => folder?.collaborators ?? []
  )

  if (!folder || !collaboratorsModalFolderId) return null

  const collaboratorPersonas = personas.filter(p => collaborators.includes(p.id))
  const addablePersonas = personas.filter(p => !collaborators.includes(p.id) && p.id !== currentPersona.id)

  function addCollaborator(personaId: string) {
    setCollaborators(prev => [...prev, personaId])
    setRoles(prev => ({ ...prev, [personaId]: 'edit' }))
  }

  function removeCollaborator(personaId: string) {
    setCollaborators(prev => prev.filter(id => id !== personaId))
    setRoles(prev => { const next = { ...prev }; delete next[personaId]; return next })
  }

  function setRole(personaId: string, role: AccessRole) {
    setRoles(prev => ({ ...prev, [personaId]: role }))
  }

  function handleSave() {
    setCollaboratorsModalFolderId(null)
  }

  return (
    <Dialog open={!!collaboratorsModalFolderId} onOpenChange={v => { if (!v) setCollaboratorsModalFolderId(null) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Access — {folder.name}</DialogTitle>
        </DialogHeader>

        {/* Add user */}
        {addablePersonas.length > 0 && (
          <Select onValueChange={addCollaborator}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add person…" />
            </SelectTrigger>
            <SelectContent>
              {addablePersonas.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar style={{ width: 20, height: 20 }}>
                      <AvatarFallback style={{ backgroundColor: p.color, color: 'var(--primary-foreground)', fontSize: 8, fontWeight: 700 }}>
                        {p.initials}
                      </AvatarFallback>
                    </Avatar>
                    {p.name}
                    <Badge variant="secondary" className="rounded" style={{ fontSize: 10 }}>{p.role}</Badge>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Collaborators list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {/* Owner row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
            <Avatar style={{ width: 28, height: 28 }}>
              <AvatarFallback style={{ backgroundColor: currentPersona.color, color: 'var(--primary-foreground)', fontSize: 10, fontWeight: 700 }}>
                {currentPersona.initials}
              </AvatarFallback>
            </Avatar>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{currentPersona.name}</span>
            <Badge variant="secondary" className="rounded" style={{ fontSize: 10 }}>Owner</Badge>
          </div>

          {collaboratorPersonas.length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', padding: '8px 0' }}>
              No collaborators yet. Add someone above.
            </p>
          )}

          {collaboratorPersonas.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
              <Avatar style={{ width: 28, height: 28 }}>
                <AvatarFallback style={{ backgroundColor: p.color, color: 'var(--primary-foreground)', fontSize: 10, fontWeight: 700 }}>
                  {p.initials}
                </AvatarFallback>
              </Avatar>
              <span style={{ flex: 1, fontSize: 13 }}>{p.name}</span>
              <Select value={roles[p.id] ?? 'edit'} onValueChange={(v) => setRole(p.id, v as AccessRole)}>
                <SelectTrigger className="w-28 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">Can edit</SelectItem>
                  <SelectItem value="view">Can view</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon-xs" aria-label={`Remove ${p.name}`} onClick={() => removeCollaborator(p.id)}>
                <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 12 }} />
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setCollaboratorsModalFolderId(null)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
