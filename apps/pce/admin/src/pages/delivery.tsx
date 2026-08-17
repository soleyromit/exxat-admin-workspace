import { Suspense } from "react"

import { DeliveryTrackerClient } from "@/components/delivery-tracker-client"

/** `/design-os/delivery` — package inventory vs UI delivery overlay. */
export default function DeliveryPage() {
  return (
    <Suspense fallback={null}>
      <DeliveryTrackerClient />
    </Suspense>
  )
}
