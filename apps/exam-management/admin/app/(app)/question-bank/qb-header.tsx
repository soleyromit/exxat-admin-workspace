'use client'
import { useQB } from './qb-state'
import {
  Button, Badge, useSidebar,
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuItem,
  Popover, PopoverTrigger, PopoverContent,
  Tooltip, TooltipContent, TooltipTrigger,
  Avatar, AvatarFallback,
} from '@exxat/ds/packages/ui/src'
import type { FolderNode, Persona } from '@/lib/qb-types'

function getRoleLabel(role: Persona['role']): string {
  if (role === 'exam_admin') return 'Exam Management Admin'
  if (role === 'course_director') return 'Course Director'
  return 'Instructor'
}

function courseFolderLabel(name: string): string {
  const match = name.match(/^([A-Z0-9]+)\s/)
  if (!match) return name
  return `${match[1]} · Question Bank`
}

function buildFolderPath(folderId: string | null, folders: FolderNode[]): FolderNode[] {
  if (!folderId) return []
  const parts: FolderNode[] = []
  let cur = folders.find(f => f.id === folderId)
  while (cur) {
    parts.unshift(cur)
    cur = cur.parentId ? folders.find(f => f.id === cur!.parentId) : undefined
  }
  return parts
}

// Breadcrumb rules:
//   0 segments → "Question Bank"
//   1 segment  → "Question Bank > Root"
//   2 segments → "Question Bank > Parent > Leaf"
//   3+ segments → "Question Bank > … > Parent > Leaf"  (… collapses root + everything before parent)
function QBBreadcrumb() {
  const { folders, selectedFolderId, navView, setNavView, navigateToFolder } = useQB()

  const folderPath = navView === 'folder' ? buildFolderPath(selectedFolderId, folders) : []
  const last   = folderPath[folderPath.length - 1] ?? null
  const parent = folderPath.length >= 2 ? folderPath[folderPath.length - 2] : null
  // collapsedNodes: root + everything between root and parent (shown in … popover)
  const collapsedNodes = folderPath.slice(0, -2)

  const SEP = () => (
    <i className="fa-light fa-chevron-right text-muted-foreground" aria-hidden="true"
      style={{ fontSize: 10, flexShrink: 0, margin: '0 1px' }} />
  )

  const crumbBtn = (label: string, onClick: () => void, muted = false) => (
    <Button
      variant="ghost" size="xs"
      onClick={onClick}
      className={muted ? 'text-xs text-muted-foreground font-normal' : 'text-sm font-medium text-foreground'}
      style={{ height: 24, padding: '0 4px' }}
    >
      {label}
    </Button>
  )

  const rootBtn = crumbBtn('Question Bank', () => setNavView('my'), folderPath.length > 0)

  const leafSpan = (node: FolderNode) => (
    <span className="text-sm font-medium text-foreground" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
      {node.isCourse ? courseFolderLabel(node.name) : node.name}
    </span>
  )

  if (folderPath.length === 0) {
    return <span className="text-sm font-medium text-foreground">Question Bank</span>
  }

  if (folderPath.length === 1) {
    // Question Bank > Root (root IS the leaf)
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {rootBtn}<SEP />{leafSpan(last!)}
      </div>
    )
  }

  if (folderPath.length === 2) {
    // Question Bank > Parent > Leaf — show both, no ellipsis needed
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
        {rootBtn}
        <SEP />
        {crumbBtn(parent!.isCourse ? courseFolderLabel(parent!.name) : parent!.name, () => navigateToFolder(parent!.id), true)}
        <SEP />
        {leafSpan(last!)}
      </div>
    )
  }

  // 3+ levels: Question Bank > … > Parent > Leaf
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
      {rootBtn}
      <SEP />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost" size="xs"
            aria-label="Show parent folders"
            className="text-sm text-muted-foreground"
            style={{ height: 24, padding: '0 4px', flexShrink: 0 }}
          >
            …
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider" style={{ padding: '4px 8px 6px' }}>
            Parent folders
          </div>
          {collapsedNodes.map(node => (
            <Button
              key={node.id}
              variant="ghost"
              size="sm"
              onClick={() => navigateToFolder(node.id)}
              className="w-full justify-start gap-2 text-sm text-foreground font-normal h-auto py-1.5 px-2"
            >
              <i className={`fa-light ${node.isCourse ? 'fa-graduation-cap' : 'fa-folder'}`} aria-hidden="true" style={{ fontSize: 12, width: 14, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {node.isCourse ? courseFolderLabel(node.name) : node.name}
              </span>
            </Button>
          ))}
        </PopoverContent>
      </Popover>
      <SEP />
      {crumbBtn(parent!.isCourse ? courseFolderLabel(parent!.name) : parent!.name, () => navigateToFolder(parent!.id), true)}
      <SEP />
      {leafSpan(last!)}
    </div>
  )
}

export function QBHeader() {
  const { currentPersona, setCurrentPersona, personas } = useQB()
  const { toggleSidebar, state: sidebarState } = useSidebar()

  return (
    <header style={{
      height: 44,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px',
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'var(--background)',
      flexShrink: 0,
      gap: 8,
    }}>
      {/* Left: sidebar toggle + breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              aria-label={sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}
              className={sidebarState !== 'collapsed' ? 'text-foreground' : 'text-muted-foreground'}
              style={{ flexShrink: 0 }}
            >
              <i className="fa-light fa-sidebar" aria-hidden="true" style={{ fontSize: 16 }} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}</TooltipContent>
        </Tooltip>

        <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} />

        <QBBreadcrumb />
      </div>

      {/* Right: persona switcher + Ask Leo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-8 px-2" aria-label="Switch persona">
              <Avatar style={{ width: 24, height: 24 }}>
                <AvatarFallback className="text-[9px] font-bold" style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)' }}>
                  {currentPersona.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{currentPersona.name}</span>
              <Badge variant="secondary" className="rounded text-[10px]">{getRoleLabel(currentPersona.role)}</Badge>
              <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted-foreground)' }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch Persona</DropdownMenuLabel>
            {personas.map((p: Persona) => (
              <DropdownMenuItem key={p.id} onClick={() => setCurrentPersona(p)}>
                <Avatar style={{ width: 24, height: 24 }}>
                  <AvatarFallback style={{ backgroundColor: 'var(--avatar-initials-bg)', color: 'var(--avatar-initials-fg)', fontSize: 9, fontWeight: 700 }}>
                    {p.initials}
                  </AvatarFallback>
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{getRoleLabel(p.role)}</div>
                </div>
                {p.id === currentPersona.id && (
                  <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 11, color: 'var(--brand-color)' }} />
                )}
              </DropdownMenuItem>
            ))}
            <div style={{ margin: '4px 12px 4px', padding: '8px 0 0', borderTop: '1px solid var(--border)' }}>
              <p className="text-xs text-muted-foreground">
                Trust level determines auto-approval behavior for new questions.
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium" aria-label="Ask Leo AI">
          <i className="fa-duotone fa-solid fa-star-christmas text-xs" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
          Ask Leo
        </Button>
      </div>
    </header>
  )
}
