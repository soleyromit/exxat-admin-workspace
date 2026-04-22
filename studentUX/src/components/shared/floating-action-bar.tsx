"use client"

import * as React from "react"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Separator } from "../ui/separator"
import { cn } from "../ui/utils"

export interface BulkAction {
  id: string
  label: string
  icon: IconName
  variant: "default" | "secondary" | "outline" | "destructive"
  color?: string
}

interface BulkActionBarProps {
  selectedCount: number
  selectedItems: string[]
  actions?: BulkAction[]
  onClearSelection: () => void
  onBulkAction: (action: string, selectedIds: string[]) => void
  className?: string
}

// Legacy props interface for backward compatibility
interface FloatingActionBarProps {
  selectedCount: number
  selectedItems: string[]
  stage: string
  onClearSelection: () => void
  onBulkAction: (action: string, selectedItems: string[]) => void
  className?: string
}

// Default actions that can be used across different contexts
export const defaultBulkActions: BulkAction[] = [
  { id: "export", label: "Export", icon: "download", variant: "outline" },
  { id: "delete", label: "Delete", icon: "trash", variant: "destructive" },
]

// Pipeline-specific actions for each stage
export const getPipelineActionsForStage = (stage: string): BulkAction[] => {
  switch (stage) {
    case "School Request":
      return [
        { id: "approve", label: "Approve", icon: "checkCircle", variant: "default", color: "bg-chart-2 hover:bg-chart-2" },
        { id: "review", label: "Move to Review", icon: "eye", variant: "outline" },
        { id: "reject", label: "Reject", icon: "circleXmark", variant: "outline", color: "text-destructive hover:bg-destructive/10" },
        { id: "request-info", label: "Request Info", icon: "messageSquare", variant: "outline" },
        { id: "export", label: "Export", icon: "download", variant: "outline" },
      ]
    
    case "Under Review":
      return [
        { id: "approve", label: "Approve", icon: "checkCircle", variant: "default", color: "bg-chart-2 hover:bg-chart-2" },
        { id: "reject", label: "Reject", icon: "circleXmark", variant: "outline", color: "text-destructive hover:bg-destructive/10" },
        { id: "reassign", label: "Reassign Reviewer", icon: "users", variant: "outline" },
        { id: "move-stage", label: "Move Stage", icon: "arrowRight", variant: "outline" },
        { id: "export", label: "Export", icon: "download", variant: "outline" },
      ]
    
    case "Approved":
      return [
        { id: "confirm", label: "Confirm Students", icon: "userCheck", variant: "default", color: "bg-chart-2 hover:bg-chart-2" },
        { id: "revoke", label: "Revoke Approval", icon: "circleXmark", variant: "outline", color: "text-destructive hover:bg-destructive/10" },
        { id: "extend", label: "Extend Deadline", icon: "timer", variant: "outline" },
        { id: "notify", label: "Send Notification", icon: "mail", variant: "outline" },
        { id: "export", label: "Export", icon: "download", variant: "outline" },
      ]
    
    case "Confirmed Students":
      return [
        { id: "compliance", label: "Check Compliance", icon: "alertTriangle", variant: "outline", color: "text-chart-4 hover:bg-chart-4/10" },
        { id: "unenroll", label: "Unenroll", icon: "circleXmark", variant: "outline", color: "text-destructive hover:bg-destructive/10" },
        { id: "notify", label: "Send Notification", icon: "mail", variant: "outline" },
        { id: "edit", label: "Edit Details", icon: "gear", variant: "outline" },
        { id: "export", label: "Export", icon: "download", variant: "outline" },
      ]
    
    case "Rejected":
      return [
        { id: "reconsider", label: "Reconsider", icon: "eye", variant: "default" },
        { id: "archive", label: "Archive", icon: "archive", variant: "outline" },
        { id: "export", label: "Export", icon: "download", variant: "outline" },
      ]
    
    default:
      return defaultBulkActions
  }
}

// Slots page bulk actions
export const slotsBulkActions: BulkAction[] = [
  { id: "publish", label: "Publish", icon: "checkCircle", variant: "default", color: "bg-chart-2 hover:bg-chart-2" },
  { id: "unpublish", label: "Unpublish", icon: "circleXmark", variant: "secondary" },
  { id: "duplicate", label: "Duplicate", icon: "copy", variant: "outline" },
  { id: "share", label: "Share", icon: "share", variant: "outline" },
  { id: "export", label: "Export", icon: "download", variant: "outline" },
  { id: "archive", label: "Archive", icon: "archive", variant: "secondary" },
]

export function BulkActionBar({
  selectedCount,
  selectedItems,
  actions = defaultBulkActions,
  onClearSelection,
  onBulkAction,
  className = "",
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  // Show first 2 actions directly, rest in more menu
  const directActions = actions.slice(0, 2)
  const moreActions = actions.slice(2)

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4",
      className
    )}>
      <Card className="shadow-lg border-border bg-card">
        <CardContent className="p-0">
          <div className="flex items-center gap-4 px-4 py-3">
            {/* Selection info */}
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-chart-1/10 text-chip-1 border-chip-1/40">
                {selectedCount} selected
              </Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearSelection}
                    className="min-h-11 min-w-11 md:h-6 md:w-6 p-0 hover:bg-accent touch-manipulation"
                    aria-label="Clear selection"
                  >
                    <FontAwesomeIcon name="x" className="h-4 w-4" aria-hidden />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear selection</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Direct Actions */}
            <div className="flex items-center gap-2">
              {directActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant}
                  size="sm"
                  onClick={() => onBulkAction(action.id, selectedItems)}
                  className={cn("h-8", action.color)}
                >
                  <FontAwesomeIcon name={action.icon} className="h-4 w-4 mr-2" />
                  {action.label}
                </Button>
              ))}

              {/* More actions dropdown */}
              {moreActions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <FontAwesomeIcon name="gear" className="h-4 w-4 mr-2" />
                      More Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {moreActions.map((action) => (
                      <DropdownMenuItem 
                        key={action.id}
                        onClick={() => onBulkAction(action.id, selectedItems)}
                        className={action.color}
                      >
                        <FontAwesomeIcon name={action.icon} className="h-4 w-4 mr-2" />
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Legacy component for backward compatibility
export function FloatingActionBar({
  selectedCount,
  selectedItems,
  stage,
  onClearSelection,
  onBulkAction,
  className
}: FloatingActionBarProps) {
  const actions = React.useMemo(() => getPipelineActionsForStage(stage), [stage])
  
  return (
    <BulkActionBar
      selectedCount={selectedCount}
      selectedItems={selectedItems}
      actions={actions}
      onClearSelection={onClearSelection}
      onBulkAction={onBulkAction}
      className={className}
    />
  )
}