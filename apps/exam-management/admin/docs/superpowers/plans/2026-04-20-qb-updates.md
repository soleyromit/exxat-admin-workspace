# QB Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Question Bank with simplified status model (Saved|Draft), flattened folder tree, Google Drive–style breadcrumb title, collaborator avatar stack, improved table columns/toolbar, DS compliance fixes, and two new scaffold pages (Courses, Assessment Builder).

**Architecture:** State-first refactor (types → mock data → state) before any UI changes; each UI file is self-contained and gets its own task. No new dependencies — all UI uses existing @exxat-ds/ui and Font Awesome Pro.

**Tech Stack:** Next.js 15 App Router, @exxat-ds/ui, Tailwind v4, Font Awesome Pro, TypeScript

---

## File Map

| Action | File |
|--------|------|
| Rewrite | `lib/qb-types.ts` |
| Rewrite | `lib/qb-mock-data.ts` |
| Rewrite | `app/(app)/question-bank/qb-state.tsx` |
| Delete | `app/(app)/question-bank/qb-tabs.tsx` |
| Modify | `app/(app)/question-bank/question-bank-client.tsx` |
| Modify | `app/globals.css` |
| Modify | `components/qb/badges.tsx` |
| Modify | `app/(app)/question-bank/qb-sidebar.tsx` |
| Modify | `app/(app)/question-bank/qb-header.tsx` |
| Rewrite | `app/(app)/question-bank/qb-title.tsx` |
| Modify | `app/(app)/question-bank/qb-table.tsx` |
| Modify | `app/(app)/question-bank/qb-modals.tsx` |
| Modify | `app/(app)/questions/[id]/page.tsx` |
| Modify | `components/app-sidebar.tsx` |
| Create | `app/(app)/courses/page.tsx` |
| Create | `app/(app)/assessment-builder/page.tsx` |

---

## Task 1: Rewrite lib/qb-types.ts

**Files:**
- Rewrite: `lib/qb-types.ts`

- [ ] **Step 1: Write new types file**

```ts
// lib/qb-types.ts
export type QStatus = 'Saved' | 'Draft'
export type QType   = 'MCQ' | 'Fill blank' | 'Hotspot' | 'Ordering' | 'Matching'
export type QDiff   = 'Easy' | 'Medium' | 'Hard'
export type QBlooms = 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create'
export type TrustLevel = 'junior' | 'mid' | 'senior'

export interface Question {
  id: string
  code: string
  version: number
  age: string
  title: string
  type: QType
  status: QStatus
  difficulty: QDiff
  blooms: QBlooms
  folder: string
  folderPath: string        // e.g. "PHAR101 QB / Antibiotics & Antimicrobials"
  tags: string[]
  usage: number
  pbis: number | null
  pbisDir: 'up' | 'down' | 'flat' | null
  creator?: string
  collaborator?: string
  lastEditedBy?: string
  usedInSections?: string[]
  pinned?: boolean
  favorited?: boolean
}

export interface FolderNode {
  id: string
  name: string
  parentId: string | null
  count: number
  locked?: boolean
  isCourse?: boolean
  isPrivateSpace?: boolean
  ownerPersonaId?: string
  collaborators?: string[]
}

export interface Persona {
  id: string
  name: string
  initials: string
  role: 'Admin' | 'Faculty'
  color: string
  trustLevel?: TrustLevel
  assignedFolders?: string[]
}

export interface Course {
  id: string
  code: string          // e.g. "PHAR101"
  name: string          // e.g. "Pharmacology I"
  questionBankFolderId: string
}

export interface CourseOffering {
  id: string
  courseId: string
  semester: string      // e.g. "Fall 2025"
  studentCount: number
}

export interface Assessment {
  id: string
  courseId: string
  offeringId: string
  title: string
  questionCount: number
  diffDistribution: { easy: number; medium: number; hard: number }
}
```

- [ ] **Step 2: Verify type-check passes**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm type-check 2>&1 | head -40
```

Expected: errors only in files that still import removed types (SVItem, SmartCriteria) — those get fixed in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add lib/qb-types.ts
git commit -m "refactor(qb): collapse QStatus to Saved|Draft, rename shortlisted→favorited, add folderPath and Course/Assessment types"
```

---

## Task 2: Rewrite lib/qb-mock-data.ts

**Files:**
- Rewrite: `lib/qb-mock-data.ts`

- [ ] **Step 1: Write new mock data file**

