"use client"

import { useRouter } from "next/navigation"
import { useSidebar } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

export function NewPlacementBackBtn() {
  const router = useRouter()
  const { setOpen } = useSidebar()

  function handleBack() {
    setOpen(true)
    setTimeout(() => router.push("/data-list"), 220)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2"
      onClick={handleBack}
      aria-label="Back to placements list"
    >
      <i className="fa-light fa-arrow-left text-[13px]" aria-hidden="true" />
      Back
    </Button>
  )
}
