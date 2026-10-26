"use client"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tip } from "@/components/ui/tip"

export function DialogPreview() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Open dialog
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>Short blocking confirmation copy.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export function AlertDialogPreview() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Confirm action
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archive pattern?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the pattern from the active catalog view.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Archive</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function PopoverPreview() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Open popover
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <p className="text-sm text-muted-foreground">Anchored non-modal surface.</p>
      </PopoverContent>
    </Popover>
  )
}

export function HoverCardPreview() {
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <Button type="button" variant="link" className="h-auto p-0">
          Hover for preview
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-64">
        <p className="text-sm">Row identity preview content.</p>
      </HoverCardContent>
    </HoverCard>
  )
}

export function DropdownMenuPreview() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ContextMenuPreview() {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-20 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
        Right-click here
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Open</ContextMenuItem>
        <ContextMenuItem>Duplicate</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export function TipPreview() {
  return (
    <Tip label="Icon-only control needs a tip" side="top">
      <Button type="button" size="icon-sm" variant="outline" aria-label="Info">
        <i className="fa-light fa-circle-info" aria-hidden="true" />
      </Button>
    </Tip>
  )
}

export function TooltipPreview() {
  return (
    <Tip label="Prefer Tip in product code" side="top">
      <Button type="button" variant="outline" size="sm">
        Hover me
      </Button>
    </Tip>
  )
}
