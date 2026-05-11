'use client'
import { useQB } from './qb-state'
import {
  Button, Badge, useSidebar,
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator,
  Popover, PopoverTrigger, PopoverContent,
  Tip,
  Avatar, AvatarFallback,
} from '@exxat/ds/packages/ui/src'
import type { FolderNode, Persona } from '@/lib/qb-types'
import { PERSONAS as GLOBAL_PERSONAS } from '@/lib/personas'

function institutionalRoleOf(qbPersonaId: string): 'admin' | 'faculty' {
  return GLOBAL_PERSONAS.find(g => g.id === qbPersonaId)?.role ?? 'faculty'
}

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
      className={muted ? 'text-sm text-muted-foreground font-normal' : 'text-sm font-medium text-foreground'}
      style={{ height: 24, padding: '0 4px' }}
    >
      {label}
    </Button>
  )

  const rootBtn = crumbBtn('Question Bank', () => setNavView('my'), folderPath.length > 0)

  const leafSpan = (node: FolderNode) => {
    const label = node.isCourse ? courseFolderLabel(node.name) : node.name
    return (
      <span className="text-sm font-medium text-foreground" title={label} style={{ whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'ellipsis', maxWidth: 200 }}>
        {label}
      </span>
    )
  }

  if (folderPath.length === 0) {
    return <span className="text-sm font-medium text-foreground">Question Bank</span>
  }

  if (folderPath.length === 1) {
    // Question Bank > Root (root IS the leaf)
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <span className="qb-crumb-root-seg">{rootBtn}<SEP /></span>
        {leafSpan(last!)}
      </div>
    )
  }

  if (folderPath.length === 2) {
    // Question Bank > Parent > Leaf — show both, no ellipsis needed
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
        <span className="qb-crumb-root-seg">{rootBtn}<SEP /></span>
        {crumbBtn(parent!.isCourse ? courseFolderLabel(parent!.name) : parent!.name, () => navigateToFolder(parent!.id), true)}
        <SEP />
        {leafSpan(last!)}
      </div>
    )
  }

  // 3+ levels: Question Bank > … > Parent > Leaf
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
      <span className="qb-crumb-root-seg">{rootBtn}<SEP /></span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost" size="xs"
            aria-label="Show parent folders"
            className="text-sm text-muted-foreground"
            style={{ height: 24, padding: '0 4px', flexShrink: 0 }}
          >
            …
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Parent folders
          </DropdownMenuLabel>
          {collapsedNodes.map(node => (
            <DropdownMenuItem
              key={node.id}
              onSelect={() => navigateToFolder(node.id)}
              className="gap-2"
            >
              <i className={`fa-light ${node.isCourse ? 'fa-graduation-cap' : 'fa-folder'}`} aria-hidden="true" style={{ fontSize: 12, width: 14, flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {node.isCourse ? courseFolderLabel(node.name) : node.name}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <SEP />
      {crumbBtn(parent!.isCourse ? courseFolderLabel(parent!.name) : parent!.name, () => navigateToFolder(parent!.id), true)}
      <SEP />
      {leafSpan(last!)}
    </div>
  )
}

export function QBHeader() {
  const { currentPersona, setCurrentPersona, personas, sidebarOpen, setSidebarOpen } = useQB()
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
        <Tip label={sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}>
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
        </Tip>

        <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} />

        {/* QB folder tree toggle — separate from the DS main nav toggle above */}
        <Tip label={sidebarOpen ? 'Close folder tree' : 'Open folder tree'}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close folder tree' : 'Open folder tree'}
            className={sidebarOpen ? 'text-foreground' : 'text-muted-foreground'}
            style={{ flexShrink: 0 }}
          >
            <i className="fa-light fa-folder-tree" aria-hidden="true" style={{ fontSize: 14 }} />
          </Button>
        </Tip>

        <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} />

        <QBBreadcrumb />
      </div>

      {/* Right: persona switcher + Ask Leo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 h-7 px-2" aria-label="Switch persona">
              <Avatar style={{ width: 24, height: 24 }}>
                <AvatarFallback className="text-[9px] font-bold" style={{ backgroundColor: 'color-mix(in oklch, var(--foreground) 8%, var(--background))', color: 'color-mix(in oklch, var(--foreground) 70%, var(--background))' }}>
                  {currentPersona.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{currentPersona.name}</span>
              <Badge
                variant="secondary"
                className="rounded text-[10px]"
                style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
              >
                {getRoleLabel(currentPersona.role)}
              </Badge>
              <i className="fa-light fa-chevron-down text-muted-foreground" aria-hidden="true" style={{ fontSize: 10 }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch Persona</DropdownMenuLabel>
            {(['admin', 'faculty'] as const).map((groupRole, gi) => {
              const groupPersonas = personas.filter(p => institutionalRoleOf(p.id) === groupRole)
              if (groupPersonas.length === 0) return null
              return (
                <div key={groupRole}>
                  {gi > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground py-1">
                    {groupRole === 'admin' ? 'Administrator' : 'Faculty'}
                  </DropdownMenuLabel>
                  {groupPersonas.map((p: Persona) => (
                    <DropdownMenuItem key={p.id} onClick={() => setCurrentPersona(p)}>
                      <Avatar style={{ width: 24, height: 24 }}>
                        <AvatarFallback className="text-[9px] font-bold" style={{ backgroundColor: 'color-mix(in oklch, var(--foreground) 8%, var(--background))', color: 'color-mix(in oklch, var(--foreground) 70%, var(--background))' }}>
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
                </div>
              )
            })}
            <div style={{ margin: '4px 12px 4px', padding: '8px 0 0', borderTop: '1px solid var(--border)' }}>
              <p className="text-xs text-muted-foreground">
                Trust level determines auto-approval behavior for new questions.
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="xs" className="gap-1.5 font-medium" aria-label="Ask Leo AI">
          <i className="fa-duotone fa-solid fa-star-christmas" style={{ fontSize: 11, color: 'var(--brand-color)' }} aria-hidden="true" />
          Ask Leo
        </Button>
      </div>
    </header>
  )
}