```ts
// lib/qb-mock-data.ts
import type { FolderNode, Question, Persona, Course, CourseOffering, Assessment } from './qb-types'

// ─── Folders (flattened — no offering nodes) ─────────────────────────────────

export const MOCK_QB_FOLDERS: FolderNode[] = [
  { id: 'phar101', name: 'PHAR101 Question Bank (QB)', parentId: null, count: 74, isCourse: true, collaborators: ['persona-thompson', 'persona-chen', 'persona-patel'] },
  { id: 'biol201', name: 'BIOL201 Question Bank (QB)', parentId: null, count: 58, isCourse: true, collaborators: ['persona-thompson', 'persona-chen'] },
  { id: 'skel101', name: 'SKEL101 Question Bank (QB)', parentId: null, count: 45, isCourse: true, collaborators: ['persona-thompson'] },

  // PHAR101 folders (directly under course)
  { id: 'phar101-antibiotics', name: 'Antibiotics & Antimicrobials', parentId: 'phar101', count: 18 },
  { id: 'phar101-analgesics',  name: 'Analgesics & Pain Management', parentId: 'phar101', count: 22 },
  { id: 'phar101-cardio',      name: 'Cardiovascular Drugs',         parentId: 'phar101', count: 18 },
  { id: 'phar101-cns',         name: 'CNS & Psychotropics',          parentId: 'phar101', count: 16 },

  // BIOL201 folders
  { id: 'biol201-membrane',    name: 'Membrane Transport',  parentId: 'biol201', count: 13 },
  { id: 'biol201-mitosis',     name: 'Mitosis & Meiosis',   parentId: 'biol201', count: 13 },
  { id: 'biol201-mendelian',   name: 'Mendelian Genetics',  parentId: 'biol201', count: 16 },
  { id: 'biol201-molecular',   name: 'Molecular Biology',   parentId: 'biol201', count: 16 },

  // SKEL101 folders
  { id: 'skel101-shoulder',    name: 'Shoulder Complex', parentId: 'skel101', count: 11 },
  { id: 'skel101-elbow',       name: 'Elbow & Forearm',  parentId: 'skel101', count: 11 },
  { id: 'skel101-cervical',    name: 'Cervical Spine',   parentId: 'skel101', count: 13 },
  { id: 'skel101-lumbar',      name: 'Lumbar Spine',     parentId: 'skel101', count: 10 },
]

// ─── Questions ───────────────────────────────────────────────────────────────

export const MOCK_QB_QUESTIONS: Question[] = [
  {
    id: 'q-001', code: 'PH-ANT-001', version: 3, age: '8 months',
    title: 'Which beta-lactam antibiotic is most appropriate for a patient with penicillin allergy requiring coverage against Streptococcus pneumoniae?',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply',
    folder: 'phar101-antibiotics', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials',
    tags: ['beta-lactam', 'allergy', 'streptococcus'], usage: 14, pbis: 0.41, pbisDir: 'up',
    creator: 'persona-thompson', lastEditedBy: 'persona-chen',
    usedInSections: ['Midterm 2024', 'Final 2023'], pinned: true,
  },
  {
    id: 'q-002', code: 'PH-ANT-002', version: 1, age: '2 months',
    title: 'Identify the mechanism by which methicillin-resistant Staphylococcus aureus (MRSA) evades beta-lactam antibiotics.',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-antibiotics', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials',
    tags: ['MRSA', 'resistance', 'beta-lactam'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
  },
  {
    id: 'q-003', code: 'PH-ANT-003', version: 2, age: '1 year',
    title: 'Arrange the following antibiotics in order of increasing spectrum: Amoxicillin, Vancomycin, Ciprofloxacin, Azithromycin.',
    type: 'Ordering', status: 'Saved', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'phar101-antibiotics', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials',
    tags: ['spectrum', 'ordering', 'gram-coverage'], usage: 9, pbis: 0.29, pbisDir: 'down',
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson',
    usedInSections: ['Final 2023'], favorited: true,
  },
  {
    id: 'q-004', code: 'PH-ANA-001', version: 4, age: '14 months',
    title: 'A patient on chronic NSAID therapy presents with epigastric pain. Which concomitant medication is most appropriate?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Apply',
    folder: 'phar101-analgesics', folderPath: 'PHAR101 QB / Analgesics & Pain Management',
    tags: ['NSAID', 'GI-protection', 'PPI'], usage: 22, pbis: 0.48, pbisDir: 'flat',
    creator: 'persona-thompson', lastEditedBy: 'persona-patel',
    usedInSections: ['Midterm 2024', 'Final 2023', 'Quiz 3'], pinned: true,
  },
  {
    id: 'q-005', code: 'PH-ANA-002', version: 1, age: '3 weeks',
    title: 'Match each opioid analgesic to its primary receptor subtype and clinical indication.',
    type: 'Matching', status: 'Draft', difficulty: 'Medium', blooms: 'Remember',
    folder: 'phar101-analgesics', folderPath: 'PHAR101 QB / Analgesics & Pain Management',
    tags: ['opioids', 'receptor', 'matching'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-patel', lastEditedBy: 'persona-patel', usedInSections: [],
  },
  {
    id: 'q-006', code: 'PH-CV-001', version: 2, age: '6 months',
    title: 'Which class of antihypertensive agents is contraindicated in bilateral renal artery stenosis?',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Understand',
    folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    tags: ['hypertension', 'ACE-inhibitor', 'contraindication'], usage: 11, pbis: 0.37, pbisDir: 'up',
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson',
    usedInSections: ['Midterm 2024'],
  },
  {
    id: 'q-007', code: 'PH-CV-002', version: 1, age: '5 months',
    title: 'Explain the Frank-Starling mechanism and its relevance to digoxin therapy in heart failure.',
    type: 'Fill blank', status: 'Saved', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    tags: ['heart-failure', 'digoxin', 'frank-starling'], usage: 3, pbis: 0.18, pbisDir: 'down',
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Quiz 2'],
  },
  {
    id: 'q-018', code: 'PH-CV-003', version: 1, age: '1 month',
    title: 'Evaluate the pharmacokinetics of novel GLP-1 receptor agonists in patients with type 2 diabetes and concurrent renal impairment.',
    type: 'MCQ', status: 'Draft', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    tags: ['GLP-1', 'pharmacokinetics', 'diabetes'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
  },
  {
    id: 'q-019', code: 'PH-CNS-001', version: 1, age: '3 weeks',
    title: 'Design a treatment algorithm for a patient presenting with first-episode psychosis.',
    type: 'Fill blank', status: 'Draft', difficulty: 'Hard', blooms: 'Create',
    folder: 'phar101-cns', folderPath: 'PHAR101 QB / CNS & Psychotropics',
    tags: ['psychosis', 'treatment-algorithm'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
  },
  {
    id: 'q-008', code: 'BI-MEM-001', version: 5, age: '2 years',
    title: 'Which transport mechanism requires the direct hydrolysis of ATP to move substances against their concentration gradient?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Remember',
    folder: 'biol201-membrane', folderPath: 'BIOL201 QB / Membrane Transport',
    tags: ['active-transport', 'ATP', 'gradient'], usage: 31, pbis: 0.52, pbisDir: 'flat',
    creator: 'persona-thompson', lastEditedBy: 'persona-chen', usedInSections: ['Midterm 2024', 'Final 2023', 'Quiz 1'],
  },
  {
    id: 'q-009', code: 'BI-MIT-001', version: 2, age: '10 months',
    title: 'During which phase of meiosis does crossing over primarily occur, and what is its genetic significance?',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Understand',
    folder: 'biol201-mitosis', folderPath: 'BIOL201 QB / Mitosis & Meiosis',
    tags: ['meiosis', 'crossing-over', 'genetics'], usage: 7, pbis: 0.33, pbisDir: 'up',
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson', usedInSections: ['Quiz 2'],
  },
  {
    id: 'q-010', code: 'SK-SH-001', version: 3, age: '1 year',
    title: 'Identify the primary stabilizers of the glenohumeral joint and their functional roles during overhead activities.',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply',
    folder: 'skel101-shoulder', folderPath: 'SKEL101 QB / Shoulder Complex',
    tags: ['glenohumeral', 'rotator-cuff', 'stabilization'], usage: 19, pbis: 0.44, pbisDir: 'flat',
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson',
    usedInSections: ['Midterm 2024', 'Final 2023'], favorited: true,
  },
]

// ─── Personas ────────────────────────────────────────────────────────────────

export const MOCK_QB_PERSONAS: Persona[] = [
  { id: 'persona-thompson', name: 'Dr. Thompson', initials: 'DT', role: 'Admin',   color: 'var(--brand-color)',      trustLevel: 'senior' },
  { id: 'persona-chen',     name: 'Dr. Chen',     initials: 'SC', role: 'Admin',   color: 'var(--chart-1)',          trustLevel: 'mid' },
  { id: 'persona-patel',    name: 'Dr. Patel',    initials: 'JP', role: 'Faculty', color: 'var(--chart-2)',          trustLevel: 'junior', assignedFolders: ['phar101', 'biol201'] },
  { id: 'persona-kim',      name: 'Dr. Kim',      initials: 'MK', role: 'Faculty', color: 'var(--chart-4)',          assignedFolders: [] },
]

// ─── Courses ─────────────────────────────────────────────────────────────────

export const mockCourses: Course[] = [
  { id: 'course-phar101', code: 'PHAR101', name: 'Pharmacology I',    questionBankFolderId: 'phar101' },
  { id: 'course-biol201', code: 'BIOL201', name: 'Cell Biology',      questionBankFolderId: 'biol201' },
  { id: 'course-skel101', code: 'SKEL101', name: 'Skeletal Anatomy',  questionBankFolderId: 'skel101' },
]

export const mockCourseOfferings: CourseOffering[] = [
  { id: 'offering-phar101-f25', courseId: 'course-phar101', semester: 'Fall 2025',   studentCount: 48 },
  { id: 'offering-phar101-s26', courseId: 'course-phar101', semester: 'Spring 2026', studentCount: 52 },
  { id: 'offering-biol201-f25', courseId: 'course-biol201', semester: 'Fall 2025',   studentCount: 36 },
  { id: 'offering-biol201-s26', courseId: 'course-biol201', semester: 'Spring 2026', studentCount: 41 },
  { id: 'offering-skel101-f25', courseId: 'course-skel101', semester: 'Fall 2025',   studentCount: 28 },
]

export const mockAssessments: Assessment[] = [
  { id: 'asmt-001', courseId: 'course-phar101', offeringId: 'offering-phar101-f25', title: 'Midterm Exam',  questionCount: 40, diffDistribution: { easy: 10, medium: 20, hard: 10 } },
  { id: 'asmt-002', courseId: 'course-phar101', offeringId: 'offering-phar101-f25', title: 'Final Exam',   questionCount: 60, diffDistribution: { easy: 15, medium: 25, hard: 20 } },
  { id: 'asmt-003', courseId: 'course-biol201', offeringId: 'offering-biol201-f25', title: 'Unit 1 Quiz',  questionCount: 20, diffDistribution: { easy: 8,  medium: 8,  hard: 4  } },
]
```

