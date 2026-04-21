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

  // Auto-select first assigned folder for Faculty on mount
  useEffect(() => {
    if (currentPersona.role === 'Faculty' && (currentPersona.assignedFolders?.length ?? 0) > 0) {
      const firstFolder = currentPersona.assignedFolders![0]
      setSelectedFolderIdState(firstFolder)
      setNavViewState('folder')
    }
  }, [currentPersona])

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
    // Expand ancestors
    setExpandedFolderIds(prev => {
      const next = new Set(prev)
      let node = MOCK_QB_FOLDERS.find(f => f.id === id)
      while (node?.parentId) {
        next.add(node.parentId)
        node = MOCK_QB_FOLDERS.find(f => f.id === node!.parentId)
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

  const toggleQuestionFavorited = useCallback((id: string) => {
    setFavoritedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isAdmin = currentPersona.role === 'Admin'

  const visibleQuestions = useMemo(() => MOCK_QB_QUESTIONS.filter(q => {
    const roleVisible = isAdmin
      ? true
      : q.status === 'Saved' || (q.status === 'Draft' && q.creator === currentPersona.id)

    const navVisible = navView === 'all'
      ? true
      : navView === 'my'
      ? q.creator === currentPersona.id
      : selectedFolderId
        ? isInSubtree(q.folder, selectedFolderId, MOCK_QB_FOLDERS)
        : true

    const myFilter = myQuestionsOnly ? q.creator === currentPersona.id : true
    const favFilter = favoritesFilter ? favoritedIds.has(q.id) : true

    return roleVisible && navVisible && myFilter && favFilter
  }), [isAdmin, currentPersona.id, navView, selectedFolderId, myQuestionsOnly, favoritesFilter, favoritedIds])

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
    ? MOCK_QB_FOLDERS.find(f => f.id === selectedFolderId) ?? null
    : null

  const value: QBState = {
    currentPersona, setCurrentPersona, personas: MOCK_QB_PERSONAS,
    navView, setNavView,
    sidebarOpen, setSidebarOpen,
    selectedFolderId, setSelectedFolderId,
    expandedFolderIds, toggleFolder,
    folders: MOCK_QB_FOLDERS,
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
    visibleQuestions, selectedFolder,
    closeAllOverlays,
  }

  return <QBContext.Provider value={value}>{children}</QBContext.Provider>
}
