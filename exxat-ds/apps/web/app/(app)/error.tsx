"use client"

import * as React from "react"
import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Route error boundary for the signed-in app shell. Lets users retry without a full reload.
 */
export default function AppRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error)
    }
  }, [error])

  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center"
      role="alert"
    >
      <AlertCircle className="size-10 shrink-0 text-destructive" aria-hidden />
      <div className="space-y-2">
        <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {process.env.NODE_ENV === "development"
            ? error.message
            : "Please try again. If the problem continues, contact support."}
        </p>
      </div>
      <Button type="button" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  )
}
