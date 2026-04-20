'use client'
import { useState } from 'react'
import { useQB } from './qb-state'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Button, Badge,
} from '@exxat/ds/packages/ui/src'
import type { FolderNode } from '@/lib/qb-types'

// ── Folder picker tree (shared) ───────────────────────────────────────────────
function FolderPickerNode({
  node, depth, folders, selected, onSelect,
}: {
  node: FolderNode
  depth: number
  folders: FolderNode[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const children = folders.filter(f => f.parentId === node.id && !f.isPrivateSpace && !f.isQuestionSet)
  const isSelected = selected === node.id
  const icon = depth === 0 ? 'fa-solid fa-graduation-cap' : depth === 1 ? 'fa-solid fa-calendar' : 'fa-solid fa-folder'

  return (
    <div>
      <button
        onClick={() => { onSelect(node.id); if (children.length) setExpanded(e => !e) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', border: 'none', cursor: 'pointer',
          padding: `6px 12px 6px ${12 + depth * 20}px`,
          backgroundColor: isSelected ? 'var(--brand-tint)' : 'transparent',
          borderRadius: 6, textAlign: 'left',
          outline: isSelected ? '2px solid var(--brand-color)' : 'none',
        }}
      >
        <i className={icon} aria-hidden="true"
          style={{ fontSize: 12, color: isSelected ? 'var(--brand-color)' : 'var(--muted-foreground)', width: 14, textAlign: 'center' }} />
        <span style={{ flex: 1, fontSize: 13, color: isSelected ? 'var(--brand-color-dark)' : 'var(--foreground)', fontWeight: isSelected ? 600 : 400 }}>
          {node.name}
        </span>
        {isSelected && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 11, color: 'var(--brand-color)' }} />}
      </button>
      {expanded && children.map(child => (
        <FolderPickerNode key={child.id} node={child} depth={depth + 1} folders={folders} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  )
}

// ── Smart Populate Modal ──────────────────────────────────────────────────────
export function SmartPopulateModal() {
  const { smartPopulateOpen, setSmartPopulateOpen, folders, questions } = useQB()
  const [mode, setMode] = useState<'promote' | 'auto-collect'>('promote')
  const [step, setStep] = useState(1)
  const [selectedQIds, setSelectedQIds] = useState<Set<string>>(new Set())
  const [targetFolder, setTargetFolder] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [chips, setChips] = useState<{ difficulty: string[]; type: string[] }>({ difficulty: [], type: [] })

  const privateDrafts = questions.filter(q => q.tags.includes('private') && q.status === 'Draft')
  const rootFolders = folders.filter(f => f.parentId === null && !f.isPrivateSpace && !f.isQuestionSet)

  function toggleQId(id: string) {
    setSelectedQIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleChip(cat: 'difficulty' | 'type', val: string) {
    setChips(prev => ({ ...prev, [cat]: prev[cat].includes(val) ? prev[cat].filter(v => v !== val) : [...prev[cat], val] }))
  }

  function close() {
    setSmartPopulateOpen(false)
    setStep(1)
    setSuccess(false)
    setSelectedQIds(new Set())
    setTargetFolder(null)
  }

  const chip = (cat: 'difficulty' | 'type', val: string) => {
    const active = chips[cat].includes(val)
    return (
      <button key={val} onClick={() => toggleChip(cat, val)} style={{
        padding: '4px 12px', borderRadius: 20,
        border: `1px solid var(--border)`,
        cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400,
        backgroundColor: active ? 'var(--brand-color)' : 'var(--background)',
        color: active ? 'var(--brand-foreground)' : 'var(--muted-foreground)',
      }}>
        {val}
      </button>
    )
  }

  const StepIndicator = ({ current }: { current: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16 }}>
      {[1, 2, 3].map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
          <div
            onClick={() => s < current && setStep(s)}
            style={{
              width: 22, height: 22, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              backgroundColor: s < current ? 'var(--brand-color)' : s === current ? 'var(--brand-tint)' : 'var(--muted)',
              border: `2px solid ${s <= current ? 'var(--brand-color)' : 'var(--border)'}`,
              color: s < current ? 'var(--brand-foreground)' : s === current ? 'var(--brand-color-dark)' : 'var(--muted-foreground)',
              cursor: s < current ? 'pointer' : 'default',
            }}
          >
            {s < current ? <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 9 }} /> : s}
          </div>
          {i < 2 && <div style={{ width: 32, height: 2, backgroundColor: s < current ? 'var(--brand-color)' : 'var(--border)' }} />}
        </div>
      ))}
    </div>
  )

  return (
    <Dialog open={smartPopulateOpen} onOpenChange={(v) => { if (!v) close() }}>
      <DialogContent showCloseButton style={{ maxWidth: 560, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
        {/* Header */}
        <DialogHeader style={{ padding: '20px 20px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--brand-color) 0%, var(--qb-question-set) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fa-regular fa-sparkles" aria-hidden="true" style={{ fontSize: 18, color: 'var(--primary-foreground)' }} />
            </div>
            <div>
              <DialogTitle style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Smart Populate</DialogTitle>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
                {mode === 'promote' ? 'Move private drafts into shared folders' : 'Auto-collect questions by criteria'}
              </p>
            </div>
          </div>

          {/* Mode tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {(['promote', 'auto-collect'] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setStep(1); setSuccess(false) }}
                style={{
                  flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', background: 'none',
                  borderBottom: mode === m ? '2px solid var(--brand-color)' : '2px solid transparent',
                  color: mode === m ? 'var(--brand-color)' : 'var(--muted-foreground)',
                  fontWeight: mode === m ? 600 : 400, fontSize: 13,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                <i className={`fa-regular ${m === 'promote' ? 'fa-sparkles' : 'fa-bolt'}`} aria-hidden="true" style={{ fontSize: 12 }} />
                {m === 'promote' ? 'Promote Drafts' : 'Auto-collect'}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                backgroundColor: mode === 'promote' ? 'var(--qb-trust-senior-bg)' : 'color-mix(in oklch, var(--qb-locked) 10%, var(--background))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={`fa-solid ${mode === 'promote' ? 'fa-circle-check' : 'fa-bolt'}`} aria-hidden="true"
                  style={{ fontSize: 28, color: mode === 'promote' ? 'var(--qb-trust-senior-color)' : 'var(--qb-locked)' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>
                {mode === 'promote' ? 'Successfully promoted!' : 'Questions collected!'}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
                {mode === 'promote' ? `${selectedQIds.size} questions moved to shared pool.` : 'Auto-collected questions added to the selected folder.'}
              </p>
            </div>
          ) : mode === 'promote' ? (
            <>
              <StepIndicator current={step} />
              {step === 1 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Select Questions</h3>
                    <button onClick={() => setSelectedQIds(new Set(privateDrafts.map(q => q.id)))}
                      style={{ fontSize: 12, color: 'var(--brand-color)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Select all
                    </button>
                  </div>
                  {privateDrafts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted-foreground)' }}>
                      <i className="fa-regular fa-folder-open" aria-hidden="true" style={{ fontSize: 24, marginBottom: 8 }} />
                      <p>No private drafts found.</p>
                    </div>
                  ) : privateDrafts.map(q => (
                    <div key={q.id} onClick={() => toggleQId(q.id)} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, marginBottom: 6,
                      borderRadius: 8, cursor: 'pointer',
                      border: `1px solid ${selectedQIds.has(q.id) ? 'var(--brand-color)' : 'var(--border)'}`,
                      backgroundColor: selectedQIds.has(q.id) ? 'var(--brand-tint)' : 'var(--background)',
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2,
                        border: `2px solid ${selectedQIds.has(q.id) ? 'var(--brand-color)' : 'var(--border)'}`,
                        backgroundColor: selectedQIds.has(q.id) ? 'var(--brand-color)' : 'var(--background)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {selectedQIds.has(q.id) && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 9, color: 'var(--brand-foreground)' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 4 }}>{q.title}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Badge variant="secondary">{q.status}</Badge>
                          <Badge variant="secondary">{q.difficulty}</Badge>
                          <Badge variant="secondary">{q.type}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {step === 2 && (
                <>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Choose Target Folder</h3>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', maxHeight: 300, overflowY: 'auto', padding: 8 }}>
                    {rootFolders.map(f => (
                      <FolderPickerNode key={f.id} node={f} depth={0} folders={folders} selected={targetFolder} onSelect={setTargetFolder} />
                    ))}
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Review &amp; Promote</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--brand-tint)' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand-color-dark)' }}>{selectedQIds.size}</div>
                      <div style={{ fontSize: 12, color: 'var(--brand-color-dark)' }}>Questions selected</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'color-mix(in oklch, var(--qb-locked) 10%, var(--background))' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--qb-locked)' }}>Target folder</div>
                      <div style={{ fontSize: 12, color: 'var(--qb-locked)' }}>{folders.find(f => f.id === targetFolder)?.name ?? '—'}</div>
                    </div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'var(--qb-trust-senior-bg)', marginBottom: 14 }}>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--qb-trust-senior-color)', lineHeight: 1.8 }}>
                      <li>Status will change to &quot;Ready&quot; for review</li>
                      <li>Questions become visible to assigned faculty</li>
                      <li>Private tag will be removed</li>
                      <li>Admin will be notified of the promotion</li>
                    </ul>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Filter Questions</h3>
              {(['difficulty', 'type'] as const).map(cat => (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'capitalize' }}>
                    {cat}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(cat === 'difficulty' ? ['Easy', 'Medium', 'Hard'] : ['MCQ', 'Fill blank', 'Hotspot', 'Ordering', 'Matching']).map(v => chip(cat, v))}
                  </div>
                </div>
              ))}
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, marginTop: 4 }}>Target Folder</h3>
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', maxHeight: 200, overflowY: 'auto', padding: 8 }}>
                {rootFolders.map(f => (
                  <FolderPickerNode key={f.id} node={f} depth={0} folders={folders} selected={targetFolder} onSelect={setTargetFolder} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {!success ? (
            <>
              {mode === 'promote' && step > 1 ? (
                <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)}>
                  <i className="fa-regular fa-arrow-left" aria-hidden="true" />
                  Back
                </Button>
              ) : <span />}
              {mode === 'promote' ? (
                step < 3
                  ? <Button onClick={() => setStep(s => s + 1)} disabled={step === 1 && selectedQIds.size === 0}>
                      Continue →
                    </Button>
                  : <Button onClick={() => setSuccess(true)}>
                      Promote {selectedQIds.size} Questions
                    </Button>
              ) : (
                <Button onClick={() => setSuccess(true)} disabled={!targetFolder}>
                  Collect Questions
                </Button>
              )}
            </>
          ) : (
            <Button variant="outline" onClick={close}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Manage Collaborators Modal ────────────────────────────────────────────────
export function ManageCollaboratorsModal() {
  const { collaboratorsModalFolderId, setCollaboratorsModalFolderId, folders, personas } = useQB()

  const folder = folders.find(f => f.id === collaboratorsModalFolderId)
  const currentCollaborators = personas.filter(p => folder?.collaborators?.includes(p.id))
  const available = personas.filter(p => p.role === 'Faculty' && !folder?.collaborators?.includes(p.id))

  function close() { setCollaboratorsModalFolderId(null) }

  return (
    <Dialog open={!!collaboratorsModalFolderId} onOpenChange={(v) => { if (!v) close() }}>
      <DialogContent showCloseButton style={{ maxWidth: 420 }}>
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              backgroundColor: 'color-mix(in oklch, var(--qb-question-set) 15%, var(--background))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fa-regular fa-users" aria-hidden="true" style={{ color: 'var(--qb-question-set)', fontSize: 14 }} />
            </div>
            <div>
              <DialogTitle style={{ fontSize: 15 }}>Manage Collaborators</DialogTitle>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
                {folder?.name} · All assigned faculty have view access
              </p>
            </div>
          </div>
        </DialogHeader>

        <div style={{ padding: '4px 0' }}>
          {/* Current collaborators */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 8 }}>
              Current Collaborators
            </div>
            {currentCollaborators.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>No collaborators yet.</p>
            ) : currentCollaborators.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: p.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--primary-foreground)', flexShrink: 0 }}>
                  {p.initials}
                </span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{p.name}</span>
                <Button variant="ghost" size="sm" style={{ color: 'var(--destructive)' }}>Remove</Button>
              </div>
            ))}
          </div>

          {/* Grant access */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 8 }}>
              Grant Access
            </div>
            {available.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: p.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--primary-foreground)', flexShrink: 0 }}>
                  {p.initials}
                </span>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--foreground)' }}>{p.name}</span>
                <Button variant="outline" size="sm">+ Add</Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Request Edit Access Modal ─────────────────────────────────────────────────
