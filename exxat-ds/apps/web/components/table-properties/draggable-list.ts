import * as React from "react"

export interface DraggableListHandle {
  dragId: string | null
  overId: string | null
  getItemProps: (id: string) => {
    draggable: true
    onDragStart: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: (e: React.DragEvent) => void
    onDragEnd: () => void
    "data-dragging": boolean
    "data-over": boolean
  }
}

export function useDraggableList<T>(
  items: T[],
  getId: (item: T) => string,
  onReorder: (newItems: T[]) => void,
): DraggableListHandle {
  const [dragId, setDragId] = React.useState<string | null>(null)
  const [overId, setOverId] = React.useState<string | null>(null)

  function getItemProps(id: string) {
    return {
      draggable: true as const,
      onDragStart: (e: React.DragEvent) => { e.dataTransfer.effectAllowed = "move"; setDragId(id) },
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOverId(id) },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        if (!dragId || dragId === id) { setDragId(null); setOverId(null); return }
        const from = items.findIndex(i => getId(i) === dragId)
        const to   = items.findIndex(i => getId(i) === id)
        if (from === -1 || to === -1) { setDragId(null); setOverId(null); return }
        const next = [...items]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        onReorder(next)
        setDragId(null); setOverId(null)
      },
      onDragEnd: () => { setDragId(null); setOverId(null) },
      "data-dragging": dragId === id,
      "data-over": overId === id && dragId !== id,
    }
  }

  return { dragId, overId, getItemProps }
}
