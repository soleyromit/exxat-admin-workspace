'use client'

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import type { FolderNode, Question, Persona, ColumnId, AccessRole } from '@/lib/qb-types'
import { MOCK_QB_FOLDERS, MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'
import { PERSONAS as GLOBAL_PERSONAS, type Persona as GlobalPersona } from '@/lib/personas'
import { useFacultySession } from '@/lib/faculty-session'
// MOCK_QB_FOLDERS used as reference for path computation in moveQuestionToFolder

/**
 * Adapter — global Persona → QB's Persona shape.
 * QB internals key off `id` and `role`; everything else (color, initials,
 * trustLevel) carries through directly from the global record.
 */
function toQBPersona(p: GlobalPersona): Persona {
  return {
    id:           p.id,
    name:         p.name,
    initials:     p.initials,
    role:         p.qbRole,
    color:        p.color,
    trustLevel:   p.trustLevel,
  }
}

const QB_PERSONAS: Persona[] = GLOBAL_PERSONAS.map(toQBPersona)

interface QBState {
  currentPersona: Persona
  setCurrentPersona: (p: Persona) => void
  personas: Persona[]

  navView: 'all' | 'my' | 'folder'
  setNavView: (v: 'all' | 'my' | 'folder') => void

  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void
  selectedFolderId: string | null
  setSelectedFolderId: (id: string | null) => void
  expandedFolderIds: Set<string>
  toggleFolder: (id: string) => void
  folders: FolderNode[]
  createFolder: (name: string, parentId: string | null) => string
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  restoreFolders: (nodes: FolderNode[]) => void
  moveFolder: (id: string, newParentId: string) => void
  setFolderIcon: (id: string, icon: string) => void
  setFolderPrivacy: (id: string, isPrivate: boolean) => void
  addShellCollaborator: (folderId: string, personaId: string, role: AccessRole) => void
  removeShellCollaborator: (folderId: string, personaId: string) => void
  updateShellCollaboratorRole: (folderId: string, personaId: string, role: AccessRole) => void

  sidebarSearch: string
  setSidebarSearch: (v: string) => void

  highlightedFolderId: string | null
  setHighlightedFolderId: (id: string | null) => void
  navigateToFolder: (id: string) => void

  myQuestionsOnly: boolean
  setMyQuestionsOnly: (v: boolean) => void
  favoritesFilter: boolean
  setFavoritesFilter: (v: boolean) => void
  favoritedIds: Set<string>
  toggleQuestionFavorited: (id: string) => void

  columnOrder: ColumnId[]
  setColumnOrder: (order: ColumnId[]) => void

  questions: Question[]
  updateQuestion: (id: string, updates: Partial<Question>) => void
  deleteQuestion: (id: string) => void
  duplicateQuestion: (id: string) => string
  restoreQuestion: (q: Question) => void
  restoreQuestions: (qs: Question[]) => void
  moveQuestionToFolder: (id: string, folderId: string) => void
  archiveQuestion: (id: string) => void
  removeQuestionFromFolder: (id: string, folderId: string) => void
  copyQuestionToFolder: (id: string, folderIds: string[]) => void
  anchorQuestionId: string | null
  setAnchorQuestionId: (id: string | null) => void
  pinnedFolderIds: Set<string>
  toggleFolderPin: (id: string) => void
  selectedQuestionIds: Set<string>
  toggleQuestionSelection: (id: string) => void
  selectAllQuestions: () => void
  clearSelection: () => void

  rowHoverId: string | null
  setRowHoverId: (id: string | null) => void

  draggedQuestionId: string | null
  setDraggedQuestionId: (id: string | null) => void
  draggedFolderId: string | null
  setDraggedFolderId: (id: string | null) => void
  dragOverFolderId: string | null
  setDragOverFolderId: (id: string | null) => void

  openMenuQuestionId: string | null
  setOpenMenuQuestionId: (id: string | null) => void

  dialogActive: boolean
  setDialogActive: (v: boolean) => void

  visibleQuestions: Question[]
  selectedFolder: FolderNode | null
  accessibleFolderIds: Set<string>

  closeAllOverlays: () => void
}

const QBContext = createContext<QBState | null>(null)

export function useQB(): QBState {
  const ctx = useContext(QBContext)
  if (!ctx) throw new Error('useQB must be used within QBProvider')
  return ctx
}

const DEFAULT_COLUMN_ORDER: ColumnId[] = [
  'type', 'difficulty', 'blooms', 'location', 'creator', 'lastEditedBy', 'usage', 'pbis', 'version'
]

function isInSubtree(folderId: string, rootId: string, folders: FolderNode[]): boolean {
  if (folderId === rootId) return true
  const node = folders.find(f => f.id === folderId)
  if (!node || !node.parentId) return false
  return isInSubtree(node.parentId, rootId, folders)
}

function getDescendantIds(id: string, folders: FolderNode[]): Set<string> {
  const result = new Set<string>([id])
  folders.filter(f => f.parentId === id).forEach(f => {
    getDescendantIds(f.id, folders).forEach(d => result.add(d))
  })
  return result
}

export function QBProvider({ children }: { children: ReactNode }) {
  // Global session is the source of truth — QB no longer holds its own persona state.
  const { currentPersona: globalPersona, setCurrentPersona: setGlobalPersona } = useFacultySession()
  const currentPersona = useMemo(() => toQBPersona(globalPersona), [globalPersona])
  const [navView, setNavViewState] = useState<'all' | 'my' | 'folder'>('my')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // WCAG 1.4.10 (Reflow): auto-collapse the QB folder tree at narrow
  // viewports. With both the main DS sidebar (256px) and the QB tree
  // (248px) open, ~720px effective viewport (200% zoom on a 1440 display)
  // leaves only ~216px for the table. Collapse below 1024px and let the
  // user re-open via the qb-header toggle if they need it.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 1280px)')
    const apply = () => { if (mq.matches) setSidebarOpen(false) }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  const [selectedFolderId, setSelectedFolderIdState] = useState<string | null>(null)
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(['phar101', 'biol201', 'skel101'])
  )
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [highlightedFolderId, setHighlightedFolderIdState] = useState<string | null>(null)
  const [myQuestionsOnly, setMyQuestionsOnly] = useState(false)
  const [favoritesFilter, setFavoritesFilter] = useState(false)
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(
    new Set(MOCK_QB_QUESTIONS.filter(q => q.favorited === true).map(q => q.id))
  )
  const [questionsState, setQuestionsState] = useState<Question[]>(MOCK_QB_QUESTIONS)
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>(DEFAULT_COLUMN_ORDER)
  const [anchorQuestionId, setAnchorQuestionId] = useState<string | null>(null)
  const [pinnedFolderIds, setPinnedFolderIds] = useState<Set<string>>(new Set())
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [rowHoverId, setRowHoverId] = useState<string | null>(null)
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null)
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [openMenuQuestionId, setOpenMenuQuestionId] = useState<string | null>(null)
  const [dialogActive, setDialogActive] = useState(false)
  const [folders, setFolders] = useState<FolderNode[]>(MOCK_QB_FOLDERS)

  const isExamAdmin = currentPersona.role === 'exam_admin'

  const accessibleFolderIds = useMemo<Set<string>>(() => {
    if (isExamAdmin) {
      // Exam admins have institution-wide access — all folders including private ones
      return new Set(folders.map(f => f.id))
    }
    const accessible = new Set<string>()
    // Non-admins: folders where they're a collaborator (private or public — being a collaborator grants access)
    folders
      .filter(f => (f.collaborators ?? []).includes(currentPersona.id))
      .forEach(folder => {
        getDescendantIds(folder.id, folders).forEach(id => accessible.add(id))
      })
    return accessible
  }, [isExamAdmin, currentPersona.id, folders])

  // Ref so the effect can read the current selectedFolderId without adding it as a dep
  const selectedFolderIdRef = useRef(selectedFolderId)
  selectedFolderIdRef.current = selectedFolderId

  // Auto-navigate instructors and course directors to their first accessible folder
  // (covers both persona switch and real-time access grants)
  useEffect(() => {
    if (isExamAdmin) return
    // If already on an accessible folder, leave navigation alone
    if (selectedFolderIdRef.current && accessibleFolderIds.has(selectedFolderIdRef.current)) return
    // Prefer a root-level course; fall back to any accessible folder
    const firstAccessible =
      folders.find(f => f.parentId === null && accessibleFolderIds.has(f.id)) ??
      folders.find(f => accessibleFolderIds.has(f.id)) ??
      null
    if (firstAccessible) {
      setSelectedFolderIdState(firstAccessible.id)
      setNavViewState('folder')
    } else {
      setSelectedFolderIdState(null)
      setNavViewState('my')
    }
  }, [isExamAdmin, accessibleFolderIds]) // eslint-disable-line react-hooks/exhaustive-deps

  function setCurrentPersona(p: Persona) {
    // Map back to the global persona, then push through global session.
    const next = GLOBAL_PERSONAS.find(g => g.id === p.id)
    if (next) setGlobalPersona(next)
    setSelectedFolderIdState(null)
    setNavViewState('my')
  }

  function setNavView(v: 'all' | 'my' | 'folder') {
    setNavViewState(v)
    if (v !== 'folder') setSelectedFolderIdState(null)
  }

  function setSelectedFolderId(id: string | null) {
    setSelectedFolderIdState(id)
    if (id !== null) setNavViewState('folder')
    else setNavViewState('my')
  }

  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setHighlightedFolderId = useCallback((id: string | null) => {
    setHighlightedFolderIdState(id)
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    if (id !== null) {
      highlightTimerRef.current = setTimeout(() => {
        setHighlightedFolderIdState(null)
        highlightTimerRef.current = null
      }, 1500)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current)
    }
  }, [])

  function navigateToFolder(id: string) {
    setSelectedFolderId(id)
    setExpandedFolderIds(prev => {
      const next = new Set(prev)
      let node = folders.find(f => f.id === id)
      while (node?.parentId) {
        next.add(node.parentId)
        node = folders.find(f => f.id === node!.parentId)
      }
      return next
    })
    setHighlightedFolderId(id)
  }

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolderIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const createFolder = useCallback((name: string, parentId: string | null): string => {
    const newId = `folder-${Date.now()}`
    const isCourse = parentId === null
    setFolders(prev => [...prev, { id: newId, name, parentId, count: 0, isCourse }])
    if (parentId) setExpandedFolderIds(prev => new Set([...prev, parentId]))
    setTimeout(() => setSelectedFolderIdState(newId), 50)
    return newId
  }, [])

  const renameFolder = useCallback((id: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  }, [])

  const deleteFolder = useCallback((id: string) => {
    setFolders(prev => {
      const toRemove = new Set<string>()
      const queue = [id]
      while (queue.length) {
        const cur = queue.shift()!
        toRemove.add(cur)
        prev.filter(f => f.parentId === cur).forEach(f => queue.push(f.id))
      }
      return prev.filter(f => !toRemove.has(f.id))
    })
    setSelectedFolderIdState(null)
    setNavViewState('my')
  }, [])

  const moveFolder = useCallback((id: string, newParentId: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, parentId: newParentId } : f))
  }, [])

  const setFolderIcon = useCallback((id: string, icon: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, icon } : f))
  }, [])

  const addShellCollaborator = useCallback((folderId: string, personaId: string, role: AccessRole) => {
    setFolders(prev => prev.map(f => {
      if (f.id !== folderId) return f
      const collaborators = [...new Set([...(f.collaborators ?? []), personaId])]
      const collaboratorRoles = { ...(f.collaboratorRoles ?? {}), [personaId]: role }
      return { ...f, collaborators, collaboratorRoles }
    }))
  }, [])

  const removeShellCollaborator = useCallback((folderId: string, personaId: string) => {
    setFolders(prev => prev.map(f => {
      if (f.id !== folderId) return f
      const collaborators = (f.collaborators ?? []).filter(id => id !== personaId)
      const collaboratorRoles = { ...(f.collaboratorRoles ?? {}) }
      delete collaboratorRoles[personaId]
      return { ...f, collaborators, collaboratorRoles }
    }))
  }, [])

  const updateShellCollaboratorRole = useCallback((folderId: string, personaId: string, role: AccessRole) => {
    setFolders(prev => prev.map(f => {
      if (f.id !== folderId) return f
      return { ...f, collaboratorRoles: { ...(f.collaboratorRoles ?? {}), [personaId]: role } }
    }))
  }, [])

  const setFolderPrivacy = useCallback((id: string, isPrivate: boolean) => {
    setFolders(prev => prev.map(f => {
      if (f.id !== id) return f
      // Auto-add the persona making it private so they don't lock themselves out
      const collaborators = isPrivate
        ? [...new Set([...(f.collaborators ?? []), currentPersona.id])]
        : f.collaborators
      return { ...f, isPrivateSpace: isPrivate, collaborators }
    }))
  }, [currentPersona.id])

  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    setQuestionsState(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))
  }, [])

  const deleteQuestion = useCallback((id: string) => {
    setQuestionsState(prev => prev.filter(q => q.id !== id))
    setSelectedQuestionIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }, [])

  const duplicateQuestion = useCallback((id: string): string => {
    const copyId = `q-${Date.now()}`
    setQuestionsState(prev => {
      const original = prev.find(q => q.id === id)
      if (!original) return prev
      const copy: Question = {
        ...original,
        id: copyId,
        title: `Copy of ${original.title}`,
        status: 'Draft',
        version: 1,
        usage: 0,
        pbis: null,
        pbisDir: null,
        age: 'just now',
        lastEditedBy: undefined,
      }
      const idx = prev.findIndex(q => q.id === id)
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
    return copyId
  }, [])

  const moveQuestionToFolder = useCallback((id: string, folderId: string) => {
    setQuestionsState(prev => prev.map(q => {
      if (q.id !== id) return q
      const folder = MOCK_QB_FOLDERS.find(f => f.id === folderId)
      const parts: string[] = []
      let node = folder
      while (node) {
        parts.unshift(node.name)
        node = node.parentId ? MOCK_QB_FOLDERS.find(f => f.id === node!.parentId) : undefined
      }
      return { ...q, folder: folderId, folderPath: parts.join(' / ') }
    }))
  }, [])

  const archiveQuestion = useCallback((id: string) => {
    setQuestionsState(prev => prev.map(q => q.id === id ? { ...q, status: 'Archived' as const } : q))
  }, [])

  const removeQuestionFromFolder = useCallback((id: string, folderId: string) => {
    setQuestionsState(prev => prev.map(q => {
      if (q.id !== id) return q
      if (q.folder === folderId) {
        const [first, ...rest] = q.extraFolders ?? []
        if (first) return { ...q, folder: first.folder, folderPath: first.folderPath, extraFolders: rest.length ? rest : undefined }
        return { ...q, folder: '', folderPath: '' }
      }
      const extra = (q.extraFolders ?? []).filter(e => e.folder !== folderId)
      return { ...q, extraFolders: extra.length ? extra : undefined }
    }))
  }, [])

  const copyQuestionToFolder = useCallback((id: string, folderIds: string[]) => {
    setQuestionsState(prev => prev.map(q => {
      if (q.id !== id) return q
      const newExtras = folderIds
        .filter(fid => fid !== q.folder && !(q.extraFolders ?? []).some(e => e.folder === fid))
        .map(fid => {
          const folder = MOCK_QB_FOLDERS.find(f => f.id === fid)
          const parts: string[] = []
          let node = folder
          while (node) {
            parts.unshift(node.name)
            node = node.parentId ? MOCK_QB_FOLDERS.find(f => f.id === node!.parentId) : undefined
          }
          return { folder: fid, folderPath: parts.join(' / ') }
        })
      const combined = [...(q.extraFolders ?? []), ...newExtras]
      return { ...q, extraFolders: combined.length ? combined : undefined }
    }))
  }, [])

  const restoreFolders = useCallback((nodes: FolderNode[]) => {
    setFolders(prev => [...prev, ...nodes])
  }, [])

  const restoreQuestion = useCallback((q: Question) => {
    setQuestionsState(prev => [...prev, q])
  }, [])

  const restoreQuestions = useCallback((qs: Question[]) => {
    setQuestionsState(prev => [...prev, ...qs])
  }, [])

  const toggleFolderPin = useCallback((id: string) => {
    setPinnedFolderIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleQuestionFavorited = useCallback((id: string) => {
    setFavoritedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const visibleQuestions = useMemo(() => questionsState.filter(q => {
    // Non-admin: folder must be accessible
    if (!isExamAdmin && !accessibleFolderIds.has(q.folder)) return false

    // Visibility by status: Saved = anyone; Draft = creator only; Archived = exam admin or creator
    const roleVisible =
      q.status === 'Saved' ||
      (q.status === 'Draft' && q.creator === currentPersona.id) ||
      (q.status === 'Archived' && (isExamAdmin || q.creator === currentPersona.id))

    const navVisible = navView === 'all'
      ? true
      : navView === 'my'
      ? q.creator === currentPersona.id
      : selectedFolderId
        ? isInSubtree(q.folder, selectedFolderId, folders) ||
          (q.extraFolders ?? []).some(e => isInSubtree(e.folder, selectedFolderId, folders))
        : true

    const myFilter = myQuestionsOnly ? q.creator === currentPersona.id : true
    const favFilter = favoritesFilter ? favoritedIds.has(q.id) : true

    return roleVisible && navVisible && myFilter && favFilter
  }), [isExamAdmin, currentPersona.id, navView, selectedFolderId, myQuestionsOnly, favoritesFilter, favoritedIds, folders, accessibleFolderIds, questionsState])

  const toggleQuestionSelection = useCallback((id: string) => {
    setSelectedQuestionIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAllQuestions = useCallback(() => {
    setSelectedQuestionIds(new Set(visibleQuestions.map(q => q.id)))
  }, [visibleQuestions])

  const clearSelection = useCallback(() => setSelectedQuestionIds(new Set()), [])

  const closeAllOverlays = useCallback(() => {
    setOpenMenuQuestionId(null)
  }, [])

  const selectedFolder = selectedFolderId
    ? folders.find(f => f.id === selectedFolderId) ?? null
    : null

  const value: QBState = {
    currentPersona, setCurrentPersona, personas: QB_PERSONAS,
    navView, setNavView,
    sidebarOpen, setSidebarOpen,
    selectedFolderId, setSelectedFolderId,
    expandedFolderIds, toggleFolder,
    folders, createFolder, renameFolder, deleteFolder, restoreFolders, moveFolder, setFolderIcon, setFolderPrivacy,
    addShellCollaborator, removeShellCollaborator, updateShellCollaboratorRole,
    sidebarSearch, setSidebarSearch,
    highlightedFolderId, setHighlightedFolderId, navigateToFolder,
    myQuestionsOnly, setMyQuestionsOnly,
    favoritesFilter, setFavoritesFilter,
    favoritedIds, toggleQuestionFavorited,
    columnOrder, setColumnOrder,
    questions: questionsState,
    updateQuestion, deleteQuestion, duplicateQuestion, restoreQuestion, restoreQuestions,
    moveQuestionToFolder, archiveQuestion, removeQuestionFromFolder, copyQuestionToFolder,
    anchorQuestionId, setAnchorQuestionId,
    pinnedFolderIds, toggleFolderPin,
    selectedQuestionIds, toggleQuestionSelection, selectAllQuestions, clearSelection,
    rowHoverId, setRowHoverId,
    draggedQuestionId, setDraggedQuestionId,
    draggedFolderId, setDraggedFolderId,
    dragOverFolderId, setDragOverFolderId,
    openMenuQuestionId, setOpenMenuQuestionId,
    dialogActive, setDialogActive,
    visibleQuestions, selectedFolder, accessibleFolderIds,
    closeAllOverlays,
  }

  return <QBContext.Provider value={value}>{children}</QBContext.Provider>
}