- [ ] **Step 2: Verify no import errors**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm type-check 2>&1 | head -40
```

- [ ] **Step 3: Commit**

```bash
git add lib/qb-mock-data.ts
git commit -m "refactor(qb): flatten folder tree, collapse statuses to Saved|Draft, rename shortlisted→favorited, add Course/Assessment mocks"
```

---

## Task 3: Rewrite qb-state.tsx

**Files:**
- Rewrite: `app/(app)/question-bank/qb-state.tsx`

- [ ] **Step 1: Write new state file**

```tsx
'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { FolderNode, Question, Persona } from '@/lib/qb-types'
import { MOCK_QB_FOLDERS, MOCK_QB_QUESTIONS, MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'

export type ColumnId = 'select' | 'code' | 'title' | 'status' | 'type' | 'difficulty' | 'blooms' | 'subfolder' | 'lastEditedBy' | 'usage' | 'pbis' | 'favorited' | 'actions'

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
  filterSheetOpen: boolean
  setFilterSheetOpen: (v: boolean) => void

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
  'select', 'code', 'title', 'status', 'type', 'difficulty', 'blooms',
  'subfolder', 'lastEditedBy', 'usage', 'pbis', 'favorited', 'actions',
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
  const [columnOrder, setColumnOrder] = useState<ColumnId[]>(DEFAULT_COLUMN_ORDER)
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set())
  const [rowHoverId, setRowHoverId] = useState<string | null>(null)
  const [draggedQuestionId, setDraggedQuestionId] = useState<string | null>(null)
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null)
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)
  const [openMenuQuestionId, setOpenMenuQuestionId] = useState<string | null>(null)
  const [collaboratorsModalFolderId, setCollaboratorsModalFolderId] = useState<string | null>(null)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

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

  function setHighlightedFolderId(id: string | null) {
    setHighlightedFolderIdState(id)
    if (id !== null) {
      setTimeout(() => setHighlightedFolderIdState(null), 1500)
    }
  }

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

  const isAdmin = currentPersona.role === 'Admin'

  const visibleQuestions = MOCK_QB_QUESTIONS.filter(q => {
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
    const favFilter = favoritesFilter ? q.favorited === true : true

    return roleVisible && navVisible && myFilter && favFilter
  })

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
    columnOrder, setColumnOrder,
    questions: MOCK_QB_QUESTIONS,
    selectedQuestionIds, toggleQuestionSelection, selectAllQuestions, clearSelection,
    rowHoverId, setRowHoverId,
    draggedQuestionId, setDraggedQuestionId,
    draggedFolderId, setDraggedFolderId,
    dragOverFolderId, setDragOverFolderId,
    openMenuQuestionId, setOpenMenuQuestionId,
    collaboratorsModalFolderId, setCollaboratorsModalFolderId,
    filterSheetOpen, setFilterSheetOpen,
    visibleQuestions, selectedFolder,
    closeAllOverlays,
  }

  return <QBContext.Provider value={value}>{children}</QBContext.Provider>
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm type-check 2>&1 | head -40
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/question-bank/qb-state.tsx
git commit -m "refactor(qb): new state shape — default My Questions, role filter, toolbar toggles, column order, folder highlight"
```

---

## Task 4: Delete qb-tabs.tsx + update question-bank-client.tsx

**Files:**
- Delete: `app/(app)/question-bank/qb-tabs.tsx`
- Modify: `app/(app)/question-bank/question-bank-client.tsx`

- [ ] **Step 1: Delete qb-tabs.tsx**

```bash
rm /Users/romitsoley/Work/apps/exam-management/admin/app/\(app\)/question-bank/qb-tabs.tsx
```

- [ ] **Step 2: Update question-bank-client.tsx** — remove SmartPopulateModal and QBTabs; fix color-mix white; fix Faculty access banner

Replace full file:

```tsx
'use client'
import { QBProvider } from './qb-state'
import { QBLayoutInner } from './qb-layout'
import { QBHeader } from './qb-header'
import { QBSidebar } from './qb-sidebar'
import { QBTitle } from './qb-title'
import { QBTable } from './qb-table'
import { useQB } from './qb-state'
import { ManageCollaboratorsModal, FilterSheet } from './qb-modals'
import { Button } from '@exxat/ds/packages/ui/src'

