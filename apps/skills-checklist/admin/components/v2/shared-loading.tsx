import { Skeleton } from "@exxatdesignux/ui/components/ui/skeleton"

/** Loading placeholder shown before the prototype state hydrates. Announces one busy region with a label, not the blocks. */
export function LoadingBlocks({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="flex flex-col gap-3" data-loading>
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} aria-hidden="true" className={i === 0 ? "h-8 w-1/2" : "h-16 w-full"} />
      ))}
    </div>
  )
}
