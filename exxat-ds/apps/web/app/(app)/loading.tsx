import { Skeleton } from "@/components/ui/skeleton"

/**
 * Default loading UI for app routes (sidebar chrome stays; main column shows this fallback).
 */
export default function AppRouteLoading() {
  return (
    <div
      className="flex flex-col gap-4 p-6 md:p-8"
      aria-busy="true"
      aria-label="Loading page"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full max-w-3xl" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