export function RequestEditAccessModal() {
  const { requestEditAccessQuestionId, setRequestEditAccessQuestionId, questions } = useQB()
  const [reason, setReason] = useState('')
  const [sent, setSent] = useState(false)

  const question = questions.find(q => q.id === requestEditAccessQuestionId)

  function close() {
    setRequestEditAccessQuestionId(null)
    setReason('')
    setSent(false)
  }

  return (
    <Dialog open={!!requestEditAccessQuestionId} onOpenChange={(v) => { if (!v) close() }}>
      <DialogContent showCloseButton style={{ maxWidth: 440 }}>
        <DialogHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              backgroundColor: 'color-mix(in oklch, var(--brand-color) 12%, var(--background))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fa-regular fa-key" aria-hidden="true" style={{ color: 'var(--brand-color)', fontSize: 15 }} />
            </div>
            <div>
              <DialogTitle style={{ fontSize: 15 }}>Request Edit Access</DialogTitle>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
                The question owner will be notified.
              </p>
            </div>
          </div>
        </DialogHeader>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0 8px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', margin: '0 auto 12px',
              backgroundColor: 'color-mix(in oklch, var(--qb-trust-senior-color) 12%, var(--background))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="fa-solid fa-circle-check" aria-hidden="true"
                style={{ fontSize: 24, color: 'var(--qb-trust-senior-color)' }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', marginBottom: 6 }}>
              Request sent
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
              The question owner will review your request and grant access if approved.
            </p>
          </div>
        ) : (
          <div style={{ padding: '4px 0 8px' }}>
            {question && (
              <div style={{
                padding: '10px 12px', borderRadius: 8, marginBottom: 14,
                backgroundColor: 'var(--muted)', border: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Question
                </p>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', margin: 0 }}>
                  {question.title}
                </p>
              </div>
            )}
            <div>
              <label
                htmlFor="edit-access-reason"
                style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--foreground)', marginBottom: 6 }}
              >
                Reason <span style={{ color: 'var(--muted-foreground)', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                id="edit-access-reason"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Briefly explain why you need edit access…"
                rows={3}
                style={{
                  width: '100%', fontSize: 13, resize: 'vertical',
                  border: '1px solid var(--border-control-3)',
                  borderRadius: 8, padding: '8px 10px',
                  backgroundColor: 'var(--input-background)',
                  color: 'var(--foreground)',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {sent ? (
            <Button variant="outline" onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close}>Cancel</Button>
              <Button variant="default" onClick={() => setSent(true)}>Send Request</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Filter Sheet ──────────────────────────────────────────────────────────────
export function FilterSheet() {
  const { filterSheetOpen, setFilterSheetOpen } = useQB()
  const [filters, setFilters] = useState<Record<string, string[]>>({})

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
    ['Status',      ['Active', 'Ready', 'In Review', 'Draft', 'Flagged', 'Approved', 'Locked']],
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
          <Button variant="ghost" onClick={() => { setFilters({}); setFilterSheetOpen(false) }}>
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
