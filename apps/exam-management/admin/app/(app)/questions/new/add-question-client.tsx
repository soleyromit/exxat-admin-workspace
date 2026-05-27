'use client'

/**
 * /questions/new — full-page question authoring.
 *
 * Hosts the unified `QuestionEditor`. Pre-selects the folder when the user
 * arrives from a QB folder (`?folder=…`) and pre-selects the course objective
 * when arriving from the curricular-loop "untested" strip (`?objective=…`).
 *
 * Save destinations:
 *   - draft    → stays in the editor, stamps state='draft'
 *   - bank     → projects the draft to a `Question` row and routes back to QB
 *   - review   → not used here; lives on the assessment review screen
 */

import { Suspense, useMemo, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MOCK_QB_FOLDERS } from '@/lib/qb-mock-data'
import { courseObjectives } from '@/lib/faculty-mock-data'
import { useFacultySession } from '@/lib/faculty-session'
import { createDraft, type QuestionDraft, type SaveDestination } from '@/lib/question-editor-types'
import { QuestionEditor, type SaveDestination as _SD } from '@/components/question-editor/question-editor'
import {
  Badge,
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@exxatdesignux/ui'

// ─── LocationsSelector ────────────────────────────────────────────────────────

/** Flat list of non-course folders, each annotated with their course name. */
const FLAT_FOLDERS = (() => {
  const courseMap = new Map<string, string>()
  for (const f of MOCK_QB_FOLDERS) {
    if (f.isCourse) courseMap.set(f.id, f.name)
  }

  // Walk up the parentId chain until we reach a course node.
  function getCourseId(folder: (typeof MOCK_QB_FOLDERS)[number]): string | null {
    let current: (typeof MOCK_QB_FOLDERS)[number] | undefined = folder
    while (current) {
      if (current.isCourse) return current.id
      if (!current.parentId) return null
      current = MOCK_QB_FOLDERS.find(f => f.id === current!.parentId)
    }
    return null
  }

  return MOCK_QB_FOLDERS
    .filter(f => !f.isCourse)
    .map(f => ({
      id: f.id,
      name: f.name,
      courseId: getCourseId(f) ?? '',
      courseName: courseMap.get(getCourseId(f) ?? '') ?? '',
    }))
})()

interface LocationsSelectorProps {
  folderIds: string[]
  onChange: (ids: string[]) => void
}

function LocationsSelector({ folderIds, onChange }: LocationsSelectorProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedNames = folderIds.map(id => {
    const match = FLAT_FOLDERS.find(f => f.id === id)
    return match ? match.name : id
  })

  const filtered = query.trim()
    ? FLAT_FOLDERS.filter(f =>
        f.name.toLowerCase().includes(query.toLowerCase()) ||
        f.courseName.toLowerCase().includes(query.toLowerCase())
      )
    : FLAT_FOLDERS

  // Group filtered results by courseId.
  const grouped = filtered.reduce<Record<string, { courseName: string; folders: typeof FLAT_FOLDERS }>>((acc, f) => {
    if (!acc[f.courseId]) acc[f.courseId] = { courseName: f.courseName, folders: [] }
    acc[f.courseId].folders.push(f)
    return acc
  }, {})

  function toggle(id: string) {
    if (folderIds.includes(id)) {
      onChange(folderIds.filter(fid => fid !== id))
    } else {
      onChange([...folderIds, id])
    }
  }

  function remove(id: string) {
    onChange(folderIds.filter(fid => fid !== id))
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        flexWrap: 'wrap',
        padding: '12px 24px 0',
        borderBottom: '1px solid var(--border)',
        paddingBottom: 12,
      }}
    >
      {/* Label */}
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--muted-foreground)',
          lineHeight: '24px',
          whiteSpace: 'nowrap',
          marginRight: 4,
        }}
      >
        Locations
      </span>

      {/* Selected folder chips */}
      {folderIds.map((id, idx) => (
        <Badge
          key={id}
          variant="secondary"
          className="rounded"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, paddingRight: 4 }}
        >
          <span style={{ fontSize: 12 }}>{selectedNames[idx]}</span>
          <button
            type="button"
            onClick={() => remove(id)}
            aria-label={`Remove location ${selectedNames[idx]}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 14,
              height: 14,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: 'var(--muted-foreground)',
              borderRadius: 2,
            }}
          >
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 10 }} />
          </button>
        </Badge>
      ))}

      {/* + Add location popover */}
      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) { setTimeout(() => searchRef.current?.focus(), 0) } }}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="xs" className="gap-1 h-6" style={{ fontSize: 12 }}>
            <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 11 }} />
            Add location
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          style={{ width: 280, padding: 0 }}
        >
          {/* Search */}
          <div style={{ padding: '8px 8px 4px' }}>
            <Input
              ref={searchRef}
              placeholder="Search folders…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ height: 32, fontSize: 13 }}
            />
          </div>

          {/* Folder list */}
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {Object.values(grouped).length === 0 && (
              <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--muted-foreground)' }}>
                No folders found
              </div>
            )}
            {Object.values(grouped).map(group => (
              <div key={group.courseName}>
                {/* Course label — non-selectable */}
                <div
                  style={{
                    padding: '6px 12px 2px',
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {group.courseName}
                </div>

                {/* Folder rows */}
                {group.folders.map(f => {
                  const selected = folderIds.includes(f.id)
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggle(f.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '6px 12px',
                        fontSize: 13,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--foreground)',
                        gap: 8,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--muted)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
                      aria-pressed={selected}
                    >
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name}
                      </span>
                      {selected && (
                        <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 11, color: 'var(--brand-color)', flexShrink: 0 }} />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ─── AddQuestionForm ──────────────────────────────────────────────────────────

function AddQuestionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentPersona } = useFacultySession()

  const folderId = searchParams.get('folder')
  const objectiveId = searchParams.get('objective')

  // Multi-location state — initialised from the ?folder= param if present.
  const [folderIds, setFolderIds] = useState<string[]>(() =>
    folderId ? [folderId] : []
  )

  const objectives = useMemo(() => {
    // Scope to objectives in the persona's editor courses; admins see all.
    if (currentPersona.role === 'admin') return courseObjectives
    const editorIds = currentPersona.courses.filter(c => c.level === 'editor').map(c => c.courseId)
    return courseObjectives.filter(o => editorIds.includes(o.courseId))
  }, [currentPersona])

  const [draft, setDraft] = useState<QuestionDraft>(() =>
    createDraft({
      authorPersonaId: currentPersona.id,
      folderId,
      objectiveId,
    })
  )

  function handleSave(d: QuestionDraft, dest: SaveDestination) {
    // Project to a saved state; in a real backend we'd POST to /api/questions.
    // For the demo, we just route back with a confirmation toast — state lives
    // in the user's session via the assessment review store / QB mock data.
    setDraft({ ...d, state: dest === 'draft' ? 'draft' : 'saved' })
    if (dest === 'draft') return
    const primaryFolder = folderIds[0] ?? folderId
    const dest_url = primaryFolder ? `/question-bank?folder=${primaryFolder}` : '/question-bank'
    router.push(dest_url)
  }

  function handleCancel() {
    const primaryFolder = folderIds[0] ?? folderId
    router.push(primaryFolder ? `/question-bank?folder=${primaryFolder}` : '/question-bank')
  }

  return (
    <>
      <LocationsSelector folderIds={folderIds} onChange={setFolderIds} />
      <QuestionEditor
        draft={draft}
        onChange={setDraft}
        objectives={objectives}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </>
  )
}

export function AddQuestionClient() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading editor…</div>}>
      <AddQuestionForm />
    </Suspense>
  )
}

// Re-export the type so the page route doesn't need to know about question-editor-types.
export type { _SD as SaveDestination }
