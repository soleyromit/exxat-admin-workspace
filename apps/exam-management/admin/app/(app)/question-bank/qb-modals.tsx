'use client'
import { useState, useRef, useEffect } from 'react'
import { useQB } from './qb-state'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Button, Badge, Avatar, AvatarFallback,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  InputGroup, InputGroupAddon, InputGroupInput, Input, Textarea,
  Field, FieldLabel,
} from '@exxat/ds/packages/ui/src'
import { MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'

// ── Manage Collaborators Modal ────────────────────────────────────────────────
export function ManageCollaboratorsModal() {
  const { collaboratorsModalFolderId, setCollaboratorsModalFolderId, folders, addFolderCollaborator, removeFolderCollaborator } = useQB()
  const folder = folders.find(f => f.id === collaboratorsModalFolderId)
  const [search, setSearch] = useState('')
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current) }
  }, [])

  const currentCollaboratorIds = folder?.collaborators ?? []
  const collaborators = MOCK_QB_PERSONAS.filter(p => currentCollaboratorIds.includes(p.id) && p.id !== pendingRemoveId)

  // Personas not yet on this folder, filtered by search
  const searchTrimmed = search.trim().toLowerCase()
  const suggestions = searchTrimmed.length > 0
    ? MOCK_QB_PERSONAS.filter(p =>
        !currentCollaboratorIds.includes(p.id) &&
        (p.name.toLowerCase().includes(searchTrimmed) || p.id.toLowerCase().includes(searchTrimmed))
      )
    : []

  function addCollaborator(personaId: string) {
    if (!collaboratorsModalFolderId) return
    addFolderCollaborator(collaboratorsModalFolderId, personaId)
    setSearch('')
  }

  function removeCollaborator(id: string) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setPendingRemoveId(id)
    undoTimerRef.current = setTimeout(() => {
      if (collaboratorsModalFolderId) removeFolderCollaborator(collaboratorsModalFolderId, id)
      setPendingRemoveId(null)
      undoTimerRef.current = null
    }, 5000)
  }

  function undoRemove() {
    setPendingRemoveId(null)
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null }
  }

  return (
    <Dialog open={!!collaboratorsModalFolderId} onOpenChange={open => !open && setCollaboratorsModalFolderId(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Access</DialogTitle>
          <DialogDescription className="text-sm">
            {folder?.name} · {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {/* Search + suggestions */}
        <div style={{ position: 'relative' }}>
          <InputGroup>
            <InputGroupInput
              placeholder="Add collaborator by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setSearch('') }}
            />
            <InputGroupAddon align="inline-end">
              {search && (
                <Button variant="ghost" size="icon-sm" aria-label="Clear" onClick={() => setSearch('')}>
                  <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 12 }} />
                </Button>
              )}
            </InputGroupAddon>
          </InputGroup>
          {suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
              background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8,
              boxShadow: 'var(--shadow-md)', padding: '4px',
            }}>
              {suggestions.map(p => (
                <Button
                  key={p.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 h-auto py-1.5 px-2 rounded-md"
                  onClick={() => addCollaborator(p.id)}
                >
                  <Avatar style={{ width: 24, height: 24, flexShrink: 0 }}>
                    <AvatarFallback className="text-[9px] font-bold" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
                      {p.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div style={{ textAlign: 'left' }}>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.role}</div>
                  </div>
                  <i className="fa-light fa-plus ml-auto" aria-hidden="true" style={{ fontSize: 11, color: 'var(--brand-color)' }} />
                </Button>
              ))}
            </div>
          )}
          {searchTrimmed.length > 0 && suggestions.length === 0 && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
              background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8,
              boxShadow: 'var(--shadow-md)', padding: '10px 12px',
            }}>
              <span className="text-xs text-muted-foreground">No matching users found</span>
            </div>
          )}
        </div>

        {/* Undo banner */}
        {pendingRemoveId && (
          <div className="text-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--muted)' }}>
            <span>Collaborator removed.</span>
            <Button variant="ghost" size="sm" onClick={undoRemove} className="text-xs h-6 px-2">Undo</Button>
          </div>
        )}

        {/* Collaborator list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {collaborators.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', borderRadius: 8 }}>
              <Avatar style={{ width: 32, height: 32, flexShrink: 0 }}>
                <AvatarFallback className="text-[11px] font-bold" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
                  {p.initials}
                </AvatarFallback>
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.role}</div>
              </div>
              {i === 0
                ? <Badge variant="secondary" className="rounded text-xs">Owner</Badge>
                : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Select defaultValue="editor">
                      <SelectTrigger className="w-24 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon-xs" aria-label="Remove" onClick={() => removeCollaborator(p.id)}>
                      <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 12 }} />
                    </Button>
                  </div>
                )
              }
            </div>
          ))}
          {collaborators.length === 0 && !pendingRemoveId && (
            <p className="text-xs text-muted-foreground" style={{ padding: '8px 4px' }}>No collaborators yet. Add someone above.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setCollaboratorsModalFolderId(null)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Request Edit Access Modal ─────────────────────────────────────────────────
export function RequestEditAccessModal({ questionTitle, open, onOpenChange }: {
  questionTitle: string
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (submitTimerRef.current) clearTimeout(submitTimerRef.current) }
  }, [])

  function submit() {
    setSent(true)
    submitTimerRef.current = setTimeout(() => {
      onOpenChange(false)
      setSent(false)
      setMessage('')
      submitTimerRef.current = null
    }, 1800)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="fa-light fa-lock-keyhole-open" aria-hidden="true" style={{ fontSize: 16, color: 'var(--brand-color)' }} />
            </div>
            <div>
              <DialogTitle>Request Edit Access</DialogTitle>
              <DialogDescription className="text-xs" style={{ marginTop: 2 }}>
                The owner will be notified and can approve or decline.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {sent
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 0', textAlign: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: 'var(--qb-status-saved-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-light fa-circle-check" aria-hidden="true" style={{ fontSize: 22, color: 'var(--qb-status-saved-fg)' }} />
              </div>
              <div>
                <div className="text-sm font-semibold">Request sent</div>
                <div className="text-xs text-muted-foreground" style={{ marginTop: 2 }}>
                  You&apos;ll get an email when the owner responds.
                </div>
              </div>
            </div>
          )
          : (
            <>
              {/* Question context preview */}
              <div className="text-xs text-muted-foreground" style={{ padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--muted)', lineHeight: 1.4 }}>
                <i className="fa-light fa-file-lines" aria-hidden="true" style={{ marginRight: 6 }} />
                {questionTitle.length > 80 ? questionTitle.slice(0, 80) + '…' : questionTitle}
              </div>

              <Field orientation="vertical">
                <FieldLabel htmlFor="req-message">Message (optional)</FieldLabel>
                <Textarea
                  id="req-message"
                  placeholder="Let the owner know why you need edit access…"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  className="text-sm"
                  style={{ resize: 'none' }}
                />
              </Field>

              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button variant="default" size="sm" onClick={submit}>
                  <i className="fa-light fa-paper-plane" aria-hidden="true" />
                  Send Request
                </Button>
              </DialogFooter>
            </>
          )
        }
      </DialogContent>
    </Dialog>
  )
}

