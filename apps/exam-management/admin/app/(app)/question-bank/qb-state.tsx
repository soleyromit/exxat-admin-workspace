'use client'

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import type { FolderNode, Question, Persona, ColumnId } from '@/lib/qb-types'
import { MOCK_QB_FOLDERS, MOCK_QB_QUESTIONS, MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'

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
  createFolder: (name: string, parentId: string) => void
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
  moveFolder: (id: string, newParentId: string) => void
  setFolderIcon: (id: string, icon: string) => void

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
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>(DEFAULT_COLUMN_ORDER)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [rowHoverId, setRowHoverId] = useState<string | null>(null)
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null)
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [openMenuQuestionId, setOpenMenuQuestionId] = useState<string | null>(null)
  const [collaboratorsModalFolderId, setCollaboratorsModalFolderId] = useState<string | null>(null)
  const [folders, setFolders] = useState<FolderNode[]>(MOCK_QB_FOLDERS)

  const isAdmin = currentPersona.role === 'Admin'

  const accessibleFolderIds = useMemo<Set<string>>(() => {
    if (isAdmin) return new Set(folders.map(f => f.id))
    const accessible = new Set<string>()
    folders
      .filter(f => f.parentId === null && (f.collaborators ?? []).includes(currentPersona.id))
      .forEach(course => {
        getDescendantIds(course.id, folders).forEach(id => accessible.add(id))
      })
    return accessible
  }, [isAdmin, currentPersona.id, folders])

  // Auto-select first accessible course folder for Faculty on persona change
  useEffect(() => {
    if (isAdmin) return
    const firstAccessibleCourse = folders.find(
      f => f.parentId === null && accessibleFolderIds.has(f.id)
    )
    if (firstAccessibleCourse) {
      setSelectedFolderIdState(firstAccessibleCourse.id)
      setNavViewState('folder')
    } else {
      // No access to any folder — show empty state
      setSelectedFolderIdState(null)
      setNavViewState('my')
    }
  }, [currentPersona]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const createFolder = useCallback((name: string, parentId: string) => {
    const newId = `folder-${Date.now()}`
    setFolders(prev => [...prev, { id: newId, name, parentId, count: 0 }])
    setExpandedFolderIds(prev => new Set([...prev, parentId]))
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

  const toggleQuestionFavorited = useCallback((id: string) => {
    setFavoritedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const visibleQuestions = useMemo(() => MOCK_QB_QUESTIONS.filter(q => {
    // Faculty: folder must be accessible
    if (!isAdmin && !accessibleFolderIds.has(q.folder)) return false

    const roleVisible = isAdmin
      ? true
      : q.status === 'Saved' || (q.status === 'Draft' && q.creator === currentPersona.id)

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
  }), [isAdmin, currentPersona.id, navView, selectedFolderId, myQuestionsOnly, favoritesFilter, favoritedIds, folders, accessibleFolderIds])

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
    folders, createFolder, renameFolder, deleteFolder, moveFolder, setFolderIcon,
    sidebarSearch, setSidebarSearch,
    highlightedFolderId, setHighlightedFolderId, navigateToFolder,
    myQuestionsOnly, setMyQuestionsOnly,
    favoritesFilter, setFavoritesFilter,
    favoritedIds, toggleQuestionFavorited,
    columnOrder, setColumnOrder,
    questions: MOCK_QB_QUESTIONS,
    selectedQuestionIds, toggleQuestionSelection, selectAllQuestions, clearSelection,
    rowHoverId, setRowHoverId,
    draggedQuestionId, setDraggedQuestionId,
    draggedFolderId, setDraggedFolderId,
    dragOverFolderId, setDragOverFolderId,
    openMenuQuestionId, setOpenMenuQuestionId,
    collaboratorsModalFolderId, setCollaboratorsModalFolderId,
    visibleQuestions, selectedFolder, accessibleFolderIds,
    closeAllOverlays,
  }

  return <QBContext.Provider value={value}>{children}</QBContext.Provider>
}
