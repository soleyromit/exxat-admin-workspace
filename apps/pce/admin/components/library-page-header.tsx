"use client"

import * as React from "react"
import {
  PageHeader,
  type PageHeaderActionItem,
  type PageHeaderCollaborator,
  type PageHeaderVariant,
} from "@/components/page-header"
import { useAltKeyLabel, useModKeyLabel } from "@/hooks/use-mod-key-label"
import { COLLABORATION_HEADER_ADD_LABEL } from "@/lib/collaborator-access"
import { splitLibraryCourseFolderTitle } from "@/lib/library-nav"
import { LIBRARY_HEADER_COLLABORATORS } from "@/lib/mock/library-header-collaborators"

export interface LibraryPageHeaderProps {
  /** Scoped hub title (All / My / folder name) — keep in sync with `SiteHeader`. */
  title: string
  questionCount: number
  onNewQuestion: () => void
  onExport: () => void
  /** Omitted on surfaces without a metric strip (e.g. dedicated search). */
  showMetrics?: boolean
  onToggleMetrics?: () => void
  /** `collaboration` adds access line + collaborator face row before CTAs. */
  variant?: PageHeaderVariant
  /** Optional role / access row when `variant="collaboration"` (badge + copy). */
  accessInfo?: React.ReactNode
  collaborators?: PageHeaderCollaborator[]
  collaboratorDisplayLimit?: number
  onAddCollaborator?: () => void
  onCollaboratorsOpen?: () => void
  /** Empty-roster header CTA — default **Add collaborator**. */
  collaborationAddLabel?: string
  addCollaboratorLabel?: string
  /** Replaces the default “N questions · Last updated…” subtitle when set. */
  subtitleOverride?: string
  /** Dedicated search omits the primary New question CTA. */
  surface?: "hub" | "dedicated-search"
  /**
   * When provided, the **More** menu includes **Customize folder** (opens the hub folder sheet).
   * Wire this when the library is scoped to a folder (`?scope=folder&folderId=…`).
   */
  onCustomizeFolder?: () => void
}

export function LibraryPageHeader({
  title,
  questionCount,
  onNewQuestion,
  onExport,
  showMetrics,
  onToggleMetrics,
  variant = "default",
  accessInfo,
  collaborators = LIBRARY_HEADER_COLLABORATORS,
  collaboratorDisplayLimit = 3,
  onAddCollaborator = () => {},
  onCollaboratorsOpen,
  collaborationAddLabel = COLLABORATION_HEADER_ADD_LABEL,
  addCollaboratorLabel = "Invite people",
  subtitleOverride,
  surface = "hub",
  onCustomizeFolder,
}: LibraryPageHeaderProps) {
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()
  const newShortcut = `${mod}${alt}N`
  const exportShortcut = `${mod}${alt}E`
  const metricsShortcut = `${mod}${alt}H`
  const { courseCode, title: displayTitle } = splitLibraryCourseFolderTitle(title)
  const countLine =
    subtitleOverride ??
    `${questionCount} ${questionCount === 1 ? "question" : "questions"} · Last updated now`
  const displaySubtitle = courseCode ? `${courseCode} · ${countLine}` : countLine
  const resolvedAccess = variant === "collaboration" ? accessInfo : undefined
  const showNewQuestion = surface === "hub"

  const actionItems = React.useMemo((): PageHeaderActionItem[] => {
    const items: PageHeaderActionItem[] = []
    if (showNewQuestion) {
      items.push({
        id: "new-question",
        label: "New question",
        icon: "fa-plus",
        variant: "default",
        shortcut: newShortcut,
        onSelect: onNewQuestion,
      })
    }
    if (variant === "collaboration") {
      items.push({
        id: "invite-people",
        label: addCollaboratorLabel,
        icon: "fa-user-plus",
        variant: "outline",
        onSelect: onAddCollaborator,
      })
    }
    if (onCustomizeFolder) {
      items.push({
        id: "customize-folder",
        label: "Customize folder",
        icon: "fa-wand-magic-sparkles",
        variant: "outline",
        onSelect: onCustomizeFolder,
      })
    }
    items.push({
      id: "export",
      label: "Export",
      icon: "fa-arrow-down-to-line",
      variant: "outline",
      shortcut: exportShortcut,
      onSelect: onExport,
    })
    if (onToggleMetrics != null) {
      items.push({
        id: "toggle-metrics",
        label: (showMetrics ?? false) ? "Hide metric section" : "Show metric section",
        icon: (showMetrics ?? false) ? "fa-eye-slash" : "fa-eye",
        variant: "outline",
        shortcut: metricsShortcut,
        onSelect: onToggleMetrics,
      })
    }
    return items
  }, [
    showNewQuestion,
    newShortcut,
    onNewQuestion,
    variant,
    addCollaboratorLabel,
    onAddCollaborator,
    onCustomizeFolder,
    exportShortcut,
    onExport,
    onToggleMetrics,
    showMetrics,
    metricsShortcut,
  ])

  return (
    <PageHeader
      title={displayTitle}
      subtitle={displaySubtitle}
      variant={variant}
      accessInfo={resolvedAccess}
      collaborators={variant === "collaboration" ? collaborators : undefined}
      collaboratorDisplayLimit={collaboratorDisplayLimit}
      onCollaboratorsOpen={onCollaboratorsOpen ?? onAddCollaborator}
      addCollaboratorLabel={collaborationAddLabel}
      actionItems={actionItems}
    />
  )
}
