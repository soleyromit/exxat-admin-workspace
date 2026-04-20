'use client'
import { useState, useRef, useEffect } from 'react'
import { useQB } from './qb-state'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Button, Badge, Avatar, AvatarFallback,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  InputGroup, InputGroupAddon, Input, Textarea, ToggleSwitch,
  Field, FieldLabel,
} from '@exxat/ds/packages/ui/src'
import { MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'

// ── Manage Collaborators Modal ────────────────────────────────────────────────
export function ManageCollaboratorsModal() {
  const { collaboratorsModalFolderId, setCollaboratorsModalFolderId, folders } = useQB()
  const folder = folders.find(f => f.id === collaboratorsModalFolderId)
  const [search, setSearch] = useState('')
  const [removedId, setRemovedId] = useState<string | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (undoTimerRef.current) clearTimeout(undoTimerRef.current) }
  }, [])

  const collaborators = MOCK_QB_PERSONAS.filter(p => folder?.collaborators?.includes(p.id) && p.id !== removedId)

  function removeCollaborator(id: string) {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    setRemovedId(id)
    undoTimerRef.current = setTimeout(() => { setRemovedId(null); undoTimerRef.current = null }, 5000)
  }

  function undoRemove() {
    setRemovedId(null)
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null }
  }

  return (
    <Dialog open={!!collaboratorsModalFolderId} onOpenChange={open => !open && setCollaboratorsModalFolderId(null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Access</DialogTitle>
          <DialogDescription style={{ fontSize: 13 }}>
            {folder?.name} · {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {/* Search + invite */}
        <InputGroup>
          <Input placeholder="Invite by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          <InputGroupAddon align="inline-end">
            <Button variant="ghost" size="icon-sm" aria-label="Invite" disabled={!search.trim()}>
              <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 13 }} />
            </Button>
          </InputGroupAddon>
        </InputGroup>

        {/* Undo banner */}
        {removedId && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--muted)', fontSize: 13 }}>
            <span>Collaborator removed.</span>
            <Button variant="ghost" size="sm" onClick={undoRemove} className="text-xs h-6 px-2">Undo</Button>
          </div>
        )}

        {/* Collaborator list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {collaborators.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', borderRadius: 8 }}>
              <Avatar style={{ width: 32, height: 32, flexShrink: 0 }}>
                <AvatarFallback style={{ backgroundColor: p.color, color: 'var(--primary-foreground)', fontSize: 11, fontWeight: 700 }}>
                  {p.initials}
                </AvatarFallback>
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{p.role}</div>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setCollaboratorsModalFolderId(null)}>Done</Button>
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
              <DialogDescription style={{ fontSize: 12, marginTop: 2 }}>
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
                <div style={{ fontSize: 14, fontWeight: 600 }}>Request sent</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                  You&apos;ll get an email when the owner responds.
                </div>
              </div>
            </div>
          )
          : (
            <>
              {/* Question context preview */}
              <div style={{ padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--muted)', fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
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
                  style={{ resize: 'none', fontSize: 13 }}
                />
              </Field>

              <DialogFooter>
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={submit}>
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

// ── Filter Sheet ──────────────────────────────────────────────────────────────
export function FilterSheet() {
  const { filterSheetOpen, setFilterSheetOpen, favoritesFilter, setFavoritesFilter } = useQB()
  const [statusFilter, setStatusFilter] = useState<('Saved' | 'Draft')[]>([])
  const [filters, setFilters] = useState<Record<string, string[]>>({})

  function toggleStatus(s: 'Saved' | 'Draft') {
    setStatusFilter(prev => prev.includes(s) ? prev.filter(v => v !== s) : [...prev, s])
  }

  function toggleFilter(field: string, val: string) {
    setFilters(prev => ({
      ...prev,
      [field]: prev[field]?.includes(val)
        ? prev[field].filter(v => v !== val)
        : [...(prev[field] ?? []), val],
    }))
  }

  const sections: [string, string[]][] = [
    ['Type',        ['MCQ', 'Fill blank', 'Hotspot', 'Ordering', 'Matching']],
    ['Difficulty',  ['Easy', 'Medium', 'Hard']],
    ["Bloom's",     ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']],
  ]

  return (
    <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
      <SheetContent side="right" showCloseButton style={{ width: 320, display: 'flex', flexDirection: 'column', padding: 0 }}>
        <SheetHeader style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>

          {/* Favorites */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Favorites only</span>
            <ToggleSwitch checked={favoritesFilter} onChange={setFavoritesFilter} />
          </div>

          {/* Status */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Status</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['Saved', 'Draft'] as const).map(s => (
                <Button
                  key={s}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStatus(s)}
                  style={statusFilter.includes(s) ? {
                    borderColor: 'var(--brand-color)',
                    backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
                    color: 'var(--brand-color-dark)',
                  } : {}}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {sections.map(([label, opts]) => (
            <div key={label} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>{label}</div>
              {opts.map(opt => {
                const checked = filters[label]?.includes(opt)
                return (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                    <div
                      onClick={() => toggleFilter(label, opt)}
                      style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${checked ? 'var(--brand-color)' : 'var(--border-control-3)'}`,
                        backgroundColor: checked ? 'var(--brand-color)' : 'var(--background)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      }}
                    >
                      {checked && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 9, color: 'var(--brand-foreground)' }} />}
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{opt}</span>
                  </label>
                )
              })}
            </div>
          ))}
        </div>

        <SheetFooter style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', gap: 8, flexShrink: 0 }}>
          <Button variant="ghost" onClick={() => { setStatusFilter([]); setFilters({}); setFilterSheetOpen(false) }}>
            Clear all
          </Button>
          <Button onClick={() => setFilterSheetOpen(false)} style={{ flex: 1 }}>
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
