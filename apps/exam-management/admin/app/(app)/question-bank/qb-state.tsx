'use client'

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import type { FolderNode, Question, Persona, ColumnId } from '@/lib/qb-types'
import { MOCK_QB_FOLDERS, MOCK_QB_QUESTIONS, MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'
// MOCK_QB_FOLDERS used as reference for path computation in moveQuestionToFolder

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
  createFolder: (name: string, parentId: string | null) => void
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  moveFolder: (id: string, newParentId: string) => void
  setFolderIcon: (id: string, icon: string) => void
  addFolderCollaborator: (folderId: string, personaId: string) => void
  removeFolderCollaborator: (folderId: string, personaId: string) => void

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
  duplicateQuestion: (id: string) => void
  moveQuestionToFolder: (id: string, folderId: string) => void
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

  collaboratorsModalFolderId: string | null
  setCollaboratorsModalFolderId: (id: string | null) => void

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
  const [currentPersona, setCurrentPersonaState] = useState<Persona>(MOCK_QB_PERSONAS[0])
  const [navView, setNavViewState] = useState<'all' | 'my' | 'folder'>('my')
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [rowHoverId, setRowHoverId] = useState<string | null>(null)
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null)
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [openMenuQuestionId, setOpenMenuQuestionId] = useState<string | null>(null)
  const [collaboratorsModalFolderId, setCollaboratorsModalFolderId] = useState<string | null>(null)
  const [dialogActive, setDialogActive] = useState(false)
  const [folders, setFolders] = useState<FolderNode[]>(MOCK_QB_FOLDERS)

  const isAdmin = currentPersona.role === 'Admin'

  const accessibleFolderIds = useMemo<Set<string>>(() => {
    if (isAdmin) return new Set(folders.map(f => f.id))
    const accessible = new Set<string>()
    // Any folder where this persona is a direct collaborator grants access to that folder + all descendants
    folders
      .filter(f => (f.collaborators ?? []).includes(currentPersona.id))
      .forEach(folder => {
        getDescendantIds(folder.id, folders).forEach(id => accessible.add(id))
      })
    return accessible
  }, [isAdmin, currentPersona.id, folders])

  // Ref so the effect can read the current selectedFolderId without adding it as a dep
  const selectedFolderIdRef = useRef(selectedFolderId)
  selectedFolderIdRef.current = selectedFolderId

  // Auto-navigate Faculty to first accessible folder whenever their access set changes
  // (covers both persona switch and real-time access grants by Admin)
  useEffect(() => {
    if (isAdmin) return
    // If Faculty already has an accessible folder selected, leave navigation alone
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
  }, [isAdmin, accessibleFolderIds]) // eslint-disable-line react-hooks/exhaustive-deps

  function setCurrentPersona(p: Persona) {
    setCurrentPersonaState(p)
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

  const createFolder = useCallback((name: string, parentId: string | null) => {
    const newId = `folder-${Date.now()}`
    const isCourse = parentId === null
    setFolders(prev => [...prev, { id: newId, name, parentId, count: 0, isCourse }])
    if (parentId) setExpandedFolderIds(prev => new Set([...prev, parentId]))
    setTimeout(() => setSelectedFolderIdState(newId), 50)
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

  const addFolderCollaborator = useCallback((folderId: string, personaId: string) => {
    setFolders(prev => prev.map(f => {
      if (f.id !== folderId) return f
      const existing = f.collaborators ?? []
      if (existing.includes(personaId)) return f
      return { ...f, collaborators: [...existing, personaId] }
    }))
  }, [])

  const removeFolderCollaborator = useCallback((folderId: string, personaId: string) => {
    setFolders(prev => prev.map(f => {
      if (f.id !== folderId) return f
      return { ...f, collaborators: (f.collaborators ?? []).filter(id => id !== personaId) }
    }))
  }, [])

  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    setQuestionsState(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q))
  }, [])

  const deleteQuestion = useCallback((id: string) => {
    setQuestionsState(prev => prev.filter(q => q.id !== id))
    setSelectedQuestionIds(prev => { const next = new Set(prev); next.delete(id); return next })
  }, [])

  const duplicateQuestion = useCallback((id: string) => {
    setQuestionsState(prev => {
      const original = prev.find(q => q.id === id)
      if (!original) return prev
      const copy: Question = {
        ...original,
        id: `q-${Date.now()}`,
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
    if (!isAdmin && !accessibleFolderIds.has(q.folder)) return false

    // Draft questions are only visible to their creator, regardless of role
    const roleVisible = q.status === 'Saved' || (q.status === 'Draft' && q.creator === currentPersona.id)

    const navVisible = navView === 'all'
      ? true
      : navView === 'my'
      ? q.creator === currentPersona.id
      : selectedFolderId
        ? isInSubtree(q.folder, selectedFolderId, folders)
        : true

    const myFilter = myQuestionsOnly ? q.creator === currentPersona.id : true
    const favFilter = favoritesFilter ? favoritedIds.has(q.id) : true

    return roleVisible && navVisible && myFilter && favFilter
  }), [isAdmin, currentPersona.id, navView, selectedFolderId, myQuestionsOnly, favoritesFilter, favoritedIds, folders, accessibleFolderIds, questionsState])

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
    currentPersona, setCurrentPersona, personas: MOCK_QB_PERSONAS,
    navView, setNavView,
    sidebarOpen, setSidebarOpen,
    selectedFolderId, setSelectedFolderId,
    expandedFolderIds, toggleFolder,
    folders, createFolder, renameFolder, deleteFolder, moveFolder, setFolderIcon, addFolderCollaborator, removeFolderCollaborator,
    sidebarSearch, setSidebarSearch,
    highlightedFolderId, setHighlightedFolderId, navigateToFolder,
    myQuestionsOnly, setMyQuestionsOnly,
    favoritesFilter, setFavoritesFilter,
    favoritedIds, toggleQuestionFavorited,
    columnOrder, setColumnOrder,
    questions: questionsState,
    updateQuestion, deleteQuestion, duplicateQuestion, moveQuestionToFolder,
    selectedQuestionIds, toggleQuestionSelection, selectAllQuestions, clearSelection,
    rowHoverId, setRowHoverId,
    draggedQuestionId, setDraggedQuestionId,
    draggedFolderId, setDraggedFolderId,
    dragOverFolderId, setDragOverFolderId,
    openMenuQuestionId, setOpenMenuQuestionId,
    collaboratorsModalFolderId, setCollaboratorsModalFolderId,
    dialogActive, setDialogActive,
    visibleQuestions, selectedFolder, accessibleFolderIds,
    closeAllOverlays,
  }

  return <QBContext.Provider value={value}>{children}</QBContext.Provider>
}
