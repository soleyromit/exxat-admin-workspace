'use client'
import { useQB } from './qb-state'
import {
  Button, Badge, useSidebar,
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuItem,
  Tooltip, TooltipContent, TooltipTrigger,
  Avatar, AvatarFallback,
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator,
} from '@exxat/ds/packages/ui/src'
import type { Persona, FolderNode } from '@/lib/qb-types'

export function QBHeader() {
  const { currentPersona, setCurrentPersona, personas, folders, selectedFolderId, navigateToFolder } = useQB()
  const { toggleSidebar, state: sidebarState } = useSidebar()

  function courseFolderLabel(name: string): string {
    const match = name.match(/^([A-Z0-9]+)\s/)
    if (!match) return name
    return `${match[1]} · Question Bank`
  }

  function buildPath(folderId: string | null): FolderNode[] {
    if (!folderId) return []
    const parts: FolderNode[] = []
    let cur = folders.find(f => f.id === folderId)
    while (cur) {
      parts.unshift(cur)
      cur = cur.parentId ? folders.find(f => f.id === cur!.parentId) : undefined
    }
    return parts
  }
  const breadcrumbPath = buildPath(selectedFolderId)

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleSidebar}
              aria-label={sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}
              style={{ color: sidebarState !== 'collapsed' ? 'var(--foreground)' : 'var(--muted-foreground)', flexShrink: 0 }}
            >
              <i className="fa-light fa-sidebar" aria-hidden="true" style={{ fontSize: 16 }} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{sidebarState === 'collapsed' ? 'Expand navigation' : 'Collapse navigation'}</TooltipContent>
        </Tooltip>

        <div style={{ width: 1, height: 16, background: 'var(--border)', flexShrink: 0 }} />

        {/* Breadcrumb — shown only when a folder is selected */}
        {breadcrumbPath.length > 0 && (
          <Breadcrumb style={{ minWidth: 0 }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: 0, listStyle: 'none', margin: 0, padding: 0, flexWrap: 'nowrap', overflow: 'hidden' }}>
              {breadcrumbPath.length <= 3 ? (
                breadcrumbPath.map((node, i) => (
                  <BreadcrumbItem key={node.id} style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                    {i > 0 && <BreadcrumbSeparator style={{ color: 'var(--muted-foreground)', fontSize: 10, padding: '0 4px' }}>/</BreadcrumbSeparator>}
                    <BreadcrumbLink asChild>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => navigateToFolder(node.id)}
                        style={{
                          fontSize: 12,
                          color: i === breadcrumbPath.length - 1 ? 'var(--foreground)' : 'var(--muted-foreground)',
                          fontWeight: i === breadcrumbPath.length - 1 ? 500 : 400,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160,
                          height: 'auto', padding: '2px 4px',
                        }}
                      >
                        {node.isCourse ? courseFolderLabel(node.name) : node.name}
                      </Button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                ))
              ) : (
                <>
                  <BreadcrumbItem>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => navigateToFolder(breadcrumbPath[0].id)}
                      style={{ fontSize: 12, color: 'var(--muted-foreground)', height: 'auto', padding: '2px 4px' }}
                    >
                      {breadcrumbPath[0].isCourse ? courseFolderLabel(breadcrumbPath[0].name) : breadcrumbPath[0].name}
                    </Button>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator style={{ color: 'var(--muted-foreground)', fontSize: 10, padding: '0 4px' }}>/</BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-xs" aria-label="Show more breadcrumb items" style={{ fontSize: 12 }}>
                          …
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {breadcrumbPath.slice(1, -1).map(node => (
                          <DropdownMenuItem key={node.id} onClick={() => navigateToFolder(node.id)}>
                            <i className="fa-light fa-folder" aria-hidden="true" style={{ fontSize: 11, width: 14 }} />
                            {node.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator style={{ color: 'var(--muted-foreground)', fontSize: 10, padding: '0 4px' }}>/</BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => navigateToFolder(breadcrumbPath[breadcrumbPath.length - 1].id)}
                      style={{ fontSize: 12, fontWeight: 500, color: 'var(--foreground)', height: 'auto', padding: '2px 4px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {breadcrumbPath[breadcrumbPath.length - 1].name}
                    </Button>
                  </BreadcrumbItem>
                </>
              )}
            </ol>
          </Breadcrumb>
        )}
      </div>

      {/* Right: persona switcher + Ask Leo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Persona switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 h-8 px-2"
              aria-label="Switch persona"
            >
              <Avatar style={{ width: 24, height: 24 }}>
                <AvatarFallback style={{ backgroundColor: currentPersona.color, color: 'var(--primary-foreground)', fontSize: 9, fontWeight: 700 }}>
                  {currentPersona.initials}
                </AvatarFallback>
              </Avatar>
              <span style={{ fontSize: 12, fontWeight: 500 }}>
                {currentPersona.name}
              </span>
              <Badge variant="secondary" className="rounded" style={{ fontSize: 10 }}>
                {currentPersona.role}
              </Badge>
              <i className="fa-light fa-chevron-down" aria-hidden="true"
                style={{ fontSize: 10, color: 'var(--muted-foreground)' }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Switch Persona</DropdownMenuLabel>
            {personas.map(p => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => setCurrentPersona(p)}
              >
                <Avatar style={{ width: 24, height: 24 }}>
                  <AvatarFallback style={{ backgroundColor: p.color, color: 'var(--primary-foreground)', fontSize: 9, fontWeight: 700 }}>
                    {p.initials}
                  </AvatarFallback>
                </Avatar>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{p.role}</div>
                </div>
                {p.id === currentPersona.id && (
                  <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 11, color: 'var(--brand-color)' }} />
                )}
              </DropdownMenuItem>
            ))}
            <div style={{ margin: '4px 12px 4px', padding: '8px 0 0', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
                Trust level determines auto-approval behavior for new questions.
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Ask Leo — outline sm, star-christmas icon, brand-color */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs font-medium"
          aria-label="Ask Leo AI"
        >
          <i className="fa-duotone fa-solid fa-star-christmas text-xs" style={{ color: 'var(--brand-color)' }} aria-hidden="true" />
          Ask Leo
        </Button>
      </div>
    </header>
  )
}