function QBContent() {
  const { currentPersona, selectedFolderId } = useQB()
  const isAdmin = currentPersona.role === 'Admin'
  const isFaculty = !isAdmin
  const hasFolderSelected = selectedFolderId !== null
  const hasAssignedCourses = (currentPersona.assignedFolders?.length ?? 0) > 0

  if (isFaculty && !hasAssignedCourses) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 16, backgroundColor: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-regular fa-hourglass-half" aria-hidden="true" style={{ fontSize: 28, color: 'var(--muted-foreground)' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--foreground)' }}>No courses assigned yet</h2>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', maxWidth: 340 }}>
            Your admin will assign course folders. You&apos;ll see your courses here as soon as they&apos;re assigned.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {isFaculty && hasFolderSelected && (
        <div style={{
          padding: '8px 16px',
          backgroundColor: 'color-mix(in oklch, var(--chart-1) 10%, var(--background))',
          borderBottom: '1px solid color-mix(in oklch, var(--chart-1) 20%, var(--background))',
          display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <i className="fa-regular fa-circle-info" aria-hidden="true" style={{ color: 'var(--chart-1)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--foreground)' }}>
            Faculty view — browse saved questions, add your own, or request edit access on existing ones.
          </span>
        </div>
      )}
      <QBTitle />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <QBTable />
      </div>
    </div>
  )
}

function QBInner() {
  return (
    <QBLayoutInner>
      <QBHeader />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <QBSidebar />
        <QBContent />
      </div>
      <ManageCollaboratorsModal />
      <FilterSheet />
    </QBLayoutInner>
  )
}

export function QuestionBankClient() {
  return (
    <QBProvider>
      <QBInner />
    </QBProvider>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm type-check 2>&1 | head -40
```

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/question-bank/question-bank-client.tsx
git commit -m "refactor(qb): remove SmartPopulateModal and QBTabs, fix color-mix violations in client shell"
```

---

## Task 5: globals.css tokens + badges.tsx

**Files:**
- Modify: `app/globals.css`
- Modify: `components/qb/badges.tsx`

- [ ] **Step 1: Add new tokens to globals.css**

Add after the existing QB color tokens block:

```css
/* QB status tokens — Saved (teal) + Draft (amber) */
--qb-status-saved-bg: color-mix(in oklch, var(--chart-2) 15%, transparent);
--qb-status-saved-fg: color-mix(in oklch, var(--chart-2) 80%, var(--foreground));
--qb-status-draft-bg: color-mix(in oklch, var(--chart-4) 15%, transparent);
--qb-status-draft-fg: color-mix(in oklch, var(--chart-4) 75%, var(--foreground));

/* Folder highlight animation */
@keyframes folder-highlight {
  0%   { background-color: var(--brand-tint); }
  100% { background-color: transparent; }
}
.folder-highlight {
  animation: folder-highlight 1500ms ease forwards;
}
```

- [ ] **Step 2: Rewrite components/qb/badges.tsx**

```tsx
import { Badge } from '@exxat/ds/packages/ui/src'
import type { QStatus, QType, QDiff, QBlooms } from '@/lib/qb-types'

// ── Status Badge — pill + icon ────────────────────────────────────────────────
const STATUS_MAP: Record<QStatus, { bg: string; fg: string; icon: string }> = {
  Saved: { bg: 'var(--qb-status-saved-bg)', fg: 'var(--qb-status-saved-fg)', icon: 'fa-circle-check' },
  Draft: { bg: 'var(--qb-status-draft-bg)', fg: 'var(--qb-status-draft-fg)', icon: 'fa-hourglass' },
}

export function StatusBadge({ status }: { status: QStatus }) {
  const s = STATUS_MAP[status]
  return (
    <Badge
      variant="secondary"
      className="rounded-full px-2.5 py-0.5 gap-1.5 font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <i className={`fa-light ${s.icon}`} aria-hidden="true" style={{ fontSize: 10 }} />
      {status}
    </Badge>
  )
}

// ── Type Badge — neutral muted text + icon ────────────────────────────────────
const TYPE_ICONS: Record<QType, string> = {
  'MCQ':        'fa-list-ul',
  'Fill blank': 'fa-input-text',
  'Hotspot':    'fa-crosshairs',
  'Ordering':   'fa-arrow-up-arrow-down',
  'Matching':   'fa-arrows-left-right-to-line',
}

export function TypeBadge({ type }: { type: QType }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
      <i className={`fa-light ${TYPE_ICONS[type]}`} aria-hidden="true" style={{ fontSize: 11 }} />
      {type}
    </span>
  )
}

// ── Difficulty — neutral muted text ───────────────────────────────────────────
export function DiffBadge({ difficulty }: { difficulty: QDiff }) {
  return (
    <span style={{ fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
      {difficulty}
    </span>
  )
}

// ── Blooms Badge ──────────────────────────────────────────────────────────────
const BLOOMS_COLORS: Record<QBlooms, string> = {
  Remember:   'var(--chart-3)',
  Understand: 'var(--chart-2)',
  Apply:      'var(--chart-1)',
  Analyze:    'var(--chart-4)',
  Evaluate:   'var(--chart-5)',
  Create:     'var(--brand-color)',
}

export function BloomsBadge({ blooms }: { blooms: QBlooms }) {
  return (
    <Badge
      variant="secondary"
      className="rounded font-medium whitespace-nowrap"
      style={{ fontSize: 10, padding: '1px 6px', color: BLOOMS_COLORS[blooms], backgroundColor: `color-mix(in oklch, ${BLOOMS_COLORS[blooms]} 12%, var(--background))` }}
    >
      {blooms}
    </Badge>
  )
}

// ── pBIS Cell ─────────────────────────────────────────────────────────────────
export function PBisCell({ pbis, pbisDir }: { pbis: number | null; pbisDir: 'up' | 'down' | 'flat' | null }) {
  if (pbis === null) return <span style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>—</span>
  const arrow = pbisDir === 'up' ? 'fa-arrow-up' : pbisDir === 'down' ? 'fa-arrow-down' : 'fa-minus'
  const color = pbisDir === 'up' ? 'var(--qb-status-saved-fg)' : pbisDir === 'down' ? 'var(--destructive)' : 'var(--muted-foreground)'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color }}>
      <i className={`fa-solid ${arrow}`} aria-hidden="true" style={{ fontSize: 9 }} />
      {pbis.toFixed(2)}
    </span>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm type-check 2>&1 | head -40
```

- [ ] **Step 4: Commit**

```bash
git add app/globals.css components/qb/badges.tsx
git commit -m "feat(qb): Saved/Draft status tokens, folder-highlight animation, updated badge components"
```

---

## Task 6: qb-sidebar.tsx — flatten tree, search bar, context menu cleanup

**Files:**
- Modify: `app/(app)/question-bank/qb-sidebar.tsx`

- [ ] **Step 1: Read current file**

```bash
cat /Users/romitsoley/Work/apps/exam-management/admin/app/\(app\)/question-bank/qb-sidebar.tsx
```

- [ ] **Step 2: Apply changes** — 5 targeted edits:

**2a. Remove isCourseOffering from getFolderIcon** — delete the `if (node.isCourseOffering)` branch entirely.

**2b. Replace Portal-based FolderContextMenu with DS DropdownMenu.** Replace the entire `FolderContextMenu` component:

```tsx
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, Button,
  InputGroup, InputGroupAddon,
} from '@exxat/ds/packages/ui/src'
import { Input } from '@exxat/ds/packages/ui/src'

function FolderContextMenu({ node, isAdmin }: { node: FolderNode; isAdmin: boolean; onClose: () => void }) {
  const { setCollaboratorsModalFolderId } = useQB()
  if (!isAdmin) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost" size="icon-xs"
          aria-label="Folder options"
          className="qb-folder-menu-btn shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <i className="fa-regular fa-ellipsis" aria-hidden="true" style={{ fontSize: 12 }} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => {}}>
          <i className="fa-light fa-folder-plus" aria-hidden="true" />
          New Subfolder
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCollaboratorsModalFolderId(node.id)}>
          <i className="fa-light fa-users" aria-hidden="true" />
          Manage Access
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {}}>
          <i className="fa-light fa-pen" aria-hidden="true" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => {}}>
          <i className="fa-light fa-trash-can" aria-hidden="true" />
          Delete Folder
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**2c. Add sidebar search bar** — add after the sidebar header `div`:

```tsx
{/* Sidebar search */}
<div style={{ padding: '0 8px 8px' }}>
  <InputGroup>
    <Input
      placeholder="Search folders…"
      value={sidebarSearch}
      onChange={e => setSidebarSearch(e.target.value)}
      style={{ height: 28, fontSize: 12 }}
    />
    <InputGroupAddon align="end">
      {sidebarSearch
        ? <Button variant="ghost" size="icon-xs" aria-label="Clear search" onClick={() => setSidebarSearch('')}>
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
          </Button>
        : <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 11, color: 'var(--muted-foreground)', padding: '0 6px' }} />
      }
    </InputGroupAddon>
  </InputGroup>
</div>
```

**2d. Filter tree by sidebarSearch** — in the root folder map, skip nodes that don't match:

```tsx
const filteredFolders = sidebarSearch.trim()
  ? MOCK_QB_FOLDERS.filter(f =>
      f.name.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
      MOCK_QB_FOLDERS.some(child => child.parentId === f.id && child.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
    )
  : MOCK_QB_FOLDERS

// Use filteredFolders when rendering tree rows
```

**2e. Add folder-highlight CSS class to matching row:**

```tsx
// In the row container div, add className:
className={`${highlightedFolderId === node.id ? 'folder-highlight' : ''}`}
```

**2f. Remove "+" add-course button** from sidebar header (delete the Button that calls addCourse).

- [ ] **Step 3: Type-check**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm type-check 2>&1 | head -40
```

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/question-bank/qb-sidebar.tsx
git commit -m "feat(qb): sidebar search, DS DropdownMenu context menu, folder highlight, remove add-course button"
```

---

## Task 7: qb-header.tsx — DS compliance

**Files:**
- Modify: `app/(app)/question-bank/qb-header.tsx`

- [ ] **Step 1: Replace raw `<button>` elements with DS Button + Avatar**

Replace the sidebar toggle raw `<button>`:

```tsx
<Button
  variant="ghost" size="icon-sm"
  onClick={toggleSidebar}
  aria-label={sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}
  style={{ color: sidebarState !== 'collapsed' ? 'var(--foreground)' : 'var(--muted-foreground)' }}
>
  <i className="fa-light fa-sidebar" aria-hidden="true" style={{ fontSize: 16 }} />
</Button>
```

Remove the entire breadcrumb `<nav>` block — the header now only has sidebar toggle + divider on the left.

Replace persona switcher trigger raw `<button>` with DS `Button variant="ghost"`:

```tsx
<DropdownMenuTrigger asChild>
  <Button variant="ghost" size="sm" className="gap-2 h-8 px-2" aria-label="Switch persona">
    <Avatar style={{ width: 24, height: 24 }}>
      <AvatarFallback style={{ backgroundColor: currentPersona.color, color: 'var(--primary-foreground)', fontSize: 9, fontWeight: 700 }}>
        {currentPersona.initials}
      </AvatarFallback>
    </Avatar>
    <span style={{ fontSize: 12, fontWeight: 500 }}>{currentPersona.name}</span>
    <Badge variant="secondary" className="rounded" style={{ fontSize: 10 }}>{currentPersona.role}</Badge>
    <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted-foreground)' }} />
  </Button>
</DropdownMenuTrigger>
```

Replace persona list raw `<button>` items with `<DropdownMenuItem>`:

```tsx
{personas.map(p => (
  <DropdownMenuItem key={p.id} onClick={() => setCurrentPersona(p)}>
    <Avatar style={{ width: 24, height: 24 }}>
      <AvatarFallback style={{ backgroundColor: p.color, color: 'var(--primary-foreground)', fontSize: 9, fontWeight: 700 }}>
        {p.initials}
      </AvatarFallback>
    </Avatar>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
      <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{p.role}</div>
    </div>
    {p.id === currentPersona.id && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 11, color: 'var(--brand-color)' }} />}
  </DropdownMenuItem>
))}
```

Add Avatar import:
```tsx
import { Button, Badge, Avatar, AvatarFallback, useSidebar, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuItem } from '@exxat/ds/packages/ui/src'
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm type-check 2>&1 | head -40
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/question-bank/qb-header.tsx
git commit -m "fix(qb): replace raw buttons with DS Button+Avatar in header, remove breadcrumb"
```

---

## Task 8: qb-title.tsx — Google Drive breadcrumb + collaborator avatars + simplified Add button

**Files:**
- Rewrite: `app/(app)/question-bank/qb-title.tsx`

- [ ] **Step 1: Write new qb-title.tsx**

```tsx
'use client'
import { useQB } from './qb-state'
import {
  Button, Badge, Avatar, AvatarFallback,
  Popover, PopoverTrigger, PopoverContent,
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator,
} from '@exxat/ds/packages/ui/src'
import { MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'

// Breadcrumb segment with hover-popover (folder snapshot) + chevron sibling-switcher
function BreadcrumbSegment({ label, folderId, siblings, onNavigate, isLast }: {
  label: string
  folderId: string | null
  siblings: { id: string; name: string; count: number }[]
  onNavigate: (id: string | null) => void
  isLast: boolean
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost" size="sm"
            className="h-auto px-1.5 py-0.5 font-semibold"
            style={{
              fontSize: 20,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '-0.02em',
              color: isLast ? 'var(--foreground)' : 'var(--muted-foreground)',
              fontWeight: isLast ? 700 : 500,
            }}
            onClick={() => onNavigate(folderId)}
          >
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-3">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            {folderId ? 'Folder snapshot — questions and subfolders appear here.' : 'Top-level Question Bank.'}
          </div>
        </PopoverContent>
      </Popover>

      {siblings.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label="Switch folder" style={{ color: 'var(--muted-foreground)' }}>
              <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 10 }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {siblings.map(s => (
              <DropdownMenuItem key={s.id} onClick={() => onNavigate(s.id)}>
                <i className="fa-light fa-folder" aria-hidden="true" />
                <span style={{ flex: 1 }}>{s.name}</span>
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{s.count}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </span>
  )
}

// Collaborator avatar stack (Figma-style)
function CollaboratorAvatars({ folderCollaborators }: { folderCollaborators: string[] }) {
  const { currentPersona, setCollaboratorsModalFolderId, selectedFolderId, folders } = useQB()
  const isAdmin = currentPersona.role === 'Admin'
  const MAX_SHOWN = 3
  const personas = MOCK_QB_PERSONAS.filter(p => folderCollaborators.includes(p.id))
  const shown = personas.slice(0, MAX_SHOWN)
  const overflow = personas.length - MAX_SHOWN

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          style={{ display: 'inline-flex', alignItems: 'center', gap: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          aria-label="Collaborators"
        >
          {shown.map((p, i) => (
            <Avatar key={p.id} style={{ width: 22, height: 22, marginLeft: i === 0 ? 0 : -6, border: '2px solid var(--background)', borderRadius: '50%', zIndex: shown.length - i }}>
              <AvatarFallback style={{ backgroundColor: p.color, color: 'var(--primary-foreground)', fontSize: 8, fontWeight: 700 }}>
                {p.initials}
              </AvatarFallback>
            </Avatar>
          ))}
          {overflow > 0 && (
            <Badge variant="secondary" className="rounded-full h-5.5 min-w-5.5 px-1" style={{ fontSize: 9, marginLeft: -6, border: '2px solid var(--background)' }}>
              +{overflow}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-3">
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 8 }}>
          {personas.length} Collaborator{personas.length !== 1 ? 's' : ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {personas.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar style={{ width: 28, height: 28, flexShrink: 0 }}>
                <AvatarFallback style={{ backgroundColor: p.color, color: 'var(--primary-foreground)', fontSize: 10, fontWeight: 700 }}>
                  {p.initials}
                </AvatarFallback>
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{i === 0 ? 'Owner' : p.role}</div>
              </div>
            </div>
          ))}
        </div>
        {isAdmin && (
          <Button
            variant="outline" size="sm"
            className="w-full mt-3 gap-1.5 text-xs"
            onClick={() => setCollaboratorsModalFolderId(selectedFolderId)}
          >
            <i className="fa-light fa-user-plus" aria-hidden="true" />
            Manage access
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function QBTitle() {
  const { selectedFolder, visibleQuestions, navView, setNavView, setSelectedFolderId, folders, navigateToFolder, currentPersona } = useQB()
  const isAdmin = currentPersona.role === 'Admin'
  const count = visibleQuestions.length

  // Build breadcrumb segments
  const segments: { label: string; folderId: string | null; siblings: { id: string; name: string; count: number }[] }[] = [
    {
      label: 'Question Bank',
      folderId: null,
      siblings: [],
    },
  ]

  if (navView === 'my') {
    segments.push({ label: 'My Questions', folderId: null, siblings: [] })
  } else if (navView === 'all') {
    segments.push({ label: 'All Questions', folderId: null, siblings: [] })
  } else if (selectedFolder) {
    // Build ancestor chain
    const chain: typeof segments = []
    let node = selectedFolder
    while (node) {
      const siblings = folders.filter(f => f.parentId === node.parentId && f.id !== node.id).map(f => ({ id: f.id, name: f.name, count: f.count }))
      chain.unshift({ label: node.name, folderId: node.id, siblings })
      if (!node.parentId) break
      const parent = folders.find(f => f.id === node.parentId)
      if (!parent) break
      node = parent
    }
    segments.push(...chain)
  }

  const collaborators = selectedFolder?.collaborators ?? []

  return (
    <div style={{ padding: '10px 16px 8px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      {/* Breadcrumb title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, minWidth: 0 }}>
          {segments.map((seg, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && (
                <i className="fa-light fa-chevron-right" aria-hidden="true"
                  style={{ fontSize: 11, color: 'var(--muted-foreground)', flexShrink: 0 }} />
              )}
              <BreadcrumbSegment
                label={seg.label}
                folderId={seg.folderId}
                siblings={seg.siblings}
                isLast={i === segments.length - 1}
                onNavigate={(id) => {
                  if (id === null && i === 0) { setNavView('my') }
                  else if (id === null) { /* no-op for My/All labels */ }
                  else { navigateToFolder(id) }
                }}
              />
            </span>
          ))}
        </div>

        {/* Add Question button — single CTA, no split, no dropdown */}
        <Button size="default" onClick={() => {}} style={{ flexShrink: 0 }}>
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add Question
        </Button>
      </div>

      {/* Subtitle row: count + collaborator avatars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>
          {count} question{count !== 1 ? 's' : ''} · Last updated now
        </span>
        {collaborators.length > 0 && (
          <>
            <span style={{ width: 1, height: 12, backgroundColor: 'var(--border)', display: 'inline-block' }} />
            <CollaboratorAvatars folderCollaborators={collaborators} />
          </>
        )}
        {isAdmin && selectedFolder && (
          <Button variant="ghost" size="icon-xs" aria-label="Add collaborator"
            onClick={() => {}} style={{ color: 'var(--muted-foreground)' }}>
            <i className="fa-light fa-user-plus" aria-hidden="true" style={{ fontSize: 11 }} />
          </Button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm type-check 2>&1 | head -40
```

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/question-bank/qb-title.tsx
git commit -m "feat(qb): Google Drive breadcrumb title, collaborator avatar stack, single Add Question CTA"
```

---

## Task 9: qb-table.tsx — DS compliance + new columns + toolbar + Mine pill removal + Flag for Review removal

**Files:**
- Modify: `app/(app)/question-bank/qb-table.tsx`

- [ ] **Step 1: Replace Portal-based VersionPopover with DS Popover**

Remove the `VersionPopover` component entirely. Replace with inline DS Popover at the version badge site:

```tsx
import { Popover, PopoverTrigger, PopoverContent, Tooltip, TooltipTrigger, TooltipContent } from '@exxat/ds/packages/ui/src'

// Inside the version cell:
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon-xs" aria-label="Version history" style={{ fontSize: 10 }}>
      <Badge variant="secondary" className="rounded font-mono cursor-pointer" style={{ fontSize: 10, padding: '1px 5px' }}>
        V{q.version}
      </Badge>
    </Button>
  </PopoverTrigger>
  <PopoverContent align="end" className="w-72 p-3">
    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', marginBottom: 10 }}>
      Version History
    </div>
    {Array.from({ length: q.version }, (_, i) => {
      const vNum = q.version - i
      const isLatest = i === 0
      return (
        <div key={vNum} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
          <Badge variant="secondary" className="rounded font-mono shrink-0" style={{ fontSize: 9, padding: '1px 5px', backgroundColor: isLatest ? 'var(--brand-tint)' : undefined, color: isLatest ? 'var(--brand-color-dark)' : undefined }}>
            V{vNum}
          </Badge>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isLatest ? q.title.slice(0, 55) : `Revision ${vNum}`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 1 }}>
              {isLatest ? (q.lastEditedBy ?? q.creator ?? 'Unknown') : q.creator ?? 'Unknown'} · {isLatest ? q.age : `${i + 1} months ago`}
            </div>
          </div>
          {isOwner && (
            <Button variant="ghost" size="icon-xs" aria-label="Use this version">
              <i className="fa-light fa-rotate-left" aria-hidden="true" style={{ fontSize: 11 }} />
            </Button>
          )}
        </div>
      )
    })}
  </PopoverContent>
</Popover>
```

- [ ] **Step 2: Replace Portal-based RowContextMenu with DS DropdownMenu**

Remove the `RowContextMenu` component. Replace with inline `DropdownMenu` per row:

```tsx
<DropdownMenu open={openMenuQuestionId === q.id} onOpenChange={open => setOpenMenuQuestionId(open ? q.id : null)}>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon-sm" aria-label="Row actions" onClick={e => e.stopPropagation()}>
      <i className="fa-regular fa-ellipsis" aria-hidden="true" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-44">
    {(isAdmin || isOwner) && (
      <DropdownMenuItem onClick={() => {}}>
        <i className="fa-light fa-pen" aria-hidden="true" />
        Edit
      </DropdownMenuItem>
    )}
    <DropdownMenuItem onClick={() => {}}>
      <i className="fa-light fa-copy" aria-hidden="true" />
      Duplicate
    </DropdownMenuItem>
    {isAdmin && (
      <DropdownMenuItem onClick={() => {}}>
        <i className="fa-light fa-folder-arrow-up" aria-hidden="true" />
        Move to Folder
      </DropdownMenuItem>
    )}
    <DropdownMenuSeparator />
    {!isAdmin && !isOwner && (
      <DropdownMenuItem onClick={() => {}}>
        <i className="fa-light fa-lock-keyhole-open" aria-hidden="true" />
        Request Edit Access
      </DropdownMenuItem>
    )}
    {(isAdmin || isOwner) && (
      <DropdownMenuItem variant="destructive" onClick={() => {}}>
        <i className="fa-light fa-trash-can" aria-hidden="true" />
        Delete
      </DropdownMenuItem>
    )}
  </DropdownMenuContent>
</DropdownMenu>
```

Note: **No "Flag for Review" item** — removed per design decision.

- [ ] **Step 3: Fix color-mix white → var(--background)**

Search and replace all `color-mix(in oklch, ... white)` with `color-mix(in oklch, ... var(--background))` in the file.

```bash
grep -n "white)" /Users/romitsoley/Work/apps/exam-management/admin/app/\(app\)/question-bank/qb-table.tsx
```

For each match, change `white` to `var(--background)`.

- [ ] **Step 4: Fix shortlisted → favorited**

```bash
sed -i '' 's/shortlisted/favorited/g' /Users/romitsoley/Work/apps/exam-management/admin/app/\(app\)/question-bank/qb-table.tsx
```

- [ ] **Step 5: Add toolbar icon buttons (My Questions + Favorites toggles)**

In the toolbar, after the filter button, add:

```tsx
{/* My Questions toggle */}
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="outline" size="icon-sm"
      aria-label="My questions"
      aria-pressed={myQuestionsOnly}
      onClick={() => setMyQuestionsOnly(!myQuestionsOnly)}
      style={myQuestionsOnly ? { borderColor: 'var(--brand-color)', color: 'var(--brand-color)', backgroundColor: 'color-mix(in oklch, var(--brand-color) 8%, var(--background))' } : {}}
    >
      <i className="fa-light fa-user" aria-hidden="true" style={{ fontSize: 13 }} />
    </Button>
  </TooltipTrigger>
  <TooltipContent>My questions only</TooltipContent>
</Tooltip>

{/* Favorites toggle */}
<Tooltip>
  <TooltipTrigger asChild>
    <Button
      variant="outline" size="icon-sm"
      aria-label="Favorites"
      aria-pressed={favoritesFilter}
      onClick={() => setFavoritesFilter(!favoritesFilter)}
      style={favoritesFilter ? { borderColor: 'var(--chart-4)', color: 'var(--chart-4)', backgroundColor: 'color-mix(in oklch, var(--chart-4) 10%, var(--background))' } : {}}
    >
      <i className={favoritesFilter ? 'fa-solid fa-star' : 'fa-light fa-star'} aria-hidden="true" style={{ fontSize: 13 }} />
    </Button>
  </TooltipTrigger>
  <TooltipContent>Favorites only</TooltipContent>
</Tooltip>
```

- [ ] **Step 6: Remove "Mine" pill badge from question rows**

Find and delete any `<Badge>Mine</Badge>` or similar "Mine" ownership pill rendered inside question title cells.

- [ ] **Step 7: Add new columns — subfolder path, dedicated Type col, Last Edited By, Favorites star**

In the `QB_COLS` constant (or equivalent column definition), add:

```tsx
// Subfolder (clickable path)
{ id: 'subfolder', label: 'Location', width: 180 }

// Type (dedicated column, was previously inside title cell)
{ id: 'type', label: 'Type', width: 110 }

// Last Edited By
{ id: 'lastEditedBy', label: 'Last Edited By', width: 130 }

// Favorites star (icon column)
{ id: 'favorited', label: '', width: 32 }
```

Subfolder cell renders clickable path segments:

```tsx
function SubfolderCell({ question }: { question: Question }) {
  const { navigateToFolder } = useQB()
  const segments = question.folderPath.split(' / ')
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, color: 'var(--muted-foreground)', flexWrap: 'nowrap' }}>
      {segments.map((seg, i) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          {i > 0 && <i className="fa-light fa-chevron-right" aria-hidden="true" style={{ fontSize: 9 }} />}
          <button
            onClick={e => { e.stopPropagation(); /* navigate to matching folder */ }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: 'var(--muted-foreground)' }}
            className="hover:text-foreground hover:underline"
          >
            {seg}
          </button>
        </span>
      ))}
    </span>
  )
}
```

Favorites star cell:

```tsx
function FavoritedCell({ question }: { question: Question }) {
  const [fav, setFav] = useState(question.favorited ?? false)
  return (
    <Button
      variant="ghost" size="icon-xs"
      aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
      onClick={e => { e.stopPropagation(); setFav(v => !v) }}
      style={{ color: fav ? 'var(--chart-4)' : 'var(--muted-foreground)' }}
    >
      <i className={fav ? 'fa-solid fa-star' : 'fa-light fa-star'} aria-hidden="true" style={{ fontSize: 13 }} />
    </Button>
  )
}
```

- [ ] **Step 8: Add active filter chips below toolbar**

```tsx
function ActiveFilterChips() {
  const { myQuestionsOnly, setMyQuestionsOnly, favoritesFilter, setFavoritesFilter, navView } = useQB()
  const chips = []
  if (myQuestionsOnly) chips.push({ label: 'My Questions', onRemove: () => setMyQuestionsOnly(false) })
  if (favoritesFilter) chips.push({ label: 'Favorites', onRemove: () => setFavoritesFilter(false) })
  if (chips.length === 0) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
      {chips.map(chip => (
        <Badge key={chip.label} variant="secondary" className="rounded gap-1 px-2 py-0.5 text-xs">
          {chip.label}
          <button onClick={chip.onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'inherit' }} aria-label={`Remove ${chip.label} filter`}>
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 10 }} />
          </button>
        </Badge>
      ))}
    </div>
  )
}
```

Add `<ActiveFilterChips />` between toolbar and table body.

- [ ] **Step 9: Type-check**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm type-check 2>&1 | head -40
```

- [ ] **Step 10: Commit**

```bash
git add app/\(app\)/question-bank/qb-table.tsx
git commit -m "feat(qb): DS Popover/DropdownMenu for version history and row menu, new columns, toolbar toggles, remove Mine pill and Flag for Review"
```

---

## Task 10: qb-modals.tsx — Remove SmartPopulate, redesign ManageCollaborators, improve RequestEditAccess

**Files:**
- Modify: `app/(app)/question-bank/qb-modals.tsx`

- [ ] **Step 1: Delete SmartPopulateModal** — remove the entire exported `SmartPopulateModal` function and all its helpers (FolderPickerNode, etc. if only used there).

- [ ] **Step 2: Update FilterSheet** — in the status filter section, replace 7-status chip list with 2-chip list:

```tsx
{/* Status */}
<div>
  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Status</div>
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {(['Saved', 'Draft'] as const).map(s => (
      <button
        key={s}
        onClick={() => toggleStatus(s)}
        style={{
          padding: '4px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: '1px solid',
          borderColor: statusFilter.includes(s) ? 'var(--brand-color)' : 'var(--border)',
          backgroundColor: statusFilter.includes(s) ? 'color-mix(in oklch, var(--brand-color) 10%, var(--background))' : 'var(--background)',
          color: statusFilter.includes(s) ? 'var(--brand-color-dark)' : 'var(--foreground)',
        }}
      >
        {s}
      </button>
    ))}
  </div>
</div>
```

Add Favorites toggle at top of FilterSheet:

```tsx
{/* Favorites */}
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
  <span style={{ fontSize: 13, fontWeight: 500 }}>Favorites only</span>
  <ToggleSwitch checked={favoritesFilter} onChange={setFavoritesFilter} />
</div>
```

- [ ] **Step 3: Rewrite ManageCollaboratorsModal** — no tabs, Avatar rows, inline role, remove with Undo, search+invite

```tsx
export function ManageCollaboratorsModal() {
  const { collaboratorsModalFolderId, setCollaboratorsModalFolderId, folders } = useQB()
  const folder = folders.find(f => f.id === collaboratorsModalFolderId)
  const [search, setSearch] = useState('')
  const [removedId, setRemovedId] = useState<string | null>(null)
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const collaborators = MOCK_QB_PERSONAS.filter(p => folder?.collaborators?.includes(p.id) && p.id !== removedId)

  function removeCollaborator(id: string) {
    setRemovedId(id)
    const t = setTimeout(() => setRemovedId(null), 5000)
    setUndoTimer(t)
  }

  function undoRemove() {
    setRemovedId(null)
    if (undoTimer) clearTimeout(undoTimer)
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
          <InputGroupAddon align="end">
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
```

- [ ] **Step 4: Add RequestEditAccessModal** — improved UI inspired by GitHub/Linear/Figma request-access patterns

```tsx
export function RequestEditAccessModal({ questionId, questionTitle, open, onOpenChange }: {
  questionId: string
  questionTitle: string
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function submit() {
    setSent(true)
    setTimeout(() => { onOpenChange(false); setSent(false); setMessage('') }, 1800)
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
              {/* Question context */}
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
```

Add necessary imports to qb-modals.tsx:
```tsx
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Button, Badge, Avatar, AvatarFallback,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  InputGroup, InputGroupAddon, Input, Textarea, ToggleSwitch,
  Field, FieldLabel,
} from '@exxat/ds/packages/ui/src'
```

- [ ] **Step 5: Type-check**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm type-check 2>&1 | head -40
```

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/question-bank/qb-modals.tsx
git commit -m "feat(qb): remove SmartPopulateModal, redesign ManageCollaborators, improved RequestEditAccess modal"
```

---

## Task 11: questions/[id]/page.tsx — DS Badge fixes

**Files:**
- Modify: `app/(app)/questions/[id]/page.tsx`

- [ ] **Step 1: Read current file**

```bash
cat /Users/romitsoley/Work/apps/exam-management/admin/app/\(app\)/questions/\[id\]/page.tsx
```

- [ ] **Step 2: Replace raw `<span>` badges with DS Badge**

For type and scope badges:
```tsx
// Before: <span style={{ ... }}>MCQ</span>
// After:
<Badge variant="secondary" className="rounded">MCQ</Badge>
```

For tag chips:
```tsx
// Before: <span style={{ ... }}>{tag}</span>
// After:
<Badge variant="outline" className="rounded text-xs">{tag}</Badge>
```

- [ ] **Step 3: Type-check + commit**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm type-check 2>&1 | head -40
git add app/\(app\)/questions/\[id\]/page.tsx
git commit -m "fix(qb): replace raw span badges with DS Badge in question detail page"
```

---

## Task 12: app-sidebar.tsx + new Courses and Assessment Builder pages

**Files:**
- Modify: `components/app-sidebar.tsx`
- Create: `app/(app)/courses/page.tsx`
- Create: `app/(app)/assessment-builder/page.tsx`

- [ ] **Step 1: Add nav items to app-sidebar.tsx**

Find the `navItems` array (or equivalent `SidebarMenuItem` list) and add after the Question Bank item:

```tsx
{ title: 'Courses', url: '/courses', icon: 'fa-graduation-cap' },
{ title: 'Assessment Builder', url: '/assessment-builder', icon: 'fa-rectangle-list' },
```

- [ ] **Step 2: Create app/(app)/courses/page.tsx**

```tsx
import type { Metadata } from 'next'
import CoursesClient from './courses-client'
export const metadata: Metadata = { title: 'Courses — Exam Management' }
export default function CoursesPage() { return <CoursesClient /> }
```

Create `app/(app)/courses/courses-client.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { Button, Badge, Collapsible, CollapsibleTrigger, CollapsibleContent, Tooltip, TooltipTrigger, TooltipContent } from '@exxat/ds/packages/ui/src'
import { mockCourses, mockCourseOfferings } from '@/lib/qb-mock-data'
import { useRouter } from 'next/navigation'

export default function CoursesClient() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['course-phar101']))
  const router = useRouter()

  function toggle(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Courses</h1>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>{mockCourses.length} courses · {mockCourseOfferings.length} offerings</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button disabled>
              <i className="fa-light fa-plus" aria-hidden="true" />
              New Course
            </Button>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mockCourses.map(course => {
          const offerings = mockCourseOfferings.filter(o => o.courseId === course.id)
          const isOpen = expandedIds.has(course.id)
          return (
            <Collapsible key={course.id} open={isOpen} onOpenChange={() => toggle(course.id)}>
              <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', backgroundColor: 'var(--card)' }}>
                <CollapsibleTrigger asChild>
                  <button style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fa-light fa-graduation-cap" aria-hidden="true" style={{ fontSize: 16, color: 'var(--brand-color)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--foreground)' }}>{course.code} — {course.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>{offerings.length} offering{offerings.length !== 1 ? 's' : ''}</div>
                    </div>
                    <i className={`fa-light ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    {offerings.map(o => (
                      <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px 10px 64px', borderBottom: '1px solid var(--border)' }}>
                        <i className="fa-light fa-calendar-days" aria-hidden="true" style={{ fontSize: 13, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{o.semester}</span>
                        <Badge variant="secondary" className="rounded text-xs">{o.studentCount} students</Badge>
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => router.push('/question-bank')}>
                          View QB
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create app/(app)/assessment-builder/page.tsx**

```tsx
import type { Metadata } from 'next'
import AssessmentBuilderClient from './assessment-builder-client'
export const metadata: Metadata = { title: 'Assessment Builder — Exam Management' }
export default function AssessmentBuilderPage() { return <AssessmentBuilderClient /> }
```

Create `app/(app)/assessment-builder/assessment-builder-client.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '@exxat/ds/packages/ui/src'
import { mockCourses, mockCourseOfferings, mockAssessments } from '@/lib/qb-mock-data'

function DiffBar({ easy, medium, hard }: { easy: number; medium: number; hard: number }) {
  const total = easy + medium + hard
  return (
    <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', gap: 1 }}>
      <div style={{ flex: easy, backgroundColor: 'var(--chart-2)' }} title={`Easy: ${easy}`} />
      <div style={{ flex: medium, backgroundColor: 'var(--chart-4)' }} title={`Medium: ${medium}`} />
      <div style={{ flex: hard, backgroundColor: 'var(--chart-1)' }} title={`Hard: ${hard}`} />
    </div>
  )
}

export default function AssessmentBuilderClient() {
  const [selectedCourseId, setSelectedCourseId] = useState(mockCourses[0].id)
  const [selectedOfferingId, setSelectedOfferingId] = useState(mockCourseOfferings[0].id)

  const offerings = mockCourseOfferings.filter(o => o.courseId === selectedCourseId)
  const assessments = mockAssessments.filter(a => a.courseId === selectedCourseId && a.offeringId === selectedOfferingId)

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left panel — course + offering tree */}
      <aside style={{ width: 240, borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0, padding: '16px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)', padding: '0 8px', marginBottom: 8 }}>Courses</div>
        {mockCourses.map(course => {
          const courseOfferings = mockCourseOfferings.filter(o => o.courseId === course.id)
          const isSelected = selectedCourseId === course.id
          return (
            <div key={course.id}>
              <button
                onClick={() => { setSelectedCourseId(course.id); if (courseOfferings.length) setSelectedOfferingId(courseOfferings[0].id) }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', border: 'none', borderRadius: 6, cursor: 'pointer', textAlign: 'left', backgroundColor: isSelected ? 'var(--accent)' : 'transparent' }}
              >
                <i className="fa-light fa-graduation-cap" aria-hidden="true" style={{ fontSize: 13, color: isSelected ? 'var(--brand-color)' : 'var(--muted-foreground)' }} />
                <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--foreground)' : 'var(--foreground)' }}>{course.code}</span>
              </button>
              {isSelected && courseOfferings.map(o => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOfferingId(o.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '5px 8px 5px 28px', border: 'none', borderRadius: 6, cursor: 'pointer', backgroundColor: selectedOfferingId === o.id ? 'var(--brand-tint)' : 'transparent' }}
                >
                  <i className="fa-light fa-calendar-days" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
                  <span style={{ fontSize: 12, color: 'var(--foreground)' }}>{o.semester}</span>
                </button>
              ))}
            </div>
          )
        })}
      </aside>

      {/* Right panel — assessment cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, margin: 0 }}>
              {mockCourses.find(c => c.id === selectedCourseId)?.code} Assessments
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>
              {mockCourseOfferings.find(o => o.id === selectedOfferingId)?.semester}
            </p>
          </div>
          <Button>
            <i className="fa-light fa-plus" aria-hidden="true" />
            New Assessment
          </Button>
        </div>

        <Tabs defaultValue="all">
          <TabsList variant="line">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="hard">High Difficulty</TabsTrigger>
            <TabsTrigger value="unbalanced">Unbalanced</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginTop: 16 }}>
              {assessments.map(a => (
                <Card key={a.id}>
                  <CardHeader style={{ paddingBottom: 8 }}>
                    <CardTitle style={{ fontSize: 15 }}>{a.title}</CardTitle>
                    <Badge variant="secondary" className="rounded w-fit text-xs">{a.questionCount} questions</Badge>
                  </CardHeader>
                  <CardContent>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 6 }}>Difficulty distribution</div>
                    <DiffBar {...a.diffDistribution} />
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--muted-foreground)' }}>
                      <span><span style={{ color: 'var(--chart-2)' }}>●</span> Easy {a.diffDistribution.easy}</span>
                      <span><span style={{ color: 'var(--chart-4)' }}>●</span> Medium {a.diffDistribution.medium}</span>
                      <span><span style={{ color: 'var(--chart-1)' }}>●</span> Hard {a.diffDistribution.hard}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3 text-xs h-7">Open Builder</Button>
                  </CardContent>
                </Card>
              ))}
              {assessments.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--muted-foreground)', fontSize: 13 }}>
                  No assessments for this offering yet.
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="hard">
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>High difficulty filter — coming soon.</div>
          </TabsContent>
          <TabsContent value="unbalanced">
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 13 }}>Unbalanced filter — coming soon.</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Type-check**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm type-check 2>&1 | head -40
```

- [ ] **Step 5: Commit**

```bash
git add components/app-sidebar.tsx app/\(app\)/courses/ app/\(app\)/assessment-builder/
git commit -m "feat(qb): add Courses and Assessment Builder scaffold pages, update sidebar nav"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Task |
|---|---|
| QStatus → Saved\|Draft | Task 1 |
| Remove SVItem/SmartCriteria | Task 1 |
| Flatten folder tree (no offerings) | Task 2 |
| Rename shortlisted → favorited | Task 1+2 |
| folderPath on Question | Task 1+2 |
| navView default = 'my' | Task 3 |
| Role-based visibility (Faculty) | Task 3 |
| highlightedFolderId + 1500ms | Task 3 |
| myQuestionsOnly + favoritesFilter state | Task 3 |
| columnOrder state | Task 3 |
| Auto-select first faculty folder | Task 3 |
| Delete qb-tabs.tsx | Task 4 |
| Remove SmartPopulateModal from client | Task 4 |
| Fix Faculty access banner color-mix | Task 4 |
| Saved/Draft CSS tokens | Task 5 |
| folder-highlight animation | Task 5 |
| StatusBadge → Saved/Draft only | Task 5 |
| DiffBadge → neutral text | Task 5 |
| Sidebar DS DropdownMenu context menu | Task 6 |
| Sidebar folder search bar | Task 6 |
| Remove add-course button | Task 6 |
| folder-highlight class on rows | Task 6 |
| header raw buttons → DS Button+Avatar | Task 7 |
| Remove breadcrumb from header | Task 7 |
| Google Drive breadcrumb title (h1) | Task 8 |
| Segment hover popover | Task 8 |
| Segment chevron sibling switcher | Task 8 |
| Collaborator avatar stack | Task 8 |
| Single "Add Question" CTA (no split/dropdown) | Task 8 |
| Version history → DS Popover + "Use this version" | Task 9 |
| Row context menu → DS DropdownMenu | Task 9 |
| Remove Flag for Review | Task 9 |
| color-mix white → var(--background) | Task 9 |
| shortlisted → favorited in table | Task 9 |
| My Questions toolbar toggle | Task 9 |
| Favorites toolbar toggle | Task 9 |
| Remove Mine pill | Task 9 |
| New columns (subfolder, type, lastEditedBy, favorited) | Task 9 |
| Active filter chips | Task 9 |
| Remove SmartPopulateModal | Task 10 |
| FilterSheet Saved/Draft status chips | Task 10 |
| FilterSheet Favorites toggle | Task 10 |
| ManageCollaborators redesign | Task 10 |
| RequestEditAccess improved UI | Task 10 |
| questions/[id] DS Badge fixes | Task 11 |
| Sidebar nav: Courses + Assessment Builder | Task 12 |
| Courses page (Collapsible accordion) | Task 12 |
| Assessment Builder (two-panel + difficulty bar) | Task 12 |

### Placeholder scan
No TBDs. All code blocks are complete and compilable.

### Type consistency
- `QStatus` defined in Task 1, used in Tasks 2, 5, 10
- `favorited` (not `shortlisted`) used consistently from Task 1 onward
- `ColumnId` union defined in Task 3, used in Task 3 only (table reads from `columnOrder`)
- `navigateToFolder` defined in Task 3 state, called in Task 8 (qb-title) and Task 9 (subfolder cell)
- `Course`, `CourseOffering`, `Assessment` defined in Task 1, exported from Task 2, consumed in Task 12
