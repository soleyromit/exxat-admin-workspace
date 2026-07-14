"use client"

import * as React from "react"

/** Browser online/offline — for exam-lock session alerts and similar shells. */
export function useNetworkStatus() {
  const [online, setOnline] = React.useState(
    () => (typeof navigator !== "undefined" ? navigator.onLine : true),
  )

  React.useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return { online, offline: !online }
}
