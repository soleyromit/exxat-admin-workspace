'use client'
import { useState, useRef } from 'react'
import { useQB } from './qb-state'
import type { Persona } from '@/lib/qb-types'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Button, Avatar, AvatarFallback, Input,
} from '@exxat/ds/packages/ui/src'

function PersonAvatar({ persona }: { persona: Persona }) {
  return (
    <Avatar className="h-9 w-9 shrink-0 rounded-full">
      <AvatarFallback
        className="rounded-full text-[11px] font-bold"
        style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}
      >
        {persona.initials}
      </AvatarFallback>
    </Avatar>
  )
}

function getRoleLabel(role: Persona['role']): string {
  if (role === 'exam_admin') return 'Exam Management Admin'
  if (role === 'course_director') return 'Course Director'
  return 'Instructor'
}

function getCapabilityLabel(role: Persona['role']): string {
  if (role === 'exam_admin') return 'Can edit questions across all folders'
  if (role === 'course_director') return 'Can edit questions for this folder'
  return 'Can edit their own questions'
}

function PersonInfo({ persona }: { persona: Persona }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <p className="text-sm font-medium text-foreground" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {persona.name}
      </p>
      <p className="text-xs text-muted-foreground" style={{ margin: 0 }}>{getCapabilityLabel(persona.role)}</p>
    </div>
  )
}

export function ManageAccessDialog() {
  const {
    collaboratorsModalFolderId, setCollaboratorsModalFolderId,
    folders, personas, currentPersona,
    addFolderCollaborator, removeFolderCollaborator,
  } = useQB()

  const folder = folders.find(f => f.id === collaboratorsModalFolderId)

  const [collaborators, setCollaborators] = useState<string[]>(
    () => folder?.collaborators ?? []
  )
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!folder || !collaboratorsModalFolderId) return null

  const collaboratorPersonas = personas.filter(
    p => collaborators.includes(p.id) && p.id !== currentPersona.id
  )

  const addablePersonas = personas.filter(
    p => !collaborators.includes(p.id) && p.id !== currentPersona.id
  )

  const query = search.trim().toLowerCase()
  const searchResults = query
    ? addablePersonas.filter(p =>
        p.name.toLowerCase().includes(query) || getRoleLabel(p.role).toLowerCase().includes(query)
      )
    : addablePersonas

  const showDropdown = (searchFocused || query.length > 0) && addablePersonas.length > 0

  function addCollaborator(personaId: string) {
    setCollaborators(prev => [...prev, personaId])
    setSearch('')
    inputRef.current?.focus()
  }

  function removeCollaborator(personaId: string) {
    setCollaborators(prev => prev.filter(id => id !== personaId))
  }

  function handleSave() {
    if (!folder || !collaboratorsModalFolderId) { setCollaboratorsModalFolderId(null); return }
    const original = folder.collaborators ?? []
    collaborators.filter(id => !original.includes(id)).forEach(id => addFolderCollaborator(collaboratorsModalFolderId, id))
    original.filter(id => !collaborators.includes(id)).forEach(id => removeFolderCollaborator(collaboratorsModalFolderId, id))
    setCollaboratorsModalFolderId(null)
  }

  return (
    <Dialog open={!!collaboratorsModalFolderId} onOpenChange={v => { if (!v) handleSave() }}>
      <DialogContent
        className="sm:max-w-md p-0 gap-0"
        style={{ maxHeight: 540, display: 'flex', flexDirection: 'column', overflow: 'visible' }}
        onOpenAutoFocus={e => e.preventDefault()}
      >

        {/* ── Header ── */}
        <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
          <DialogTitle className="text-base font-bold">Manage Access</DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{folder.name}</p>
        </DialogHeader>

        {/* ── Search ── */}
        {addablePersonas.length > 0 && (
          <div className="px-5 pt-4 pb-0 shrink-0">
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  paddingInline: 12,
                  height: 40,
                  border: `1px solid ${searchFocused ? 'var(--brand-color)' : 'var(--control-border)'}`,
                  borderRadius: 8,
                  boxShadow: searchFocused ? `0 0 0 3px color-mix(in oklch, var(--brand-color) 12%, transparent)` : 'none',
                  transition: 'border-color 120ms, box-shadow 120ms',
                  backgroundColor: 'var(--input-background)',
                }}
              >
                <i
                  className="fa-light fa-magnifying-glass shrink-0"
                  aria-hidden="true"
                  style={{ fontSize: 13, color: searchFocused ? 'var(--brand-color)' : 'var(--muted-foreground)' }}
                />
                <Input
                  ref={inputRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  placeholder="Invite by name or role…"
                  aria-label="Search people to invite"
                  className="text-sm text-foreground"
                  style={{ flex: 1, background: 'transparent', outline: 'none', border: 'none', boxShadow: 'none', height: 'auto', padding: 0 }}
                />
                {search && (
                  <Button
                    variant="ghost" size="icon-xs"
                    aria-label="Clear search"
                    onClick={() => { setSearch(''); inputRef.current?.focus() }}
                    tabIndex={-1}
                  >
                    <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
                  </Button>
                )}
              </div>

              {showDropdown && (
                <div
                  role="listbox"
                  aria-label="People you can invite"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    backgroundColor: 'var(--popover)',
                    border: '1px solid var(--control-border)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-lg)',
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}
                >
                  {searchResults.length > 0 ? (
                    <div className="p-1">
                      {searchResults.map(p => (
                        <SearchResultRow key={p.id} persona={p} onAdd={() => addCollaborator(p.id)} />
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-sm text-muted-foreground">No matches for &ldquo;{search}&rdquo;</p>
                      <p className="text-xs text-muted-foreground mt-1 opacity-70">Try a different name or role</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── People with access ── */}
        <div className="px-5 py-4 flex flex-col gap-1 overflow-y-auto flex-1 min-h-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground mb-2">
            People with access
          </p>

          {/* Owner row */}
          <div className="flex items-center gap-3 py-1.5">
            <PersonAvatar persona={currentPersona} />
            <PersonInfo persona={currentPersona} />
            <span className="text-xs text-muted-foreground" style={{ flexShrink: 0 }}>
              Owner
            </span>
          </div>

          {/* Collaborator rows */}
          {collaboratorPersonas.map(p => (
            <div key={p.id} className="flex items-center gap-3 py-1.5">
              <PersonAvatar persona={p} />
              <PersonInfo persona={p} />
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Remove ${p.name}`}
                onClick={() => removeCollaborator(p.id)}
                className="text-muted-foreground"
              style={{ width: 24, flexShrink: 0 }}
              >
                <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 13 }} />
              </Button>
            </div>
          ))}

          {collaboratorPersonas.length === 0 && (
            <p className="text-xs text-muted-foreground italic py-1">
              Only you have access to this folder.
            </p>
          )}
        </div>

      </DialogContent>
    </Dialog>
  )
}

function SearchResultRow({ persona, onAdd }: { persona: Persona; onAdd: () => void }) {
  return (
    <div
      role="option"
      aria-selected="false"
      onClick={onAdd}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAdd() } }}
      tabIndex={0}
      className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <PersonAvatar persona={persona} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{persona.name}</p>
        <p className="text-xs text-muted-foreground">{getCapabilityLabel(persona.role)}</p>
      </div>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" style={{ padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)', flexShrink: 0, pointerEvents: 'none' }}>
        <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 9 }} />
        Invite
      </span>
    </div>
  )
}
